import assert from "node:assert/strict";
import test from "node:test";
import { levelStatus } from "../src/lib/levelStatus.ts";

test("levelStatus compares a recorded level with the requirement", () => {
  for (const [recorded, need, status] of [
    [undefined, 40, "unknown"],
    [null, 40, "unknown"],
    [39, 40, "below"],
    [40, 40, "met"],
    [99, 40, "met"],
    [1, 1, "met"],
  ])
    assert.equal(levelStatus(recorded, need), status, `${recorded} vs ${need}`);
});
