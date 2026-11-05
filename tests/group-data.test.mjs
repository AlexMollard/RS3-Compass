import test from "node:test";
import assert from "node:assert/strict";
import { isGroupLookup, normalizeGroupQuery } from "../src/lib/groupData.ts";

const group = () => ({
  id: 123,
  name: "Example Group",
  size: 2,
  isCompetitive: true,
  founder: true,
  rank: 1,
  totalLevel: 300,
  totalXp: 0,
  fetchedAt: 123,
  members: [
    { name: "Alice", totalLevel: 100, totalXp: 0, levels: { Attack: 50 } },
    { name: "Bob" },
  ],
});

test("group queries normalize spaces and reject invalid category or unsafe names", () => {
  assert.deepEqual(
    normalizeGroupQuery({
      name: "  Example  Group  ",
      size: 2,
      isCompetitive: true,
    }),
    { name: "Example Group", size: 2, isCompetitive: true },
  );
  assert.equal(
    normalizeGroupQuery({ name: "x&size=5", size: 2, isCompetitive: true })
      .name,
    "x&size=5",
  );
  for (const query of [
    { name: "x\ny", size: 2, isCompetitive: true },
    { name: "..", size: 2, isCompetitive: true },
    { name: "x", size: 1, isCompetitive: true },
    { name: "x", size: 2, isCompetitive: "true" },
  ])
    assert.throws(() => normalizeGroupQuery(query));
});

test("group snapshots reject duplicate members, unknown skills and unsafe integers", () => {
  assert.equal(isGroupLookup(group()), true);
  for (const mutate of [
    (g) => {
      g.members[1].name = " ALICE ";
    },
    (g) => {
      g.members.push({ name: "Charlie" });
    },
    (g) => {
      g.members = [];
    },
    (g) => {
      g.members[0].levels = { __proto__: null, Mystery: 20 };
    },
    (g) => {
      g.totalXp = Number.MAX_SAFE_INTEGER + 1;
    },
    (g) => {
      g.id = 0;
    },
    (g) => {
      g.founder = "true";
    },
  ]) {
    const value = group();
    mutate(value);
    assert.equal(isGroupLookup(value), false);
  }
});
