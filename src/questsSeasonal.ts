import type { QuestRecord, ItemReference } from "./data";
import type { CombatPlan } from "./combatData";
import type { LocationRecord } from "./locations";

// Sources checked 4 November 2026: each linked RuneScape Wiki quest and its raw
// Maplink; Arthur the Quest Guide and Skaldrun NPC maps supply instance IDs.
// These are separate map layers, not coordinates on the mainland world map.
const halloweenAccess =
  "The 2026 Halloween event has ended; Harvest Hollow closed 2 November. A future return has not been confirmed. When open, use the event portal north of the Grand Exchange.";
const christmasAccess =
  "Seasonal Christmas Village; not currently open on 4 November 2026. A future return has not been confirmed. When open, use the Christmas Village portal north of the Grand Exchange.";
const easterAccess =
  "The 2026 Easter event ended 20 April; Blooming Burrow is not currently open. A future return has not been confirmed. When open, use its portal north of the Grand Exchange.";

export const SEASONAL_QUESTS: QuestRecord[] = [
  {
    id: "threes-company",
    preparationNotes: [
      "Bank all carried and worn equipment before entering the saga. The level-30 targets are for unabridged rewards.",
    ],
    name: "Three's Company (saga)",
    kind: "saga",
    icon: "Three's_Company_(saga)_icon.png",
    artwork: "Three's_Company_(saga).png",
    members: false,
    difficulty: "Intermediate",
    length: "Medium",
    start: {
      npc: "Skaldrun",
      npcWiki: "Skaldrun",
      image: "Skaldrun_chathead.png",
      location: "Daemonheim saga camp",
      meetingPoint:
        "Speak to Skaldrun at the camp south-west of the Daemonheim entrance after freeing him and finding the bear pelt.",
      access:
        "Free Skaldrun in a frozen floor and find the bear pelt on floors 1–11. Leave your Dungeoneering party before starting.",
      map: { x: 3429, y: 3700, plane: 0, mapId: 28 },
    },
    why: "Play as Ariane, Ozan and Sir Owen in a replayable Fremennik saga.",
    requirements: [
      { skill: "Dungeoneering", level: 6 },
      {
        skill: "Attack",
        level: 30,
        recommended: true,
        purpose: "Unabridged saga rewards",
      },
      {
        skill: "Magic",
        level: 30,
        recommended: true,
        purpose: "Unabridged saga rewards",
      },
      {
        skill: "Ranged",
        level: 30,
        recommended: true,
        purpose: "Unabridged saga rewards",
      },
    ],
    questRequirements: [],
    supplies: [
      "Ring of kinship for finding the pelt in Daemonheim; bank it and all other items before entering the saga.",
    ],
    rewards: [
      "Abridged book: 750 Dungeoneering XP and 75 Dungeoneering tokens.",
      "At 30 Attack, Magic and Ranged, complete all secondary objectives for the unabridged book and 3,750 XP in one of those combat skills.",
    ],
    wiki: "Three's Company (saga)",
  },
  {
    id: "learning-the-ropes",
    name: "Learning the Ropes",
    availability: "tutorial",
    icon: "Learning_the_Ropes_icon.png",
    artwork: "Learning_the_Ropes.png",
    members: false,
    difficulty: "Novice",
    length: "Short",
    start: {
      npc: "Arthur the Quest Guide",
      npcWiki: "Arthur the Quest Guide",
      image: "Arthur_the_Quest_Guide_chathead.png",
      location: "Tutorial Island quest guide",
      meetingPoint:
        "Meet the Quest Guide on Tutorial Island during the tutorial.",
      access:
        "The 19 October 2026 tutorial starts with account creation; choosing Experienced skips the island. Players who completed an earlier tutorial have this quest completed automatically on login.",
      map: { x: 3789, y: 4274, plane: 0, mapId: 714 },
    },
    why: "Learn basic skills, combat, banking and travel before reaching the mainland.",
    requirements: [],
    questRequirements: [],
    supplies: [],
    rewards: [
      "Access to the mainland; tutorial items are retained and converted to tradable versions.",
    ],
    wiki: "Learning the Ropes",
  },
  {
    id: "a-christmas-reunion",
    name: "A Christmas Reunion",
    availability: "seasonal",
    icon: "A_Christmas_Reunion_icon.png",
    artwork: "A_Christmas_Reunion.png",
    members: false,
    difficulty: "Novice",
    length: "Short",
    start: {
      npc: "Diango",
      npcWiki: "Diango",
      image: "Diango_chathead.png",
      location: "Christmas Village",
      meetingPoint: "Diango's Workshop, in the east of the village.",
      access: christmasAccess,
      map: { x: 5246, y: 9773, plane: 0, mapId: 746 },
    },
    why: "Help restore the village toy workshop.",
    requirements: [
      {
        skill: "Cooking",
        level: 32,
        recommended: true,
        purpose: "Make biscuits",
      },
      {
        skill: "Cooking",
        level: 38,
        recommended: true,
        purpose: "Churn butter",
      },
    ],
    questRequirements: [],
    supplies: [
      "3 split fir logs and 15 steel nails",
      "6 bolts of cloth and thread (thread unnecessary with Crafting cape effect)",
      "Red dye and green dye",
      "Chocolate dust, bucket of milk and biscuits — one of each",
    ],
    rewards: [
      "5,000 XP prismatic lamp, 2,000 Christmas spirit, Diango's Little Helper title and Hot Chocolate Rest override.",
      "Winter hat and scarf, previous Christmas emotes if not unlocked, and village toy and hot chocolate activities.",
    ],
    wiki: "A Christmas Reunion",
  },
  {
    id: "all-souls-eve",
    name: "All Souls' Eve",
    availability: "seasonal",
    icon: "All_Souls'_Eve_icon.png",
    artwork: "All_Souls'_Eve.png",
    members: false,
    difficulty: "Novice",
    length: "Short",
    start: {
      npc: "Death",
      npcWiki: "Death",
      image: "Death_chathead.png",
      location: "Harvest Hollow",
      meetingPoint: "Speak to Death in the courtyard.",
      access: halloweenAccess,
      map: { x: 608, y: 1709, plane: 0, mapId: 752 },
    },
    why: "Help Death celebrate Halloween in Harvest Hollow.",
    requirements: [],
    questRequirements: ["necromancy", "field-of-screams"],
    supplies: ["5 cooked meat (other cooked food works; mince pies do not)"],
    rewards: [
      "Trick or Treat bowl furniture plans and the Dead Cool title.",
      "10,000 spooky tokens and previous Halloween emotes; the bursting trick or treat bag contains 3 regular ritual candles, 5 gold charms and another 100 spooky tokens.",
    ],
    wiki: "All Souls' Eve",
  },
  {
    id: "cold-front",
    name: "Cold Front",
    availability: "seasonal",
    icon: "Cold_Front_icon.png",
    artwork: "Cold_Front.png",
    members: false,
    difficulty: "Novice",
    length: "Short",
    start: {
      npc: "Queen of Snow",
      npcWiki: "Queen of Snow",
      image: "Queen_of_Snow_(Wintumber_Aurora)_chathead.png",
      location: "Christmas Village",
      meetingPoint:
        "At the Snowball Arena over the bridge in the west of the village.",
      access: christmasAccess,
      map: { x: 5183, y: 9798, plane: 0, mapId: 746 },
    },
    why: "Help organise the snow tournament.",
    requirements: [],
    questRequirements: [],
    supplies: ["25 coal"],
    rewards: [
      "Three lamps worth 1,500 XP each, 2,000 Christmas spirit, the Snowman title and snowman slippers.",
      "Previous Christmas emotes if not unlocked and the village snowman combat activity.",
    ],
    wiki: "Cold Front",
  },
  {
    id: "corporate-egg-spionage",
    preparationNotes: [
      "Leave three backpack spaces free; the Port Sarim lodestone helps with travel.",
    ],
    name: "Corporate Egg-spionage",
    availability: "seasonal",
    icon: "Corporate_Egg-spionage_icon.png",
    artwork: "Corporate_Egg-spionage.png",
    members: false,
    difficulty: "Novice",
    length: "Short",
    start: {
      npc: "Easter Bunny",
      npcWiki: "Easter Bunny",
      image: "Easter_Bunny_chathead.png",
      location: "Blooming Burrow",
      meetingPoint: "Talk to the Easter Bunny in the Blooming Burrow.",
      access: easterAccess,
      map: { x: 3811, y: 4987, plane: 0, mapId: 747 },
    },
    why: "Investigate the chocolate competitors' suspicious visitors.",
    requirements: [],
    questRequirements: ["great-egg-spectations"],
    supplies: [],
    rewards: [
      "Blooming Spycatcher Outfit, 5,000 Thieving XP lamp, 3,000 spring tokens and previous Easter emotes if not unlocked.",
      "Access to Intel Eggstraction in the Blooming Burrow.",
    ],
    wiki: "Corporate Egg-spionage",
  },
  {
    id: "field-of-screams",
    name: "Field of Screams",
    availability: "seasonal",
    icon: "Field_of_Screams_icon.png",
    artwork: "Field_of_Screams.png",
    members: false,
    difficulty: "Novice",
    length: "Short",
    start: {
      npc: "Death",
      npcWiki: "Death",
      image: "Death_chathead.png",
      location: "Harvest Hollow",
      meetingPoint:
        "Talk to Death or another founding member of the Horsemen in the courtyard.",
      access: halloweenAccess,
      map: { x: 608, y: 1705, plane: 0, mapId: 752 },
    },
    why: "Join a Horsemen team and spread Halloween scares.",
    requirements: [],
    questRequirements: [],
    supplies: [
      "Four qualifying scary outfit components or cosmetic overrides; four zombie outfit pieces from Iffie's shop cost 3,000 coins. An override hides an equipped item in the same slot.",
    ],
    rewards: [
      "Your chosen Horseman's uniform, Horses pet theme and team title.",
      "10,000 spooky tokens, previous Halloween emotes if not unlocked, and access to clan confection hand-ins.",
    ],
    wiki: "Field of Screams",
  },
  {
    id: "great-egg-spectations",
    name: "Great Egg-spectations",
    availability: "seasonal",
    icon: "Great_Egg-spectations_icon.png",
    artwork: "Great_Egg-spectations.png",
    members: false,
    difficulty: "Novice",
    length: "Short",
    start: {
      npc: "Easter Bunny",
      npcWiki: "Easter Bunny",
      image: "Easter_Bunny_chathead.png",
      location: "Blooming Burrow",
      meetingPoint: "Talk to the Easter Bunny in the Blooming Burrow.",
      access: easterAccess,
      map: { x: 3811, y: 4987, plane: 0, mapId: 747 },
    },
    why: "Research chocolate recipes for the Easter Bunny's factory.",
    requirements: [
      {
        skill: "Cooking",
        level: 32,
        recommended: true,
        purpose: "Make biscuits",
      },
      {
        skill: "Cooking",
        level: 38,
        recommended: true,
        purpose: "Churn butter",
      },
    ],
    questRequirements: [],
    supplies: [
      "Nuts, grapes and biscuits; slice a banana picked on Musa Point during the quest.",
      "Ironmen need partial Chef's Assistant to obtain biscuits; 32 Cooking makes biscuits and 38 Cooking makes butter if not obtained elsewhere.",
    ],
    rewards: [
      "Bunny Outfit, 5,000 Cooking XP lamp, 2,000 spring tokens and previous Easter emotes if not unlocked.",
      "Access to the factory line activity.",
    ],
    wiki: "Great Egg-spectations",
  },
  {
    id: "guys-and-dolls",
    name: "Guys and Dolls",
    availability: "seasonal",
    icon: "Guys_and_Dolls_icon.png",
    artwork: "Guys_and_Dolls.png",
    members: false,
    difficulty: "Novice",
    length: "Short",
    start: {
      npc: "Guy",
      npcWiki: "Guy",
      image: "Guy_chathead.png",
      location: "Harvest Hollow",
      meetingPoint: "Find Guy by the bonfire.",
      access: halloweenAccess,
      map: { x: 598, y: 1696, plane: 0, mapId: 752 },
    },
    why: "Help Guy bring colour to the Halloween bonfire.",
    requirements: [],
    questRequirements: ["necromancy"],
    supplies: [
      "Red dye, blue dye, green dye and purple dye",
      "Ancient torso or muspah spine; leave one backpack slot free.",
    ],
    rewards: [
      "Wendle pet, or its Burning appearance if already unlocked; 10,000 spooky tokens and previous Halloween emotes if not unlocked.",
      "Full access to Harvest Hollow Farming and Firemaking activities.",
    ],
    wiki: "Guys and Dolls",
  },
  {
    id: "its-snow-bother",
    name: "It's Snow Bother",
    availability: "seasonal",
    icon: "It's_Snow_Bother_icon.png",
    artwork: "It's_Snow_Bother.png",
    members: false,
    difficulty: "Novice",
    length: "Short",
    start: {
      npc: "Santa Claus",
      npcWiki: "Santa Claus",
      image: "Santa_Claus_chathead.png",
      location: "Christmas Village",
      meetingPoint: "Near Santa's grotto in the southern village.",
      access: christmasAccess,
      map: { x: 5207, y: 9776, plane: 0, mapId: 746 },
    },
    why: "Bring Christmas decorations and cheer to three cities.",
    requirements: [],
    questRequirements: [],
    supplies: [],
    rewards: [
      "Three 5,000 XP lamps, 2,000 Christmas spirit, Santa's little helper outfit, and green-and-red winter hat and scarf.",
      "Santa's sack, Fort Forinthry decoration option, previous Christmas emotes if not unlocked, and the village decoration activity.",
    ],
    wiki: "It's Snow Bother",
  },
];

