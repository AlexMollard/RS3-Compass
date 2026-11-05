import { normalizePlayerName } from "./playerName.ts";
import { isPlayerLookup } from "./playerData.ts";
import type { PlayerLookup } from "./playerTypes";

export async function fetchPlayer(
  name: string,
  signal?: AbortSignal,
): Promise<PlayerLookup> {
  const normalized = normalizePlayerName(name);
  const response = await fetch(
    `/api/player?name=${encodeURIComponent(normalized)}&schema=3`,
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
  if (
    !isPlayerLookup(data) ||
    normalizePlayerName(data.name).toLocaleLowerCase("en") !==
      normalized.toLocaleLowerCase("en")
  ) {
    throw new Error(
      "The player service returned invalid player data. Existing progress has not been changed.",
    );
  }
  return data;
}
