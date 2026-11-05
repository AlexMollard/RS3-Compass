import type { PlayerImportStatus } from "../playerTypes.ts";
import { normalizePlayerName } from "../playerName.ts";

export function samePlayerName(a: string, b: string): boolean {
  try {
    return (
      normalizePlayerName(a).toLocaleLowerCase("en") ===
      normalizePlayerName(b).toLocaleLowerCase("en")
    );
  } catch {
    return false;
  }
}

export function adventurerError(
  value: unknown,
): Exclude<PlayerImportStatus, "available"> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const error = (value as Record<string, unknown>).error;
    if (error === "PLAYER_NOT_FOUND") return "private-or-unavailable";
    if (error === "PLAYER_NOT_MEMBER") return "not-member";
  }
  return "service-unavailable";
}

export async function fetchAdventurer(
  name: string,
  endpoint: string,
  fetcher: typeof fetch,
): Promise<{ value: unknown; ok: boolean }> {
  const response = await fetcher(
    new URL(
      `https://secure.runescape.com/m=adventurers-log/api/v1/${endpoint}/${encodeURIComponent(name)}`,
    ),
    {
      signal: AbortSignal.timeout(8000),
      headers: {
        accept: "application/json",
        "user-agent": "RS3 Compass public player lookup",
      },
    },
  );
  return { value: await response.json(), ok: response.ok };
}
