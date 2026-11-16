import assert from "node:assert/strict";
import test from "node:test";
import { combatLevel, COMBAT_LEVEL_SKILLS } from "../src/lib/combatLevel.ts";
import { efficientSlayerRoute, masterFor } from "../src/slayerMasters.ts";

const levels = (over = {}) => ({
  ...Object.fromEntries(COMBAT_LEVEL_SKILLS.map((skill) => [skill, 1])),
  Constitution: 10,
  Slayer: 1,
  ...over,
});
const profile = (over = {}, mode = "members", completedQuests = []) => ({
  mode,
  completedQuests,
  levels: levels(over),
});
// Combat 110 and 120 from the Wiki formula (asserted below), so the tests pin both levels and the formula.
const C110 = { Attack: 90, Strength: 95, Defence: 80, Constitution: 80, Prayer: 80 };
const C120 = { Attack: 71, Strength: 71, Defence: 99, Constitution: 99, Prayer: 99, Summoning: 99 };
const ids = (list) => list.map((m) => m.id);

test("combatLevel matches the Wiki's worked values", () => {
  // https://runescape.wiki/w/Combat_level
  assert.equal(combatLevel(levels()), 3);
  const max = Object.fromEntries(COMBAT_LEVEL_SKILLS.map((s) => [s, 120]));
  assert.equal(combatLevel({ ...max, Defence: 99, Constitution: 99, Prayer: 99, Summoning: 99 }), 152);
  assert.equal(combatLevel(levels(C110)), 110);
  assert.equal(combatLevel(levels(C120)), 120);
});

test("combatLevel takes the best of melee, Ranged, Magic and Necromancy, and rounds down", () => {
  assert.equal(combatLevel(levels({ Necromancy: 99, Defence: 99 })), Math.floor((1.3 * 198 + 99 + 10) / 4));
});

test("combatLevel is undefined while a skill the formula reads is unrecorded", () => {
  for (const skill of COMBAT_LEVEL_SKILLS) {
    const l = levels();
    delete l[skill];
    assert.equal(combatLevel(l), undefined, skill);
  }
});

test("combat 110 and Slayer 80 gives Kuradal, with Morvran next", () => {
  const choice = masterFor(profile({ ...C110, Slayer: 80 }));
  assert.equal(choice.master.id, "kuradal");
  assert.equal(choice.next.id, "morvran");
});

test("combat 120, Slayer 90 and Plague's End gives Laniakea; Mandrith is never the master", () => {
  const choice = masterFor(profile({ ...C120, Slayer: 90 }, "members", ["plagues-end"]));
  assert.equal(choice.master.id, "laniakea");
  assert.equal(choice.next, undefined);
  assert.deepEqual(choice.alternatives, []);
});

test("quests gate a master: Morvran needs Plague's End", () => {
  const without = masterFor(profile({ ...C120, Slayer: 85 }));
  assert.equal(without.master.id, "kuradal");
  assert.equal(without.next.id, "morvran");
  assert.equal(masterFor(profile({ ...C120, Slayer: 85 }, "members", ["plagues-end"])).master.id, "morvran");
});

test("an unparsed text requirement does not block a master", () => {
  assert.equal(masterFor(profile({ ...C110, Slayer: 75 })).master.id, "kuradal");
});

test("F2P gets only free masters", () => {
  const choice = masterFor(profile({ ...C120, Slayer: 3 }, "f2p"));
  assert.match(choice.master.id, /^(turael|jacquelyn)$/);
  assert.equal(choice.master.members, false);
  assert.equal(choice.next, undefined);
  assert.deepEqual(choice.alternatives, []);
});

test("members below Vannaka's combat level start with a free master, Vannaka next", () => {
  const choice = masterFor(profile({}));
  assert.equal(choice.master.members, false);
  assert.equal(choice.next.id, "vannaka");
});

test("the Raptor and Mandrith appear only as alternatives", () => {
  const raptor = masterFor(profile({ ...C110, Slayer: 80 }, "members", ["unwelcome-guests"]));
  assert.deepEqual(ids(raptor.alternatives), ["the-raptor"]);
  const both = masterFor(profile({ ...C120, Slayer: 99 }, "members", ["unwelcome-guests"]));
  assert.deepEqual(ids(both.alternatives).sort(), ["mandrith", "the-raptor"]);
  for (const choice of [raptor, both]) {
    assert.ok(!["the-raptor", "mandrith"].includes(choice.master.id));
    assert.ok(!["the-raptor", "mandrith"].includes(choice.next?.id));
  }
});

test("an unrecorded Slayer level leaves the master undefined and says so", () => {
  const p = profile(C110);
  delete p.levels.Slayer;
  const choice = masterFor(p);
  assert.equal(choice.master, undefined);
  assert.deepEqual(choice.unrecorded, ["Slayer"]);
});

