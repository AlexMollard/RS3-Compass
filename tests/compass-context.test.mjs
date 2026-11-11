import assert from "node:assert/strict";
import test from "node:test";
import { activeProfile } from "../src/lib/compassContext.ts";

const a = { id: "a" };
const b = { id: "b" };

test("activeProfile returns the profile whose id is active", () => {
  assert.equal(activeProfile({ version: 1, activeId: "b", profiles: [a, b] }), b);
});

test("activeProfile falls back to the first profile", () => {
  assert.equal(activeProfile({ version: 1, activeId: "gone", profiles: [a, b] }), a);
  assert.equal(activeProfile({ version: 1, activeId: "", profiles: [] }), undefined);
});
