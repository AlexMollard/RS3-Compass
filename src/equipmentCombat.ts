import type { SkillName } from "./skillNames.ts";
import type {
  EquipmentGuide,
  EquipmentRecommendation,
} from "./equipmentTypes.ts";

// Weapons and armour come from the imported catalogue (src/equipmentImported.ts). What is left here are
// the hand-written extras: finishers, dragonfire protection, task tools and ranged ammunition.
// Item identities, inventory artwork and requirements:
// https://runescape.wiki/w/Ranged_weapons https://runescape.wiki/w/Summoning
// https://runescape.wiki/w/Rock_hammer
// Acquisition levels are route-specific, not requirements to equip an item.
const acquisition = (name: string): EquipmentRecommendation["acquisition"] => {
  const routes: Record<
    string,
    {
      label: string;
      note: string;
      unlocks?: string[];
      levels?: { skill: SkillName; level: number }[];
    }
  > = {
    "Anti-dragon shield": {
      label: "Dragon Slayer",
      unlocks: [
        "Have 33 quest points, start Dragon Slayer and speak to the Champions' Guild guildmaster",
      ],
      note: "Ask Duke Horacio in Lumbridge for the shield; keep it equipped against dragonfire.",
    },
    "Super antifire (3)": {
      label: "Mix potions",
      levels: [
        { skill: "Herblore", level: 85 },
        { skill: "Thieving", level: 25 },
      ],
      note: "Pluck a desert phoenix feather and add it to a three-dose antifire; gather clean lantadyme and dragon scale dust for the base potion.",
    },
    Bonecrusher: {
      label: "Dungeoneering reward",
      levels: [
        { skill: "Prayer", level: 21 },
        { skill: "Dungeoneering", level: 41 },
      ],
      note: "Purchase for 50,000 Dungeoneering tokens.",
    },
    "Enchanted gem": {
      label: "Slayer shop",
      note: "Buy from a Slayer master; bring coins.",
    },
    Earmuffs: {
      label: "Slayer shop",
      note: "Buy from a Slayer master; bring coins.",
    },
    "Rock hammer": {
      label: "Slayer shop",
      note: "Buy from a Slayer master for 500 coins.",
    },
    Pouch: {
      label: "Summoning shop",
      note: "Buy empty pouches from Pikkupstix; stock and coins are needed.",
    },
    "Spirit shards": {
      label: "Summoning shop",
      note: "Buy shards from Pikkupstix; stock and coins are needed.",
    },
    "Basic ritual candle": {
      label: "Soul Supplies",
      unlocks: ["Complete Necromancy!"],
      note: "Buy candles from Lupe in the City of Um; bring coins and check stock.",
    },
    "Underworld Grimoire 1": {
      label: "Achievement reward",
      unlocks: ["Complete the easy City of Um achievements"],
      note: "Claim the grimoire after completing the achievements.",
    },
  };
  return [routes[name]];
};

const item = (
  name: string,
  from: number,
  slot: string,
  note: string,
  extra: Partial<EquipmentRecommendation> = {},
): EquipmentRecommendation => ({
  name,
  wiki: name,
  image: `${name.replaceAll(" ", "_")}.png`,
  from,
  slot,
  note,
  acquisition: extra.acquisition ?? acquisition(name),
  ...extra,
});
const nonDragonCombat = [
  "chickens",
  "cows",
  "troll-chuckers",
  "hill-giants",
  "moss-giants",
  "ankou",
  "ice-giants",
  "gargoyles",
  "slayer-assignment",
  "wild-hellhounds",
  "abyssal-demons",
  "rock-crabs",
  "flesh-crawlers",
  "chaos-druids",
  "abyss-creatures",
  "lesser-demons",
  "catablepons",
  "skoblins",
  "exiled-marauders",
];
const dragonCombat = ["blue-dragons"];
const gargoyleHammer = item(
  "Rock hammer",
  1,
  "finishing tool",
  "Carry this to finish gargoyles, or add it to the tool belt; a normal hammer is not a substitute.",
  { members: true, methods: ["gargoyles"] },
);
const dragonShield = item(
  "Anti-dragon shield",
  1,
  "dragonfire protection",
  "Wield with a one-handed weapon; alone this reduces ordinary dragonfire rather than eliminating it.",
  {
    methods: dragonCombat,
  },
);
const prayerDragonShield = {
  ...dragonShield,
  methods: ["wild-dragon-prayer", "dragon-bones"],
};
const superAntifire = item(
  "Super antifire (3)",
  1,
  "dragonfire protection",
  "Drink for full protection from ordinary dragonfire while using both Necromancy weapons. Do not start the dragon method without suitable protection.",
  { members: true, methods: ["necro-blue-dragons"] },
);

