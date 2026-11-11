import type { PlayerImportStatus } from "../playerTypes.ts";
import { upstreamInit } from "./upstream.ts";

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
    upstreamInit("application/json", "RS3 Compass public player lookup"),
  );
  return { value: await response.json(), ok: response.ok };
}
