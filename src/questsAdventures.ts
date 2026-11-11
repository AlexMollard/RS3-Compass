import type { ItemReference, QuestRecord } from "./data";
import type { CombatPlan } from "./combatData";
import type { LocationRecord } from "./locations";

// Sources: RuneScape Wiki quest, NPC, monster and item articles, checked 4 November 2026.
// Start coordinates are the quest overview Map/Maplink tiles, not approximate NPC positions.
export const ADVENTURE_QUESTS: QuestRecord[] = [
  {
    id: "swept-away",
    name: "Swept Away",
    icon: "Swept_Away_icon.png",
    artwork: "Swept_Away.png",
    members: false,
    difficulty: "Novice",
    length: "Short to Medium",
    start: {
      npc: "Maggie",
      npcWiki: "Maggie",
      image: "Maggie_chathead.png",
      location: "Draynor Village",
      meetingPoint:
        "At her caravan north of Draynor Village, west of the Draynor lodestone.",
      map: { x: 3082, y: 3297, plane: 0 },
    },
    why: "Help a travelling witch and earn a broomstick and flexible experience.",
    requirements: [],
    questRequirements: [],
    supplies: [],
    rewards: [
      "2 quest points (1 if the historical miniquest was already completed)",
      "Broomstick and 10 portions of experience-giving goulash",
      "Optional post-quest Magic experience from witches, subject to their requirements",
    ],
    wiki: "Swept_Away",
  },
  {
    id: "a-shadow-over-ashdale",
    name: "A Shadow over Ashdale",
    icon: "A_Shadow_over_Ashdale_icon.png",
    artwork: "A_Shadow_over_Ashdale.png",
    members: false,
    difficulty: "Novice",
    length: "Medium",
    start: {
      npc: "Gudrik",
      npcWiki: "Gudrik",
      image: "Gudrik_chathead.png",
      location: "Gudrik's Port Sarim meeting point",
      meetingPoint: "East of Gerrant's Fishy Business in Port Sarim.",
      map: { x: 3029, y: 3229, plane: 0 },
    },
    why: "Investigate Ashdale's missing inhabitants and unlock a repeatable encounter.",
    requirements: [],
    questRequirements: [],
    supplies: [
      "Optional: combat equipment and food",
      "Optional: ranged or Magic weapon for attacking from a distance",
    ],
    rewards: [
      "1 quest point",
      "300 XP lamps each for Attack, Strength, Defence and Constitution",
      "Three black pearls for bonus XP: crack one per day; membership is needed to use the bonus XP",
      "Weekly Agoroth rematch for free players",
    ],
    wiki: "A_Shadow_over_Ashdale",
  },
  {
    id: "the-death-of-chivalry",
    preparationNotes: [
      "Leave at least five backpack spaces free; twelve are recommended.",
    ],
    name: "The Death of Chivalry",
    icon: "The_Death_of_Chivalry_icon.png",
    artwork: "The_Death_of_Chivalry.png",
    members: false,
    difficulty: "Novice",
    length: "Long",
    start: {
      npc: "Sir Owen",
      npcWiki: "Sir Owen",
      image: "Sir_Owen_chathead.png",
      location: "Edgeville Monastery garden",
      meetingPoint:
        "In the garden north of Edgeville Monastery, west of Edgeville.",
      map: { x: 3051, y: 3502, plane: 0 },
    },
    why: "Join Sir Owen against the Black Knights and obtain his shield.",
    requirements: [],
    questRequirements: [],
    supplies: [
      "Combat equipment (can be retrieved from a bank when needed)",
      "Optional: food for scaled fights",
    ],
    rewards: [
      "3 quest points unless previously awarded for Black Knights' Fortress",
      "250 Magic and 250 Strength XP, plus combat and Prayer lamps",
      "Sir Owen Sonde's shield and Skull of Remembrance",
      "Four knightly title choices",
    ],
    wiki: "The_Death_of_Chivalry",
  },
  {
    id: "missing-presumed-death",
    name: "Missing, Presumed Death",
    icon: "Missing,_Presumed_Death_icon.png",
    artwork: "Missing,_Presumed_Death.png",
    members: false,
    difficulty: "Novice",
    length: "Medium to Long",
    start: {
      npc: "Brother Samwell",
      npcWiki: "Brother Samwell",
      image: "Brother_Samwell_chathead.png",
      location: "Silvarea murder scene",
      meetingPoint:
        "In the Silvarea mountain pass, west of Paterdomus and east of Varrock.",
      map: { x: 3380, y: 3486, plane: 0 },
    },
    why: "Investigate Death's disappearance and obtain the invitation box.",
    requirements: [],
    questRequirements: [],
    supplies: ["Optional: combat equipment and food for scaled wights"],
    rewards: [
      "2 quest points",
      "500 Prayer, 1,000 Agility and 1,500 combat XP lamps",
      "Sliske mask cosmetics and Book of the underworld",
      "Invitation box teleport to the Empyrean Citadel",
      "Additional citadel rewards have individual level requirements",
    ],
    wiki: "Missing,_Presumed_Death",
  },
  {
    id: "broken-home",
    preparationNotes: [
      "Empty your backpack and remove all worn equipment; a deposit box is nearby.",
      "Dismiss any follower and enter at full health.",
    ],
    name: "Broken Home",
    icon: "Broken_Home_icon.png",
    artwork: "Broken_Home.png",
    members: false,
    difficulty: "Novice",
    length: "Medium to Long",
    start: {
      npc: "Maria",
      npcWiki: "Maria",
      image: "Maria_chathead.png",
      location: "Gulvas Mansion",
      meetingPoint:
        "Outside the mansion north-east of Varrock, south of Silvarea quarry.",
      map: { x: 3360, y: 3481, plane: 0 },
    },
    why: "Explore a haunted mansion and unlock replay challenges.",
    requirements: [],
    questRequirements: [],
    supplies: [],
    rewards: [
      "1 quest point and small XP lamp",
      "Pulled Away emote and asylum doctor's ring",
      "Replay challenges can upgrade the ring to an asylum surgeon's ring",
    ],
    wiki: "Broken_Home",
  },
  {
    id: "theres-no-place-like-home",
    name: "There's No Place Like Home...",
    icon: "There's_No_Place_Like_Home..._icon.png",
    artwork: "There's_No_Place_Like_Home....png",
    members: false,
    difficulty: "Novice",
    length: "Short",
    start: {
      npc: "Alfred Stonemason",
      npcWiki: "Alfred Stonemason",
      image: "Alfred_Stonemason_chathead.png",
      location: "Rimmington",
      meetingPoint: "In Rimmington by the house portal and estate agent.",
      map: { x: 2946, y: 3228, plane: 0 },
    },
    why: "Learn the current player-owned housing and furniture systems.",
    requirements: [],
    questRequirements: [],
    supplies: [],
    rewards: [
      "1 quest point",
      "250 Construction XP lamp and construction supplies",
      "Player-owned housing, House Teleport and a commemorative painting",
    ],
    wiki: "There's_No_Place_Like_Home...",
  },
  {
    id: "a-souls-bane",
    name: "A Soul's Bane",
    icon: "A_Soul's_Bane_icon.png",
    artwork: "A_Soul's_Bane.png",
    members: false,
    difficulty: "Novice",
    length: "Short to Medium",
    start: {
      npc: "Launa",
      npcWiki: "Launa",
      image: "Launa_chathead.png",
      location: "Tolna's rift entrance",
      meetingPoint:
        "At the rift east of Varrock, south-east of the earth altar.",
      map: { x: 3308, y: 3453, plane: 0 },
    },
    why: "Find Launa's son and unlock Tolna's rift for combat training.",
    requirements: [],
    questRequirements: [],
    supplies: ["Optional: food, melee armour and a weapon"],
    rewards: [
      "1 quest point",
      "500 Defence and 500 Constitution XP lamps",
      "500 coins, access to Tolna's rift and anger weapon overrides",
    ],
    wiki: "A_Soul's_Bane",
  },
  {
    id: "beneath-cursed-tides",
    name: "Beneath Cursed Tides",
    icon: "Beneath_Cursed_Tides_icon.png",
    artwork: "Beneath_Cursed_Tides.png",
    members: false,
    difficulty: "Intermediate",
    length: "Medium",
    start: {
      npc: "Wizard Myrtle",
      npcWiki: "Wizard Myrtle",
      image: "Wizard_Myrtle_chathead.png",
      location: "Wizards' Tower",
      meetingPoint: "At the fountains in front of the Wizards' Tower.",
      map: { x: 3094, y: 3184, plane: 0 },
    },
    why: "Discover the fate of Tutorial Island and unlock the Giant Oyster.",
    requirements: [
      { skill: "Attack", level: 30 },
      { skill: "Cooking", level: 30 },
      { skill: "Firemaking", level: 30 },
      { skill: "Magic", level: 30 },
      { skill: "Mining", level: 30 },
      { skill: "Smithing", level: 30 },
      { skill: "Strength", level: 30 },
      { skill: "Woodcutting", level: 30 },
    ],
    questRequirements: [],
    supplies: [],
    rewards: [
      "1 quest point",
      "10,000 combat-related XP lamp and 5,000 XP lamps for Fishing and Cooking",
      "Vannaka's Sword cosmetic override",
      "Access to the monthly Giant Oyster",
    ],
    wiki: "Beneath_Cursed_Tides",
  },
  {
    id: "chefs-assistant",
    name: "Chef's Assistant",
    icon: "Chef's_Assistant_icon.png",
    artwork: "Chef's_Assistant.png",
    members: false,
    difficulty: "Novice",
    length: "Short to Medium",
    start: {
      npc: "Head Chef",
      npcWiki: "Head chef",
      image: "Head_chef_chathead.png",
      location: "Cooks' Guild",
      meetingPoint:
        "Inside the Cooks' Guild, west of the Grand Exchange entrance.",
      access:
        "32 Cooking and a chef's hat to enter, unless Hard Varrock achievements are complete; members have additional hat alternatives.",
      map: { x: 3143, y: 3446, plane: 0 },
    },
    why: "Help develop cheesecake and learn to make it and biscuits.",
    requirements: [
      { skill: "Cooking", level: 32 },
      {
        skill: "Cooking",
        level: 38,
        recommended: true,
        purpose: "Churn butter",
      },
    ],
    questRequirements: ["cooks-assistant"],
    supplies: [
      "Chef's hat (unless Hard Varrock achievements are complete)",
      "1 normal logs",
      "1 steel bar",
      "1 bucket of milk",
      "1 pot of flour",
      "1 pat of butter and 1 pot of cream, or two extra buckets of milk to churn them",
      "Optional: cake tin (also available in the guild)",
    ],
    rewards: [
      "1 quest point",
      "1,500 Cooking XP lamp and three cheesecakes",
      "Ability to make biscuits and cheesecakes",
    ],
    wiki: "Chef's_Assistant",
  },
  {
    id: "gower-quest",
    name: "Gower Quest",
    icon: "Gower_Quest_icon.png",
    artwork: "Gower_Quest.png",
    members: false,
    difficulty: "Experienced",
    length: "Medium to Long",
    start: {
      npc: "Andrew Gower",
      npcWiki: "Andrew",
      image: "Andrew_chathead.png",
      location: "Gower farm",
      meetingPoint:
        "At the cabbage farm south of Varrock, south-east of the Varrock lodestone.",
      access: "Requires 34 quest points.",
      map: { x: 3255, y: 3355, plane: 0 },
    },
    why: "With 34 quest points, help the Gower brothers investigate a cabbage crisis and earn cosmetics and pets.",
    requirements: [],
    questRequirements: [],
    supplies: ["Optional: food and combat equipment for the final fight"],
    rewards: [
      "1 quest point and 15 coins",
      "Brassica Prime Godsword, Cabbagemancer outfit and Retro Login Teleport overrides",
      "Crispy the Cabbage pet; Tim and Crunchy can also be claimed",
      "Optional XP lamps from the brothers require minimum levels across free skills",
    ],
    wiki: "Gower_Quest",
  },
];

