import type { SkillName } from "../skillNames.ts";

export type GroupSize = 2 | 3 | 4 | 5;

export interface GroupMember {
  name: string;
  totalLevel?: number;
  totalXp?: number;
  levels?: Partial<Record<SkillName, number>>;
}

export interface GroupLookup {
  id: number;
  name: string;
  size: GroupSize;
  isCompetitive: boolean;
  founder: boolean;
  rank?: number;
  totalLevel: number;
  totalXp: number;
  members: GroupMember[];
  fetchedAt: number;
}

export interface GroupQuery {
  name: string;
  size: GroupSize;
  isCompetitive: boolean;
}
