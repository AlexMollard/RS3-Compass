import {
  isSkillName,
  RS3_SKILL_NAMES,
  type SkillName,
} from "../../skillNames.ts";
import { hasTransientFailure } from "../playerData.ts";
import {
  normalizePlayerName,
  playerKey,
  samePlayerName,
} from "../playerName.ts";
import type {
  PlayerLevels,
  PlayerLookup,
  PlayerSkillStatistics,
} from "../playerTypes.ts";
import { lookupQuests } from "./questLookup.ts";
import { lookupEvents } from "./eventLookup.ts";
import {
  createClientLimiter,
  IN_FLIGHT_RETRY_SECONDS,
  retryAfterSeconds,
} from "./rateLimit.ts";
import { upstreamInit } from "./upstream.ts";

export const PLAYER_CACHE_MS = 10 * 60 * 1000;
export const PLAYER_PARTIAL_CACHE_MS = 30 * 1000;
const NEGATIVE_CACHE_MS = 30 * 1000;
const MAX_CACHED_PLAYERS = 128;
const MAX_IN_FLIGHT = 8;
const MAX_UPSTREAM_PER_MINUTE = 60;

// The public JSON API retains these two names from the shared Hiscores service.
const platformSkillNames: Readonly<Record<string, SkillName>> = {
  Hitpoints: "Constitution",
  Runecraft: "Runecrafting",
};

const hiscoresInit = () =>
  upstreamInit("application/json", "RS3 Compass public Hiscores lookup");

export function playerCacheMs(player: PlayerLookup): number {
  return hasTransientFailure(player)
    ? PLAYER_PARTIAL_CACHE_MS
    : PLAYER_CACHE_MS;
}

export class PlayerLookupError extends Error {
  readonly status: number;
  /** Seconds a 429 asks the caller to wait, when known. */
  readonly retryAfter?: number;
  constructor(message: string, status: number, retryAfter?: number) {
    super(message);
    this.name = "PlayerLookupError";
    this.status = status;
    this.retryAfter = retryAfter;
  }
}

