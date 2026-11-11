// Shared checks for untrusted data: Jagex responses and saved progress.
import { isSkillName } from "../skillNames.ts";

/** The largest time a Date can hold, in milliseconds. */
export const MAX_DATE_MS = 8_640_000_000_000_000;

/** A plain object: not null and not an array. */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

/** A safe integer of at least `min`. */
export function isSafeInteger(value: unknown, min = 0): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= min;
}

/** A skill level: an integer from 1 to 120. */
export function isSkillLevel(value: unknown): value is number {
  return isSafeInteger(value, 1) && value <= 120;
}

/** Skill name to level. Callers that need a non-empty map check that themselves. */
export function isSkillLevelMap(
  value: unknown,
): value is Record<string, number> {
  return (
    isRecord(value) &&
    Object.entries(value).every(
      ([name, level]) => isSkillName(name) && isSkillLevel(level),
    )
  );
}
