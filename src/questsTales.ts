import type { QuestRecord, ItemReference } from "./data";
import type { CombatPlan } from "./combatData";
import type { LocationRecord } from "./locations";

// RuneScape Wiki quest and quick-guide pages, NPC pages and file metadata, checked 4 November 2026.
// https://runescape.wiki/w/Shield_of_Arrav through https://runescape.wiki/w/Myths_of_the_White_Lands
// Havenhythe: https://runescape.wiki/w/Visions_of_Havenhythe and https://runescape.wiki/w/Hearts_of_Sanguine
export const TALE_QUESTS: QuestRecord[] = [
  {
    id: "shield-of-arrav",
    name: "Shield of Arrav",
    icon: "Shield_of_Arrav_icon.png",
    artwork: "Shield_of_Arrav.png",
    members: false,
    difficulty: "Novice",
    length: "Medium",
    start: {
      npc: "Reldo",
      npcWiki: "Reldo",
      image: "Reldo_chathead.png",
      location: "Varrock Palace",
      meetingPoint:
        "Speak to Reldo in the palace library, north of Varrock square.",
      map: { x: 3208, y: 3494, plane: 0 },
    },
    why: "Recover the stolen shield and begin the Mahjarrat Mysteries story. The current quest is soloable: you can switch gangs; another player is not required.",
    requirements: [],
    questRequirements: [],
    supplies: [
      "20 coins for information",
      "Optional combat equipment for Jonny the beard",
    ],
    rewards: ["1 quest point", "1,200 coins"],
    wiki: "Shield_of_Arrav",
  },
  {
    id: "violet-is-blue",
    name: "Violet is Blue",
    icon: "Violet_is_Blue_icon.png",
    artwork: "Violet_is_Blue.png",
    members: false,
    difficulty: "Novice",
    length: "Short",
    start: {
      npc: "Violet",
      npcWiki: "Violet",
      image: "Violet_chathead.png",
      location: "Land of Snow portal",
      meetingPoint:
        "Speak to Violet beside the portal on the Taverley side of White Wolf Mountain.",
      map: { x: 2855, y: 3458, plane: 0 },
    },
    why: "Help Violet reach the yeti festival in a permanently available puzzle story.",
    requirements: [],
    questRequirements: [],
    supplies: [],
    rewards: [
      "1 quest point",
      "Three lamps granting 1,000 XP each",
      "The Yeti title and access to Yeti Town",
    ],
    wiki: "Violet_is_Blue",
  },
  {
    id: "violet-is-blue-too",
    name: "Violet is Blue Too",
    icon: "Violet_is_Blue_Too_icon.png",
    artwork: "Violet_is_Blue_Too.png",
    members: false,
    difficulty: "Novice",
    length: "Medium",
    start: {
      npc: "Postie Pete",
      npcWiki: "Postie Pete",
      image: "Postie_Pete_chathead.png",
      location: "Land of Snow portal",
      meetingPoint:
        "Speak to Postie Pete beside the portal on the Taverley side of White Wolf Mountain.",
      map: { x: 2854, y: 3457, plane: 0 },
    },
    why: "Return to Violet and help restore Yeti Town's festivities; this story is available year-round.",
    requirements: [],
    questRequirements: ["violet-is-blue"],
    supplies: [],
    rewards: [
      "1 quest point",
      "Three lamps granting 4,000 XP each",
      "Fairylight necklace and fairylight whip, with cosmetic overrides",
    ],
    wiki: "Violet_is_Blue_Too",
  },
  {
    id: "one-piercing-note",
    preparationNotes: ["Leave at least 11 backpack spaces free."],
    name: "One Piercing Note",
    icon: "One_Piercing_Note_icon.png",
    artwork: "One_Piercing_Note.png",
    members: false,
    difficulty: "Novice",
    length: "Medium to Long",
    start: {
      npc: "Sister Catherina",
      npcWiki: "Sister Catherina",
      image: "Sister_Catherina_chathead.png",
      location: "Abbey of St. Elspeth Citharede",
      meetingPoint:
        "Outside the abbey east of Al Kharid, past the desert strykewyrms.",
      map: { x: 3405, y: 3165, plane: 0 },
    },
    why: "Solve a voiced murder mystery and unlock three combat abilities.",
    requirements: [],
    questRequirements: [],
    supplies: ["Optional cabbage; one can be obtained at the abbey"],
    rewards: [
      "2 quest points",
      "250 Prayer XP lamp",
      "Citharede robes and Troubadour Dance emote",
      "Devotion, Transfigure and Sacrifice abilities",
    ],
    wiki: "One_Piercing_Note",
  },
  {
    id: "vampyre-slayer",
    name: "Vampyre Slayer",
    icon: "Vampyre_Slayer_icon.png",
    artwork: "Vampyre_Slayer.png",
    members: false,
    difficulty: "Novice",
    length: "Short",
    start: {
      npc: "Morgan",
      npcWiki: "Morgan",
      image: "Morgan_chathead.png",
      location: "Draynor Village",
      meetingPoint: "Morgan's house north of Ned's house in Draynor Village.",
      map: { x: 3097, y: 3268, plane: 0 },
    },
    why: "Defeat Count Draynor for a useful combat experience lamp.",
    requirements: [],
    questRequirements: [],
    supplies: [
      "A beer or 2 coins to buy one",
      "Optional garlic, obtainable upstairs in Morgan's house",
      "Optional holy symbol, combat gear and food",
    ],
    rewards: [
      "3 quest points",
      "4,825 combat XP lamp; selected combat skill must be level 10",
    ],
    wiki: "Vampyre_Slayer",
  },
  {
    id: "witchs-house",
    name: "Witch's House",
    icon: "Witch's_House_icon.png",
    artwork: "Witch's_House.png",
    members: false,
    difficulty: "Intermediate",
    length: "Short",
    start: {
      npc: "Harvey",
      npcWiki: "Harvey",
      image: "Harvey_chathead.png",
      location: "Witch's House garden",
      meetingPoint:
        "By the witch's garden immediately west of Falador's crumbling wall.",
      map: { x: 2924, y: 3355, plane: 0 },
    },
    why: "Recover Harvey's ball and earn a substantial Constitution reward.",
    requirements: [],
    questRequirements: [],
    supplies: [
      "Optional leather gloves and cheese; both are obtainable inside the house",
      "Optional combat equipment, water spells and food for the four-stage fight",
    ],
    rewards: ["4 quest points", "6,325 Constitution XP"],
    wiki: "Witch's_House",
  },
  {
    id: "visions-of-havenhythe",
    preparationNotes: ["Leave 10 backpack spaces free."],
    name: "Visions of Havenhythe",
    icon: "Visions_of_Havenhythe_icon.png",
    artwork: "Visions_of_Havenhythe.png",
    members: false,
    difficulty: "Novice",
    length: "Short",
    start: {
      npc: "Bartender",
      npcWiki: "Bartender (Rusty Anchor)",
      image: "Bartender_(Rusty_Anchor)_chathead.png",
      location: "The Rusty Anchor",
      meetingPoint:
        "Speak to the bartender inside the Rusty Anchor tavern in Port Sarim.",
      map: { x: 3045, y: 3257, plane: 0 },
    },
    why: "Answer a vision and open travel to Havenhythe and the Wendlewick lodestone.",
    requirements: [{ skill: "Crafting", level: 12, recommended: true }],
    questRequirements: [],
    supplies: ["Optional combat gear for ten juvenile boulder crabs"],
    rewards: ["1 quest point", "Access to the Wendlewick lodestone"],
    wiki: "Visions_of_Havenhythe",
  },
  {
    id: "hearts-of-sanguine",
    name: "Hearts of Sanguine",
    icon: "Hearts_of_Sanguine_icon.png",
    artwork: "Hearts_of_Sanguine.png",
    members: false,
    difficulty: "Novice",
    length: "Medium",
    start: {
      npc: "Adam",
      npcWiki: "Adam",
      image: "Adam_chathead.png",
      location: "Wendlewick",
      meetingPoint: "Speak to Adam in his house north of the village well.",
      access:
        "Complete Visions of Havenhythe to reach the village and start this quest.",
      map: { x: 4185, y: 3364, plane: 0 },
    },
    why: "Investigate the threat to Havenhythe and unlock havensilver smithing.",
    requirements: [],
    questRequirements: ["visions-of-havenhythe"],
    supplies: [
      "A few coins to buy Wendlewick ale",
      "Optional 10 copper ore and 10 tin ore; mine them during the quest instead",
      "Optional melee armour and food for the encounter",
    ],
    rewards: [
      "1 quest point",
      "250 Herblore XP lamp and 250 Smithing XP lamp",
      "Elegant parasol and access to havensilver smithing",
      "Antisanguine mixing and Silverquill access are members-only",
    ],
    wiki: "Hearts_of_Sanguine",
  },
  {
    id: "heartstealer",
    name: "Heartstealer",
    icon: "Heartstealer_icon.png",
    artwork: "Heartstealer.png",
    members: false,
    difficulty: "Novice",
    length: "Short to Medium",
    start: {
      npc: "Caelyn Kadaan",
      npcWiki: "Caelyn Kadaan",
      image: "Caelyn_Kadaan_chathead.png",
      location: "Edgeville",
      meetingPoint:
        "Upstairs in the house immediately north of Edgeville bank; Caelyn or Annette can start the conversation.",
      map: { x: 3090, y: 3510, plane: 1 },
    },
    why: "Help Caelyn plan a museum heist in this permanently available anniversary story.",
    requirements: [],
    questRequirements: [],
    supplies: [],
    rewards: [
      "1 quest point",
      "Heartstealer title",
      "Scarlet Thief's mask and outfit cosmetic overrides",
      "A post-quest Thieving XP lamp is members-only",
    ],
    wiki: "Heartstealer",
  },
  {
    id: "myths-of-the-white-lands",
    name: "Myths of the White Lands",
    icon: "Myths_of_the_White_Lands_icon.png",
    artwork: "Myths_of_the_White_Lands.png",
    members: false,
    difficulty: "Novice",
    length: "Medium",
    start: {
      npc: "Explorer Jack",
      npcWiki: "Explorer Jack",
      image: "Explorer_Jack_chathead.png",
      location: "Lumbridge",
      meetingPoint:
        "Inside Explorer Jack's house west of the Lumbridge general store.",
      map: { x: 3206, y: 3243, plane: 0 },
    },
    why: "Explore the Land of Snow's sliding puzzles and investigate Jack's rumour.",
    requirements: [
      {
        skill: "Crafting",
        level: 30,
        recommended: true,
        purpose: "Optional cave reward",
      },
    ],
    questRequirements: [],
    supplies: [],
    rewards: [
      "2 quest points (or 1 for some older quest histories)",
      "500 XP antique lamp",
      "5,000 coins from Jack after logging out or speaking to him later",
      "Land of Snow access; optional 2,000 Crafting XP at level 30",
      "Optional Agility and Woodcutting XP activities are members-only",
    ],
    wiki: "Myths_of_the_White_Lands",
  },
];

