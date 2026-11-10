export interface PlayerSkillStatistics {
  xp?: number;
  rank?: number;
}

export interface PlayerHiscoreActivity {
  name: string;
  score?: number;
  rank?: number;
}

export interface PlayerStatistics {
  overall: PlayerSkillStatistics & { level?: number };
  skills: Record<string, PlayerSkillStatistics>;
  activities: PlayerHiscoreActivity[];
}

export interface PlayerLevels {
  name: string;
  levels: Record<string, number>;
  statistics: PlayerStatistics;
  fetchedAt: number;
}

export type HiscoresImportStatus =
  "available" | "unranked-or-unavailable" | "service-unavailable";

export type PlayerImportStatus =
  "available" | "private-or-unavailable" | "not-member" | "service-unavailable";

export interface PlayerQuest {
  id: string;
  title: string;
  status: "NOT_STARTED" | "STARTED" | "COMPLETED";
  eligible: boolean;
  members: boolean;
  difficulty: number;
  questPoints: number;
}

export interface PlayerQuestProgress {
  records: PlayerQuest[];
  questPoints: number;
  maxQuestPoints: number;
}

export type QuestImport =
  | (PlayerQuestProgress & {
      status: "available";
      name: string;
    })
  | {
      status: "unavailable";
      reason: Exclude<PlayerImportStatus, "available">;
    };

export interface PlayerEvent {
  type: string;
  date: string;
  text: string;
  details: string;
}

export type PlayerEventsImport =
  | { status: "available"; name: string; events: PlayerEvent[] }
  | {
      status: "unavailable";
      reason: Exclude<PlayerImportStatus, "available">;
    };

export interface PlayerLookup extends PlayerLevels {
  hiscoresImportStatus: HiscoresImportStatus;
  /** From the Ironman Hiscores; omitted when they could not tell. */
  ironman?: boolean;
  quests: QuestImport;
  events: PlayerEventsImport;
}
