import type { ItemReference, SkillRecord } from "./data.ts";
import type { LocationRecord } from "./locations.ts";

export const SUPPORT_LOCATIONS: Record<string, LocationRecord> = {
  "Burthorpe Agility Course": {
    name: "Burthorpe Agility Course",
    wiki: "Burthorpe Agility Course",
    image: "Burthorpe_Agility_Course.png",
    members: false,
    summary:
      "A beginner course in north-east Burthorpe, beside Drill Sergeant Hartman.",
  },
  Runespan: {
    name: "Runespan",
    wiki: "Runespan",
    image: "Runespan_lower_level.png",
    members: false,
    summary:
      "Enter the lower-level portal at the top of Wizards’ Tower, south of Draynor.",
    access:
      "Talk to Wizard Finix. Free players can use the lower level and part of the middle level.",
  },
  Rimmington: {
    name: "Rimmington",
    wiki: "Rimmington",
    image: "Rimmington_view.png",
    members: false,
    summary:
      "The house portal, estate agent and housing facilities are in Rimmington, west of Port Sarim.",
  },
  Daemonheim: {
    name: "Daemonheim",
    wiki: "Daemonheim",
    image: "Daemonheim_entrance.png",
    members: false,
    summary:
      "The dungeon entrance and Dungeoneering tutor are at the castle on the eastern peninsula.",
    access:
      "Take the ferry from Al Kharid or use the ring of kinship after obtaining it from the tutor.",
  },
  "Invention Guild": {
    name: "Invention Guild",
    wiki: "Invention Guild",
    image: "Invention_Guild_entrance.png",
    members: true,
    summary:
      "Doc and the inventor’s workbench are north-east of Falador, by the Dwarven Mine entrance.",
    access:
      "Requires membership and level 80 Crafting, Divination and Smithing.",
  },
  "Kharid-et Dig Site": {
    name: "Kharid-et Dig Site",
    wiki: "Kharid-et Dig Site",
    image: "Kharid-et.png",
    members: false,
    summary:
      "A Zarosian excavation east of Al Kharid; the exterior contains venator remains.",
  },
  // Exact scene sources: /w/Archaeology_Guild, /w/Barbarian_Outpost_Agility_Course, and each linked wisp article.
  "Archaeology Guild": {
    name: "Archaeology Guild",
    wiki: "Archaeology_Guild",
    image: "Archaeology_Guild.png",
    members: false,
    summary:
      "The tutorial, screening station and restoration workbenches are at the campus east of Varrock.",
    access: "Speak to Acting Guildmaster Reiniger to begin the tutorial.",
  },
  "Barbarian Outpost Agility Course": {
    name: "Barbarian Outpost Agility Course",
    wiki: "Barbarian_Outpost_Agility_Course",
    image: "Barbarian_Outpost_Agility_Course.png",
    members: true,
    summary:
      "An obstacle course at the Barbarian Outpost, north-east of Baxtorian Falls.",
    access:
      "Requires 35 Agility and completion of Bar Crawl. Failed obstacles can cause damage.",
  },
  "Pale wisp colony": {
    name: "Pale wisp colony",
    wiki: "Pale_wisp",
    image: "Pale_wisp_colony.png",
    members: false,
    summary:
      "Harvest pale wisps and convert memories at the rift south of Draynor jail.",
    access: "Free Divination experience stops at level 5.",
  },
  "Flickering wisp colony": {
    name: "Flickering wisp colony",
    wiki: "Flickering_wisp",
    image: "Flickering_wisp_colony.png",
    members: true,
    summary: "A level 10 colony by the standing stones north of Falador.",
  },
  "Bright wisp colony": {
    name: "Bright wisp colony",
    wiki: "Bright_wisp",
    image: "Bright_wisp_colony.png",
    members: true,
    summary: "A level 20 colony just north-west of the Archaeology Guild.",
    access:
      "Walk south from Varrock’s east gate, or use the Archaeology journal after its tutorial.",
  },
  ...Object.fromEntries(
    [
      [
        "Wilderness Agility Course",
        "Wilderness Agility Course",
        "A dangerous members' course in the Wilderness.",
        "Wilderness_Agility_course.png",
      ],
      [
        "Prifddinas Agility Course",
        "Hefin Agility Course",
        "A course around the elven city; Plague's End is required.",
        "Hefin_Agility_Course.png",
      ],
      [
        "Menaphos market",
        "Menaphos",
        "The desert city has traders and other pickpocketing targets.",
        "Menaphos.png",
      ],
      [
        "Darkmeyer",
        "Darkmeyer",
        "The vampyre city is unlocked during The Branches of Darkmeyer.",
        "Darkmeyer_NXT.png",
      ],
      [
        "Infernal Source Dig Site",
        "Infernal Source Dig Site",
        "A Zamorakian excavation underneath the Wilderness.",
        "Infernal_Source.png",
      ],
      [
        "Everlight Dig Site",
        "Everlight Dig Site",
        "An Icyene excavation in Morytania.",
        "Everlight.png",
      ],
      [
        "Stormguard Citadel Dig Site",
        "Stormguard Citadel Dig Site",
        "An Armadylean excavation accessed through the archaeology portal.",
        "Stormguard_Citadel.png",
      ],
      [
        "Warforge Dig Site",
        "Warforge Dig Site",
        "A Bandosian excavation south of Feldip Hills.",
        "Warforge_crucible_area.png",
      ],
      [
        "Orthen Dig Site",
        "Orthen Dig Site",
        "A dragonkin excavation on Anachronia.",
        "Orthen_Dig_Site_-_Anachronia_base_camp.png",
      ],
      [
        "Glowing wisp colony",
        "Glowing wisp",
        "South-east of Seers' Village.",
        "Glowing_wisp.png",
      ],
      [
        "Gleaming wisp colony",
        "Gleaming wisp",
        "North-east of Shilo Village.",
        "Gleaming_wisp.png",
      ],
      [
        "Lustrous wisp colony",
        "Lustrous wisp",
        "East of the Slayer Tower.",
        "Lustrous_wisp.png",
      ],
      [
        "Luminous wisp colony",
        "Luminous wisp",
        "South of Sophanem.",
        "Luminous_wisp.png",
      ],
      [
        "Sparkling wisp colony",
        "Sparkling wisp",
        "South-west of the Fremennik Slayer Dungeon.",
        "Sparkling_wisp.png",
      ],
      [
        "Vibrant wisp colony",
        "Vibrant wisp",
        "North-west of South Feldip Hills.",
        "Vibrant_wisp.png",
      ],
      [
        "Brilliant wisp colony",
        "Brilliant wisp",
        "East of the Mage Training Arena.",
        "Brilliant_wisp.png",
      ],
      [
        "Incandescent wisp colony",
        "Incandescent wisp",
        "The colony is west of Castle Wars.",
        "Incandescent_wisp.png",
      ],
    ].map(([name, wiki, summary, image]) => [
      name,
      { name, wiki, image, members: true, summary },
    ]),
  ),
};

