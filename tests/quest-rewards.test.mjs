import test from "node:test";
import assert from "node:assert/strict";
import { experienceTotals, groupRewards, rewardSummary } from "../src/lib/questRewards.ts";
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

test("experience totals sum fixed skill XP and keep lamp skills out of it", () => {
  const { xp, lamp } = experienceTotals([
    "250 Magic and 250 Strength XP, plus combat and Prayer lamps",
    "250 Magic XP lamp and 250 Runecrafting XP",
    "100 Cooking XP and 150 Thieving XP",
  ]);
  assert.deepEqual(Object.fromEntries(xp), {
    Strength: 250,
    Runecrafting: 250,
    Cooking: 100,
    Thieving: 150,
  });
  assert.equal(lamp, true);
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
    "250 XP in 2 skills + lamps",
  );
});

test("every catalogue reward lands in exactly one group", () => {
  for (const quest of QUESTS) {
    const groups = groupRewards(quest.rewards);
    assert.equal(Object.values(groups).flat().length, quest.rewards.length, quest.id);
  }
});
