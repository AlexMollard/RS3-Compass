import type { QuestRecord, ItemReference } from "./data";
import type { CombatPlan } from "./combatData";
import type { LocationRecord } from "./locations";

// RuneScape Wiki quest, quick-guide, starter and item articles, checked 4 November 2026.
// Starter coordinates are the quest map links or the corresponding NPC/object map.
export const FOUNDATION_QUESTS: QuestRecord[] = [
  {
    id: "sheep-shearer",
    name: "Sheep Shearer (miniquest)",
    kind: "miniquest",
    icon: "Sheep_Shearer_(miniquest)_icon.png",
    artwork: "Sheep_Shearer_(miniquest).png",
    members: false,
    difficulty: "Novice",
    length: "Very Short",
    start: {
      npc: "Fred the Farmer",
      npcWiki: "Fred the Farmer",
      image: "Fred_the_Farmer_chathead.png",
      location: "Lumbridge",
      meetingPoint:
        "Inside Fred's house north of Lumbridge Market, beside the sheep pen.",
      map: { x: 3206, y: 3290, plane: 0 },
    },
    why: "A very short introduction to gathering and spinning wool for early Crafting experience.",
    requirements: [],
    questRequirements: [],
    supplies: [
      "20 unnoted balls of wool, or collect and spin ordinary wool during the miniquest; deliveries can be split.",
    ],
    rewards: [
      "300 Crafting XP",
      "60 coins, plus another 1,940 coins by speaking to Fred afterwards",
    ],
    wiki: "Sheep_Shearer_(miniquest)",
  },
  {
    id: "the-blood-pact",
    name: "The Blood Pact",
    icon: "The_Blood_Pact_icon.png",
    artwork: "The_Blood_Pact.png",
    members: false,
    difficulty: "Novice",
    length: "Short",
    start: {
      npc: "Xenia",
      npcWiki: "Xenia",
      image: "Xenia_chathead.png",
      location: "Lumbridge cemetery",
      meetingPoint:
        "In the cemetery by the Lumbridge Catacombs entrance, south of the church.",
      map: { x: 3244, y: 3198, plane: 0 },
    },
    why: "A beginner combat introduction that unlocks the Lumbridge Catacombs and several starter weapons.",
    requirements: [],
    questRequirements: [],
    supplies: ["Optional: combat equipment and food for the three fights."],
    rewards: [
      "1 quest point",
      "A lamp granting 100 XP each in Attack, Strength, Defence, Ranged and Magic",
      "Lumbridge Catacombs access and the cultists' weapons",
    ],
    wiki: "The_Blood_Pact",
  },
  {
    id: "the-restless-ghost",
    name: "The Restless Ghost",
    icon: "The_Restless_Ghost_icon.png",
    artwork: "The_Restless_Ghost.png",
    members: false,
    difficulty: "Novice",
    length: "Short",
    start: {
      npc: "Father Aereck",
      npcWiki: "Father Aereck",
      image: "Father_Aereck_chathead.png",
      location: "Lumbridge Church",
      meetingPoint: "Inside the church east of Lumbridge Castle.",
      map: { x: 3246, y: 3205, plane: 0 },
    },
    why: "Earn early Prayer experience and a ghostspeak amulet useful in later quests.",
    requirements: [],
    questRequirements: [],
    supplies: ["Optional: food for the swamp encounter."],
    rewards: [
      "1 quest point",
      "125 Prayer XP lamp and five ancient bones worth 200 Prayer XP each",
      "Ghostspeak amulet and gravestone upgrades",
    ],
    wiki: "The_Restless_Ghost",
  },
  {
    id: "duck-quest",
    name: "Duck Quest",
    icon: "Duck_Quest_icon.png",
    artwork: "Duck_Quest.png",
    members: false,
    difficulty: "Novice",
    length: "Short to Medium",
    start: {
      npc: "Fishing spot?",
      npcWiki: "Fishing spot?",
      image: "Fishing_spot?.png",
      location: "Draynor Village",
      meetingPoint:
        "Investigate the strange fishing spot on the riverbank south of Draynor bank, near the willows.",
      map: { x: 3089, y: 3224, plane: 0 },
    },
    why: "A permanently available duckling adventure with a pet and access to Paddlington.",
    requirements: [],
    questRequirements: [],
    supplies: [
      "1 duck food (also available from a sack south of Falador Park)",
      "1 vial of water",
    ],
    rewards: [
      "1 quest point",
      "500 Herblore XP lamp",
      "Duckling pet and access to Paddlington",
    ],
    wiki: "Duck_Quest",
  },
  {
    id: "necromancy",
    name: "Necromancy!",
    icon: "Necromancy!_icon.png",
    artwork: "Necromancy!.png",
    members: false,
    difficulty: "Novice",
    length: "Short",
    start: {
      npc: "Underworld portal",
      npcWiki: "Underworld portal",
      image: "Underworld_portal.png",
      location: "Draynor Village",
      meetingPoint:
        "Investigate the white light portal just north of Draynor lodestone.",
      map: { x: 3103, y: 3312, plane: 0 },
    },
    why: "Learn the basics of Necromancy and gain starter equipment and access to its abilities.",
    requirements: [],
    questRequirements: [],
    supplies: [],
    rewards: [
      "1 quest point and 200 Necromancy XP",
      "Tier 10 death guard and skull lantern, and 25 ectoplasm",
      "Necromancy abilities and passing bracelet travel; claim free deathwarden robes from Sostratus afterwards",
    ],
    wiki: "Necromancy!",
  },
  {
    id: "whats-mine-is-yours",
    name: "What's Mine is Yours",
    icon: "What's_Mine_is_Yours_icon.png",
    artwork: "What's_Mine_is_Yours.png",
    members: false,
    difficulty: "Novice",
    length: "Medium",
    start: {
      npc: "Doric",
      npcWiki: "Doric",
      image: "Doric_chathead.png",
      location: "Doric's hut",
      meetingPoint:
        "Inside Doric's hut outside Taverley's gates, north-west of Falador lodestone.",
      map: { x: 2959, y: 3439, plane: 0 },
    },
    why: "An introduction to mining and smithing with a useful early experience reward.",
    requirements: [{ skill: "Smithing", level: 5 }],
    questRequirements: [],
    supplies: ["Optional: weapon, armour and food for the low-level fights."],
    rewards: [
      "1 quest point unless already awarded for the old Doric's Quest",
      "1,000 Mining XP and 400 Smithing XP",
      "180 coins and a Gofannon amulet",
    ],
    wiki: "What's_Mine_is_Yours",
  },
  {
    id: "once-upon-a-slime",
    name: "Once Upon a Slime",
    icon: "Once_Upon_a_Slime_icon.png",
    artwork: "Once_Upon_a_Slime.png",
    members: false,
    difficulty: "Novice",
    length: "Short to Medium",
    start: {
      npc: "Peter",
      npcWiki: "Peter",
      image: "Peter_chathead.png",
      location: "Rimmington",
      meetingPoint: "Next to the well in Rimmington.",
      map: { x: 2956, y: 3207, plane: 0 },
    },
    why: "A light-hearted adventure with a large early Cooking lamp and a slime pet.",
    requirements: [],
    questRequirements: [],
    supplies: [],
    rewards: [
      "1 quest point",
      "2,500 Cooking XP lamp",
      "Lil Miss Gloop pet and a bucket; talk to Eva afterwards for King Slime's Top Hat override",
    ],
    wiki: "Once_Upon_a_Slime",
  },
  {
    id: "gertrudes-cat",
    name: "Gertrude's Cat",
    icon: "Gertrude's_Cat_icon.png",
    artwork: "Gertrude's_Cat.png",
    members: false,
    difficulty: "Novice",
    length: "Medium",
    start: {
      npc: "Gertrude",
      npcWiki: "Gertrude",
      image: "Gertrude_chathead.png",
      location: "Varrock",
      meetingPoint:
        "Inside her house west of Varrock, south of the Cooks' Guild.",
      map: { x: 3151, y: 3411, plane: 0 },
    },
    why: "Rescue a missing cat and receive your first kitten and Cooking experience.",
    requirements: [],
    questRequirements: [],
    supplies: [
      "1 raw sardine",
      "1 bucket of milk",
      "1 doogle leaves (available behind Gertrude's house)",
      "100 coins",
    ],
    rewards: [
      "1 quest point and 1,525 Cooking XP lamp",
      "A kitten, chocolate cake and stew",
    ],
    wiki: "Gertrude's_Cat",
  },
  {
    id: "goblin-diplomacy",
    name: "Goblin Diplomacy",
    icon: "Goblin_Diplomacy_icon.png",
    artwork: "Goblin_Diplomacy.png",
    members: false,
    difficulty: "Novice",
    length: "Short",
    start: {
      npc: "General Bentnoze",
      npcWiki: "General Bentnoze",
      image: "General_Bentnoze_chathead.png",
      location: "Goblin Village",
      meetingPoint:
        "Speak to either general in the generals' hut in Goblin Village, north of Falador.",
      map: { x: 2958, y: 3513, plane: 0 },
    },
    why: "Resolve the goblin generals' dispute for a generous early quest-point reward.",
    requirements: [],
    questRequirements: [],
    supplies: [
      "3 goblin mail (obtainable in the village)",
      "1 blue dye and 1 orange dye; alternatively make orange from red dye and yellow dye.",
      "For dye-making instead: 2 woad leaves, 3 redberries, 2 onions and 15 coins for three dyes.",
    ],
    rewards: ["5 quest points", "200 Crafting XP lamp and a gold bar"],
    wiki: "Goblin_Diplomacy",
  },
  {
    id: "ernest-the-chicken",
    name: "Ernest the Chicken",
    icon: "Ernest_the_Chicken_icon.png",
    artwork: "Ernest_the_Chicken.png",
    members: false,
    difficulty: "Novice",
    length: "Medium",
    start: {
      npc: "Veronica",
      npcWiki: "Veronica",
      image: "Veronica_chathead.png",
      location: "Draynor Manor",
      meetingPoint: "South of the Draynor Manor gates.",
      map: { x: 3112, y: 3329, plane: 0 },
    },
    why: "A manor puzzle with four quest points and an early coin reward.",
    requirements: [],
    questRequirements: [],
    supplies: ["Optional: food for the manor grounds and skeleton."],
    rewards: [
      "4 quest points and 3,000 coins",
      "10 eggs and 300 feathers",
      "Access to the killerwatt plane (members only)",
    ],
    wiki: "Ernest_the_Chicken",
  },
];

