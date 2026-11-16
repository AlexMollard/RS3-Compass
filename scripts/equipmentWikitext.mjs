// Pure wikitext helpers for the equipment importer; tested in tests/equipment-import.test.mjs.
import { templateParams } from "./questWikitext.mjs";
import { fileName } from "./wikiApi.mjs";
import { canonicalSkillName } from "../src/skillNames.ts";

const CLASSES = ["melee", "ranged", "magic", "necromancy", "none"];
const ARMOUR_TYPES = ["power", "tank", "hybrid"];

/**
 * The skill levels in a requirements field: "{{sc|attack|80}}{{sc|strength|80}}", "{{Skill clickpic|Attack|80}}"
 * (any case) or the level before the template, "60 {{Skill clickpic|Attack}}". A template naming no known skill
 * is never dropped silently: its raw text goes into `unknown` for the importer to reject.
 */
export function parseRequirements(text = "", unknown = []) {
  const wear = [];
  const template = /(?:(\d+)\s*)?\{\{\s*(?:sc|skill[ _]clickpic)\s*\|\s*([^|}]+?)\s*(?:\|\s*(\d+)[^}]*)?\}\}/gi;
  for (const m of text.matchAll(template)) {
    const skill = canonicalSkillName(m[2]);
    const level = m[3] ?? m[1];
    if (!skill) unknown.push(m[0].trim());
    else if (level) wear.push({ skill, level: Number(level) });
  }
  return wear;
}

/** Version 1's value of a field: field1 if present, else the unnumbered field. */
const field = (params, key) => {
  const value = params?.[key + "1"] ?? params?.[key];
  return value === undefined || value === "" ? undefined : value;
};
const yes = (value) => /^yes$/i.test(value ?? "");

