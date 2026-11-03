export type AccessMode = "f2p" | "members";
export type Page = "journey" | "play" | "quests" | "skills";
export interface Profile {
  id: string;
  name: string;
  kind: "Solo Ironman" | "Group Ironman";
  mode: AccessMode;
  levels: Record<string, number>;
  completedQuests: string[];
  packed: string[];
  completedTasks: string[];
  activeTask: string;
  notes: Record<string, string>;
}
export interface QuestRecord {
  id: string;
  name: string;
  members: boolean;
  difficulty: string;
  length: string;
  location: string;
  image: string;
  description: string;
  why: string;
  requirements: { skill: string; level: number; recommended?: boolean }[];
  questRequirements: string[];
  supplies: string[];
  steps: string[];
  rewards: string[];
  wiki: string;
}
export interface SkillRecord {
  name: string;
  category: string;
  icon: string;
  image: string;
  description: string;
  goal: number;
  payoff: string;
  stages: {
    from: number;
    to: number;
    title: string;
    location: string;
    method: string;
    supplies: string[];
  }[];
  membersNote: string;
  wiki: string;
}
export const asset = (path: string) =>
  import.meta.env.BASE_URL + "images/" + path;
export const QUESTS: QuestRecord[] = [
  {
    id: "cooks-assistant",
    name: "Cook's Assistant",
    members: false,
    difficulty: "Novice",
    length: "Short",
    location: "Lumbridge Castle",
    image: "castle.webp",
    description:
      "A cook in a predicament. A cake to bake. Your first small adventure starts in Lumbridge Castle.",
    why: "An approachable first quest that starts your cooking journey and opens the way to later cooking quests.",
    requirements: [],
    questRequirements: [],
    supplies: ["A pot of flour", "A bucket of milk", "An egg"],
    steps: [
      "Speak to the cook in Lumbridge Castle.",
      "Gather the ingredients yourself around Lumbridge.",
      "Return to the cook and finish the quest.",
    ],
    rewards: [
      "Cooking experience",
      "Quest points",
      "Access to the cook’s range",
    ],
    wiki: "Cook%27s_Assistant",
  },
  {
    id: "knights-sword",
    name: "The Knight's Sword",
    members: false,
    difficulty: "Intermediate",
    length: "Medium",
    location: "Falador · Asgarnian Ice Dungeon",
    image: "castle.webp",
    description:
      "Help a worried squire replace a lost ceremonial sword, with a little help from an Imcando dwarf.",
    why: "A valuable early Smithing reward. Gather your own inputs first and avoid a long, repetitive early Smithing grind.",
    requirements: [
      { skill: "Mining", level: 10 },
      { skill: "Smithing", level: 10, recommended: true },
      { skill: "Cooking", level: 10, recommended: true },
    ],
    questRequirements: [],
    supplies: [
      "A redberry pie",
      "2 iron bars",
      "A pickaxe",
      "Food for the ice dungeon",
    ],
    steps: [
      "Speak to the squire in the White Knights’ Castle.",
      "Prepare the pie and iron bars before travelling.",
      "Follow the Wiki walkthrough to obtain blurite and replace the sword.",
    ],
    rewards: [
      "A substantial Smithing XP reward",
      "Quest points",
      "An early foundation for self-made equipment",
    ],
    wiki: "The_Knight%27s_Sword",
  },
  {
    id: "dragon-slayer",
    name: "Dragon Slayer",
    members: false,
    difficulty: "Experienced",
    length: "Long",
    location: "Champions’ Guild · Crandor",
    image: "elvarg.webp",
    description:
      "Prepare your ship, assemble the map, and face Elvarg. A defining milestone of your free-world adventure.",
    why: "A major F2P quest milestone that brings your combat, equipment, and self-supplied preparation together.",
    requirements: [
      { skill: "Crafting", level: 8, recommended: true },
      { skill: "Smithing", level: 20, recommended: true },
    ],
    questRequirements: [],
    supplies: [
      "90 steel nails",
      "3 planks",
      "2,000 coins for ship repairs",
      "Combat food and appropriate equipment",
    ],
    steps: [
      "Confirm 33 quest points in your in-game journal.",
      "Follow the quest guide to gather the map pieces and repair the ship.",
      "Prepare appropriate gear and food before attempting Elvarg.",
    ],
    rewards: [
      "Combat experience",
      "Quest points",
      "A core F2P journey milestone",
    ],
    wiki: "Dragon_Slayer",
  },
  {
    id: "waterfall-quest",
    name: "Waterfall Quest",
    members: true,
    difficulty: "Intermediate",
    length: "Medium",
    location: "Baxtorian Falls",
    image: "lumbridge.webp",
    description:
      "Follow the story of a hidden treasure beneath Baxtorian Falls and begin your members quest journey.",
    why: "A classic early-members direction with Attack and Strength rewards. Plan for the dangerous areas rather than assuming starter equipment is enough.",
    requirements: [],
    questRequirements: [],
    supplies: [
      "Check the current Wiki item list",
      "Appropriate food",
      "An escape plan for dangerous areas",
    ],
    steps: [
      "Read the current quest guide and its danger warnings.",
      "Gather the listed quest items from Ironman-accessible sources.",
      "Complete the quest using the linked walkthrough, then record your reward levels.",
    ],
    rewards: [
      "13,750 Attack XP",
      "13,750 Strength XP",
      "Gold bars, diamonds, and mithril seeds",
    ],
    wiki: "Waterfall_Quest",
  },
  {
    id: "tree-gnome-village",
    name: "Tree Gnome Village",
    members: true,
    difficulty: "Intermediate",
    length: "Medium",
    location: "Tree Gnome Village",
    image: "lumbridge.webp",
    description:
      "Help the tree gnomes defend their home and work toward a more connected world.",
    why: "An early-members quest direction with Attack experience and useful travel progression.",
    requirements: [],
    questRequirements: [],
    supplies: ["Check the current Wiki item list", "Combat gear and food"],
    steps: [
      "Check the current walkthrough and combat requirements.",
      "Prepare your own equipment and supplies.",
      "Finish the quest and record the unlock.",
    ],
    rewards: ["11,450 Attack XP", "Travel progression"],
    wiki: "Tree_Gnome_Village",
  },
];
export const SKILLS: SkillRecord[] = [
  {
    name: "Mining",
    category: "Gathering",
    icon: "Mining.png",
    image: "lumbridge.webp",
    description:
      "From your first copper ore to a self-sufficient equipment supply. Mine with a purpose, not just a level target.",
    goal: 20,
    payoff: "Gather the ores for your next Smithing milestone.",
    stages: [
      {
        from: 1,
        to: 10,
        title: "Copper & tin",
        location: "Burthorpe mine / Lumbridge swamp",
        method:
          "Mine matching amounts of copper and tin for bronze. Keep ore in an ore box and use the metal bank.",
        supplies: ["A suitable pickaxe", "An ore box if available"],
      },
      {
        from: 10,
        to: 30,
        title: "Iron, then coal",
        location: "An accessible iron mine",
        method:
          "Mine the ore you need for your next Smithing target. Upgrade your pickaxe when you can obtain and use the next tier.",
        supplies: ["A level-appropriate pickaxe", "Space in your ore box"],
      },
      {
        from: 30,
        to: 50,
        title: "A stronger metal supply",
        location: "Accessible mithril and adamantite rocks",
        method:
          "Balance the ores you collect with your Smithing needs. Account for travel and banking when comparing methods.",
        supplies: ["An upgraded pickaxe", "An upgraded ore box"],
      },
    ],
    membersNote:
      "Membership opens additional locations and methods. This prototype demonstrates the mode switch; a researched members training catalogue is not included yet.",
    wiki: "Mining",
  },
  {
    name: "Smithing",
    category: "Artisan",
    icon: "Smithing.png",
    image: "castle.webp",
    description:
      "Turn your own ores into useful equipment. Let your next upgrade decide what you make.",
    goal: 20,
    payoff: "Make useful equipment and prepare your own quest inputs.",
    stages: [
      {
        from: 1,
        to: 10,
        title: "Bronze foundations",
        location: "An accessible furnace and anvil",
        method:
          "Smelt your gathered copper and tin into bronze bars, then smith useful equipment. Complete What’s Mine is Yours when eligible.",
        supplies: ["Copper and tin ore", "A hammer or tool-belt hammer"],
      },
      {
        from: 10,
        to: 20,
        title: "Iron equipment",
        location: "Artisans’ Workshop",
        method:
          "Make iron equipment from your own ore and complete The Knight’s Sword when ready. Check your new level after claiming the reward.",
        supplies: ["Iron ore", "Smithing tools"],
      },
      {
        from: 20,
        to: 30,
        title: "Build your steel supply",
        location: "Artisans’ Workshop",
        method:
          "Gather the required ores for steel, and make upgrades or quest inputs you actually need.",
        supplies: ["Ore for steel bars", "A hammer"],
      },
    ],
    membersNote:
      "Keep your existing Smithing progress when changing access mode. Members recommendations will connect additional quests and equipment routes.",
    wiki: "Smithing",
  },
  {
    name: "Fishing",
    category: "Gathering",
    icon: "Fishing.png",
    image: "lumbridge.webp",
    description:
      "Build a food supply you can replace. Pair Fishing with Cooking, without double-counting the time.",
    goal: 20,
    payoff: "Support questing and combat with renewable food.",
    stages: [
      {
        from: 1,
        to: 20,
        title: "Your first food reserve",
        location: "Lumbridge / Draynor Village",
        method:
          "Catch fish appropriate for your level and cook them for your next adventure. Allow for burns when planning a food target.",
        supplies: ["Appropriate fishing equipment", "Bait where required"],
      },
      {
        from: 20,
        to: 40,
        title: "Fly-fishing loop",
        location: "An accessible river fishing spot",
        method:
          "Use feathers and a fly-fishing rod when eligible. Bank or cook what you need for combat; keep gathering and cooking time separate.",
        supplies: ["A fly-fishing rod", "Feathers"],
      },
    ],
    membersNote:
      "Members locations and food routes need their own researched methods. Your recorded levels and food checklist remain unchanged.",
    wiki: "Fishing",
  },
];
export const SAMPLE_PROFILES: Profile[] = [
  {
    id: "aster",
    name: "Aster",
    kind: "Solo Ironman",
    mode: "f2p",
    levels: {
      Mining: 12,
      Smithing: 8,
      Fishing: 16,
      Cooking: 14,
      Attack: 18,
      Strength: 15,
      Defence: 12,
      Crafting: 5,
    },
    completedQuests: ["cooks-assistant"],
    packed: [],
    completedTasks: [],
    activeTask: "knights-sword",
    notes: {},
  },
  {
    id: "rowan",
    name: "Rowan",
    kind: "Group Ironman",
    mode: "members",
    levels: {
      Mining: 32,
      Smithing: 30,
      Fishing: 28,
      Cooking: 26,
      Attack: 35,
      Strength: 30,
      Defence: 25,
      Crafting: 16,
    },
    completedQuests: ["cooks-assistant", "knights-sword"],
    packed: [],
    completedTasks: [],
    activeTask: "waterfall-quest",
    notes: {},
  },
];
export function accessibleQuests(profile: Profile) {
  return QUESTS.filter((q) => profile.mode === "members" || !q.members);
}
export function nextQuest(profile: Profile) {
  const available = accessibleQuests(profile);
  const incomplete = (quest: QuestRecord) =>
    !profile.completedQuests.includes(quest.id);
  return (
    (profile.mode === "members"
      ? available.find((q) => q.members && incomplete(q))
      : undefined) ?? available.find(incomplete)
  );
}
export function taskTitle(id: string) {
  return (
    QUESTS.find((q) => q.id === id)?.name ??
    (id.startsWith("train-")
      ? "Train " + id.slice(6)
      : "Choose your next adventure")
  );
}
export function toggleItem(items: string[], id: string) {
  return items.includes(id) ? items.filter((x) => x !== id) : [...items, id];
}
