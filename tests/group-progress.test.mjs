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
      levelGap: 28,
      players: [
        { name: "Alice", level: 40 },
        { name: "Bob", level: 12 },
      ],
    },
  ]);
});

const withXp = (name, levels, xp) => ({
  ...player(name, levels),
  statistics: {
    skills: Object.fromEntries(
      Object.entries(xp).map(([skill, value]) => [skill, { xp: value }]),
    ),
  },
});

test("widest gaps rank by XP, keep maxed players with an XP spread and list every player", () => {
  const three = {
    members: [{ name: "Alice" }, { name: "Bob" }, { name: "Cara" }],
  };
  const rows = groupPlayers(three, [
    withXp(
      "Alice",
      { Attack: 99, Mining: 90, Cooking: 50 },
      { Attack: 200_000_000, Mining: 5_346_332, Cooking: 101_333 },
    ),
    withXp(
      "Bob",
      { Attack: 99, Mining: 99, Cooking: 10 },
      { Attack: 13_034_431, Mining: 13_034_431, Cooking: 1_154 },
    ),
    withXp(
      "Cara",
      { Attack: 99, Mining: 70, Cooking: 30 },
      { Attack: 13_034_431, Mining: 737_627, Cooking: 13_363 },
    ),
  ]);
  const gaps = widestGaps(rows, ["Mining", "Cooking", "Attack"]);
  // Attack has no level spread at all, yet its 187m XP spread leads.
  assert.deepEqual(
    gaps.map((g) => [g.skill, g.xpGap, g.levelGap]),
    [
      ["Attack", 186_965_569, 0],
      ["Mining", 12_296_804, 29],
      ["Cooking", 100_179, 40],
    ],
  );
  assert.deepEqual(gaps[1].players, [
    { name: "Alice", level: 90, xp: 5_346_332 },
    { name: "Bob", level: 99, xp: 13_034_431 },
    { name: "Cara", level: 70, xp: 737_627 },
  ]);
  assert.deepEqual(
    widestGaps(rows, ["Mining", "Cooking", "Attack"], 1).map((g) => g.skill),
    ["Attack"],
  );
});

test("widest gaps rank a skill by level gap after the XP gaps when a player has no published XP", () => {
  const rows = groupPlayers(group, [
    withXp("Alice", { Mining: 90, Cooking: 20 }, { Cooking: 4_470 }),
    withXp("Bob", { Mining: 10, Cooking: 19 }, { Mining: 1_154, Cooking: 3_973 }),
  ]);
  assert.deepEqual(widestGaps(rows, ["Mining", "Cooking"]), [
    {
      skill: "Cooking",
      xpGap: 497,
      levelGap: 1,
      players: [
        { name: "Alice", level: 20, xp: 4_470 },
        { name: "Bob", level: 19, xp: 3_973 },
      ],
    },
    {
      skill: "Mining",
      levelGap: 80,
      players: [
        { name: "Alice", level: 90 },
        { name: "Bob", level: 10, xp: 1_154 },
      ],
    },
  ]);
});

test("skill sorts keep game order, put the widest gaps first, or put a player's deepest deficits first", async () => {
  const { sortSkills } = await import("../src/lib/groupProgress.ts");
  const trio = {
    members: [{ name: "Alice" }, { name: "Bob" }, { name: "Cara" }],
  };
  const rows = groupPlayers(trio, [
    withXp(
      "Alice",
      { Attack: 99, Mining: 90, Cooking: 50, Fishing: 40 },
      { Attack: 200_000_000, Mining: 5_346_332, Cooking: 101_333, Fishing: 37_224 },
    ),
    withXp(
      "Bob",
      { Attack: 99, Mining: 99, Cooking: 10, Fishing: 40 },
      { Attack: 13_034_431, Mining: 13_034_431, Cooking: 1_154, Fishing: 37_224 },
    ),
    // Cara has no published Cooking XP, so her Cooking deficit counts in levels.
    withXp(
      "Cara",
      { Attack: 99, Mining: 70, Cooking: 30 },
      { Attack: 13_034_431, Mining: 737_627 },
    ),
  ]);
  const order = ["Fishing", "Cooking", "Mining", "Attack"];
  assert.deepEqual(sortSkills(rows, order, "game"), order);
  assert.deepEqual(sortSkills(rows, order, "gap"), [
    "Attack",
    "Mining",
    "Cooking",
    "Fishing",
  ]);
  // Bob trails in Attack and Cooking; he leads Mining and ties Fishing.
  assert.deepEqual(sortSkills(rows, order, "trails:1"), [
    "Attack",
    "Cooking",
    "Fishing",
    "Mining",
  ]);
  // Cara's XP deficits come first; Cooking (level only) follows; no Fishing level.
  assert.deepEqual(sortSkills(rows, order, "trails:2"), [
    "Attack",
    "Mining",
    "Cooking",
    "Fishing",
  ]);
  // Level gaps ignore XP, so the all-99 Attack falls to the end with the tied Fishing.
  assert.deepEqual(sortSkills(rows, order, "level-gap"), [
    "Cooking",
    "Mining",
    "Fishing",
    "Attack",
  ]);
  // Alice leads Attack by 187m XP and Cooking by 20 levels; she ties Fishing and trails Mining.
  assert.deepEqual(sortSkills(rows, order, "leads:0"), [
    "Attack",
    "Cooking",
    "Fishing",
    "Mining",
  ]);
  // Bob leads only Mining, by 7.7m XP over Alice.
  assert.deepEqual(sortSkills(rows, order, "leads:1"), [
    "Mining",
    "Fishing",
    "Cooking",
    "Attack",
  ]);
});

test("roster picks add up to three, replace the third when full and never drop below two", async () => {
  const { togglePick } = await import("../src/lib/groupProgress.ts");
  assert.deepEqual(togglePick(["a", "b"], "c"), ["a", "b", "c"]);
  assert.deepEqual(togglePick(["a", "b", "c"], "d"), ["a", "b", "d"]);
  // Removing keeps the others in their picked order.
  assert.deepEqual(togglePick(["a", "b", "c"], "a"), ["b", "c"]);
  assert.deepEqual(togglePick(["a", "b", "c"], "c"), ["a", "b"]);
  assert.deepEqual(togglePick(["a", "b"], "a"), ["a", "b"]);
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