export const FOUNDATION_COMBAT: Record<string, CombatPlan> = {
  "sheep-shearer": {
    required: [],
    hazards: [{ name: "Ram", wiki: "Ram", image: "Ram.png", level: 2 }],
    notes: ["No kills are required; avoid the rams in the sheep pen."],
  },
  "the-blood-pact": {
    required: [
      { name: "Kayle", wiki: "Kayle", image: "Kayle.png", level: 1 },
      { name: "Caitlin", wiki: "Caitlin", image: "Caitlin.png", level: 1 },
      { name: "Reese", wiki: "Reese", image: "Reese.png", level: 1 },
    ],
    hazards: [],
    notes: [
      "Defeat all three cultists; killing them after defeat is a dialogue choice, not required. Their weapons can help during the quest.",
    ],
  },
  "the-restless-ghost": {
    required: [],
    hazards: [
      {
        name: "Skeleton warlock",
        wiki: "Skeleton warlock",
        image: "Skeleton_warlock.png",
        level: 7,
      },
    ],
    notes: [
      "The warlock appears when the skull is retrieved; you can leave instead of fighting.",
    ],
  },
  "duck-quest": { required: [], hazards: [], notes: ["No combat required."] },
  // The Wiki publishes no brute artwork; omit it rather than show the wrong enemy.
  necromancy: {
    required: [
      { name: "Ghost troll brute", wiki: "Ghost troll brute", level: 3 },
      {
        name: "Ghost troll lout",
        wiki: "Ghost troll lout",
        image: "Ghost_troll_lout.png",
        level: 3,
      },
    ],
    hazards: [],
    notes: [
      "Both trolls must be defeated using Necromancy. The scripted death at the portal is safe and does not lose items.",
    ],
  },
  "whats-mine-is-yours": {
    required: [
      {
        name: "Living rock brawler × 4",
        wiki: "Living rock brawler",
        image: "Living_rock_brawler.png",
        level: 1,
      },
    ],
    hazards: [],
    notes: [
      "Four level-1 brawlers must be defeated; take equipment if combat is new to you.",
    ],
  },
  "once-upon-a-slime": {
    required: [],
    hazards: [],
    notes: ["No combat required."],
  },
  "gertrudes-cat": {
    required: [],
    hazards: [],
    notes: ["No combat required."],
  },
  "goblin-diplomacy": {
    required: [],
    hazards: [],
    notes: [
      "No combat required; goblin mail can be found without killing goblins.",
    ],
  },
  "ernest-the-chicken": {
    required: [],
    hazards: [
      {
        name: "Skeleton",
        wiki: "Skeleton (Draynor Manor)",
        image: "Skeleton_(Draynor_Manor).png",
        level: 11,
      },
    ],
    notes: [
      "The skeleton is optional. Beware the attacking trees in the manor grounds.",
    ],
  },
};

