import type { QuestRecord, ItemReference } from "./data";
import type { CombatPlan } from "./combatData";
import type { LocationRecord } from "./locations";

// Current RS Wiki quest articles and quick guides, checked 4 November 2026:
// https://runescape.wiki/w/Gunnar%27s_Ground https://runescape.wiki/w/Rune_Mysteries
// https://runescape.wiki/w/Druidic_Ritual https://runescape.wiki/w/Wolf_Whistle
// https://runescape.wiki/w/Death_Plateau https://runescape.wiki/w/Stolen_Hearts
// https://runescape.wiki/w/Pirate%27s_Treasure https://runescape.wiki/w/Witch%27s_Potion_(miniquest)
// https://runescape.wiki/w/Imp_Catcher https://runescape.wiki/w/Demon_Slayer
// Start coordinates are the articles' raw Maplinks; the tower entrance is the
// access Maplink in Imp Catcher. Art is from the linked article infoboxes.
export const UNLOCK_QUESTS: QuestRecord[] = [
  {
    id: "gunnars-ground",
    name: "Gunnar's Ground",
    icon: "Gunnar's_Ground_icon.png",
    artwork: "Gunnar's_Ground.png",
    members: false,
    difficulty: "Novice",
    length: "Short to Medium",
    start: {
      npc: "Dororan",
      npcWiki: "Dororan",
      image: "Dororan_chathead_(Gunnar's_Ground).png",
      location: "Gunnarsgrunn",
      meetingPoint: "At the eastern gate of Gunnarsgrunn.",
      map: { x: 3099, y: 3422, plane: 0 },
    },
    why: "Help a dwarf poet and a barbarian find common ground, with Crafting experience and further jewellery-engraving tasks.",
    requirements: [{ skill: "Crafting", level: 5 }],
    questRequirements: [],
    supplies: [],
    rewards: [
      "5 quest points if Romeo & Juliet was not completed",
      "300 Crafting XP and a 200 XP lamp for a skill of at least level 5",
      "Swanky boots",
      "Further jewellery-engraving tasks from Dororan",
    ],
    wiki: "Gunnar's Ground",
  },
  {
    id: "rune-mysteries",
    preparationNotes: [
      "Keep several backpack spaces free and use the standard spellbook, or be able to cast Spellbook Swap.",
    ],
    name: "Rune Mysteries",
    icon: "Rune_Mysteries_icon.png",
    artwork: "Rune_Mysteries.png",
    members: false,
    difficulty: "Novice",
    length: "Medium to Long",
    start: {
      npc: "Ariane",
      npcWiki: "Ariane",
      image: "Ariane_chathead.png",
      location: "Wizards' Tower",
      meetingPoint:
        "At the entrance lobby of the Wizards' Tower, south of Draynor Village.",
      map: { x: 3102, y: 3155, plane: 0 },
    },
    why: "Investigate the threat to the tower with Ariane and discover its forgotten history.",
    requirements: [],
    questRequirements: [],
    supplies: [
      "Optional: magic armour; the tower supplies a mindspike for casting",
    ],
    rewards: [
      "1 quest point",
      "250 Magic XP lamp and 250 Runecrafting XP",
      "Tower mindspike, first tower hat, air talisman and 70 mind runes",
      "Four wizard order titles",
    ],
    wiki: "Rune Mysteries",
  },
  {
    id: "druidic-ritual",
    name: "Druidic Ritual",
    icon: "Druidic_Ritual_icon.png",
    artwork: "Druidic_Ritual.png",
    members: false,
    difficulty: "Novice",
    length: "Short",
    start: {
      npc: "Kaqemeex",
      npcWiki: "Kaqemeex",
      image: "Kaqemeex_chathead.png",
      location: "Taverley",
      meetingPoint:
        "The stone circle north of Taverley and south of the Heroes' Guild.",
      map: { x: 2924, y: 3484, plane: 0 },
    },
    why: "Assist the druids' ritual and learn the basics of Herblore.",
    requirements: [],
    questRequirements: [],
    supplies: ["1 coin"],
    rewards: [
      "4 quest points",
      "250 Herblore XP",
      "15 noted grimy guams and 15 eyes of newt",
    ],
    wiki: "Druidic Ritual",
  },
  {
    id: "wolf-whistle",
    name: "Wolf Whistle",
    icon: "Wolf_Whistle_icon.png",
    artwork: "Wolf_Whistle.png",
    members: false,
    difficulty: "Novice",
    length: "Short to Medium",
    start: {
      npc: "Pikkupstix",
      npcWiki: "Pikkupstix",
      image: "Pikkupstix_chathead.png",
      location: "Pikkupstix's Summoning Shop",
      meetingPoint: "Inside Pikkupstix's house in Taverley.",
      map: { x: 2930, y: 3448, plane: 0 },
    },
    why: "Learn about familiars and earn a substantial starter supply of Summoning charms.",
    requirements: [],
    questRequirements: [],
    supplies: [],
    rewards: [
      "1 quest point",
      "276 Summoning XP lamp and 275 gold charms",
      "Access to the troll cave in the well",
    ],
    wiki: "Wolf Whistle",
  },
  {
    id: "death-plateau",
    preparationNotes: ["Leave at least one backpack space free."],
    name: "Death Plateau",
    icon: "Death_Plateau_icon.png",
    artwork: "Death_Plateau.png",
    members: false,
    difficulty: "Novice",
    length: "Short",
    start: {
      npc: "Commander Denulth",
      npcWiki: "Commander Denulth",
      image: "Commander_Denulth_chathead.png",
      location: "Burthorpe training camp",
      meetingPoint: "At the Burthorpe training camp.",
      map: { x: 2918, y: 3561, plane: 0 },
    },
    why: "Help the Imperial Guard find a route towards Death Plateau and unlock repeatable supply-run rewards.",
    requirements: [],
    questRequirements: [],
    supplies: ["Optional: food and combat equipment for the troll"],
    rewards: [
      "1 quest point unless already awarded for the old quest",
      "Three 100 XP reward lamps",
      "Five post-quest supply runs award a total of fifteen 180 XP lamps",
    ],
    wiki: "Death Plateau",
  },
  {
    id: "stolen-hearts",
    name: "Stolen Hearts",
    icon: "Stolen_Hearts_icon.png",
    artwork: "Stolen_Hearts.png",
    members: false,
    difficulty: "Novice",
    length: "Medium to Long",
    start: {
      npc: "Ozan",
      npcWiki: "Ozan",
      image: "Ozan_chathead.png",
      location: "Draynor Village",
      meetingPoint: "Find Ozan in Draynor Village.",
      map: { x: 3094, y: 3275, plane: 0 },
    },
    why: "Join Ozan's investigation and start the desert adventure that replaced Prince Ali Rescue.",
    requirements: [],
    questRequirements: [],
    supplies: [
      "Optional: food and suitable combat equipment, especially at low levels",
    ],
    rewards: [
      "3 quest points if Prince Ali Rescue was not completed",
      "2,500 coins",
      "250 Constitution XP lamp and 250 combat-skill XP lamp",
      "Additional Agility and Thieving lamps are members-only",
    ],
    wiki: "Stolen Hearts",
  },
  {
    id: "pirates-treasure",
    name: "Pirate's Treasure",
    icon: "Pirate's_Treasure_icon.png",
    artwork: "Pirate's_Treasure.png",
    members: false,
    difficulty: "Novice",
    length: "Short",
    start: {
      npc: "Redbeard Frank",
      npcWiki: "Redbeard Frank",
      image: "Redbeard_Frank_chathead.png",
      location: "The Rusty Anchor",
      meetingPoint: "Just south of the Rusty Anchor pub in Port Sarim.",
      map: { x: 3053, y: 3248, plane: 0 },
    },
    why: "Follow a pirate's lead to a treasure casket and unlock paid plantation work.",
    requirements: [],
    questRequirements: [],
    supplies: [
      "1 white apron; one also spawns at Gerrant's shop",
      "60 coins for ship fares",
      "Optional: pack 10 bananas, or pick them during the quest",
    ],
    rewards: [
      "2 quest points",
      "Pirate's treasure casket containing 450 coins, an emerald and a gold ring",
      "Access to paid banana plantation work",
    ],
    wiki: "Pirate's Treasure",
  },
  {
    id: "witchs-potion",
    name: "Witch's Potion (miniquest)",
    kind: "miniquest",
    icon: "Witch's_Potion_(miniquest)_icon.png",
    artwork: "Witch's_Potion_(miniquest).png",
    members: false,
    difficulty: "Novice",
    length: "Very Short",
    start: {
      npc: "Hetty",
      npcWiki: "Hetty",
      image: "Hetty_chathead.png",
      location: "Rimmington",
      meetingPoint: "Hetty's house in Rimmington.",
      map: { x: 2968, y: 3206, plane: 0 },
    },
    why: "Gather ingredients for Hetty's potion for a small early Magic reward.",
    requirements: [],
    questRequirements: [],
    supplies: ["1 burnt meat", "1 eye of newt", "1 onion"],
    rewards: ["325 Magic XP"],
    wiki: "Witch's Potion (miniquest)",
  },
  {
    id: "imp-catcher",
    name: "Imp Catcher",
    icon: "Imp_Catcher_icon.png",
    artwork: "Imp_Catcher.png",
    members: false,
    difficulty: "Novice",
    length: "Short",
    start: {
      npc: "Wizard Mizgog",
      npcWiki: "Wizard Mizgog",
      image: "Wizard_Mizgog_chathead.png",
      location: "Wizards' Tower",
      meetingPoint:
        "South-east room on the first floor above ground, reached via the tower's central beam.",
      map: { x: 3109, y: 3148, plane: 1 },
    },
    why: "Find Mizgog's four unique beads with the imps by the elemental altars; ordinary tradeable beads do not work.",
    requirements: [],
    questRequirements: [],
    supplies: [
      "1 bowl of hot water",
      "Optional: teleports near the four elemental altars",
    ],
    rewards: [
      "1 quest point",
      "Amulet of accuracy and an 875 Magic XP lamp",
      "Mizgog sells replacement amulets of accuracy for 5,000 coins",
    ],
    wiki: "Imp Catcher",
  },
  {
    id: "demon-slayer",
    name: "Demon Slayer",
    icon: "Demon_Slayer_icon.png",
    artwork: "Demon_Slayer.png",
    members: false,
    difficulty: "Novice",
    length: "Short",
    start: {
      npc: "Gideon Bede",
      npcWiki: "Gideon Bede",
      image: "Gideon_Bede_chathead.png",
      location: "Varrock Saradominist church",
      meetingPoint: "At the Saradominist church north of Varrock Museum.",
      map: { x: 3250, y: 3483, plane: 0 },
    },
    why: "Stop a cult's summoning and earn Silverlight, a weapon effective against demons.",
    requirements: [],
    questRequirements: [],
    supplies: [
      "Food is recommended regardless of combat level",
      "Optional: suitable combat equipment; the final demon must be attacked in melee",
    ],
    rewards: [
      "3 quest points",
      "Three 100 combat XP lamps",
      "Silverlight, an Avernic wand and an Avernic book",
    ],
    wiki: "Demon Slayer",
  },
];

