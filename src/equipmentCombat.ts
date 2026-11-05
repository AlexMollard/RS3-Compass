import type { SkillName } from "./skillNames.ts";
import type {
  EquipmentGuide,
  EquipmentRecommendation,
} from "./equipmentTypes.ts";

// Item identities, inventory artwork and requirements:
// https://runescape.wiki/w/Melee_weapons https://runescape.wiki/w/Ranged_weapons
// https://runescape.wiki/w/Magic_weapons https://runescape.wiki/w/Death_Skull_equipment
// https://runescape.wiki/w/Summoning https://runescape.wiki/w/Rock_hammer
// Acquisition levels are route-specific, not requirements to equip an item.
const acquisition = (name: string): EquipmentRecommendation["acquisition"] => {
  const metalLevels: Record<string, number> = {
    Bronze: 1,
    Iron: 10,
    Steel: 20,
    Mithril: 30,
    Adamant: 40,
    Rune: 50,
    Orikalkum: 60,
    Necronium: 70,
    Bane: 80,
    Elder: 90,
    Primal: 100,
  };
  const metal = name.split(" ")[0];
  if (
    [
      " dagger",
      " platebody",
      " warhammer",
      " battleaxe",
      " longsword",
      " 2h sword",
      " 2h warhammer",
      " 2h greataxe",
    ].some((suffix) => name.endsWith(suffix)) &&
    metalLevels[metal] !== undefined
  ) {
    const level = metalLevels[metal];
    return [
      {
        label: "Mine and smith",
        levels: [
          { skill: "Mining", level },
          { skill: "Smithing", level },
        ],
        note: "Mine the ores, smelt bars and forge the item; obtaining bars elsewhere changes the Mining requirement.",
      },
    ];
  }
  const armourCraft: Record<string, [number, string]> = {
    "Leather body": [1, "Tan cowhides and sew the leather."],
    "Studded body": [
      41,
      "Add steel studs to a leather body; mine iron and coal and smith the studs from a steel bar.",
    ],
    "Carapace torso": [
      35,
      "Collect three carapace from cockroaches and sew the torso with thread.",
    ],
    "Green dragonhide body": [
      40,
      "Collect green dragonhides, have them tanned and sew three leathers; prepare dragonfire protection.",
    ],
    "Blue dragonhide body": [
      50,
      "Collect blue dragonhides, have them tanned and sew three leathers; prepare dragonfire protection.",
    ],
    "Black dragonhide body": [
      60,
      "Collect black dragonhides, have them tanned and sew three leathers; prepare dragonfire protection.",
    ],
    "Royal dragonhide body": [
      65,
      "Collect royal dragonhides from grotworms or the Queen Black Dragon, tan and sew three leathers.",
    ],
    "Wizard robe top": [1, "Sew strips of cloth and thread."],
    "Imphide robe top": [14, "Sew imphide and thread."],
    "Spider silk robe top": [24, "Sew spider silk and thread."],
    "Batwing torso": [35, "Sew batwing and thread."],
    "Splitbark body": [
      40,
      "Give Wizard Jalarast four bark, four fine cloth and coins; Zaff sells both materials in limited stock.",
    ],
    "Mystic robe top": [
      55,
      "Collect mystic cloth from ankou and sew it with thread; drops are not guaranteed.",
    ],
  };
  if (armourCraft[name]) {
    const [level, note] = armourCraft[name];
    const routes: EquipmentRecommendation["acquisition"] = [
      {
        label: "Gather and craft",
        levels: [
          { skill: "Crafting", level },
          ...(name === "Studded body"
            ? [
                { skill: "Mining" as const, level: 20 },
                { skill: "Smithing" as const, level: 20 },
              ]
            : []),
        ],
        note,
      },
    ];
    if (
      ["Studded body", "Carapace torso", "Green dragonhide body"].includes(name)
    )
      routes.push({
        label: "Archery shop",
        note: "Buy from Lowe in Varrock with coins; check stock.",
      });
    return routes;
  }
  if (name === "Grifolic poncho")
    return [
      {
        label: "Collect and craft",
        members: true,
        levels: [
          { skill: "Crafting", level: 60 },
          { skill: "Slayer", level: 82 },
        ],
        note: "Sew 3,500 grifolic flakes from grifolaroos onto a mycelium poncho web; the drops take time.",
      },
    ];
  const bows: Record<string, [number, number]> = {
    Longbow: [5, 1],
    "Oak longbow": [15, 10],
    "Willow longbow": [25, 20],
    "Maple longbow": [45, 40],
    "Acadia longbow": [55, 50],
    "Yew longbow": [75, 70],
    "Magic longbow": [85, 80],
    "Elder longbow": [95, 90],
    "Eternal magic longbow": [105, 100],
  };
  if (bows[name]) {
    const routes: EquipmentRecommendation["acquisition"] = [
      {
        label: "Gather and fletch",
        levels: [
          { skill: "Woodcutting", level: bows[name][1] },
          { skill: "Fletching", level: bows[name][0] },
          { skill: "Crafting", level: 1 },
        ],
        note: "Cut the appropriate logs and spin flax into bowstring, then cut and string the bow. For acadia, free players can cut trees at Het's Oasis. Arrows are separate supplies.",
      },
    ];
    if (bows[name][0] <= 55)
      routes.push({
        label: "Archery shop",
        note: "Buy from Brian in Rimmington or Lowe in Varrock; bring coins and check stock.",
      });
    return routes;
  }
  if (
    name.startsWith("Death guard (tier ") ||
    name.startsWith("Skull lantern (tier ")
  ) {
    const tier = Number(name.match(/tier (\d+)/)?.[1]);
    return tier === 10
      ? [
          {
            label: "Introduction",
            unlocks: ["Complete Necromancy!"],
            note: "The introductory quest supplies the weapon; Sostratus sells replacements.",
          },
        ]
      : [
          {
            label: "Soul forge",
            members: true,
            levels: [
              { skill: "Smithing", level: tier - 5 },
              { skill: "Necromancy", level: tier },
            ],
            unlocks: [
              tier === 20
                ? "Complete Kili Row"
                : `Complete Kili's Knowledge ${["I", "II", "III", "IV", "V", "VI", "VII"][tier / 10 - 3]}${tier >= 70 ? " (tank or power)" : ""}`,
            ],
            note: "Upgrade the preceding weapon at the soul forge. Check this tier's Wiki recipe for its ritual materials and runes; make them through rituals and Runecrafting or obtain them from drops.",
          },
        ];
  }
  const craftMagic: Record<string, [number, number]> = {
    "Imp horn wand": [16, 10],
    "Imphide book": [15, 10],
    "Spider wand": [26, 20],
    "Spider orb": [25, 20],
    "Batwing wand": [37, 30],
    "Batwing book": [36, 30],
    "Splitbark wand": [40, 40],
    "Splitbark orb": [40, 40],
    "Mystic wand": [57, 50],
    "Mystic orb": [56, 50],
  };
  if (craftMagic[name]) {
    const [craft, runecraft] = craftMagic[name];
    const routes: EquipmentRecommendation["acquisition"] = [
      {
        label: name.startsWith("Splitbark") ? "Wizard Jalarast" : "Craft",
        levels: [
          { skill: "Crafting", level: craft },
          { skill: "Runecrafting", level: runecraft },
        ],
        note: name.startsWith("Splitbark")
          ? "Give Wizard Jalarast bark and coins; Zaff sells bark in Varrock."
          : "Gather the required materials and make the item; wand recipes also need logs.",
      },
    ];
    if (!name.startsWith("Splitbark"))
      routes.push({
        label: "Magic shop",
        ...(name.startsWith("Mystic")
          ? { unlocks: ["Access the Champions' Guild (33 quest points)"] }
          : {}),
        note: name.startsWith("Mystic")
          ? "Buy from Mystic Marge in the Champions' Guild; bring coins and check stock."
          : "Buy from Betty in Port Sarim; bring coins and check stock.",
      });
    return routes;
  }
  if (name === "Staff of air")
    return [
      {
        label: "Magic shop",
        note: "Buy from Zaff's staff shop in Varrock; bring coins and check stock.",
      },
    ];
  const routes: Record<
    string,
    {
      label: string;
      note: string;
      unlocks?: string[];
      levels?: { skill: SkillName; level: number }[];
    }
  > = {
    "Dragon Rider lance": {
      label: "Boss drop",
      note: "Obtain the random drop from Vindicta and Gorvek in the Heart of Gielinor.",
    },
    "Gravite 2h sword": {
      label: "Dungeoneering reward",
      note: "Buy from the Daemonheim rewards trader for 30,000 Dungeoneering tokens; it degrades.",
    },
    "Rune crossbow": {
      label: "Champions' Guild shop",
      unlocks: ["Access the Champions' Guild (33 quest points)"],
      note: "Buy from Valaine with coins when in stock; ammunition is separate.",
    },
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
    "Gravite chargebow": {
      label: "Dungeoneering reward",
      note: "Purchase from the Daemonheim rewards trader for tokens.",
    },
    "Gravite staff": {
      label: "Dungeoneering reward",
      note: "Purchase from the Daemonheim rewards trader for tokens.",
    },
    "Chaotic staff": {
      label: "Dungeoneering reward",
      note: "Purchase from the Daemonheim rewards trader for tokens.",
    },
    "Staff of light": {
      label: "Monster drop",
      levels: [{ skill: "Slayer", level: 93 }],
      unlocks: [
        "Wear a fire cape or its upgrade, or purchase the 2,000 Slayer-point ice strykewyrm unlock",
      ],
      note: "Kill ice strykewyrms for a rare drop. Wilderness sites do not need the cave's quest access; check PvP status and nearby threats before travelling. A Slayer assignment has additional prerequisites.",
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
  "cockroach-soldiers",
  "ice-giants",
  "gargoyles",
  "slayer-assignment",
  "wild-hellhounds",
  "abyssal-demons",
];
const dragonCombat = ["blue-dragons", "wilderness-blue-dragons"];
const gargoyleHammer = item(
  "Rock hammer",
  1,
  "finishing tool",
  "Carry this to finish gargoyles, or add it to the tool belt; a normal hammer is not a substitute.",
  { members: true, methods: ["gargoyles"] },
);
const necroCombat = [
  "necro-combat",
  "necro-moss",
  "necro-blue-dragons",
  "necro-gargoyles",
  "necro-abyssals",
];
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

const meleeWeapons: EquipmentRecommendation[] = [
  ...(
    [
      [1, "Bronze 2h sword"],
      [10, "Iron 2h sword"],
      [20, "Steel 2h sword"],
      [30, "Mithril 2h sword"],
      [40, "Adamant 2h sword"],
      [50, "Rune 2h sword"],
      [60, "Orikalkum 2h warhammer"],
      [70, "Necronium 2h greataxe"],
      [80, "Bane 2h sword"],
      [90, "Elder rune 2h sword"],
      [99, "Primal 2h sword"],
    ] as const
  ).map(([level, name]) =>
    item(
      name,
      level,
      "melee weapon",
      level === 99
        ? "Two-handed weapon; requires 99 Attack but has tier 85 base stats. Smithing and self-gathering require level 100."
        : "Two-handed melee weapon; do not equip an off-hand or shield with it.",
      {
        members: level >= 60,
        methods: nonDragonCombat,
        levels: [{ skill: "Attack", level }],
      },
    ),
  ),
  ...(
    [
      [1, "Bronze dagger"],
      [10, "Iron dagger"],
      [20, "Steel dagger"],
      [30, "Mithril dagger"],
      [40, "Adamant dagger"],
      [50, "Rune dagger"],
      [60, "Orikalkum warhammer"],
      [70, "Necronium battleaxe"],
      [80, "Bane longsword"],
      [90, "Elder rune longsword"],
      [99, "Primal warhammer"],
    ] as const
  ).map(([level, name]) =>
    item(
      name,
      level,
      "melee weapon",
      level === 99
        ? "One-handed weapon for the anti-dragon shield; 99 Attack to wield, tier 85 base stats, and 100 Smithing to make."
        : "One-handed weapon for use with the anti-dragon shield.",
      {
        members: level >= 60,
        methods: dragonCombat,
        levels: [{ skill: "Attack", level }],
      },
    ),
  ),
  item(
    "Gravite 2h sword",
    55,
    "melee weapon",
    "Free-to-play two-handed alternative; it degrades and cannot be used with a shield.",
    {
      optional: true,
      methods: nonDragonCombat,
      levels: [
        { skill: "Attack", level: 55 },
        { skill: "Dungeoneering", level: 35 },
      ],
    },
  ),
  item(
    "Dragon Rider lance",
    85,
    "melee weapon",
    "Two-handed boss-drop upgrade; keep a practical earlier weapon until acquired.",
    {
      members: true,
      optional: true,
      methods: nonDragonCombat,
      levels: [{ skill: "Attack", level: 85 }],
    },
  ),
];

const meleeArmour: EquipmentRecommendation[] = (
  [
    [1, "Bronze"],
    [10, "Iron"],
    [20, "Steel"],
    [30, "Mithril"],
    [40, "Adamant"],
    [50, "Rune"],
    [60, "Orikalkum"],
    [70, "Necronium"],
    [80, "Bane"],
    [90, "Elder rune"],
    [99, "Primal"],
  ] as const
).map(([level, metal]) =>
  item(
    `${metal} platebody`,
    level,
    "melee body",
    level === 99
      ? "Requires 99 Defence to wear but has tier 85 base stats; smithing and self-gathering require level 100."
      : "Melee armour example; smith or otherwise obtain it. Choose armour for your actual combat style.",
    { members: level >= 60, levels: [{ skill: "Defence", level }] },
  ),
);

const rangedArmour: EquipmentRecommendation[] = [
  ...(
    [
      [1, "Leather body"],
      [20, "Studded body"],
      [30, "Carapace torso"],
      [40, "Green dragonhide body"],
      [50, "Blue dragonhide body"],
    ] as const
  ).map(([level, name]) =>
    item(
      name,
      level,
      "ranged body",
      "Ranged armour example; Defence is checked independently of Ranged.",
      { levels: [{ skill: "Defence", level }] },
    ),
  ),
  ...(
    [
      [60, "Black dragonhide body"],
      [65, "Royal dragonhide body"],
    ] as const
  ).map(([level, name]) =>
    item(
      name,
      level,
      "ranged body upgrade",
      "Members' dragonhide upgrade; obtain and tan the hides before crafting.",
      { members: true, optional: true, levels: [{ skill: "Defence", level }] },
    ),
  ),
];

const magicArmour: EquipmentRecommendation[] = [
  ...(
    [
      [1, "Wizard robe top"],
      [10, "Imphide robe top"],
      [20, "Spider silk robe top"],
      [30, "Batwing torso"],
      [40, "Splitbark body"],
      [50, "Mystic robe top"],
    ] as const
  ).map(([level, name]) =>
    item(
      name,
      level,
      "magic body",
      "Magic armour example; Defence is checked independently of Magic.",
      { levels: [{ skill: "Defence", level }] },
    ),
  ),
  item(
    "Grifolic poncho",
    60,
    "magic body upgrade",
    "Members' degrading armour; gather flakes and repair as needed.",
    {
      members: true,
      optional: true,
      levels: [{ skill: "Defence", level: 60 }],
    },
  ),
];

const rangedWeapons: EquipmentRecommendation[] = [
  ...(
    [
      [1, "Longbow"],
      [10, "Oak longbow"],
      [20, "Willow longbow"],
      [40, "Maple longbow"],
      [50, "Acadia longbow"],
      [70, "Yew longbow"],
      [80, "Magic longbow"],
      [90, "Elder longbow"],
      [99, "Eternal magic longbow"],
    ] as const
  ).map(([level, name]) =>
    item(
      name,
      level,
      "ranged weapon",
      level < 50
        ? "Two-handed bow. Lowe in Varrock stocks bronze, iron, steel, mithril and adamant arrows; bring coins and check stock. Lower-tier arrows limit weapon damage."
        : "Two-handed bow. Match ammunition to its damage tier; rune arrows are a lower-tier fallback, not the best ammunition for stronger members' bows.",
      {
        members: level >= 70,
        methods: nonDragonCombat,
        levels: [{ skill: "Ranged", level }],
      },
    ),
  ),
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
    "Gravite chargebow",
    55,
    "ranged weapon",
    "No arrows needed; degrades and costs Dungeoneering tokens.",
    {
      optional: true,
      methods: nonDragonCombat,
      levels: [
        { skill: "Ranged", level: 55 },
        { skill: "Dungeoneering", level: 35 },
      ],
    },
  ),
  item(
    "Rune crossbow",
    50,
    "ranged weapon",
    "One-handed weapon for the anti-dragon shield. Use rune bolts (50 Ranged): smith unfinished bolts from rune bars at 50 Smithing (50 Mining for self-gathered ore), then add feathers at 53 Fletching. Lowe's bronze bolts are an earlier option but limit damage.",
    { methods: dragonCombat, levels: [{ skill: "Ranged", level: 50 }] },
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
  dragonShield,
];

const magicWeapons: EquipmentRecommendation[] = [
  item(
    "Staff of air",
    1,
    "magic weapon",
    "Two-handed staff supplies air runes; bring any other runes needed for your spell.",
    { methods: nonDragonCombat, levels: [{ skill: "Magic", level: 1 }] },
  ),
  ...(
    [
      [10, "Imp horn wand", "Imphide book"],
      [20, "Spider wand", "Spider orb"],
      [30, "Batwing wand", "Batwing book"],
      [40, "Splitbark wand", "Splitbark orb"],
      [50, "Mystic wand", "Mystic orb"],
    ] as const
  ).flatMap(([level, wand, offhand]) => [
    item(
      wand,
      level,
      "magic weapon",
      "Use with a matching off-hand and runes; against dragons, use the anti-dragon shield instead of an orb.",
      { levels: [{ skill: "Magic", level }] },
    ),
    item(
      offhand,
      level,
      "magic off hand",
      "Pair with the corresponding wand for dual-wield abilities; replace it with a dragonfire shield for dragons.",
      { methods: nonDragonCombat, levels: [{ skill: "Magic", level }] },
    ),
  ]),
  item(
    "Gravite staff",
    55,
    "magic upgrade",
    "Two-handed alternative; degrades and requires Dungeoneering tokens.",
    {
      optional: true,
      methods: nonDragonCombat,
      levels: [
        { skill: "Magic", level: 55 },
        { skill: "Dungeoneering", level: 35 },
      ],
    },
  ),
  item(
    "Staff of light",
    75,
    "magic upgrade",
    "Two-handed alternative; ice strykewyrms require 93 Slayer and can drop it off assignment.",
    {
      members: true,
      optional: true,
      methods: nonDragonCombat,
      levels: [{ skill: "Magic", level: 75 }],
    },
  ),
  item(
    "Chaotic staff",
    80,
    "magic upgrade",
    "Two-handed alternative bought with Dungeoneering tokens; it degrades.",
    {
      members: true,
      optional: true,
      methods: nonDragonCombat,
      levels: [
        { skill: "Magic", level: 80 },
        { skill: "Dungeoneering", level: 70 },
      ],
    },
  ),
  dragonShield,
];

const necroWeapons = ["Death guard", "Skull lantern"].flatMap((weapon) =>
  [10, 20, 30, 40, 50, 60, 70, 80, 90].map((tier) =>
    item(
      `${weapon} (tier ${tier})`,
      tier === 10 ? 1 : tier,
      weapon === "Death guard" ? "necromancy main hand" : "necromancy off hand",
      tier === 10
        ? "Obtain from the Necromancy! introduction; use the guard and lantern together."
        : "Upgrade the previous weapon at the soul forge; Ironmen gather the ritual materials and complete Kili's corresponding task.",
      {
        members: tier > 10,
        methods: necroCombat,
        levels: [{ skill: "Necromancy", level: tier === 10 ? 1 : tier }],
      },
    ),
  ),
);

// The individual robe-top recipe infoboxes specify Crafting tier - 5, independently of Defence.
const robeMaterials: Record<number, string> = {
  20: "2 lesser ensouled cloth",
  30: "2 lesser ensouled cloth",
  40: "2 lesser ensouled cloth and 1 lesser ensouled thread",
  50: "2 lesser ensouled cloth, 1 lesser ensouled thread and 20 spirit runes",
  60: "2 ensouled cloth, 1 ensouled thread and 25 spirit runes",
  70: "3 ensouled cloth, 2 ensouled thread and 20 flesh runes",
  80: "2 greater ensouled cloth, 1 greater ensouled thread and 25 flesh runes",
  90: "3 greater ensouled cloth, 2 greater ensouled thread and 20 each of spirit runes, flesh runes, bone runes and miasma runes",
};
const necroArmour = [10, 20, 30, 40, 50, 60, 70, 80, 90].map((tier) =>
  item(
    `Deathwarden robe top (tier ${tier})`,
    tier === 10 ? 1 : tier,
    "necromancy body",
    "Tank body-armour example; your Defence requirement is independent of Necromancy.",
    {
      members: tier > 10,
      methods: necroCombat,
      levels: tier === 10 ? [] : [{ skill: "Defence", level: tier }],
      unlocks:
        tier === 90
          ? ["Craft this tier yourself at least once before wearing it"]
          : undefined,
      acquisition:
        tier === 10
          ? [
              {
                label: "Introduction",
                unlocks: ["Complete Necromancy!"],
                note: "After completing the introduction, claim the free Deathwarden set from Sostratus at Buried Bargains; replacements can be bought there.",
              },
            ]
          : [
              {
                label: "Upgrade at soul forge",
                levels: [
                  { skill: "Crafting", level: tier - 5 },
                  { skill: "Necromancy", level: tier },
                ],
                unlocks: [
                  tier === 20
                    ? "Complete Kili Row"
                    : `Complete Kili's Knowledge ${["I", "II", "III", "IV", "V", "VI", "VII"][tier / 10 - 3]}${tier >= 70 ? " (tank route)" : ""}`,
                ],
                note: `Upgrade the previous body at the soul forge using ${robeMaterials[tier]}. Obtain the ritual materials and runes first.`,
              },
            ],
    },
  ),
);

export const COMBAT_EQUIPMENT: Partial<Record<SkillName, EquipmentGuide>> = {
  Attack: {
    note: "Weapon requirements are Attack, not Defence. Wear melee armour only if your separate Defence level permits it.",
    items: [...meleeWeapons, ...meleeArmour, dragonShield, gargoyleHammer],
  },
  Strength: {
    note: "Strength training uses melee, but weapon choice depends on Attack, not Strength. Select a weapon you can wield; raising Strength alone does not unlock these examples.",
    items: [...meleeWeapons, ...meleeArmour, dragonShield, gargoyleHammer],
  },
  Defence: {
    note: "Any combat style can train Defence. These smithable platebodies are melee examples, not requirements for ranged, magic or Necromancy.",
    items: [...meleeArmour, dragonShield, gargoyleHammer],
  },
  Constitution: {
    note: "Any combat style can train Constitution. This is a melee armour example, not a requirement; armour depends on Defence independently of Constitution.",
    items: [...meleeArmour, dragonShield, gargoyleHammer],
  },
  Ranged: {
    note: "Use style-appropriate armour at your actual Defence level; bows need compatible ammunition unless stated otherwise.",
    items: [...rangedWeapons, ...rangedArmour, gargoyleHammer],
  },
  Magic: {
    note: "Use a two-handed staff or a wand and off-hand, not both. Combat spells also need their runes; use magic armour appropriate to your Defence.",
    items: [...magicWeapons, ...magicArmour, gargoyleHammer],
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
    note: "Choose combat equipment for your actual style and levels; task-specific protection and finishing tools depend on the assigned monster.",
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
  Necromancy: {
    note: "Free players can train to level 20. Combat uses both weapons; rituals use the ritual site and materials instead. Later upgrades are not assumed to be owned or unlocked.",
    items: [
      ...necroWeapons,
      ...necroArmour,
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
};

// Inventory images come from each named recipe input's Wiki infobox.
export const EQUIPMENT_MATERIALS = [
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
