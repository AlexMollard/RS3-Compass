import type { SkillName } from "./skillNames.ts";
import { CORE_SKILLS } from "./skillsCore.ts";
import { COMBAT_SKILLS } from "./skillsCombat.ts";
import { ARTISAN_SKILLS } from "./skillsArtisan.ts";
import { SUPPORT_SKILLS } from "./skillsSupport.ts";
import { FOUNDATION_QUESTS } from "./questsFoundations.ts";
import { UNLOCK_QUESTS } from "./questsUnlocks.ts";
import { TALE_QUESTS } from "./questsTales.ts";
import { ADVENTURE_QUESTS } from "./questsAdventures.ts";
import { SIDE_QUESTS } from "./questsSideActivities.ts";
import { SEASONAL_QUESTS } from "./questsSeasonal.ts";
import { IMPORTED_QUESTS } from "./questsImported.ts";
import type {
  HiscoresImportStatus,
  PlayerEvent,
  PlayerImportStatus,
  PlayerQuestProgress,
  PlayerStatistics,
} from "./lib/playerTypes.ts";

export type AccessMode = "f2p" | "members";
export type Page = "journey" | "play" | "quests" | "skills";
export type AccountKind = "Regular account" | "Solo Ironman" | "Group Ironman";
/** Every account type, each with its RuneScape Wiki badge. */
export const ACCOUNT_KINDS: readonly { kind: AccountKind; image: string }[] = [
  { kind: "Regular account", image: "Friends_List_icon.png" },
  { kind: "Solo Ironman", image: "Ironman_badge.png" },
  { kind: "Group Ironman", image: "Group_Ironman_badge.png" },
];
export const isAccountKind = (value: unknown): value is AccountKind =>
  ACCOUNT_KINDS.some((k) => k.kind === value);
/** Applies what the Ironman Hiscores report; Group Ironman can't be detected, so it is kept. */
export const detectedAccountKind = (
  kind: AccountKind,
  ironman: boolean | undefined,
): AccountKind =>
  ironman === undefined || kind === "Group Ironman"
    ? kind
    : ironman
      ? "Solo Ironman"
      : "Regular account";
export const accountBadge = (kind: AccountKind): string =>
  ACCOUNT_KINDS.find((k) => k.kind === kind)?.image ?? "Friends_List_icon.png";
