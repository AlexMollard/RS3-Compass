import type { Profile, QuestRecord } from "../data.ts";
import type { PlayerQuest } from "./playerTypes.ts";

export function questTitleKey(title: string): string {
  return title
    .normalize("NFKC")
    .replace(/[‘’]/g, "'")
    .trim()
    .replace(/\s+\((?:miniquest|saga)\)$/i, "")
    .replace(/\.{3}$/, "")
    .trim()
    .toLocaleLowerCase("en");
}

export function findPlayerQuest(
  profile: Profile,
  quest: QuestRecord,
): PlayerQuest | undefined {
  const key = questTitleKey(quest.name);
  return profile.questProgress?.records.find(
    (record) => questTitleKey(record.title) === key,
  );
}
