import { json } from "@sveltejs/kit";
import type { RequestHandler } from "@sveltejs/kit";
import {
  playerCacheMs,
  PlayerLookupError,
  playerLookupService,
} from "../../../lib/server/playerLookup";

export const GET: RequestHandler = async ({ url }) => {
  try {
    const player = await playerLookupService.lookup(
      url.searchParams.get("name"),
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
          ...(error.status === 429 ? { "retry-after": "60" } : {}),
        },
      },
    );
  }
};