export interface Profile {
  id: string;
  name: string;
  kind: AccountKind;
  mode: AccessMode;
  levels: Record<string, number>;
  completedQuests: string[];
  packed: string[];
  completedTasks: string[];
  activeTask: string;
  notes: Record<string, string>;
  trainingRanges?: Record<string, number>;
  trainingMethods?: Record<string, string>;
  source?: "sample" | "hiscores";
  hiscoresFetchedAt?: number;
  hiscoresImportStatus?: HiscoresImportStatus;
  hiscoresLevels?: Record<string, number>;
  publicFetchedAt?: number;
  questImportStatus?: PlayerImportStatus;
  eventImportStatus?: PlayerImportStatus;
  statistics?: PlayerStatistics & { fetchedAt: number };
  questProgress?: PlayerQuestProgress & { fetchedAt: number };
  eventLog?: { events: PlayerEvent[]; fetchedAt: number };
}
export interface QuestRecord {
  id: string;
  name: string;
  kind?: "quest" | "miniquest" | "saga";
  availability?: "seasonal" | "tutorial" | "removed";
  completionMembers?: boolean;
  preparationNotes?: string[];
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
    map: { x: number; y: number; plane: 0 | 1 | 2 | 3; mapId?: number };
  };
  why: string;
  requirements: {
    skill: string;
    level: number;
    recommended?: boolean;
    purpose?: string;
  }[];
  questRequirements: string[];
  supplies: string[];
  rewards: string[];
  wiki: string;
}
export interface ItemReference {
  name: string;
  wiki: string;
  image: string;
  aliases?: string[];
}
export interface TrainingSite {
  label: string;
  wiki: string;
  map: QuestRecord["start"]["map"];
  access?: string;
  image?: string;
}
export interface TrainingOption {
  id: string;
  title: string;
  wiki: string;
  image: string;
  members?: boolean;
  locations: string[];
  sites: TrainingSite[];
  locationNote?: string;
  method: string;
  benefit: string;
  requirements?: string[];
  risks?: string;
  supplies?: string[];
}
export interface SkillRecord {
  name: SkillName;
  category: string;
  icon: string;
  description: string;
  goal: number;
  payoff: string;
  maxLevel: number;
  freeToPlayCap?: number;
  trainingWiki?: string;
  stages: {
    from: number;
    to: number;
    title: string;
    members?: boolean;
    method?: string;
    supplies: string[];
    options: TrainingOption[];
  }[];
  membersNote: string;
  wiki: string;
}
// Quest preparation: https://runescape.wiki/w/Dragon_Slayer/Quick_guide
// Mining locations and ore boxes: https://runescape.wiki/w/Adamant_ore_box
const CORE_QUESTS: QuestRecord[] = [
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
      "1 quest point",
      "300 Cooking XP",
      "500 coins and 3 noted sardines",
      "Access to the Cook-o-matic 25 range",
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
      "12,725 Smithing XP lamp",
      "1 quest point",
      "Ability to smith blurite bars and blurite swords",
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
      { skill: "Crafting", level: 8 },
      { skill: "Smithing", level: 20, recommended: true },
    ],
    questRequirements: [],
    supplies: [
      "An unfired bowl, wizard's mind bomb, silk, and a crayfish cage or lobster pot",
      "A weapon to defeat Wormbrain and use area loot, or 10,000 coins",
      "90 steel nails, 3 planks, and a hammer",
      "2,000 coins to purchase the ship",
      "Anti-dragon shield (obtained during the quest), combat food and equipment",
    ],
    rewards: [
      "Strength XP lamp and Defence XP lamp, each granting 18,650 XP and requiring level 40 in its skill",
      "2 quest points, a rune platebody and an anti-dragon shield",
      "Crandor access and a maze key for Melzar's Maze",
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
      "1 quest point",
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
    rewards: ["2 quest points", "11,450 Attack XP", "Travel progression"],
    wiki: "Tree_Gnome_Village",
  },
];

// Preserve Ironbound's main quest sequence; append the remaining miniquests and
// separately labelled seasonal/tutorial entries. Inventory checked 4 November 2026.
const QUEST_ORDER = [
  "cooks-assistant",
  "sheep-shearer",
  "the-blood-pact",
  "the-restless-ghost",
  "duck-quest",
  "necromancy",
  "whats-mine-is-yours",
  "once-upon-a-slime",
  "gertrudes-cat",
  "knights-sword",
  "goblin-diplomacy",
  "ernest-the-chicken",
  "gunnars-ground",
  "rune-mysteries",
  "druidic-ritual",
  "wolf-whistle",
  "death-plateau",
  "stolen-hearts",
  "pirates-treasure",
  "witchs-potion",
  "imp-catcher",
  "demon-slayer",
  "shield-of-arrav",
  "violet-is-blue",
  "violet-is-blue-too",
  "one-piercing-note",
  "vampyre-slayer",
  "witchs-house",
  "dragon-slayer",
  "visions-of-havenhythe",
  "hearts-of-sanguine",
  "heartstealer",
  "myths-of-the-white-lands",
  "swept-away",
  "a-shadow-over-ashdale",
  "the-death-of-chivalry",
  "missing-presumed-death",
  "broken-home",
  "theres-no-place-like-home",
  "a-souls-bane",
  "beneath-cursed-tides",
  "chefs-assistant",
  "gower-quest",
  "let-them-eat-pie",
  "perils-of-ice-mountain",
  "priest-in-peril",
  "song-from-the-depths",
  "benedicts-world-tour",
  "dorics-task-i",
  "dorics-task-ii",
  "dorics-task-iii",
  "dorics-task-iv",
  "purple-cat",
  "threes-company",
  "learning-the-ropes",
  "its-snow-bother",
  "a-christmas-reunion",
  "cold-front",
  "great-egg-spectations",
  "corporate-egg-spionage",
  "field-of-screams",
  "guys-and-dolls",
  "all-souls-eve",
  "waterfall-quest",
  "tree-gnome-village",
];
const questsById = new Map<string, QuestRecord>();
for (const group of [
  CORE_QUESTS,
  FOUNDATION_QUESTS,
  UNLOCK_QUESTS,
  TALE_QUESTS,
  ADVENTURE_QUESTS,
  SIDE_QUESTS,
  SEASONAL_QUESTS,
]) {
  for (const quest of group) questsById.set(quest.id, quest);
}
// Hand-written quests keep their curated order; Wiki imports follow in progression-guide order.
export const QUESTS: QuestRecord[] = [
  ...QUEST_ORDER.map((id) => questsById.get(id)!),
  ...IMPORTED_QUESTS.filter((quest) => !questsById.has(quest.id)),
];

