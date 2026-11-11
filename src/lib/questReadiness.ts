import type { Profile, QuestRecord } from "../data.ts";
import { QUEST_COMBAT } from "../combatData.ts";
import { levelStatus } from "./levelStatus.ts";
import { packKey } from "./packing.ts";
import { questStatus, type QuestStatus } from "./questMap.ts";

export interface QuestReadiness {
  levels: { met: number; total: number; unknown: number };
  pack: { packed: number; total: number };
  danger: string | null;
}

type Inputs = Pick<Profile, "levels" | "packed" | "completedQuests">;

export function questReadiness(
  quest: Pick<QuestRecord, "id" | "requirements" | "supplies">,
  profile: Pick<Profile, "levels" | "packed">,
): QuestReadiness {
  const required = quest.requirements.filter((r) => !r.recommended);
  let met = 0;
  let unknown = 0;
  for (const { skill, level } of required) {
    const status = levelStatus(profile.levels[skill], level);
    if (status === "unknown") unknown++;
    else if (status === "met") met++;
  }
  const packed = quest.supplies.filter((line) =>
    profile.packed.includes(packKey(quest.id, line)),
  ).length;
  const plan = QUEST_COMBAT[quest.id];
  let danger: string | null = null;
  let top = -Infinity;
  for (const enemy of [...(plan?.required ?? []), ...(plan?.hazards ?? [])]) {
    // string levels (e.g. "varies") rank below every number but still name a danger
    const rank = typeof enemy.level === "number" ? enemy.level : -1;
    if (rank > top) {
      top = rank;
      danger = enemy.name;
    }
  }
  return {
    levels: { met, total: required.length, unknown },
    pack: { packed, total: quest.supplies.length },
    danger,
  };
}

/**
 * Whether the player can start a quest now: "ready" needs every earlier quest done and every
 * required level met (an unrecorded level counts as met); "levels" is short only on levels.
 */
export function questStartStatus(
  quest: Pick<QuestRecord, "id" | "requirements" | "supplies" | "questRequirements">,
  profile: Pick<Profile, "levels" | "packed">,
  completed: ReadonlySet<string>,
): QuestStatus {
  const status = questStatus(quest, completed);
  if (status !== "ready") return status;
  const { met, unknown, total } = questReadiness(quest, profile).levels;
  return met + unknown === total ? "ready" : "levels";
}

/** The quest page's one-line status, most blocking first. */
export function questStartMessage(s: {
  complete: boolean;
  membersOnly: boolean;
  levelsShort: number;
  earlierLeft: number;
  packed: number;
  supplies: number;
}): string {
  if (s.complete) return "Marked complete in Compass.";
  if (s.membersOnly) return "Members quest. Switch to Members planning to play it.";
  if (s.levelsShort > 0)
    return `${s.levelsShort} level ${s.levelsShort === 1 ? "check is" : "checks are"} below target.`;
  if (s.earlierLeft > 0)
    return `${s.earlierLeft} earlier quest${s.earlierLeft === 1 ? "" : "s"} to finish first.`;
  if (s.packed < s.supplies) return `${s.packed} of ${s.supplies} items packed.`;
  return "Ready to start. Follow the walkthrough on the Wiki.";
}

export function closeToUnlocking(
  quests: QuestRecord[],
  profile: Inputs,
  within = 5,
  limit = 4,
): { quest: QuestRecord; skill: string; have: number; need: number }[] {
  const found: { quest: QuestRecord; skill: string; have: number; need: number }[] = [];
  for (const quest of quests) {
    if (profile.completedQuests.includes(quest.id)) continue;
    for (const { skill, level: need, recommended } of quest.requirements) {
      const have = profile.levels[skill];
      if (recommended || have === undefined) continue;
      if (have < need && have >= need - within)
        found.push({ quest, skill, have, need });
    }
  }
  // Array.prototype.sort is stable, so ties keep quest order
  return found.sort((a, b) => a.need - a.have - (b.need - b.have)).slice(0, limit);
}