test("unrecorded combat skills are listed with Slayer when that is missing too", () => {
  const p = profile({ ...C110, Slayer: 80 });
  delete p.levels.Necromancy;
  delete p.levels.Summoning;
  assert.deepEqual(masterFor(p).unrecorded, ["Necromancy", "Summoning"]);
  delete p.levels.Slayer;
  const choice = masterFor(p);
  assert.equal(choice.master, undefined);
  assert.deepEqual(choice.unrecorded, ["Necromancy", "Summoning", "Slayer"]);
});

test("F2P with unrecorded combat skills still gets Turael", () => {
  const p = profile({ Slayer: 3 }, "f2p");
  delete p.levels.Necromancy;
  delete p.levels.Summoning;
  const choice = masterFor(p);
  assert.equal(choice.master.id, "turael");
  assert.deepEqual(choice.unrecorded, ["Necromancy", "Summoning"]);
});

test("members with unknown combat only get masters that need no combat, never Kuradal", () => {
  const p = profile({ ...C110, Slayer: 80 });
  delete p.levels.Necromancy;
  const choice = masterFor(p);
  assert.equal(choice.master.combat, 0);
  assert.notEqual(choice.master.id, "kuradal");
  assert.deepEqual(choice.unrecorded, ["Necromancy"]);
});

test("Turael wins the tie with Jacquelyn", () => {
  assert.equal(masterFor(profile({}, "f2p")).master.id, "turael");
});

test("Kuradal's thresholds are exactly combat 110 and Slayer 75; below either gives Duradel", () => {
  const C109 = { ...C110, Attack: 90, Strength: 94 };
  assert.equal(combatLevel(levels(C109)), 109);
  const quests = ["shilo-village"]; // Duradel's quest
  assert.equal(masterFor(profile({ ...C110, Slayer: 75 }, "members", quests)).master.id, "kuradal");
  assert.equal(masterFor(profile({ ...C109, Slayer: 75 }, "members", quests)).master.id, "duradel");
  assert.equal(masterFor(profile({ ...C110, Slayer: 74 }, "members", quests)).master.id, "duradel");
});

test("the efficient route for Attack at combat 110 and Slayer 80 is Kuradal's tasks", () => {
  const route = efficientSlayerRoute("Attack", profile({ ...C110, Attack: 85, Strength: 100, Slayer: 80 }));
  assert.equal(combatLevel(levels({ ...C110, Attack: 85, Strength: 100, Slayer: 80 })), 110);
  assert.equal(route.master.id, "kuradal");
  assert.match(route.reason, /Kuradal/);
  for (const skill of ["Attack", "Strength", "Defence", "Constitution", "Slayer", "Prayer"])
    assert.ok(route.feeds.includes(skill), skill);
  assert.ok(!route.feeds.includes("Mining"));
  assert.equal(route.checked, "2026-11-16");
  assert.ok(route.sources.length > 0);
  assert.equal(new Set(route.sources).size, route.sources.length);
  for (const source of route.sources) assert.match(source, /^https:\/\/runescape\.wiki\/w\/\S+$/);
});

test("every combat skill gets the route, and no other skill does", () => {
  const p = profile({ ...C110, Slayer: 80 });
  for (const skill of ["Attack", "Strength", "Defence", "Constitution", "Ranged", "Magic", "Necromancy"])
    assert.equal(efficientSlayerRoute(skill, p)?.master.id, "kuradal", skill);
  for (const skill of ["Slayer", "Prayer", "Mining", "Summoning"]) assert.equal(efficientSlayerRoute(skill, p), undefined, skill);
});

test("F2P never gets the efficient route", () => {
  assert.equal(efficientSlayerRoute("Attack", profile({ ...C120, Slayer: 99 }, "f2p")), undefined);
  assert.equal(efficientSlayerRoute("Attack", profile({ ...C110, Attack: 30, Slayer: 3 }, "f2p")), undefined);
});

test("below Vannaka, or with no master, there is no efficient route", () => {
  // Combat 3: Turael is the master, and the starter masters never count.
  assert.equal(masterFor(profile({})).master.id, "turael");
  assert.equal(efficientSlayerRoute("Attack", profile({})), undefined);
  const unrecorded = profile(C110);
  delete unrecorded.levels.Slayer;
  assert.equal(efficientSlayerRoute("Attack", unrecorded), undefined);
});

test("Vannaka is the first master that counts", () => {
  const C30 = { Attack: 30, Strength: 30, Defence: 30, Constitution: 30 };
  assert.ok(combatLevel(levels(C30)) >= 30);
  assert.equal(efficientSlayerRoute("Ranged", profile({ ...C30, Slayer: 5 })).master.id, "vannaka");
});
