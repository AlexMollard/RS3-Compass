import { json } from "@sveltejs/kit";
import type { RequestHandler } from "@sveltejs/kit";
import {
  PriceLookupError,
  priceLookupService,
  PRICE_CACHE_MS,
} from "../../../lib/server/priceLookup";

export const GET: RequestHandler = async ({ url, getClientAddress }) => {
  let client: string | undefined;
  try {
    // See api/player/+server.ts: this throws when ADDRESS_HEADER does not match.
    client = getClientAddress();
  } catch {
    // Without an address, only the cache and upstream timeout protect us.
  }
  const names = (url.searchParams.get("names") ?? "")
    .split("|")
    .map((name) => name.trim())
    .filter(Boolean);
  try {
    const prices = await priceLookupService.prices(names, client);
    const maxAge = Math.floor(PRICE_CACHE_MS / 1000);
    return json(
      { prices },
      {
        headers: {
          "cache-control": `public, max-age=${maxAge}, s-maxage=${maxAge}`,
        },
      },
    );
  } catch (cause) {
    const error =
      cause instanceof PriceLookupError
        ? cause
        : new PriceLookupError("Prices unavailable", 502);
    return json(
      { error: error.message },
      {
        status: error.status,
        headers: {
          "cache-control": "no-store",
          ...(error.status === 429
            ? { "retry-after": String(error.retryAfter ?? 60) }
            : {}),
        },
      },
    );
  }
};
