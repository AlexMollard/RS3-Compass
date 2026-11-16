// Generates src/slayerMastersImported.ts (the masters) and src/slayerImported.ts (each master's assignments) from the
// RuneScape Wiki. The masters get their own small module because every skill page loads them; the tasks stay in the
// lazy Slayer chunk. Run locally: node --experimental-strip-types scripts/import-slayer.mjs
// Prints one review line per master and per task (amount, weight, Slayer level, requirements), the tasks with an
// unknown weight and the quest names that matched no quest. Exits non-zero, writing nothing, on any unexpected row.
import { writeFileSync } from "node:fs";
import { QUESTS } from "../src/data.ts";
import { parseAssignments, parseDisambig, parseMastersTable, representativeMonster } from "./slayerWikitext.mjs";
import { chunks, createWikiApi, nameKey } from "./wikiApi.mjs";

const USER_AGENT = "RS3 Compass Slayer import (https://github.com/AlexMollard/RS3-Compass)";
const { api, bucketRows, pageContents, servedFiles } = createWikiApi(USER_AGENT);
const OUT = new URL("../src/slayerImported.ts", import.meta.url);
const MASTERS_OUT = new URL("../src/slayerMastersImported.ts", import.meta.url);
const TABLE = "Template:Slayer masters/table";
const MODULE = "Module:Slayer assignments/";
const DISAMBIG = MODULE + "disambig";
const HELPERS = new Set(["disambig", "disambig/doc", "normalise"]);

// The Wiki's free-to-play masters; every other master is members-only. The table has no members column.
// Sources (checked 2026-11-16): https://runescape.wiki/w/Turael (members1 = No, the Slayer Master version) and
// https://runescape.wiki/w/Jacquelyn ("more advanced Slayer Masters which are all available only to members").
const FREE_MASTERS = new Set(["Turael", "Jacquelyn"]);
// Free-to-play players can train Slayer only to level 5 (https://runescape.wiki/w/Slayer, maxf2p = 5, checked
// 2026-11-16). A free master's task above it is members-only even without the Wiki's members icon (Jacquelyn's
// Cave bugs at 7 and Cave slimes at 17; Turael's Cave bugs at 7 carries the icon).
const F2P_SLAYER_CAP = 5;

const fail = (title, lines) => {
  if (!lines.length) return;
  console.error(`${title} (${lines.length}):\n  ${lines.join("\n  ")}`);
  process.exitCode = 1;
};

// 1. Masters from the Wiki's table; every one must have an assignment module, and every module a master.
const table = (await pageContents([TABLE])).get(TABLE);
if (!table) throw new Error(`${TABLE} is missing`);
const masters = parseMastersTable(table, QUESTS);
const listed = await api({ action: "query", list: "allpages", apnamespace: "828", apprefix: "Slayer assignments/", aplimit: "500" });
const modules = listed.query.allpages.map((p) => p.title.slice(MODULE.length)).filter((n) => !HELPERS.has(n));
const tableNames = new Set(masters.map((m) => m.wiki));
fail("Assignment modules with no row in the masters table", modules.filter((n) => !tableNames.has(n)));
fail("Masters with no assignment module", masters.map((m) => m.wiki).filter((n) => !modules.includes(n)));
fail("Free masters missing from the table: update FREE_MASTERS", [...FREE_MASTERS].filter((n) => !tableNames.has(n)));

// 2. Each master's tasks.
const sources = await pageContents([DISAMBIG, ...masters.map((m) => MODULE + m.wiki)]);
const wikiPages = parseDisambig(sources.get(DISAMBIG) ?? "");
const tasks = [];
const invalid = [];
const unmatched = new Set();
for (const master of masters) {
  const source = sources.get(MODULE + master.wiki);
  if (!source) {
    fail("Assignment module missing from the Wiki's reply", [MODULE + master.wiki]);
    continue;
  }
  for (const q of master.text) unmatched.add(`${q} (master ${master.wiki})`);
  const members = !FREE_MASTERS.has(master.wiki);
  const result = parseAssignments(master.id, source, { quests: QUESTS, members, wikiPages });
  for (const t of result.tasks) if (t.slayer > F2P_SLAYER_CAP) t.members = true;
  tasks.push(...result.tasks);
  for (const q of result.unmatched) unmatched.add(`${q} (${master.wiki} task)`);
  for (const row of result.invalid) invalid.push(`${master.wiki}: ${row.name}: ${row.problems.join(", ")}`);
}
fail("Invalid assignment rows: fix the parser", invalid);

