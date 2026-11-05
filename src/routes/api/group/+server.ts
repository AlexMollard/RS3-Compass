import { json } from "@sveltejs/kit";
import type { RequestHandler } from "@sveltejs/kit";
import {
  GROUP_CACHE_MS,
  GroupLookupError,
  groupLookupService,
} from "../../../lib/server/groupLookup";

export const GET: RequestHandler = async ({ url }) => {
  try {
    const competitive = url.searchParams.get("competitive");
    const size = url.searchParams.get("size");
    const group = await groupLookupService.lookup({
      name: url.searchParams.get("name"),
      size: size && /^[2-5]$/.test(size) ? Number(size) : undefined,
      isCompetitive:
        competitive === "true"
          ? true
          : competitive === "false"
            ? false
            : undefined,
    });
    const remaining = Math.max(
      0,
      Math.floor((group.fetchedAt + GROUP_CACHE_MS - Date.now()) / 1000),
    );
    return json(group, {
      headers: {
        "cache-control": `public, max-age=${remaining}, s-maxage=${remaining}`,
      },
    });
  } catch (cause) {
    const error =
      cause instanceof GroupLookupError
        ? cause
        : new GroupLookupError(
            "Group lookup is unavailable. Existing progress has not changed.",
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
