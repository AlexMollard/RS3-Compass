import assert from "node:assert/strict";
import test from "node:test";
import { QUESTS } from "../src/data.ts";
import { SLAYER_MASTERS, SLAYER_TASKS } from "../src/slayerImported.ts";
import { isSkillName } from "../src/skillNames.ts";

// The masters on https://runescape.wiki/w/Template:Slayer_masters/table (checked 2026-11-16), by their first link.
const WIKI_MASTERS = [
  "Turael",
  "Jacquelyn",
  "Vannaka",
  "The Raptor",
  "Mazchna",
  "Chaeldar",
  "Sumona",
  "Duradel",
  "Kuradal",
  "Morvran",
  "Laniakea",
  "Mandrith",
];
const master = (wiki) => {
  const found = SLAYER_MASTERS.find((m) => m.wiki === wiki);
  assert.ok(found, `${wiki} is imported`);
  return found;
};

test("every master on the Wiki table is present", () => {
  assert.deepEqual(SLAYER_MASTERS.map((m) => m.wiki), WIKI_MASTERS);
  assert.equal(new Set(SLAYER_MASTERS.map((m) => m.id)).size, SLAYER_MASTERS.length);
});

test("Turael and Jacquelyn are free; Vannaka is members", () => {
  assert.equal(master("Turael").members, false);
  assert.equal(master("Jacquelyn").members, false);
  assert.equal(master("Vannaka").members, true);
});

test("master requirements match the Wiki table", () => {
  assert.deepEqual([master("Kuradal").combat, master("Kuradal").slayer], [110, 75]);
  assert.deepEqual([master("Morvran").combat, master("Morvran").slayer, master("Morvran").quests], [120, 85, ["plagues-end"]]);
});

test("unmatched master requirements are kept as text", () => {
  assert.deepEqual(master("Kuradal").text, ["Barbarian Training"]);
});

test("combat level requirements are imported", () => {
  const find = (m, name) => SLAYER_TASKS.find((t) => t.master === m && t.name === name);
  assert.equal(find("morvran", "Edimmu").combat, 110);
  assert.equal(find("vannaka", "Mogres").combat, 35);
  assert.deepEqual(SLAYER_TASKS.filter((t) => t.requirements.text.some((s) => /^Combat level/.test(s))).map((t) => t.id), []);
});

test("no free task is above the F2P Slayer cap of 5", () => {
  const bad = SLAYER_TASKS.filter((t) => !t.members && t.slayer > 5);
  assert.deepEqual(bad.map((t) => `${t.master}/${t.id}`), []);
});

test("every task's master exists, and every quest ID exists in QUESTS", () => {
  const masters = new Set(SLAYER_MASTERS.map((m) => m.id));
  const quests = new Set(QUESTS.map((q) => q.id));
  assert.deepEqual(SLAYER_TASKS.filter((t) => !masters.has(t.master)).map((t) => t.id), []);
  const badQuests = [
    ...SLAYER_MASTERS.flatMap((m) => m.quests),
    ...SLAYER_TASKS.flatMap((t) => t.requirements.quests),
  ].filter((q) => !quests.has(q));
  assert.deepEqual(badQuests, []);
});

test("there are no duplicate task IDs per master", () => {
  const keys = SLAYER_TASKS.map((t) => `${t.master}/${t.id}`);
  assert.deepEqual(keys.filter((k, i) => keys.indexOf(k) !== i), []);
});

test("every task has a sane amount, weight, Slayer level and requirements", () => {
  const bad = SLAYER_TASKS.filter(
    (t) =>
      !(Number.isInteger(t.amount[0]) && t.amount[0] >= 1 && t.amount[0] <= t.amount[1]) ||
      !(Number.isInteger(t.weight) && t.weight >= 0) ||
      !(t.slayer >= 1 && t.slayer <= 120) ||
      !t.requirements.levels.every((l) => isSkillName(l.skill) && l.level >= 1 && l.level <= 120) ||
      t.requirements.text.some((s) => /\[\[|\]\]|\{\{|<ref/.test(s)),
  );
  assert.deepEqual(bad.map((t) => `${t.master}/${t.id}`), []);
});

test("every master has tasks, and members masters only members tasks", () => {
  for (const m of SLAYER_MASTERS) {
    const tasks = SLAYER_TASKS.filter((t) => t.master === m.id);
    assert.ok(tasks.length > 0, `${m.wiki} has tasks`);
    if (m.members) assert.ok(tasks.every((t) => t.members), `${m.wiki}'s tasks are members`);
  }
});
