import { isSkillName } from "../skillNames.ts";
import { normalizePlayerName } from "./playerName.ts";
import type {
  HiscoresImportStatus,
  PlayerEvent,
  PlayerImportStatus,
  PlayerLookup,
  PlayerQuestProgress,
  PlayerStatistics,
} from "./playerTypes.ts";

function record(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function nonnegative(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

function positive(value: unknown): value is number {
  return nonnegative(value) && value > 0;
}

function playerName(value: unknown): value is string {
  try {
    return typeof value === "string" && normalizePlayerName(value).length > 0;
  } catch {
    return false;
  }
}

function skillStatistics(value: unknown): boolean {
  return (
    record(value) &&
    (value.xp === undefined || nonnegative(value.xp)) &&
    (value.rank === undefined || positive(value.rank))
  );
}

export function isFetchedAt(value: unknown): value is number {
  return nonnegative(value) && value <= 8_640_000_000_000_000;
}

export function isPlayerImportStatus(
  value: unknown,
): value is PlayerImportStatus {
  return (
    value === "available" ||
    value === "private-or-unavailable" ||
    value === "not-member" ||
    value === "service-unavailable"
  );
}

export function isHiscoresImportStatus(
  value: unknown,
): value is HiscoresImportStatus {
  return (
    value === "available" ||
    value === "unranked-or-unavailable" ||
    value === "service-unavailable"
  );
}

export function isPlayerStatistics(value: unknown): value is PlayerStatistics {
  return (
    record(value) &&
    record(value.overall) &&
    skillStatistics(value.overall) &&
    (value.overall.level === undefined || positive(value.overall.level)) &&
    record(value.skills) &&
    Object.entries(value.skills).every(
      ([name, statistics]) => isSkillName(name) && skillStatistics(statistics),
    ) &&
    Array.isArray(value.activities) &&
    value.activities.every(
      (activity) =>
        record(activity) &&
        typeof activity.name === "string" &&
        activity.name.trim().length > 0 &&
        (activity.score === undefined || nonnegative(activity.score)) &&
        (activity.rank === undefined || positive(activity.rank)),
    )
  );
}

export function isQuestProgress(value: unknown): value is PlayerQuestProgress {
  if (
    !record(value) ||
    !nonnegative(value.questPoints) ||
    !nonnegative(value.maxQuestPoints) ||
    value.questPoints > value.maxQuestPoints ||
    !Array.isArray(value.records)
  )
    return false;
  const ids = new Set<string>();
  for (const quest of value.records) {
    if (
      !record(quest) ||
      typeof quest.id !== "string" ||
      !/^\d+$/.test(quest.id) ||
      ids.has(quest.id) ||
      typeof quest.title !== "string" ||
      !quest.title.trim() ||
      !["NOT_STARTED", "STARTED", "COMPLETED"].includes(
        quest.status as string,
      ) ||
      typeof quest.eligible !== "boolean" ||
      typeof quest.members !== "boolean" ||
      !nonnegative(quest.difficulty) ||
      !nonnegative(quest.questPoints)
    )
      return false;
    ids.add(quest.id);
  }
  return true;
}

export function isPlayerEvents(value: unknown): value is PlayerEvent[] {
  return (
    Array.isArray(value) &&
    value.length <= 20 &&
    value.every(
      (event) =>
        record(event) &&
        typeof event.type === "string" &&
        event.type.trim().length > 0 &&
        typeof event.text === "string" &&
        event.text.trim().length > 0 &&
        typeof event.details === "string" &&
        typeof event.date === "string" &&
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(
          event.date,
        ) &&
        Number.isFinite(Date.parse(event.date)),
    )
  );
}

function unavailable(value: Record<string, unknown>): boolean {
  return (
    value.status === "unavailable" &&
    value.reason !== "available" &&
    isPlayerImportStatus(value.reason)
  );
}

export function isPlayerLookup(value: unknown): value is PlayerLookup {
  if (
    !record(value) ||
    !playerName(value.name) ||
    !isFetchedAt(value.fetchedAt) ||
    !isHiscoresImportStatus(value.hiscoresImportStatus) ||
    !record(value.levels) ||
    !Object.entries(value.levels).every(
      ([name, level]) => isSkillName(name) && positive(level) && level <= 120,
    ) ||
    !isPlayerStatistics(value.statistics) ||
    !record(value.quests) ||
    !record(value.events)
  )
    return false;
  if (value.hiscoresImportStatus === "available") {
    if (Object.keys(value.levels).length === 0) return false;
  } else if (
    Object.keys(value.levels).length !== 0 ||
    Object.keys(value.statistics).length !== 3 ||
    Object.keys(value.statistics.overall).length !== 0 ||
    Object.keys(value.statistics.skills).length !== 0 ||
    value.statistics.activities.length !== 0
  ) {
    return false;
  }
  if (
    value.hiscoresImportStatus !== "available" &&
    value.quests.status !== "available" &&
    value.events.status !== "available"
  )
    return false;
  const key = normalizePlayerName(value.name).toLocaleLowerCase("en");
  return (
    (value.quests.status === "available"
      ? playerName(value.quests.name) &&
        normalizePlayerName(value.quests.name).toLocaleLowerCase("en") ===
          key &&
        isQuestProgress(value.quests)
      : unavailable(value.quests)) &&
    (value.events.status === "available"
      ? playerName(value.events.name) &&
        normalizePlayerName(value.events.name).toLocaleLowerCase("en") ===
          key &&
        isPlayerEvents(value.events.events)
      : unavailable(value.events))
  );
}
