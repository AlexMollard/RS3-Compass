import type { PlayerEvent, PlayerEventsImport } from "../playerTypes.ts";
import {
  adventurerError,
  fetchAdventurer,
  samePlayerName,
} from "./adventurerLookup.ts";

export function parseEventResponse(value: unknown): PlayerEventsImport {
  const unavailable = (): PlayerEventsImport => ({
    status: "unavailable",
    reason: adventurerError(value),
  });
  if (!value || typeof value !== "object" || Array.isArray(value))
    return unavailable();
  const response = value as Record<string, unknown>;
  if (
    typeof response.name !== "string" ||
    !response.name.trim() ||
    !Array.isArray(response.events) ||
    response.events.length > 20
  )
    return unavailable();
  const events: PlayerEvent[] = [];
  for (const entry of response.events) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry))
      return unavailable();
    const event = entry as Record<string, unknown>;
    if (
      typeof event.type !== "string" ||
      !event.type.trim() ||
      typeof event.date !== "string" ||
      !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(
        event.date,
      ) ||
      !Number.isFinite(Date.parse(event.date)) ||
      typeof event.text !== "string" ||
      typeof event.details !== "string"
    )
      return unavailable();
    if (!event.text.trim()) return unavailable();
    events.push({
      type: event.type,
      date: event.date,
      text: event.text,
      details: event.details,
    });
  }
  return { status: "available", name: response.name, events };
}

export async function lookupEvents(
  name: string,
  fetcher: typeof fetch,
): Promise<PlayerEventsImport> {
  try {
    const { value, ok } = await fetchAdventurer(name, "playerEvents", fetcher);
    const result = ok
      ? parseEventResponse(value)
      : { status: "unavailable" as const, reason: adventurerError(value) };
    return result.status === "available" && !samePlayerName(result.name, name)
      ? { status: "unavailable", reason: "service-unavailable" }
      : result;
  } catch {
    return { status: "unavailable", reason: "service-unavailable" };
  }
}