/** An equipment item from its Wiki page, or undefined when the page has no {{Infobox Bonuses}}. */
export function parseItem(name, wikitext) {
  const bonuses = templateParams(wikitext, "Infobox Bonuses");
  if (!bonuses) return undefined;
  const info = templateParams(wikitext, "Infobox Item");
  const recipe = templateParams(wikitext, "Infobox Recipe");
  const image = field(info, "image")?.match(/\[\[\s*(?:File|Image):([^\]|]+)/i)?.[1];
  // No guessed defaults: a missing or unrecognised class, slot or tier stays undefined for the importer to reject.
  const className = (field(bonuses, "class") ?? "").toLowerCase();
  const type = (field(bonuses, "type") ?? "").toLowerCase();
  const tierText = field(bonuses, "tier");
  const tier = tierText !== undefined && /^\d+$/.test(tierText.trim()) ? Number(tierText) : undefined;
  const skill = canonicalSkillName(recipe?.skill1 ?? "");
  const skillLevel = Number(recipe?.skill1lvl);
  // "requirements = None" (Bronze full helm) or an empty field means no requirement: []. An absent field stays undefined.
  const requirements = bonuses.requirements1 ?? bonuses.requirements;
  const unknownSkills = [];
  const wear = requirements === undefined ? undefined : parseRequirements(requirements, unknownSkills);
  return {
    name,
    wiki: name,
    ...(image ? { image: fileName(image) } : {}),
    slot: field(bonuses, "slot")?.toLowerCase(),
    class: CLASSES.includes(className) ? className : undefined,
    tier,
    ...(ARMOUR_TYPES.includes(type) ? { armourType: type } : {}),
    wear,
    members: yes(field(info, "members")),
    tradeable: yes(field(info, "tradeable")),
    ...(skill && Number.isFinite(skillLevel) ? { recipe: { skill, level: skillLevel } } : {}),
    // Requirement templates that name no known skill; the importer rejects the item rather than drop them.
    ...(unknownSkills.length ? { unknownSkills } : {}),
  };
}

/**
 * A drop rarity as "common" or "rare", using Module:DropsLine's bands: Always, Common and Uncommon
 * (at least 1/64) are common; Rare and Very rare (below 1/64) are rare. Varies, Random and Unknown (Telos's
 * uniques) are "varies". Other text (Once: a quest's one-off reward) is undefined.
 */
export function rarityBand(text) {
  const t = String(text ?? "").trim().toLowerCase();
  if (["always", "common", "uncommon"].includes(t)) return "common";
  if (["rare", "very rare"].includes(t)) return "rare";
  if (["varies", "random", "unknown"].includes(t)) return "varies";
  const m = t.replaceAll(",", "").match(/([\d.]+)\s*\/\s*([\d.]+)/);
  const value = m ? Number(m[1]) / Number(m[2]) : NaN;
  if (!(value > 0)) return undefined;
  return value >= 1 / 64 ? "common" : "rare";
}

const CRAFT_SKILLS = ["Crafting", "Fletching", "Runecrafting", "Necromancy"];
const recipeKind = (skill) => (skill === "Smithing" ? "smith" : CRAFT_SKILLS.includes(skill) ? "craft" : undefined);
const list = (pages) => [...new Set(pages.map((p) => p.replace(/#.*$/, "")))].slice(0, 3).join(", ");

// Drop types (drop_json "Drop type") that never count: Squeal of Fortune and Treasure Hunter promotions.
const PROMOTIONS = ["sof", "th"];
// A "reward" drop comes out of a container or a reward roll (a clue casket, Raptor's chest of slaying, a holiday
// present), not off a monster. It is never a common drop, and it is ignored when deciding whether a material is
// rare-only (Lucky Charm from the Temple of Aminishi gives Tetsu kits at 25/1,000, though they are rare boss drops).
const CONTAINERS = [...PROMOTIONS, "reward"];

/**
 * Whether a drop source's own page marks it as gone or a promotion: a page-top {{Currently unobtainable item}},
 * {{Discontinued content}}, {{Discontinued item}} or {{Removed content}} banner, a microtransaction page
 * ({{R2Rbox/mtx}}, "restriction = th"), or an event page ({{Infobox Event}}: Balthazar's Big Raffle,
 * Frank's Free Chest, a Halloween event). Banners further down (a section about a removed reward) don't count.
 */
export function goneSource(wikitext = "") {
  const lead = wikitext.split(/\{\{\s*Infobox/i)[0];
  return (
    /\{\{\s*(Currently unobtainable|Discontinued|Removed content|R2Rbox\/mtx)/i.test(lead) ||
    /\{\{\s*Infobox Event\b/i.test(wikitext) ||
    /\|\s*restriction\s*=\s*(th|sof)\s*[|}\n]/i.test(wikitext)
  );
}

/**
 * The pages that drop `name`, split by rarityBand, skipping drops of the `ignored` types. A drop from a boss is
 * rare at any rate (Queen Black Dragon's royal crossbow parts are about 1/51), and counts even when the Wiki
 * types it as a reward (Croesus, The Barrows: Rise of the Six). Other reward drops (containers) go in
 * `reward` (a common roll) or `rewardRare`, unless their source is in `facts.gone` (see goneSource).
 */
function dropBands(name, facts, ignored = PROMOTIONS) {
  const bands = { common: [], rare: [], varies: [], reward: [], rewardRare: [] };
  for (const d of facts.drops.get(name) ?? []) {
    const band = rarityBand(d.rarity);
    const types = d.types ?? [];
    if (!band || types.some((t) => PROMOTIONS.includes(t))) continue;
    if (isBossPage(d.page, facts)) bands.rare.push(d.page);
    else if (types.some((t) => ignored.includes(t))) continue;
    else if (types.includes("reward")) {
      if (!facts.gone?.has(d.page.replace(/#.*$/, ""))) bands[band === "common" ? "reward" : "rewardRare"].push(d.page);
    } else bands[band].push(d.page);
  }
  return bands;
}

/**
 * A boss's page, or its loot page ("Zemouregal & Vorkath loot (normal)"): `facts.bosses` holds boss names,
 * matched on the page name without its #section, alone or followed by a space.
 */
function isBossPage(page, facts) {
  const name = page.replace(/#.*$/, "");
  if (!facts.bosses) return false;
  if (facts.bosses.has(name)) return true;
  for (let i = name.indexOf(" "); i !== -1; i = name.indexOf(" ", i + 1))
    if (facts.bosses.has(name.slice(0, i))) return true;
  return false;
}
const coinStores = (name, facts) => (facts.stores.get(name) ?? []).filter((s) => s.currency.includes("coins"));

// No way out: a recipe chain that loops back on itself (Divination swaps: Obsidian blade + energy → Magma core,
// Magma core + energy → Obsidian blade) or that runs past what the importer fetched (`facts.unresolved`).
// Such a recipe is never an ungated path, but it isn't a drop source either.
const BLOCKED = Object.freeze({ blocked: true });

/**
 * The rare drop that `name` can only come from, if any: a material with a rare (or varying-rate, or boss)
 * drop, no common drop, no coin shop and no recipe that avoids a rare drop. Basic materials (ores, logs: no
 * recipe, no drop) are not gated. BLOCKED when every recipe loops or is unresolved and there is no drop.
 */
function rareGate(name, facts, seen = new Set()) {
  if (seen.has(name) || facts.unresolved?.has(name)) return BLOCKED;
  seen.add(name);
  if (coinStores(name, facts).length) return undefined;
  const own = dropBands(name, facts, CONTAINERS);
  if (own.common.length) return undefined;
  const recipes = facts.recipes.get(name) ?? [];
  let gate;
  for (const r of recipes) {
    const results = r.materials.map((m) => rareGate(m, facts, new Set(seen)));
    if (results.every((g) => !g)) return undefined;
    gate ??= results.find((g) => g?.material);
  }
  const sources = [...own.rare, ...own.varies];
  if (gate) return gate;
  if (sources.length) return { material: name, sources };
  return recipes.length ? BLOCKED : undefined;
}

/**
 * How to get an item, from Wiki facts alone:
 * 1. a Smithing or crafting recipe whose chain never needs a rare-only drop → smith / craft;
 * 2. a coin shop → shop; another currency's shop → reward;
 * 3. a common drop of the item → common-drop; a rare drop of it → rare-drop;
 * 4. a container (a "reward" drop) still obtainable: Rare or Very rare in it → rare-drop, else → reward.
 *    A rare direct drop wins over a container's common roll: Raptor's chest of slaying gives the Wyvern crossbow
 *    at 1/50, but opening it needs a key built from four 1/256 Slayer drops;
 * 5. a rare drop of a recipe material → rare-drop.
 * Undefined when none of these apply. `facts` maps names to recipes ({ materials, skills }),
 * stores ({ page, currency }) and drops ({ page, rarity, types }); `bosses` is a Set of boss page names,
 * `gone` a Set of container pages that are unobtainable or promotional, and `unresolved` a Set of materials
 * the importer didn't fetch.
 */
export function classifyRoute(item, facts) {
  const recipes = facts.recipes.get(item.name) ?? [];
  const members = item.members;
  for (const r of recipes) {
    const kind = recipeKind(r.skills[0]);
    if (!kind || r.materials.some((m) => rareGate(m, facts))) continue;
    const level = item.recipe?.skill === r.skills[0] ? item.recipe.level : undefined;
    const levels = level ? [{ skill: r.skills[0], level }] : [];
    const note = `${kind === "smith" ? "Smithed" : "Made"} with ${r.skills[0]}${level ? " " + level : ""}.`;
    return { kind, note, levels, members };
  }
  const coins = coinStores(item.name, facts);
  if (coins.length) return { kind: "shop", note: `Sold at ${list(coins.map((s) => s.page))}.`, members };
  const other = facts.stores.get(item.name) ?? [];
  if (other.length)
    return { kind: "reward", note: `Bought with ${other[0].currency.join(" or ")} at ${list(other.map((s) => s.page))}.`, members };
  const own = dropBands(item.name, facts);
  if (own.common.length) return { kind: "common-drop", note: `Dropped by ${list(own.common)}.`, members };
  if (own.rare.length) return { kind: "rare-drop", note: `Rare drop from ${list(own.rare)}.`, members };
  if (own.varies.length) return { kind: "rare-drop", note: `Dropped by ${list(own.varies)} (the rate varies).`, members };
  if (own.reward.length) return { kind: "reward", note: `Found in ${list(own.reward)}.`, members };
  if (own.rewardRare.length) return { kind: "rare-drop", note: `A rare find in ${list(own.rewardRare)}.`, members };
  for (const r of recipes) {
    const gate = r.materials.map((m) => rareGate(m, facts)).find((g) => g?.material);
    if (gate)
      return { kind: "rare-drop", note: `Made from ${gate.material}, a rare drop from ${list(gate.sources)}.`, members };
  }
  return undefined;
}
