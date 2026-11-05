import type {
  ItemReference,
  SkillRecord,
  TrainingOption,
  TrainingSite,
} from "./data.ts";
import type { LocationRecord } from "./locations.ts";

// Sources: https://runescape.wiki/w/Free-to-play_Cooking_training and /w/Taverley
// /w/Free-to-play_Woodcutting_training and /w/Fletching (2026 re-tiered levels)
// /w/Free-to-play_Firemaking_training and /w/Free-to-play_Crafting_training
// /w/Unfinished_potions, /w/Potato_patch, /w/Falador_farm and /w/Bird_snare
// /w/Taverley_Hunter_area, /w/Feldip_Hunter_area and /w/Free-to-play
const ARTISAN_BASE = [
  {
    name: "Cooking",
    category: "Artisan",
    icon: "Cooking-icon.png",
    goal: 99,
    description:
      "Cook your catch into food; the required Cooking level and the level needed to catch it are not always the same.",
    payoff: "Prepare food for combat and quests.",
    wiki: "Cooking",
    trainingWiki: "Free-to-play Cooking training",
    membersNote:
      "Cooking is available throughout free play; members have additional foods and training spots.",
  },
  {
    name: "Woodcutting",
    category: "Gathering",
    icon: "Woodcutting-icon.png",
    goal: 110,
    description:
      "Cut trees for materials used in Firemaking and Fletching; current tree tiers differ from older guides.",
    payoff: "Supply logs and unlock higher-tier trees.",
    wiki: "Woodcutting",
    trainingWiki: "Free-to-play Woodcutting training",
    membersNote:
      "Free players can train to 110 with yews or other accessible trees, but cannot cut magic or eternal magic trees.",
  },
  {
    name: "Fletching",
    category: "Artisan",
    icon: "Fletching-icon.png",
    goal: 110,
    description:
      "Shape logs into bows and prepare ammunition; Fletching is a full free-to-play skill.",
    payoff: "Make ranged weapons and ammunition from gathered materials.",
    wiki: "Fletching",
    trainingWiki: "Free-to-play Fletching training",
    membersNote:
      "Free players can train to 110 using acadia bows, but yew and higher bows are members-only and late progression is slower.",
  },
  {
    name: "Firemaking",
    category: "Artisan",
    icon: "Firemaking-icon.png",
    goal: 110,
    description:
      "Light fires or feed a bonfire with logs gathered through Woodcutting.",
    payoff: "Make cooking fires and unlock higher-tier burning materials.",
    wiki: "Firemaking",
    trainingWiki: "Free-to-play Firemaking training",
    membersNote:
      "Free players can burn self-cut yews through 110; members can gather magic and eternal magic logs.",
  },
  {
    name: "Crafting",
    category: "Artisan",
    icon: "Crafting-icon.png",
    goal: 110,
    description: "Turn fibres and gems into useful materials and jewellery.",
    payoff: "Produce bowstrings and cut gems for other skills.",
    wiki: "Crafting",
    trainingWiki: "Free-to-play Crafting training",
    membersNote:
      "Crafting reaches 110 in free play, but gathering and cutting gems for the final levels takes considerable time.",
  },
  {
    name: "Herblore",
    category: "Artisan",
    icon: "Herblore-icon.png",
    goal: 120,
    freeToPlayCap: 5,
    description:
      "Combine herbs and secondary ingredients into potions. The free trial stops at level 5.",
    payoff: "Make practical combat and utility potions.",
    wiki: "Herblore",
    trainingWiki: "Herblore training",
    membersNote:
      "Members can train beyond level 5. Druidic Ritual is optional for these basic recipes, not a prerequisite.",
  },
  {
    name: "Farming",
    category: "Gathering",
    icon: "Farming-icon.png",
    goal: 120,
    freeToPlayCap: 5,
    description:
      "Plant crops, leave them to grow, and return to harvest. Free players can try Farming to level 5.",
    payoff: "Grow produce and ingredients while doing other activities.",
    wiki: "Farming",
    trainingWiki: "Farming training",
    membersNote:
      "Membership permits experience beyond level 5 and opens normal crop progression.",
  },
  {
    name: "Hunter",
    category: "Gathering",
    icon: "Hunter-icon.png",
    goal: 110,
    freeToPlayCap: 5,
    description:
      "Set and tend traps to catch creatures; the free Hunter trial reaches level 5.",
    payoff: "Gather hunting products and unlock new creatures.",
    wiki: "Hunter",
    trainingWiki: "Hunter training",
    membersNote:
      "Membership permits training beyond level 5 and access to further hunting areas.",
  },
] satisfies Omit<SkillRecord, "stages" | "maxLevel">[];

