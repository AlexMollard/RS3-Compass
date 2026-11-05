import type { ItemReference, SkillRecord, TrainingOption } from "./data.ts";
import type { LocationRecord } from "./locations.ts";

// Locations and images: https://runescape.wiki/w/Burthorpe_Troll_Cave
// https://runescape.wiki/w/Lumbridge_Catacombs https://runescape.wiki/w/City_of_Um
// https://runescape.wiki/w/Pikkupstix%27s_Summoning_Shop
export const COMBAT_LOCATIONS: Record<string, LocationRecord> = {
  "Burthorpe Troll Cave": {
    name: "Burthorpe Troll Cave",
    wiki: "Burthorpe_Troll_Cave",
    image: "Burthorpe_Troll_Cave.png",
    members: false,
    summary: "Low-level trolls north of Burthorpe; combat tutors stand inside.",
    access:
      "Bring food and leave if overwhelmed; different troll types use different styles.",
  },
  "Lumbridge Catacombs": {
    name: "Lumbridge Catacombs",
    wiki: "Lumbridge_Catacombs",
    image: "Lumbridge_Catacombs.png",
    members: false,
    summary: "Low-level undead and experiments beneath Lumbridge cemetery.",
    access: "Complete The Blood Pact to reach the lower catacombs.",
  },
  "City of Um": {
    name: "City of Um",
    wiki: "City_of_Um",
    image: "City_of_Um.png",
    members: false,
    summary: "The ritual site and Well of Souls are in the underworld city.",
    access:
      "Enter the portal north of Draynor lodestone and complete Necromancy! to train the skill.",
  },
  "Pikkupstix's Summoning Shop": {
    name: "Pikkupstix's Summoning Shop",
    wiki: "Pikkupstix's_Summoning_Shop",
    image: "Pikkupstix's_Summoning_Shop_exterior.png",
    members: false,
    summary:
      "Pikkupstix sells supplies at the Taverley shop; an obelisk is inside.",
    access:
      "Wolf Whistle introduces Summoning but is not required to train it.",
  },
  "Stronghold of Player Safety": {
    name: "Stronghold of Player Safety",
    wiki: "Stronghold_of_Player_Safety",
    image: "Cockroach_soldier.png",
    members: false,
    summary: "Dungeon containing cockroach soldiers and their carapace drops.",
    access:
      "Enter the stronghold south of Edgeville; soldiers are dangerous to unprepared players.",
  },
  "Edgeville Dungeon hill giants": {
    name: "Edgeville Dungeon hill giants",
    wiki: "Edgeville_Dungeon",
    image: "Hill_Giant_(1).png",
    members: false,
    summary: "Hill giants drop big bones in the dungeon beneath Edgeville.",
    access:
      "Enter from Edgeville, or use a brass key for the locked shed entrance.",
  },
  "Asgarnian Ice Dungeon": {
    name: "Asgarnian Ice Dungeon",
    wiki: "Asgarnian_Ice_Dungeon",
    image: "Ice_giant.png",
    members: false,
    summary: "A southern Asgarnian dungeon with ice giants and ice warriors.",
    access:
      "Enter south of Port Sarim; aggressive ice warriors make the giant area dangerous.",
  },
  "Taverley Dungeon blue dragons": {
    name: "Taverley Dungeon blue dragons",
    wiki: "Taverley_Dungeon",
    image: "Blue_dragon.png",
    members: true,
    summary: "Blue dragons provide dragon bones and blue dragonhide.",
    access:
      "Bring dragonfire protection; check dungeon access and shortcuts before travelling.",
  },
  "Wilderness blue dragons": {
    name: "Wilderness blue dragons",
    wiki: "Blue_dragon",
    image: "Blue_dragon.png",
    members: false,
    summary:
      "Blue dragons north of Goblin Village drop dragon bones and blue dragonhide.",
    access: "Bring dragonfire protection and prepare for Wilderness threats.",
  },
  "Anachronia Slayer Master": {
    name: "Anachronia Slayer Master",
    wiki: "Laniakea",
    image: "Laniakea_chathead.png",
    members: true,
    summary: "Laniakea assigns advanced Slayer tasks on Anachronia.",
    access: "Assignments require 120 combat and 90 Slayer.",
  },
  "Vannaka at Edgeville": {
    name: "Vannaka at Edgeville",
    wiki: "Vannaka",
    image: "Vannaka_chathead.png",
    members: false,
    summary: "Slayer master south of Edgeville bank in the ruins.",
    access:
      "Assignments require combat level 30; progression beyond the free Slayer trial requires membership.",
  },
  "Varrock Sewers moss giants": {
    name: "Varrock Sewers moss giants",
    wiki: "Moss_giant",
    image: "Moss_giant_(2).png",
    members: false,
    summary: "Moss giants provide big bones and runes.",
    access: "Travel through Varrock Sewers to the giant area.",
  },
  "Stronghold of Security ankou": {
    name: "Stronghold of Security ankou",
    wiki: "Ankou",
    image: "Ankou.png",
    members: false,
    summary: "Ankou inhabit the fourth floor.",
    access: "Descend through the Stronghold of Security.",
  },
  "Wilderness hellhounds": {
    name: "Wilderness hellhounds",
    wiki: "Hellhound",
    image: "Hellhound.png",
    members: false,
    summary: "Hellhounds inhabit the Wilderness Crater.",
    access: "Prepare for Wilderness threats and aggressive hellhounds.",
  },
  "Slayer Tower abyssal demons": {
    name: "Slayer Tower abyssal demons",
    wiki: "Abyssal_demon",
    image: "Abyssal_demon.png",
    members: true,
    summary: "Abyssal demons require 85 Slayer.",
    access: "Reach the third floor of the Slayer Tower in Morytania.",
  },
  "Slayer Tower gargoyles": {
    name: "Slayer Tower gargoyles",
    wiki: "Gargoyle",
    image: "Gargoyle.png",
    members: true,
    summary: "Gargoyles require 75 Slayer and a finishing tool.",
    access: "Reach the third floor and bring a rock hammer.",
  },
  "Sumona at Pollnivneach": {
    name: "Sumona at Pollnivneach",
    wiki: "Sumona",
    image: "Sumona.png",
    members: true,
    summary: "Slayer master in Pollnivneach.",
    access: "Complete Smoking Kills before requesting assignments.",
  },
  "Kuradal at Ancient Cavern": {
    name: "Kuradal at Ancient Cavern",
    wiki: "Kuradal",
    image: "Kuradal.png",
    members: true,
    summary: "Advanced Slayer master in the Ancient Cavern.",
    access: "Access the Ancient Cavern via Barbarian Training.",
  },
  Ectofuntus: {
    name: "Ectofuntus",
    wiki: "Ectofuntus",
    image: "Ectotemple.png",
    members: true,
    summary:
      "Bone-grinding, slime gathering and offering stations north of Port Phasmatys.",
    access:
      "Enter Morytania through Priest in Peril or by defeating the Paterdomus mausoleum ghoul. Ghosts Ahoy provides an optional ectophial teleport.",
  },
};

