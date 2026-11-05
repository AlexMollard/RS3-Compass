import type {
  EquipmentGuide,
  EquipmentRecommendation,
} from "./equipmentTypes.ts";
import type { SkillName } from "./skillNames.ts";

const starting = [
  {
    label: "Starting tool belt",
    note: "Check the default tool belt; no purchase or smithing is needed.",
  },
];
const acquisition: Record<string, EquipmentRecommendation["acquisition"]> = {
  Hammer: starting,
  Knife: starting,
  Tinderbox: starting,
  Chisel: starting,
  Saw: starting,
  "Pestle and mortar": starting,
  Rake: starting,
  "Seed dibber": starting,
  Spade: starting,
  "Glassblowing pipe": starting,
  "Crayfish cage": starting,
  "Small fishing net": starting,
  "Fly fishing rod": starting,
  Harpoon: starting,
  "Fishing rod": starting,
  "Big fishing net": starting,
  "Bronze hatchet": starting,
  "Blacksmith's helmet": [
    {
      label: "Artisans’ Workshop",
      unlocks: ["Earn 50 respect"],
      note: "Egil sells a random unowned outfit piece; the helmet is not guaranteed first.",
    },
  ],
  "Cooking gauntlets": [
    {
      label: "Family Crest",
      unlocks: ["Complete Family Crest"],
      note: "Have Caleb enchant the family gauntlets for cooking.",
    },
  ],
  "Dragon hatchet": [
    {
      label: "Dagannoth Kings",
      note: "Rare random drop from the Dagannoth Kings; combat and dungeon access are needed.",
    },
  ],
  "Magic secateurs": [
    {
      label: "Fairy Tale I",
      unlocks: ["Progress A Fairy Tale I - Growing Pains"],
      note: "Obtain during the quest; defeat Tanglefoot before adding them to the tool belt.",
    },
  ],
  "Bird snare": [
    {
      label: "Ayleth",
      note: "Get a starter snare from Ayleth in the Taverley Hunter area.",
    },
  ],
  Rope: [
    {
      label: "Ned",
      note: "Buy rope from Ned in Draynor; stock and coins are needed.",
    },
  ],
  "Box trap": [
    {
      label: "Hunter shop",
      note: "Buy from a Hunter supply shop; stock and coins are needed.",
    },
  ],
  "Marasamaw plant": [
    {
      label: "Hunter shop",
      note: "Buy from Irwinsson on Anachronia; stock and coins are needed.",
    },
  ],
  "Boots of lightness": [
    {
      label: "Temple of Ikov",
      note: "Collect the spawn in the Temple of Ikov dungeon; bring a light source and a slashing weapon.",
    },
  ],
  Stethoscope: [
    {
      label: "Thieves’ Guild",
      unlocks: ["Complete A Guild of Our Own"],
      note: "The safe-cracking trainer gives one after the guild quest series.",
    },
  ],
  "Small loot bag": [
    {
      label: "Thieves’ Guild",
      unlocks: ["Complete A Guild of Our Own"],
      note: "Collect the bag from the safe-cracking trainer.",
    },
  ],
  "Air talisman": [
    {
      label: "Apprentice Clara",
      note: "Obtain the free air talisman from her Burthorpe rune shop, subject to stock.",
    },
  ],
  "Body talisman": [
    {
      label: "Monster drop",
      note: "Hill giants and guards can drop it randomly; the Runecrafting Guild token shop is unavailable to Ironmen.",
    },
  ],
  "Novite 2h sword": [
    {
      label: "Inside Daemonheim",
      levels: [
        { skill: "Mining", level: 1 },
        { skill: "Smithing", level: 8 },
      ],
      note: "Mine novite and smith four bars inside the floor, or find one as a random drop; bind it inside.",
    },
  ],
  "Cracked divination urn": [
    {
      label: "Make an urn",
      levels: [{ skill: "Crafting", level: 3 }],
      note: "Shape and fire the urn, then add a mind rune; filling it does not require Crafting.",
    },
  ],
  "Inventor's tools": [
    {
      label: "Invention tutorial",
      levels: [
        { skill: "Crafting", level: 80 },
        { skill: "Smithing", level: 80 },
        { skill: "Divination", level: 80 },
      ],
      unlocks: ["Unlock Invention and complete the tutorial"],
      note: "Obtain the tools during the tutorial.",
    },
  ],
  "Bag of materials": [
    {
      label: "Invention tutorial",
      levels: [
        { skill: "Crafting", level: 80 },
        { skill: "Smithing", level: 80 },
        { skill: "Divination", level: 80 },
      ],
      unlocks: ["Unlock Invention and complete the tutorial"],
      note: "Obtain the bag during the tutorial.",
    },
  ],
  "Archaeological soil box": [
    {
      label: "Archaeology tutorial",
      unlocks: ["Progress the Archaeology tutorial"],
      note: "Claim the box from Ezreal.",
    },
  ],
  "Dragon mattock": [
    {
      label: "Big Game Hunter",
      note: "A rare random reward from Big Game Hunter; the dinosaur encounter has its own Hunter and Slayer requirements.",
    },
  ],
  Augmentor: [
    {
      label: "Inventor workbench",
      levels: [
        { skill: "Invention", level: 2 },
        { skill: "Divination", level: 80 },
      ],
      unlocks: ["Discover augmentor blueprint during Invention tutorial"],
      note: "Use divine energy and disassembled components at a workbench.",
    },
  ],
  "Equipment siphon": [
    {
      label: "Inventor workbench",
      levels: [{ skill: "Invention", level: 27 }],
      unlocks: ["Discover equipment dissolver and equipment siphon blueprints"],
      note: "Make from simple, dextrous and precious components obtained by disassembly.",
    },
  ],
  "Divine charge": [
    {
      label: "Weave divine energy",
      levels: [
        { skill: "Invention", level: 4 },
        { skill: "Divination", level: 80 },
      ],
      unlocks: ["Discover divine charge blueprint"],
      note: "Weave gathered divine energy and simple parts from disassembly.",
    },
  ],
};

