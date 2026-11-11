import type { QuestRecord } from "../data.ts";
import { QUEST_SERIES } from "../questsImported.ts";

type Series = Readonly<Record<string, { name: string; order: number }>>;

const wikiKey = (quest: Pick<QuestRecord, "wiki">) => quest.wiki.replaceAll(" ", "_");

/** The storyline a quest belongs to, in Wiki series order, or undefined when it has none. */
export function questLine<Q extends Pick<QuestRecord, "id" | "wiki">>(
  quest: Q,
  quests: readonly Q[],
  series: Series = QUEST_SERIES,
): { name: string; quests: Q[] } | undefined {
  const own = series[wikiKey(quest)];
  if (!own) return undefined;
  const members = quests
    .filter((entry) => series[wikiKey(entry)]?.name === own.name)
    .sort((a, b) => series[wikiKey(a)].order - series[wikiKey(b)].order);
  return members.length > 1 ? { name: own.name, quests: members } : undefined;
}
