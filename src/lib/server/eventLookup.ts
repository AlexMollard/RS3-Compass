import type { PlayerEvent, PlayerEventsImport } from "../playerTypes.ts";
import { isRecord } from "../guards.ts";
import { isPlayerEvent } from "../playerData.ts";
import { samePlayerName } from "../playerName.ts";
import { adventurerError, fetchAdventurer } from "./adventurerLookup.ts";

export function parseEventResponse(value: unknown): PlayerEventsImport {
  const unavailable = (): PlayerEventsImport => ({
    status: "unavailable",
    reason: adventurerError(value),
  });
  if (!isRecord(value)) return unavailable();
  const response = value;
  if (
    typeof response.name !== "string" ||
    !response.name.trim() ||
    !Array.isArray(response.events) ||
    response.events.length > 20
  )
    return unavailable();
  const events: PlayerEvent[] = [];
  for (const event of response.events) {
    if (!isPlayerEvent(event)) return unavailable();
    // Copy only the known fields.
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
