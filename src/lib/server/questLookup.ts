import type { PlayerQuest, QuestImport } from "../playerTypes.ts";
import { isRecord, isSafeInteger } from "../guards.ts";
import { isPlayerQuestStatus } from "../playerData.ts";
import { samePlayerName } from "../playerName.ts";
import { adventurerError, fetchAdventurer } from "./adventurerLookup.ts";

export function parseQuestResponse(value: unknown): QuestImport {
  const unavailable = (): QuestImport => ({
    status: "unavailable",
    reason: adventurerError(value),
  });
  if (!isRecord(value)) return unavailable();
  const response = value;
  if (
    typeof response.name !== "string" ||
    !response.name.trim() ||
    !isSafeInteger(response.qp) ||
    !isSafeInteger(response.qp_max) ||
    !isRecord(response.quests)
  )
    return unavailable();
  if (response.qp > response.qp_max) return unavailable();
  const records: PlayerQuest[] = [];
  for (const [id, quest] of Object.entries(response.quests)) {
    if (!/^\d+$/.test(id) || !isRecord(quest)) return unavailable();
    if (
      typeof quest.title !== "string" ||
      !quest.title.trim() ||
      typeof quest.eligible !== "boolean" ||
      typeof quest.members !== "boolean" ||
      !isSafeInteger(quest.difficulty) ||
      !isSafeInteger(quest.qp) ||
      !isPlayerQuestStatus(quest.status)
    )
      return unavailable();
    records.push({
      id,
      title: quest.title,
      status: quest.status,
      eligible: quest.eligible,
      members: quest.members,
      difficulty: quest.difficulty,
      questPoints: quest.qp,
    });
  }
  return {
    status: "available",
    name: response.name,
    records,
    questPoints: response.qp,
    maxQuestPoints: response.qp_max,
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
