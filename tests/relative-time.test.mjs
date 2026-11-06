import test from "node:test";
import assert from "node:assert/strict";
import { relativeTime } from "../src/lib/relativeTime.ts";

const now = 10_000_000_000;
test("relativeTime reports minutes, hours and days", () => {
  assert.equal(relativeTime(now - 5_000, now), "just now");
  assert.equal(relativeTime(now - 4 * 60_000, now), "4 min ago");
  assert.equal(relativeTime(now - 3_600_000, now), "1 hour ago");
  assert.equal(relativeTime(now - 2 * 86_400_000, now), "2 days ago");
  assert.equal(relativeTime(now + 60_000, now), "just now");
});
