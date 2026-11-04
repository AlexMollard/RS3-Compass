import { RS3_SKILL_NAMES } from "../../skillNames.ts";
import { normalizePlayerName } from "../playerName.ts";
import type { PlayerLevels, PlayerLookup } from "../playerTypes.ts";
import { lookupQuests } from "./questLookup.ts";

export const PLAYER_CACHE_MS = 5 * 60 * 1000;
const NEGATIVE_CACHE_MS = 30 * 1000;
const MAX_CACHED_PLAYERS = 128;
const MAX_IN_FLIGHT = 8;
const MAX_UPSTREAM_PER_MINUTE = 60;

export class PlayerLookupError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "PlayerLookupError";
    this.status = status;
  }
}

export function parseHiscores(
  text: string,
  name: string,
  fetchedAt: number,
): PlayerLevels {
  const rows = text.trim().split(/\r?\n/);
  if (rows.length < RS3_SKILL_NAMES.length + 1)
    throw new PlayerLookupError(
      "RuneScape returned incomplete player data. Existing progress has not changed.",
      502,
    );
  const levels: Record<string, number> = {};
  for (let index = 0; index <= RS3_SKILL_NAMES.length; index++) {
    if (!/^-?\d+,-?\d+,-?\d+$/.test(rows[index]))
      throw new PlayerLookupError(
        "RuneScape returned an unexpected player response. Try again later.",
        502,
      );
    const [rank, level, xp] = rows[index].split(",").map(Number);
    if (
      ![rank, level, xp].every(Number.isSafeInteger) ||
      rank < -1 ||
      xp < -1 ||
      level < -1 ||
      (index > 0 && level > 120)
    )
      throw new PlayerLookupError(
        "RuneScape returned invalid player levels. Existing progress has not changed.",
        502,
      );
    // Unranked/undisclosed skills stay unknown rather than becoming fabricated zeroes.
    if (index > 0 && level >= 1) levels[RS3_SKILL_NAMES[index - 1]] = level;
  }
  return { name, levels, fetchedAt };
}

type CacheEntry = { expiresAt: number } & (
  { player: PlayerLookup } | { error: PlayerLookupError }
);

export function createPlayerLookupService(
  fetcher: typeof fetch = fetch,
  now: () => number = Date.now,
) {
  const cache = new Map<string, CacheEntry>();
  const inFlight = new Map<string, Promise<PlayerLookup>>();
  let windowStart = now();
  let upstreamRequests = 0;

  function cacheEntry(key: string, entry: CacheEntry) {
    cache.delete(key);
    cache.set(key, entry);
    while (cache.size > MAX_CACHED_PLAYERS)
      cache.delete(cache.keys().next().value!);
  }

  async function lookup(rawName: unknown): Promise<PlayerLookup> {
    let name: string;
    try {
      name = normalizePlayerName(rawName);
    } catch (error) {
      throw new PlayerLookupError(
        error instanceof Error ? error.message : "Enter a player name.",
        400,
      );
    }
    const key = name.toLocaleLowerCase("en");
    const time = now();
    const cached = cache.get(key);
    if (cached && cached.expiresAt > time) {
      cache.delete(key);
      cache.set(key, cached);
      if ("error" in cached) throw cached.error;
      return cached.player;
    }
    if (cached) cache.delete(key);
    const pending = inFlight.get(key);
    if (pending) return pending;
    if (time - windowStart >= 60_000) {
      windowStart = time;
      upstreamRequests = 0;
    }
    if (
      inFlight.size >= MAX_IN_FLIGHT ||
      upstreamRequests >= MAX_UPSTREAM_PER_MINUTE
    )
      throw new PlayerLookupError(
        "Player lookup is busy. Wait a moment before trying again.",
        429,
      );
    upstreamRequests++;
    const request = (async () => {
      try {
        const url = new URL(
          "https://secure.runescape.com/m=hiscore/index_lite.ws",
        );
        url.searchParams.set("player", name);
        const response = await fetcher(url, {
          signal: AbortSignal.timeout(8000),
          headers: {
            accept: "text/plain",
            "user-agent": "RS3 Compass public Hiscores lookup",
          },
        });
        if (response.status === 404)
          throw new PlayerLookupError(
            "No public RS3 Hiscores entry was found. Check the name; the player may be unranked.",
            404,
          );
        if (!response.ok)
          throw new PlayerLookupError(
            "RuneScape's player service is unavailable. Try again later.",
            502,
          );
        const levels = parseHiscores(await response.text(), name, now());
        const player: PlayerLookup = {
          ...levels,
          quests: await lookupQuests(name, fetcher),
        };
        cacheEntry(key, {
          expiresAt: player.fetchedAt + PLAYER_CACHE_MS,
          player,
        });
        return player;
      } catch (cause) {
        const error =
          cause instanceof PlayerLookupError
            ? cause
            : new PlayerLookupError(
                "RuneScape's player service could not be reached. Try again later.",
                502,
              );
        if (error.status === 404)
          cacheEntry(key, { expiresAt: now() + NEGATIVE_CACHE_MS, error });
        throw error;
      }
    })().finally(() => inFlight.delete(key));
    inFlight.set(key, request);
    return request;
  }
  return { lookup };
}

// Only public game statistics are shared between requests; browser progress never enters this cache.
export const playerLookupService = createPlayerLookupService();
