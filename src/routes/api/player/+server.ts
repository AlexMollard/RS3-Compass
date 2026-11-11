import { json } from "@sveltejs/kit";
import type { RequestHandler } from "@sveltejs/kit";
import {
  playerCacheMs,
  PlayerLookupError,
  playerLookupService,
} from "../../../lib/server/playerLookup";

export const GET: RequestHandler = async ({ url, getClientAddress }) => {
  let client: string | undefined;
  try {
    // adapter-node reports the socket peer unless ADDRESS_HEADER (and XFF_DEPTH)
    // are set; on Deno Deploy they may be needed to see real client IPs rather
    // than the proxy's. It throws when they do not match the request.
    client = getClientAddress();
  } catch {
    // Without an address, only the shared upstream budget applies.
  }
  try {
    const player = await playerLookupService.lookup(
      url.searchParams.get("name"),
      client,
    );
    const remaining = Math.max(
      0,
      Math.floor(
        (player.fetchedAt + playerCacheMs(player) - Date.now()) / 1000,
      ),
    );
    return json(player, {
      headers: {
        "cache-control": `public, max-age=${remaining}, s-maxage=${remaining}`,
      },
    });
  } catch (cause) {
    const error =
      cause instanceof PlayerLookupError
        ? cause
        : new PlayerLookupError(
            "Player lookup is unavailable. Existing progress has not changed.",
            502,
          );
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