const rangedAmmunition: EquipmentRecommendation[] = [
  ...(
    [
      [1, "Bronze arrow"],
      [10, "Iron arrow"],
      [20, "Steel arrow"],
      [30, "Mithril arrow"],
      [40, "Adamant arrow"],
      [50, "Rune arrow"],
      [70, "Necronium arrow"],
      [80, "Bane arrow"],
      [90, "Elder rune arrow"],
    ] as const
  ).map(([level, name]) =>
    item(
      name,
      level,
      "ranged ammunition",
      level >= 70
        ? "Higher-tier members' arrow for a longbow; gathering and making it is a separate investment. Rune arrows are a lower-tier fallback and limit damage. Choose one arrow type, not all; the gravite chargebow needs none."
        : "Use with the longbow, not the gravite chargebow. Choose one arrow type; ammunition below the bow's tier limits damage.",
      {
        image: `${name.replaceAll(" ", "_")}_5.png`,
        members: level >= 70,
        methods: nonDragonCombat,
        levels: [{ skill: "Ranged", level }],
        acquisition:
          level < 50
            ? [
                {
                  label: "Archery shop",
                  note: "Get arrows from Lowe in Varrock; bring coins and check stock. Bronze arrows are a free sample.",
                },
              ]
            : [
                {
                  label: "Mine, smith and fletch",
                  members: level >= 70,
                  levels: [
                    { skill: "Mining", level },
                    { skill: "Smithing", level },
                    { skill: "Fletching", level },
                  ],
                  note: `Mine the ores and smelt ${name.replace(" arrow", "").toLowerCase()} bars, smith arrowheads, then add them to headless arrows made from arrow shafts and feathers. Mining applies to self-gathered ores.`,
                },
              ],
      },
    ),
  ),
  item(
    "Rune bolts",
    50,
    "ranged ammunition",
    "Use with the rune crossbow. Lowe's bronze bolts are a lower-damage fallback.",
    {
      image: "Rune_bolts_5.png",
      methods: dragonCombat,
      levels: [{ skill: "Ranged", level: 50 }],
      acquisition: [
        {
          label: "Mine, smith and fletch",
          levels: [
            { skill: "Mining", level: 50 },
            { skill: "Smithing", level: 50 },
            { skill: "Fletching", level: 53 },
          ],
          note: "Mine rune ores and smelt a rune bar, smith 50 unfinished bolts from it, then add feathers. Mining is needed for self-gathered ore.",
        },
      ],
    },
  ),
];

// The items skill pages list under the gear table: finishers, dragonfire protection, task tools and
// skill-specific carried items. Weapons and armour come from the imported catalogue instead.
const styleExtras = { items: [dragonShield, gargoyleHammer] };
export const COMBAT_EXTRAS: Partial<Record<SkillName, EquipmentGuide>> = {
  Attack: styleExtras,
  Strength: styleExtras,
  Ranged: {
    items: [
      ...styleExtras.items,
      // shortcut: hand-written ammo ladder; import an ammo slot when ammo needs tiers beyond it
      ...rangedAmmunition,
    ],
  },
  Magic: styleExtras,
  Necromancy: {
    items: [
      superAntifire,
      { ...gargoyleHammer, methods: ["necro-gargoyles"] },
      item(
        "Basic ritual candle",
        1,
        "ritual light",
        "Place at the ritual site's light spots and replace or repair depleted candles.",
        {
          methods: ["communion", "greater-communion", "powerful-communion"],
          unlocks: ["Complete Necromancy!"],
        },
      ),
      item(
        "Underworld Grimoire 1",
        1,
        "ritual pocket",
        "Optional pocket item increases experience from ritual disturbances.",
        {
          members: true,
          optional: true,
          methods: ["communion", "greater-communion", "powerful-communion"],
          unlocks: [
            "Complete the easy City of Um achievements and claim the grimoire",
          ],
        },
      ),
    ],
  },
  Prayer: {
    note: "Prayer training does not require a weapon or special clothing; collect and offer bones appropriate to the chosen method.",
    items: [
      item(
        "Bonecrusher",
        21,
        "prayer utility",
        "Automatically buries selected monster drops; configure it and consider saving valuable bones for an altar instead.",
        {
          members: true,
          optional: true,
        },
      ),
      prayerDragonShield,
    ],
  },
  Slayer: {
    items: [
      item(
        "Enchanted gem",
        1,
        "assignment utility",
        "Buy from a Slayer master to check your assignment and contact a master.",
      ),
      item(
        "Earmuffs",
        15,
        "task protection",
        "Wear for banshees; buy from a Slayer master and check the assignment before travelling.",
        {
          members: true,
          condition: "Required if assigned banshees",
          levels: [{ skill: "Slayer", level: 15 }],
        },
      ),
      item(
        "Rock hammer",
        75,
        "task finishing tool",
        "Carry for assignments involving gargoyles; Quick kills automates the finishing action.",
        {
          members: true,
          condition: "Required if assigned gargoyles",
          methods: ["vannaka", "sumona", "kuradal", "laniakea"],
        },
      ),
      gargoyleHammer,
    ],
  },
  Summoning: {
    note: "Free players can train only to level 5. Pouch infusing uses an obelisk, charms and a recipe-specific ingredient; Wolf Whistle is helpful but not required.",
    items: [
      item(
        "Pouch",
        1,
        "infusion container",
        "Buy empty pouches from a Summoning shop for infusing.",
      ),
      item(
        "Spirit shards",
        1,
        "infusion shards",
        "Buy shards from a Summoning shop; the number depends on the pouch recipe.",
      ),
    ],
  },
};