export const TALE_COMBAT: Record<string, CombatPlan> = {
  "shield-of-arrav": {
    required: [
      {
        name: "Jonny the beard",
        wiki: "Jonny the beard",
        image: "Jonny_the_beard.png",
        level: 1,
      },
    ],
    hazards: [],
    notes: [
      "The present-day quest lets you join both gangs in succession without a partner.",
    ],
  },
  "violet-is-blue": {
    required: [],
    hazards: [],
    notes: [
      "Rolling snowballs impede the puzzle; the game offers an easier setting after repeated hits.",
    ],
  },
  "violet-is-blue-too": { required: [], hazards: [], notes: [] },
  "one-piercing-note": {
    required: [],
    hazards: [],
    notes: ["No combat is needed for the investigation."],
  },
  "vampyre-slayer": {
    required: [
      {
        name: "Count Draynor",
        wiki: "Count Draynor",
        image: "Count_Draynor.png",
        level: 28,
      },
    ],
    hazards: [],
    notes: [
      "Dr Harlow provides the stake and stake hammer during the quest. Garlic reduces the Count's healing; a holy symbol reduces his attacks.",
      "Undead trees outside the manor deal minor damage; if defeated by the Count you are imprisoned rather than killed.",
    ],
  },
  "witchs-house": {
    required: [
      {
        name: "Witch's experiment · chicken",
        wiki: "Witch's experiment",
        image: "Witch's_experiment.png",
        level: 16,
      },
      {
        name: "Witch's experiment · spider",
        wiki: "Witch's experiment",
        image: "Witch's_experiment_(second_form).png",
        level: 23,
      },
      {
        name: "Witch's experiment · bear",
        wiki: "Witch's experiment",
        image: "Witch's_experiment_(third_form).png",
        level: 37,
      },
      {
        name: "Witch's experiment · wolf",
        wiki: "Witch's experiment",
        image: "Witch's_experiment_(fourth_form).png",
        level: 49,
      },
    ],
    hazards: [],
    notes: [
      "Defeat all four forms consecutively; they are weak to water spells. The basement gate damages you without suitable gloves.",
    ],
  },
  "visions-of-havenhythe": {
    required: [
      {
        name: "Juvenile boulder crab · defeat 10",
        wiki: "Juvenile boulder crab",
        image: "Juvenile_boulder_crab.png",
        level: 1,
      },
    ],
    hazards: [],
    notes: [
      "The crabs must be killed even if you bring limestone bricks. Adam can make the bricks if you lack 12 Crafting.",
    ],
  },
  "hearts-of-sanguine": {
    required: [
      { name: "Hedgehog", wiki: "Hedgehog", image: "Hedgehog.png", level: 0 },
      {
        name: "Sanguine heart",
        wiki: "Sanguine heart",
        image: "Sanguine_heart.png",
        level: 500,
      },
    ],
    hazards: [],
    notes: [
      "Two hedgehogs must be killed, including the potion test. The heart encounter is safe despite its displayed level 500.",
      "Use the quest-made havensilver greatsword and antisanguine; destroy tumours during immunity and avoid exploding pustules, which remove potion protection.",
    ],
  },
  heartstealer: {
    required: [],
    hazards: [],
    notes: [
      "The heist uses stealth and timed interactions, not combat; the smoke-bomb minigame offers an easier setting after failure.",
    ],
  },
  "myths-of-the-white-lands": {
    required: [],
    hazards: [],
    notes: [
      "Ice-sliding puzzles can be reset by logging out or teleporting away.",
    ],
  },
};

