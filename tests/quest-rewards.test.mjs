import test from "node:test";
import assert from "node:assert/strict";
import {
  experienceRewards,
  groupRewards,
  lampLabel,
  musicTrackName,
  rewardLineReferences,
  rewardSummary,
  rewardTileArt,
} from "../src/lib/questRewards.ts";
import { QUESTS } from "../src/data.ts";
import { QUEST_MUSIC, REWARD_LINKS, REWARD_REFERENCES } from "../src/questsImported.ts";

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

test("hand-written quests show their quest points in the quest point chip", () => {
  const points = { "cooks-assistant": "1", "swept-away": "2", "waterfall-quest": "1", "tree-gnome-village": "2" };
  for (const [id, n] of Object.entries(points)) {
    const chip = rewardSummary(QUESTS.find((q) => q.id === id).rewards).find((c) => c.group === "questPoints");
    assert.equal(chip?.text, `${n} quest point${n === "1" ? "" : "s"}`, id);
  }
});

test("a bracket that restates a skill's XP is not counted twice", () => {
  const { fixed } = experienceRewards([
    "A total of 8,500 Defence XP (via two charges of 4,250 Defence XP each)",
    "375,000 Divination XP (25,000 Divination XP is awarded each time)",
    "500 Thieving XP (and 300 Agility XP)",
  ]);
  assert.deepEqual(Object.fromEntries(fixed), { Defence: 8500, Divination: 375000, Thieving: 500, Agility: 300 });
  const xpFor = (id) =>
    Object.fromEntries(experienceRewards(groupRewards(QUESTS.find((q) => q.id === id).rewards).experience).fixed);
  assert.deepEqual(xpFor("elemental-workshop-iii"), { Smithing: 8500, Defence: 8500 });
  assert.deepEqual(xpFor("the-restless-ghost"), {});
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

test("reward tiles use the item sprite, else a title, else the first linked kind, else the group fallback", () => {
  const pages = {
    "Ring of charos": { kind: "item", image: "Ring_of_charos.png" },
    "Werewolf Agility Course": { kind: "place" },
    "Ancient Magicks": { kind: "spell" },
    "Body Parts": { kind: "music" },
    Eblis: { kind: "npc" },
    Titles: { kind: "title" },
    "Build mode": { kind: "other" },
    "Trahaearn exoskeleton set": { kind: "other" },
  };
  const art = (line, group, links) => rewardTileArt(line, group, links, pages);
  assert.deepEqual(
    art("The Ring of charos, for the Werewolf Agility Course", "items", {
      "Werewolf Agility Course": "Werewolf Agility Course",
      "Ring of charos": "Ring of charos",
    }),
    { image: "Ring_of_charos.png" },
  );
  assert.deepEqual(art("Access to the course", "unlocks", { course: "Werewolf Agility Course" }), { icon: "place" });
  assert.deepEqual(art("Ability to use Ancient Magicks", "unlocks", { "Ancient Magicks": "Ancient Magicks" }), { icon: "spell" });
  assert.deepEqual(art("Body Parts", "unlocks", { "Body Parts": "Body Parts" }), { icon: "music" });
  assert.deepEqual(art("Buy from Eblis", "items", { Eblis: "Eblis" }), { icon: "npc" });
  assert.deepEqual(art("The of the Elves title", "unlocks", { "of the Elves": "Titles" }), { icon: "title" });
  assert.deepEqual(art("The Yt'Haar- title", "unlocks", undefined), { icon: "title" });
  // "other" pages are skipped for a later linked kind, then fall back to the group's icon.
  assert.deepEqual(art("floor styles for Eblis", "unlocks", { "floor styles": "Build mode", Eblis: "Eblis" }), { icon: "npc" });
  assert.deepEqual(art("floor styles", "unlocks", { "floor styles": "Build mode" }), { icon: "unlock" });
  assert.deepEqual(art("The set", "items", { set: "Trahaearn exoskeleton set" }), { icon: "item" });
  assert.deepEqual(art("500 coins", "items", undefined), { icon: "item" });
});

test("reward line references link without inline art and map kinds onto GameText's", () => {
  const references = rewardLineReferences(
    { "Ring of charos": "Ring of charos", "Experiment cave": "Experiment cave", Eblis: "Eblis" },
    {
      "Ring of charos": { kind: "item", image: "Ring_of_charos.png" },
      "Experiment cave": { kind: "place" },
      Eblis: { kind: "npc" },
    },
  );
  assert.deepEqual(references, [
    { name: "Ring of charos", wiki: "Ring of charos", kind: "item" },
    { name: "Experiment cave", wiki: "Experiment cave", kind: "place" },
    { name: "Eblis", wiki: "Eblis", kind: "reference" },
  ]);
  assert.equal(musicTrackName("Melzar's Maze (music track)"), "Melzar's Maze");
  assert.equal(musicTrackName("Freneskae (music)"), "Freneskae");
  assert.equal(musicTrackName("Bone Dry"), "Bone Dry");
});

test("imported reward links classify the Wiki pages they point at", () => {
  const linksOf = (id, line) => {
    const quest = QUESTS.find((q) => q.id === id);
    return REWARD_LINKS[id][quest.rewards.findIndex((text) => text.startsWith(line))];
  };
  const fenkenstrain = linksOf("creature-of-fenkenstrain", "The Ring of charos");
  assert.equal(fenkenstrain["Ring of charos"], "Ring of charos");
  assert.deepEqual(REWARD_REFERENCES["Ring of charos"], { kind: "item", image: "Ring_of_charos.png" });
  assert.equal(REWARD_REFERENCES[linksOf("creature-of-fenkenstrain", "Access to the Experiment cave")["Experiment cave"]].kind, "place");
  assert.equal(REWARD_REFERENCES[linksOf("desert-treasure", "Ability to use Ancient Magicks")["Ancient Magicks"]].kind, "spell");
  assert.equal(REWARD_REFERENCES[linksOf("plagues-end", "Access to the city")["Prifddinas"]].kind, "place");
  assert.ok(QUESTS.find((q) => q.id === "plagues-end").rewards.includes("The of the Elves title"));
  assert.equal(REWARD_REFERENCES[linksOf("plagues-end", "The of the Elves title")["of the Elves"]].kind, "title");
  assert.deepEqual(QUEST_MUSIC["creature-of-fenkenstrain"], ["Body Parts"]);
  // Every linked page is in the shared table.
  for (const lines of Object.values(REWARD_LINKS))
    for (const links of Object.values(lines))
      for (const page of Object.values(links)) assert.ok(REWARD_REFERENCES[page], page);
});

test("every catalogue reward lands in exactly one group", () => {
  for (const quest of QUESTS) {
    const groups = groupRewards(quest.rewards);
    assert.equal(Object.values(groups).flat().length, quest.rewards.length, quest.id);
  }
});
