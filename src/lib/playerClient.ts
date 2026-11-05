import { normalizePlayerName } from "./playerName.ts";
import { isPlayerLookup } from "./playerData.ts";
import type { PlayerLookup } from "./playerTypes";

export class PlayerFetchError extends Error {
  readonly retryAfterMs?: number;

  constructor(message: string, retryAfterMs?: number) {
    super(message);
    this.name = "PlayerFetchError";
    this.retryAfterMs = retryAfterMs;
  }
}

export async function fetchPlayer(
  name: string,
  signal?: AbortSignal,
): Promise<PlayerLookup> {
  const normalized = normalizePlayerName(name);
  const response = await fetch(
    `/api/player?name=${encodeURIComponent(normalized)}&schema=4`,
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
    const seconds = Number(response.headers.get("retry-after"));
    throw new PlayerFetchError(
      message,
      response.status === 429
        ? Number.isFinite(seconds) && seconds > 0
          ? Math.min(seconds, 3600) * 1000
          : 60_000
        : undefined,
    );
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