// Item images and recipes: https://runescape.wiki/w/Free-to-play_Prayer_training
// https://runescape.wiki/w/Dreadfowl_pouch https://runescape.wiki/w/Summoning_training
// https://runescape.wiki/w/Free-to-play_Ranged_training https://runescape.wiki/w/Free-to-play_Magic_training
export const COMBAT_ITEMS: ItemReference[] = [
  { name: "Raw beef", wiki: "Raw beef", image: "Raw_beef.png" },
  { name: "Marigolds", wiki: "Marigolds", image: "Marigolds.png" },
  {
    name: "Bagged plant 1",
    wiki: "Bagged plant 1",
    image: "Bagged_plant_1.png",
  },
  { name: "Granite (500g)", wiki: "Granite", image: "Granite_(500g).png" },
  {
    name: "Earth talisman",
    wiki: "Earth talisman",
    image: "Earth_talisman.png",
  },
  {
    name: "Water talisman",
    wiki: "Water talisman",
    image: "Water_talisman.png",
  },
  {
    name: "Infernal ashes",
    wiki: "Infernal ashes",
    image: "Infernal_ashes.png",
  },
  {
    name: "Mithril stone spirit",
    wiki: "Mithril stone spirit",
    image: "Mithril_stone_spirit.png",
    aliases: ["mithril stone spirits"],
  },
  {
    name: "Adamantite stone spirit",
    wiki: "Adamantite stone spirit",
    image: "Adamantite_stone_spirit.png",
    aliases: ["adamantite stone spirits"],
  },
  {
    name: "Death rune",
    wiki: "Death rune",
    image: "Death_rune.png",
    aliases: ["death runes"],
  },
  {
    name: "Adamant arrow",
    wiki: "Adamant arrow",
    image: "Adamant_arrow_5.png",
    aliases: ["adamant arrows"],
  },
  { name: "Granite maul", wiki: "Granite maul", image: "Granite_maul.png" },
  { name: "Abyssal whip", wiki: "Abyssal whip", image: "Abyssal_whip.png" },
  {
    name: "Compost mound pouch",
    wiki: "Compost mound pouch",
    image: "Compost_mound_pouch.png",
    aliases: ["compost mound pouches"],
  },
  {
    name: "Granite lobster pouch",
    wiki: "Granite lobster pouch",
    image: "Granite_lobster_pouch.png",
    aliases: ["granite lobster pouches"],
  },
  {
    name: "Moss titan pouch",
    wiki: "Moss titan pouch",
    image: "Moss_titan_pouch.png",
    aliases: ["moss titan pouches"],
  },
  {
    name: "Geyser titan pouch",
    wiki: "Geyser titan pouch",
    image: "Geyser_titan_pouch.png",
    aliases: ["geyser titan pouches"],
  },
  {
    name: "Basic ritual candle",
    wiki: "Basic ritual candle",
    image: "Basic_ritual_candle.png",
    aliases: ["basic ritual candles"],
  },
  {
    name: "Basic ghostly ink",
    wiki: "Basic ghostly ink",
    image: "Basic_ghostly_ink.png",
  },
  {
    name: "Regular ghostly ink",
    wiki: "Regular ghostly ink",
    image: "Regular_ghostly_ink.png",
  },
  {
    name: "Greater ghostly ink",
    wiki: "Greater ghostly ink",
    image: "Greater_ghostly_ink.png",
  },
  {
    name: "Powerful ghostly ink",
    wiki: "Powerful ghostly ink",
    image: "Powerful_ghostly_ink.png",
  },
  {
    name: "Death guard",
    wiki: "Death guard",
    image: "Death_guard_(tier_10).png",
  },
  {
    name: "Skull lantern",
    wiki: "Skull lantern",
    image: "Skull_lantern_(tier_10).png",
  },
  { name: "Bones", wiki: "Bones", image: "Bones.png", aliases: ["bone"] },
  { name: "Big bones", wiki: "Big_bones", image: "Big_bones.png" },
  {
    name: "Gold charm",
    wiki: "Gold_charm",
    image: "Gold_charm.png",
    aliases: ["gold charms"],
  },
  {
    name: "Spirit shards",
    wiki: "Spirit_shards",
    image: "Spirit_shards.png",
    aliases: ["spirit shard"],
  },
  {
    name: "Pouch",
    wiki: "Pouch",
    image: "Pouch.png",
    aliases: ["empty pouch", "empty pouches"],
  },
  { name: "Raw chicken", wiki: "Raw_chicken", image: "Raw_chicken.png" },
  {
    name: "Granite crab pouch",
    wiki: "Granite_crab_pouch",
    image: "Granite_crab_pouch.png",
    aliases: ["granite crab pouches"],
  },
  {
    name: "Dreadfowl pouch",
    wiki: "Dreadfowl_pouch",
    image: "Dreadfowl_pouch.png",
    aliases: ["dreadfowl pouches"],
  },
  // https://runescape.wiki/w/Spirit_wolf_pouch
  {
    name: "Spirit wolf pouch",
    wiki: "Spirit_wolf_pouch",
    image: "Spirit_wolf_pouch.png",
    aliases: ["spirit wolf pouches"],
  },
  { name: "Wolf bones", wiki: "Wolf_bones", image: "Wolf_bones.png" },
  { name: "Chargebow", wiki: "Chargebow", image: "Chargebow.png" },
  { name: "Staff of air", wiki: "Staff_of_air", image: "Staff_of_air.png" },
  {
    name: "Feather",
    wiki: "Feather",
    image: "Feather.png",
    aliases: ["feathers"],
  },
  {
    name: "Cowhide",
    wiki: "Cowhide",
    image: "Cowhide.png",
    aliases: ["cowhides"],
  },
  { name: "Carapace", wiki: "Carapace", image: "Carapace.png" },
  { name: "Dragon bones", wiki: "Dragon_bones", image: "Dragon_bones.png" },
  {
    name: "Blue dragonhide",
    wiki: "Blue_dragonhide",
    image: "Blue_dragonhide.png",
  },
  {
    name: "Accursed ashes",
    wiki: "Accursed_ashes",
    image: "Accursed_ashes.png",
  },
  {
    name: "Crimson charm",
    wiki: "Crimson_charm",
    image: "Crimson_charm.png",
    aliases: ["crimson charms"],
  },
  {
    name: "Blue charm",
    wiki: "Blue_charm",
    image: "Blue_charm.png",
    aliases: ["blue charms"],
  },
  {
    name: "Green charm",
    wiki: "Green_charm",
    image: "Green_charm.png",
    aliases: ["green charms"],
  },
  { name: "Beaver pouch", wiki: "Beaver_pouch", image: "Beaver_pouch.png" },
  {
    name: "Bull ant pouch",
    wiki: "Bull_ant_pouch",
    image: "Bull_ant_pouch.png",
  },
  {
    name: "Stranger plant pouch",
    wiki: "Stranger_plant_pouch",
    image: "Stranger_plant_pouch.png",
  },
  { name: "Bunyip pouch", wiki: "Bunyip_pouch", image: "Bunyip_pouch.png" },
  { name: "Rock hammer", wiki: "Rock_hammer", image: "Rock_hammer.png" },
  { name: "Impious ashes", wiki: "Impious_ashes", image: "Impious_ashes.png" },
  { name: "Dusty key", wiki: "Dusty_key", image: "Dusty_key.png" },
];

