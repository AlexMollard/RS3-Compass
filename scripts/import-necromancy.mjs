// Generates src/necromancyImported.ts (the rituals, glyphs and gear upgrade tiers) from the RuneScape Wiki.
// Run locally: node --experimental-strip-types scripts/import-necromancy.mjs
// Prints one review line per ritual and per upgrade step, and the quest names that matched no quest. Exits non-zero,
// writing nothing, on any unexpected Lua shape, table row or missing page.
import { writeFileSync } from "node:fs";
import { QUESTS } from "../src/data.ts";
import { parseGlyphs, parseRituals, parseUpgrades, upgradePic, upgradeTable } from "./necromancyWikitext.mjs";
import { createWikiApi, nameKey } from "./wikiApi.mjs";

const USER_AGENT = "RS3 Compass Necromancy import (https://github.com/AlexMollard/RS3-Compass)";
const { pageContents, servedFiles } = createWikiApi(USER_AGENT);
const OUT = new URL("../src/necromancyImported.ts", import.meta.url);
const MODULE = "Module:Necromancy/rituals/data";
const WEAPONS = "Template:Death Skull upgrades";
const DEATHDEALER = "Template:Deathdealer upgrades";
const DEATHWARDEN = "Deathwarden robe armour"; // the table is on the page itself, there is no template
const SOURCES = [MODULE, WEAPONS, DEATHDEALER, DEATHWARDEN];

// Gear tiers go in tens. Only tier 10 is free-to-play (https://runescape.wiki/w/Necromancy_armour, checked 2026-11-16).
const TIERS = [10, 20, 30, 40, 50, 60, 70, 80, 90];
const FREE_TIER = 10;
const F2P_NECROMANCY_CAP = 20; // https://runescape.wiki/w/Necromancy, checked 2026-11-16
// Kili's task for a tier: Kili Row at 20, then Kili's Knowledge I-VII for 30-90; the deathdealer branch has the
// "(power)" versions (https://runescape.wiki/w/Kili%27s_Knowledge, checked 2026-11-16).
const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII"];
const task = (line, tier) =>
  tier < 20 ? undefined : tier === 20 ? "Kili Row" : `Kili's Knowledge ${ROMAN[(tier - 30) / 10]}${line === "deathdealer" ? " (power)" : ""}`;
// Quests a tier needs: Necromancy! for the free tier-10 gear, Kili Row to start Kili's tasks, and The Spirit of War
// before Kili gives the tier 70 task of any line (Kili's Knowledge V and V (power) both list it).
const questNames = (tier) => (tier === FREE_TIER ? ["Necromancy!"] : tier === 20 ? ["Kili Row"] : tier >= 70 ? ["The Spirit of War"] : []);
const WEAR = { weapon: "Necromancy", deathwarden: "Defence", deathdealer: "Defence" };
const LINE_ORDER = { weapon: 0, deathwarden: 1, deathdealer: 2 };

const pages = await pageContents(SOURCES);
for (const title of SOURCES) if (!pages.get(title)) throw new Error(`${title} is missing`);

const rituals = parseRituals(pages.get(MODULE), { f2pCap: F2P_NECROMANCY_CAP });
const glyphs = parseGlyphs(pages.get(MODULE));

// Upgrade steps, one ladder per line. The free tier 10 has no materials and no table row.
const tables = {
  weapon: { source: pages.get(WEAPONS), from: FREE_TIER, tiers: TIERS.slice(1) },
  deathwarden: { source: upgradeTable(pages.get(DEATHWARDEN)), from: FREE_TIER, tiers: TIERS.slice(1) },
  deathdealer: { source: pages.get(DEATHDEALER), from: 70, tiers: [70, 80, 90] },
};
const questIndex = new Map(QUESTS.map((q) => [nameKey(q.name), q.id]));
const unmatched = new Set();
const questIds = (names) =>
  names.flatMap((name) => {
    const id = questIndex.get(nameKey(name));
    if (!id) unmatched.add(name);
    return id ? [id] : [];
  });
const steps = [];
const pics = {};
for (const [line, { source, from, tiers }] of Object.entries(tables)) {
  pics[line] = upgradePic(source);
  const parsed = parseUpgrades(source, line);
  const got = parsed.map((s) => s.tier);
  if (got.join() !== tiers.join()) throw new Error(`${line} upgrade table has tiers ${got.join(", ")}, expected ${tiers.join(", ")}`);
  const materials = new Map(parsed.map((s) => [s.tier, s.materials]));
  for (const tier of [...(from === FREE_TIER ? [FREE_TIER] : []), ...tiers])
    steps.push({
      line,
      tier,
      wear: [{ skill: WEAR[line], level: tier === FREE_TIER ? 1 : tier }],
      ...(task(line, tier) ? { task: task(line, tier) } : {}),
      quests: questIds(questNames(tier)),
      materials: materials.get(tier) ?? [],
      members: tier > FREE_TIER,
    });
}
steps.sort((a, b) => LINE_ORDER[a.line] - LINE_ORDER[b.line] || a.tier - b.tier);