// Ranges are half-open, except that the final range includes the skill cap.
// Coordinates from the linked Wiki NPC/ObjectLocLine entries, not town centres.
const site = (
  label: string,
  wiki: string,
  x: number,
  y: number,
  access?: string,
  image?: string,
) => ({ label, wiki, map: { x, y, plane: 0 as const }, access, image });
const cookingRange = site(
  "Lumbridge Castle cooking range",
  "Cooking range (Lumbridge Castle)",
  3212,
  3215,
  "Cook's Assistant",
);
const optionSites: Record<string, TrainingSite[]> = {
  trees: [
    site(
      "Varrock dying trees",
      "Dying tree",
      3219,
      3373,
      undefined,
      "Dying_tree.png",
    ),
  ],
  crayfish: [cookingRange],
  trout: [cookingRange],
  lobster: [cookingRange],
  monkfish: [cookingRange],
  shark: [cookingRange],
  swordfish: [cookingRange],
  acadia: [
    site(
      "Free-play acadia west of Het's Oasis",
      "Acadia tree",
      3309,
      3247,
      "50 Woodcutting; free-play accessible",
      "Acadia_tree.png",
    ),
  ],
  harps: [
    site(
      "Ithell harmonium harps",
      "Harp",
      2132,
      3338,
      "Members; Plague's End; 75 Construction to tune",
    ),
  ],
  "oak-tree": [
    site("Taverley tree patch", "Tree patch", 2885, 3463, "Members"),
  ],
  "maple-tree": [
    site("Taverley tree patch", "Tree patch", 2885, 3463, "Members"),
  ],
  "herb-run": [site("Falador herb patch", "Herb patch", 3058, 3311, "Members")],
  "vulnerability-bomb": [
    site(
      "Anachronia Dinosaur Farm rexes",
      "Corbicula rex (player-owned farm)",
      3646,
      4294,
      "Members; raise rexes to collect bottled dinosaur roar",
      "Corbicula_rex_(player-owned_farm).png",
    ),
  ],
  "sorcery-powerburst": [
    site(
      "Anachronia Dinosaur Farm apoterrasaurs",
      "Arcane apoterrasaur (player-owned farm)",
      3646,
      4294,
      "Members; raise apoterrasaurs to collect beak snot",
      "Arcane_apoterrasaur_(player-owned_farm).png",
    ),
  ],
  allotment: [
    site(
      "Harmony Island allotment",
      "Allotment patch",
      3794,
      2835,
      "Members; The Great Brain Robbery",
    ),
  ],
  "player-farm": [
    site(
      "Manor Farm",
      "Manor Farm",
      2654,
      3361,
      "Members; 17 Farming, 20 Construction and farm tutorial",
    ),
  ],
  "dinosaur-farm": [
    site(
      "Anachronia Dinosaur Farm",
      "Anachronia Dinosaur Farm",
      3646,
      4294,
      "Members; access to Anachronia and suitable pens",
    ),
  ],
  "potion-flasks": [
    site(
      "Oo'glog red sandstone",
      "Red sandstone (rock)",
      2585,
      2874,
      "Members; 81 Mining",
      "Red_sandstone_(rock,_full).png",
    ),
  ],
  "crystal-flasks": [
    site(
      "Ithell crystal-flecked sandstone",
      "Crystal-flecked sandstone",
      2144,
      3354,
      "Members; Plague's End; 81 Mining",
      "Crystal-flecked_sandstone_(rock,_full).png",
    ),
  ],
  willow: [
    site("Draynor willows", "Willow", 3082, 3238, undefined, "Willow_tree.png"),
  ],
  maple: [
    site(
      "Gower farm maples",
      "Maple Tree",
      3248,
      3362,
      undefined,
      "Maple_tree.png",
    ),
  ],
  yew: [site("Rimmington yews", "Yew", 2925, 3228, undefined, "Yew.png")],
  oak: [site("Rimmington oaks", "Oak", 2925, 3234, undefined, "Oak_tree.png")],
  magic: [
    site(
      "Ranging Guild magic trees",
      "Magic tree",
      2690,
      3427,
      "Members",
      "Magic_tree.png",
    ),
  ],
  "eternal-magic": [
    site(
      "Piscatoris eternal magic trees",
      "Eternal magic tree",
      2325,
      3583,
      "Members",
      "Eternal_magic_tree.png",
    ),
  ],
  flax: [
    site("Burthorpe spinning wheel", "Spinning wheel", 2882, 3495),
    site("Taverley flax", "Flax", 2881, 3471, undefined, "Flax.png"),
  ],
  potatoes: [
    site(
      "Taverley potato patch",
      "Potato patch",
      2890,
      3467,
      undefined,
      "Potato_patch_(clean).png",
    ),
  ],
  "crimson-swift": [
    site(
      "Taverley crimson swifts",
      "Crimson swift",
      2922,
      3504,
      undefined,
      "Crimson_swift.png",
    ),
  ],
  wagtail: [
    site(
      "Feldip tropical wagtails",
      "Tropical wagtail",
      2510,
      2876,
      "Members",
      "Tropical_wagtail.png",
    ),
  ],
  chinchompa: [
    site(
      "Feldip carnivorous chinchompas",
      "Carnivorous chinchompa",
      2496,
      2880,
      "Members",
      "Carnivorous_chinchompa.png",
    ),
  ],
  jadinko: [
    site(
      "East Anachronia common jadinkos",
      "Common jadinko",
      4160,
      4309,
      "Members; access to Anachronia",
      "Common_jadinko.png",
    ),
  ],
  "green-salamander": [
    site(
      "Canifis green salamanders",
      "Green salamander (Hunter)",
      3532,
      3446,
      "Members; access to Canifis",
    ),
  ],
  "orange-salamander": [
    site(
      "Uzer orange salamanders",
      "Orange salamander (Hunter)",
      3402,
      3134,
      "Members; desert heat protection",
    ),
  ],
  "big-game": [
    site(
      "Arcane apoterrasaur hunting area",
      "Arcane apoterrasaur",
      3802,
      4256,
      "Members; 75 Hunter, 55 Slayer and raw shark",
    ),
  ],
};
const portableLocation =
  "Prepare this at any suitable accessible bank or open space; no fixed resource node is required.";
const option = (
  id: string,
  title: string,
  wiki: string,
  image: string,
  location: string,
  method: string,
  benefit: string,
  requirements: string[] = [],
  members = false,
  supplies: string[] = [],
  risks?: string,
  locationNote?: string,
): TrainingOption => ({
  id,
  title,
  wiki,
  image,
  locations: [location],
  method,
  benefit,
  requirements,
  members,
  supplies,
  risks,
  sites: optionSites[id] ?? [],
  locationNote,
});

const stage = (
  from: number,
  to: number,
  title: string,
  options: TrainingOption[],
  members = false,
) => ({
  from,
  to,
  title,
  options,
  members,
  supplies: [] as string[],
});

const cook = (id: string, fish: string, level: number, fishing: string) =>
  option(
    id,
    `Cook ${fish}`,
    `Raw ${fish}`,
    `Raw_${fish}.png`,
    "Lumbridge Castle",
    `Cook Raw ${fish} on a player-lit fire, or use the castle range after Cook's Assistant. Bank the successful fish.`,
    "Keep the cooked fish for combat; higher Cooking reduces burns.",
    [`${level} Cooking`, fishing],
    false,
    [`Raw ${fish}`, "Logs and Tinderbox if making your own fire"],
    "Raw fish can burn.",
    "A player-lit fire has no fixed position; the map marks the optional castle range.",
  );
const tree = (
  id: string,
  title: string,
  wiki: string,
  image: string,
  location: string,
  level: number,
  members = false,
) =>
  option(
    id,
    title,
    wiki,
    optionSites[id]?.[0]?.image ?? image,
    location,
    "Cut the trees and bank the logs for later processing.",
    "Banked logs support Fletching or Firemaking rather than being dropped.",
    [`${level} Woodcutting`],
    members,
    ["Hatchet"],
  );
const bow = (
  id: string,
  title: string,
  wiki: string,
  image: string,
  logs: string,
  level: number,
  members = false,
) =>
  option(
    id,
    title,
    wiki,
    image,
    "Lumbridge Castle",
    `Use a Knife on ${logs}, then add Bowstring to the unstrung bows.`,
    "Cutting and stringing each grant experience; the finished bows can be used or converted to coins.",
    [`${level} Fletching`],
    members,
    [logs, "Knife", "Bowstring"],
    undefined,
    portableLocation,
  );
const fire = (id: string, logs: string, level: number, members = false) =>
  option(
    id,
    `Burn ${logs}`,
    logs,
    `${logs.replaceAll(" ", "_")}.png`,
    "Lumbridge",
    `Add ${logs} to a bonfire near the bank.`,
    "Turn Woodcutting harvests into Firemaking experience and a fire for cooking.",
    [`${level} Firemaking`],
    members,
    [logs, "Tinderbox"],
    undefined,
    portableLocation,
  );
const gem = (id: string, gemName: string, level: number) =>
  option(
    id,
    `Cut ${gemName}`,
    `Uncut ${gemName}`,
    `Uncut_${gemName}.png`,
    "Lumbridge Castle",
    `Use a Chisel on Uncut ${gemName} at a bank. Gather gems from suitable rocks or combat drops; the mine and gem tier have separate unlock requirements.`,
    "Save cut gems for jewellery; gathering them yourself can also train Mining.",
    [
      `${level} Crafting`,
      ...(gemName === "diamond"
        ? [
            "F2P self-mined diamonds require 43 Mining and 75 Dungeoneering for the Al Kharid resource dungeon; otherwise use saved drops or a lower-tier gem",
          ]
        : []),
    ],
    false,
    [`Uncut ${gemName}`, "Chisel"],
    undefined,
    portableLocation,
  );
