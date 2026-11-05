import assert from "node:assert/strict";
import test from "node:test";
import {
  SAMPLE_PROFILES,
  SKILLS,
  trainingStage,
  trainingMethod,
  trainingSupplies,
  availableTrainingOptions,
} from "../src/data.ts";

const mining = SKILLS.find((skill) => skill.name === "Mining");
const [first, second] = mining.stages;
const profile = (ranges) => ({
  ...SAMPLE_PROFILES[0],
  levels: { ...SAMPLE_PROFILES[0].levels, Mining: second.from },
  ...(ranges === undefined ? {} : { trainingRanges: ranges }),
});

test("a chosen lower training range takes precedence without changing recorded levels", () => {
  const character = profile({ Mining: first.from });
  assert.equal(trainingStage(mining, character), first);
  assert.equal(character.levels.Mining, second.from);
});

test("legacy profiles select the next range at its exact lower boundary", () => {
  assert.equal(trainingStage(mining, profile()), second);
});

test("a range removed from the catalogue falls back to the recorded level", () => {
  const character = profile({ Mining: 120 });
  assert.equal(trainingStage(mining, character), second);
});

test("interleaved characters retain their own selected method", () => {
  const aster = profile({ Mining: first.from });
  const rowan = profile({ Mining: mining.stages[2].from });
  assert.equal(trainingStage(mining, aster), first);
  assert.equal(trainingStage(mining, rowan), mining.stages[2]);
  assert.equal(trainingStage(mining, aster), first);
});

test("a removed creature choice falls back within the selected range without editing saved preferences", () => {
  const range = mining.stages[1];
  const character = {
    ...profile(),
    trainingMethods: { Mining: "removed-method" },
  };
  const before = structuredClone(character);
  const method = trainingMethod(mining, character, range);
  assert.ok(availableTrainingOptions(range, character.mode).includes(method));
  assert.notEqual(method.id, "removed-method");
  assert.deepEqual(character, before);
});

test("packing combines common kit and selected-method ingredients without duplicate checks", () => {
  const range = { supplies: ["Food", "Coins"] };
  const choice = { supplies: ["Food", "Feathers"] };
  assert.deepEqual(trainingSupplies(range, choice), [
    "Food",
    "Coins",
    "Feathers",
  ]);
  assert.deepEqual(range.supplies, ["Food", "Coins"]);
  assert.deepEqual(choice.supplies, ["Food", "Feathers"]);
});