// Wiki file names, resolved through redirects. Whatever has no file keeps no image.
const gearFile = (line, tier) => pics[line].replace(/\(tier \d+\)$/, `(tier ${tier})`) + ".png";
const itemFile = (item) => `${item}.png`;
const files = [
  ...glyphs.map((g) => itemFile(g.name)),
  ...rituals.map((r) => itemFile(r.name)),
  ...rituals.flatMap((r) => [...r.inputs, ...r.outputs].map((i) => itemFile(i.item))),
  ...steps.flatMap((s) => [gearFile(s.line, s.tier), ...s.materials.map((m) => itemFile(m.item))]),
];
const served = await servedFiles(files);
const image = (file) => (served.has(file) ? { image: served.get(file) } : {});
const withImages = (list) => list.map((i) => ({ ...i, ...image(itemFile(i.item)) }));

const ritualRecords = rituals.map((r) => ({
  ...r,
  inputs: withImages(r.inputs),
  outputs: withImages(r.outputs),
  ...(served.has(itemFile(r.name)) ? image(itemFile(r.name)) : image(itemFile(r.outputs[0].item))),
}));
const glyphRecords = glyphs.map((g) => ({ ...g, ...image(itemFile(g.name)) }));
const stepRecords = steps.map((s) => ({ ...s, materials: s.materials.map((m) => ({ ...m, ...image(itemFile(m.item)) })), ...image(gearFile(s.line, s.tier)) }));

const today = new Date().toLocaleDateString("en-CA"); // the local date, as YYYY-MM-DD
const list = (name, type, records) => `export const ${name}: ${type}[] = [\n${records.map((r) => `  ${JSON.stringify(r)}`).join(",\n")}\n];\n`;
const source = `// Generated by scripts/import-necromancy.mjs on ${today}. Do not edit by hand: rerun the script.
// Source: RuneScape Wiki (CC BY-NC-SA 3.0) — Module:Necromancy/rituals/data (rituals and glyphs), Template:Death Skull
// upgrades (weapons), Template:Deathdealer upgrades and the upgrade table on Deathwarden robe armour (robes).
import type { Glyph, Ritual, UpgradeStep } from "./necromancyTypes";

${list("NECRO_RITUALS", "Ritual", ritualRecords)}
${list("NECRO_GLYPHS", "Glyph", glyphRecords)}
${list("NECRO_UPGRADES", "UpgradeStep", stepRecords)}`;
writeFileSync(OUT, source.replace(/\r?\n/g, "\r\n"));

for (const r of ritualRecords)
  console.log(
    `${r.name} | ${r.members ? "members" : "free"} | level ${r.level} | tier ${r.tier} | ${r.inputs.map((i) => `${i.qty} ${i.item}`).join(", ")} -> ${r.outputs.map((i) => `${i.qty} ${i.item}`).join(", ")} | ${r.xp} XP | ${r.ticks} ticks | ${r.image ?? "no image"}`,
  );
for (const g of glyphRecords)
  console.log(`${g.name} | level ${g.level} | tier ${g.tier} | ${g.alteration ? "alteration" : "foundational"} | ${g.ink} | ${g.image ?? "no image"}`);
for (const s of stepRecords)
  console.log(
    `${s.line} T${s.tier} | ${s.members ? "members" : "free"} | ${s.wear.map((w) => `${w.skill} ${w.level}`).join(", ")} | ${s.task ?? "no task"} | quests ${s.quests.join(" ") || "none"} | ${s.materials.map((m) => `${m.qty} ${m.item} per ${m.per}`).join(", ") || "no materials"} | ${s.image ?? "no image"}`,
  );
const count = (line) => stepRecords.filter((s) => s.line === line).length;
console.log(
  `Imported ${ritualRecords.length} rituals (${new Set(ritualRecords.map((r) => r.name)).size} named), ${glyphRecords.length} glyphs, and upgrade steps: weapon ${count("weapon")}, deathwarden ${count("deathwarden")}, deathdealer ${count("deathdealer")}.`,
);
console.log(`Quest names with no QUESTS entry, left out (${unmatched.size}): ${[...unmatched].join(", ") || "none"}`);
