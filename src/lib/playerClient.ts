import { normalizePlayerName } from "./playerName";
import type { PlayerLookup } from "./playerTypes";

export async function fetchPlayer(
  name: string,
  signal?: AbortSignal,
): Promise<PlayerLookup> {
  const normalized = normalizePlayerName(name);
  const response = await fetch(
    `/api/player?name=${encodeURIComponent(normalized)}&schema=2`,
    { signal },
  );
  const data: unknown = await response.json();
  if (!response.ok) {
    const message =
      data &&
      typeof data === "object" &&
      "error" in data &&
      typeof data.error === "string"
        ? data.error
        : "Player lookup is unavailable. Try again later.";
    throw new Error(message);
  }
  if (!data || typeof data !== "object")
    throw new Error(
      "The player service returned invalid levels. Existing progress has not been changed.",
    );
  const player = data as Partial<PlayerLookup>;
  const quests = player.quests;
  const validQuests =
    quests?.status === "available"
      ? Array.isArray(quests.completedTitles) &&
        quests.completedTitles.every((title) => typeof title === "string")
      : quests?.status === "unavailable" &&
        (quests.reason === "private-or-unavailable" ||
          quests.reason === "service-unavailable");
  if (
    typeof player.name !== "string" ||
    !player.levels ||
    typeof player.levels !== "object" ||
    Array.isArray(player.levels) ||
    !Number.isFinite(player.fetchedAt) ||
    !validQuests ||
    Object.values(player.levels).some(
      (level) => !Number.isInteger(level) || level < 1 || level > 120,
    )
  ) {
    throw new Error(
      "The player service returned invalid player data. Existing progress has not been changed.",
    );
  }
  return player as PlayerLookup;
}
