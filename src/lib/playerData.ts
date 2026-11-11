import { isSkillName } from "../skillNames.ts";
import {
  isRecord,
  isSafeInteger,
  isSkillLevelMap,
  MAX_DATE_MS,
} from "./guards.ts";
import { normalizePlayerName, playerKey } from "./playerName.ts";
import type {
  HiscoresImportStatus,
  PlayerEvent,
  PlayerImportStatus,
  PlayerLookup,
  PlayerQuest,
  PlayerQuestProgress,
  PlayerStatistics,
} from "./playerTypes.ts";

function playerName(value: unknown): value is string {
  try {
    return typeof value === "string" && normalizePlayerName(value).length > 0;
  } catch {
    return false;
  }
}

function skillStatistics(value: unknown): boolean {
  return (
    isRecord(value) &&
    (value.xp === undefined || isSafeInteger(value.xp)) &&
    (value.rank === undefined || isSafeInteger(value.rank, 1))
  );
}

export function isFetchedAt(value: unknown): value is number {
  return isSafeInteger(value) && value <= MAX_DATE_MS;
}

export function isPlayerQuestStatus(
  value: unknown,
): value is PlayerQuest["status"] {
  return value === "NOT_STARTED" || value === "STARTED" || value === "COMPLETED";
}

/** One Adventurer's Log entry: named type and text, details, and an ISO timestamp. */
export function isPlayerEvent(value: unknown): value is PlayerEvent {
  return (
    isRecord(value) &&
    typeof value.type === "string" &&
    value.type.trim().length > 0 &&
    typeof value.text === "string" &&
    value.text.trim().length > 0 &&
    typeof value.details === "string" &&
    typeof value.date === "string" &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(
      value.date,
    ) &&
    Number.isFinite(Date.parse(value.date))
  );
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
    isRecord(value) &&
    isRecord(value.overall) &&
    skillStatistics(value.overall) &&
    (value.overall.level === undefined ||
      isSafeInteger(value.overall.level, 1)) &&
    isRecord(value.skills) &&
    Object.entries(value.skills).every(
      ([name, statistics]) => isSkillName(name) && skillStatistics(statistics),
    ) &&
    Array.isArray(value.activities) &&
    value.activities.every(
      (activity) =>
        isRecord(activity) &&
        typeof activity.name === "string" &&
        activity.name.trim().length > 0 &&
        (activity.score === undefined || isSafeInteger(activity.score)) &&
        (activity.rank === undefined || isSafeInteger(activity.rank, 1)),
    )
  );
}

export function isQuestProgress(value: unknown): value is PlayerQuestProgress {
  if (
    !isRecord(value) ||
    !isSafeInteger(value.questPoints) ||
    !isSafeInteger(value.maxQuestPoints) ||
    value.questPoints > value.maxQuestPoints ||
    !Array.isArray(value.records)
  )
    return false;
  const ids = new Set<string>();
  for (const quest of value.records) {
    if (
      !isRecord(quest) ||
      typeof quest.id !== "string" ||
      !/^\d+$/.test(quest.id) ||
      ids.has(quest.id) ||
      typeof quest.title !== "string" ||
      !quest.title.trim() ||
      !isPlayerQuestStatus(quest.status) ||
      typeof quest.eligible !== "boolean" ||
      typeof quest.members !== "boolean" ||
      !isSafeInteger(quest.difficulty) ||
      !isSafeInteger(quest.questPoints)
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
    value.every((event) => isPlayerEvent(event))
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
    !isRecord(value) ||
    !playerName(value.name) ||
    !isFetchedAt(value.fetchedAt) ||
    !isHiscoresImportStatus(value.hiscoresImportStatus) ||
    (value.ironman !== undefined && typeof value.ironman !== "boolean") ||
    !isSkillLevelMap(value.levels) ||
    !isPlayerStatistics(value.statistics) ||
    !isRecord(value.quests) ||
    !isRecord(value.events)
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
  const key = playerKey(value.name);
  return (
    (value.quests.status === "available"
      ? playerName(value.quests.name) &&
        playerKey(value.quests.name) === key &&
        isQuestProgress(value.quests)
      : unavailable(value.quests)) &&
    (value.events.status === "available"
      ? playerName(value.events.name) &&
        playerKey(value.events.name) === key &&
        isPlayerEvents(value.events.events)
      : unavailable(value.events))
  );
}

/** A source was down rather than private or missing, so the lookup is worth retrying soon. */
export function hasTransientFailure(
  player: Pick<PlayerLookup, "hiscoresImportStatus" | "quests" | "events">,
): boolean {
  return (
    player.hiscoresImportStatus === "service-unavailable" ||
    (player.quests.status === "unavailable" &&
      player.quests.reason === "service-unavailable") ||
    (player.events.status === "unavailable" &&
      player.events.reason === "service-unavailable")
  );
}
