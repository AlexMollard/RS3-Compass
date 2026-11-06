import { SKILLS } from "../data.ts";
import { SKILL_GAME_ORDER } from "../skillNames.ts";

export interface LevelChange {
  skill: string;
  from: number | null;
  to: number | null;
}

const caps = new Map(SKILLS.map((skill) => [skill.name, skill.maxLevel]));

/**
 * Reads a typed level. Blank means unknown (""); whole digits from 1 to the
 * cap are a level; anything else, including out of range, is invalid (null).
 */
export function parseLevel(raw: string, cap: number): number | "" | null {
  const text = raw.trim();
  if (text === "") return "";
  if (!/^\d+$/.test(text)) return null;
  const value = Number(text);
  return value >= 1 && value <= cap ? value : null;
}

/**
 * Lists recorded-level edits in in-game order. Blank ("") means unknown and
 * removes the level; it never becomes 0. Invalid or out-of-range values are
 * ignored, never clamped.
 */
export function levelChanges(
  before: Record<string, number>,
  after: Record<string, number | string>,
): LevelChange[] {
  const changes: LevelChange[] = [];
  for (const skill of SKILL_GAME_ORDER) {
    if (!(skill in after)) continue;
    const parsed = parseLevel(String(after[skill]), caps.get(skill) ?? 120);
    if (parsed === null) continue;
    const from = before[skill] ?? null;
    const to = parsed === "" ? null : parsed;
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
