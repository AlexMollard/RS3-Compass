import { isGroupLookup, normalizeGroupQuery } from "./groupData.ts";
import type { GroupLookup, GroupQuery } from "./groupTypes.ts";

export async function fetchGroup(
  query: GroupQuery,
  signal?: AbortSignal,
): Promise<GroupLookup> {
  const normalized = normalizeGroupQuery(query);
  const params = new URLSearchParams({
    name: normalized.name,
    size: String(normalized.size),
    competitive: String(normalized.isCompetitive),
  });
  const response = await fetch(`/api/group?${params}`, { signal });
  const data: unknown = await response.json();
  if (!response.ok) {
    const message =
      data &&
      typeof data === "object" &&
      "error" in data &&
      typeof data.error === "string"
        ? data.error
        : "Group lookup is unavailable. Try again later.";
    throw new Error(message);
  }
  if (
    !isGroupLookup(data) ||
    normalizeGroupQuery(data).name.toLocaleLowerCase("en") !==
      normalized.name.toLocaleLowerCase("en") ||
    data.size !== normalized.size ||
    data.isCompetitive !== normalized.isCompetitive
  ) {
    throw new Error(
      "The group service returned invalid group data. Existing progress has not been changed.",
    );
  }
  return data;
}
