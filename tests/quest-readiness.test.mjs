import test from "node:test";
import assert from "node:assert/strict";
import { QUESTS } from "../src/data.ts";
import { QUEST_COMBAT } from "../src/combatData.ts";
import {
  questReadiness,
  closeToUnlocking,
  questStartMessage,
  questStartStatus,
} from "../src/lib/questReadiness.ts";

test("a quest is startable only when earlier quests and required levels are done", () => {
  const q = {
    id: "q",
    requirements: [
      { skill: "Mining", level: 10 },
      { skill: "Cooking", level: 50, recommended: true },
    ],
    supplies: [],
    questRequirements: ["a"],
  };
  const profile = (levels) => ({ levels, packed: [] });
  assert.equal(questStartStatus(q, profile({ Mining: 10 }), new Set()), "locked");
  assert.equal(questStartStatus(q, profile({ Mining: 9 }), new Set(["a"])), "levels");
  assert.equal(questStartStatus(q, profile({ Mining: 10 }), new Set(["a"])), "ready");
  assert.equal(questStartStatus(q, profile({}), new Set(["a"])), "ready", "unrecorded counts as met");
  assert.equal(questStartStatus(q, profile({}), new Set(["a", "q"])), "done");
});

test("the quest page never says ready while earlier quests are unfinished", () => {
  const base = { complete: false, membersOnly: false, levelsShort: 0, packed: 0, supplies: 0 };
  assert.equal(questStartMessage({ ...base, earlierLeft: 1 }), "1 earlier quest to finish first.");
  assert.equal(questStartMessage({ ...base, earlierLeft: 3 }), "3 earlier quests to finish first.");
  assert.equal(questStartMessage({ ...base, earlierLeft: 0 }), "Ready to start. Follow the walkthrough on the Wiki.");
});

const quest = (over = {}) => ({
  id: "q",
  name: "Q",
  requirements: [
    { skill: "Crafting", level: 10 },
    { skill: "Mining", level: 5, recommended: true },
  ],
  questRequirements: [],
  supplies: ["20 × Ball of wool"],
  ...over,
});
const profile = (over = {}) => ({
  levels: {},
  packed: [],
  completedQuests: [],
  ...over,
});

test("unknown levels are counted as unknown, never met", () => {
  assert.deepEqual(questReadiness(quest(), profile()).levels, {
    met: 0,
    total: 1,
    unknown: 1,
  });
});

test("known levels at or above the requirement are met; recommended is ignored", () => {
  const r = questReadiness(quest(), profile({ levels: { Crafting: 12 } }));
  assert.deepEqual(r.levels, { met: 1, total: 1, unknown: 0 });
  const low = questReadiness(quest(), profile({ levels: { Crafting: 9 } }));
  assert.deepEqual(low.levels, { met: 0, total: 1, unknown: 0 });
});

test("pack counts packed supply lines", () => {
  const r = questReadiness(
    quest(),
    profile({ packed: ["q::20 × Ball of wool", "other::x"] }),
  );
  assert.deepEqual(r.pack, { packed: 1, total: 1 });
});

test("danger is null without a combat entry", () => {
  assert.equal(questReadiness(quest({ id: "no-such-quest" }), profile()).danger, null);
});

test("danger is the highest numeric-level enemy", () => {
  const entry = Object.entries(QUEST_COMBAT).find(([, plan]) => {
    const all = [...plan.required, ...plan.hazards];
    return all.filter((e) => typeof e.level === "number").length >= 2;
  });
  assert.ok(entry, "a real quest with two levelled enemies exists");
  const [id, plan] = entry;
  const all = [...plan.required, ...plan.hazards].filter(
    (e) => typeof e.level === "number",
  );
  const top = all.reduce((a, b) => (b.level > a.level ? b : a));
  assert.equal(questReadiness(quest({ id }), profile()).danger, top.name);
  assert.ok(QUESTS.some((q) => q.id === id));
});

test("string levels rank below numbers and ties keep list order", () => {
  const id = "synthetic";
  QUEST_COMBAT[id] = {
    required: [{ name: "A", wiki: "A", level: "varies" }],
    hazards: [
      { name: "B", wiki: "B", level: 20 },
      { name: "C", wiki: "C", level: 20 },
    ],
    notes: [],
  };
  try {
    assert.equal(questReadiness(quest({ id }), profile()).danger, "B");
    QUEST_COMBAT[id] = {
      required: [{ name: "A", wiki: "A", level: "varies" }],
      hazards: [],
      notes: [],
    };
    assert.equal(questReadiness(quest({ id }), profile()).danger, "A");
  } finally {
    delete QUEST_COMBAT[id];
  }
});

test("closeToUnlocking returns incomplete quests within five levels", () => {
  const q = quest();
  const got = closeToUnlocking([q], profile({ levels: { Crafting: 8 } }));
  assert.equal(got.length, 1);
  assert.equal(got[0].skill, "Crafting");
  assert.equal(got[0].have, 8);
  assert.equal(got[0].need, 10);
  assert.equal(got[0].quest, q);
});

test("closeToUnlocking skips far, unknown, met, recommended and completed", () => {
  const q = quest();
  assert.deepEqual(closeToUnlocking([q], profile({ levels: { Crafting: 4 } })), []);
  assert.deepEqual(closeToUnlocking([q], profile()), []);
  assert.deepEqual(closeToUnlocking([q], profile({ levels: { Crafting: 10 } })), []);
  assert.deepEqual(closeToUnlocking([q], profile({ levels: { Mining: 3 } })), []);
  assert.deepEqual(
    closeToUnlocking([q], profile({ levels: { Crafting: 8 }, completedQuests: ["q"] })),
    [],
  );
});

test("closeToUnlocking sorts by gap then quest order and honours the limit", () => {
  const mk = (id, level) =>
    quest({ id, requirements: [{ skill: "Crafting", level }] });
  const qs = [mk("a", 10), mk("b", 9), mk("c", 10), mk("d", 8), mk("e", 9)];
  const got = closeToUnlocking(qs, profile({ levels: { Crafting: 8 } }), 5, 3);
  assert.deepEqual(
    got.map((g) => g.quest.id),
    ["b", "e", "a"],
  );
});
