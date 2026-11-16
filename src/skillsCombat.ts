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
  // Added 2026-11-16 for the refreshed combat routes; each from its Wiki location page's infobox.
  "Stronghold of Security": {
    name: "Stronghold of Security",
    wiki: "Stronghold_of_Security",
    image: "Vault_of_War.png",
    members: false,
    summary: "A four-level dungeon under Barbarian Village: Flesh Crawlers on the second level, catablepons on the third.",
    access: "The entrance is in the middle of Barbarian Village; its doors ask security questions.",
  },
  Abyss: {
    name: "Abyss",
    wiki: "Abyss",
    image: "The_Abyss.png",
    members: true,
    summary: "Aggressive abyssal creatures gather in the south-west and south-east corners.",
    access: "Complete Enter the Abyss, then use the Mage of Zamorak in the Wilderness north of Edgeville.",
  },
  "Karamja Volcano": {
    name: "Karamja Volcano",
    wiki: "Karamja_Volcano",
    image: "Karamja_Volcano.png",
    members: false,
    summary: "The dungeon under the volcano holds many lesser demons.",
    access: "Travel to Karamja and climb down into the volcano.",
  },
  "Exiled Kalphite Hive": {
    name: "Exiled Kalphite Hive",
    wiki: "Exiled_Kalphite_Hive",
    image: "Exiled_Kalphite_Hive.png",
    members: true,
    summary: "High-level kalphites, including the aggressive marauders, in the Kharidian Desert.",
    access: "The Kalphite entrance is south of the Jaldraocht Pyramid and north of Menaphos.",
  },
  "Taverley Dungeon": {
    name: "Taverley Dungeon",
    wiki: "Taverley_Dungeon",
    image: "Inside_Taverley_Dungeon.png",
    members: true,
    summary: "A members' dungeon with chaos druids near the entrance and dragons deeper in.",
    access: "The entrance is south of Taverley, west of Falador.",
  },
  "Chaos Temple Dungeon": {
    name: "Chaos Temple Dungeon",
    wiki: "Chaos_Temple_Dungeon",
    image: "Zemouregal's_Base.png",
    members: true,
    summary: "Dense, aggressive armoured zombies.",
    access: "Partial completion of Defender of Varrock; Hartwin in Varrock Palace teleports you in.",
  },
  "Slayer Tower Mausoleum": {
    name: "Slayer Tower Mausoleum",
    wiki: "Slayer_Tower_Mausoleum",
    image: "Morytania_Slayer_Tower_Mausoleum.png",
    members: true,
    summary: "The crypt under the Slayer Tower, home to ravenous ghouls.",
    access: "Enter through the trapdoor in the Slayer Tower's south-east corner.",
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

// "Wear at least" item tiers. Each reason states the threat from the method's Wiki page (its `wiki`
// field; for a Slayer master, that master's assignment table), read on the date below.
const gear = (minTier: number, reason: string) => ({
  minTier,
  reason,
  checked: "2026-11-16",
});

// The current RuneScape Wiki training guides each combat method was checked against, read on 2026-11-16.
const W = "https://runescape.wiki/w/";
const F2P_MELEE = W + "Free-to-play_melee_training";
const P2P_MELEE = W + "Pay-to-play_melee_training";
const F2P_RANGED = W + "Free-to-play_Ranged_training";
const P2P_RANGED = W + "Pay-to-play_Ranged_training";
const F2P_MAGIC = W + "Free-to-play_Magic_training";
const P2P_MAGIC = W + "Pay-to-play_Magic_training";
const NECRO = W + "Necromancy_training";
const IRON_NECRO = W + "Ironman_Mode/Guide/Necromancy";
const ABYSS = W + "Abyss/Combat_training";
const checked = (...sources: string[]) => ({ checked: "2026-11-16", sources });

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
  gear: gear(1, "Level 1 chickens never attack first and hit at most 15, so any gear will do."),
  ...checked(F2P_MELEE, F2P_RANGED),
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
  gear: gear(1, "Level 2 cows never attack first and hit at most 20, so any gear will do."),
  ...checked(F2P_MELEE, F2P_RANGED),
};
const trolls: TrainingOption = {
  id: "troll-chuckers",
  title: "Troll chuckers",
  wiki: "Troll_chucker",
  image: "Troll_chucker.png",
  locations: ["Burthorpe Troll Cave"],
  method:
    "Fight troll chuckers in the Burthorpe Troll Cave. They respawn every 20–30 seconds, so there is always a target.",
  sites: [
    {
      label: "Burthorpe Troll Cave chuckers",
      wiki: "Troll_chucker",
      map: { x: 155, y: 301, plane: 0, mapId: 719 },
    },
  ],
  benefit:
    "The fastest free start: the Wiki's melee guide puts them at around 35,000 XP an hour, and they die in a hit or two. Drops are worth less than chickens' or cows'.",
  risks: "Leave if trolls overwhelm your food supply.",
  gear: gear(1, "Level 7 troll chuckers don't attack first; their thrown ranged attacks hit at most 100."),
  ...checked(F2P_MELEE, F2P_RANGED, P2P_MELEE),
};
const giants: TrainingOption = {
  id: "hill-giants",
  title: "Hill giants",
  wiki: "Hill_giant",
  image: "Hill_Giant_(1).png",
  locations: ["Edgeville Dungeon hill giants"],
  method:
    "Fight hill giants in Edgeville Dungeon and bank their big bones. Magic users can cast Air Blast from the dungeon's safe spots from level 41.",
  sites: [hillSite],
  benefit:
    "Low Defence for their life points, and every kill drops big bones for Prayer. The Wiki's melee guides recommend them from about 30 Attack.",
  requirements: [
    "A brass key is useful for the shed entrance but not required from Edgeville.",
  ],
  risks:
    "Giants hit hard for an unprepared player; bring food and an escape, and move back to cows if needed.",
  gear: gear(20, "Level 26 hill giants attack on sight and hit up to 450 in melee."),
  ...checked(F2P_MELEE, P2P_MELEE, F2P_MAGIC, P2P_RANGED),
};
const iceGiants: TrainingOption = {
  id: "ice-giants",
  title: "Ice giants",
  wiki: "Ice_giant",
  image: "Ice_giant.png",
  locations: ["Asgarnian Ice Dungeon"],
  method:
    "Fight ice giants and ice warriors in the Asgarnian Ice Dungeon and collect their big bones. Magic users cast Fire Bolt from level 35.",
  sites: [
    {
      label: "Asgarnian Ice Dungeon ice giants",
      wiki: "Ice_giant",
      map: { x: 3061, y: 9573, plane: 0, mapId: 25 },
    },
  ],
  benefit:
    "They're aggressive, so it's semi-AFK: the Wiki's melee guide puts it at up to about 135,000 XP an hour, with big bones for Prayer.",
  risks:
    "Nearby ice warriors can attack; bring food and a teleport, and leave if you cannot sustain the damage.",
  gear: gear(40, "Level 47 ice giants attack on sight and hit up to 750 in melee."),
  ...checked(F2P_MELEE, F2P_MAGIC),
};
const blueDragonReason =
  "Level 74 blue dragons hit up to 349 with magic and melee, and their dragonfire hits well over 1,000 without protection.";
