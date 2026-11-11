import { isRecord, isSafeInteger, isSkillLevelMap } from "./guards.ts";
import { isFetchedAt } from "./playerData.ts";
import { playerKey } from "./playerName.ts";
import type { GroupLookup, GroupQuery, GroupSize } from "./groupTypes.ts";

export function normalizeGroupQuery(value: unknown): GroupQuery {
  if (!isRecord(value) || typeof value.name !== "string") {
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
  if (!isRecord(value)) return false;
  try {
    normalizeGroupQuery(value);
  } catch {
    return false;
  }
  if (
    !isSafeInteger(value.id, 1) ||
    typeof value.founder !== "boolean" ||
    (value.rank !== undefined && !isSafeInteger(value.rank, 1)) ||
    !isSafeInteger(value.totalLevel, 1) ||
    !isSafeInteger(value.totalXp) ||
    !isFetchedAt(value.fetchedAt) ||
    !Array.isArray(value.members) ||
    value.members.length === 0 ||
    value.members.length > (value.size as number)
  )
    return false;
  const names = new Set<string>();
  for (const member of value.members) {
    if (!isRecord(member) || typeof member.name !== "string") return false;
    let name: string;
    try {
      name = playerKey(member.name);
    } catch {
      return false;
    }
    if (names.has(name)) return false;
    names.add(name);
    if (
      (member.totalLevel !== undefined &&
        !isSafeInteger(member.totalLevel, 1)) ||
      (member.totalXp !== undefined && !isSafeInteger(member.totalXp))
    )
      return false;
    if (
      member.levels !== undefined &&
      (!isSkillLevelMap(member.levels) ||
        Object.keys(member.levels).length === 0)
    )
      return false;
  }
  return true;
}