export const FOUNDATION_ITEMS: ItemReference[] = [
  {
    name: "Ball of wool",
    wiki: "Ball of wool",
    image: "Ball_of_wool.png",
    aliases: ["balls of wool"],
  },
  { name: "Duck food", wiki: "Duck food", image: "Duck_food.png" },
  {
    name: "Raw sardine",
    wiki: "Raw sardine",
    image: "Raw_sardine.png",
    aliases: ["raw sardines"],
  },
  {
    name: "Doogle leaves",
    wiki: "Doogle leaves",
    image: "Doogle_leaves.png",
    aliases: ["doogle leaf"],
  },
  { name: "Goblin mail", wiki: "Goblin mail", image: "Goblin_mail.png" },
  { name: "Blue dye", wiki: "Blue dye", image: "Blue_dye.png" },
  { name: "Orange dye", wiki: "Orange dye", image: "Orange_dye.png" },
  { name: "Red dye", wiki: "Red dye", image: "Red_dye.png" },
  { name: "Yellow dye", wiki: "Yellow dye", image: "Yellow_dye.png" },
  {
    name: "Woad leaf",
    wiki: "Woad leaf",
    image: "Woad_leaf_1.png",
    aliases: ["woad leaves"],
  },
  {
    name: "Redberries",
    wiki: "Redberries",
    image: "Redberries.png",
    aliases: ["redberry"],
  },
  { name: "Onion", wiki: "Onion", image: "Onion.png", aliases: ["onions"] },
];

