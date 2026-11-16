import test from "node:test";
import assert from "node:assert/strict";
import {
  groupPlayers,
  groupSkillSummary,
  widestGaps,
} from "../src/lib/groupProgress.ts";

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

test("widest gaps rank published spreads, skip single-member and level skills and ignore unknown members", () => {
  const three = {
    members: [{ name: "Alice" }, { name: "Bob" }, { name: "Cara" }],
  };
  const rows = groupPlayers(three, [
    player("Alice", { Mining: 40, Smithing: 50, Cooking: 20, Fishing: 9 }),
    player("Bob", { Mining: 12, Smithing: 50, Cooking: 20 }),
    player("Cara", { Smithing: 50, Cooking: 8 }, "sample"),
  ]);
  const skills = ["Mining", "Smithing", "Cooking", "Fishing"];
  assert.deepEqual(widestGaps(rows, skills), [
    {
      skill: "Mining",
      highest: 40,
      lowest: 12,
      gap: 28,
      leaders: ["Alice"],
      trailing: ["Bob"],
    },
  ]);
});

test("widest gaps break ties by skill order and honour the limit", () => {
  const rows = groupPlayers(group, [
    player("Alice", { Mining: 30, Smithing: 30, Cooking: 50 }),
    player("Bob", { Mining: 10, Smithing: 10, Cooking: 10 }),
  ]);
  const order = ["Smithing", "Mining", "Cooking"];
  assert.deepEqual(
    widestGaps(rows, order).map((g) => g.skill),
    ["Cooking", "Smithing", "Mining"],
  );
  assert.deepEqual(
    widestGaps(rows, order, 1).map((g) => g.skill),
    ["Cooking"],
  );
});

test("three-way standings share the gold on ties, measure each gap from the leader and keep unknown levels unknown", async () => {
  const { skillStandings } = await import("../src/lib/groupProgress.ts");
  const trio = {
    members: [{ name: "Alice" }, { name: "Bob" }, { name: "Cara" }],
  };
  const alice = player("Alice", { Mining: 70, Smithing: 50, Cooking: 30 });
  alice.levels.Cooking = 99; // a manual plan edit never leads
  const rows = groupPlayers(trio, [
    alice,
    player("Bob", { Mining: 70, Smithing: 41, Cooking: 45 }),
    player("Cara", { Mining: 58, Cooking: 45 }),
  ]);
  const view = (skill) =>
    skillStandings(rows, skill).map(({ level, top, behind }) => [
      level,
      top,
      behind,
    ]);
  assert.deepEqual(view("Mining"), [
    [70, true, 0],
    [70, true, 0],
    [58, false, 12],
  ]);
  assert.deepEqual(view("Smithing"), [
    [50, true, 0],
    [41, false, 9],
    [undefined, false, undefined],
  ]);
  assert.deepEqual(view("Cooking"), [
    [30, false, 15],
    [45, true, 0],
    [45, true, 0],
  ]);
  // One known level is still the highest, but there is nothing to trail.
  const solo = groupPlayers(trio, [player("Cara", { Mining: 5 })]);
  assert.deepEqual(
    skillStandings(solo, "Mining").map((s) => [s.level, s.top, s.behind]),
    [
      [undefined, false, undefined],
      [undefined, false, undefined],
      [5, true, undefined],
    ],
  );
});

test("lead counts split sole and shared leads over skills every ranked player publishes", async () => {
  const { leadCounts } = await import("../src/lib/groupProgress.ts");
  const a = player("A", { Mining: 50, Smithing: 40, Cooking: 10, Fishing: 5 });
  const b = player("B", { Mining: 60, Smithing: 40, Cooking: 1 });
  const skills = ["Mining", "Smithing", "Cooking", "Fishing", "Crafting"];
  assert.deepEqual(leadCounts([a, b], skills), [
    { led: 1, shared: 1 },
    { led: 1, shared: 1 },
  ]);
  const c = player("C", { Mining: 60, Smithing: 12, Cooking: 10 });
  assert.deepEqual(leadCounts([a, b, c], skills), [
    { led: 0, shared: 2 },
    { led: 0, shared: 2 },
    { led: 0, shared: 2 },
  ]);
  const hidden = player("D", {}, "sample");
  assert.deepEqual(leadCounts([a, hidden], skills), [
    { led: 0, shared: 0 },
    undefined,
  ]);
});

test("short labels drop a shared prefix only when four letters would clash", async () => {
  const { shortLabels } = await import("../src/lib/groupProgress.ts");
  assert.deepEqual(shortLabels(["GIM Alba", "GIM Bran", "Cara"]), [
    "ALBA",
    "BRAN",
    "CARA",
  ]);
  assert.deepEqual(shortLabels(["Bob", "Bobby"]), ["BOB", "BOBB"]);
});

test("quest difference lists completions no other player has, and leaves out players without quest data", async () => {
  const { questDifference } = await import("../src/lib/groupProgress.ts");
  const quests = (...done) => ({
    questProgress: {
      records: [
        ...done.map((title) => ({ title, status: "COMPLETED" })),
        { title: "Started Quest", status: "STARTED" },
      ],
    },
  });
  const a = quests("Cook's Assistant", "Dragon Slayer", "Druidic Ritual");
  const b = quests("cook's assistant", "Blood Pact");
  assert.deepEqual(questDifference([a, b]), [
    ["Dragon Slayer", "Druidic Ritual"],
    ["Blood Pact"],
  ]);
  assert.deepEqual(
    questDifference([a, b, quests("Dragon Slayer", "Ernest the Chicken")]),
    [["Druidic Ritual"], ["Blood Pact"], ["Ernest the Chicken"]],
  );
  assert.deepEqual(questDifference([a, {}, b]), [
    ["Dragon Slayer", "Druidic Ritual"],
    undefined,
    ["Blood Pact"],
  ]);
  assert.equal(questDifference([quests("Dragon Slayer"), {}]), undefined);
});
