import test from "node:test";
import assert from "node:assert/strict";
import { experienceRewards, groupRewards, lampLabel, rewardSummary } from "../src/lib/questRewards.ts";
import { QUESTS } from "../src/data.ts";

test("reward lines sort into quest points, experience, unlocks and items", () => {
  assert.deepEqual(
    groupRewards([
      "1 quest point",
      "13,750 Attack XP",
      "Three lamps granting 1,000 XP each",
      "Access to the troll cave in the well",
      "The Yeti title and access to Yeti Town",
      "Crandor access and a maze key for Melzar's Maze",
      "Wolfbane dagger",
      "1,200 coins",
    ]),
    {
      questPoints: ["1 quest point"],
      experience: ["13,750 Attack XP", "Three lamps granting 1,000 XP each"],
      unlocks: [
        "Access to the troll cave in the well",
        "The Yeti title and access to Yeti Town",
        "Crandor access and a maze key for Melzar's Maze",
      ],
      items: ["Wolfbane dagger", "1,200 coins"],
    },
  );
});

test("experience splits fixed skill XP from lamps", () => {
  const { fixed, lamps } = experienceRewards([
    "250 Magic and 250 Strength XP, plus combat and Prayer lamps",
    "250 Magic XP lamp and 250 Runecrafting XP",
    "100 Cooking XP and 150 Thieving XP",
  ]);
  assert.deepEqual(Object.fromEntries(fixed), {
    Strength: 250,
    Runecrafting: 250,
    Cooking: 100,
    Thieving: 150,
  });
  assert.deepEqual(
    lamps.map((l) => [l.skill, l.xp]),
    [[undefined, undefined], ["Magic", 250]],
  );
});

test("lamp XP reads every way the Wiki writes it", () => {
  const { fixed, lamps } = experienceRewards([
    "10,000 Thieving XP Thieving XP lamp",
    "90,000 Agility XP Agility lamp",
    "50,000 Mining XP Mining Lamp",
    "Mining XP lamp (30,000 Mining XP)",
    "Slayer XP lamp (100,000 Slayer XP; requires 87 Slayer)",
    "Tortle lamp of farming, which gives 1,000 Farming XP",
    "Glossy lamp granting 110,000 Slayer XP, requiring Slayer",
    "Three 100 combat XP lamps",
  ]);
  assert.equal(fixed.size, 0);
  assert.deepEqual(
    lamps.map(({ skill, xp, count }) => [skill, xp, count]),
    [
      ["Thieving", 10000, 1],
      ["Agility", 90000, 1],
      ["Mining", 50000, 1],
      ["Mining", 30000, 1],
      ["Slayer", 100000, 1],
      ["Farming", 1000, 1],
      ["Slayer", 110000, 1],
      [undefined, 100, 3],
    ],
  );
});

test("a lamp with no amount keeps the Wiki's own words", () => {
  const [medium, huge, plain] = experienceRewards([
    "Medium XP lamp",
    "3 huge XP lamps",
    "lamp",
  ]).lamps.map(lampLabel);
  assert.deepEqual(medium, { title: "Medium XP lamp" });
  assert.deepEqual(huge, { title: "3 huge XP lamps" });
  assert.deepEqual(plain, { title: "lamp" });
  const [list] = experienceRewards(["500 Prayer, 1,000 Agility and 1,500 combat XP lamps"]).lamps.map(lampLabel);
  assert.deepEqual(list, { title: "500 Prayer, 1,000 Agility and 1,500 combat XP lamps" });
  const [sized] = experienceRewards(["25,000 Mining XP lamp (requires level 65 Mining)"]).lamps.map(lampLabel);
  assert.deepEqual(sized, { title: "Mining lamp", detail: "25,000 XP · needs level 65" });
  const [choice] = experienceRewards([
    "1 large combat XP lamp in one of the following skills: Attack, Strength or Prayer",
  ]).lamps.map(lampLabel);
  assert.deepEqual(choice, {
    title: "Lamp · your choice of skill",
    detail: "1 large combat XP lamp in one of the following skills: Attack, Strength or Prayer",
  });
});

test("lamp XP never counts as fixed XP (Secrets of Amberfell)", () => {
  const { fixed, lamps } = experienceRewards([
    "Combat XP lamp (requires level 30 in the chosen skill; grants 2,500 experience in one of: Attack, Strength, Defence, Constitution, Ranged, Magic, Prayer or Necromancy)",
    "Construction XP lamp (requires level 30 Construction; grants 2,500 Construction XP)",
    "Herblore XP (requires level 35 Herblore; grants 2,500 Herblore XP)",
    "25,000 Mining XP lamp (requires level 65 Mining)",
  ]);
  assert.equal(fixed.size, 0);
  assert.deepEqual(
    lamps.map(({ skill, xp, level, choice }) => ({ skill, xp, level, choice })),
    [
      { skill: undefined, xp: 2500, level: 30, choice: true },
      { skill: "Construction", xp: 2500, level: 30, choice: false },
      { skill: "Herblore", xp: 2500, level: 35, choice: false },
      { skill: "Mining", xp: 25000, level: 65, choice: false },
    ],
  );
  assert.equal(
    lamps[0].options,
    "Attack, Strength, Defence, Constitution, Ranged, Magic, Prayer or Necromancy",
  );
  assert.equal(lamps.length, 4);
  const [choice] = experienceRewards([
    "2 7,000 Combat XP lamp in a choice of Attack, Strength or Summoning (Summoning must be level 30 or higher)",
  ]).lamps;
  assert.deepEqual(
    { choice: choice.choice, options: choice.options, level: choice.level },
    { choice: true, options: "Attack, Strength or Summoning", level: 30 },
  );
  assert.equal(
    rewardSummary(["3 quest points", "Construction XP lamp (requires level 30 Construction; grants 2,500 Construction XP)", "Two XP lamps"])[1].text,
    "3 XP lamps",
  );
});

test("the summary shows every reward group, not just quest points", () => {
  assert.deepEqual(
    rewardSummary([
      "2 quest points",
      "Pirate's treasure casket containing 450 coins, an emerald and a gold ring",
      "Access to paid banana plantation work",
    ]),
    [
      { group: "questPoints", text: "2 quest points", more: 0 },
      {
        group: "items",
        text: "Pirate's treasure casket containing 450 coins, an emerald and a gold ring",
        more: 0,
      },
      { group: "unlocks", text: "Access to paid banana plantation work", more: 0 },
    ],
  );
  assert.deepEqual(
    rewardSummary(["1 quest point", "13,750 Attack XP", "Wolfbane dagger", "1,200 coins"]),
    [
      { group: "questPoints", text: "1 quest point", more: 0 },
      { group: "experience", text: "13,750 Attack XP", more: 0, skill: "Attack" },
      { group: "items", text: "Wolfbane dagger", more: 1 },
    ],
  );
  assert.equal(
    rewardSummary(["100 Cooking XP and 150 Thieving XP", "Two XP lamps"])[0].text,
    "250 XP in 2 skills + 2 XP lamps",
  );
});

test("every catalogue reward lands in exactly one group", () => {
  for (const quest of QUESTS) {
    const groups = groupRewards(quest.rewards);
    assert.equal(Object.values(groups).flat().length, quest.rewards.length, quest.id);
  }
});
