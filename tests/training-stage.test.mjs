import assert from "node:assert/strict";
import test from "node:test";
import { SAMPLE_PROFILES, SKILLS, trainingStage } from "../src/data.ts";

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