export const SUPPORT_ITEMS: ItemReference[] = [
  {
    name: "Bronze mattock",
    wiki: "Bronze mattock",
    image: "Bronze_mattock.png",
  },
  {
    name: "Crude wooden chair",
    wiki: "Crude wooden chair",
    image: "Crude_wooden_chair.png",
    aliases: ["crude wooden chairs"],
  },
  { name: "Iron mattock", wiki: "Iron mattock", image: "Iron_mattock.png" },
  {
    name: "Ring of kinship",
    wiki: "Ring of kinship",
    image: "Ring_of_kinship.png",
  },
  {
    name: "Augmentor",
    wiki: "Augmentor",
    image: "Augmentor.png",
    aliases: ["augmentors"],
  },
  {
    name: "Equipment siphon",
    wiki: "Equipment siphon",
    image: "Equipment_siphon.png",
    aliases: ["equipment siphons"],
  },
  { name: "Oak chair", wiki: "Oak chair", image: "Oak_chair.png" },
  {
    name: "Teak long table",
    wiki: "Teak long table",
    image: "Teak_long_table.png",
  },
  {
    name: "Mahogany long table",
    wiki: "Mahogany long table",
    image: "Mahogany_long_table.png",
  },
  {
    name: "Eternal long table",
    wiki: "Eternal long table",
    image: "Eternal_long_table.png",
  },
  {
    name: "Archaeological soil box",
    wiki: "Archaeological soil box",
    image: "Archaeological_soil_box.png",
  },
  { name: "Divine charge", wiki: "Divine charge", image: "Divine_charge.png" },
  {
    name: "Small loot bag",
    wiki: "Small loot bag",
    image: "Small_loot_bag.png",
  },
  { name: "Stethoscope", wiki: "Stethoscope", image: "Stethoscope.png" },
];