export const ADVENTURE_COMBAT: Record<string, CombatPlan> = {
  "swept-away": {
    required: [],
    hazards: [],
    notes: ["No combat is required."],
  },
  "a-shadow-over-ashdale": {
    required: [
      {
        name: "Crassian scout",
        wiki: "Crassian scout",
        image: "Crassian_scout.png",
        level: "Scales with your stats",
      },
      {
        name: "Agoroth",
        wiki: "Agoroth",
        image: "Agoroth.png",
        level: "Scales with your stats",
      },
    ],
    hazards: [],
    notes: [
      "Three scouts must be killed to open the barrier; several others can be avoided. Food and ranged attacks are useful.",
    ],
  },
  "the-death-of-chivalry": {
    required: [
      {
        name: "Black Knight",
        wiki: "Black Knight (The Death of Chivalry)",
        image: "Black_Knight.png",
        level: "Scales with your stats",
      },
      {
        name: "Fern",
        wiki: "Fern",
        image: "Fern_(centaur).png",
        level: "Scales with your stats",
      },
      {
        name: "Dawn",
        wiki: "Dawn",
        image: "Dawn_(monster).png",
        level: "Scales with your stats",
      },
      {
        name: "Sir Owen",
        wiki: "Sir Owen",
        image: "Sir_Owen_(zombie).png",
        level: "Scales with your stats",
      },
    ],
    hazards: [],
    notes: [
      "Five knights, Fern, Dawn and summoned skeletons, and Sir Owen must be fought. Enemy life points and attacks scale to the player.",
    ],
  },
  "missing-presumed-death": {
    required: [
      {
        name: "Wight",
        wiki: "Wight (Missing, Presumed Death)",
        image: "Wight.png",
        level: "Scales with your stats",
      },
      {
        name: "Wight ranger",
        wiki: "Wight ranger (Missing, Presumed Death)",
        image: "Wight_ranger.png",
        level: "Scales with your stats",
      },
      {
        name: "Wight footsoldier",
        wiki: "Wight footsoldier (Missing, Presumed Death)",
        image: "Wight_footsoldier.png",
        level: "Scales with your stats",
      },
    ],
    hazards: [],
    notes: ["Fight eleven scaled wights of these types alongside Icthlarin."],
  },
  "broken-home": {
    required: [],
    hazards: [],
    notes: [
      "No equipment or supplies can be brought inside. Mansion hazards and the pursuing ghost can damage you; life points do not regenerate naturally. Death returns you to the last save point.",
    ],
  },
  "theres-no-place-like-home": {
    required: [],
    hazards: [],
    notes: ["No combat is required; tutorial materials are provided."],
  },
  "a-souls-bane": {
    required: [
      {
        name: "Fear reaper",
        wiki: "Fear reaper",
        image: "Fear_reaper.png",
        level: 37,
      },
      {
        name: "Confusion beast",
        wiki: "Confusion beast",
        image: "Confusion_beast.png",
        level: 39,
      },
      {
        name: "Hopeless creature",
        wiki: "Hopeless creature",
        image: "Hopeless_creature.png",
        level: 35,
      },
      {
        name: "Tolna's heads",
        wiki: "Tolna",
        image: "Tolna_(Monster).png",
        level: 39,
      },
    ],
    hazards: [
      {
        name: "Angry unicorn",
        wiki: "Angry unicorn",
        image: "Angry_unicorn.png",
        level: 45,
      },
    ],
    notes: [
      "In the anger room choose among several monster types and use the corresponding supplied anger weapon; the unicorn is one option, not a compulsory specific kill.",
      "Confusion beasts can poison. Eating during a hopeless creature fight restores much of its current life points. Completed rooms remain saved if you leave.",
    ],
  },
  "beneath-cursed-tides": {
    required: [],
    hazards: [],
    notes: [
      "No combat is required; Myrtle's spell provides a diving option without bringing equipment.",
    ],
  },
  "chefs-assistant": {
    required: [],
    hazards: [],
    notes: [
      "No combat is required. Churning your own butter requires 38 Cooking; obtain butter instead if below that level.",
    ],
  },
  "gower-quest": {
    required: [
      {
        name: "Black Knight Titan",
        wiki: "Black Knight Titan (Gower Quest)",
        image: "Black_Knight_Titan_(updated).png",
        level: "Life points scale to yours",
      },
    ],
    hazards: [],
    notes: [
      "Reduce the titan's life points to zero six times. Food and combat gear are recommended.",
    ],
  },
};