export const TALE_ITEMS: ItemReference[] = [
  { name: "Beer", wiki: "Beer", image: "Beer.png", aliases: ["pint of beer"] },
  { name: "Garlic", wiki: "Garlic", image: "Garlic.png" },
  {
    name: "Holy symbol",
    wiki: "Holy_symbol",
    image: "Holy_symbol.png",
    aliases: ["holy symbols"],
  },
  {
    name: "Leather gloves",
    wiki: "Leather_gloves",
    image: "Leather_gloves.png",
  },
  { name: "Cheese", wiki: "Cheese", image: "Cheese.png" },
  {
    name: "Cabbage",
    wiki: "Cabbage",
    image: "Cabbage.png",
    aliases: ["cabbages"],
  },
  {
    name: "Wendlewick ale",
    wiki: "Wendlewick_ale",
    image: "Wendlewick_ale.png",
  },
];

export const TALE_LOCATIONS: Record<string, LocationRecord> = {
  "Land of Snow portal": {
    name: "Land of Snow portal",
    wiki: "Land of Snow portal",
    image: "Land_of_Snow_portal.png",
    members: false,
    summary:
      "A portal on the Taverley side of White Wolf Mountain leads to Violet's Land of Snow.",
  },
  "Abbey of St. Elspeth Citharede": {
    name: "Abbey of St. Elspeth Citharede",
    wiki: "Abbey of St. Elspeth Citharede",
    image: "Abbey_of_Elspeth.png",
    members: false,
    summary: "The abbey stands east of Al Kharid, past the desert strykewyrms.",
  },
  "Witch's House garden": {
    name: "Witch's House garden",
    wiki: "Witch's House (location)",
    image: "Witch's_House_(location).png",
    members: false,
    summary: "Harvey waits near the witch's garden west of Falador.",
  },
  "The Rusty Anchor": {
    name: "The Rusty Anchor",
    wiki: "The Rusty Anchor",
    image: "The_Rusty_Anchor_exterior.png",
    members: false,
    summary:
      "A tavern in north-east Port Sarim, where the Havenhythe story begins.",
  },
  Wendlewick: {
    name: "Wendlewick",
    wiki: "Wendlewick",
    image: "Wendlewick.png",
    members: false,
    summary: "Havenhythe village containing Adam's house and its lodestone.",
    access: "Travel there during Visions of Havenhythe.",
  },
  Edgeville: {
    name: "Edgeville",
    wiki: "Edgeville",
    image: "Edgeville.png",
    members: false,
    summary: "Caelyn and Annette live upstairs in the house north of the bank.",
  },
};
