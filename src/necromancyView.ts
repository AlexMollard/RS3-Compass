// What the Necromancy guide shows for a profile: storyline progress, souls, the gear path, kill-next and rituals
// (spec: docs/superpowers/specs/2026-11-16-necromancy-guide-design.md). Pure functions with no Svelte imports. Only
// the lazy-loaded Necromancy guide imports this, because it pulls in the generated Necromancy data.
import { QUESTS, availableTrainingOptions, skillByName, trainingStage, type Profile, type TrainingOption } from "./data.ts";
import { levelStatus, type LevelStatus } from "./lib/levelStatus.ts";
import {
  ENDGAME_TARGETS,
  NECRO_STORY,
  PROGRESS_TARGETS,
  RITUAL_QUESTS,
  SOUL_GATES,
  XP_TARGETS,
  progressKey,
  type EndgameTarget,
  type StoryStep,
  type XpTarget,
} from "./necromancyGuide.ts";
import { NECRO_GLYPHS, NECRO_RITUALS, NECRO_UPGRADES } from "./necromancyImported.ts";
import type { Ritual, UpgradeStep } from "./necromancyTypes.ts";
import { questStatus } from "./slayerTaskView.ts";

/** A requirement chip. "check" means check in game: Kili tasks and materials are never shown as met or unmet. */
export type Req = { label: string; status: LevelStatus | "check" };
export type RobeLine = "deathwarden" | "deathdealer";
export type GearLine = "weapon" | "robe";

const NECROMANCY = skillByName("Necromancy")!;
const FREE_CAP = NECROMANCY.freeToPlayCap ?? NECROMANCY.maxLevel;
const isFree = (profile: Profile) => profile.mode === "f2p";
/** The Necromancy level the guide plans for: free-to-play stops at the free cap. */
const plannedLevel = (profile: Profile) =>
  Math.min(profile.levels.Necromancy ?? 1, isFree(profile) ? FREE_CAP : NECROMANCY.maxLevel);

const questsById = new Map(QUESTS.map((q) => [q.id, q]));
const questName = (id: string) => questsById.get(id)?.name ?? id;
/** Free-to-play can't do members quests, so they never count as done there. */
const done = (profile: Profile, id: string) =>
  questStatus(profile, id) === "met" && !(isFree(profile) && questsById.get(id)?.members);
/**
 * Known not done: "below", or a members quest in free-to-play. An unknown status (a private quest import) is not, so it
 * never caps a tier, blocks a ritual or becomes a progress target; its chips show it as unknown.
 */
const knownUndone = (profile: Profile, id: string) =>
  questStatus(profile, id) === "below" || Boolean(isFree(profile) && questsById.get(id)?.members);
const count = (n: number) => n.toLocaleString("en-GB");

const check = (label: string): Req => ({ label, status: "check" });
const skillReq = (profile: Profile, skill: string, level: number): Req => ({
  label: `${skill} ${level}`,
  status: levelStatus(profile.levels[skill], level),
});
const questReq = (profile: Profile, id: string): Req => ({ label: questName(id), status: questStatus(profile, id) });
const soulsReq = (profile: Profile, souls: number): Req => ({
  label: `${count(souls)} souls`,
  status: levelStatus(profile.necromancy?.souls, souls),
});
const materialReq = (m: UpgradeStep["materials"][number]) => check(`${count(m.qty)} × ${m.item} per ${m.per}`);

/** A quest's own requirements: the storyline's Necromancy level and souls, then the quest's other skills. */
function questReqs(profile: Profile, id: string): Req[] {
  const step = NECRO_STORY.find((s) => s.quest === id);
  const skills = (questsById.get(id)?.requirements ?? []).filter(
    (r) => !r.recommended && !(step && r.skill === "Necromancy"),
  );
  return [
    ...(step && step.level > 1 ? [skillReq(profile, "Necromancy", step.level)] : []),
    ...(step?.souls ? [soulsReq(profile, step.souls)] : []),
    ...skills.map((r) => skillReq(profile, r.skill, r.level)),
  ];
}

/** Every quest `id` needs, directly or through other quests. */
function prerequisites(id: string, seen = new Set<string>()): Set<string> {
  for (const before of questsById.get(id)?.questRequirements ?? []) {
    if (seen.has(before)) continue;
    seen.add(before);
    prerequisites(before, seen);
  }
  return seen;
}

