import test from "node:test";
import assert from "node:assert/strict";
import { groupPlayers, groupSkillSummary } from "../src/lib/groupProgress.ts";

const group = {
  members: [{ name: "Alice" }, { name: "Bob" }, { name: "Missing" }],
};
const player = (name, levels, source = "hiscores") => ({
  name,
  levels,
  source,
  hiscoresLevels: source === "hiscores" ? { ...levels } : undefined,
});

test("group matching follows the published roster, normalizes names and excludes fictional progress", () => {
  const rows = groupPlayers(group, [
    player("BOB", { Smithing: 30 }),
    player("Alice", { Smithing: 99 }, "sample"),
    player("Other", { Smithing: 120 }),
  ]);
  assert.deepEqual(
    rows.map((r) => r.member.name),
    ["Alice", "Bob", "Missing"],
  );
  assert.equal(rows[0].profile, undefined);
  assert.equal(rows[1].profile.name, "BOB");
  assert.equal(rows[2].profile, undefined);
  assert.deepEqual(groupSkillSummary(rows, "Smithing"), {
    highest: 30,
    known: 1,
    leaders: ["Bob"],
  });
});

test("group comparisons retain ties and distinguish unknown levels from zero or ownership", () => {
  const rows = groupPlayers(group, [
    player("Alice", { Smithing: 50 }),
    player("Bob", { Smithing: 50 }),
  ]);
  assert.deepEqual(groupSkillSummary(rows, "Smithing"), {
    highest: 50,
    known: 2,
    leaders: ["Alice", "Bob"],
  });
  assert.deepEqual(groupSkillSummary(rows, "Mining"), {
    highest: undefined,
    known: 0,
    leaders: [],
  });
});

test("manual planning edits and legacy unsourced levels cannot become published group leaders", () => {
  const alice = player("Alice", { Smithing: 30 });
  alice.levels.Smithing = 120;
  const bob = { name: "Bob", source: "hiscores", levels: { Smithing: 110 } };
  const rows = groupPlayers(group, [alice, bob]);
  assert.deepEqual(groupSkillSummary(rows, "Smithing"), {
    highest: 30,
    known: 1,
    leaders: ["Alice"],
  });
});