// Item names and inventory images follow the RuneScape Wiki's tool and item articles.
const item = (
  name: string,
  slot: string,
  note: string,
  extra: Partial<EquipmentRecommendation> = {},
): EquipmentRecommendation => ({
  name,
  wiki: name,
  image: `${name.replaceAll(" ", "_")}.png`,
  from: 1,
  slot,
  note,
  acquisition: acquisition[name],
  ...extra,
});

const metals = [
  ["Bronze", 1],
  ["Iron", 10],
  ["Steel", 20],
  ["Mithril", 30],
  ["Adamant", 40],
  ["Rune", 50],
  ["Orikalkum", 60],
  ["Necronium", 70],
  ["Bane", 80],
  ["Elder rune", 90],
  ["Primal", 100],
] as const;
const tools = (
  kind: "pickaxe" | "hatchet" | "mattock",
  skill: "Mining" | "Woodcutting" | "Archaeology",
): EquipmentRecommendation[] =>
  metals
    .filter(([metal]) => kind !== "mattock" || metal !== "Primal")
    .map(([metal, level]) =>
      item(
        `${metal} ${kind}`,
        kind,
        kind === "hatchet"
          ? "Use from the tool belt or backpack; wielding separately requires Attack."
          : "Use from the tool belt, backpack or wielded; the skill level shown is the use requirement.",
        {
          from: level,
          members: level >= 60,
          levels: [{ skill, level }],
          acquisition: [
            {
              label: "Mine and smith",
              levels: [
                { skill: "Mining", level },
                { skill: "Smithing", level },
              ],
              note: `Mine the ores, smelt ${metal.toLowerCase()} bars and smith the ${kind} at an anvil.`,
            },
            ...(level === 1
              ? [
                  {
                    label:
                      kind === "mattock"
                        ? "Archaeology tutorial"
                        : "Starting tool belt",
                    note:
                      kind === "mattock"
                        ? "Reiniger supplies a tutorial mattock; check the bronze tool belt mattock after the tutorial."
                        : "Check the default bronze tool on the tool belt.",
                  },
                ]
              : []),
            ...(kind === "mattock" && level <= 50
              ? [
                  {
                    label: "Mattock shop",
                    note: "Buy from Matty Ock's shop; stock and coins are needed.",
                  },
                ]
              : []),
            ...(kind === "pickaxe" && level <= 50
              ? [
                  {
                    label: "Pickaxe shop",
                    note: "Buy from Nurmof in the Dwarven Mines; stock and coins are needed.",
                  },
                ]
              : []),
            ...(kind === "hatchet" && level <= 40
              ? [
                  {
                    label: "Hatchet shop",
                    note: "Buy from Bob in Lumbridge; stock and coins are needed.",
                  },
                ]
              : []),
          ],
        },
      ),
    );