const potion = (
  id: string,
  title: string,
  wiki: string,
  image: string,
  method: string,
  benefit: string,
  level: number,
  supplies: string[],
) =>
  option(
    id,
    title,
    wiki,
    image,
    "Taverley",
    method,
    benefit,
    [`${level} Herblore`, "Members"],
    true,
    supplies,
    undefined,
    optionSites[id]
      ? "Mix potions at a bank; the map shows a source of ingredients, not a required mixing station."
      : portableLocation,
  );
const farm = (
  id: string,
  title: string,
  wiki: string,
  image: string,
  location: string,
  method: string,
  benefit: string,
  requirements: string[],
) =>
  option(id, title, wiki, image, location, method, benefit, requirements, true);
const hunt = (
  id: string,
  title: string,
  wiki: string,
  image: string,
  location: string,
  method: string,
  benefit: string,
  requirements: string[],
  supplies: string[],
  risks?: string,
) =>
  option(
    id,
    title,
    wiki,
    optionSites[id]?.[0]?.image ?? image,
    location,
    method,
    benefit,
    requirements,
    true,
    supplies,
    risks,
  );

const trout = cook("trout", "trout", 15, "20 Fishing to catch trout");
const lobster = cook("lobster", "lobster", 40, "40 Fishing to catch lobster");
const swordfish = cook(
  "swordfish",
  "swordfish",
  45,
  "50 Fishing to catch swordfish",
);
const willow = tree(
  "willow",
  "Draynor willows",
  "Willow",
  "Willow_logs.png",
  "Draynor Village",
  20,
);
const maple = tree(
  "maple",
  "Varrock maples",
  "Maple tree",
  "Maple_logs.png",
  "Varrock",
  40,
);
const yew = tree(
  "yew",
  "Rimmington yews",
  "Yew",
  "Yew_logs.png",
  "Rimmington",
  70,
);
const mapleBow = bow(
  "maple-shortbow",
  "Maple shortbows",
  "Maple shortbow",
  "Maple_shortbow.png",
  "Maple logs",
  40,
);
const yewFire = fire("yew-bonfire", "Yew logs", 60);
const diamond = gem("diamond", "diamond", 43);
const antipoison = potion(
  "antipoison",
  "Antipoison",
  "Antipoison",
  "Antipoison_(3).png",
  "Combine Clean marrentill and Vial of water, then add Unicorn horn dust.",
  "Useful poison protection while building Herblore.",
  13,
  ["Clean marrentill", "Vial of water", "Unicorn horn dust"],
);
const overload = potion(
  "overload",
  "Overloads",
  "Overload",
  "Overload_(3).png",
  "Combine three-dose Extreme attack, Extreme strength, Extreme defence, Extreme ranging, Extreme magic and Extreme necromancy with one Clean torstol. Prepare all six component potions before mixing.",
  "Overloads provide all combat-style boosts and remain useful throughout boss progression.",
  96,
  [
    "Extreme attack (3 doses)",
    "Extreme strength (3 doses)",
    "Extreme defence (3 doses)",
    "Extreme ranging (3 doses)",
    "Extreme magic (3 doses)",
    "Extreme necromancy (3 doses)",
    "Clean torstol",
  ],
);
const treeRun = (
  id: string,
  sapling: string,
  level: number,
): TrainingOption => ({
  ...farm(
    id,
    sapling.replace("sapling", "tree") + " runs",
    sapling,
    sapling.replaceAll(" ", "_") + ".png",
    "Taverley tree patch",
    `Plant a ${sapling} in a tree patch, return to check its health and replant. Use other unlocked tree patches on the same run.`,
    "Periodic tree checks complement herb runs and farm animals. Use saplings you can replace; keep lower-tier runs if rare seeds are scarce.",
    [`${level} Farming`, "Members"],
  ),
  supplies: [sapling, "Spade", "Compost"],
  sites: optionSites["oak-tree"].map((entry) => ({
    ...entry,
    image: sapling.replaceAll(" ", "_") + ".png",
  })),
});
const oakFarm = treeRun("oak-tree", "Oak sapling", 15);
const willowFarm = treeRun("willow-tree", "Willow sapling", 30);
const mapleFarm = treeRun("maple-tree", "Maple sapling", 45);
const yewFarm = treeRun("yew-tree", "Yew sapling", 60);
const magicFarm = treeRun("magic-tree-farming", "Magic sapling", 75);
const playerFarm = farm(
  "player-farm",
  "Player-owned farm",
  "Player-owned farm",
  "Manor_Farm.png",
  "Manor Farm",
  "Complete the farm tutorial, raise and feed animals in pens, then check their growth and sell suitable animals for beans.",
  "Animals give periodic Farming experience and beans alongside crop runs.",
  ["17 Farming", "20 Construction", "Members"],
);
const herbFarm = farm(
  "herb-run",
  "Herb and allotment runs",
  "Herb patch",
  "Clean_guam.png",
  "Falador farm",
  "Plant herb seeds in the herb patch and allotment seeds in the nearby allotments; compost, return after growth, harvest and replant.",
  "Harvests supply Herblore and food; rotate patches and use seeds earned from gameplay.",
  ["Members", "9 Farming for guam"],
);
const wagtail = hunt(
  "wagtail",
  "Tropical wagtails",
  "Tropical wagtail",
  "Bird_snare.png",
  "Feldip Hunter area",
  "Set and tend Bird snare traps near the birds; collect catches and reset sprung traps.",
  "Gather feathers and raw bird meat while progressing Hunter.",
  ["19 Hunter", "Members"],
  ["Bird snare"],
);
const jadinko = hunt(
  "jadinko",
  "Anachronia jadinkos",
  "Jadinkos",
  "Common_jadinko.png",
  "Anachronia",
  "Set Marasamaw plant traps near common jadinkos. Collect catches and reset traps.",
  "Gather vines, seeds and possible farm animals; rarer types have additional potion requirements.",
  ["80 Hunter", "Members", "Access to Anachronia"],
  ["Marasamaw plant"],
);

