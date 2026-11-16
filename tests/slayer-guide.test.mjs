import assert from "node:assert/strict";
import test from "node:test";
import { isSkillName } from "../src/skillNames.ts";
import { SLAYER_BLOCKS, SLAYER_VERDICTS } from "../src/slayerGuide.ts";
import { SLAYER_MASTERS, SLAYER_TASKS } from "../src/slayerImported.ts";

// The masters a member trains with, plus the free ones (spec "Coverage"). Every one of their tasks needs a verdict.
// Mazchna is covered because masterFor picks him for members at combat 50-74.
const COVERED = [
  "turael",
  "jacquelyn",
  "vannaka",
  "mazchna",
  "chaeldar",
  "sumona",
  "duradel",
  "kuradal",
  "morvran",
  "laniakea",
];
// Members masters on that list carry block lists; Turael and Jacquelyn earn too few points for blocking.
const BLOCKING = ["vannaka", "mazchna", "chaeldar", "sumona", "duradel", "kuradal", "morvran", "laniakea"];
const CHECKED = "2026-11-16";
const WIKI = /^https:\/\/runescape\.wiki\/w\/\S+$/;

const tasksOf = (master) => SLAYER_TASKS.filter((t) => t.master === master);
const dated = (entry, label) => {
  assert.equal(entry.checked, CHECKED, `${label} checked`);
  assert.ok(entry.sources.length > 0, `${label} has sources`);
  for (const url of entry.sources) assert.match(url, WIKI, `${label} source ${url}`);
};

test("the covered masters exist in the import", () => {
  const ids = SLAYER_MASTERS.map((m) => m.id);
  for (const id of COVERED) assert.ok(ids.includes(id), id);
});

test("every task of a covered master has a verdict", () => {
  const missing = COVERED.flatMap((m) => tasksOf(m).filter((t) => !SLAYER_VERDICTS[t.name]).map((t) => `${m}: ${t.name}`));
  assert.deepEqual(missing, []);
});

test("every verdict is keyed by an imported task name", () => {
  const names = new Set(SLAYER_TASKS.map((t) => t.name));
  assert.deepEqual(Object.keys(SLAYER_VERDICTS).filter((n) => !names.has(n)), []);
});

test("every verdict cites its own imported assignment page first", () => {
  for (const t of SLAYER_TASKS.filter((t) => SLAYER_VERDICTS[t.name]))
    assert.equal(SLAYER_VERDICTS[t.name].sources[0], "https://runescape.wiki/w/" + t.wiki.replaceAll(" ", "_"), t.name);
});

test("every verdict is dated, sourced and reasoned", () => {
  for (const [name, v] of Object.entries(SLAYER_VERDICTS)) {
    assert.ok(["prefer", "do", "skip", "block"].includes(v.verdict), `${name} verdict`);
    assert.ok(v.reason.trim(), `${name} reason`);
    assert.ok(v.feeds.every(isSkillName), `${name} feeds`);
    assert.ok(["melee", "ranged", "magic", "necromancy", "any"].includes(v.fastest.style), `${name} style`);
    assert.ok(v.fastest.where.trim(), `${name} where`);
    assert.equal(typeof v.fastest.aoe, "boolean", `${name} aoe`);
    if (v.mainNote !== undefined) assert.ok(v.mainNote.trim(), `${name} mainNote`);
    if (v.fastest.site) {
      const { map, wiki, label } = v.fastest.site;
      assert.ok(label && wiki, `${name} site label`);
      assert.ok(Number.isInteger(map.x) && Number.isInteger(map.y) && [0, 1, 2, 3].includes(map.plane), `${name} tile`);
    }
    dated(v, name);
  }
});

test("block lists cover the members masters, and every entry is one of that master's tasks", () => {
  assert.deepEqual(Object.keys(SLAYER_BLOCKS).sort(), [...BLOCKING].sort());
  for (const [master, list] of Object.entries(SLAYER_BLOCKS)) {
    dated(list, master);
    // One block slot per 50 quest points, up to eight (https://runescape.wiki/w/Slayer_training).
    assert.ok(list.block.length <= 8, `${master} blocks at most 8`);
    const names = new Set(tasksOf(master).map((t) => t.name));
    const seen = new Set();
    for (const entry of [...list.block, ...list.skip]) {
      assert.ok(names.has(entry.task), `${master}: ${entry.task} is assigned by this master`);
      assert.ok(!seen.has(entry.task), `${master}: ${entry.task} listed once`);
      seen.add(entry.task);
      assert.ok(entry.reason.trim(), `${master}: ${entry.task} reason`);
    }
  }
});

test("prefer lists rank at most eight of that master's prefer-rated tasks", () => {
  for (const [master, list] of Object.entries(SLAYER_BLOCKS)) {
    // Eight prefer slots per account at most, one per 50 quest points (https://runescape.wiki/w/Slayer_assignment).
    assert.ok(list.prefer.length <= 8, `${master} prefers at most 8`);
    const names = new Set(tasksOf(master).map((t) => t.name));
    assert.equal(new Set(list.prefer.map((p) => p.task)).size, list.prefer.length, `${master} prefers listed once`);
    for (const { task, reason } of list.prefer) {
      assert.ok(names.has(task), `${master}: ${task} is assigned by this master`);
      assert.equal(SLAYER_VERDICTS[task]?.verdict, "prefer", `${master}: ${task} is rated prefer`);
      assert.ok(reason.trim(), `${master}: ${task} reason`);
    }
  }
});

// Skip- or block-rated tasks a master assigns but deliberately leaves off its lists, with the reason.
const LIST_EXCEPTIONS = {};

test("every skip- or block-rated task a master assigns is on its lists, or excepted", () => {
  for (const [master, list] of Object.entries(SLAYER_BLOCKS)) {
    const listed = new Set([...list.block, ...list.skip].map((e) => e.task));
    const excepted = LIST_EXCEPTIONS[master] ?? {};
    for (const reason of Object.values(excepted)) assert.ok(reason.trim(), `${master} exception reason`);
    const missing = tasksOf(master)
      .filter((t) => ["skip", "block"].includes(SLAYER_VERDICTS[t.name].verdict))
      .filter((t) => !listed.has(t.name) && !excepted[t.name])
      .map((t) => t.name);
    assert.deepEqual(missing, [], master);
  }
});

test("coverage of the masters without verdicts is reported", () => {
  for (const m of SLAYER_MASTERS.filter((m) => !COVERED.includes(m.id))) {
    const tasks = tasksOf(m.id);
    const judged = tasks.filter((t) => SLAYER_VERDICTS[t.name]).length;
    console.log(`${m.name}: ${judged}/${tasks.length} tasks have a verdict (not required)`);
  }
});
