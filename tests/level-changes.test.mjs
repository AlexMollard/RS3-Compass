import test from "node:test";
import assert from "node:assert/strict";
import { applyLevelChanges, levelChanges } from "../src/lib/levelChanges.ts";
import { SKILLS } from "../src/data.ts";

test("level changes list edits and additions in in-game order", () => {
  assert.deepEqual(
    levelChanges({ Crafting: 5 }, { Crafting: 6, Firemaking: 9 }),
    [
      { skill: "Crafting", from: 5, to: 6 },
      { skill: "Firemaking", from: null, to: 9 },
    ],
  );
});

test("a blank level becomes unknown and is removed, never zero", () => {
  const changes = levelChanges({ Mining: 12 }, { Mining: "" });
  assert.deepEqual(changes, [{ skill: "Mining", from: 12, to: null }]);
  const levels = applyLevelChanges({ Mining: 12, Attack: 3 }, changes);
  assert.deepEqual(levels, { Attack: 3 });
  assert.equal("Mining" in levels, false);
});

test("invalid levels are ignored and high levels clamp to the skill cap", () => {
  assert.deepEqual(levelChanges({}, { Attack: "0" }), []);
  assert.deepEqual(levelChanges({ Attack: 4 }, { Attack: "4.5", Mining: "x" }), []);
  assert.deepEqual(levelChanges({}, { Mining: "" }), []);
  const cap = SKILLS.find((s) => s.name === "Defence").maxLevel;
  assert.deepEqual(levelChanges({ Defence: cap }, { Defence: 150 }), []);
  assert.deepEqual(levelChanges({}, { Defence: "150", Nope: 5 }), [
    { skill: "Defence", from: null, to: cap },
  ]);
});