const ARTISAN_STAGES = [
  [
    stage(1, 15, "Starter catch", [
      cook("crayfish", "crayfish", 1, "1 Fishing to catch crayfish"),
    ]),
    stage(15, 40, "River fish", [trout]),
    stage(40, 45, "Cook lobsters", [lobster]),
    stage(45, 62, "Swordfish and lobsters", [swordfish, lobster]),
    stage(62, 80, "Monkfish and free-play food", [
      swordfish,
      lobster,
      option(
        "monkfish",
        "Cook monkfish",
        "Raw monkfish",
        "Raw_monkfish.png",
        "Lumbridge Castle",
        "Cook Raw monkfish on the castle range and bank the successful fish.",
        "A useful self-caught food upgrade.",
        [
          "62 Cooking",
          "62 Fishing and Swan Song to catch monkfish",
          "Cook's Assistant",
        ],
        true,
        ["Raw monkfish"],
      ),
    ]),
    stage(80, 99, "High-level food", [
      swordfish,
      lobster,
      option(
        "shark",
        "Cook sharks",
        "Raw shark",
        "Raw_shark.png",
        "Lumbridge Castle",
        "Cook Raw shark on the castle range; bank successful catches.",
        "Sharks make stronger combat food; obtain them through Fishing.",
        [
          "80 Cooking",
          "76 Fishing to catch sharks",
          "Cook's Assistant",
          "Members",
        ],
        true,
        ["Raw shark"],
        "Burns remain possible.",
      ),
    ]),
  ],
  [
    stage(1, 10, "Regular logs", [
      tree(
        "trees",
        "Varrock dying trees",
        "Dying tree",
        "Dying_tree.png",
        "Varrock",
        1,
      ),
    ]),
    stage(10, 20, "Oak trees", [
      tree(
        "oak",
        "Rimmington oak trees",
        "Oak",
        "Oak_tree.png",
        "Rimmington",
        10,
      ),
    ]),
    stage(20, 40, "Willow trees", [willow]),
    stage(40, 50, "Maple and willow", [maple, willow]),
    stage(50, 70, "Acadia and maple", [
      tree(
        "acadia",
        "Het's Oasis acadia trees",
        "Acadia tree",
        "Acadia_tree.png",
        "Het's Oasis",
        50,
      ),
      maple,
    ]),
    stage(70, 80, "Yew and maple", [yew, maple]),
    stage(80, 100, "Yew or magic", [
      yew,
      tree(
        "magic",
        "Magic trees",
        "Magic tree",
        "Magic_tree.png",
        "Seers' Village",
        80,
        true,
      ),
    ]),
    stage(100, 110, "Eternal magic or yew", [
      yew,
      tree(
        "eternal-magic",
        "Eternal magic trees",
        "Eternal magic tree",
        "Eternal_magic_logs.png",
        "Eternal magic grove",
        100,
        true,
      ),
    ]),
  ],
  [
    stage(1, 10, "Shafts", [
      option(
        "shafts",
        "Arrow shafts",
        "Shaft",
        "Shaft_5.png",
        "Lumbridge Castle",
        "Cut Logs into Shaft with a Knife; add feathers for headless shafts.",
        "Prepare ammunition from trees and feathers gathered yourself.",
        ["1 Fletching"],
        false,
        ["Logs", "Knife"],
        undefined,
        portableLocation,
      ),
    ]),
    stage(10, 20, "Oak bows", [
      bow(
        "oak-shortbow",
        "Oak shortbows",
        "Oak shortbow",
        "Oak_shortbow.png",
        "Oak logs",
        10,
      ),
    ]),
    stage(20, 40, "Willow bows", [
      bow(
        "willow-shortbow",
        "Willow shortbows",
        "Willow shortbow",
        "Willow_shortbow.png",
        "Willow logs",
        20,
      ),
    ]),
    stage(40, 50, "Maple bows", [mapleBow]),
    stage(50, 70, "Acadia bows", [
      bow(
        "acadia-shortbow",
        "Acadia shortbows",
        "Acadia shortbow",
        "Acadia_shortbow.png",
        "Acadia logs",
        50,
      ),
      mapleBow,
    ]),
    stage(70, 100, "Acadia or yew bows", [
      bow(
        "acadia-shortbow",
        "Acadia shortbows",
        "Acadia shortbow",
        "Acadia_shortbow.png",
        "Acadia logs",
        50,
      ),
      bow(
        "yew-shortbow",
        "Yew shortbows",
        "Yew shortbow",
        "Yew_shortbow.png",
        "Yew logs",
        70,
        true,
      ),
    ]),
    stage(100, 110, "Eternal magic or acadia", [
      bow(
        "acadia-shortbow",
        "Acadia shortbows",
        "Acadia shortbow",
        "Acadia_shortbow.png",
        "Acadia logs",
        50,
      ),
      bow(
        "eternal-shortbow",
        "Eternal magic shortbows",
        "Eternal magic shortbow",
        "Eternal_magic_shortbow.png",
        "Eternal magic logs",
        100,
        true,
      ),
    ]),
  ],
  [
    stage(1, 15, "Regular logs", [fire("logs-bonfire", "Logs", 1)]),
    stage(15, 30, "Oak logs", [fire("oak-bonfire", "Oak logs", 15)]),
    stage(30, 45, "Willow logs", [fire("willow-bonfire", "Willow logs", 30)]),
    stage(45, 60, "Maple logs", [fire("maple-bonfire", "Maple logs", 45)]),
    stage(60, 75, "Yew logs", [yewFire]),
    stage(75, 100, "Yew or magic", [
      yewFire,
      fire("magic-bonfire", "Magic logs", 75, true),
    ]),
    stage(100, 110, "Eternal magic or yew", [
      yewFire,
      fire("eternal-bonfire", "Eternal magic logs", 100, true),
    ]),
  ],
  [
    stage(1, 20, "Spin flax", [
      option(
        "flax",
        "Spin bowstrings",
        "Bowstring",
        "Bowstring.png",
        "Lumbridge Castle",
        "Pick Flax in Taverley and spin it at the Burthorpe wheel.",
        "Bowstring supplies your own Fletching.",
        ["1 Crafting"],
        false,
        ["Flax"],
      ),
    ]),
    stage(20, 27, "Sapphires", [gem("sapphire", "sapphire", 20)]),
    stage(27, 34, "Emeralds", [gem("emerald", "emerald", 27)]),
    stage(34, 43, "Rubies", [gem("ruby", "ruby", 34)]),
    stage(43, 80, "Diamonds", [diamond, gem("emerald", "emerald", 27)]),
    stage(80, 89, "Gems or harmonic dust", [
      diamond,
      gem("emerald", "emerald", 27),
      option(
        "harps",
        "Ithell harps",
        "Harp",
        "Harp.png",
        "Ithell harps",
        "Play and retune the harps in the Ithell district.",
        "Earn harmonic dust for crystal equipment without consuming gems.",
        ["75 Crafting", "75 Construction to tune", "Plague's End", "Members"],
        true,
      ),
    ]),
    stage(89, 110, "Potion flasks and gems", [
      diamond,
      gem("emerald", "emerald", 27),
      option(
        "potion-flasks",
        "Potion flasks",
        "Potion flask",
        "Potion_flask.png",
        "Lumbridge Castle",
        "Mine Red sandstone, process it with the robust glass machine, then use a Glassblowing pipe on the Robust glass.",
        "Create six-dose containers for your own potions; flasks break when emptied.",
        ["89 Crafting", "81 Mining", "As a First Resort", "Members"],
        true,
        ["Red sandstone", "Robust glass", "Glassblowing pipe"],
      ),
      option(
        "crystal-flasks",
        "Crystal flasks",
        "Crystal flask",
        "Crystal_flask.png",
        "Lumbridge Castle",
        "Mine crystal-flecked sandstone and process it at a robust glass machine, then blow the Crystal glass into flasks.",
        "Supply combination potion recipes, including supreme overloads.",
        [
          "89 Crafting",
          "81 Mining",
          "Plague's End",
          "As a First Resort",
          "Members",
        ],
        true,
        ["Crystal glass", "Glassblowing pipe"],
      ),
    ]),
  ],
  [
    stage(1, 5, "Trial potions", [
      option(
        "attack-potion",
        "Attack potions",
        "Attack potion",
        "Attack_potion_(3).png",
        "Taverley",
        "Combine Clean guam with Vial of water, then add Eye of newt. Jatix gives a starter sample.",
        "Make useful early combat boosts.",
        ["1 Herblore"],
        false,
        ["Clean guam", "Vial of water", "Eye of newt"],
        undefined,
        portableLocation,
      ),
    ]),
    stage(
      5,
      13,
      "Basic potions",
      [
        potion(
          "attack-potion",
          "Attack potions",
          "Attack potion",
          "Attack_potion_(3).png",
          "Combine Clean guam, Vial of water and Eye of newt.",
          "Use the potions for early combat.",
          1,
          ["Clean guam", "Vial of water", "Eye of newt"],
        ),
      ],
      true,
    ),
    stage(13, 38, "Antipoison", [antipoison], true),
    stage(
      38,
      63,
      "Prayer potions",
      [
        antipoison,
        potion(
          "prayer-potion",
          "Prayer potions",
          "Prayer potion",
          "Prayer_potion_(3).png",
          "Combine clean ranarr and Vial of water, then add snape grass.",
          "Restore Prayer for combat; grow ranarr and collect the secondary.",
          38,
          ["Clean ranarr", "Vial of water", "Snape grass"],
        ),
      ],
      true,
    ),
    stage(
      63,
      88,
      "Super restores",
      [
        potion(
          "super-restore",
          "Super restores",
          "Super restore",
          "Super_restore_(3).png",
          "Combine clean snapdragon and Vial of water, then add red spiders' eggs.",
          "Restores Prayer and drained stats; keep supplies from herb runs and combat.",
          63,
          ["Clean snapdragon", "Vial of water", "Red spiders' eggs"],
        ),
      ],
      true,
    ),
    stage(
      88,
      96,
      "Extreme potions",
      [
        potion(
          "extreme-attack",
          "Extreme attack",
          "Extreme attack",
          "Extreme_attack_(3).png",
          "Combine a three-dose super attack potion with clean avantoe.",
          "Save these components for overloads rather than consuming every potion.",
          88,
          ["Super attack (3 doses)", "Clean avantoe"],
        ),
      ],
      true,
    ),
    stage(96, 98, "Overloads", [overload], true),
    stage(
      98,
      103,
      "Supreme overloads",
      [
        overload,
        potion(
          "supreme-overload",
          "Supreme overload potions",
          "Supreme overload potion",
          "Supreme_overload_potion_(6).png",
          "Combine a four-dose Overload and four-dose Super attack, Super strength, Super defence, Super ranging potion, Super magic potion and Super necromancy in a Crystal flask after unlocking the recipe.",
          "Upgrade overloads for stronger combat boosts; make crystal flasks from crystal glass.",
          98,
          [
            "Overload",
            "Super attack",
            "Super strength",
            "Super defence",
            "Super ranging potion",
            "Super magic potion",
            "Super necromancy",
            "Crystal flask",
          ],
        ),
      ],
      true,
    ),
    stage(
      103,
      106,
      "Vulnerability bombs",
      [
        overload,
        potion(
          "vulnerability-bomb",
          "Vulnerability bombs",
          "Vulnerability bomb",
          "Vulnerability_bomb.png",
          "For each bomb, combine one Primal extract, five Soul runes, five Chaos runes, two Bottled dinosaur roars and one Clean dwarf weed in one Bomb vial.",
          "Stock area vulnerability for bosses; gather fruit for primal extract and dinosaur roars on Anachronia.",
          103,
          [
            "Primal extract",
            "5 Soul runes",
            "5 Chaos runes",
            "2 Bottled dinosaur roars",
            "Clean dwarf weed",
            "Bomb vial",
          ],
        ),
      ],
      true,
    ),
    stage(
      106,
      109,
      "Elder overloads",
      [
        overload,
        potion(
          "elder-overload",
          "Elder overload potions",
          "Elder overload potion",
          "Elder_overload_potion_(6).png",
          "Combine a six-dose Supreme overload potion with Clean fellstalk and Primal extract after unlocking the recipe.",
          "Upgrade saved supreme overloads for endgame combat.",
          106,
          ["Supreme overload potion", "Clean fellstalk", "Primal extract"],
        ),
      ],
      true,
    ),
    stage(
      109,
      120,
      "Elder overloads and powerbursts",
      [
        overload,
        potion(
          "elder-overload",
          "Elder overload potions",
          "Elder overload potion",
          "Elder_overload_potion_(6).png",
          "Combine a six-dose Supreme overload potion with Clean fellstalk and Primal extract after unlocking the recipe.",
          "Upgrade saved supreme overloads for endgame combat.",
          106,
          ["Supreme overload potion", "Clean fellstalk", "Primal extract"],
        ),
        potion(
          "sorcery-powerburst",
          "Powerbursts of sorcery",
          "Powerburst of sorcery",
          "Powerburst_of_sorcery_(4).png",
          "Combine Primal extract, a four-dose Super runecrafting potion, Blood runes and Beak snot in a Powerburst vial.",
          "Save these for Runecrafting; grow primal fruit and collect beak snot from apoterrasaurs raised at the dinosaur farm.",
          109,
          [
            "Primal extract",
            "Super runecrafting potion",
            "Blood rune",
            "Beak snot",
            "Powerburst vial",
          ],
        ),
      ],
      true,
    ),
  ],
  [
    stage(1, 5, "Trial potatoes", [
      option(
        "potatoes",
        "Taverley potatoes",
        "Potato patch",
        "Potato_seed_5.png",
        "Taverley potato patch",
        "Rake the patch, plant three Potato seeds and return to harvest. Farmer Jones protects this tutorial patch for free.",
        "Harvest potatoes for food; the free trial ends at level 5.",
        ["1 Farming"],
        false,
        ["Rake", "Potato seed"],
      ),
    ]),
    stage(
      5,
      15,
      "Potatoes and allotments",
      [
        farm(
          "potatoes",
          "Taverley potatoes",
          "Potato patch",
          "Potato_seed_5.png",
          "Taverley potato patch",
          "Plant Potato seed in the patch and return to harvest; Farmer Jones protects it for free.",
          "Continue gathering food while unlocking tree farming.",
          ["1 Farming", "Members"],
        ),
        farm(
          "allotment",
          "Harmony Island allotment",
          "Allotment patch",
          "Potato_seed_5.png",
          "Harmony Island",
          "Rake and plant Potato seed in the Harmony Island allotment; compost and harvest when grown.",
          "Use an additional allotment if the quest is complete.",
          ["1 Farming", "The Great Brain Robbery", "Members"],
        ),
      ],
      true,
    ),
    stage(15, 17, "First tree", [oakFarm, herbFarm], true),
    stage(
      17,
      30,
      "Trees, herbs and farm animals",
      [oakFarm, herbFarm, playerFarm],
      true,
    ),
    stage(
      30,
      45,
      "Willow tree runs",
      [willowFarm, oakFarm, herbFarm, playerFarm],
      true,
    ),
    stage(
      45,
      60,
      "Maple tree runs",
      [mapleFarm, willowFarm, herbFarm, playerFarm],
      true,
    ),
    stage(
      60,
      75,
      "Yew tree runs",
      [yewFarm, mapleFarm, herbFarm, playerFarm],
      true,
    ),
    stage(
      75,
      99,
      "Magic trees and farm animals",
      [magicFarm, yewFarm, herbFarm, playerFarm],
      true,
    ),
    stage(
      99,
      120,
      "Farm and herb runs",
      [
        magicFarm,
        herbFarm,
        farm(
          "dinosaur-farm",
          "Anachronia Dinosaur Farm",
          "Anachronia Dinosaur Farm",
          "Ranch_Out_of_Time.png",
          "Anachronia",
          "Raise eligible animals in pens, supply their food and check their growth; continue ordinary herb and tree runs between checks.",
          "High-level animals and produce support long-term Farming and Herblore.",
          [
            "Members",
            "Player-owned farm tutorial",
            "45–90 Construction for pens",
            "Access to Anachronia",
          ],
        ),
      ],
      true,
    ),
  ],
  [
    stage(1, 5, "Trial birds", [
      option(
        "crimson-swift",
        "Crimson swifts",
        "Crimson swift",
        "Crimson_swift.png",
        "Taverley Hunter area",
        "Get a Bird snare from Ayleth, set it near crimson swifts and check and reset it.",
        "Collect feathers and bird meat; free Hunter experience stops at level 5.",
        ["1 Hunter"],
        false,
        ["Bird snare"],
      ),
    ]),
    stage(
      5,
      19,
      "Bird snares",
      [
        hunt(
          "crimson-swift",
          "Crimson swifts",
          "Crimson swift",
          "Crimson_swift.png",
          "Taverley Hunter area",
          "Set Bird snare traps near the swifts, check catches and reset traps.",
          "Save feathers and meat for other skills.",
          ["1 Hunter", "Members"],
          ["Bird snare"],
        ),
      ],
      true,
    ),
    stage(19, 29, "Tropical wagtails", [wagtail], true),
    stage(
      29,
      47,
      "Green salamanders",
      [
        wagtail,
        hunt(
          "green-salamander",
          "Green salamanders",
          "Green salamander (Hunter)",
          "Green_salamander_(Hunter).png",
          "Canifis Hunter area",
          "Set a Small fishing net and Rope on young trees in the Canifis Hunter area, then collect and reset the traps.",
          "A net-trapping alternative to birds; catches become ranged weapons.",
          ["29 Hunter", "Members", "Access to Canifis"],
          ["Small fishing net", "Rope"],
        ),
      ],
      true,
    ),
    stage(
      47,
      63,
      "Orange salamanders",
      [
        wagtail,
        hunt(
          "orange-salamander",
          "Orange salamanders",
          "Orange salamander (Hunter)",
          "Orange_salamander_(Hunter).png",
          "Uzer Hunter area",
          "Set a Small fishing net and Rope on young trees in the Uzer Hunter area; collect and reset the traps.",
          "A higher-level net-trapping alternative; bring desert heat protection.",
          ["47 Hunter", "Members"],
          ["Small fishing net", "Rope"],
          "Desert heat causes damage without water or equivalent protection.",
        ),
      ],
      true,
    ),
    stage(
      63,
      80,
      "Chinchompas",
      [
        wagtail,
        hunt(
          "chinchompa",
          "Carnivorous chinchompas",
          "Carnivorous chinchompa",
          "Box_trap.png",
          "Feldip Hunter area",
          "Place Box trap traps near the chinchompas; collect catches and reset failed traps.",
          "Chinchompas are stackable ranged ammunition useful for multi-target combat.",
          ["63 Hunter", "Members"],
          ["Box trap"],
        ),
      ],
      true,
    ),
    stage(
      80,
      110,
      "Jadinkos, dinosaurs and chinchompas",
      [
        jadinko,
        hunt(
          "big-game",
          "Arcane apoterrasaur",
          "Arcane apoterrasaur",
          "Arcane_apoterrasaur.png",
          "Anachronia",
          "Gather jungle logs and vines in the arena, fletch the logs into wooden spears and dip them in the arena's poison frogs. Build the scorpions and pressure plate, load poisoned wooden spears into the scorpions, then bait the plate with Raw shark. Avoid the dinosaur's detection area.",
          "Earn dinosaur materials and a chance at a dragon mattock or farm animal.",
          ["75 Hunter", "55 Slayer", "Members", "Access to Anachronia"],
          ["Raw shark", "Hatchet", "Knife"],
          "Detection ends the encounter; bait is consumed.",
        ),
        hunt(
          "chinchompa",
          "Carnivorous chinchompas",
          "Carnivorous chinchompa",
          "Box_trap.png",
          "Feldip Hunter area",
          "Trap chinchompas and reset the traps.",
          "Bank the catches for area combat.",
          ["63 Hunter", "Members"],
          ["Box trap"],
        ),
      ],
      true,
    ),
  ],
];

