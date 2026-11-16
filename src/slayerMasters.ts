import { QUESTS, type Profile } from "./data.ts";
import { COMBAT_SKILLS, combatLevel } from "./lib/combatLevel.ts";
import { levelStatus, type LevelStatus } from "./lib/levelStatus.ts";
import type { SkillName } from "./skillNames.ts";
import { SLAYER_VERDICTS, type TaskVerdict } from "./slayerGuide.ts";
import { SLAYER_MASTERS, SLAYER_TASKS } from "./slayerImported.ts";
import type { SlayerMaster, SlayerTask } from "./slayerTypes.ts";

/** Wilderness masters: offered as alternatives, never as the default or the next step. */
const ALTERNATIVE_IDS = ["the-raptor", "mandrith"];

/**
 * Orders the masters up the ladder: Slayer requirement, then combat requirement. Turael, the Wiki's starting master,
 * sorts above Jacquelyn when their requirements tie, so he is the one chosen.
 */
const byLadder = (a: SlayerMaster, b: SlayerMaster) =>
  a.slayer - b.slayer || a.combat - b.combat || Number(a.id === "turael") - Number(b.id === "turael");

export type MasterChoice = {
  master?: SlayerMaster;
  next?: SlayerMaster;
  alternatives: SlayerMaster[];
  unrecorded?: SkillName[];
};

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

  const inMode = SLAYER_MASTERS.filter((m) => profile.mode === "members" || !m.members);
  const usable = (m: SlayerMaster) =>
    (combat === undefined ? m.combat === 0 : levelStatus(combat, m.combat) === "met") &&
    levelStatus(slayer, m.slayer) === "met" &&
    m.quests.every((id) => profile.completedQuests.includes(id));
  const ladder = inMode.filter((m) => !ALTERNATIVE_IDS.includes(m.id)).sort(byLadder);
  const master = ladder.filter(usable).at(-1);
  return {
    master,
    next: ladder.find((m) => !master || byLadder(m, master) > 0),
    alternatives: inMode.filter((m) => ALTERNATIVE_IDS.includes(m.id) && usable(m)),
    ...(unrecorded.length ? { unrecorded } : {}),
  };
}

export type RequirementChip = { label: string; status: LevelStatus };

/**
 * A quest requirement. Done quests are met. Anything else is unknown while the account's quest list can't be trusted
 * (a Hiscores player whose quest import is private or missing); otherwise it is below.
 */
function questStatus(profile: Profile, id: string): LevelStatus {
  if (profile.completedQuests.includes(id)) return "met";
  return profile.source === "hiscores" && profile.questImportStatus !== "available" ? "unknown" : "below";
}

const questName = (id: string) => QUESTS.find((q) => q.id === id)?.name ?? id;

/** Requirement chips shared by masters and tasks. A requirement of 0 combat or 1 Slayer means none. */
function chips(
  profile: Profile,
  req: {
    combat?: number;
    slayer: number;
    levels?: { skill: SkillName; level: number }[];
    quests: string[];
    text?: string[];
  },
): RequirementChip[] {
  const combat = combatLevel(profile.levels);
  return [
    ...(req.slayer > 1
      ? [{ label: `Slayer ${req.slayer}`, status: levelStatus(profile.levels.Slayer, req.slayer) }]
      : []),
    ...(req.combat ? [{ label: `Combat ${req.combat}`, status: levelStatus(combat, req.combat) }] : []),
    ...(req.levels ?? []).map(({ skill, level }) => ({
      label: `${skill} ${level}`,
      status: levelStatus(profile.levels[skill], level),
    })),
    ...req.quests.map((id) => ({ label: questName(id), status: questStatus(profile, id) })),
    // Wiki text can't be checked, so it is never shown as met.
    ...(req.text ?? []).map((label) => ({ label, status: "unknown" as const })),
  ];
}

export const masterRequirements = (profile: Profile, master: SlayerMaster) => chips(profile, master);

export type TaskCard = {
  task: SlayerTask;
  verdict?: TaskVerdict;
  requirements: RequirementChip[];
  showMainNote: boolean;
};

/** The masters a profile can use at all: F2P profiles see only the free ones. */
export const mastersFor = (profile: Profile) =>
  SLAYER_MASTERS.filter((m) => profile.mode === "members" || !m.members);

/** A master's tasks in this mode. F2P profiles never see members-only tasks. */
export const tasksFor = (profile: Profile, masterId: string) =>
  SLAYER_TASKS.filter((t) => t.master === masterId && (profile.mode === "members" || !t.members));

const VERDICT_ORDER = ["prefer", "do", "skip", "block", "none"] as const;
export type VerdictGroup = (typeof VERDICT_ORDER)[number];

/** A master's tasks grouped by verdict, best first, with unverdicted tasks last. Empty groups are left out. */
export function groupedTasks(profile: Profile, masterId: string): { group: VerdictGroup; tasks: SlayerTask[] }[] {
  const tasks = tasksFor(profile, masterId);
  return VERDICT_ORDER.map((group) => ({
    group,
    tasks: tasks.filter((t) => (SLAYER_VERDICTS[t.name]?.verdict ?? "none") === group),
  })).filter((entry) => entry.tasks.length);
}

/**
 * The card for one picked task, or undefined when the save is stale (the master or task no longer exists, or this
 * mode can't see it). `master` is a master or its id.
 */
export function slayerTaskCard(profile: Profile, master: SlayerMaster | string, taskId: string): TaskCard | undefined {
  const masterId = typeof master === "string" ? master : master.id;
  const task = tasksFor(profile, masterId).find((t) => t.id === taskId);
  if (!task) return undefined;
  const verdict = SLAYER_VERDICTS[task.name];
  return {
    task,
    verdict,
    requirements: chips(profile, {
      slayer: task.slayer,
      combat: task.combat,
      levels: task.requirements.levels,
      quests: task.requirements.quests,
      text: task.requirements.text,
    }),
    showMainNote: profile.kind === "Regular account" && !!verdict?.mainNote,
  };
}
