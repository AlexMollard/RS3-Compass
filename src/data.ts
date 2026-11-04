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
  trainingRanges?: Record<string, number>;
}
export interface QuestRecord {
  id: string;
  name: string;
  icon: string;
  artwork: string;
  members: boolean;
  difficulty: string;
  length: string;
  start: {
    npc: string;
    npcWiki: string;
    image: string;
    location: string;
    meetingPoint: string;
    access?: string;
    map: { x: number; y: number; plane: 0 | 1 | 2 | 3 };
  };
  why: string;
  requirements: { skill: string; level: number; recommended?: boolean }[];
  questRequirements: string[];
  supplies: string[];
  rewards: string[];
  wiki: string;
}
export interface SkillRecord {
  name: string;
  category: string;
  icon: string;
  artwork: string;
  description: string;
  goal: number;
  payoff: string;
  stages: {
    from: number;
    to: number;
    title: string;
    locations: string[];
    memberLocations?: string[];
    method: string;
    supplies: string[];
  }[];
  membersNote: string;
  wiki: string;
}
export const QUESTS: QuestRecord[] = [
  {
    id: "cooks-assistant",
    name: "Cook's Assistant",
    icon: "Cook's_Assistant_icon.png",
    artwork: "Cook's_Assistant.png",
    members: false,
    difficulty: "Novice",
    length: "Short",
    start: {
      npc: "Cook",
      npcWiki: "Cook (Lumbridge)",
      image: "Cook_(Lumbridge)_chathead.png",
      location: "Lumbridge Castle",
      meetingPoint: "Kitchen on the ground floor, south side of the castle.",
      map: { x: 3209, y: 3215, plane: 0 },
    },
    why: "An approachable first quest that starts your cooking journey and opens the way to later cooking quests.",
    requirements: [],
    questRequirements: [],
    supplies: ["A pot of flour", "A bucket of milk", "An egg"],
    rewards: [
      "Cooking experience",
      "Quest points",
      "Access to the cook’s range",
    ],
    wiki: "Cook's_Assistant",
  },
  {
    id: "knights-sword",
    name: "The Knight's Sword",
    icon: "The_Knight's_Sword_icon.png",
    artwork: "The_Knight's_Sword.png",
    members: false,
    difficulty: "Intermediate",
    length: "Medium",
    start: {
      npc: "Squire Asrol",
      npcWiki: "Squire Asrol",
      image: "Squire_Asrol_chathead.png",
      location: "Falador",
      meetingPoint: "White Knights' Castle courtyard.",
      map: { x: 2975, y: 3343, plane: 0 },
    },
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
    rewards: [
      "A substantial Smithing XP reward",
      "Quest points",
      "An early foundation for self-made equipment",
    ],
    wiki: "The_Knight's_Sword",
  },
  {
    id: "dragon-slayer",
    name: "Dragon Slayer",
    icon: "Dragon_Slayer_icon.png",
    artwork: "Dragon_Slayer.png",
    members: false,
    difficulty: "Experienced",
    length: "Long",
    start: {
      npc: "Guildmaster",
      npcWiki: "Guildmaster",
      image: "Guildmaster_chathead.png",
      location: "Champions' Guild",
      meetingPoint: "Ground-floor foyer, south-west of Varrock.",
      access: "33 quest points are required to enter the guild.",
      map: { x: 3191, y: 3362, plane: 0 },
    },
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
    icon: "Waterfall_Quest_icon.png",
    artwork: "Waterfall_Quest.png",
    members: true,
    difficulty: "Intermediate",
    length: "Medium",
    start: {
      npc: "Almera",
      npcWiki: "Almera",
      image: "Almera_chathead.png",
      location: "Baxtorian Falls",
      meetingPoint:
        "Inside her house north-east of the falls, south of Barbarian Outpost.",
      map: { x: 2522, y: 3498, plane: 0 },
    },
    why: "A classic early-members direction with Attack and Strength rewards. Plan for the dangerous areas rather than assuming starter equipment is enough.",
    requirements: [],
    questRequirements: [],
    supplies: [
      "6 air runes",
      "6 earth runes",
      "6 water runes",
      "A rope",
      "Food for dangerous areas",
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
    icon: "Tree_Gnome_Village_icon.png",
    artwork: "Tree_Gnome_Village_(quest).png",
    members: true,
    difficulty: "Intermediate",
    length: "Medium",
    start: {
      npc: "King Bolren",
      npcWiki: "King Bolren",
      image: "King_Bolren_chathead.png",
      location: "Tree Gnome Village",
      meetingPoint:
        "By the spirit tree inside the village, at the centre of the maze.",
      access:
        "First visit: navigate the maze and squeeze through the loose railing. Spirit-tree travel unlocks after this quest.",
      map: { x: 2542, y: 3169, plane: 0 },
    },
    why: "An early-members quest direction with Attack experience and useful travel progression.",
    requirements: [],
    questRequirements: [],
    supplies: ["6 normal logs", "Combat gear and food"],
    rewards: ["11,450 Attack XP", "Travel progression"],
    wiki: "Tree_Gnome_Village",
  },
];
export const SKILLS: SkillRecord[] = [
  {
    name: "Mining",
    category: "Gathering",
    icon: "Mining.png",
    artwork: "Mining_detail.png",
    description:
      "Mining methods and equipment for gathering your next Smithing materials.",
    goal: 20,
    payoff: "Gather the ores for your next Smithing milestone.",
    stages: [
      {
        from: 1,
        to: 10,
        title: "Copper ore & tin ore",
        locations: ["Burthorpe mine"],
        method:
          "Mine copper ore and tin ore for bronze bars. Fill an ore box and deposit at the nearby furnace's metal bank.",
        supplies: ["A suitable pickaxe", "An ore box if available"],
      },
      {
        from: 10,
        to: 20,
        title: "Iron ore",
        locations: ["Lumbridge south-west mine"],
        method:
          "Mine iron ore and fill an iron ore box. Deposit at a furnace or anvil metal bank.",
        supplies: ["A level-appropriate pickaxe", "Space in your ore box"],
      },
      {
        from: 20,
        to: 30,
        title: "Coal",
        locations: ["Lumbridge south-west mine"],
        memberLocations: ["Lumbridge south-west mine", "Coal truck mine"],
        method:
          "Mine coal for steel bars. Carry a steel ore box and deposit your ore for Smithing.",
        supplies: ["An upgraded pickaxe", "A steel ore box"],
      },
      {
        from: 30,
        to: 40,
        title: "Mithril ore",
        locations: ["Varrock south-east mine"],
        method:
          "Mine mithril ore, fill a mithril ore box, and bank at Varrock east bank.",
        supplies: ["An upgraded pickaxe", "A mithril ore box"],
      },
      {
        from: 40,
        to: 50,
        title: "Adamantite ore & luminite",
        locations: ["Rimmington mine", "Dwarven luminite mine"],
        method:
          "Mine adamantite ore at Rimmington and luminite in the Dwarven mine. Use an adamant ore box; Port Sarim has a metal bank.",
        supplies: ["An upgraded pickaxe", "An adamant ore box"],
      },
    ],
    membersNote:
      "Shared mines remain useful. Coal trucks are a members alternative, not an automatic upgrade.",
    wiki: "Mining",
  },
  {
    name: "Smithing",
    category: "Artisan",
    icon: "Smithing.png",
    artwork: "Smithing_detail.png",
    description: "Smelt your gathered ore and make equipment or quest items.",
    goal: 20,
    payoff: "Make useful equipment and prepare your own quest inputs.",
    stages: [
      {
        from: 1,
        to: 10,
        title: "Bronze foundations",
        locations: ["Artisans' Workshop"],
        method:
          "Smelt your gathered copper and tin into bronze bars, then smith useful equipment. Complete What’s Mine is Yours when eligible.",
        supplies: ["Copper and tin ore", "A hammer or tool-belt hammer"],
      },
      {
        from: 10,
        to: 20,
        title: "Iron equipment",
        locations: ["Artisans' Workshop"],
        method:
          "Make iron equipment from your own ore and complete The Knight’s Sword when ready. Check your new level after claiming the reward.",
        supplies: ["Iron ore", "Smithing tools"],
      },
      {
        from: 20,
        to: 30,
        title: "Build your steel supply",
        locations: ["Artisans' Workshop"],
        method:
          "Gather the required ores for steel, and make upgrades or quest inputs you actually need.",
        supplies: ["Ore for steel bars", "A hammer"],
      },
    ],
    membersNote:
      "These shared workshops work in both modes; quest-gated alternatives are not assumed unlocked.",
    wiki: "Smithing",
  },
  {
    name: "Fishing",
    category: "Gathering",
    icon: "Fishing.png",
    artwork: "Fishing_detail.png",
    description: "Fishing methods and equipment for a renewable food supply.",
    goal: 20,
    payoff: "Support questing and combat with renewable food.",
    stages: [
      {
        from: 1,
        to: 20,
        title: "Your first food reserve",
        locations: ["Lumbridge", "Draynor Village"],
        method:
          "Catch raw crayfish in Lumbridge, or raw shrimps at Draynor. Cook your catch for questing and combat.",
        supplies: ["Appropriate fishing equipment", "Bait where required"],
      },
      {
        from: 20,
        to: 40,
        title: "Fly-fishing loop",
        locations: ["Gunnarsgrunn"],
        method:
          "Fly-fish raw trout with feathers; raw salmon unlock at 30 Fishing. Bank or cook what you need.",
        supplies: ["A fly-fishing rod", "Feathers"],
      },
    ],
    membersNote:
      "These river spots work in both modes; membership alone does not unlock quest-gated fishing areas.",
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
export function stageLocations(
  stage: SkillRecord["stages"][number],
  mode: AccessMode,
): string[] {
  return mode === "members" && stage.memberLocations
    ? stage.memberLocations
    : stage.locations;
}
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

export function trainingStage(skill: SkillRecord, profile: Profile) {
  const level = profile.levels[skill.name] ?? 1;
  return (
    skill.stages.find(
      (stage) => stage.from === profile.trainingRanges?.[skill.name],
    ) ??
    skill.stages.find((stage) => level >= stage.from && level < stage.to) ??
    skill.stages[skill.stages.length - 1]
  );
}
