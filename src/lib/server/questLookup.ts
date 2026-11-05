import type { PlayerQuest, QuestImport } from "../playerTypes.ts";
import {
  adventurerError,
  fetchAdventurer,
  samePlayerName,
} from "./adventurerLookup.ts";

export function parseQuestResponse(value: unknown): QuestImport {
  const unavailable = (): QuestImport => ({
    status: "unavailable",
    reason: adventurerError(value),
  });
  if (!value || typeof value !== "object" || Array.isArray(value))
    return unavailable();
  const response = value as Record<string, unknown>;
  if (
    typeof response.name !== "string" ||
    !response.name.trim() ||
    !Number.isSafeInteger(response.qp) ||
    (response.qp as number) < 0 ||
    !Number.isSafeInteger(response.qp_max) ||
    (response.qp_max as number) < 0 ||
    !response.quests ||
    typeof response.quests !== "object" ||
    Array.isArray(response.quests)
  )
    return unavailable();
  if ((response.qp as number) > (response.qp_max as number))
    return unavailable();
  const records: PlayerQuest[] = [];
  for (const [id, entry] of Object.entries(response.quests)) {
    if (
      !/^\d+$/.test(id) ||
      !entry ||
      typeof entry !== "object" ||
      Array.isArray(entry)
    )
      return unavailable();
    const quest = entry as Record<string, unknown>;
    if (
      typeof quest.title !== "string" ||
      !quest.title.trim() ||
      typeof quest.eligible !== "boolean" ||
      typeof quest.members !== "boolean" ||
      !Number.isSafeInteger(quest.difficulty) ||
      (quest.difficulty as number) < 0 ||
      !Number.isSafeInteger(quest.qp) ||
      (quest.qp as number) < 0 ||
      (quest.status !== "NOT_STARTED" &&
        quest.status !== "STARTED" &&
        quest.status !== "COMPLETED")
    )
      return unavailable();
    records.push({
      id,
      title: quest.title,
      status: quest.status,
      eligible: quest.eligible,
      members: quest.members,
      difficulty: quest.difficulty as number,
      questPoints: quest.qp as number,
    });
  }
  return {
    status: "available",
    name: response.name,
    records,
    questPoints: response.qp as number,
    maxQuestPoints: response.qp_max as number,
  };
}

export async function lookupQuests(
  name: string,
  fetcher: typeof fetch,
): Promise<QuestImport> {
  try {
    const { value, ok } = await fetchAdventurer(name, "playerQuests", fetcher);
    const result = ok
      ? parseQuestResponse(value)
      : { status: "unavailable" as const, reason: adventurerError(value) };
    return result.status === "available" && !samePlayerName(result.name, name)
      ? { status: "unavailable", reason: "service-unavailable" }
      : result;
  } catch {
    return { status: "unavailable", reason: "service-unavailable" };
  }
}
