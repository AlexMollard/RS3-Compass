export interface PlayerLevels {
  name: string;
  levels: Record<string, number>;
  fetchedAt: number;
}

export type QuestImport =
  | { status: "available"; completedTitles: string[] }
  | {
      status: "unavailable";
      reason: "private-or-unavailable" | "service-unavailable";
    };

export interface PlayerLookup extends PlayerLevels {
  quests: QuestImport;
}
