import { SKILLS } from "../data.ts";
import { SKILL_GAME_ORDER } from "../skillNames.ts";

export interface LevelChange {
  skill: string;
  from: number | null;
  to: number | null;
}

const caps = new Map(SKILLS.map((skill) => [skill.name, skill.maxLevel]));

/**
 * Lists recorded-level edits in in-game order. Blank ("") means unknown and
 * removes the level; it never becomes 0. Values above a skill's cap clamp to
 * it, and anything else that is not a whole level of at least 1 is ignored.
 */
export function levelChanges(
  before: Record<string, number>,
  after: Record<string, number | string>,
): LevelChange[] {
  const changes: LevelChange[] = [];
  for (const skill of SKILL_GAME_ORDER) {
    if (!(skill in after)) continue;
    const raw = after[skill];
    const from = before[skill] ?? null;
    let to: number | null;
    if (typeof raw === "string" && raw.trim() === "") to = null;
    else {
      const value = typeof raw === "number" ? raw : Number(raw.trim());
      if (!Number.isInteger(value) || value < 1) continue;
      to = Math.min(value, caps.get(skill) ?? 120);
    }
    if (to !== from) changes.push({ skill, from, to });
  }
  return changes;
}

/** Applies level changes, deleting unknown levels rather than storing 0. */
export function applyLevelChanges(
  levels: Record<string, number>,
  changes: readonly LevelChange[],
): Record<string, number> {
  const next = { ...levels };
  for (const change of changes) {
    if (change.to === null) delete next[change.skill];
    else next[change.skill] = change.to;
  }
  return next;
}
