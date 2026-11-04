import type { QuestImport } from "../playerTypes.ts";

// RuneMetrics' public quest endpoint can return an empty array for private or
// otherwise unavailable data, even with loggedIn: "false".
export function parseQuestResponse(value: unknown): QuestImport {
  const unavailable = (
    reason: "private-or-unavailable" | "service-unavailable",
  ): QuestImport => ({ status: "unavailable", reason });
  if (!value || typeof value !== "object" || Array.isArray(value))
    return unavailable("service-unavailable");
  const response = value as Record<string, unknown>;
  if (response.error === "PROFILE_PRIVATE")
    return unavailable("private-or-unavailable");
  if (!Array.isArray(response.quests))
    return unavailable("service-unavailable");
  if (response.quests.length === 0)
    return unavailable("private-or-unavailable");

  const completedTitles: string[] = [];
  for (const entry of response.quests) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry))
      return unavailable("service-unavailable");
    const quest = entry as Record<string, unknown>;
    if (
      typeof quest.title !== "string" ||
      !quest.title.trim() ||
      (quest.status !== "COMPLETED" &&
        quest.status !== "STARTED" &&
        quest.status !== "NOT_STARTED")
    ) {
      return unavailable("service-unavailable");
    }
    if (quest.status === "COMPLETED") completedTitles.push(quest.title);
  }
  return { status: "available", completedTitles };
}

export async function lookupQuests(
  name: string,
  fetcher: typeof fetch,
): Promise<QuestImport> {
  try {
    const url = new URL("https://apps.runescape.com/runemetrics/quests");
    url.searchParams.set("user", name);
    const response = await fetcher(url, {
      signal: AbortSignal.timeout(8000),
      headers: {
        accept: "application/json",
        "user-agent": "RS3 Compass public quest lookup",
      },
    });
    if (!response.ok)
      return { status: "unavailable", reason: "service-unavailable" };
    return parseQuestResponse(await response.json());
  } catch {
    return { status: "unavailable", reason: "service-unavailable" };
  }
}
