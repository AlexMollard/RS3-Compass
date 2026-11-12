import { isRecord } from "../guards.ts";
import { LruMap } from "../lru.ts";
import { createClientLimiter } from "./rateLimit.ts";
import { upstreamInit } from "./upstream.ts";

const ENDPOINT = "https://api.weirdgloop.org/exchange/history/rs/latest";
const USER_AGENT = "RS3 Compass public Grand Exchange lookup";
export const PRICE_CACHE_MS = 3_600_000;
export const MAX_PRICE_NAMES = 100;
const MAX_CACHED_NAMES = 2000;
// A boss page makes one request per drop-version switch.
const PRICE_REQUESTS_PER_MINUTE = 30;

export class PriceLookupError extends Error {
  readonly status: number;
  readonly retryAfter?: number;
  constructor(message: string, status: number, retryAfter?: number) {
    super(message);
    this.name = "PriceLookupError";
    this.status = status;
    this.retryAfter = retryAfter;
  }
}

type Entry = { price: number | null; fetchedAt: number };

export function createPriceLookup({
  fetch,
  now,
  ttlMs = PRICE_CACHE_MS,
}: {
  fetch: typeof globalThis.fetch;
  now: () => number;
  ttlMs?: number;
}) {
  const cache = new LruMap<string, Entry>(MAX_CACHED_NAMES);
  const take = createClientLimiter(PRICE_REQUESTS_PER_MINUTE);

  async function prices(
    names: string[],
    client?: string,
  ): Promise<Record<string, number>> {
    const wanted = [...new Set(names)].slice(0, MAX_PRICE_NAMES);
    if (!wanted.length) return {};
    const time = now();
    if (client) {
      const retryAfter = take(client, time);
      if (retryAfter !== undefined)
        throw new PriceLookupError(
          "Too many price requests. Try again shortly.",
          429,
          retryAfter,
        );
    }
    const stale = wanted.filter((name) => {
      const entry = cache.peek(name);
      return !entry || time - entry.fetchedAt > ttlMs;
    });
    if (stale.length) {
      let body: unknown;
      try {
        const response = await fetch(
          `${ENDPOINT}?name=${stale.map(encodeURIComponent).join("|")}`,
          upstreamInit("application/json", USER_AGENT),
        );
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        body = await response.json();
      } catch {
        throw new PriceLookupError("Prices unavailable", 502);
      }
      if (!isRecord(body)) throw new PriceLookupError("Prices unavailable", 502);
      const fetchedAt = now();
      for (const name of stale) {
        const row = body[name];
        const price = isRecord(row) ? row.price : undefined;
        cache.set(name, {
          price: typeof price === "number" ? price : null,
          fetchedAt,
        });
      }
    }
    const result: Record<string, number> = {};
    for (const name of wanted) {
      const price = cache.get(name)?.price;
      if (typeof price === "number") result[name] = price;
    }
    return result;
  }

  return { prices };
}

export const priceLookupService = createPriceLookup({
  fetch: (input, init) => fetch(input, init),
  now: Date.now,
});