export const FOUNDATION_LOCATIONS: Record<string, LocationRecord> = {
  "Lumbridge cemetery": {
    name: "Lumbridge cemetery",
    wiki: "Lumbridge cemetery",
    image: "Lumbridge_cemetery.png",
    members: false,
    summary:
      "Cemetery south of Lumbridge Church and entrance to the catacombs.",
  },
  "Lumbridge Church": {
    name: "Lumbridge Church",
    wiki: "Lumbridge Church",
    image: "Lumbridge_Church.png",
    members: false,
    summary: "Father Aereck's church east of Lumbridge Castle.",
  },
  "Doric's hut": {
    name: "Doric's hut",
    wiki: "Doric's hut",
    image: "Doric's_hut.png",
    members: false,
    summary: "Doric's smithy north-west of Falador, outside Taverley.",
  },
  "Goblin Village": {
    name: "Goblin Village",
    wiki: "Goblin Village",
    image: "Goblin_Village.png",
    members: false,
    summary: "Goblin settlement north of Falador, home to the two generals.",
  },
  "Draynor Manor": {
    name: "Draynor Manor",
    wiki: "Draynor Manor",
    image: "Draynor_manor.png",
    members: false,
    summary:
      "A haunted manor north of Draynor Village; Veronica waits south of its gates.",
    access: "Beware hostile trees and the optional skeleton inside.",
  },
};