export const ARTISAN_SKILLS = ARTISAN_BASE.map((skill, index) => ({
  ...skill,
  maxLevel: skill.goal,
  stages: ARTISAN_STAGES[index],
})) as SkillRecord[];

// Location images are the files shown by their linked Wiki articles.
export const ARTISAN_LOCATIONS: Record<string, LocationRecord> = {
  "Het's Oasis": {
    name: "Het's Oasis",
    wiki: "Het's Oasis",
    image: "Het's_Oasis.png",
    members: false,
    summary:
      "The three acadia trees west of the oasis can be cut in free play from 50 Woodcutting.",
  },
  "Taverley tree patch": {
    name: "Taverley tree patch",
    wiki: "Tree patch",
    image: "Taverley.png",
    members: true,
    summary: "A tree-growing plot beside Taverley's farming area.",
    access:
      "Use the tree plot, not Farmer Jones' separate potato patch. Bring the appropriate sapling and farming tools.",
  },
  "Seers' Village": {
    name: "Seers' Village",
    wiki: "Seers' Village",
    image: "Seers'_Village.png",
    members: true,
    summary:
      "Kandarin village with a bank and magic trees by the Ranging Guild to the south-west.",
  },
  "Manor Farm": {
    name: "Manor Farm",
    wiki: "Manor Farm",
    image: "Manor_Farm.png",
    members: true,
    summary: "Player-owned farm north of East Ardougne.",
    access:
      "Start the farm tutorial with Granny Potterington; 17 Farming and 20 Construction are required.",
  },
  Anachronia: {
    name: "Anachronia",
    wiki: "Anachronia",
    image: "Anachronia.png",
    members: true,
    summary:
      "Island with Hunter grounds, Big Game Hunter encounters and the dinosaur farm.",
    access:
      "Travel from the Varrock Dig Site; individual activities have additional requirements.",
  },
  "Ithell harps": {
    name: "Ithell harps",
    wiki: "Harmonium",
    image: "Harmonic_dust.png",
    members: true,
    summary:
      "Harmoniums in Prifddinas yield harmonic dust while training Crafting.",
    access:
      "Complete Plague's End to enter Prifddinas and visit the Ithell district.",
  },
  "Eternal magic grove": {
    name: "Eternal magic grove",
    wiki: "Eternal magic tree",
    image: "Eternal_magic_tree.png",
    members: true,
    summary: "Eternal magic trees in the Piscatoris Hunter area.",
    access:
      "Travel north-west of Eagles' Peak; fairy ring AKQ is nearby if unlocked.",
  },
  Taverley: {
    name: "Taverley",
    wiki: "Taverley",
    image: "Taverley.png",
    members: false,
    summary:
      "A free-play village with a bank, Jatix's stall and Ramsey's range.",
    access:
      "Walk south from Burthorpe; activate the lodestone before relying on its teleport.",
  },
  "Taverley potato patch": {
    name: "Taverley potato patch",
    wiki: "Potato patch",
    image: "Potato_patch_(clean).png",
    members: false,
    summary:
      "Farmer Jones tends this potato-only patch beside the Taverley flax field.",
    access: "The nearby tree patch is a separate members' training option.",
  },
  "Falador farm": {
    name: "Falador farm",
    wiki: "Falador farm",
    image: "Falador_Farm.png",
    members: false,
    summary: "A farm south of Falador, with allotments on its north-east edge.",
    access:
      "The normal allotment training in this guide requires a members' world.",
  },
  "Taverley Hunter area": {
    name: "Taverley Hunter area",
    wiki: "Taverley Hunter area",
    image: "Taverley_hunting_area_kebbit_location.png",
    members: false,
    summary: "Ayleth's camp and birds are north of Taverley's stone circle.",
    access:
      "The bird area is free-play accessible; free Hunter experience stops at level 5.",
  },
  "Feldip Hunter area": {
    name: "Feldip Hunter area",
    wiki: "Feldip Hunter area",
    image: "Feldip_Hunter_area.png",
    members: true,
    summary:
      "Hunter grounds north of Oo'glog with tropical wagtails near the hunting expert.",
    access:
      "Members can walk south through Feldip or use the Oo'glog lodestone once activated; quest transport routes have separate requirements.",
  },
  "Canifis Hunter area": {
    name: "Canifis Hunter area",
    wiki: "Canifis Hunter area",
    image: "Green_salamander_(Hunter).png",
    members: true,
    summary: "Net-trapping grounds for green salamanders.",
    access: "Members; travel south of the Werewolf Agility Course.",
  },
  "Uzer Hunter area": {
    name: "Uzer Hunter area",
    wiki: "Uzer Hunter area",
    image: "Orange_salamander_(Hunter).png",
    members: true,
    summary: "Desert net-trapping grounds for orange salamanders.",
    access: "Members; bring water or equivalent desert heat protection.",
  },
  "Harmony Island": {
    name: "Harmony Island",
    wiki: "Harmony Island",
    image: "Harmony_island.png",
    members: true,
    summary: "An island allotment available after The Great Brain Robbery.",
    access: "Complete The Great Brain Robbery.",
  },
};