/**
 * The first quest to do towards `quests`: within the storyline, the first one known not done, in storyline order, of each
 * quest and the storyline quests it needs (Vessel of the Harbinger before The Spirit of War). Optional storyline
 * quests are never prerequisites, so they never come up.
 */
function firstOpenQuest(profile: Profile, quests: string[]): string | undefined {
  for (const id of quests) {
    const needed = prerequisites(id).add(id);
    const chain = NECRO_STORY.some((s) => s.quest === id)
      ? NECRO_STORY.filter((s) => needed.has(s.quest)).map((s) => s.quest)
      : [id];
    const open = chain.find((q) => knownUndone(profile, q));
    if (open) return open;
  }
  return undefined;
}

export type StoryRow = { quest: StoryStep; state: "done" | "next" | "locked"; reqs: Req[] };

/** The storyline in order. "next" is the first required quest not done; optional quests are never next. */
export function storyProgress(profile: Profile): StoryRow[] {
  const steps = NECRO_STORY.filter((s) => !isFree(profile) || !s.members);
  const next = steps.find((s) => !s.optional && !done(profile, s.quest));
  return steps.map((step) => ({
    quest: step,
    state: done(profile, step.quest) ? "done" : step === next ? "next" : "locked",
    reqs: questReqs(profile, step.quest),
  }));
}

export type SoulLine = {
  souls?: number;
  next?: { souls: number; unlocks: string; status: LevelStatus };
};

/**
 * Recorded souls against the next soul gate. A gate that starts a storyline quest stays next until that quest is done,
 * so 3,200 souls before The Spirit of War show the 3,000 gate met. Other gates are next while the souls are below them
 * or unrecorded. Unrecorded souls are unknown, never 0. Free-to-play has no souls line.
 */
export function soulStatus(profile: Profile): SoulLine | undefined {
  if (isFree(profile)) return undefined;
  const souls = profile.necromancy?.souls;
  const gate = SOUL_GATES.find((g) => {
    const quest = NECRO_STORY.find((s) => s.souls === g.souls)?.quest;
    return quest ? !done(profile, quest) : souls === undefined || souls < g.souls;
  });
  return {
    souls,
    next: gate && { souls: gate.souls, unlocks: gate.unlocks, status: levelStatus(souls, gate.souls) },
  };
}

const LINE_NAMES: Record<UpgradeStep["line"], string> = {
  weapon: "Weapon",
  deathwarden: "Deathwarden",
  deathdealer: "Deathdealer",
};

/** A line's upgrade steps in tier order. Deathdealer branches from the Deathwarden tier below its first one. */
function ladder(line: GearLine, robeLine: RobeLine): UpgradeStep[] {
  const steps = (l: UpgradeStep["line"]) => NECRO_UPGRADES.filter((s) => s.line === l).sort((a, b) => a.tier - b.tier);
  if (line === "weapon") return steps("weapon");
  if (robeLine === "deathwarden") return steps("deathwarden");
  const dealer = steps("deathdealer");
  return [...steps("deathwarden").filter((s) => s.tier < dealer[0].tier), ...dealer];
}

const wearMet = (profile: Profile, step: UpgradeStep) =>
  step.wear.every((w) => levelStatus(profile.levels[w.skill], w.level) === "met");

/**
 * The tier the levels and quests allow when none is recorded: up the ladder while each step's wear levels are met and
 * none of its quests is known to be not done (Kili tasks aren't visible, so they don't count). This stops at tier 60
 * while The Spirit of War is known not done. Unknown quest status (a private quest import) leaves the wear levels alone.
 */
function assumedTier(profile: Profile, steps: UpgradeStep[]): number {
  let tier = steps[0].tier;
  for (const step of steps) {
    if (!wearMet(profile, step) || step.quests.some((q) => knownUndone(profile, q))) break;
    tier = step.tier;
  }
  return tier;
}

/** The quest a step's Kili task is, when the task is a quest (Kili Row). */
const taskQuest = (step: UpgradeStep) => step.quests.find((q) => questName(q) === step.task);