const boxes = metals.map(([metal, level]) =>
  item(
    `${metal} ore box`,
    "ore box",
    "Stores this ore tier and lower. Smith successive upgrades; using the box has no Mining requirement.",
    {
      from: level,
      planningSkill: "Mining",
      members: level >= 60,
      acquisition: [
        {
          label: "Mine and smith",
          levels: [
            { skill: "Mining", level },
            { skill: "Smithing", level },
          ],
          note: `Mine and smelt the ores, then upgrade the previous box with two ${metal.toLowerCase()} bars at an anvil; start with a bronze box.`,
        },
      ],
    },
  ),
);
const patchMethods = ["potatoes", "allotment", "herb-run"];
const treeMethods = [
  "oak-tree",
  "willow-tree",
  "maple-tree",
  "yew-tree",
  "magic-tree-farming",
];
const tool = (
  name: string,
  note: string,
  extra: Partial<EquipmentRecommendation> = {},
) => item(name, name, note, extra);

export const SKILLING_EQUIPMENT: Partial<Record<SkillName, EquipmentGuide>> = {
  Mining: {
    note: "The rune tier remains usable on free worlds through level 110; higher metal tools are members-only.",
    items: [...tools("pickaxe", "Mining"), ...boxes],
  },
  Smithing: {
    items: [
      tool(
        "Hammer",
        "The ordinary hammer works for every listed metal; the default tool-belt hammer is sufficient.",
      ),
      tool(
        "Blacksmith's helmet",
        "A 1% Smithing XP boost when worn; Egil sells a random unowned outfit piece for respect.",
        {
          members: true,
          optional: true,
          unlocks: [
            "Earn 50 Artisans' Workshop respect for a random outfit piece",
          ],
        },
      ),
    ],
  },
  Fishing: {
    items: [
      item(
        "Crayfish cage",
        "tackle",
        "Use the default tool-belt cage at crayfish spots.",
        { methods: ["crayfish"] },
      ),
      item(
        "Small fishing net",
        "tackle",
        "Use the default tool-belt net for shrimps and anchovies.",
        { methods: ["shrimps"] },
      ),
      item(
        "Fly fishing rod",
        "tackle",
        "Use the tool-belt rod and carry feathers; fly fishing remains viable to 99.",
        { methods: ["fly-fishing"] },
      ),
      item(
        "Harpoon",
        "tackle",
        "Use the tool-belt harpoon for tuna and swordfish.",
        { methods: ["tuna-swordfish"] },
      ),
      item(
        "Fishing rod",
        "tackle",
        "Use the tool-belt rod; bring fishing bait for Menaphos.",
        { members: true, methods: ["menaphos-fish"] },
      ),
      item("Big fishing net", "tackle", "Use the tool-belt net at the swarm.", {
        members: true,
        methods: ["deep-sea-swarm"],
      }),
      item(
        "Fishing rod",
        "tackle",
        "Use the tool-belt rod for this deep-sea catch.",
        { members: true, methods: ["blue-blubber", "sailfish"] },
      ),
    ],
  },
  Cooking: {
    note: "A range or fire cooks these fish without a specialised tool.",
    items: [
      tool(
        "Cooking gauntlets",
        "Wear for reduced burning on certain fish, including monkfish and shark; not every fish benefits.",
        {
          optional: true,
          members: true,
          unlocks: ["Complete Family Crest and obtain the cooking enchantment"],
          methods: ["monkfish", "shark"],
        },
      ),
      tool(
        "Tinderbox",
        "Default tool-belt tinderbox can light a fire if a range is unavailable.",
        { optional: true },
      ),
    ],
  },
  Woodcutting: {
    note: "Rune is the free-world plateau; the same hatchet works across tree types.",
    items: [
      ...tools("hatchet", "Woodcutting"),
      item(
        "Dragon hatchet",
        "special hatchet",
        "An augmentable alternative with better cutting power than orikalkum. Unaugmented can go on the tool belt.",
        {
          from: 60,
          optional: true,
          members: true,
          levels: [{ skill: "Woodcutting", level: 60 }],
        },
      ),
    ],
  },
  Fletching: {
    items: [
      tool(
        "Knife",
        "The default tool-belt knife cuts shafts and unstrung bows; no higher-tier knife is needed.",
      ),
    ],
  },
  Firemaking: {
    items: [
      tool(
        "Tinderbox",
        "Light logs or add logs to a fire with the default tool-belt tinderbox; it does not tier.",
      ),
    ],
  },
  Crafting: {
    note: "Spinning flax and playing harps use the station rather than a carried cutting tool.",
    items: [
      tool("Chisel", "The default tool-belt chisel cuts gems.", {
        methods: ["sapphire", "emerald", "ruby", "diamond"],
      }),
      tool(
        "Glassblowing pipe",
        "Use the tool-belt pipe to shape glass into flasks.",
        { members: true, methods: ["potion-flasks", "crystal-flasks"] },
      ),
    ],
  },
  Herblore: {
    note: "Mixing potions requires ingredients, not a higher-tier tool; grind applicable secondaries with the default tool-belt mortar.",
    items: [
      tool(
        "Pestle and mortar",
        "Grinds secondaries such as unicorn horn; it is already on the tool belt.",
      ),
    ],
  },
  Farming: {
    note: "Animal pens use feed and animals rather than patch tools.",
    items: [
      tool(
        "Rake",
        "Clear weeds from patches with the default tool-belt rake.",
        { methods: [...patchMethods, ...treeMethods] },
      ),
      tool(
        "Seed dibber",
        "Plant allotment and herb seeds using the default tool-belt dibber.",
        { methods: patchMethods },
      ),
      tool(
        "Spade",
        "Harvest allotments, plant saplings and clear patches using the default tool-belt spade.",
        { methods: [...patchMethods, ...treeMethods] },
      ),
      tool(
        "Magic secateurs",
        "Increase the chance of saving harvest lives on herbs and allotments; works on the tool belt, in inventory or wielded.",
        {
          members: true,
          optional: true,
          methods: patchMethods,
          unlocks: [
            "Obtain during A Fairy Tale I - Growing Pains; defeat Tanglefoot before adding to tool belt",
          ],
        },
      ),
    ],
  },
  Hunter: {
    items: [
      tool(
        "Bird snare",
        "Set and reset snares for birds; obtain a free starter snare from Ayleth.",
        { methods: ["crimson-swift", "wagtail"] },
      ),
      tool(
        "Small fishing net",
        "Pair with rope on a young tree for salamanders.",
        { members: true, methods: ["green-salamander", "orange-salamander"] },
      ),
      tool(
        "Rope",
        "Carry one rope per net trap; retrieve and reset after each catch.",
        { members: true, methods: ["green-salamander", "orange-salamander"] },
      ),
      tool("Box trap", "Set box traps for chinchompas.", {
        members: true,
        levels: [{ skill: "Hunter", level: 27 }],
        methods: ["chinchompa"],
      }),
      tool("Marasamaw plant", "Lay plant traps for Anachronia jadinkos.", {
        members: true,
        methods: ["jadinko"],
      }),
      tool(
        "Bronze hatchet",
        "The default tool-belt hatchet gathers arena logs for Big Game Hunter.",
        {
          members: true,
          methods: ["big-game"],
          levels: [{ skill: "Woodcutting", level: 1 }],
        },
      ),
      tool(
        "Knife",
        "Use the default tool-belt knife to fletch arena logs into spears.",
        { members: true, methods: ["big-game"] },
      ),
    ],
  },
  Agility: {
    note: "Courses do not require a tool; avoid unnecessary weight and bring food where falls can hurt.",
    items: [
      tool(
        "Boots of lightness",
        "Optional weight reduction while worn; retrieve them from the Temple of Ikov dungeon.",
        {
          members: true,
          optional: true,
          unlocks: ["Obtain from the Temple of Ikov dungeon"],
        },
      ),
    ],
  },
  Thieving: {
    note: "Pickpocketing needs no tool; safecracking uses a stethoscope and loot bag.",
    items: [
      tool(
        "Stethoscope",
        "Speeds up safecracking; the trainer provides it after the guild quest series.",
        {
          members: true,
          methods: ["safecracking"],
          unlocks: ["Complete A Guild of Our Own"],
        },
      ),
      tool(
        "Small loot bag",
        "Collect safe loot in the bag obtained from the safe-cracking trainer.",
        {
          members: true,
          methods: ["safecracking"],
          unlocks: ["Complete A Guild of Our Own"],
        },
      ),
    ],
  },
  Runecrafting: {
    note: "Runespan supplies its own essence and requires no altar talisman.",
    items: [
      tool(
        "Air talisman",
        "Example altar access item for air runes; use the matching talisman or tiara for another altar.",
        { methods: ["rune-altars"] },
      ),
      tool(
        "Body talisman",
        "Enter the body altar; a body tiara is an alternative.",
        { methods: ["body-runes"] },
      ),
    ],
  },
  Construction: {
    items: [
      tool(
        "Hammer",
        "The default tool-belt hammer works for furniture and flatpacks.",
      ),
      tool(
        "Saw",
        "The default tool-belt saw works for furniture and flatpacks.",
      ),
    ],
  },
  Dungeoneering: {
    note: "Outside equipment cannot enter floors. These melee examples follow your recorded Attack, not Dungeoneering level; make or find them inside and bind useful weapons. Other combat styles are valid.",
    items: [
      ...(
        [
          "Novite",
          "Bathus",
          "Marmaros",
          "Kratonite",
          "Fractite",
          "Zephyrium",
          "Argonite",
          "Katagon",
          "Gorgonite",
          "Promethium",
        ] as const
      ).map((metal, index) => {
        const level = Math.max(1, index * 10);
        return item(
          `${metal} 2h sword`,
          "dungeon weapon",
          "Obtain and bind inside Daemonheim; a random drop is an alternative to crafting.",
          {
            from: level,
            members: index >= 7,
            optional: metal === "Argonite",
            levels: [{ skill: "Attack", level }],
            acquisition: [
              {
                label: "Mine and smith inside",
                members: index >= 6,
                levels: [
                  ...(index ? [{ skill: "Mining" as const, level }] : []),
                  { skill: "Smithing", level: index * 10 + 8 },
                ],
                note: "Mine the matching dungeon ore, smelt four bars and smith the sword inside the floor. Surface primal ores cannot be brought in.",
              },
              {
                label: "Inside-floor finds",
                note:
                  metal === "Argonite"
                    ? "A rare drop from an appropriate forgotten warrior; do not count on finding one in solo floors."
                    : "Look for a suitable monster drop or, for lower tiers, a starting-room weapon; availability is not guaranteed.",
              },
            ],
          },
        );
      }),
    ],
  },
  Divination: {
    note: "Harvest wisps and convert memories without a tool; use a suitable urn only if desired.",
    items: [
      tool(
        "Cracked divination urn",
        "Optional extra XP for memories requiring up to level 10 Divination; prepare an empty urn with a mind rune.",
        { optional: true, methods: ["pale-wisps", "flickering-wisps"] },
      ),
    ],
  },
  Invention: {
    note: "Invention requires its tutorial and 80 Crafting, Smithing and Divination; do not assume equipment is already augmented.",
    items: [
      tool(
        "Inventor's tools",
        "Obtain during the Invention tutorial; added to the tool belt for workbench activities.",
        {
          members: true,
          unlocks: ["Unlock Invention and complete its tutorial"],
        },
      ),
      tool(
        "Bag of materials",
        "Obtain during the tutorial; holds disassembly components on the tool belt.",
        {
          members: true,
          unlocks: ["Unlock Invention and complete its tutorial"],
        },
      ),
      tool(
        "Augmentor",
        "Attach to compatible equipment; weapons require 2 Invention, armour and tools have higher requirements.",
        {
          from: 2,
          members: true,
          levels: [{ skill: "Invention", level: 2 }],
          methods: ["augment-disassemble", "augment-siphon"],
        },
      ),
      tool(
        "Divine charge",
        "Add charges to the charge pack for augmented equipment.",
        {
          from: 4,
          members: true,
          methods: ["augment-disassemble", "augment-siphon"],
        },
      ),
      tool(
        "Equipment siphon",
        "Siphon a levelled augmented item without destroying it; the item must be at least equipment level 4.",
        {
          from: 27,
          members: true,
          levels: [{ skill: "Invention", level: 27 }],
          methods: ["augment-siphon"],
          unlocks: ["Discover equipment siphon blueprint"],
        },
      ),
    ],
  },
  Archaeology: {
    note: "Mattocks can be used from the tool belt or backpack; free Archaeology training stops at level 20. Augmented mattocks cannot be tool-belted.",
    items: [
      ...tools("mattock", "Archaeology"),
      tool(
        "Archaeological soil box",
        "Collect from Ezreal during the tutorial; holds 50 of each soil. Members can buy qualification-gated capacity upgrades.",
        {
          unlocks: ["Progress the Archaeology tutorial to claim the soil box"],
        },
      ),
      item(
        "Dragon mattock",
        "special mattock",
        "Optional augmentable upgrade from Big Game Hunter or ancient caskets.",
        {
          from: 60,
          members: true,
          optional: true,
          levels: [{ skill: "Archaeology", level: 60 }],
        },
      ),
    ],
  },
};