const dragons: TrainingOption = {
  id: "blue-dragons",
  title: "Blue dragons",
  wiki: "Blue_dragon",
  image: "Blue_dragon.png",
  members: true,
  locations: ["Taverley Dungeon blue dragons"],
  method:
    "Kill blue dragons and bank dragon bones and blue dragonhide. They are weak to bolts, so rangers use a crossbow.",
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
  gear: gear(50, blueDragonReason),
  ...checked(P2P_RANGED),
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
  gear: gear(50, blueDragonReason),
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
  gear: gear(30, "Level 40 moss giants attack on sight and hit up to 625 in melee."),
  ...checked(F2P_MELEE),
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
    "Fight ankou on the fourth floor of the Stronghold of Security; they are weak to earth spells, and mages cast Air Blast from the room's safe spots.",
  benefit:
    "The best free XP from 70: the Wiki's guides put it at up to about 200,000 melee or 140,000 Magic XP an hour. Death runes, adamant arrows and mithril stone spirits support Magic, Ranged and Mining.",
  risks: "They hit harder than early monsters; bring food and an escape.",
  gear: gear(40, "Level 54 ankou hit up to 800 in melee."),
  ...checked(F2P_MELEE, F2P_MAGIC, P2P_MAGIC),
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
  method:
    "Fight level 92 hellhounds in the Wilderness Crater with a slash weapon, using Protect Item.",
  benefit:
    "They're aggressive and respawn fast, so it's semi-AFK: the Wiki's melee guide puts it at up to about 124,000 XP an hour. Drops are only bones.",
  risks: "Aggressive hellhounds and Wilderness threats make this dangerous.",
  gear: gear(
    50,
    "Level 92 hellhounds attack on sight and hit up to 264 in melee, in the Wilderness where players can attack too.",
  ),
  ...checked(F2P_MELEE),
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
  gear: gear(
    60,
    "Level 93 gargoyles attack on sight, hit up to 268 in melee and have 6,700 life points to wear down before the rock hammer.",
  ),
  ...checked(P2P_MAGIC),
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
  method:
    "Fight abyssal demons on the third floor of the Slayer Tower; aggression potions make them easy to AFK at higher levels.",
  benefit:
    "High XP per kill. Infernal ashes support Prayer and crimson charms Summoning, while salvage and gems provide resources; an abyssal whip is a rare drop.",
  requirements: [
    "85 Slayer",
    "Enter Morytania by completing Priest in Peril or defeating the Paterdomus mausoleum ghoul",
  ],
  risks:
    "Their teleports can disrupt positioning; bring suitable equipment and food.",
  gear: gear(
    70,
    "Level 98 abyssal demons hit up to 672 in melee, have 8,500 life points and teleport around you.",
  ),
  ...checked(P2P_MELEE, P2P_MAGIC, P2P_RANGED, NECRO),
};
const jacquelynReason =
  "Jacquelyn assigns early Lumbridge creatures such as rats, goblins, cave bugs, cave slimes and zombies.";

