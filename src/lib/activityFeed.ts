import { activityCategory } from "./activityPresentation.ts";
import type { PlayerEvent, PlayerImportStatus } from "./playerTypes";

export interface ActivitySource {
  playerId: string;
  name: string;
  events?: PlayerEvent[];
  fetchedAt?: number;
  status?: PlayerImportStatus;
}

export interface ActivityRow {
  key: string;
  playerId: string;
  playerName: string;
  event: PlayerEvent;
  category: string;
}

/** Snapshots contain at most the latest 20 events, not a complete history. */
export function mergeActivity(
  sources: readonly ActivitySource[],
): ActivityRow[] {
  const seen = new Set<string>();
  const rows: ActivityRow[] = [];
  for (const source of sources) {
    for (const event of (source.events ?? []).slice(0, 20)) {
      const key = JSON.stringify([
        source.playerId,
        event.date,
        event.type,
        event.text,
        event.details,
      ]);
      if (seen.has(key)) continue;
      seen.add(key);
      rows.push({
        key,
        playerId: source.playerId,
        playerName: source.name,
        event,
        category: activityCategory(event.type),
      });
    }
  }
  return rows.sort((a, b) => {
    const aTime = Date.parse(a.event.date),
      bTime = Date.parse(b.event.date);
    return (
      (Number.isFinite(bTime) ? bTime : 0) -
        (Number.isFinite(aTime) ? aTime : 0) || a.key.localeCompare(b.key)
    );
  });
}