// Training sources: https://runescape.wiki/w/Skill_mastery
// https://runescape.wiki/w/Agility_training https://runescape.wiki/w/Thieving_training
// https://runescape.wiki/w/Free-to-play_Runecrafting_training https://runescape.wiki/w/Construction_training
// https://runescape.wiki/w/Dungeoneering/Training https://runescape.wiki/w/Divination_training
// https://runescape.wiki/w/Invention_training https://runescape.wiki/w/Archaeology_training
type Option = SkillRecord["stages"][number]["options"][number];
// Coordinates below are sourced from each linked article's Map, NPC map or Object map wikitext.
// Empty site arrays deliberately indicate that no exact activity position was established.
const sites: Record<string, Option["sites"]> = {
  "burthorpe-course": [
    {
      label: "Burthorpe course",
      wiki: "Burthorpe Agility Course",
      map: { x: 2916, y: 3575, plane: 0 },
    },
  ],
  "barbarian-course": [
    {
      label: "Barbarian course",
      wiki: "Barbarian Outpost Agility Course",
      map: { x: 2543, y: 3558, plane: 0 },
    },
  ],
  "wilderness-course": [
    {
      label: "Wilderness course",
      wiki: "Wilderness Agility Course",
      map: { x: 2998, y: 3949, plane: 0 },
    },
  ],
  "prifddinas-course": [
    {
      label: "Hefin course",
      wiki: "Hefin Agility Course",
      map: { x: 2181, y: 3423, plane: 0 },
    },
  ],
  men: [
    {
      label: "Man in Lumbridge Castle",
      wiki: "Man",
      map: { x: 3209, y: 3215, plane: 1, mapId: 28 },
    },
  ],
  farmers: [
    {
      label: "Farmer at Seth Groats' farm",
      wiki: "Farmer",
      map: { x: 3227, y: 3292, plane: 0, mapId: 28 },
    },
  ],
  "menaphite-marketeer": [
    {
      label: "Merchant district marketeer",
      wiki: "Menaphite marketeer",
      map: { x: 3233, y: 2787, plane: 0, mapId: 28 },
    },
  ],
  "master-farmer": [
    {
      label: "Master Farmer in Draynor",
      wiki: "Master Farmer",
      map: { x: 3080, y: 3250, plane: 0 },
    },
  ],
  guards: [
    {
      label: "Falador guard",
      wiki: "Guard (Falador)",
      map: { x: 2964, y: 3391, plane: 0 },
    },
  ],
  "vyrewatch-tither": [
    {
      label: "Vyrewatch tither",
      wiki: "Vyrewatch tither",
      map: { x: 3616, y: 3392, plane: 0 },
    },
  ],
  "lower-runespan": [
    {
      label: "Lower-level air essling",
      wiki: "Air essling",
      map: { x: 3922, y: 6035, plane: 0, mapId: 46 },
      access: "Enter the lower Runespan portal.",
    },
  ],
  "members-runespan": [
    {
      label: "Middle-level air essling",
      wiki: "Air essling",
      map: { x: 4135, y: 6059, plane: 0, mapId: 47 },
      access:
        "Requires 33 Runecrafting; higher nodes are preferable when available.",
    },
  ],
  "rune-altars": [
    {
      label: "Air altar",
      wiki: "Air altar",
      map: { x: 2843, y: 4833, plane: 0, mapId: 157 },
      access:
        "Enter the air ruins west of Varrock using an air talisman or tiara.",
    },
  ],
  "crude-chairs": [
    {
      label: "Rimmington furniture workbench",
      wiki: "Furniture workbench",
      map: { x: 2941, y: 3229, plane: 0 },
    },
  ],
  "oak-furniture": [
    {
      label: "Rimmington furniture workbench",
      wiki: "Furniture workbench",
      map: { x: 2941, y: 3229, plane: 0 },
    },
  ],
  "mahogany-furniture": [
    {
      label: "Rimmington furniture workbench",
      wiki: "Furniture workbench",
      map: { x: 2941, y: 3229, plane: 0 },
    },
  ],
  "daemonheim-floors": [
    {
      label: "Daemonheim entrance",
      wiki: "Daemonheim",
      map: { x: 3449, y: 3714, plane: 0 },
      access: "Dungeon floors are generated separately.",
    },
  ],
  "pale-wisps": [
    {
      label: "Pale wisp",
      wiki: "Pale wisp",
      map: { x: 3120, y: 3209, plane: 0 },
    },
  ],
  "flickering-wisps": [
    {
      label: "Flickering wisp",
      wiki: "Flickering wisp",
      map: { x: 2998, y: 3408, plane: 0 },
    },
  ],
  "bright-wisps": [
    {
      label: "Bright wisp",
      wiki: "Bright wisp",
      map: { x: 3308, y: 3397, plane: 0 },
    },
  ],
  "sparkling-wisps": [
    {
      label: "Sparkling wisp",
      wiki: "Sparkling wisp",
      map: { x: 2770, y: 3588, plane: 0 },
    },
  ],
  "vibrant-wisps": [
    {
      label: "Vibrant wisp",
      wiki: "Vibrant wisp",
      map: { x: 2411, y: 2860, plane: 0 },
    },
  ],
  "brilliant-wisps": [
    {
      label: "Brilliant wisp",
      wiki: "Brilliant wisp",
      map: { x: 3396, y: 3304, plane: 0 },
    },
  ],
  "incandescent-wisps": [
    {
      label: "Incandescent wisp",
      wiki: "Incandescent wisp",
      map: { x: 2296, y: 3055, plane: 0 },
    },
  ],
  "archaeology-tutorial": [
    {
      label: "Centurion remains",
      wiki: "Centurion remains",
      map: { x: 3388, y: 3394, plane: 0 },
      access: "Available during the Archaeology tutorial.",
    },
  ],
  "kharid-et": [
    {
      label: "Venator remains",
      wiki: "Venator remains",
      map: { x: 3371, y: 3193, plane: 0 },
    },
  ],
  "infernal-source": [
    {
      label: "Lodge bar storage",
      wiki: "Lodge bar storage",
      map: { x: 30, y: 30, plane: 0, mapId: 724 },
      access: "Enter the Infernal Source cellar.",
    },
  ],
  everlight: [
    {
      label: "Oikos studio debris",
      wiki: "Oikos studio debris",
      map: { x: 3739, y: 3176, plane: 0 },
      access: "Access Morytania through Paterdomus.",
    },
  ],
  stormguard: [
    {
      label: "Ikovian memorial",
      wiki: "Ikovian memorial",
      map: { x: 2673, y: 3395, plane: 0, mapId: 28 },
      access: "Requires assistant qualification.",
    },
  ],
  warforge: [
    {
      label: "Gladiatorial goblin remains",
      wiki: "Gladiatorial goblin remains",
      map: { x: 27, y: 150, plane: 0, mapId: 729 },
      access:
        "Requires 76 Archaeology and assistant qualification; enter the Crucible arena.",
    },
  ],
  "invention-tutorial": [
    {
      label: "Invention Guild workbench",
      wiki: "Inventor's workbench",
      map: { x: 6168, y: 1046, plane: 0, mapId: -1 },
    },
  ],
  orthen: [
    {
      label: "Varanusaur remains",
      wiki: "Varanusaur remains",
      image: "Varanusaur_remains.png",
      map: { x: 1107, y: 144, plane: 2, mapId: -1 },
    },
  ],
  coffin: [
    {
      label: "Dragonkin coffin",
      wiki: "Dragonkin coffin",
      image: "Dragonkin_coffin.png",
      map: { x: 1122, y: 149, plane: 2, mapId: -1 },
    },
  ],
  munitions: [
    {
      label: "Ancient magick munitions",
      wiki: "Ancient magick munitions",
      image: "Ancient_magick_munitions.png",
      map: { x: 28, y: 35, plane: 0, mapId: 722 },
    },
  ],
  praetorian: [
    {
      label: "Praetorian remains",
      wiki: "Praetorian remains",
      image: "Praetorian_remains.png",
      map: { x: 27, y: 17, plane: 0, mapId: 722 },
    },
  ],
  "war-table": [
    {
      label: "War table debris",
      wiki: "War table debris",
      image: "War_table_debris.png",
      map: { x: 29, y: 28, plane: 0, mapId: 722 },
    },
  ],
  "body-runes": [
    {
      label: "Body altar",
      wiki: "Body altar",
      map: { x: 2522, y: 4839, plane: 0, mapId: 153 },
      access: "Enter body ruins north-west of Barbarian Village.",
    },
  ],
  "glowing-wisps": [
    {
      label: "Glowing wisp",
      wiki: "Glowing wisp",
      image: "Glowing_wisp.png",
      map: { x: 2726, y: 3427, plane: 0 },
    },
  ],
  "gleaming-wisps": [
    {
      label: "Gleaming wisp",
      wiki: "Gleaming wisp",
      image: "Gleaming_wisp.png",
      map: { x: 2876, y: 3040, plane: 0 },
    },
  ],
  "lustrous-wisps": [
    {
      label: "Lustrous wisp",
      wiki: "Lustrous wisp",
      image: "Lustrous_wisp.png",
      map: { x: 3462, y: 3537, plane: 0 },
    },
  ],
  "luminous-wisps": [
    {
      label: "Luminous wisp",
      wiki: "Luminous wisp",
      image: "Luminous_wisp.png",
      map: { x: 3304, y: 2660, plane: 0 },
    },
  ],
};
const art: Record<string, string> = {
  men: "Man.png",
  farmers: "Farmer.png",
  "master-farmer": "Master_Farmer.png",
  guards: "Guard_(Falador,_sword).png",
  "menaphite-marketeer": "Menaphite_marketeer.png",
  "vyrewatch-tither": "Vyrewatch_tither_(1).png",
  "wilderness-course": "Wilderness_Agility_course.png",
  "prifddinas-course": "Hefin_Agility_Course.png",
  "sparkling-wisps": "Sparkling_wisp.png",
  "vibrant-wisps": "Vibrant_wisp.png",
  "brilliant-wisps": "Brilliant_wisp.png",
  "incandescent-wisps": "Incandescent_wisp.png",
  "infernal-source": "Lodge_bar_storage.png",
  everlight: "Oikos_studio_debris.png",
  stormguard: "Ikovian_memorial.png",
  warforge: "Gladiatorial_goblin_remains.png",
  orthen: "Varanusaur_remains.png",
};
const locationNotes: Record<string, string> = {
  "daemonheim-floors":
    "The pin marks the entrance; dungeon rooms and resources are procedurally generated.",
  "lower-runespan":
    "The pin is a recorded air essling spawn; creatures and siphoning nodes move or respawn.",
  "members-runespan":
    "The pin is a recorded air essling spawn; creatures and siphoning nodes move or respawn.",
  "invention-tutorial":
    "Use the workbench inside the Invention Guild after speaking to Doc.",
  "augment-disassemble":
    "Level augmented equipment at any suitable combat or gathering site; disassemble from the inventory wherever convenient.",
  "augment-siphon":
    "Level augmented equipment at any suitable combat or gathering site; siphon it wherever convenient.",
  orthen: "The pin marks Varanusaur remains inside the Crypt of Varanus.",
  coffin: "The pin marks dragonkin coffins inside the Crypt of Varanus.",
};
const opt = (
  id: string,
  title: string,
  wiki: string,
  image: string,
  location: string,
  method: string,
  benefit: string,
  members = false,
  requirements: string[] = [],
  risks?: string,
  supplies?: string[],
): Option => ({
  id,
  title,
  wiki,
  image: art[id] ?? image,
  locations: [location],
  method,
  benefit,
  members,
  requirements,
  risks,
  supplies,
  sites: sites[id] ?? [],
  locationNote: locationNotes[id],
});
// Activity pins are not interchangeable with travel hubs or variable combat/instanced locations.
const stage = (
  from: number,
  to: number,
  title: string,
  options: Option[],
  members = false,
) => ({
  from,
  to,
  title,
  options,
  members,
  supplies: [] as string[],
});

