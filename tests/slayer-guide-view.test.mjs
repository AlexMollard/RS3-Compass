import assert from "node:assert/strict";
import test from "node:test";
import { COMBAT_SKILLS } from "../src/lib/combatLevel.ts";
import { SLAYER_MASTERS, SLAYER_TASKS } from "../src/slayerImported.ts";
import { SLAYER_TASK_EXTRAS, slayerGearMethod } from "../src/slayerGear.ts";
import { groupedTasks, masterFor, masterRequirements, slayerTaskCard, tasksFor } from "../src/slayerMasters.ts";

const profile = (over = {}, extra = {}) => ({
  id: "p",
  kind: "Regular account",
  mode: "members",
  completedQuests: [],
  levels: {
    ...Object.fromEntries(COMBAT_SKILLS.map((skill) => [skill, 99])),
    Slayer: 85,
    ...over,
  },
  ...extra,
});
const status = (card, label) => card.requirements.find((r) => r.label === label)?.status;

test("Abyssal demons from Kuradal returns its verdict and an 85 Slayer requirement", () => {
  const met = slayerTaskCard(profile(), "kuradal", "abyssal-demons");
  assert.equal(met.task.name, "Abyssal demons");
  assert.ok(met.verdict, "has a hand-written verdict");
  assert.equal(status(met, "Slayer 85"), "met");
  assert.equal(status(slayerTaskCard(profile({ Slayer: 80 }), "kuradal", "abyssal-demons"), "Slayer 85"), "below");
  assert.equal(status(slayerTaskCard(profile({ Slayer: undefined }), "kuradal", "abyssal-demons"), "Slayer 85"), "unknown");
  // Wiki text ("Morytania access") can't be checked, so it is never met.
  assert.equal(status(met, "Morytania access"), "unknown");
});

test("A stale saved task returns undefined without throwing", () => {
  assert.equal(slayerTaskCard(profile(), "kuradal", "no-such-task"), undefined);
  assert.equal(slayerTaskCard(profile(), "no-such-master", "abyssal-demons"), undefined);
  assert.equal(slayerTaskCard(profile(), "kuradal", ""), undefined);
});

test("F2P profiles see no members-only task or master", () => {
  const f2p = profile({ Slayer: 5 }, { mode: "f2p" });
  const members = SLAYER_TASKS.filter((t) => t.members);
  assert.ok(members.length);
  for (const t of members) assert.equal(slayerTaskCard(f2p, t.master, t.id), undefined, t.name);
  for (const m of SLAYER_MASTERS) {
    const shown = groupedTasks(f2p, m.id).flatMap((g) => g.tasks);
    assert.ok(shown.every((t) => !t.members), m.id);
  }
  assert.equal(tasksFor(f2p, "kuradal").length, 0);
  assert.ok(tasksFor(f2p, "turael").length > 0);
});

test("showMainNote is only true for Regular accounts, and only when the verdict has one", () => {
  const withNote = SLAYER_TASKS.find((t) => t.master === "kuradal" && t.name === "Abyssal demons");
  assert.equal(slayerTaskCard(profile(), "kuradal", withNote.id).showMainNote, true);
  assert.equal(slayerTaskCard(profile({}, { kind: "Solo Ironman" }), "kuradal", withNote.id).showMainNote, false);
  assert.equal(slayerTaskCard(profile({}, { kind: "Group Ironman" }), "kuradal", withNote.id).showMainNote, false);
});

test("Quest requirements are met when done, below when absent, unknown when the import is private", () => {
  const raptor = SLAYER_MASTERS.find((m) => m.id === "morvran");
  const label = "Plague's End";
  const find = (p) => masterRequirements(p, raptor).find((r) => r.label === label)?.status;
  assert.equal(find(profile({}, { completedQuests: ["plagues-end"] })), "met");
  assert.equal(find(profile()), "below");
  assert.equal(find(profile({}, { source: "hiscores", questImportStatus: "private-or-unavailable" })), "unknown");
  assert.equal(find(profile({}, { source: "hiscores", questImportStatus: "available" })), "below");
});

test("Combat chips are unknown when combat can't be calculated, and Kuradal's text is never met", () => {
  const kuradal = SLAYER_MASTERS.find((m) => m.id === "kuradal");
  const chips = masterRequirements(profile({ Necromancy: undefined }), kuradal);
  assert.equal(chips.find((c) => c.label === "Combat 110").status, "unknown");
  assert.equal(chips.find((c) => c.label === "Barbarian Training").status, "unknown");
});

test("Grouped tasks put verdicts first and keep unverdicted tasks last, never hidden", () => {
  const groups = groupedTasks(profile(), "vannaka");
  const order = groups.map((g) => g.group);
  assert.deepEqual(order, [...order].sort((a, b) => ["prefer", "do", "skip", "block", "none"].indexOf(a) - ["prefer", "do", "skip", "block", "none"].indexOf(b)));
  assert.equal(groups.flatMap((g) => g.tasks).length, tasksFor(profile(), "vannaka").length);
});

test("An unrecorded Slayer level is reported by masterFor so the page can prompt for it", () => {
  assert.deepEqual(masterFor(profile({ Slayer: undefined })).unrecorded, ["Slayer"]);
});

test("Every gear method for a master carries a wear-at-least tier and the task's name and site", () => {
  for (const m of SLAYER_MASTERS) {
    const task = SLAYER_TASKS.find((t) => t.master === m.id);
    const method = slayerGearMethod(m, task);
    assert.ok(method?.gear, m.id);
    assert.equal(method.title, task.name);
  }
  for (const name of Object.keys(SLAYER_TASK_EXTRAS))
    assert.ok(SLAYER_TASKS.some((t) => t.name === name), name + " is a real task");
});
