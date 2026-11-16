// What the Slayer page shows for tasks and requirements. It needs the task, verdict and quest data, so only the
// lazy-loaded Slayer guide imports it; the master choice itself lives in slayerMasters.ts.
import { QUESTS, type Profile } from "./data.ts";
import { combatLevel } from "./lib/combatLevel.ts";
import { levelStatus, type LevelStatus } from "./lib/levelStatus.ts";
import type { SkillName } from "./skillNames.ts";
import { SLAYER_VERDICTS, type TaskVerdict } from "./slayerGuide.ts";
import { SLAYER_TASKS } from "./slayerImported.ts";
import type { SlayerMaster, SlayerTask } from "./slayerTypes.ts";

export type RequirementChip = { label: string; status: LevelStatus };

/**
 * What each Wilderness master gives up against your default master, from their Wiki master pages (read 2026-11-16):
 * https://runescape.wiki/w/The_Raptor (Fort Forinthry is in the Wilderness; assignments comparable to, if not harder
 * than, Sumona's) and https://runescape.wiki/w/Mandrith (every task must be completed in the Wilderness, kills
 * elsewhere don't count; he ignores your blocks and prefers).
 */
export const ALTERNATIVE_TRADEOFFS: Readonly<Record<string, string>> = {
  "the-raptor":
    "Gives Wilderness tasks from Fort Forinthry, and the Wiki rates them comparable to or harder than Sumona's, so it isn't for low-level players.",
  mandrith:
    "Every task must be killed in the Wilderness, where other players can attack you, and he ignores your blocks and prefers.",
};

/**
 * A quest requirement. Done quests are met. Anything else is unknown while the account's quest list can't be trusted
 * (a Hiscores player whose quest import is private or missing); otherwise it is below.
 */
export function questStatus(profile: Profile, id: string): LevelStatus {
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

/** The master requirements the profile hasn't met, or can't be checked: empty when the master is fully open. */
export const masterGaps = (profile: Profile, master: SlayerMaster) =>
  masterRequirements(profile, master).filter((chip) => chip.status !== "met");

export type TaskCard = {
  task: SlayerTask;
  verdict?: TaskVerdict;
  requirements: RequirementChip[];
  showMainNote: boolean;
};

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
