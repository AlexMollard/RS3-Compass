// Generates src/equipmentImported.ts from the RuneScape Wiki's equipment categories and each item page.
// Run locally: node --experimental-strip-types scripts/import-equipment.mjs
// Prints one review line per item (name, class, slot, tier, wear, route kind) and the items with no route.
// Exclusions and routes the Wiki data can't give go in src/equipmentCuration.ts so they survive re-imports.
import { writeFileSync } from "node:fs";
import { EQUIPMENT_CURATION, routeFor } from "../src/equipmentCuration.ts";
import { classifyRoute, parseItem } from "./equipmentWikitext.mjs";
import { createWikiApi } from "./wikiApi.mjs";
import { canonicalSkillName } from "../src/skillNames.ts";

const USER_AGENT = "RS3 Compass equipment import (https://github.com/AlexMollard/RS3-Compass)";
const { bucketRows, categoryMembers, pageContents, servedFiles } = createWikiApi(USER_AGENT);
const OUT = new URL("../src/equipmentImported.ts", import.meta.url);

const CLASS_CATEGORIES = [
  "Melee weapons",
  "Melee armour",
  "Ranged weapons",
  "Ranged armour",
  "Magic weapons",
  "Magic armour",
  "Necromancy weapons",
  "Necromancy armour",
];
// Tools for the skills with a tool guide (Mining, Woodcutting, Archaeology).
const TOOL_CATEGORIES = { Pickaxes: "pickaxe", Hatchets: "hatchet", Mattocks: "mattock" };
// Wiki slots that map to a gear row; "main hand" and "torso" are spellings of weapon and body.
const SLOTS = {
  "2h": "2h",
  weapon: "weapon",
  "main hand": "weapon",
  "off-hand weapon": "off-hand weapon",
  "off-hand": "off-hand",
  head: "head",
  body: "body",
  torso: "body",
  legs: "legs",
  hands: "hands",
  feet: "feet",
};

const fail = (title, names) => {
  console.error(`${title} (${names.length}):\n  ${names.join("\n  ")}`);
  process.exitCode = 1;
};

// 1. Item names: every member of the class and tool categories, less the excluded categories and names.
const tools = new Map();
const names = new Set();
for (const category of [...CLASS_CATEGORIES, ...Object.keys(TOOL_CATEGORIES)]) {
  const members = await categoryMembers(category);
  if (!members.length) throw new Error(`Category:${category} is empty or missing`);
  for (const name of members) {
    names.add(name);
    if (TOOL_CATEGORIES[category] && !tools.has(name)) tools.set(name, TOOL_CATEGORIES[category]);
  }
}
const excluded = new Set(EQUIPMENT_CURATION.exclude);
for (const category of Object.keys(EQUIPMENT_CURATION.excludeCategories))
  for (const name of await categoryMembers(category)) excluded.add(name);

// 2. Item facts from each page, in the gear slots only.
const contents = await pageContents([...names].filter((n) => !excluded.has(n)));
const parsed = [];
const invalid = [];
for (const name of [...names].sort((a, b) => a.localeCompare(b))) {
  if (excluded.has(name)) continue;
  const page = contents.get(name);
  if (!page) {
    invalid.push(`${name}: no page`);
    continue;
  }
  const item = parseItem(name, page);
  if (!item || (item.slot && !SLOTS[item.slot])) continue;
  const problems = [
    !item.slot && "no slot",
    !item.class && "no class",
    item.tier === undefined && "no tier",
    !item.wear && "no requirements field",
  ].filter(Boolean);
  if (problems.length) invalid.push(`${name}: ${problems.join(", ")}`);
  else parsed.push({ ...item, slot: SLOTS[item.slot], ...(tools.has(name) ? { tool: tools.get(name) } : {}) });
}
if (invalid.length) fail("Items with missing facts: exclude them in src/equipmentCuration.ts with a reason", invalid);

// Variants ("Torva platebody (broken)", "Sunspear (melee)", "Augmented masterwork magic robe top") count as
// their base item when it is imported too. Necromancy weapons are named "(tier N)" and are separate items.
const parsedNames = new Set(parsed.map((i) => i.name.toLowerCase()));
const baseOf = (name) => {
  const m = name.match(/^(.*) \(([^)]+)\)$/);
  const base = m && !/^tier \d+$/.test(m[2]) ? m[1] : name.match(/^Augmented (.*)$/)?.[1];
  return base && parsedNames.has(base.toLowerCase()) ? base : undefined;
};
const items = parsed.filter((i) => !baseOf(i.name));

