import type { Profile, QuestRecord } from "../data.ts";
import type { PlayerQuest } from "./playerTypes.ts";

export function questTitleKey(title: string): string {
  return title
    .normalize("NFKC")
    .replace(/[‘’]/g, "'")
    .trim()
    .replace(/\s+\((?:miniquest|saga|quest)\)$/i, "")
    // Jagex lists these series' parts by their own names ("Foreshadowing"); Recipe for
    // Disaster and Dimension of Disaster keep their prefix in both, so they stay as they are.
    .replace(/^(?:Once Upon a Time in Gielinor|That Old Black Magic): /i, "")
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