// https://runescape.wiki/w/Free-to-play_melee_training
// https://runescape.wiki/w/Cockroach_soldier https://runescape.wiki/w/Free-to-play_Prayer_training
// https://runescape.wiki/w/Slayer_Masters https://runescape.wiki/w/Summoning_training
// https://runescape.wiki/w/Necromancy_training https://runescape.wiki/w/Combat_Style_Modernisation
// Spawn coordinates and map IDs: the LocLine tables on the individual creature Wiki pages.
// Activity coordinates: https://runescape.wiki/w/Obelisk and https://runescape.wiki/w/Um_ritual_site
const chickenSite = {
  label: "Lumbridge chicken farm",
  wiki: "Chicken",
  map: { x: 3230, y: 3298, plane: 0 as const, mapId: 28 },
};
const hillSite = {
  label: "Edgeville Dungeon hill giant room",
  wiki: "Hill_giant",
  map: { x: 3111, y: 9841, plane: 0 as const, mapId: 31 },
  access: "Enter from Edgeville, or use a brass key at the shed.",
};
const dragonSite = {
  label: "Taverley Dungeon blue dragons",
  wiki: "Blue_dragon",
  map: { x: 2899, y: 9802, plane: 0 as const, mapId: 17 },
  access:
    "Members. Use the 70 Agility pipe shortcut, or bring a dusty key for the long route. Obtain the key by freeing Velrak from the Black Knights' prison in the dungeon. Prepare for dragonfire.",
};
const jacquelynSite = {
  label: "Jacquelyn, Lumbridge",
  wiki: "Jacquelyn",
  map: { x: 3221, y: 3221, plane: 0 as const, mapId: 28 },
  access: "Assignment targets and their locations vary.",
};
const obeliskSite = {
  label: "Pikkupstix's house obelisk",
  wiki: "Obelisk",
  map: { x: 2932, y: 3447, plane: 0 as const, mapId: 28 },
  access: "Use the full obelisk, not the small recharge-only obelisk.",
};
const ritualSite = {
  label: "Um ritual site",
  wiki: "Um_ritual_site",
  map: { x: 1038, y: 1776, plane: 1 as const, mapId: -1 },
  access: "Enter the Underworld portal; complete Necromancy! for rituals.",
};