// 3. Routes from the Wiki's Bucket data: recipes, shops and drops, following recipe materials down the chain.
const facts = { recipes: new Map(), stores: new Map(), drops: new Map() };
const push = (map, key, value) => map.set(key, [...(map.get(key) ?? []), value]);
const fetched = new Set();
let frontier = items.map((i) => i.name);
for (let depth = 0; frontier.length && depth < 6; depth++) {
  for (const n of frontier) fetched.add(n);
  const wanted = new Set(frontier);
  const materials = new Set();
  for (const r of await bucketRows("recipe", ["page_name", "uses_material", "uses_skill"], "production_output", frontier))
    for (const output of r.production_output ?? [])
      if (wanted.has(output)) {
        // Some recipes name the skill in lower case ("smithing").
        push(facts.recipes, output, {
          materials: r.uses_material ?? [],
          skills: (r.uses_skill ?? []).map((s) => canonicalSkillName(s) ?? s),
        });
        for (const m of r.uses_material ?? []) materials.add(m);
      }
  for (const s of await bucketRows("storeline", ["page_name", "store_currency", "is_historical"], "sold_item", frontier))
    if (!s.is_historical)
      push(facts.stores, s.sold_item, { page: s.page_name, currency: (s.store_currency ?? []).map((c) => c.toLowerCase()) });
  for (const d of await bucketRows("dropsline", ["page_name", "drop_json", "rare_drop_table"], "item_name", frontier)) {
    // The rare drop table is shared by many monsters: it doesn't make an item a boss drop. Historical drops are gone.
    if (d.rare_drop_table || /historical/i.test(d.page_name)) continue;
    const drop = JSON.parse(d.drop_json);
    push(facts.drops, d.item_name, { page: d.page_name, rarity: drop.Rarity, types: drop["Drop type"] ?? [] });
  }
  frontier = [...materials].filter((m) => !fetched.has(m));
}
for (const item of items) {
  const route = classifyRoute(item, facts);
  if (route) item.route = route;
}

// 4. Art: the file each infobox names, resolved through Wiki file redirects.
const images = await servedFiles(items.map((i) => i.image).filter(Boolean));
const records = items.map(({ image, ...item }) => {
  const served = image && images.get(image);
  return { name: item.name, wiki: item.wiki, ...(served ? { image: served } : {}), ...item };
});

const today = new Date().toLocaleDateString("en-CA"); // the local date, as YYYY-MM-DD
const source = `// Generated by scripts/import-equipment.mjs on ${today}. Do not edit by hand: rerun the script.
// Source: RuneScape Wiki (CC BY-NC-SA 3.0) — the equipment and tool categories, each item page, and the
// recipe, shop and drop Bucket tables.
import type { ImportedItem } from "./equipmentTypes";

// Each entry goes through item() so TypeScript checks it as an ImportedItem without building a union of
// thousands of literal types ("Expression produces a union type that is too complex to represent").
const item = (i: ImportedItem) => i;

export const EQUIPMENT_IMPORTED: ImportedItem[] = [
${records.map((r) => `  item(${JSON.stringify(r)})`).join(",\n")}
];
`;
if (!process.exitCode) writeFileSync(OUT, source.replace(/\r?\n/g, "\r\n"));

const wear = (i) => i.wear.map((w) => `${w.skill} ${w.level}`).join(" + ") || "none";
console.log(records.map((i) => `${i.name} | ${i.tool ?? i.class} | ${i.slot} | tier ${i.tier} | ${wear(i)} | ${routeFor(i).kind}`).join("\n"));
const kinds = {};
for (const i of records) kinds[routeFor(i).kind] = (kinds[routeFor(i).kind] ?? 0) + 1;
console.log(`Imported ${records.length} items (${parsed.length - items.length} variants folded into their base). Routes:`, kinds);
const unknown = records.filter((i) => routeFor(i).kind === "unknown");
const groups = {};
for (const i of unknown) (groups[`${i.tool ?? i.class} ${i.slot}`] ??= []).push(i.name);
console.log(`Unknown routes (${unknown.length}):`);
for (const [group, list] of Object.entries(groups).sort()) console.log(`  ${group} (${list.length}): ${list.join(", ")}`);
