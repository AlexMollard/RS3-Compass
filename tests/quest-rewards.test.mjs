import test from "node:test";
import assert from "node:assert/strict";
import { groupRewards, rewardHighlights } from "../src/lib/questRewards.ts";
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

test("highlights sum fixed skill XP, mark lamps and keep lamp skills out of fixed XP", () => {
  assert.deepEqual(
    rewardHighlights([
      "2 quest points",
      "250 Magic and 250 Strength XP, plus combat and Prayer lamps",
      "250 Magic XP lamp and 250 Runecrafting XP",
      "100 Cooking XP and 150 Thieving XP",
      "Crandor access and a maze key for Melzar's Maze",
    ], 10),
    [
      { kind: "quest-points", points: 2 },
      { kind: "skill-xp", skill: "Strength", xp: 250 },
      { kind: "skill-xp", skill: "Runecrafting", xp: 250 },
      { kind: "skill-xp", skill: "Cooking", xp: 100 },
      { kind: "skill-xp", skill: "Thieving", xp: 150 },
      { kind: "lamp" },
      { kind: "unlock", text: "Crandor access and a maze key for Melzar's Maze" },
    ],
  );
  assert.equal(rewardHighlights(["1 quest point", "Wolfbane dagger"]).length, 1);
});

test("every catalogue reward lands in exactly one group", () => {
  for (const quest of QUESTS) {
    const groups = groupRewards(quest.rewards);
    assert.equal(Object.values(groups).flat().length, quest.rewards.length, quest.id);
  }
});