// 3. A picture per task: the lead image of the monster that represents its Slayer category in the Wiki's
// infobox_monster Bucket (the data Module:Slayer Tasks by Master reads), skipping monsters the Wiki marks removed.
const categories = [...new Set(tasks.map((t) => t.name))];
const monsterRows = (
  await bucketRows("infobox_monster", ["page_name", "combat_level", "location_restriction"], "slayer_category", categories)
).filter((r) => r.page_name && r.slayer_category && r.location_restriction !== "removed");
const monsterFor = new Map();
for (const category of categories) {
  const rows = monsterRows.filter((r) => [r.slayer_category].flat().some((c) => nameKey(c) === nameKey(category)));
  const monster = representativeMonster(category, rows);
  if (monster) monsterFor.set(category, monster);
}
const leadImage = new Map();
for (const batch of chunks([...new Set(monsterFor.values())])) {
  const json = await api({ action: "query", prop: "pageimages", piprop: "name", redirects: "1", titles: batch.join("|") });
  const from = new Map();
  for (const n of json.query.normalized ?? []) from.set(n.to, n.from);
  for (const r of json.query.redirects ?? []) from.set(r.to, from.get(r.from) ?? r.from);
  for (const p of json.query.pages) if (p.pageimage) leadImage.set(from.get(p.title) ?? p.title, p.pageimage);
}
const taskImages = await servedFiles([...leadImage.values()]);
for (const t of tasks) {
  const image = taskImages.get(leadImage.get(monsterFor.get(t.name)));
  if (image) t.image = image;
}
const unpictured = categories.filter((c) => !taskImages.has(leadImage.get(monsterFor.get(c))));

// 4. Chathead art, resolved through Wiki file redirects.
const images = await servedFiles(masters.map((m) => m.image).filter(Boolean));
const records = masters.map(({ image, ...m }) => {
  const served = image && images.get(image);
  return {
    id: m.id,
    name: m.name,
    wiki: m.wiki,
    ...(served ? { image: served } : {}),
    members: !FREE_MASTERS.has(m.wiki),
    combat: m.combat,
    slayer: m.slayer,
    quests: m.quests,
    ...(m.text.length ? { text: m.text } : {}),
    ...(m.location ? { location: m.location } : {}),
  };
});

const today = new Date().toLocaleDateString("en-CA"); // the local date, as YYYY-MM-DD
const header = `// Generated by scripts/import-slayer.mjs on ${today}. Do not edit by hand: rerun the script.
// Source: RuneScape Wiki (CC BY-NC-SA 3.0) — Template:Slayer masters/table and each master's
// Module:Slayer assignments/<Master>, the data behind the Slayer assignment/<Master> tables.`;
const mastersSource = `${header}
import type { SlayerMaster } from "./slayerTypes";

export const SLAYER_MASTERS: SlayerMaster[] = [
${records.map((r) => `  ${JSON.stringify(r)}`).join(",\n")}
];
`;
const source = `${header}
import type { SlayerTask } from "./slayerTypes";

export { SLAYER_MASTERS } from "./slayerMastersImported.ts";

const task = (t: SlayerTask) => t;

export const SLAYER_TASKS: SlayerTask[] = [
${tasks.map((t) => `  task(${JSON.stringify(t)})`).join(",\n")}
];
`;
if (!process.exitCode) {
  writeFileSync(MASTERS_OUT, mastersSource.replace(/\r?\n/g, "\r\n"));
  writeFileSync(OUT, source.replace(/\r?\n/g, "\r\n"));
}

for (const m of records)
  console.log(
    `${m.name} | ${m.members ? "members" : "free"} | combat ${m.combat} | Slayer ${m.slayer} | quests ${m.quests.join(" ") || "none"}${m.text ? ` + ${m.text.join("; ")}` : ""} | ${m.location ?? "no location"} | ${m.image ?? "no image"} | ${tasks.filter((t) => t.master === m.id).length} tasks`,
  );
const reqs = (t) =>
  [
    ...(t.combat ? [`combat ${t.combat}`] : []),
    ...t.requirements.levels.map((l) => `${l.skill} ${l.level}`),
    ...t.requirements.quests,
    ...t.requirements.text,
  ].join("; ") || "none";
for (const t of tasks)
  console.log(`  ${t.master} | ${t.name} | ${t.amount.join("-")} | weight ${t.weight ?? "unknown"} | Slayer ${t.slayer} | ${t.members ? "members" : "free"} | ${reqs(t)}`);
const unweighted = tasks.filter((t) => t.weight === undefined).map((t) => `${t.master}/${t.name}`);
console.log(`Imported ${records.length} masters and ${tasks.length} tasks. Unknown weight: ${unweighted.join(", ") || "none"}.`);
console.log(`Tasks with no picture (${unpictured.length}): ${unpictured.join(", ") || "none"}`);
console.log(`Quest names with no QUESTS entry, kept as text (${unmatched.size}): ${[...unmatched].join(", ") || "none"}`);