// Gear named in quest, boss and skill text. The gear table links imported items itself; these keep the
// text links without loading the imported catalogue on every page.
const namedGear = [
  "Mithril 2h sword",
  "Steel dagger",
  "Orikalkum warhammer",
  "Dragon Rider lance",
  "Adamant platebody",
  "Leather body",
  "Black dragonhide body",
  "Longbow",
  "Oak longbow",
  "Maple longbow",
  "Staff of light",
  "Adamant pickaxe",
  "Primal pickaxe",
  "Mithril hatchet",
  "Rune hatchet",
  "Dragon hatchet",
  "Dragon mattock",
].map((name) => ({ name, wiki: name, image: `${name.replaceAll(" ", "_")}.png` }));

// Inventory images come from each named recipe input's Wiki infobox.
export const EQUIPMENT_MATERIALS = [
  ...namedGear,
  { name: "Bane arrow", wiki: "Bane arrow", image: "Bane_arrow_5.png", aliases: ["bane arrows"] },
  { name: "Fire cape", wiki: "Fire cape", image: "Fire_cape.png" },
  {
    name: "Headless arrow",
    wiki: "Headless arrow",
    image: "Headless_arrow_5.png",
    aliases: ["headless arrows"],
  },
  {
    name: "Arrow shaft",
    wiki: "Arrow shaft",
    image: "Arrow_shaft_5.png",
    aliases: ["arrow shafts"],
  },
  {
    name: "Bronze arrow",
    wiki: "Bronze arrow",
    image: "Bronze_arrow_5.png",
    aliases: ["bronze arrows"],
  },
  {
    name: "Iron arrow",
    wiki: "Iron arrow",
    image: "Iron_arrow_5.png",
    aliases: ["iron arrows"],
  },
  {
    name: "Steel arrow",
    wiki: "Steel arrow",
    image: "Steel_arrow_5.png",
    aliases: ["steel arrows"],
  },
  {
    name: "Mithril arrow",
    wiki: "Mithril arrow",
    image: "Mithril_arrow_5.png",
    aliases: ["mithril arrows"],
  },
  {
    name: "Adamant arrow",
    wiki: "Adamant arrow",
    image: "Adamant_arrow_5.png",
    aliases: ["adamant arrows"],
  },
  {
    name: "Rune arrow",
    wiki: "Rune arrow",
    image: "Rune_arrow_5.png",
    aliases: ["rune arrows"],
  },
  { name: "Rune bolts", wiki: "Rune bolts", image: "Rune_bolts_5.png" },
  { name: "Bronze bolts", wiki: "Bronze bolts", image: "Bronze_bolts_5.png" },
  { name: "Bark", wiki: "Bark", image: "Bark.png" },
  { name: "Fine cloth", wiki: "Fine cloth", image: "Fine_cloth.png" },
  { name: "Mystic cloth", wiki: "Mystic cloth", image: "Mystic_cloth.png" },
  {
    name: "Grifolic flake",
    wiki: "Grifolic flake",
    image: "Grifolic_flake_1.png",
    aliases: ["grifolic flakes"],
  },
  {
    name: "Mycelium poncho web",
    wiki: "Mycelium poncho web",
    image: "Mycelium_poncho_web.png",
  },
  {
    name: "Lesser ensouled bar",
    wiki: "Lesser ensouled bar",
    image: "Lesser_ensouled_bar.png",
    aliases: ["lesser ensouled bars"],
  },
  {
    name: "Ensouled bar",
    wiki: "Ensouled bar",
    image: "Ensouled_bar.png",
    aliases: ["ensouled bars"],
  },
  {
    name: "Lesser ensouled cloth",
    wiki: "Lesser ensouled cloth",
    image: "Lesser_ensouled_cloth.png",
  },
  {
    name: "Lesser ensouled thread",
    wiki: "Lesser ensouled thread",
    image: "Lesser_ensouled_thread.png",
  },
  {
    name: "Ensouled cloth",
    wiki: "Ensouled cloth",
    image: "Ensouled_cloth.png",
  },
  {
    name: "Ensouled thread",
    wiki: "Ensouled thread",
    image: "Ensouled_thread.png",
  },
  {
    name: "Greater ensouled cloth",
    wiki: "Greater ensouled cloth",
    image: "Greater_ensouled_cloth.png",
  },
  {
    name: "Greater ensouled thread",
    wiki: "Greater ensouled thread",
    image: "Greater_ensouled_thread.png",
  },
  {
    name: "Spirit rune",
    wiki: "Spirit rune",
    image: "Spirit_rune.png",
    aliases: ["spirit runes"],
  },
  {
    name: "Flesh rune",
    wiki: "Flesh rune",
    image: "Flesh_rune.png",
    aliases: ["flesh runes"],
  },
  {
    name: "Bone rune",
    wiki: "Bone rune",
    image: "Bone_rune.png",
    aliases: ["bone runes"],
  },
  {
    name: "Miasma rune",
    wiki: "Miasma rune",
    image: "Miasma_rune.png",
    aliases: ["miasma runes"],
  },
  {
    name: "Black dragonhide",
    wiki: "Black dragonhide",
    image: "Black_dragonhide.png",
    aliases: ["black dragonhides"],
  },
  {
    name: "Royal dragonhide",
    wiki: "Royal dragonhide",
    image: "Royal_dragonhide.png",
    aliases: ["royal dragonhides"],
  },
  {
    name: "Green dragonhide",
    wiki: "Green dragonhide",
    image: "Green_dragonhide.png",
    aliases: ["green dragonhides"],
  },
  {
    name: "Blue dragonhide",
    wiki: "Blue dragonhide",
    image: "Blue_dragonhide.png",
    aliases: ["blue dragonhides"],
  },
  {
    name: "Unicorn horn",
    wiki: "Unicorn horn",
    image: "Unicorn_horn.png",
    aliases: ["unicorn horns"],
  },
  {
    name: "Dragon scale dust",
    wiki: "Dragon scale dust",
    image: "Dragon_scale_dust.png",
  },
  {
    name: "Clean lantadyme",
    wiki: "Clean lantadyme",
    image: "Clean_lantadyme.png",
  },
  {
    name: "Antifire (3)",
    wiki: "Antifire (3)",
    image: "Antifire_(3).png",
    aliases: ["antifire"],
  },
  {
    name: "Super antifire (3)",
    wiki: "Super antifire (3)",
    image: "Super_antifire_(3).png",
    aliases: ["super antifire"],
  },
  {
    name: "Greater ensouled bar",
    wiki: "Greater ensouled bar",
    image: "Greater_ensouled_bar.png",
    aliases: ["greater ensouled bars"],
  },
  {
    name: "Imphide",
    wiki: "Imphide",
    image: "Imphide.png",
    aliases: ["imphides"],
  },
  { name: "Spider silk", wiki: "Spider silk", image: "Spider_silk.png" },
  {
    name: "Batwing",
    wiki: "Batwing",
    image: "Batwing.png",
    aliases: ["batwings"],
  },
  { name: "Steel studs", wiki: "Steel studs", image: "Steel_studs.png" },
  {
    name: "Strip of cloth",
    wiki: "Strip of cloth",
    image: "Strip_of_cloth.png",
    aliases: ["strips of cloth"],
  },
  {
    name: "Phoenix feather",
    wiki: "Phoenix feather",
    image: "Phoenix_feather.png",
    aliases: ["phoenix feathers", "desert phoenix feather"],
  },
];