const burthorpe = opt(
  "burthorpe-course",
  "Burthorpe course",
  "Burthorpe Agility Course",
  "Burthorpe_Agility_Course.png",
  "Burthorpe Agility Course",
  "Complete all obstacles in order for the lap bonus.",
  "Learn courses and gain early shortcut access.",
);
const barbarian = opt(
  "barbarian-course",
  "Barbarian Outpost course",
  "Barbarian Outpost Agility Course",
  "Barbarian_Outpost_Agility_Course.png",
  "Barbarian Outpost Agility Course",
  "Complete the course and claim the lap bonus.",
  "Advance shortcut access.",
  true,
  ["35 Agility", "Bar Crawl"],
  "Failed obstacles deal damage.",
  ["Food"],
);
const wilderness = opt(
  "wilderness-course",
  "Wilderness course",
  "Wilderness Agility Course",
  "Agility-icon.png",
  "Wilderness Agility Course",
  "Complete laps of the course.",
  "A higher-level course without the Prifddinas quest requirement.",
  true,
  ["52 Agility"],
  "Dangerous Wilderness monsters; check PvP settings.",
  ["Food"],
);
const prifCourse = opt(
  "prifddinas-course",
  "Prifddinas course",
  "Prifddinas Agility Course",
  "Agility-icon.png",
  "Prifddinas Agility Course",
  "Complete rooftop laps.",
  "Earn course rewards while training towards 99.",
  true,
  ["77 Agility", "Plague's End"],
);
const men = opt(
  "men",
  "Pickpocket townspeople",
  "Man",
  "Thieving-icon.png",
  "Lumbridge",
  "Pickpocket men and women and heal when caught.",
  "Coins fund early supplies.",
  false,
  [],
  "Failure stuns and damages you.",
  ["Food"],
);
const farmers = opt(
  "farmers",
  "Pickpocket farmers",
  "Farmer",
  "Thieving-icon.png",
  "Lumbridge",
  "Pickpocket the farmer at Seth Groats' farm north of Lumbridge and bank seeds.",
  "Seeds support Farming and Herblore.",
  true,
  ["10 Thieving"],
  "Failure can damage and stun.",
  ["Food"],
);
const master = opt(
  "master-farmer",
  "Master farmer",
  "Master farmer",
  "Thieving-icon.png",
  "Draynor Village",
  "Pickpocket the master farmer and bank seeds.",
  "Collect seeds for Farming.",
  true,
  ["38 Thieving"],
  "Failure can damage and stun.",
  ["Food"],
);
const guards = opt(
  "guards",
  "Pickpocket guards",
  "Guard",
  "Thieving-icon.png",
  "Falador",
  "Pickpocket guards and bank loot.",
  "A straightforward source of coins and clues.",
  true,
  ["40 Thieving"],
  "Failure can damage and stun.",
  ["Food"],
);
const market = opt(
  "menaphite-marketeer",
  "Menaphite marketeers",
  "Menaphite marketeer",
  "Thieving-icon.png",
  "Menaphos market",
  "Pickpocket marketeers in Menaphos.",
  "Build Menaphos reputation and collect loot.",
  true,
  ["46 Thieving", "Jack of Spades"],
);
const tither = opt(
  "vyrewatch-tither",
  "Vyrewatch tithers",
  "Vyrewatch tither",
  "Thieving-icon.png",
  "Darkmeyer",
  "Pickpocket tithers in lower Darkmeyer.",
  "Collect blood and death runes and congealed blood.",
  true,
  ["100 Thieving", "Partial completion of The Branches of Darkmeyer"],
  "Failed attempts damage and stun.",
  ["Food"],
);
const span = opt(
  "lower-runespan",
  "Lower Runespan",
  "Runespan",
  "Runespan_lower_level.png",
  "Runespan",
  "Enter the lower portal atop Wizards' Tower, collect floating essence and siphon creatures and available nodes.",
  "Repeatable free XP to 110; Runespan runes become points on exit.",
);
const altars = opt(
  "rune-altars",
  "Craft air runes",
  "Air altar",
  "Air_rune.png",
  "Varrock",
  "Use an air talisman or tiara to enter the air ruins west of Varrock and craft carried rune essence. Higher free altars can also be used when unlocked.",
  "Keep air runes for combat and teleports, unlike Runespan; air runes remain a slower repeatable method at high levels.",
  false,
  [],
  "Banking and travel slow experience.",
  ["Rune essence", "Air talisman"],
);
const spanMember = opt(
  "members-runespan",
  "Members' Runespan",
  "Runespan",
  "Runespan_lower_level.png",
  "Runespan",
  "Use the highest accessible floor and siphon nodes appropriate to your level.",
  "More islands and nodes than the free route, but runes become points on exit.",
  true,
  ["33 Runecrafting for middle floor", "66 Runecrafting for upper floor"],
);
const house = opt(
  "crude-chairs",
  "Crude wooden chairs",
  "Crude wooden chair",
  "Crude_wooden_chair.png",
  "Rimmington",
  "Start There's No Place Like Home with Alfred Stonemason and build chairs at the furniture workbench.",
  "The tutorial grants a house and chairs provide trial XP.",
  false,
  [],
  "Building consumes materials.",
  ["Planks", "Steel nails"],
);
const oak = opt(
  "oak-furniture",
  "Oak furniture",
  "Oak plank",
  "Oak_plank.png",
  "Rimmington",
  "Make unlocked oak furniture at the furniture workbench; keep, bank or disassemble the finished pieces.",
  "Convert self-made planks into Construction XP and useful furnishings.",
  true,
  ["15 Construction for oak chairs"],
  "Furniture consumes planks.",
  ["Oak plank", "Hammer", "Saw"],
);
const mahogany = opt(
  "mahogany-furniture",
  "Mahogany long tables",
  "Mahogany long table",
  "Mahogany_plank.png",
  "Rimmington",
  "Make mahogany long tables at the furniture workbench; bank, place or disassemble the furniture.",
  "A high-level use for self-supplied mahogany planks.",
  true,
  ["72 Construction"],
  "Planks are consumed.",
  ["Mahogany plank", "Hammer", "Saw"],
);
const dungeon = opt(
  "daemonheim-floors",
  "Daemonheim floors",
  "Dungeoneering",
  "Daemonheim_entrance.png",
  "Daemonheim",
  "Get a ring of kinship from the tutor, form a party, complete accessible floors and reset progress once all accessible floors are marked complete. Repeat for prestige.",
  "Free players can reach 120 and earn tokens for accessible rewards; floor availability is not an XP cap.",
  false,
  [],
  "Bosses and rooms can kill you; free floors and rewards are restricted.",
  ["Ring of kinship"],
);
const pale = opt(
  "pale-wisps",
  "Pale wisps",
  "Pale wisp",
  "Pale_wisp_colony.png",
  "Pale wisp colony",
  "Harvest springs and convert memories at the rift.",
  "Learn Divination and collect pale energy.",
);
const flicker = opt(
  "flickering-wisps",
  "Flickering wisps",
  "Flickering wisp",
  "Flickering_wisp_colony.png",
  "Flickering wisp colony",
  "Harvest springs and convert memories at the rift.",
  "Energy supports Divination products.",
  true,
  ["10 Divination"],
);
const bright = opt(
  "bright-wisps",
  "Bright wisps",
  "Bright wisp",
  "Bright_wisp_colony.png",
  "Bright wisp colony",
  "Harvest springs and convert memories; keep energy when supplies matter more than speed.",
  "Gather energy for signs and other products.",
  true,
  ["20 Divination"],
);
const sparkling = opt(
  "sparkling-wisps",
  "Sparkling wisps",
  "Sparkling wisp",
  "Divination-icon.png",
  "Sparkling wisp colony",
  "Harvest springs and convert memories or retain energy.",
  "Gather sparkling energy for useful Divination products.",
  true,
  ["40 Divination"],
);
const vibrant = opt(
  "vibrant-wisps",
  "Vibrant wisps",
  "Vibrant wisp",
  "Divination-icon.png",
  "Vibrant wisp colony",
  "Harvest springs and convert memories or retain energy.",
  "Advance towards the Divination requirement for Invention.",
  true,
  ["60 Divination"],
);
const brilliant = opt(
  "brilliant-wisps",
  "Brilliant wisps",
  "Brilliant wisp",
  "Divination-icon.png",
  "Brilliant wisp colony",
  "Harvest springs and convert memories or retain energy.",
  "Gather higher-tier energy while training towards incandescent wisps.",
  true,
  ["80 Divination"],
);
const incandescent = opt(
  "incandescent-wisps",
  "Incandescent wisps",
  "Incandescent wisp",
  "Divination-icon.png",
  "Incandescent wisp colony",
  "Harvest incandescent springs and convert memories or retain energy.",
  "Incandescent energy makes divine charges for augmented equipment.",
  true,
  ["95 Divination"],
);
const tutorial = opt(
  "invention-tutorial",
  "Doc's tutorial and discovery",
  "Invention",
  "Invention_Guild_entrance.png",
  "Invention Guild",
  "Complete Doc's tutorial and discover available blueprints at a workbench.",
  "Unlock augmentation and receive discovery XP.",
  true,
  ["80 Crafting", "80 Smithing", "80 Divination"],
);
const disassemble = opt(
  "augment-disassemble",
  "Level and disassemble equipment",
  "Invention training",
  "Augmentor.png",
  "Invention Guild",
  "Augment replaceable equipment, use it in combat or its applicable gathering skill, then disassemble it at an unlocked item level.",
  "Item XP converts to Invention XP and disassembly supplies components.",
  true,
  ["80 Crafting", "80 Smithing", "80 Divination", "Augmentable equipment"],
  "Disassembly destroys equipment and augmentor; discover equipment-level blueprints as they unlock.",
  ["Augmentor", "Divine charge"],
);
const siphon = opt(
  "augment-siphon",
  "Siphon augmented equipment",
  "Equipment siphon",
  "Equipment_siphon.png",
  "Invention Guild",
  "Discover equipment siphons, level augmented equipment through use, then siphon it; discover higher item-level blueprints as they unlock.",
  "Gain Invention XP without destroying valuable gear; item level resets.",
  true,
  ["27 Invention", "80 Crafting", "80 Smithing", "80 Divination"],
  "Siphons and charge cost materials.",
  ["Equipment siphon", "Divine charge"],
);
const archTutorial = opt(
  "archaeology-tutorial",
  "Archaeology tutorial",
  "Archaeology Guild",
  "Archaeology_Guild.png",
  "Archaeology Guild",
  "Speak to Reiniger, excavate, screen soil and restore the tutorial artefact.",
  "Receive an introduction and soil box.",
  false,
  [],
  undefined,
  ["Bronze mattock"],
);
const kharid = opt(
  "kharid-et",
  "Kharid-et excavation",
  "Kharid-et Dig Site",
  "Kharid-et.png",
  "Kharid-et Dig Site",
  "Excavate venator remains from level 5; restore artefacts with excavated materials and hand them to collectors.",
  "Earn chronotes and complete collections; screen soil for extra materials.",
  false,
  ["5 Archaeology"],
  undefined,
  ["Bronze mattock"],
);
const infernal = opt(
  "infernal-source",
  "Infernal Source excavation",
  "Infernal Source Dig Site",
  "Archaeology-icon.png",
  "Infernal Source Dig Site",
  "Excavate unlocked hotspots, restore artefacts and complete mysteries and collections.",
  "Progress Zamorakian collections and ancient summoning unlocks.",
  true,
  ["20 Archaeology"],
  undefined,
  ["Mattock"],
);
const everlight = opt(
  "everlight",
  "Everlight excavation",
  "Everlight Dig Site",
  "Archaeology-icon.png",
  "Everlight Dig Site",
  "Excavate level-appropriate hotspots and restore artefacts; follow mysteries to unlock further areas.",
  "Complete Icyene collections and gather restoration materials.",
  true,
  ["42 Archaeology", "Access to Morytania"],
  undefined,
  ["Mattock"],
);
const stormguard = opt(
  "stormguard",
  "Stormguard Citadel excavation",
  "Stormguard Citadel Dig Site",
  "Archaeology-icon.png",
  "Stormguard Citadel Dig Site",
  "Excavate accessible hotspots and complete site mysteries to open further areas. Complete collections, mysteries and research for qualifications; associate qualification at 70 enables useful upgrades.",
  "Advance Armadylean collections and ancient Invention research.",
  true,
  ["70 Archaeology", "Assistant qualification"],
  undefined,
  ["Mattock"],
);
const warforge = opt(
  "warforge",
  "Warforge excavation",
  "Warforge Dig Site",
  "Archaeology-icon.png",
  "Warforge Dig Site",
  "Excavate gladiatorial goblin remains in the Crucible arena, restore the three goblin artefacts and hand in collections. Complete site mysteries before entering deeper areas.",
  "Earn Bandosian collection rewards and progress towards the Imcando mattock.",
  true,
  ["76 Archaeology", "Assistant qualification"],
  undefined,
  ["Mattock"],
);
const orthen = opt(
  "orthen",
  "Orthen excavation",
  "Orthen Dig Site",
  "Archaeology-icon.png",
  "Orthen Dig Site",
  "Excavate unlocked dragonkin hotspots, restore artefacts and complete mysteries to access deeper areas.",
  "Dragonkin collections and discoveries provide late-game progression.",
  true,
  [
    "90 Archaeology",
    "Associate qualification",
    "Anachronia base camp tutorial",
  ],
  undefined,
  ["Mattock"],
);
// Hotspot map fields: Object map 722 for the praetorium and -1 plane 2 for the crypt.
// Sources: https://runescape.wiki/w/Equipment_level, https://runescape.wiki/w/Dungeoneering_floors,
// https://runescape.wiki/w/2026_Construction_update and the linked item/hotspot pages.
const body = opt(
  "body-runes",
  "Craft body runes",
  "Body altar",
  "Body_rune.png",
  "Varrock",
  "Enter the body ruins north-west of Barbarian Village using a body talisman or tiara; craft essence at the altar.",
  "Keep body runes; this is the highest free altar and remains trainable to 110.",
  false,
  ["20 Runecrafting"],
  "Banking and travel take time.",
  ["Rune essence", "Body talisman"],
);
const middle: Option = {
  ...span,
  id: "middle-runespan",
  title: "Middle Runespan nodes",
  wiki: "Fleshy growth",
  image: "Fleshy_growth.png",
  sites: sites["members-runespan"],
  locationNote: "Nodes appear at variable locations on accessible islands.",
  requirements: ["33 Runecrafting"],
  method:
    "Climb the vine ladder to the middle floor and siphon fleshy growths or fire storms when they spawn. Free worlds are restricted to some islands and nodes requiring no more than level 27.",
  benefit:
    "Best accessible free node progression continues to 110; runes become points on exit.",
};
const blood: Option = {
  ...spanMember,
  id: "blood-pool",
  title: "Blood pools",
  wiki: "Blood pool",
  image: "Blood_pool.png",
  requirements: ["77 Runecrafting", "66 Runecrafting for upper floor"],
  method:
    "Enter the upper floor and siphon blood pools when they spawn; use creatures to replenish essence.",
  benefit: "A higher-tier members' Runespan node; no runes are retained.",
  locationNote:
    "Nodes spawn dynamically; the pin identifies an upper-floor essling.",
  sites: [
    {
      label: "Upper-floor air essling",
      wiki: "Air essling",
      map: { x: 4324, y: 6079, plane: 0, mapId: 48 },
      image: "Air_essling.png",
    },
  ],
};
const oakTrial: Option = { ...oak, members: false };
const teak: Option = {
  ...oak,
  id: "teak-tables",
  title: "Teak long tables",
  wiki: "Teak long table",
  image: "Teak_long_table.png",
  requirements: ["56 Construction"],
  method:
    "Make teak long tables at the furniture workbench, using eight teak planks per table.",
  benefit:
    "Use self-supplied teak planks for substantial XP; bank, place or disassemble the furniture.",
};
const eternal: Option = {
  ...oak,
  id: "eternal-tables",
  title: "Eternal long tables",
  wiki: "Eternal long table",
  image: "Eternal_long_table.png",
  requirements: ["110 Construction"],
  method:
    "Make eternal long tables at the furniture workbench with eight eternal planks.",
  benefit:
    "Convert late-game timber into high-level Construction XP; mahogany remains an alternative.",
};
const glowing = opt(
  "glowing-wisps",
  "Glowing wisps",
  "Glowing wisp",
  "Glowing_wisp.png",
  "Glowing wisp colony",
  "Harvest springs and convert memories or keep energy.",
  "Collect energy and advance to stronger colonies.",
  true,
  ["30 Divination"],
);
const gleaming = opt(
  "gleaming-wisps",
  "Gleaming wisps",
  "Gleaming wisp",
  "Gleaming_wisp.png",
  "Gleaming wisp colony",
  "Harvest springs and convert memories or keep energy.",
  "Collect gleaming energy while advancing Divination.",
  true,
  ["50 Divination"],
);
const lustrous = opt(
  "lustrous-wisps",
  "Lustrous wisps",
  "Lustrous wisp",
  "Lustrous_wisp.png",
  "Lustrous wisp colony",
  "Harvest springs and convert memories or keep energy.",
  "Gather energy while approaching the Invention prerequisite.",
  true,
  ["70 Divination"],
);
const luminous = opt(
  "luminous-wisps",
  "Luminous wisps",
  "Luminous wisp",
  "Luminous_wisp.png",
  "Luminous wisp colony",
  "Harvest springs and convert memories or keep energy.",
  "Gather luminous energy while approaching incandescent wisps.",
  true,
  ["90 Divination"],
);
const safecrack: Option = {
  ...market,
  id: "safecracking",
  title: "Misthalin safecracking",
  wiki: "Safecracking",
  image: "Safe_(looted).png",
  locations: ["Lumbridge"],
  sites: [
    {
      label: "Lumbridge upstairs safe",
      wiki: "Safe",
      image: "Safe_(looted).png",
      map: { x: 3229, y: 3238, plane: 1, mapId: 28 },
      access:
        "62 Thieving; complete the Thieves' Guild quest series and collect a loot bag and stethoscope. Other safes can be added to your route.",
    },
  ],
  requirements: [
    "62 Thieving",
    "Complete the Thieves' Guild quest series for the trainer and loot bag",
  ],
  method:
    "Crack the upstairs safes in Lumbridge, then add other unlocked Misthalin safes to your route. Take collected valuables to the Thieves' Guild fence.",
  benefit:
    "Earn pilfer points for guild rewards while training; low-level safes are useful for filling the loot bag.",
  supplies: ["Stethoscope", "Small loot bag"],
};
const corpse = opt(
  "coffin",
  "Dragonkin coffins",
  "Dragonkin coffin",
  "Dragonkin_coffin.png",
  "Orthen Dig Site",
  "Excavate coffins in the Crypt of Varanus and restore their artefacts for collections.",
  "Complete Dragonkin collections and gather restoration materials.",
  true,
  [
    "99 Archaeology",
    "Associate qualification",
    "Anachronia base camp tutorial",
  ],
  undefined,
  ["Mattock"],
);
const munitions = opt(
  "munitions",
  "Ancient magick munitions",
  "Ancient magick munitions",
  "Ancient_magick_munitions.png",
  "Kharid-et Dig Site",
  "Excavate the praetorium munitions and restore its artefacts.",
  "Progress Zarosian collections with a chance of Inquisitor staff pieces.",
  true,
  ["107 Archaeology", "Praetorium access"],
  undefined,
  ["Mattock"],
);
const praetorian = opt(
  "praetorian",
  "Praetorian remains",
  "Praetorian remains",
  "Praetorian_remains.png",
  "Kharid-et Dig Site",
  "Excavate praetorian remains inside the praetorium and restore their artefacts.",
  "Progress Zarosian collections and seek Inquisitor staff pieces.",
  true,
  ["114 Archaeology", "Praetorium access"],
  undefined,
  ["Mattock"],
);
const warTable = opt(
  "war-table",
  "War table debris",
  "War table debris",
  "War_table_debris.png",
  "Kharid-et Dig Site",
  "Excavate war table debris inside the praetorium and restore its artefacts.",
  "Complete high-level Zarosian collections while seeking staff pieces.",
  true,
  ["118 Archaeology", "Praetorium access"],
  undefined,
  ["Mattock"],
);
const floorOption = (title: string, instruction: string): Option => ({
  ...dungeon,
  title,
  method: instruction,
});
const frozen = floorOption(
  "Frozen floors",
  "Clear newly unlocked frozen floors; complete all accessible marked floors before resetting ring progress to establish prestige.",
);
const abandoned = floorOption(
  "Abandoned and furnished floors",
  "Continue unlocking and clearing floors; reset after all accessible floors are marked. Build gear inside and bind useful items.",
);
const lateFloors = floorOption(
  "Repeat accessible floors",
  "Free players can complete floors 1–35 and reset for prestige, even above level 69; members unlock deeper floors. Dungeon completion awards tokens.",
);
const memberFloors: Option = {
  ...lateFloors,
  id: "member-deep-floors",
  title: "Members' deeper floors",
  members: true,
  method:
    "Clear newly unlocked floors 36 and above, then reset after completing all accessible floors; repeat earlier floors to maintain prestige.",
  benefit: "Members can unlock occult and warped floors and higher prestige.",
};
const earlyGear: Option = {
  ...disassemble,
  method:
    "Discover augmented item maximum level 5 at Invention 4. Level replaceable augmented equipment in combat and disassemble it at item level 5; this destroys it.",
};
const levelTen: Option = {
  ...disassemble,
  method:
    "Discover augmented item maximum level 10 at Invention 27. Train replaceable augmented gear to item level 10 and disassemble for maximum disassembly XP.",
};
const levelTwelve: Option = {
  ...siphon,
  method:
    "Discover augmented item maximum level 15 at Invention 60. Siphon valuable gear at item level 12 for maximum siphon XP without destroying it; levels above 12 do not increase siphon XP.",
};