// Methods added on 2026-11-16 from the current guides. Spawns are the LocLine tables on each creature's Wiki page:
// /w/Rock_crab, /w/Flesh_Crawler, /w/Abyssal_walker, /w/Lesser_demon, /w/Catablepon, /w/Skoblin, /w/Troll_brute,
// /w/Exiled_kalphite_marauder, /w/Chaos_druid, /w/Ghostly_troll_bruiser, /w/Skeleton_(Lumbridge_Catacombs),
// /w/Armoured_zombie and /w/Ravenous_ghoul. Maximum hits are from the same pages' infoboxes.
const waterfallQuest: TrainingOption = {
  id: "waterfall-quest",
  title: "Waterfall Quest",
  wiki: "Waterfall_Quest",
  image: "Waterfall_Quest.png",
  members: true,
  locations: ["Baxtorian Falls"],
  sites: [
    {
      label: "Almera's house, Baxtorian Falls",
      wiki: "Almera",
      map: { x: 2522, y: 3498, plane: 0, mapId: 28 },
      access: "The quest starts with Almera, north-east of the falls.",
    },
  ],
  method:
    "Complete Waterfall Quest first, then Tree Gnome Village and Fight Arena for Attack. Their rewards replace the slowest levels of melee training.",
  benefit:
    "Waterfall Quest's 13,750 Attack and 13,750 Strength XP takes a fresh account from 1 to 30 in both, with no required combat.",
  requirements: ["Membership", "A rope and 6 each of air, earth and water runes"],
  risks:
    "The route passes aggressive mid-level monsters; bring some food even though no fight is required.",
  gear: gear(
    1,
    "Waterfall Quest has no required combat, so any gear will do; only bring food for the aggressive monsters on the way.",
  ),
  ...checked(P2P_MELEE, W + "Ironman_Mode/Guide/Melee"),
};
const rockCrabs: TrainingOption = {
  id: "rock-crabs",
  title: "Rock crabs",
  wiki: "Rock_crab",
  image: "Rock_Crab.png",
  members: true,
  locations: ["Rellekka"],
  sites: [
    {
      label: "Rock crabs north of Rellekka",
      wiki: "Rock_crab",
      map: { x: 2666, y: 3715, plane: 0, mapId: 28 },
      access: "Walk north along the coast from the Fremennik Province lodestone.",
    },
  ],
  method:
    "Walk next to the rocks on the coast north of Rellekka; rock crabs wake when you are a tile away and attack you, so you can fight several at once.",
  benefit:
    "A safe, fast grind from the mid-20s: low damage, 8,400 life points each and a lodestone nearby.",
  risks: "Ranged and Magic can't target a crab until it wakes, so stand next to the rocks.",
  gear: gear(30, "Level 47 rock crabs attack once woken and hit up to 300 in melee."),
  ...checked(P2P_MELEE),
};
const strongholdSite = (label: string, wiki: string, x: number, y: number, access: string) => ({
  label,
  wiki,
  map: { x, y, plane: 0 as const, mapId: 24 },
  access,
});
const fleshCrawlers: TrainingOption = {
  id: "flesh-crawlers",
  title: "Flesh Crawlers",
  wiki: "Flesh_Crawler",
  image: "Flesh_Crawler.png",
  locations: ["Stronghold of Security"],
  sites: [strongholdSite("Stronghold second-level flesh crawlers", "Flesh_Crawler", 92, 139, "Descend to the second level of the Stronghold of Security.")],
  method:
    "Fight Flesh Crawlers on the second level of the Stronghold of Security. They gather in groups, so area-of-effect abilities hit several at once.",
  benefit:
    "The Wiki's melee guide calls AoE here extremely effective, viable up to 70; they are weak to stab and drop grimy herbs.",
  risks: "You'll fight several at once, so bring food; a herb bag keeps the herb drops from filling your pack.",
  gear: gear(20, "Level 26 Flesh Crawlers don't attack first, but their ranged attacks hit up to 320 and they come in groups."),
  ...checked(F2P_MELEE, P2P_MELEE, F2P_RANGED),
};
const abyss: TrainingOption = {
  id: "abyss-creatures",
  title: "Abyss creatures",
  wiki: "Abyss/Combat_training",
  image: "Abyssal_walker.png",
  members: true,
  locations: ["Abyss"],
  sites: [
    {
      label: "Abyss, south-west corner",
      wiki: "Abyss/Combat_training",
      map: { x: 3025, y: 4811, plane: 0, mapId: 187 },
      access: "The Mage of Zamorak teleports you in from the low Wilderness north of Edgeville after Enter the Abyss.",
    },
  ],
  method:
    "Stand in the south-west or south-east corner of the Abyss, where 15+ aggressive creatures spawn, and use area-of-effect abilities. Run to the other corner and back when they stop attacking after 10 minutes.",
  benefit:
    "The Wiki's Abyss guide puts it at around 500,000–600,000 XP an hour and AFK. Charms feed Summoning and ashes feed Prayer or Necromancy rituals.",
  requirements: [
    "Enter the Abyss miniquest",
    "The Wiki suggests 70 in every combat skill and 92 Prayer for Soul Split",
  ],
  risks:
    "Many creatures hit you at once. Bring healing such as Vampyrism, a blood amulet of fury or a bunyip, and travel through the low Wilderness to get there.",
  gear: gear(
    70,
    "The Abyss guide suggests tier 70 armour: level 72–79 creatures attack on sight in groups, hitting up to 275 in melee, 228 with magic and 208 with ranged.",
  ),
  ...checked(ABYSS, P2P_MELEE, P2P_MAGIC, P2P_RANGED, IRON_NECRO),
};
const lesserDemons: TrainingOption = {
  id: "lesser-demons",
  title: "Lesser demons",
  wiki: "Lesser_demon",
  image: "Lesser_demon.png",
  locations: ["Karamja Volcano"],
  sites: [
    {
      label: "Crandor and Karamja Dungeon lesser demons",
      wiki: "Lesser_demon",
      map: { x: 271, y: 154, plane: 0, mapId: 13 },
      access: "Enter through Karamja Volcano.",
    },
  ],
  method:
    "Fight lesser demons in the Crandor and Karamja Dungeon. They are weak to bolts; mages cast Air Blast.",
  benefit:
    "Easy to hit even at middling levels: the Wiki's guides put it at about 110,000 Ranged or 100,000 Magic XP an hour. Accursed ashes feed Prayer.",
  risks: "They're aggressive and attack with magic from range, so there is no safe spot.",
  gear: gear(40, "Level 70 lesser demons attack on sight and hit up to 480 with magic."),
  ...checked(F2P_RANGED, F2P_MAGIC),
};
const catablepons: TrainingOption = {
  id: "catablepons",
  title: "Catablepons",
  wiki: "Catablepon",
  image: "Catablepon.png",
  locations: ["Stronghold of Security"],
  sites: [strongholdSite("Stronghold third-level catablepons", "Catablepon", 15, 64, "Descend to the third level of the Stronghold of Security.")],
  method:
    "Fight catablepons on the third level of the Stronghold of Security, skipping the drops. They are weak to bolts.",
  benefit:
    "Easy kills that rarely hurt: the Wiki's Ranged guide puts it at up to about 110,000 XP an hour.",
  risks: "Their Weaken spell lowers your Strength by up to 8.",
  gear: gear(40, "Level 43 catablepons don't attack first, but hit up to 480 in melee and 700 with magic."),
  ...checked(F2P_RANGED),
};
const skoblins: TrainingOption = {
  id: "skoblins",
  title: "Skoblins",
  wiki: "Skoblin",
  image: "Skoblin.png",
  locations: ["Lumbridge Catacombs"],
  sites: [
    {
      label: "Lumbridge Catacombs skoblins",
      wiki: "Skoblin",
      map: { x: 3993, y: 5493, plane: 0, mapId: 165 },
      access: "The ninth room of the Lumbridge Catacombs, after The Blood Pact.",
    },
  ],
  method: "Fight skoblins in the ninth room of the Lumbridge Catacombs.",
  benefit: "The best free Ranged XP the Wiki lists for 70+: up to 170,000 an hour.",
  requirements: ["The Blood Pact"],
  gear: gear(20, "Level 19 skoblins don't attack first and hit up to 280 in melee."),
  ...checked(F2P_RANGED),
};
const trollBrutes: TrainingOption = {
  id: "troll-brutes",
  title: "Troll brutes",
  wiki: "Troll_brute",
  image: "Troll_brute.png",
  locations: ["Burthorpe Troll Cave"],
  sites: [
    {
      label: "Burthorpe Troll Cave, west cave",
      wiki: "Troll_brute",
      map: { x: 135, y: 283, plane: 0, mapId: 719 },
    },
  ],
  method:
    "Cast Air Strike, then air spells as you unlock them, on troll brutes in the west cave of the Burthorpe Troll Cave. A staff of air or Caitlin's staff saves the air runes.",
  benefit:
    "Weak to air, so cheap spells kill them quickly; good XP for how easy they are. Their drops aren't worth picking up.",
  gear: gear(1, "Level 7 troll brutes don't attack first and hit at most 100 in melee."),
  ...checked(F2P_MAGIC, P2P_MAGIC),
};
const marauders: TrainingOption = {
  id: "exiled-marauders",
  title: "Exiled kalphite marauders",
  wiki: "Exiled_kalphite_marauder",
  image: "Exiled_kalphite_marauder.png",
  members: true,
  locations: ["Exiled Kalphite Hive"],
  sites: [
    {
      label: "Exiled Kalphite Hive marauders",
      wiki: "Exiled_kalphite_marauder",
      map: { x: 64, y: 29, plane: 0, mapId: 45 },
      access: "The Kalphite entrance south of the Jaldraocht Pyramid, north of Menaphos.",
    },
  ],
  method:
    "Fight marauders in the first room of the Exiled Kalphite Hive. They're always aggressive, so you don't need aggression potions.",
  benefit:
    "AFK with Soul Split: the Wiki puts it at up to 300,000 Ranged XP an hour, or 147,000 Necromancy XP on tier 70 gear. A strong source of blue charms, herbs and seeds.",
  risks: "Their attacks stack up, so without Soul Split you'll bank for food often.",
  gear: gear(70, "Level 98 marauders attack on sight in groups and hit up to 280 with magic; the Necromancy guide rates it on tier 70 gear."),
  ...checked(P2P_RANGED, NECRO),
};
const chaosDruids: TrainingOption = {
  id: "chaos-druids",
  title: "Chaos druids",
  wiki: "Chaos_druid",
  image: "Chaos_druid_(bald).png",
  members: true,
  locations: ["Taverley Dungeon"],
  sites: [
    {
      label: "Taverley Dungeon chaos druids",
      wiki: "Chaos_druid",
      map: { x: 2929, y: 9848, plane: 0, mapId: 17 },
    },
  ],
  method: "Fight chaos druids in Taverley Dungeon. They're aggressive and weak to arrows.",
  benefit: "Semi-AFK, and they drop herbs often, which an Ironman needs for Herblore.",
  gear: gear(10, "Level 32 chaos druids attack on sight but hit only up to 92 with magic."),
  ...checked(P2P_RANGED),
};
const highAlchemy: TrainingOption = {
  id: "high-alchemy",
  title: "High Level Alchemy",
  wiki: "High_Level_Alchemy",
  image: "High_Level_Alchemy_icon.png",
  locations: [],
  sites: [],
  locationNote: "Cast it anywhere, such as at a bank or while you train a gathering skill.",
  method:
    "From level 55, cast High Level Alchemy on the drops you'd otherwise sell. A staff of fire saves the fire runes, so each cast costs one nature rune.",
  benefit:
    "65 XP a cast, up to 78,000 an hour, and it turns your drops into the coins an Ironman can't get from the Grand Exchange.",
  requirements: ["55 Magic"],
  supplies: ["Nature rune", "Staff of fire"],
  ...checked(F2P_MAGIC, P2P_MAGIC, W + "Ironman_Mode/Guide/Magic"),
};
// Defence and Constitution train with whichever style you fight in, so their routes take the methods that the
// style guides share. https://runescape.wiki/w/Defence_training and /w/Pay-to-play_Constitution_training.
const ROUTES: Record<"melee" | "ranged" | "magic" | "any", TrainingOption[][]> = {
  melee: [
    [waterfallQuest, trolls, chicken, cows],
    [rockCrabs, fleshCrawlers, giants, moss],
    [abyss, ankou, iceGiants, moss],
    [abyss, abyssals, ankou, iceGiants, hellhounds],
  ],
  ranged: [
    [trolls, chicken, cows],
    [chaosDruids, fleshCrawlers, giants],
    [abyss, dragons, catablepons, lesserDemons],
    [abyss, marauders, abyssals, skoblins, catablepons, lesserDemons],
  ],
  magic: [
    [trollBrutes],
    [iceGiants, giants],
    [abyss, gargoyles, ankou, lesserDemons, highAlchemy],
    [abyss, abyssals, ankou, lesserDemons, highAlchemy],
  ],
  any: [
    [trolls, chicken, cows],
    [rockCrabs, fleshCrawlers, giants, moss],
    [abyss, dragons, ankou, lesserDemons, iceGiants],
    [abyss, abyssals, ankou, lesserDemons, hellhounds],
  ],
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
/**
 * A combat skill's four ranges from its style's route. Each list is ranked members first, then the free methods in
 * their own order, so F2P profiles (which never see a members option) keep the free ranking.
 */
function combatSkill(
  name: SkillRecord["name"],
  cap: number,
  description: string,
  instruction: string,
  supplies: string[],
  route: TrainingOption[][],
): SkillRecord {
  const method = `${instruction} Select targets for your whole equipment and survival setup, not this skill alone; return to an easier option whenever necessary.`;
  const ranges: [number, number, string][] = [
    [1, 20, "Learn combat"],
    [20, 50, "Build up on stronger targets"],
    [50, 80, "Train on groups and AFK spots"],
    [80, cap, "Continue towards mastery"],
  ];
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
    stages: ranges.map(([from, to, title], i) =>
      stage(from, to, title, method, route[i], false, supplies),
    ),
    membersNote: `Free players can train ${name} to ${cap} with the free methods; the Members view lists members methods first.`,
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
    gear: gear(10, jacquelynReason),
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
    gear: gear(
      30,
      "Vannaka assigns mid-level creatures such as hill, moss and ice giants, ice warriors, Kalphite and catablepon.",
    ),
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
    gear: gear(
      60,
      "Sumona assigns abyssal and black demons, gargoyles, nechryael, dust devils and dragonfire-breathing blue dragons.",
    ),
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
    gear: gear(
      70,
      "Kuradal assigns dark beasts, abyssal and black demons, steel and mithril dragons, waterfiends and Kal'gerion demons.",
    ),
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
    gear: gear(
      80,
      "Laniakea assigns rune and adamant dragons, nodon dragonkin, Kal'gerion demons and ravenous strigoi.",
    ),
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
  "The Wiki's fastest XP from 5 to 26, and the souls (400 by about level 26) unlock talents at the Well of Souls; glyph ink costs materials.",
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
    ...checked(NECRO, IRON_NECRO),
  },
);
// Combat targets: https://runescape.wiki/w/Necromancy_training#Combat_training and the Ironman guide's
// "Suggested enemies for combat training".
const combatNecro = option(
  "necro-combat",
  "Necromancy combat",
  "Ghostly_troll_bruiser",
  "Ghostly_troll_bruiser.png",
  ["City of Um"],
  "Fight the ghostly trolls in the City of Um troll cave with your Necromancy weapons, using area-of-effect abilities where you can.",
  "The Wiki's Necromancy guides start combat here: undead, so undead-slayer effects work, and their bones feed early rituals.",
  {
    sites: [
      {
        label: "City of Um troll cave",
        wiki: "City_of_Um_troll_cave",
        map: { x: 1193, y: 2002, plane: 0, mapId: -1 },
        access: "The cave holds at most three players.",
      },
    ],
    requirements: ["Complete Necromancy!"],
    supplies: [
      "Level-appropriate Death guard",
      "Level-appropriate Skull lantern",
      "Food",
    ],
    risks:
      "Move to stronger enemies only when your equipment and survival are adequate.",
    gear: gear(1, "Level 7 ghostly trolls don't attack first and hit at most 100 in melee, so any gear will do."),
    ...checked(NECRO, IRON_NECRO),
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
    "From 60 the Wiki suggests greater communion for souls, with Multiply II glyphs (66, boostable) to raise the output; higher-tier glyphs consume better ink.",
  ...checked(NECRO, IRON_NECRO),
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
    "The Wiki's fastest Necromancy XP from 90, though active: maximise soul attraction from disturbances. Multiply glyphs increase output when available.",
  ...checked(NECRO, IRON_NECRO),
};
const memberNecro: TrainingOption = {
  ...combatNecro,
  title: "Necromancy at skeletons",
  wiki: "Skeleton_(Lumbridge_Catacombs)",
  image: "Skeleton_(Lumbridge_Catacombs).png",
  locations: ["Lumbridge Catacombs"],
  sites: [
    {
      label: "Lumbridge Catacombs skeletons",
      wiki: "Skeleton_(Lumbridge_Catacombs)",
      map: { x: 4020, y: 5531, plane: 0, mapId: 165 },
    },
  ],
  members: true,
  method:
    "Fight the skeletons in the Lumbridge Catacombs with area-of-effect abilities; upgrade your equipment through Kili's tasks every 10 levels.",
  benefit:
    "Undead, so undead-slayer effects such as a salve amulet (e) add damage. The Ironman guide recommends them from 20 to 70.",
  gear: gear(10, "Level 15 skeletons don't attack first and hit up to 220 in melee."),
};
const necroAnkou: TrainingOption = {
  ...ankou,
  id: "necro-ankou",
  members: true,
  method:
    "Fight ankou on the fourth floor of the Stronghold of Security with Necromancy, after Kili's Knowledge II gives you tier 40 weapons.",
  benefit:
    "Undead, so a salve amulet (e) adds damage; the Wiki's Necromancy guide lists them from 40. Their drops include death runes and herbs.",
  ...checked(NECRO, IRON_NECRO),
};
const armouredZombies: TrainingOption = {
  id: "armoured-zombies",
  title: "Armoured zombies",
  wiki: "Armoured_zombie",
  image: "Armoured_zombie.png",
  members: true,
  locations: ["Chaos Temple Dungeon"],
  sites: [
    {
      label: "Chaos Temple Dungeon armoured zombies",
      wiki: "Armoured_zombie",
      map: { x: 3242, y: 10025, plane: 0, mapId: 581 },
      access: "Hartwin in Varrock Palace's north-west tower teleports you in.",
    },
  ],
  method:
    "Fight the armoured zombies in the Chaos Temple Dungeon with Necromancy. They're aggressive and dense, so area-of-effect abilities keep hitting several.",
  benefit:
    "Very AFK on tier 60 armour with only your conjured ghost for healing; drops include planks, herbs, essence and charms.",
  requirements: ["Partial completion of Defender of Varrock"],
  gear: gear(60, "The Necromancy guide rates them AFK on tier 60 armour; level 85–86 zombies attack on sight and hit up to 297 in melee."),
  ...checked(NECRO),
};
const ravenousGhouls: TrainingOption = {
  id: "ravenous-ghouls",
  title: "Ravenous ghouls",
  wiki: "Ravenous_ghoul",
  image: "Ravenous_ghoul.png",
  members: true,
  locations: ["Slayer Tower Mausoleum"],
  sites: [
    {
      label: "Slayer Tower Mausoleum",
      wiki: "Ravenous_ghoul",
      map: { x: 4431, y: 7898, plane: 0, mapId: -1 },
      access: "Through the trapdoor in the south-east corner of the Slayer Tower.",
    },
  ],
  method:
    "Fight ravenous ghouls in the Slayer Tower Mausoleum with a blood essence equipped, which keeps them aggressive.",
  benefit:
    "The AFK alternative to rituals from 90: the Wiki puts it at up to 850,000 XP an hour. Their bones help make a demon horn necklace; other loot is poor.",
  requirements: ["Enter Morytania by completing Priest in Peril or defeating the Paterdomus mausoleum ghoul"],
  gear: gear(80, "Level 105 ravenous ghouls have 14,500 life points and hit up to 595 in melee."),
  ...checked(NECRO),
};
const necroAbyssals: TrainingOption = {
  ...abyssals,
  id: "necro-abyssals",
  method:
    "Fight abyssal demons with Necromancy; demon-slayer effects add damage. The Wiki's Necromancy guide prefers the Wilderness spawns, where they stay aggressive.",
  ...checked(NECRO, IRON_NECRO),
};

export const COMBAT_SKILLS: SkillRecord[] = [
  combatSkill(
    "Attack",
    120,
    "Train melee accuracy and unlock stronger melee weapons.",
    "Select Attack experience in Gameplay > Combat & Action Bar > Combat XP; match weapon type to the target's weakness.",
    ["Suitable melee weapon", "Armour", "Food"],
    ROUTES.melee,
  ),
  combatSkill(
    "Defence",
    99,
    "Improve survivability and unlock protective armour.",
    "Select Defence experience in combat settings; Defence can be trained with your chosen combat style.",
    ["Suitable weapon and armour", "Food"],
    ROUTES.any,
  ),
  combatSkill(
    "Strength",
    120,
    "Improve melee damage through combat.",
    "Select Strength experience in combat settings; upgrade weapons using Attack and match their type to the target's weakness.",
    ["Suitable melee weapon", "Armour", "Food"],
    ROUTES.melee,
  ),
  combatSkill(
    "Constitution",
    99,
    "Increase life points by fighting with any combat style.",
    "Constitution experience accompanies combat; use the style and equipment appropriate to the target.",
    ["Suitable combat equipment", "Food"],
    ROUTES.any,
  ),
  combatSkill(
    "Ranged",
    120,
    "Fight from a distance using ranged weapons and abilities.",
    "Select Ranged experience; a chargebow needs no ammunition, while other weapons need compatible ammunition.",
    ["Ranged weapon", "Compatible ammunition if needed", "Food"],
    ROUTES.ranged,
  ),
  combatSkill(
    "Magic",
    120,
    "Use spells for combat, travel and utility.",
    "Select Magic experience and a combat spell; match elemental weakness when practical. A staff of air supplies air runes.",
    ["Magic weapon", "Runes for the chosen spell", "Food"],
    ROUTES.magic,
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
        "After subscribing, complete Kili Row and Rune Mythos, and check each equipment upgrade's materials.",
        [memberNecro, memberRitual],
        true,
      ),
      stage(
        40,
        60,
        "Develop talents and equipment",
        "Fight undead with Necromancy and continue Kili's tasks every 10 levels.",
        [necroAnkou, memberNecro, memberRitual],
        true,
      ),
      stage(
        60,
        90,
        "Greater communion",
        "Use greater communion for souls; fight AFK undead and kalphites between rituals, and improve equipment every 10 levels.",
        [armouredZombies, marauders, greaterRitual, necroAbyssals],
        true,
      ),
      stage(
        90,
        120,
        "Powerful communion",
        "Powerful communion is the fastest XP; AFK combat is slower but needs no materials.",
        [powerfulRitual, ravenousGhouls, necroAbyssals],
        true,
      ),
    ],
    membersNote:
      "The free trial ends at level 20; levels 20–120 require membership.",
  },
];