export const SEASONAL_COMBAT: Record<string, CombatPlan> = {
  "threes-company": {
    required: [
      { name: "Carn", wiki: "Carn", image: "Carn.png", level: 38 },
      {
        name: "Arctic bear",
        wiki: "Arctic bear (Three's Company)",
        image: "Arctic_bear_(Three's_Company).png",
        level: 35,
      },
      {
        name: "Wolf",
        wiki: "Wolf (Three's Company)",
        image: "Wolf_(Three's_Company).png",
        level: 35,
      },
      {
        name: "Bandit ranger",
        wiki: "Bandit (Three's Company)",
        image: "Bandit_(Three's_Company,_ranged).png",
        level: 35,
      },
    ],
    hazards: [],
    notes: [
      "Some guardian-door wolves and bandits must be defeated, but shades can be avoided. Protect all three heroes and use food found inside; avoid falling rocks in the final fight.",
      "Avoid Home Teleport in the saga: the Wiki documents a character-switching bug that can force a restart.",
    ],
  },
  "learning-the-ropes": {
    required: [
      {
        name: "Giant rat",
        wiki: "Giant rat (Tutorial Island)",
        image: "Giant_rat_(Tutorial_Island).png",
        level: 3,
      },
    ],
    hazards: [],
    notes: [
      "Defeat a rat with melee and another with ranged; the tutorial supplies equipment and you cannot die here.",
    ],
  },
  "a-christmas-reunion": {
    required: [],
    hazards: [],
    notes: [
      "No combat. Ironmen need 32 Cooking and partial Chef's Assistant for biscuits; 38 Cooking is needed to make butter if it is not acquired elsewhere.",
    ],
  },
  "all-souls-eve": {
    required: [],
    hazards: [],
    notes: [
      "No combat; the five cooked foods are quest supplies, not combat preparation.",
    ],
  },
  "cold-front": {
    required: [],
    hazards: [],
    notes: ["No quest combat; snowballs are puzzle objects."],
  },
  "corporate-egg-spionage": {
    required: [],
    hazards: [],
    notes: ["The showdown is resolved through dialogue, not combat."],
  },
  "field-of-screams": {
    required: [],
    hazards: [],
    notes: ["No combat required."],
  },
  "great-egg-spectations": {
    required: [],
    hazards: [],
    notes: ["No combat required; the recipe search includes the Dwarven Mine."],
  },
  "guys-and-dolls": {
    required: [],
    hazards: [],
    notes: ["No combat required."],
  },
  "its-snow-bother": {
    required: [],
    hazards: [],
    notes: ["No combat required."],
  },
};