export const SKILLS: SkillRecord[] = [
  ...CORE_SKILLS,
  ...COMBAT_SKILLS,
  ...ARTISAN_SKILLS,
  ...SUPPORT_SKILLS,
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
export function progressionQuests(profile: Profile) {
  return QUESTS.filter(
    (quest) =>
      (profile.mode === "members" || !quest.members) &&
      !quest.availability &&
      !(quest.completionMembers && profile.mode === "f2p"),
  );
}
export function nextQuest(profile: Profile) {
  const available = progressionQuests(profile);
  const incomplete = (quest: QuestRecord) =>
    !profile.completedQuests.includes(quest.id) &&
    quest.questRequirements.every((id) => profile.completedQuests.includes(id));
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

export function availableStages(skill: SkillRecord, mode: AccessMode) {
  return mode === "members"
    ? skill.stages
    : skill.stages.filter(
        (stage) =>
          !stage.members &&
          (skill.freeToPlayCap === undefined ||
            stage.from < skill.freeToPlayCap),
      );
}

export function skillNeedsMembership(skill: SkillRecord, profile: Profile) {
  const cap = skill.freeToPlayCap;
  return (
    profile.mode === "f2p" &&
    cap !== undefined &&
    (cap === 0 || (profile.levels[skill.name] ?? 1) >= cap)
  );
}

export function trainingStage(skill: SkillRecord, profile: Profile) {
  const level = profile.levels[skill.name] ?? 1;
  const stages = availableStages(skill, profile.mode);
  return (
    stages.find(
      (stage) => stage.from === profile.trainingRanges?.[skill.name],
    ) ??
    stages.find((stage) => level >= stage.from && level < stage.to) ??
    stages[stages.length - 1]
  );
}

export function availableTrainingOptions(
  stage: SkillRecord["stages"][number],
  mode: AccessMode,
): TrainingOption[] {
  if (mode === "f2p" && stage.members) return [];
  return stage.options.filter(
    (option) => mode === "members" || !option.members,
  );
}

export function trainingMethod(
  skill: SkillRecord,
  profile: Profile,
  stage = trainingStage(skill, profile),
  selectedId = profile.trainingMethods?.[skill.name],
) {
  const options = stage ? availableTrainingOptions(stage, profile.mode) : [];
  return options.find((option) => option.id === selectedId) ?? options[0];
}

export function trainingSupplies(
  stage: SkillRecord["stages"][number],
  option: TrainingOption,
) {
  return [...new Set([...stage.supplies, ...(option.supplies ?? [])])];
}

export function trainingRangeLabel(
  skill: SkillRecord,
  stage: SkillRecord["stages"][number],
  mode: AccessMode,
) {
  const cap =
    mode === "f2p" ? (skill.freeToPlayCap ?? skill.maxLevel) : skill.maxLevel;
  const end = stage.to >= cap ? cap : stage.to - 1;
  return `Levels ${stage.from}–${end}`;
}