function stepReqs(profile: Profile, step: UpgradeStep, steps: UpgradeStep[]): Req[] {
  const before = steps[steps.indexOf(step) - 1];
  return [
    ...step.wear.map((w) => skillReq(profile, w.skill, w.level)),
    // The step is next only once the tier below is reached, so the branch requirement is met.
    ...(before && before.line !== step.line ? [{ label: `${LINE_NAMES[before.line]} tier ${before.tier}`, status: "met" as const }] : []),
    ...(step.task && !taskQuest(step) ? [check(step.task)] : []),
    ...step.quests.map((q) => questReq(profile, q)),
    ...step.materials.map(materialReq),
  ];
}

export type Endgame = { boss: string; target: EndgameTarget; reqs: Req[] };

/**
 * The tier 95 boss for a finished line: of the bosses whose drop the player can wield, the first whose requirements are
 * all met, else the first.
 */
function endgameFor(profile: Profile, line: GearLine): Endgame | undefined {
  const bosses = ENDGAME_TARGETS.filter(
    (t) => t.lines.includes(line) && (t.wield === undefined || levelStatus(profile.levels.Necromancy, t.wield) === "met"),
  ).map((target) => ({
    boss: target.boss,
    target,
    reqs: [
      ...target.quests.map((q) => questReq(profile, q)),
      ...target.skills.map((s) => skillReq(profile, s.skill, s.level)),
    ],
  }));
  return bosses.find((b) => b.reqs.every((r) => r.status === "met")) ?? bosses[0];
}

export type GearPath = {
  current: number;
  /** True when the tier isn't recorded and is worked out from levels and quests. */
  assumed: boolean;
  robeLine: RobeLine;
  next?: { step: UpgradeStep; reqs: Req[] };
  endgame?: Endgame;
};

/**
 * Where a gear line stands and its next step. A recorded tier wins; otherwise it's assumed from levels and quests. The
 * robe line defaults to Deathwarden. Free-to-play stops at tier 10, with no endgame.
 */
export function gearPath(profile: Profile, line: GearLine): GearPath {
  const robeLine = profile.necromancy?.robeLine ?? "deathwarden";
  const steps = ladder(line, robeLine).filter((s) => !isFree(profile) || !s.members);
  const recorded = line === "weapon" ? profile.necromancy?.weaponTier : profile.necromancy?.robeTier;
  const current = recorded === undefined ? assumedTier(profile, steps) : Math.min(recorded, steps.at(-1)!.tier);
  const path: GearPath = { current, assumed: recorded === undefined, robeLine };
  const step = steps.find((s) => s.tier > current);
  if (step) return { ...path, next: { step, reqs: stepReqs(profile, step, steps) } };
  const endgame = isFree(profile) ? undefined : endgameFor(profile, line);
  return endgame ? { ...path, endgame } : path;
}

/** The ritual that makes a step's ensouled materials. */
const ensoulRitual = (step: UpgradeStep) =>
  NECRO_RITUALS.find((r) => r.outputs.some((o) => step.materials.some((m) => m.item === o.item)));

export type Progress = { text: string; target?: string; reqs: Req[] };

/** What moves a step forward: an open quest, then the Kili task, then a boss drop, then the ensoul ritual. */
function stepProgress(profile: Profile, step: UpgradeStep): Progress | undefined {
  const quest = firstOpenQuest(profile, step.quests);
  if (quest) return { text: `Complete ${questName(quest)}`, target: questName(quest), reqs: questReqs(profile, quest) };
  const target = PROGRESS_TARGETS[progressKey(step.line, step.tier)];
  const drop = target?.drop;
  const dropReq = drop ? [check(`${count(drop.qty)} × ${drop.item}`)] : [];
  if (step.task && !taskQuest(step))
    return {
      text: `Finish ${step.task}`,
      target: step.task,
      reqs: [...(target?.targets ?? []).map((t) => check(t.name)), ...dropReq, ...step.materials.map(materialReq)],
    };
  if (drop) return { text: `Kill ${drop.from.name} for ${drop.item}`, target: drop.from.wiki, reqs: dropReq };
  const ritual = ensoulRitual(step);
  if (ritual) return { text: `Run ${ritual.name}`, target: ritual.name, reqs: step.materials.map(materialReq) };
  return undefined;
}