export const UNLOCK_COMBAT: Record<string, CombatPlan> = {
  "gunnars-ground": {
    required: [],
    hazards: [
      {
        name: "Haakon the Champion",
        wiki: "Haakon the Champion",
        image: "Haakon_the_champion.png",
        level: 40,
      },
    ],
    notes: ["The challenge to Haakon is optional."],
  },
  "rune-mysteries": {
    required: [],
    hazards: [],
    notes: [
      "Use Magic to lure the vortex; this is an interaction, not a required kill. The tower supplies a tower mindspike.",
    ],
  },
  "druidic-ritual": { required: [], hazards: [], notes: [] },
  "wolf-whistle": { required: [], hazards: [], notes: [] },
  "death-plateau": {
    required: [
      { name: "The Map", wiki: "The Map", image: "The_Map.png", level: 9 },
    ],
    hazards: [],
    notes: [],
  },
  "stolen-hearts": {
    required: [
      {
        name: "Skulls mercenary",
        wiki: "Skulls mercenary",
        image: "Skulls_mercenary2.png",
        level: 2,
      },
      {
        name: "Mercenary Joe",
        wiki: "Mercenary Joe",
        image: "Mercenary_Joe.png",
        level: 2,
      },
    ],
    hazards: [],
    notes: ["Two Skulls mercenaries and Mercenary Joe must be fought."],
  },
  "pirates-treasure": {
    required: [],
    hazards: [
      {
        name: "Gardener",
        wiki: "Gardener",
        image: "Gardener_(Falador_Park).png",
        level: 4,
      },
    ],
    notes: ["The gardener encounter is optional."],
  },
  "witchs-potion": {
    required: [{ name: "Rat", wiki: "Rat", image: "Rat.png", level: 1 }],
    hazards: [],
    notes: ["The rat's tail is obtained after starting the miniquest."],
  },
  "imp-catcher": {
    required: [
      {
        name: "Choleric imp",
        wiki: "Choleric imp",
        image: "Calm_imp.png",
        level: 5,
      },
    ],
    hazards: [],
    notes: [
      "The quest beads come from four specific imps, not ordinary imp drops.",
    ],
  },
  "demon-slayer": {
    required: [
      {
        name: "Skeleton",
        wiki: "Skeleton (Demon Slayer)",
        image: "Skeleton_(Demon_Slayer).png",
        level: 1,
      },
      { name: "Cultist", wiki: "Cultist", image: "Cultist.png", level: 1 },
      { name: "Delrith", wiki: "Delrith", image: "Delrith.png", level: 15 },
    ],
    hazards: [],
    notes: [
      "Expect ten skeletons and nine cultists. Delrith must be attacked with melee; bring food.",
    ],
  },
};