const chicken: TrainingOption = {
  id: "chickens",
  title: "Chickens",
  wiki: "Chicken",
  image: "Chicken.png",
  locations: ["Lumbridge"],
  sites: [chickenSite],
  method:
    "Fight chickens at the farm north-east of Lumbridge and collect their drops.",
  benefit:
    "Feathers support Fishing; raw chicken and bones support Cooking and Prayer. Easy kills trade combat experience for useful supplies.",
};
const cows: TrainingOption = {
  id: "cows",
  title: "Cows",
  wiki: "Cow",
  image: "Cow.png",
  locations: ["Lumbridge"],
  sites: [
    {
      label: "Lumbridge cow field",
      wiki: "Cow",
      map: { x: 3254, y: 3258, plane: 0, mapId: 28 },
    },
  ],
  method:
    "Fight cows in the pen east of the River Lum and bank or tan their hides.",
  benefit:
    "Cowhide supplies Crafting, raw beef supplies Cooking, and bones supply Prayer; banking slows combat training.",
};
const trolls: TrainingOption = {
  id: "troll-chuckers",
  title: "Troll chuckers",
  wiki: "Troll_chucker",
  image: "Troll_chucker.png",
  locations: ["Burthorpe Troll Cave"],
  method: "Practise abilities against troll chuckers near the cave tutors.",
  sites: [
    {
      label: "Burthorpe Troll Cave chuckers",
      wiki: "Troll_chucker",
      map: { x: 155, y: 301, plane: 0, mapId: 719 },
    },
  ],
  benefit:
    "Convenient early combat practice, but fewer useful resources than chickens or cows.",
  risks: "Leave if trolls overwhelm your food supply.",
};
const giants: TrainingOption = {
  id: "hill-giants",
  title: "Hill giants",
  wiki: "Hill_giant",
  image: "Hill_Giant_(1).png",
  locations: ["Edgeville Dungeon hill giants"],
  method: "Fight hill giants in Edgeville Dungeon and bank their big bones.",
  sites: [hillSite],
  benefit:
    "Big bones provide more Prayer experience per bone than ordinary bones, alongside combat experience.",
  requirements: [
    "A brass key is useful for the shed entrance but not required from Edgeville.",
  ],
  risks:
    "Giants hit hard for an unprepared player; bring food and an escape, and move back to cows if needed.",
};
const iceGiants: TrainingOption = {
  id: "ice-giants",
  title: "Ice giants",
  wiki: "Ice_giant",
  image: "Ice_giant.png",
  locations: ["Asgarnian Ice Dungeon"],
  method: "Fight ice giants and collect their big bones.",
  sites: [
    {
      label: "Asgarnian Ice Dungeon ice giants",
      wiki: "Ice_giant",
      map: { x: 3061, y: 9573, plane: 0, mapId: 25 },
    },
  ],
  benefit:
    "Substantial combat targets and Prayer supplies, at the cost of a longer, riskier trip.",
  risks:
    "Nearby ice warriors can attack; bring food and a teleport, and leave if you cannot sustain the damage.",
};
const roaches: TrainingOption = {
  id: "cockroach-soldiers",
  title: "Cockroach soldiers",
  wiki: "Cockroach_soldier",
  image: "Cockroach_soldier.png",
  locations: ["Stronghold of Player Safety"],
  method:
    "Fight soldiers in the stronghold; earth spells exploit their weakness, although other styles can train here.",
  sites: [
    {
      label: "Player Safety stronghold soldier area",
      wiki: "Cockroach_soldier",
      map: { x: 112, y: 121, plane: 0, mapId: 9 },
      access: "Enter the stronghold and reach the middle level.",
    },
  ],
  benefit:
    "Carapace supports ranged armour crafting; mithril stone spirits and adamantite stone spirits support Mining, and salvage provides alchemy value. Members-only seeds do not drop in F2P.",
  risks:
    "They hit hard even through rune armour. Test one with food and an escape; a combat skill level alone does not establish readiness.",
};
const dragons: TrainingOption = {
  id: "blue-dragons",
  title: "Blue dragons",
  wiki: "Blue_dragon",
  image: "Blue_dragon.png",
  members: true,
  locations: ["Taverley Dungeon blue dragons"],
  method: "Kill blue dragons and bank dragon bones and blue dragonhide.",
  sites: [dragonSite],
  benefit:
    "Supplies Prayer and Crafting while training combat; bulky drops cost banking time.",
  requirements: [
    "Access to the dragons and effective dragonfire protection",
    "An anti-dragon shield requires a compatible one-handed weapon; verify protection for your chosen style",
  ],
  supplies: ["Dragonfire protection for your weapon setup", "Food", "Teleport"],
  risks:
    "Dragonfire is dangerous; bring food and a teleport, and check your protection before engaging.",
};
const necroDragons: TrainingOption = {
  ...dragons,
  id: "necro-blue-dragons",
  requirements: [
    "Access to the dragons",
    "Super antifire protects against ordinary dragonfire while keeping both Necromancy weapons equipped; an anti-dragon shield replaces the skull lantern",
  ],
  supplies: ["Super antifire (3)", "Food", "Teleport"],
  risks:
    "Do not engage without effective dragonfire protection. Keep potion protection active; bring food and a teleport for the dragons' other attacks.",
};
const wildDragons: TrainingOption = {
  id: "wilderness-blue-dragons",
  title: "Wilderness blue dragons",
  wiki: "Blue_dragon",
  image: "Blue_dragon.png",
  locations: ["Wilderness blue dragons"],
  sites: [
    {
      label: "Wilderness blue dragon spawns",
      wiki: "Blue_dragon",
      map: { x: 2967, y: 3535, plane: 0, mapId: 28 },
      access:
        "North of Goblin Village in the Wilderness; prepare for dragonfire and Wilderness threats.",
    },
  ],
  method:
    "Fight blue dragons north of Goblin Village and collect their bones and hides.",
  benefit:
    "A stronger free-player combat target with dragon bones and blue dragonhide; banking slows training.",
  requirements: [
    "Appropriate equipment and dragonfire protection",
    "Use an anti-dragon shield with a compatible one-handed weapon unless you have verified effective alternative protection",
  ],
  supplies: ["Dragonfire protection for your weapon setup", "Food", "Teleport"],
  risks:
    "Dragonfire and Wilderness threats can be dangerous; bring food and an escape.",
};
// Exact LocLine spawns: https://runescape.wiki/w/Moss_giant, /w/Ankou, /w/Hellhound,
// /w/Gargoyle and /w/Abyssal_demon; Slayer Tower floors are plane 2.
const moss: TrainingOption = {
  id: "moss-giants",
  title: "Moss giants",
  wiki: "Moss_giant",
  image: "Moss_giant_(2).png",
  locations: ["Varrock Sewers moss giants"],
  sites: [
    {
      label: "Varrock Sewers moss giant chamber",
      wiki: "Moss_giant",
      map: { x: 3159, y: 9900, plane: 0, mapId: 31 },
    },
  ],
  method:
    "Fight moss giants in the Varrock Sewers and collect their big bones and runes.",
  benefit:
    "Big bones support Prayer and runes support Magic; the trip and banking slow combat training.",
  risks: "Their melee attacks can overwhelm low-level players; bring food.",
};
const ankou: TrainingOption = {
  id: "ankou",
  title: "Ankou",
  wiki: "Ankou",
  image: "Ankou.png",
  locations: ["Stronghold of Security ankou"],
  sites: [
    {
      label: "Stronghold fourth-floor ankou room",
      wiki: "Ankou",
      map: { x: 114, y: 43, plane: 0, mapId: 24 },
      access: "Descend to the fourth floor.",
    },
  ],
  method:
    "Fight ankou on the fourth floor; earth spells exploit their weakness.",
  benefit:
    "Death runes, adamant arrows and mithril stone spirits support Magic, Ranged and Mining; members-only herbs are not a F2P drop.",
  risks: "They hit harder than early monsters; bring food and an escape.",
};
const hellhounds: TrainingOption = {
  id: "wild-hellhounds",
  title: "Wilderness hellhounds",
  wiki: "Hellhound",
  image: "Hellhound.png",
  locations: ["Wilderness hellhounds"],
  sites: [
    {
      label: "Wilderness Crater hellhounds",
      wiki: "Hellhound",
      map: { x: 3110, y: 3687, plane: 0, mapId: 28 },
      access: "Level 23 Wilderness; prepare for Wilderness threats.",
    },
  ],
  method: "Fight level 92 hellhounds in the Wilderness Crater.",
  benefit:
    "Stronger free-player combat training with bones; ordinary drops are limited, so choose another target for supplies.",
  risks: "Aggressive hellhounds and Wilderness threats make this dangerous.",
};
const gargoyles: TrainingOption = {
  id: "gargoyles",
  title: "Gargoyles",
  wiki: "Gargoyle",
  image: "Gargoyle.png",
  members: true,
  locations: ["Slayer Tower gargoyles"],
  sites: [
    {
      label: "Slayer Tower gargoyle room",
      wiki: "Gargoyle",
      map: { x: 3440, y: 3556, plane: 2, mapId: 28 },
    },
  ],
  method:
    "Fight gargoyles on the third floor of the Slayer Tower; finish weakened gargoyles with a rock hammer.",
  benefit:
    "Rune salvage and stone spirits provide alchemy and Mining supplies; a granite maul is a rare drop.",
  requirements: [
    "75 Slayer",
    "Rock hammer or another valid gargoyle finisher",
    "Enter Morytania by completing Priest in Peril or defeating the Paterdomus mausoleum ghoul",
  ],
  supplies: ["Rock hammer"],
  risks: "Bring food; the hammer is needed to finish kills.",
};
const abyssals: TrainingOption = {
  id: "abyssal-demons",
  title: "Abyssal demons",
  wiki: "Abyssal_demon",
  image: "Abyssal_demon.png",
  members: true,
  locations: ["Slayer Tower abyssal demons"],
  sites: [
    {
      label: "Slayer Tower abyssal demon room",
      wiki: "Abyssal_demon",
      map: { x: 3407, y: 3548, plane: 2, mapId: 28 },
    },
  ],
  method: "Fight abyssal demons on the third floor of the Slayer Tower.",
  benefit:
    "Infernal ashes support Prayer, while salvage and gems provide resources; an abyssal whip is a rare drop.",
  requirements: [
    "85 Slayer",
    "Enter Morytania by completing Priest in Peril or defeating the Paterdomus mausoleum ghoul",
  ],
  risks:
    "Their teleports can disrupt positioning; bring suitable equipment and food.",
};
const assigned: TrainingOption = {
  id: "slayer-assignment",
  title: "Slayer assignments",
  wiki: "Jacquelyn",
  image: "Jacquelyn_chathead.png",
  members: true,
  locations: ["Lumbridge"],
  sites: [jacquelynSite],
  method:
    "Take a suitable assignment from Jacquelyn or another unlocked Slayer master, then fight the assigned creatures.",
  benefit:
    "Earn Slayer progress and task drops alongside combat instead of focusing exclusively on combat experience.",
  risks:
    "Tasks differ in difficulty and equipment requirements; inspect the target and use a safer master if needed.",
};
function stage(
  from: number,
  to: number,
  title: string,
  method: string,
  options: TrainingOption[],
  members = false,
  supplies: string[] = [],
) {
  return { from, to, title, method, options, supplies, members };
}
function combatSkill(
  name: SkillRecord["name"],
  cap: number,
  description: string,
  instruction: string,
  supplies: string[],
): SkillRecord {
  const method = `${instruction} Select targets for your whole equipment and survival setup, not this skill alone; return to an easier option whenever necessary.`;
  return {
    name,
    category: "Combat",
    icon: `${name}.png`,
    description,
    goal: 20,
    payoff: `Improve ${name} through combat and unlock stronger equipment or abilities.`,
    wiki: name,
    trainingWiki:
      name === "Ranged"
        ? "Free-to-play_Ranged_training"
        : name === "Magic"
          ? "Free-to-play_Magic_training"
          : "Free-to-play_melee_training",
    maxLevel: cap,
    stages: [
      stage(
        1,
        20,
        "Learn combat and gather supplies",
        method,
        [chicken, cows, trolls],
        false,
        supplies,
      ),
      stage(
        20,
        50,
        "Gather materials while improving gear",
        method,
        [cows, giants, moss, assigned],
        false,
        supplies,
      ),
      stage(
        50,
        80,
        "Choose bones or stronger drops",
        method,
        [
          moss,
          ankou,
          roaches,
          iceGiants,
          wildDragons,
          dragons,
          gargoyles,
          assigned,
        ],
        false,
        supplies,
      ),
      stage(
        80,
        cap,
        "Continue towards mastery",
        method,
        [
          ankou,
          wildDragons,
          hellhounds,
          roaches,
          dragons,
          gargoyles,
          abyssals,
          assigned,
        ],
        false,
        supplies,
      ),
    ],
    membersNote: `Free players can continue training ${name} to ${cap}; member assignments and Taverley dragons are additional options, not a requirement.`,
  };
}
function option(
  id: string,
  title: string,
  wiki: string,
  image: string,
  locations: string[],
  method: string,
  benefit: string,
  extra: Partial<TrainingOption> & Pick<TrainingOption, "sites">,
): TrainingOption {
  return { id, title, wiki, image, locations, method, benefit, ...extra };
}
// Current Ectofuntus mechanics and exact object map: https://runescape.wiki/w/Ectofuntus
const ectofuntus = option(
  "ectofuntus",
  "Ectofuntus offerings",
  "Ectofuntus",
  "Ectofuntus.png",
  ["Ectofuntus"],
  "Grind your bones upstairs, collect slime downstairs, then worship at the Ectofuntus. Empty pots and buckets are generated by the activity, so you do not need to bring them. Use a ghostspeak amulet when collecting ecto-tokens.",
  "Each offering grants four times the base burial XP, conserving gathered bones at the cost of grinding, slime collection and travel.",
  {
    members: true,
    sites: [
      {
        label: "Ectofuntus worship station",
        wiki: "Ectofuntus",
        map: { x: 3658, y: 3518, plane: 0, mapId: 28 },
        access:
          "Bone grinder upstairs; slime downstairs. Ghosts Ahoy and an ectophial make return travel easier but are not mandatory.",
      },
    ],
    requirements: ["Membership and access to Morytania"],
    supplies: ["Bones", "Ghostspeak amulet for collecting ecto-tokens"],
  },
);
const altar = option(
  "surface-altar",
  "Bury collected bones",
  "Bones",
  "Bones.png",
  ["Lumbridge"],
  "Bury bones dropped by chickens at the Lumbridge farm, or save them for a suitable offering method.",
  "Burial converts readily available bones into Prayer experience without any altar or bank trip.",
  { sites: [chickenSite] },
);
const bigBones = option(
  "giant-bones",
  "Hill giant bones",
  "Hill_giant",
  "Hill_Giant_(1).png",
  ["Edgeville Dungeon hill giants"],
  "Fight hill giants and bury or bank their big bones.",
  "Big bones give more Prayer experience per inventory than ordinary bones, while advancing combat.",
  {
    sites: [hillSite],
    risks: "Giants are dangerous without appropriate gear, food and an escape.",
  },
);
const dragonPrayer = option(
  "dragon-bones",
  "Dragon bones",
  "Blue_dragon",
  "Blue_dragon.png",
  ["Taverley Dungeon blue dragons"],
  "Collect dragon bones from blue dragons and bury or bank them.",
  "More experience per bone than big bones, offset by tougher combat and banking.",
  {
    sites: [dragonSite],
    members: true,
    requirements: ["Dragonfire protection and access to blue dragons."],
    risks: "Dragonfire and nearby monsters are dangerous.",
  },
);
const ashes = option(
  "demon-ashes",
  "Demon ashes",
  "Imp",
  "Impious_ashes.png",
  ["Lumbridge"],
  "Scatter impious ashes from imps at Karamja Volcano.",
  "Turns demon kills into Prayer experience without a bank trip.",
  {
    sites: [
      {
        label: "Karamja Volcano imps",
        wiki: "Imp",
        map: { x: 2842, y: 3162, plane: 0, mapId: 28 },
        access: "Travel to Karamja; imps wander and teleport.",
      },
    ],
  },
);
const jacquelyn = option(
  "jacquelyn",
  "Jacquelyn assignments",
  "Jacquelyn",
  "Jacquelyn_chathead.png",
  ["Lumbridge"],
  "Ask Jacquelyn for an assignment and defeat the assigned creatures.",
  "Combines Slayer and combat experience; task drops depend on the assigned monster.",
  {
    sites: [jacquelynSite],
    risks:
      "Check target location and any required Slayer equipment before leaving.",
  },
);
const vannaka = option(
  "vannaka",
  "Vannaka assignments",
  "Vannaka",
  "Vannaka_chathead.png",
  ["Vannaka at Edgeville"],
  "Ask Vannaka south of Edgeville bank for an assignment.",
  "More varied assignments, with Slayer progress and combat drops.",
  {
    sites: [
      {
        label: "Vannaka south of Edgeville bank",
        wiki: "Vannaka",
        map: { x: 3091, y: 3478, plane: 0, mapId: 28 },
        access: "Assignment targets and their locations vary.",
      },
    ],
    members: true,
    requirements: ["30 combat level."],
    risks:
      "Tasks can be harder than early assignments; check protection and equipment.",
  },
);
const sumona = option(
  "sumona",
  "Sumona assignments",
  "Sumona",
  "Sumona.png",
  ["Sumona at Pollnivneach"],
  "After Smoking Kills, request assignments from Sumona in Pollnivneach.",
  "Her assignments offer varied Slayer targets and full Slayer point rewards.",
  {
    members: true,
    sites: [
      {
        label: "Sumona in Pollnivneach",
        wiki: "Sumona",
        map: { x: 3358, y: 2993, plane: 0, mapId: 28 },
        access: "Assignment targets vary.",
      },
    ],
    requirements: ["35 Slayer", "90 combat", "Smoking Kills"],
    risks: "Prepare equipment and supplies for the assigned target.",
  },
);
const kuradal = option(
  "kuradal",
  "Kuradal assignments",
  "Kuradal",
  "Kuradal.png",
  ["Kuradal at Ancient Cavern"],
  "Request assignments from Kuradal in the Ancient Cavern.",
  "Higher-level tasks combine combat drops and Slayer progress.",
  {
    members: true,
    sites: [
      {
        label: "Kuradal in Ancient Cavern",
        wiki: "Kuradal",
        map: { x: 138, y: 64, plane: 0, mapId: 36 },
        access:
          "Partial Barbarian Training grants Ancient Cavern access; assignment targets vary.",
      },
    ],
    requirements: ["75 Slayer", "110 combat", "Ancient Cavern access"],
    risks: "Advanced assignments require appropriate protection.",
  },
);
const laniakea = option(
  "laniakea",
  "Laniakea assignments",
  "Laniakea",
  "Laniakea_chathead.png",
  ["Anachronia Slayer Master"],
  "Take assignments from Laniakea and prepare specifically for the assigned creature.",
  "Advanced tasks build Slayer towards 120 and can yield valuable monster drops.",
  {
    sites: [
      {
        label: "Laniakea at Anachronia base camp",
        wiki: "Laniakea",
        map: { x: 3924, y: 4274, plane: 0, mapId: 28 },
        access: "Members; assignment targets and their locations vary.",
      },
    ],
    members: true,
    requirements: ["90 Slayer", "120 combat level", "Access to Anachronia"],
    risks:
      "Advanced creatures can hit hard and may require specialist equipment.",
  },
);
const pouchIngredients: Record<string, string[]> = {
  "spirit-wolf": ["Gold charm", "7 Spirit shards", "Wolf bones"],
  dreadfowl: ["Gold charm", "8 Spirit shards", "Raw chicken"],
  "granite-crab": ["Gold charm", "7 Spirit shards", "Iron ore"],
  "compost-mound": ["Green charm", "47 Spirit shards", "Compost"],
  beaver: ["Green charm", "72 Spirit shards", "Willow logs"],
  "bull-ant": ["Gold charm", "11 Spirit shards", "Marigolds"],
  "stranger-plant": ["Crimson charm", "128 Spirit shards", "Bagged plant 1"],
  bunyip: ["Green charm", "110 Spirit shards", "Raw shark"],
  "granite-lobster": ["Crimson charm", "166 Spirit shards", "Granite (500g)"],
  "moss-titan": ["Blue charm", "202 Spirit shards", "Earth talisman"],
  "geyser-titan": ["Blue charm", "222 Spirit shards", "Water talisman"],
};
const summoning = (
  id: string,
  title: string,
  wiki: string,
  image: string,
  method: string,
  benefit: string,
  members = true,
) =>
  option(
    id,
    title,
    wiki,
    image,
    ["Pikkupstix's Summoning Shop"],
    method,
    benefit,
    {
      sites: [obeliskSite],
      ...(members ? { members: true } : {}),
      supplies: ["Pouch", ...pouchIngredients[id]],
    },
  );