export const ADVENTURE_ITEMS: ItemReference[] = [
  {
    name: "Chef's hat",
    wiki: "Chef's hat",
    image: "Chef's_hat.png",
    aliases: ["chef's hats"],
  },
  {
    name: "Pat of butter",
    wiki: "Pat of butter",
    image: "Pat_of_butter.png",
    aliases: ["pats of butter"],
  },
  {
    name: "Pot of cream",
    wiki: "Pot of cream",
    image: "Pot_of_cream.png",
    aliases: ["pots of cream"],
  },
  {
    name: "Cake tin",
    wiki: "Cake tin",
    image: "Cake_tin.png",
    aliases: ["cake tins"],
  },
];

export const ADVENTURE_LOCATIONS: Record<string, LocationRecord> = {
  "Gudrik's Port Sarim meeting point": {
    name: "Gudrik's Port Sarim meeting point",
    wiki: "Port Sarim",
    image: "A_Shadow_over_Ashdale.png",
    members: false,
    summary:
      "Gudrik waits east of Gerrant's Fishy Business and can take adventurers to Ashdale.",
  },
  "Edgeville Monastery garden": {
    name: "Edgeville Monastery garden",
    wiki: "Edgeville Monastery",
    image: "The_Death_of_Chivalry_start.png",
    members: false,
    summary: "Sir Owen awaits in the garden north of the monastery.",
  },
  "Silvarea murder scene": {
    name: "Silvarea murder scene",
    wiki: "Silvarea",
    image: "Missing,_Presumed_Death_monks.png",
    members: false,
    summary:
      "Brother Samwell investigates slain monks in the mountain pass west of Paterdomus.",
  },
  "Gulvas Mansion": {
    name: "Gulvas Mansion",
    wiki: "Gulvas Mansion",
    image: "Broken_Home.png",
    members: false,
    summary:
      "The haunted mansion north-east of Varrock where Maria requests help.",
    access: "Enter with empty equipment and backpack, and no follower.",
  },
  "Tolna's rift entrance": {
    name: "Tolna's rift entrance",
    wiki: "Tolna's rift",
    image: "A_Soul's_Bane.png",
    members: false,
    summary: "Launa waits beside the rift east of Varrock.",
  },
  "Cooks' Guild": {
    name: "Cooks' Guild",
    wiki: "Cooks' Guild",
    image: "Cooking_Guild.png",
    members: false,
    summary:
      "The Head Chef works in the guild west of Varrock's Grand Exchange.",
    access: "32 Cooking and a chef's hat, or an applicable alternative.",
  },
  "Gower farm": {
    name: "Gower farm",
    wiki: "Gower farm",
    image: "Cabbages_with_partyhats.png",
    members: false,
    summary: "The Gower brothers' cabbage farm lies south of Varrock.",
  },
};