function endgameProgress(profile: Profile, endgame: Endgame): Progress {
  const quest = firstOpenQuest(profile, endgame.target.quests);
  if (quest) return { text: `Complete ${questName(quest)}`, target: questName(quest), reqs: questReqs(profile, quest) };
  return { text: `Kill ${endgame.boss}`, target: endgame.target.wiki, reqs: endgame.reqs };
}

export type XpRow = { option: TrainingOption; alt?: TrainingOption; range: string; target: XpTarget };

/** The XP target for the player's level, resolved in the stage the app picks for that level (option ids repeat). */
function xpRow(profile: Profile): XpRow | undefined {
  const level = plannedLevel(profile);
  const targets = XP_TARGETS.filter((t) => !isFree(profile) || !t.members);
  const target = targets.find((t) => level >= t.from && level < t.to) ?? targets.at(-1);
  if (!target) return undefined;
  // The player's picked range would resolve the id in another stage, so plan from the level alone.
  const { trainingRanges: _picked, ...rest } = profile;
  const stage = trainingStage(NECROMANCY, { ...rest, levels: { ...profile.levels, Necromancy: level } });
  const options = stage ? availableTrainingOptions(stage, profile.mode) : [];
  const option = options.find((o) => o.id === target.optionId);
  if (!option) return undefined;
  const alt = target.altOptionId ? options.find((o) => o.id === target.altOptionId) : undefined;
  // Inclusive, like trainingRangeLabel: ranges are [from, to), except each mode's last one, which also covers its `to`.
  const end = target === targets.at(-1) ? target.to : target.to - 1;
  return { option, ...(alt ? { alt } : {}), range: `${target.from}–${end}`, target };
}

/**
 * What to kill next: the XP target, and the weapon line's next progress target (its endgame boss once tier 90 is
 * done). Free-to-play has no progress row.
 */
export function killNext(profile: Profile): { xp?: XpRow; progress?: Progress } {
  const xp = xpRow(profile);
  const row = xp ? { xp } : {};
  if (isFree(profile)) return row;
  const weapon = gearPath(profile, "weapon");
  const progress = weapon.next
    ? stepProgress(profile, weapon.next.step)
    : weapon.endgame && endgameProgress(profile, weapon.endgame);
  return progress ? { ...row, progress } : row;
}

export type Rituals = {
  /** One entry per recipe; rituals with several recipes share a name. */
  now: Ritual[];
  next?: Ritual;
  siteTier: 1 | 2 | 3;
  inks: string[];
  /** The id of the ensoul ritual that makes the next weapon step's materials. */
  forNextUpgrade?: string;
};

/**
 * Rituals the player can run now (level reached and unlocking quest done) and the next one to unlock. Free-to-play sees
 * only free rituals up to the free cap whose quest is free too.
 */
export function ritualsFor(profile: Profile): Rituals {
  const level = plannedLevel(profile);
  const gate = (r: Ritual) => RITUAL_QUESTS[r.name]?.quest;
  const shown = NECRO_RITUALS.filter((r) => {
    if (!isFree(profile)) return true;
    const quest = gate(r);
    return !r.members && r.level <= FREE_CAP && !(quest && questsById.get(quest)?.members);
  });
  const runnable = (r: Ritual) => r.level <= level && (gate(r) === undefined || !knownUndone(profile, gate(r)!));
  const now = shown.filter(runnable);
  const next = shown.filter((r) => !runnable(r)).sort((a, b) => a.level - b.level)[0];
  const inks = [...NECRO_GLYPHS]
    .filter((g) => g.level <= level)
    .sort((a, b) => a.level - b.level)
    .map((g) => g.ink);
  const upgrade = isFree(profile) ? undefined : gearPath(profile, "weapon").next?.step;
  const forNextUpgrade = upgrade && ensoulRitual(upgrade)?.id;
  return {
    now,
    ...(next ? { next } : {}),
    siteTier: now.reduce<1 | 2 | 3>((tier, r) => (r.tier > tier ? r.tier : tier), 1),
    inks: [...new Set(inks)],
    ...(forNextUpgrade ? { forNextUpgrade } : {}),
  };
}