export function parseHiscores(
  value: unknown,
  name: string,
  fetchedAt: number,
): PlayerLevels {
  const invalid = (): never => {
    throw new PlayerLookupError(
      "RuneScape returned incomplete or invalid player data. Existing progress has not changed.",
      502,
    );
  };
  if (!value || typeof value !== "object" || Array.isArray(value))
    return invalid();
  const response = value as Record<string, unknown>;
  if (
    typeof response.name !== "string" ||
    !samePlayerName(response.name, name) ||
    !Array.isArray(response.skills) ||
    !Array.isArray(response.activities)
  )
    return invalid();
  const levels: Record<string, number> = {};
  const skills: Record<string, PlayerSkillStatistics> = {};
  let overall: (PlayerSkillStatistics & { level?: number }) | undefined;
  const seen = new Set<string>();
  const valid = (v: unknown, min: number): v is number =>
    typeof v === "number" && Number.isSafeInteger(v) && (v === -1 || v >= min);
  for (const entry of response.skills) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry))
      return invalid();
    const skill = entry as Record<string, unknown>;
    if (typeof skill.name !== "string" || !skill.name.trim()) return invalid();
    const name = Object.hasOwn(platformSkillNames, skill.name)
      ? platformSkillNames[skill.name]
      : skill.name;
    if (name !== "Overall" && !isSkillName(name)) continue;
    if (
      seen.has(name) ||
      !valid(skill.rank, 1) ||
      !valid(skill.level, 0) ||
      !valid(skill.xp, 0) ||
      (name !== "Overall" && skill.level > 120)
    )
      return invalid();
    seen.add(name);
    const stats: PlayerSkillStatistics = {};
    if (skill.rank !== -1) stats.rank = skill.rank;
    if (skill.xp !== -1) stats.xp = skill.xp;
    if (name === "Overall")
      overall = {
        ...stats,
        ...(skill.level > 0 ? { level: skill.level } : {}),
      };
    else {
      skills[name] = stats;
      if (skill.level > 0) levels[name] = skill.level;
    }
  }
  if (!overall || RS3_SKILL_NAMES.some((skill) => !seen.has(skill)))
    return invalid();
  const activities: PlayerLevels["statistics"]["activities"] = [];
  for (const entry of response.activities) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry))
      return invalid();
    const activity = entry as Record<string, unknown>;
    if (
      typeof activity.name !== "string" ||
      !activity.name.trim() ||
      !valid(activity.rank, 1) ||
      !valid(activity.score, 0)
    )
      return invalid();
    activities.push({
      name: activity.name,
      ...(activity.rank !== -1 ? { rank: activity.rank } : {}),
      ...(activity.score !== -1 ? { score: activity.score } : {}),
    });
  }
  return {
    name,
    levels,
    statistics: { overall, skills, activities },
    fetchedAt,
  };
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
  const requestTimes = new Float64Array(MAX_UPSTREAM_PER_MINUTE);
  let requestHead = 0;
  let requestCount = 0;
  const takeClient = createClientLimiter();
  function cacheEntry(key: string, entry: CacheEntry) {
    cache.delete(key);
    cache.set(key, entry);
    while (cache.size > MAX_CACHED_PLAYERS)
      cache.delete(cache.keys().next().value!);
  }
  const boundedFetch: typeof fetch = (input, init) => {
    const time = now();
    while (requestCount > 0 && time - requestTimes[requestHead] >= 60_000) {
      requestHead = (requestHead + 1) % MAX_UPSTREAM_PER_MINUTE;
      requestCount--;
    }
    if (requestCount >= MAX_UPSTREAM_PER_MINUTE)
      throw new PlayerLookupError(
        "Player lookup is busy. Wait a moment before trying again.",
        429,
        retryAfterSeconds(requestTimes[requestHead], time),
      );
    requestTimes[(requestHead + requestCount) % MAX_UPSTREAM_PER_MINUTE] = time;
    requestCount++;
    return fetcher(input, init);
  };
  /** `client` identifies the caller for its per-client share; omit it to use only the shared budget. */
  async function lookup(
    rawName: unknown,
    client?: string,
  ): Promise<PlayerLookup> {
    let name: string;
    try {
      name = normalizePlayerName(rawName);
    } catch (error) {
      throw new PlayerLookupError(
        error instanceof Error ? error.message : "Enter a player name.",
        400,
      );
    }
    const key = playerKey(name);
    const cached = cache.get(key);
    if (cached && cached.expiresAt > now()) {
      cache.delete(key);
      cache.set(key, cached);
      if ("error" in cached) throw cached.error;
      return cached.player;
    }
    if (cached) cache.delete(key);
    const pending = inFlight.get(key);
    if (pending) return pending;
    if (inFlight.size >= MAX_IN_FLIGHT)
      throw new PlayerLookupError(
        "Player lookup is busy. Wait a moment before trying again.",
        429,
        IN_FLIGHT_RETRY_SECONDS,
      );
    const clientWait =
      client === undefined ? undefined : takeClient(client, now());
    if (clientWait !== undefined)
      throw new PlayerLookupError(
        "Too many player lookups from this connection. Wait a moment before trying again.",
        429,
        clientWait,
      );
    const request = (async () => {
      let rateLimited = false;
      let retryAfter: number | undefined;
      const notFound = new Set<string>();
      const sourceFetch: typeof fetch = async (input, init) => {
        try {
          const response = await boundedFetch(input, init);
          if (response.status === 429) rateLimited = true;
          if (response.status === 404)
            notFound.add(new URL(String(input)).pathname);
          return response;
        } catch (error) {
          if (error instanceof PlayerLookupError && error.status === 429) {
            rateLimited = true;
            retryAfter = error.retryAfter;
          }
          throw error;
        }
      };
      const hiscores = async (): Promise<{
        status: "available" | "unranked-or-unavailable" | "service-unavailable";
        data?: PlayerLevels;
      }> => {
        try {
          const url = new URL(
            "https://secure.runescape.com/m=hiscore/index_lite.json",
          );
          url.searchParams.set("player", name);
          const response = await sourceFetch(url, hiscoresInit());
          if (response.status === 404)
            return { status: "unranked-or-unavailable" };
          if (!response.ok) return { status: "service-unavailable" };
          return {
            status: "available",
            data: parseHiscores(await response.json(), name, now()),
          };
        } catch {
          return { status: "service-unavailable" };
        }
      };
      // Ironmen, hardcore included, are ranked on the Ironman Hiscores; a player
      // ranked on the main table but missing there is not an Ironman. Group
      // Ironmen are not listed there either, so callers keep a group setting.
      const ironman = async (): Promise<boolean | undefined> => {
        try {
          const url = new URL(
            "https://secure.runescape.com/m=hiscore_ironman/index_lite.json",
          );
          url.searchParams.set("player", name);
          const response = await sourceFetch(url, hiscoresInit());
          return response.ok ? true : response.status === 404 ? false : undefined;
        } catch {
          return undefined;
        }
      };
      const [[scores, isIronman], quests, events] = await Promise.all([
        hiscores().then(
          async (s) => [s, s.data ? await ironman() : undefined] as const,
        ),
        lookupQuests(name, sourceFetch),
        lookupEvents(name, sourceFetch),
      ]);
      if (
        !scores.data &&
        quests.status !== "available" &&
        events.status !== "available"
      ) {
        const missingAux = (endpoint: string, reason: string) =>
          reason === "private-or-unavailable" ||
          [...notFound].some((path) => path.includes(`/${endpoint}/`));
        const allMissing =
          scores.status === "unranked-or-unavailable" &&
          missingAux("playerQuests", quests.reason) &&
          missingAux("playerEvents", events.reason);
        const error = rateLimited
          ? new PlayerLookupError(
              "Player lookup is busy. Wait a moment before trying again.",
              429,
              retryAfter,
            )
          : allMissing
            ? new PlayerLookupError(
                "No public RS3 player data was found. Check the name; the player may be unranked or private.",
                404,
              )
            : new PlayerLookupError(
                "RuneScape's player service is unavailable. Try again later.",
                502,
              );
        if (error.status === 404)
          cacheEntry(key, { expiresAt: now() + NEGATIVE_CACHE_MS, error });
        throw error;
      }
      const fetchedAt = now();
      const player: PlayerLookup = {
        ...(scores.data ?? {
          name,
          levels: {},
          statistics: { overall: {}, skills: {}, activities: [] },
          fetchedAt,
        }),
        name:
          quests.status === "available"
            ? quests.name
            : events.status === "available"
              ? events.name
              : scores.data!.name,
        fetchedAt,
        hiscoresImportStatus: scores.status,
        ...(isIronman === undefined ? {} : { ironman: isIronman }),
        quests,
        events,
      };
      cacheEntry(key, {
        expiresAt: fetchedAt + playerCacheMs(player),
        player,
      });
      return player;
    })().finally(() => inFlight.delete(key));
    inFlight.set(key, request);
    return request;
  }
  return { lookup };
}

// Only public game statistics are shared between requests; browser progress never enters this cache.
export const playerLookupService = createPlayerLookupService();