const wolf = summoning(
  "spirit-wolf",
  "Spirit wolf pouch",
  "Spirit_wolf_pouch",
  "Spirit_wolf_pouch.png",
  "Infuse a pouch with a gold charm, 7 spirit shards and wolf bones at the obelisk.",
  "A first pouch; Wolf Whistle is optional and awards experience and gold charms.",
  false,
);
const dreadfowl = summoning(
  "dreadfowl",
  "Dreadfowl pouch",
  "Dreadfowl_pouch",
  "Dreadfowl_pouch.png",
  "At level 4 infuse a pouch using a gold charm, 8 spirit shards and raw chicken.",
  "Chickens provide the tertiary ingredient; gold charms can be collected from early trolls.",
  false,
);
const crab = summoning(
  "granite-crab",
  "Granite crab pouch",
  "Granite_crab_pouch",
  "Granite_crab_pouch.png",
  "At level 16 infuse a gold charm pouch with iron ore and spirit shards.",
  "Mine iron ore yourself and spend gold charms. Keep useful pouches; surplus granite crab pouches can be exchanged for shards at Bogrog or Lord Amlodd from 26 Summoning.",
);
const compostMound = summoning(
  "compost-mound",
  "Compost mound pouch",
  "Compost_mound_pouch",
  "Compost_mound_pouch.png",
  "At level 28 infuse a pouch with a green charm, 47 spirit shards and compost.",
  "Compost is a farmable tertiary; this spends green charms and more shards than granite crabs.",
);
// Recipes: https://runescape.wiki/w/Beaver_pouch, /w/Bull_ant_pouch,
// /w/Stranger_plant_pouch and /w/Bunyip_pouch.
const beaver = summoning(
  "beaver",
  "Beaver pouch",
  "Beaver_pouch",
  "Beaver_pouch.png",
  "At level 33 infuse a pouch with a green charm, 72 spirit shards and willow logs.",
  "Willow logs are gatherable; spend green charms and shards for a Woodcutting familiar.",
);
const bullAnt = summoning(
  "bull-ant",
  "Bull ant pouch",
  "Bull_ant_pouch",
  "Bull_ant_pouch.png",
  "At level 40 infuse a pouch with a gold charm, 11 spirit shards and marigolds.",
  "Grow marigolds for the tertiary ingredient; the familiar can carry supplies.",
);
const stranger = summoning(
  "stranger-plant",
  "Stranger plant pouch",
  "Stranger_plant_pouch",
  "Stranger_plant_pouch.png",
  "At level 64 infuse a pouch with a crimson charm, 128 spirit shards and bagged plant 1.",
  "Spends crimson charms and purchased plants; compare the shard and coin cost with saved charms.",
);
const bunyip = summoning(
  "bunyip",
  "Bunyip pouch",
  "Bunyip_pouch",
  "Bunyip_pouch.png",
  "At level 68 infuse a pouch with a green charm, 110 spirit shards and raw shark.",
  "The healing familiar is useful for combat, but sharks and shards compete with other supplies.",
);
const lobster = summoning(
  "granite-lobster",
  "Granite lobster pouch",
  "Granite_lobster_pouch",
  "Granite_lobster_pouch.png",
  "At level 74 infuse a crimson charm pouch using granite (500g) and 166 spirit shards.",
  "A useful way to spend crimson charms; granite must be gathered or otherwise obtained.",
);
const titan = summoning(
  "moss-titan",
  "Moss titan pouch",
  "Moss_titan_pouch",
  "Moss_titan_pouch.png",
  "At level 79 infuse a blue charm pouch using an earth talisman and 202 spirit shards.",
  "Higher experience per blue charm than low-tier pouches, but talismans and shards cost resources.",
);
const geyser = summoning(
  "geyser-titan",
  "Geyser titan pouch",
  "Geyser_titan_pouch",
  "Geyser_titan_pouch.png",
  "At level 89 infuse a blue charm pouch using a water talisman and 222 spirit shards.",
  "A high-level use for blue charms through level 99; compare your talisman and shard supply with crimson alternatives.",
);
const ritual = option(
  "communion",
  "Lesser communion",
  "Lesser_communion",
  "Um_ritual_site.png",
  ["City of Um"],
  "At level 5 use one Elemental I and two Commune I glyphs with suitable bones or mementos; tend disturbances.",
  "The ritual produces souls for the Well of Souls and ectoplasm, at the cost of glyph materials.",
  {
    sites: [ritualSite],
    requirements: [
      "Complete Necromancy!",
      "5 Necromancy",
      "Ink quantities cover a fresh glyph layout; bring extra for repairs and a focus for each ritual",
    ],
    supplies: [
      "11 Basic ghostly ink",
      "Basic ritual candles",
      "Eligible bones or mementos",
    ],
  },
);
const combatNecro = option(
  "necro-combat",
  "Necromancy combat",
  "Chicken",
  "Chicken.png",
  ["Lumbridge"],
  "Use your necromancy weapons and unlocked abilities against chickens or other enemies suited to your equipment.",
  "Earn combat experience and useful drops while saving ritual materials.",
  {
    sites: [chickenSite],
    requirements: ["Complete Necromancy!"],
    supplies: [
      "Level-appropriate Death guard",
      "Level-appropriate Skull lantern",
      "Food",
    ],
    risks:
      "Move to stronger enemies only when your equipment and survival are adequate.",
  },
);
// https://runescape.wiki/w/Greater_communion https://runescape.wiki/w/Powerful_communion
const memberRitual = { ...ritual, members: true };
const greaterRitual = {
  ...ritual,
  id: "greater-communion",
  title: "Greater communion",
  wiki: "Greater_communion",
  members: true,
  method:
    "At level 60 use two Elemental II, one Commune I and two Commune II glyphs with eligible bones or mementos.",
  requirements: [
    "60 Necromancy",
    "Ink quantities cover a fresh glyph layout; budget additional repair ink and eligible foci",
  ],
  supplies: [
    "8 Basic ghostly ink",
    "6 Regular ghostly ink",
    "8 Greater ghostly ink",
    "Basic ritual candles",
    "Eligible bones or mementos",
  ],
  benefit:
    "Build souls and ectoplasm for talents and supplies; higher-tier glyphs consume better ink.",
};
const powerfulRitual = {
  ...ritual,
  id: "powerful-communion",
  title: "Powerful communion",
  wiki: "Powerful_communion",
  members: true,
  method:
    "At level 90 use four Elemental III, two Commune II and two Commune III glyphs with eligible high-level bones or mementos.",
  requirements: [
    "90 Necromancy, unboosted",
    "Ink quantities cover a fresh glyph layout; budget additional repair ink and eligible high-level foci",
  ],
  supplies: [
    "8 Regular ghostly ink",
    "20 Greater ghostly ink",
    "8 Powerful ghostly ink",
    "Basic ritual candles",
    "Eligible high-level bones or mementos",
  ],
  benefit:
    "Generate souls and ectoplasm using high-tier materials; multiply glyphs increase output when available.",
};
const memberNecro = {
  ...combatNecro,
  title: "Necromancy at hill giants",
  wiki: "Hill_giant",
  image: "Hill_Giant_(1).png",
  locations: ["Edgeville Dungeon hill giants"],
  sites: [hillSite],
  members: true,
  method:
    "Fight hill giants with Necromancy; upgrade deathwarden equipment through Kili's tasks and unlock talents at the Well of Souls.",
};

