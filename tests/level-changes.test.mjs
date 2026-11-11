import test from "node:test";
import assert from "node:assert/strict";
import { applyLevelChanges, levelChanges, parseLevel } from "../src/lib/levelChanges.ts";
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

test("invalid and out-of-range levels are ignored, never clamped", () => {
  assert.deepEqual(levelChanges({}, { Attack: "0" }), []);
  assert.deepEqual(levelChanges({ Attack: 4 }, { Attack: "4.5", Mining: "x" }), []);
  assert.deepEqual(levelChanges({}, { Mining: "" }), []);
  const cap = SKILLS.find((s) => s.name === "Defence").maxLevel;
  assert.deepEqual(levelChanges({ Defence: cap }, { Defence: 150 }), []);
  assert.deepEqual(levelChanges({}, { Defence: "150", Nope: 5 }), []);
  assert.deepEqual(levelChanges({ Attack: 40 }, { Attack: "150" }), []);
});

test("each skill's own cap applies, not the 120 fallback", () => {
  const skill = SKILLS.find((s) => s.maxLevel === 99).name;
  assert.deepEqual(levelChanges({}, { [skill]: "100" }), []);
  assert.deepEqual(levelChanges({}, { [skill]: "99" }), [
    { skill, from: null, to: 99 },
  ]);
});

test("parseLevel accepts whole levels within the cap only", () => {
  const cap = SKILLS.find((s) => s.name === "Attack").maxLevel;
  assert.equal(parseLevel("150", cap), null);
  assert.equal(parseLevel("1e2", cap), null);
  assert.equal(parseLevel("0x10", cap), null);
  assert.equal(parseLevel("0", cap), null);
  assert.equal(parseLevel("99", cap), 99);
  assert.equal(parseLevel(" 99 ", cap), 99);
  assert.equal(parseLevel("  ", cap), "");
  assert.deepEqual(levelChanges({}, { Attack: "99" }), [
    { skill: "Attack", from: null, to: 99 },
  ]);
});
