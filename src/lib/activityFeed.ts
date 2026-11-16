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

/** The feed's filter chips: a few broad groups over activityCategory's labels. */
export const FILTER_GROUPS = ["Levels", "Drops", "Quests", "Combat", "Other"];

export function filterGroup(category: string): string {
  if (category === "Level gained" || category === "XP milestone")
    return "Levels";
  if (category === "Item drop" || category === "Item found") return "Drops";
  if (category === "Quest completed" || category === "Quest points")
    return "Quests";
  if (category === "Combat" || category === "Dungeoneering") return "Combat";
  return "Other";
}

export interface LevelUp {
  skill: string;
  /** Unknown when Jagex's details text names no level. */
  level?: number;
}

export function levelUp(event: PlayerEvent): LevelUp | undefined {
  if (!event.type.startsWith("rs_plog_levelup")) return undefined;
  const skill = /^Levell?ed up (.+?)\.?$/i.exec(event.text.trim())?.[1];
  if (!skill) return undefined;
  const level = Number(/\blevel (\d+)/i.exec(event.details)?.[1]);
  return { skill, level: level > 0 ? level : undefined };
}

const highlightLevel = (level?: number) => level === 99 || level === 120;

/** Rare drops and level 99 or 120. */
export function isHighlight(event: PlayerEvent): boolean {
  return (
    event.type === "rs_plog_item_drop" || highlightLevel(levelUp(event)?.level)
  );
}

export type FeedItem =
  | { kind: "event"; key: string; row: ActivityRow }
  | {
      kind: "levels";
      key: string;
      playerId: string;
      playerName: string;
      rows: ActivityRow[];
      levels: LevelUp[];
      highlight: boolean;
    };

export interface FeedDay {
  key: string;
  label: string;
  /** Events in the day; a batch of level-ups counts each level. */
  count: number;
  items: FeedItem[];
}

const localDay = (time: number) => {
  const d = new Date(time);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
};

export function dayLabel(time: number, now: number): string {
  if (localDay(time) === localDay(now)) return "Today";
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (localDay(time) === localDay(yesterday.getTime())) return "Yesterday";
  const date = new Date(time);
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year:
      date.getFullYear() === new Date(now).getFullYear()
        ? undefined
        : "numeric",
  });
}

/**
 * Groups newest-first rows by local day and folds back-to-back level-ups by
 * one player on the same day into a single batch.
 */
export function groupActivity(
  rows: readonly ActivityRow[],
  now: number,
): FeedDay[] {
  const days: FeedDay[] = [];
  for (const row of rows) {
    const time = Date.parse(row.event.date);
    const known = Number.isFinite(time);
    const key = known ? localDay(time) : "unknown";
    let day = days.at(-1);
    if (day?.key !== key) {
      day = {
        key,
        label: known ? dayLabel(time, now) : "Date unknown",
        count: 0,
        items: [],
      };
      days.push(day);
    }
    day.count++;
    const level = levelUp(row.event);
    const prev = day.items.at(-1);
    if (level && prev?.kind === "levels" && prev.playerId === row.playerId) {
      prev.rows.push(row);
      prev.levels.push(level);
      prev.highlight ||= highlightLevel(level.level);
      continue;
    }
    const prevLevel = prev?.kind === "event" ? levelUp(prev.row.event) : undefined;
    if (
      level &&
      prevLevel &&
      prev?.kind === "event" &&
      prev.row.playerId === row.playerId
    ) {
      day.items[day.items.length - 1] = {
        kind: "levels",
        key: prev.key,
        playerId: row.playerId,
        playerName: row.playerName,
        rows: [prev.row, row],
        levels: [prevLevel, level],
        highlight: highlightLevel(prevLevel.level) || highlightLevel(level.level),
      };
      continue;
    }
    day.items.push({ kind: "event", key: row.key, row });
  }
  return days;
}

export interface WeekTotals {
  playerId: string;
  name: string;
  levels: number;
  quests: number;
  drops: number;
}

/** Per-player counts over the last 7 days, from the returned events only. */
export function weeklyTotals(
  sources: readonly ActivitySource[],
  now: number,
): WeekTotals[] {
  const since = now - 7 * 24 * 60 * 60 * 1000;
  return sources
    .filter((source) => source.events)
    .map((source) => {
      const recent = mergeActivity([source]).filter(
        (row) => Date.parse(row.event.date) >= since,
      );
      const count = (test: (row: ActivityRow) => boolean) =>
        recent.filter(test).length;
      return {
        playerId: source.playerId,
        name: source.name,
        levels: count((row) => !!levelUp(row.event)),
        quests: count((row) => row.category === "Quest completed"),
        drops: count(
          (row) =>
            row.category === "Item drop" || row.category === "Item found",
        ),
      };
    });
}