// Eye of newt, Coins and Onion references are reused from other catalogue modules.
export const UNLOCK_ITEMS: ItemReference[] = [
  {
    name: "Bowl of hot water",
    wiki: "Bowl of hot water",
    image: "Bowl_of_hot_water.png",
    aliases: ["bowls of hot water"],
  },
  { name: "Burnt meat", wiki: "Burnt meat", image: "Burnt_meat.png" },
  { name: "Banana", wiki: "Banana", image: "Banana.png", aliases: ["bananas"] },
  { name: "Vial", wiki: "Vial", image: "Vial.png", aliases: ["vials"] },
  {
    name: "White apron",
    wiki: "White apron",
    image: "White_apron.png",
    aliases: ["white aprons"],
  },
];

export const UNLOCK_LOCATIONS: Record<string, LocationRecord> = {
  "Wizards' Tower": {
    name: "Wizards' Tower",
    wiki: "Wizards' Tower",
    image: "Rune_Mysteries.png",
    members: false,
    summary: "The wizards' tower on the island south of Draynor Village.",
  },
  "Burthorpe training camp": {
    name: "Burthorpe training camp",
    wiki: "Burthorpe training camp",
    image: "Burthorpe_training_camp.png",
    members: false,
    summary: "The Imperial Guard's training camp in Burthorpe.",
  },
  "Varrock Saradominist church": {
    name: "Varrock Saradominist church",
    wiki: "Varrock Saradominist church",
    image: "Varrock_Saradominist_church.png",
    members: false,
    summary:
      "The church north of Varrock Museum, where Gideon Bede begins Demon Slayer.",
  },
};