// Inventory filenames are taken from the linked Wiki skill, recipe and item pages.
export const ARTISAN_ITEMS: ItemReference[] = [
  {
    name: "Headless shaft",
    wiki: "Headless shaft",
    image: "Headless_shaft_5.png",
    aliases: ["headless shafts"],
  },
  {
    name: "Willow sapling",
    wiki: "Willow sapling",
    image: "Willow_sapling.png",
  },
  { name: "Yew sapling", wiki: "Yew sapling", image: "Yew_sapling.png" },
  { name: "Magic sapling", wiki: "Magic sapling", image: "Magic_sapling.png" },
  { name: "Spade", wiki: "Spade", image: "Spade.png" },
  { name: "Seed dibber", wiki: "Seed dibber", image: "Seed_dibber.png" },
  { name: "Jungle logs", wiki: "Jungle logs", image: "Jungle_logs.png" },
  {
    name: "Wooden spear",
    wiki: "Wooden spear",
    image: "Wooden_spear.png",
    aliases: ["wooden spears"],
  },
  {
    name: "Raw lobster",
    wiki: "Raw lobster",
    image: "Raw_lobster.png",
    aliases: ["raw lobsters"],
  },
  {
    name: "Bronze hatchet",
    wiki: "Bronze hatchet",
    image: "Bronze_hatchet.png",
  },
  {
    name: "Hatchet",
    wiki: "Hatchet",
    image: "Bronze_hatchet.png",
    aliases: ["hatchets"],
  },
  { name: "Oak logs", wiki: "Oak logs", image: "Oak_logs.png" },
  { name: "Willow logs", wiki: "Willow logs", image: "Willow_logs.png" },
  { name: "Maple logs", wiki: "Maple logs", image: "Maple_logs.png" },
  { name: "Yew logs", wiki: "Yew logs", image: "Yew_logs.png" },
  { name: "Knife", wiki: "Knife", image: "Knife.png" },
  { name: "Shaft", wiki: "Shaft", image: "Shaft_5.png", aliases: ["shafts"] },
  {
    name: "Shortbow",
    wiki: "Shortbow",
    image: "Shortbow.png",
    aliases: ["shortbows"],
  },
  {
    name: "Oak shortbow",
    wiki: "Oak shortbow",
    image: "Oak_shortbow.png",
    aliases: ["oak shortbows"],
  },
  {
    name: "Willow shortbow",
    wiki: "Willow shortbow",
    image: "Willow_shortbow.png",
    aliases: ["willow shortbows"],
  },
  {
    name: "Maple shortbow",
    wiki: "Maple shortbow",
    image: "Maple_shortbow.png",
    aliases: ["maple shortbows"],
  },
  {
    name: "Bowstring",
    wiki: "Bowstring",
    image: "Bowstring.png",
    aliases: ["bowstrings"],
  },
  { name: "Tinderbox", wiki: "Tinderbox", image: "Tinderbox.png" },
  { name: "Flax", wiki: "Flax", image: "Flax.png" },
  { name: "Chisel", wiki: "Chisel", image: "Chisel.png" },
  {
    name: "Uncut sapphire",
    wiki: "Uncut sapphire",
    image: "Uncut_sapphire.png",
  },
  { name: "Uncut emerald", wiki: "Uncut emerald", image: "Uncut_emerald.png" },
  { name: "Uncut diamond", wiki: "Uncut diamond", image: "Uncut_diamond.png" },
  {
    name: "Sapphire",
    wiki: "Sapphire",
    image: "Sapphire.png",
    aliases: ["sapphires"],
  },
  {
    name: "Emerald",
    wiki: "Emerald",
    image: "Emerald.png",
    aliases: ["emeralds"],
  },
  { name: "Clean guam", wiki: "Clean guam", image: "Clean_guam.png" },
  { name: "Vial of water", wiki: "Vial of water", image: "Vial_of_water.png" },
  { name: "Eye of newt", wiki: "Eye of newt", image: "Eye_of_newt.png" },
  {
    name: "Attack potion",
    wiki: "Attack potion",
    image: "Attack_potion_(3).png",
    aliases: ["attack potions"],
  },
  {
    name: "Clean marrentill",
    wiki: "Clean marrentill",
    image: "Clean_marrentill.png",
  },
  {
    name: "Unicorn horn dust",
    wiki: "Unicorn horn dust",
    image: "Unicorn_horn_dust.png",
  },
  { name: "Antipoison", wiki: "Antipoison", image: "Antipoison_(3).png" },
  {
    name: "Potato seed",
    wiki: "Potato seed",
    image: "Potato_seed_5.png",
    aliases: ["potato seeds"],
  },
  { name: "Raw potato", wiki: "Raw potato", image: "Raw_potato.png" },
  { name: "Rake", wiki: "Rake", image: "Rake.png" },
  { name: "Oak sapling", wiki: "Oak sapling", image: "Oak_sapling.png" },
  {
    name: "Bird snare",
    wiki: "Bird snare",
    image: "Bird_snare.png",
    aliases: ["bird snares"],
  },
  { name: "Acadia logs", wiki: "Acadia logs", image: "Acadia_logs.png" },
  { name: "Magic logs", wiki: "Magic logs", image: "Magic_logs.png" },
  {
    name: "Eternal magic logs",
    wiki: "Eternal magic logs",
    image: "Eternal_magic_logs.png",
  },
  { name: "Uncut ruby", wiki: "Uncut ruby", image: "Uncut_ruby.png" },
  { name: "Raw monkfish", wiki: "Raw monkfish", image: "Raw_monkfish.png" },
  { name: "Raw shark", wiki: "Raw shark", image: "Raw_shark.png" },
  {
    name: "Box trap",
    wiki: "Box trap",
    image: "Box_trap.png",
    aliases: ["box traps"],
  },
  {
    name: "Marasamaw plant",
    wiki: "Marasamaw plant",
    image: "Marasamaw_plant.png",
  },
  { name: "Maple sapling", wiki: "Maple sapling", image: "Maple_sapling.png" },
  {
    name: "Overload",
    wiki: "Overload",
    image: "Overload_(3).png",
    aliases: ["overloads"],
  },
  { name: "Clean ranarr", wiki: "Clean ranarr", image: "Clean_ranarr.png" },
  { name: "Snape grass", wiki: "Snape grass", image: "Snape_grass.png" },
  {
    name: "Clean snapdragon",
    wiki: "Clean snapdragon",
    image: "Clean_snapdragon.png",
  },
  {
    name: "Red spiders' eggs",
    wiki: "Red spiders' eggs",
    image: "Red_spiders'_eggs.png",
  },
  { name: "Clean avantoe", wiki: "Clean avantoe", image: "Clean_avantoe.png" },
  { name: "Clean torstol", wiki: "Clean torstol", image: "Clean_torstol.png" },
  {
    name: "Prayer potion",
    wiki: "Prayer potion",
    image: "Prayer_potion_(3).png",
    aliases: ["prayer potions"],
  },
  {
    name: "Super restore",
    wiki: "Super restore",
    image: "Super_restore_(3).png",
    aliases: ["super restores"],
  },
  {
    name: "Small fishing net",
    wiki: "Small fishing net",
    image: "Small_fishing_net.png",
  },
  { name: "Rope", wiki: "Rope", image: "Rope.png" },
  { name: "Crystal flask", wiki: "Crystal flask", image: "Crystal_flask.png" },
  { name: "Potion flask", wiki: "Potion flask", image: "Potion_flask.png" },
  {
    name: "Red sandstone",
    wiki: "Red sandstone (ore)",
    image: "Red_sandstone.png",
  },
  { name: "Robust glass", wiki: "Robust glass", image: "Robust_glass.png" },
  { name: "Crystal glass", wiki: "Crystal glass", image: "Crystal_glass.png" },
  {
    name: "Glassblowing pipe",
    wiki: "Glassblowing pipe",
    image: "Glassblowing_pipe.png",
  },
  {
    name: "Primal extract",
    wiki: "Primal extract",
    image: "Primal_extract.png",
  },
  { name: "Bomb vial", wiki: "Bomb vial", image: "Bomb_vial.png" },
  {
    name: "Powerburst vial",
    wiki: "Powerburst vial",
    image: "Powerburst_vial.png",
  },
  { name: "Beak snot", wiki: "Beak snot", image: "Beak_snot.png" },
  {
    name: "Clean fellstalk",
    wiki: "Clean fellstalk",
    image: "Clean_fellstalk.png",
  },
  {
    name: "Clean dwarf weed",
    wiki: "Clean dwarf weed",
    image: "Clean_dwarf_weed.png",
  },
  {
    name: "Bottled dinosaur roar",
    wiki: "Bottled dinosaur roar",
    image: "Bottled_dinosaur_roar.png",
    aliases: ["bottled dinosaur roars"],
  },
  {
    name: "Soul rune",
    wiki: "Soul rune",
    image: "Soul_rune.png",
    aliases: ["soul runes"],
  },
  {
    name: "Chaos rune",
    wiki: "Chaos rune",
    image: "Chaos_rune.png",
    aliases: ["chaos runes"],
  },
  {
    name: "Blood rune",
    wiki: "Blood rune",
    image: "Blood_rune.png",
    aliases: ["blood runes"],
  },
  {
    name: "Supreme overload potion",
    wiki: "Supreme overload potion",
    image: "Supreme_overload_potion_(6).png",
  },
  {
    name: "Super runecrafting potion",
    wiki: "Super runecrafting",
    image: "Super_runecrafting_(4).png",
  },
  { name: "Super attack", wiki: "Super attack", image: "Super_attack_(4).png" },
  {
    name: "Super strength",
    wiki: "Super strength",
    image: "Super_strength_(4).png",
  },
  {
    name: "Super defence",
    wiki: "Super defence",
    image: "Super_defence_(4).png",
  },
  {
    name: "Super ranging potion",
    wiki: "Super ranging potion",
    image: "Super_ranging_potion_(4).png",
  },
  {
    name: "Super magic potion",
    wiki: "Super magic potion",
    image: "Super_magic_potion_(4).png",
  },
  {
    name: "Super necromancy",
    wiki: "Super necromancy",
    image: "Super_necromancy_(4).png",
  },
  {
    name: "Extreme attack",
    wiki: "Extreme attack",
    image: "Extreme_attack_(3).png",
  },
  {
    name: "Extreme strength",
    wiki: "Extreme strength",
    image: "Extreme_strength_(3).png",
  },
  {
    name: "Extreme defence",
    wiki: "Extreme defence",
    image: "Extreme_defence_(3).png",
  },
  {
    name: "Extreme ranging",
    wiki: "Extreme ranging",
    image: "Extreme_ranging_(3).png",
  },
  {
    name: "Extreme magic",
    wiki: "Extreme magic",
    image: "Extreme_magic_(3).png",
  },
  {
    name: "Extreme necromancy",
    wiki: "Extreme necromancy",
    image: "Extreme_necromancy_(3).png",
  },
];
