import assert from "node:assert/strict";
import test from "node:test";
import {
  isRecord,
  isSafeInteger,
  isSkillLevel,
  isSkillLevelMap,
  MAX_DATE_MS,
} from "../src/lib/guards.ts";

test("isRecord accepts plain objects only", () => {
  assert.equal(isRecord({}), true);
  assert.equal(isRecord(Object.create(null)), true);
  for (const value of [null, undefined, [], "x", 1, true, () => {}])
    assert.equal(isRecord(value), false, String(value));
});

test("isSafeInteger checks the type, safety and lower bound", () => {
  for (const [value, min, ok] of [
    [0, 0, true],
    [5, undefined, true],
    [-1, undefined, false],
    [-1, -1, true],
    [1, 1, true],
    [0, 1, false],
    [1.5, 0, false],
    [2 ** 53 - 1, 0, true],
    [2 ** 53, 0, false],
    [NaN, 0, false],
    [Infinity, 0, false],
    ["5", 0, false],
    [null, 0, false],
  ])
    assert.equal(isSafeInteger(value, min), ok, `${value} >= ${min}`);
});

test("isSkillLevel accepts integers from 1 to 120", () => {
  for (const [value, ok] of [
    [-1, false],
    [0, false],
    [1, true],
    [120, true],
    [121, false],
    [1.5, false],
    ["5", false],
  ])
    assert.equal(isSkillLevel(value), ok, String(value));
});

test("isSkillLevelMap needs known skill names with valid levels", () => {
  assert.equal(isSkillLevelMap({}), true);
  assert.equal(isSkillLevelMap({ Attack: 1, Necromancy: 120 }), true);
  for (const value of [
    { Attack: 0 },
    { Attack: 121 },
    { attack: 5 },
    { Nope: 5 },
    { constructor: 5 },
    JSON.parse('{"__proto__": 5}'),
    [],
    null,
  ])
    assert.equal(isSkillLevelMap(value), false, JSON.stringify(value));
});

test("MAX_DATE_MS is the last time a Date can represent", () => {
  assert.equal(new Date(MAX_DATE_MS).getTime(), MAX_DATE_MS);
  assert.ok(Number.isNaN(new Date(MAX_DATE_MS + 1).getTime()));
});