export const COMBAT_SKILLS: SkillRecord[] = [
  combatSkill(
    "Attack",
    120,
    "Train melee accuracy and unlock stronger melee weapons.",
    "Select Attack experience in Gameplay > Combat & Action Bar > Combat XP; match weapon type to the target's weakness.",
    ["Suitable melee weapon", "Armour", "Food"],
  ),
  combatSkill(
    "Defence",
    99,
    "Improve survivability and unlock protective armour.",
    "Select Defence experience in combat settings; Defence can be trained with your chosen combat style.",
    ["Suitable weapon and armour", "Food"],
  ),
  combatSkill(
    "Strength",
    120,
    "Improve melee damage through combat.",
    "Select Strength experience in combat settings; upgrade weapons using Attack and match their type to the target's weakness.",
    ["Suitable melee weapon", "Armour", "Food"],
  ),
  combatSkill(
    "Constitution",
    99,
    "Increase life points by fighting with any combat style.",
    "Constitution experience accompanies combat; use the style and equipment appropriate to the target.",
    ["Suitable combat equipment", "Food"],
  ),
  combatSkill(
    "Ranged",
    120,
    "Fight from a distance using ranged weapons and abilities.",
    "Select Ranged experience; a chargebow needs no ammunition, while other weapons need compatible ammunition.",
    ["Ranged weapon", "Compatible ammunition if needed", "Food"],
  ),
  combatSkill(
    "Magic",
    120,
    "Use spells for combat, travel and utility.",
    "Select Magic experience and a combat spell; match elemental weakness when practical. A staff of air supplies air runes.",
    ["Magic weapon", "Runes for the chosen spell", "Food"],
  ),
  {
    name: "Prayer",
    category: "Combat",
    icon: "Prayer.png",
    description: "Offer remains to unlock prayers and increase prayer points.",
    goal: 20,
    payoff: "Unlock prayers and increase your prayer-point pool.",
    wiki: "Prayer",
    trainingWiki: "Free-to-play_Prayer_training",
    maxLevel: 99,
    stages: [
      stage(
        1,
        20,
        "Collect your first remains",
        "Complete The Restless Ghost for its Prayer rewards, then collect and bury bones.",
        [altar, ashes],
      ),
      stage(
        20,
        50,
        "Gather better bones",
        "Choose enemies according to combat readiness, not Prayer level. Members can conserve bones with Ectofuntus offerings.",
        [altar, bigBones, ashes, ectofuntus],
      ),
      stage(
        50,
        99,
        "Continue to 99",
        "Gather big bones or Wilderness dragon bones in free play; members can exchange extra preparation time for more XP per bone.",
        [
          bigBones,
          {
            ...wildDragons,
            id: "wild-dragon-prayer",
            title: "Wilderness dragon bones",
            method:
              "Collect dragon bones from Wilderness blue dragons, then bury or bank them.",
          },
          dragonPrayer,
          ectofuntus,
        ],
      ),
    ],
    membersNote:
      "Membership adds stronger remains and altar methods; Prayer itself reaches 99 in free play.",
  },
  {
    name: "Slayer",
    category: "Combat",
    icon: "Slayer.png",
    description: "Complete assignments and unlock specialised monsters.",
    goal: 20,
    payoff:
      "Unlock creatures and assignments as Slayer and combat levels rise.",
    wiki: "Slayer",
    trainingWiki: "Slayer_training",
    maxLevel: 120,
    freeToPlayCap: 5,
    stages: [
      stage(
        1,
        5,
        "Try Slayer",
        "Take a task from Jacquelyn; free Slayer experience stops at level 5.",
        [jacquelyn],
        false,
        ["Combat equipment", "Food"],
      ),
      stage(
        5,
        30,
        "Build assignments",
        "Continue assignments after subscribing; Vannaka requires combat level 30, not Slayer level 30.",
        [{ ...jacquelyn, members: true }, vannaka],
        true,
      ),
      stage(
        30,
        35,
        "Advance assignments",
        "Continue Vannaka assignments while preparing for Smoking Kills.",
        [vannaka],
        true,
      ),
      stage(
        35,
        75,
        "Unlock Sumona",
        "Complete Smoking Kills and use Sumona once you also reach 90 combat; otherwise continue Vannaka.",
        [vannaka, sumona],
        true,
      ),
      stage(
        75,
        90,
        "Advanced masters",
        "Kuradal requires 110 combat and Ancient Cavern access; gargoyles require 75 Slayer and a finisher. Continue Vannaka if advanced masters are locked.",
        [
          vannaka,
          sumona,
          kuradal,
          {
            ...gargoyles,
            method:
              "When assigned gargoyles, fight them on the Slayer Tower's third floor and finish them with a rock hammer.",
          },
          {
            ...abyssals,
            method:
              "At 85 Slayer, fight abyssal demons when assigned to earn Slayer experience.",
          },
        ],
        true,
      ),
      stage(
        90,
        120,
        "Advanced Slayer",
        "Choose Laniakea at 120 combat or Kuradal at 110 combat; continue Vannaka if their requirements are unmet.",
        [
          vannaka,
          laniakea,
          kuradal,
          {
            ...abyssals,
            method:
              "Fight abyssal demons when assigned to earn Slayer experience.",
          },
        ],
        true,
      ),
    ],
    membersNote:
      "The free trial ends at level 5. Assignment eligibility is separate from the Slayer level displayed in a stage.",
  },
  {
    name: "Summoning",
    category: "Combat",
    icon: "Summoning.png",
    description: "Infuse pouches to create familiars.",
    goal: 16,
    payoff: "Create familiars for combat and utility.",
    wiki: "Summoning",
    trainingWiki: "Summoning_training",
    maxLevel: 99,
    freeToPlayCap: 5,
    stages: [
      stage(
        1,
        5,
        "First pouches",
        "Infuse at Pikkupstix's obelisk; Wolf Whistle is optional.",
        [wolf, dreadfowl],
      ),
      stage(
        5,
        16,
        "Continue infusing",
        "After subscribing, make dreadfowl pouches with saved gold charms.",
        [{ ...dreadfowl, members: true }],
        true,
      ),
      stage(
        16,
        28,
        "Spend gold charms",
        "Use granite crabs with mined iron ore.",
        [crab],
        true,
      ),
      stage(
        28,
        33,
        "Use green charms",
        "Make compost mound pouches with green charms or continue granite crabs.",
        [compostMound, crab],
        true,
      ),
      stage(
        33,
        40,
        "Use green charms",
        "Make beavers with willow logs or continue granite crabs.",
        [beaver, crab],
        true,
      ),
      stage(
        40,
        64,
        "Make beasts of burden",
        "Grow marigolds for bull ants and use willow logs for beavers.",
        [bullAnt, beaver, crab],
        true,
      ),
      stage(
        64,
        68,
        "Spend crimson charms",
        "Make stranger plants with crimson charms or use gold and green charm alternatives.",
        [stranger, bullAnt, beaver],
        true,
      ),
      stage(
        68,
        74,
        "Make healing familiars",
        "Use raw sharks for bunyips or make stranger plants with crimson charms.",
        [bunyip, stranger, bullAnt],
        true,
      ),
      stage(
        74,
        79,
        "Crimson pouches",
        "Balance available charms, shards and tertiary ingredients rather than assuming purchases on an Ironman.",
        [lobster, crab],
        true,
      ),
      stage(
        79,
        89,
        "Titan pouches",
        "Choose according to your charm and talisman supply.",
        [titan, lobster, crab],
        true,
      ),
      stage(
        89,
        99,
        "Finish with high-level pouches",
        "Infuse the pouches your supplies support; exchange surplus pouches for shards where available.",
        [geyser, titan, lobster],
        true,
      ),
    ],
    membersNote:
      "Free players can train only to level 5; charms and tertiary ingredients must be collected.",
  },
  {
    name: "Necromancy",
    category: "Combat",
    icon: "Necromancy.png",
    description: "Fight with Necromancy and perform rituals in the City of Um.",
    goal: 20,
    payoff: "Unlock abilities and advance the Well of Souls.",
    wiki: "Necromancy",
    trainingWiki: "Necromancy_training",
    maxLevel: 120,
    freeToPlayCap: 20,
    stages: [
      stage(
        1,
        20,
        "Enter the Underworld",
        "Complete Necromancy! via the portal north of Draynor; lesser communion unlocks at level 5.",
        [combatNecro, ritual],
      ),
      stage(
        20,
        40,
        "Upgrade with Kili",
        "After subscribing, complete Kili Row and check each equipment upgrade's materials.",
        [memberNecro, memberRitual],
        true,
      ),
      stage(
        40,
        60,
        "Develop talents and equipment",
        "Use Necromancy against moss giants or blue dragons when equipped; continue Kili's armour tasks.",
        [
          { ...moss, id: "necro-moss", members: true },
          memberRitual,
          necroDragons,
        ],
        true,
      ),
      stage(
        60,
        90,
        "Greater communion",
        "Use greater communion for souls; improve equipment and choose combat targets for your gear and Slayer level.",
        [
          greaterRitual,
          necroDragons,
          { ...gargoyles, id: "necro-gargoyles" },
          { ...abyssals, id: "necro-abyssals" },
        ],
        true,
      ),
      stage(
        90,
        120,
        "Powerful communion",
        "Use powerful communion for high-tier souls and ectoplasm, or train combat for supplies.",
        [
          powerfulRitual,
          { ...abyssals, id: "necro-abyssals" },
          { ...gargoyles, id: "necro-gargoyles" },
        ],
        true,
      ),
    ],
    membersNote:
      "The free trial ends at level 20; levels 20–120 require membership.",
  },
];