export const SUPPORT_SKILLS: SkillRecord[] = [
  {
    name: "Agility",
    category: "Support",
    icon: "Agility-icon.png",
    description: "Run courses and unlock shortcuts.",
    goal: 30,
    maxLevel: 99,
    payoff: "Unlock shortcuts and courses.",
    freeToPlayCap: 5,
    wiki: "Agility",
    trainingWiki: "Agility_training",
    membersNote: "Free training is a level 5 trial.",
    stages: [
      stage(1, 5, "Beginner course", [burthorpe]),
      stage(5, 35, "Continue Burthorpe", [burthorpe], true),
      stage(35, 52, "Barbarian course", [barbarian], true),
      stage(52, 77, "Wilderness course", [wilderness, barbarian], true),
      stage(77, 99, "Advanced courses", [prifCourse, wilderness], true),
    ],
  },
  {
    name: "Thieving",
    category: "Support",
    icon: "Thieving-icon.png",
    description: "Pick pockets and unlock theft targets.",
    goal: 40,
    maxLevel: 120,
    payoff: "Collect coins, seeds and other supplies.",
    freeToPlayCap: 5,
    wiki: "Thieving",
    trainingWiki: "Thieving_training",
    membersNote: "Free training is a level 5 trial.",
    stages: [
      stage(1, 5, "Pickpocket townspeople", [men]),
      stage(5, 10, "Continue pickpocketing", [men], true),
      stage(10, 38, "Collect farmer seeds", [farmers], true),
      stage(38, 40, "Master farmers", [master], true),
      stage(40, 46, "Guards and seeds", [guards, master], true),
      stage(46, 62, "Menaphos and seeds", [market, master], true),
      stage(62, 100, "Safes and marketeers", [safecrack, market, master], true),
      stage(100, 120, "High-level pickpocketing", [tither, safecrack], true),
    ],
  },
  {
    name: "Runecrafting",
    category: "Artisan",
    icon: "Runecrafting-icon.png",
    description: "Craft runes or siphon in Runespan.",
    goal: 50,
    maxLevel: 110,
    payoff: "Unlock rune recipes and Runespan nodes.",
    wiki: "Runecrafting",
    trainingWiki: "Free-to-play_Runecrafting_training",
    membersNote:
      "Free players can train to 110; some altars and Runespan areas require membership.",
    stages: [
      stage(1, 20, "Lower Runespan and air runes", [span, altars]),
      stage(20, 33, "Body runes and lower nodes", [body, span]),
      stage(33, 66, "Middle Runespan", [middle, body, spanMember]),
      stage(66, 77, "Upper Runespan access", [middle, body, spanMember]),
      stage(77, 110, "Blood pools or free alternatives", [middle, body, blood]),
    ],
  },
  {
    name: "Construction",
    category: "Artisan",
    icon: "Construction-icon.png",
    description: "Build furniture and improve your house.",
    goal: 40,
    maxLevel: 120,
    payoff: "Unlock house rooms and furniture.",
    freeToPlayCap: 20,
    wiki: "Construction",
    trainingWiki: "Construction_training",
    membersNote: "Free training is a level 20 trial.",
    stages: [
      stage(1, 15, "Housing tutorial", [house]),
      stage(15, 20, "Oak chairs trial", [oakTrial, house]),
      stage(20, 56, "Oak chairs", [oak], true),
      stage(56, 72, "Teak tables", [teak, oak], true),
      stage(72, 110, "Mahogany tables", [mahogany, teak], true),
      stage(110, 120, "Eternal tables", [eternal, mahogany], true),
    ],
  },
  {
    name: "Dungeoneering",
    category: "Support",
    icon: "Dungeoneering-icon.png",
    description: "Explore Daemonheim floors alone or with a party.",
    goal: 40,
    maxLevel: 120,
    payoff: "Earn tokens and unlock deeper floors.",
    wiki: "Dungeoneering",
    trainingWiki: "Dungeoneering/Training",
    membersNote:
      "Free players can reach 120, although some floors, rooms and rewards are members-only.",
    stages: [
      stage(1, 23, "Frozen floors", [frozen]),
      stage(23, 69, "Unlock more floors", [abandoned]),
      stage(69, 71, "Free floor 35", [lateFloors]),
      stage(71, 95, "Prestige and deeper floors", [lateFloors, memberFloors]),
      stage(95, 120, "Repeat or unlock warped floors", [
        lateFloors,
        memberFloors,
      ]),
    ],
  },
  {
    name: "Divination",
    category: "Gathering",
    icon: "Divination-icon.png",
    description: "Harvest wisps and convert memories.",
    goal: 30,
    maxLevel: 99,
    payoff: "Gather energy for useful products and Invention.",
    freeToPlayCap: 5,
    wiki: "Divination",
    trainingWiki: "Divination_training",
    membersNote: "Free training is a level 5 trial.",
    stages: [
      stage(1, 5, "Pale wisps", [pale]),
      stage(5, 10, "Continue pale wisps", [pale], true),
      stage(10, 20, "Flickering wisps", [flicker], true),
      stage(20, 30, "Bright wisps", [bright], true),
      stage(30, 40, "Glowing wisps", [glowing, bright], true),
      stage(40, 50, "Sparkling wisps", [sparkling, glowing], true),
      stage(50, 60, "Gleaming wisps", [gleaming, sparkling], true),
      stage(60, 70, "Vibrant wisps", [vibrant, gleaming], true),
      stage(70, 80, "Lustrous wisps", [lustrous, vibrant], true),
      stage(80, 90, "Brilliant wisps", [brilliant, lustrous], true),
      stage(90, 95, "Luminous wisps", [luminous, brilliant], true),
      stage(95, 99, "Incandescent energy", [incandescent, luminous], true),
    ],
  },
  {
    name: "Invention",
    category: "Elite",
    icon: "Invention-icon.png",
    description: "Unlock and augment equipment with this elite skill.",
    goal: 27,
    maxLevel: 120,
    payoff: "Discover blueprints and level augmented equipment.",
    freeToPlayCap: 0,
    wiki: "Invention",
    trainingWiki: "Invention_training",
    membersNote:
      "Members need 80 Crafting, Smithing and Divination before starting Doc's tutorial.",
    stages: [
      stage(1, 4, "Unlock and discover", [tutorial], true),
      stage(4, 27, "Item level 5", [earlyGear, tutorial], true),
      stage(27, 60, "Item level 10 and siphons", [levelTen, siphon], true),
      stage(60, 99, "Item level 12 siphons", [levelTwelve, levelTen], true),
      stage(
        99,
        120,
        "Continue equipment training",
        [levelTwelve, levelTen],
        true,
      ),
    ],
  },
  {
    name: "Archaeology",
    category: "Gathering",
    icon: "Archaeology-icon.png",
    description: "Excavate and restore artefacts, mysteries and collections.",
    goal: 40,
    maxLevel: 120,
    payoff: "Unlock collections, relics and qualifications.",
    freeToPlayCap: 20,
    wiki: "Archaeology",
    trainingWiki: "Archaeology_training",
    membersNote:
      "Free players can train to 20; membership is required beyond the trial.",
    stages: [
      stage(1, 5, "Tutorial", [archTutorial]),
      stage(5, 20, "Kharid-et exterior", [kharid]),
      stage(20, 42, "Infernal Source", [infernal], true),
      stage(42, 70, "Everlight and collections", [everlight, infernal], true),
      stage(70, 76, "Stormguard", [stormguard, everlight], true),
      stage(76, 90, "Warforge", [warforge, stormguard], true),
      stage(90, 99, "Varanusaur remains", [orthen, warforge], true),
      stage(99, 107, "Dragonkin coffins", [corpse, orthen], true),
      stage(107, 114, "Ancient magick munitions", [munitions, corpse], true),
      stage(114, 118, "Praetorian remains", [praetorian, munitions], true),
      stage(118, 120, "War table debris", [warTable, praetorian], true),
    ],
  },
];
