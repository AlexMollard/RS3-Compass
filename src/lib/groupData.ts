import { RS3_SKILL_NAMES } from "../skillNames.ts";
import { normalizePlayerName } from "./playerName.ts";
import type { GroupLookup, GroupQuery, GroupSize } from "./groupTypes.ts";

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function integer(value: unknown, minimum = 0): value is number {
  return (
    typeof value === "number" && Number.isSafeInteger(value) && value >= minimum
  );
}

export function normalizeGroupQuery(value: unknown): GroupQuery {
  if (!record(value) || typeof value.name !== "string") {
    throw new Error("Enter a Group Ironman name.");
  }
  const name = value.name.trim().replace(/ +/g, " ");
  if (
    !name ||
    name.length > 25 ||
    /[\p{Cc}\p{Cs}]/u.test(value.name) ||
    name === "." ||
    name === ".."
  ) {
    throw new Error("Enter a valid Group Ironman name of up to 25 characters.");
  }
  if (
    ![2, 3, 4, 5].includes(value.size as number) ||
    typeof value.isCompetitive !== "boolean"
  ) {
    throw new Error("Choose a group size from 2 to 5 and a group type.");
  }
  return {
    name,
    size: value.size as GroupSize,
    isCompetitive: value.isCompetitive,
  };
}

export function isGroupLookup(value: unknown): value is GroupLookup {
  if (!record(value)) return false;
  try {
    normalizeGroupQuery(value);
  } catch {
    return false;
  }
  if (
    !integer(value.id, 1) ||
    typeof value.founder !== "boolean" ||
    (value.rank !== undefined && !integer(value.rank, 1)) ||
    !integer(value.totalLevel, 1) ||
    !integer(value.totalXp) ||
    !integer(value.fetchedAt) ||
    value.fetchedAt > 8_640_000_000_000_000 ||
    !Array.isArray(value.members) ||
    value.members.length === 0 ||
    value.members.length > (value.size as number)
  )
    return false;
  const names = new Set<string>();
  for (const member of value.members) {
    if (!record(member) || typeof member.name !== "string") return false;
    let name: string;
    try {
      name = normalizePlayerName(member.name).toLocaleLowerCase("en");
    } catch {
      return false;
    }
    if (names.has(name)) return false;
    names.add(name);
    if (
      (member.totalLevel !== undefined && !integer(member.totalLevel, 1)) ||
      (member.totalXp !== undefined && !integer(member.totalXp))
    )
      return false;
    if (
      member.levels !== undefined &&
      (!record(member.levels) ||
        Object.keys(member.levels).length === 0 ||
        !Object.entries(member.levels).every(
          ([skill, level]) =>
            (RS3_SKILL_NAMES as readonly string[]).includes(skill) &&
            integer(level, 1) &&
            level <= 120,
        ))
    )
      return false;
  }
  return true;
}
