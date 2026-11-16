// Master choice only: this module may be loaded by every skill page, so it imports no task, verdict or quest data.
import type { Profile } from "./data.ts";
import { COMBAT_SKILLS, combatLevel } from "./lib/combatLevel.ts";
import { levelStatus } from "./lib/levelStatus.ts";
import type { SkillName } from "./skillNames.ts";
import { SLAYER_MASTERS } from "./slayerMastersImported.ts";
import type { SlayerMaster } from "./slayerTypes.ts";

/** Wilderness masters: offered as alternatives, never as the default or the next step. */
export const ALTERNATIVE_IDS = ["the-raptor", "mandrith"];

/**
 * Orders the masters up the ladder: Slayer requirement, then combat requirement. Turael, the Wiki's starting master,
 * sorts above Jacquelyn when their requirements tie, so he is the one chosen.
 */
export const byLadder = (a: SlayerMaster, b: SlayerMaster) =>
  a.slayer - b.slayer || a.combat - b.combat || Number(a.id === "turael") - Number(b.id === "turael");

export type MasterChoice = {
  master?: SlayerMaster;
  next?: SlayerMaster;
  alternatives: SlayerMaster[];
  unrecorded?: SkillName[];
};

/** The masters a profile can use at all: F2P profiles see only the free ones. */
export const mastersFor = (profile: Profile) =>
  SLAYER_MASTERS.filter((m) => profile.mode === "members" || !m.members);

/**
 * Whether the profile's recorded levels and quests allow a master. Requirements kept only as Wiki text
 * (`master.text`) can't be checked, so they never block. An unknown combat level blocks every master that needs combat.
 */
export function canUseMaster(profile: Profile, m: SlayerMaster): boolean {
  const combat = combatLevel(profile.levels);
  return (
    (combat === undefined ? m.combat === 0 : levelStatus(combat, m.combat) === "met") &&
    levelStatus(profile.levels.Slayer, m.slayer) === "met" &&
    m.quests.every((id) => profile.completedQuests.includes(id))
  );
}

/**
 * The player's Slayer master: the usable one with the highest requirements. Quests must be done; requirements the
 * importer could only keep as text (`master.text`) can't be checked, so they never block a master. An unrecorded
 * Slayer level leaves the choice undefined. An unknown combat level (a formula skill is unrecorded) blocks only the
 * masters that need combat, so the starter masters stay usable. `unrecorded` lists every missing skill that mattered.
 */
export function masterFor(profile: Profile): MasterChoice {
  const combat = combatLevel(profile.levels);
  const slayer = profile.levels.Slayer;
  const unrecorded: SkillName[] = [
    ...(combat === undefined ? COMBAT_SKILLS.filter((skill) => profile.levels[skill] == null) : []),
    ...(slayer == null ? (["Slayer"] as const) : []),
  ];
  if (slayer == null) return { alternatives: [], unrecorded };

  const inMode = mastersFor(profile);
  const usable = (m: SlayerMaster) => canUseMaster(profile, m);
  const ladder = inMode.filter((m) => !ALTERNATIVE_IDS.includes(m.id)).sort(byLadder);
  const master = ladder.filter(usable).at(-1);
  return {
    master,
    next: ladder.find((m) => !master || byLadder(m, master) > 0),
    alternatives: inMode.filter((m) => ALTERNATIVE_IDS.includes(m.id) && usable(m)),
    ...(unrecorded.length ? { unrecorded } : {}),
  };
}

const ROUTE_SKILLS: readonly SkillName[] = ["Attack", "Strength", "Defence", "Constitution", "Ranged", "Magic", "Necromancy"];
/**
 * What Slayer tasks train besides the skill fought with. Every combat skill and Slayer from the fighting; Prayer
 * from bones and ashes; Herblore from herb drops; Summoning from charm drops. See ROUTE_SOURCES.
 */
const ROUTE_FEEDS: readonly SkillName[] = [...ROUTE_SKILLS, "Slayer", "Prayer", "Herblore", "Summoning"];
const ROUTE_SOURCES = [
  // "Slayer experience is granted in addition to regular combat experience."
  "https://runescape.wiki/w/Slayer",
  // Charms are "obtained primarily as drops from any of hundreds of different monsters".
  "https://runescape.wiki/w/Charms",
  // Herb drops give Herblore XP through a herb bag or herbicide (the bandit entry).
  "https://runescape.wiki/w/Necromancy_training",
  // Combat is "ideally" trained "while ... training Slayer or Prayer".
  "https://runescape.wiki/w/Ironman_Mode/Guide/Ranged",
];
const VANNAKA = SLAYER_MASTERS.find((m) => m.id === "vannaka");

export type EfficientRoute = {
  master: SlayerMaster;
  feeds: SkillName[];
  reason: string;
  checked: string;
  sources: string[];
};

/**
 * "Slayer tasks from <your master>" for a combat skill's page. Only members whose master is Vannaka or above on the
 * ladder get it: the starter masters' tasks are too short and too weak to beat focused training.
 */
export function efficientSlayerRoute(skill: SkillName, profile: Profile): EfficientRoute | undefined {
  if (profile.mode !== "members" || !ROUTE_SKILLS.includes(skill) || !VANNAKA) return undefined;
  const { master } = masterFor(profile);
  if (!master || byLadder(master, VANNAKA) < 0) return undefined;
  return {
    master,
    feeds: [skill, ...ROUTE_FEEDS.filter((s) => s !== skill)],
    reason: `${master.name} is the best master your Combat and Slayer levels allow: each task trains ${skill} alongside Slayer, and the drops feed Prayer, Herblore and Summoning.`,
    checked: "2026-11-16",
    sources: ROUTE_SOURCES,
  };
}
