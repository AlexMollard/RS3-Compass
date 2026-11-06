import type { Profile, QuestRecord } from "../data.ts";
import { QUEST_COMBAT } from "../combatData.ts";

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
    const have = profile.levels[skill];
    if (have === undefined) unknown++;
    else if (have >= level) met++;
  }
  const packed = quest.supplies.filter((line) =>
    profile.packed.includes(quest.id + "::" + line),
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