export const SEASONAL_ITEMS: ItemReference[] = [
  {
    name: "Split fir logs",
    wiki: "Split fir logs",
    image: "Split_fir_logs.png",
  },
  {
    name: "Bolt of cloth",
    wiki: "Bolt of cloth",
    image: "Bolt_of_cloth.png",
    aliases: ["bolts of cloth"],
  },
  { name: "Thread", wiki: "Thread", image: "Thread.png" },
  { name: "Green dye", wiki: "Green dye", image: "Green_dye.png" },
  { name: "Purple dye", wiki: "Purple dye", image: "Purple_dye.png" },
  {
    name: "Chocolate dust",
    wiki: "Chocolate dust",
    image: "Chocolate_dust.png",
  },
  {
    name: "Biscuits",
    wiki: "Biscuits",
    image: "Biscuits.png",
    aliases: ["biscuit"],
  },
  { name: "Nuts", wiki: "Nuts", image: "Nuts.png" },
  { name: "Grapes", wiki: "Grapes", image: "Grapes.png", aliases: ["grape"] },
  { name: "Ancient torso", wiki: "Ancient torso", image: "Ancient_torso.png" },
  { name: "Muspah spine", wiki: "Muspah spine", image: "Muspah_spine.png" },
];

export const SEASONAL_LOCATIONS: Record<string, LocationRecord> = {
  "Daemonheim saga camp": {
    name: "Daemonheim saga camp",
    wiki: "Skaldrun",
    image: "Daemonheim_Skaldrun.png",
    members: false,
    summary:
      "Skaldrun's camp outside Daemonheim, where unlocked Fremennik sagas begin.",
  },
  "Tutorial Island quest guide": {
    name: "Tutorial Island quest guide",
    wiki: "Tutorial Island",
    image: "Tutorial_Island_house.png",
    members: false,
    summary:
      "The Quest Guide teaches quest journals on the introductory island.",
    access:
      "The tutorial can be skipped; previous tutorial completion automatically completes the quest.",
  },
  "Christmas Village": {
    name: "Christmas Village",
    wiki: "Christmas Village",
    image: "Christmas_Village.png",
    members: false,
    summary: "Seasonal village in the Land of Snow.",
    access: christmasAccess,
  },
  "Harvest Hollow": {
    name: "Harvest Hollow",
    wiki: "Harvest Hollow",
    image: "Harvest_Hollow.png",
    members: false,
    summary: "Seasonal Halloween hub in the Land of Harvest.",
    access: halloweenAccess,
  },
  "Blooming Burrow": {
    name: "Blooming Burrow",
    wiki: "Blooming Burrow",
    image: "Blooming_Burrow.png",
    members: false,
    summary: "Seasonal Easter hub in the Land of Glades.",
    access: easterAccess,
  },
};
