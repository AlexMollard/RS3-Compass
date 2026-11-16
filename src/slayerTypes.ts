import type { SkillName } from "./skillNames";

/** A Slayer master from the Wiki's Slayer masters table. A requirement of 0 combat or 1 Slayer means none. */
export type SlayerMaster = {
  id: string;
  name: string;
  wiki: string;
  image?: string;
  members: boolean;
  combat: number;
  slayer: number;
  /** Quest IDs from QUESTS. */
  quests: string[];
  location?: string;
};

/**
 * One master's Slayer assignment, from the Wiki's Module:Slayer assignments/<Master>. `requirements.quests`
 * holds quest IDs from QUESTS; anything else, including a combat level requirement ("Combat level 100"),
 * stays in `requirements.text`.
 */
export type SlayerTask = {
  id: string;
  master: string;
  name: string;
  wiki: string;
  amount: [number, number];
  slayer: number;
  requirements: { levels: { skill: SkillName; level: number }[]; quests: string[]; text: string[] };
  weight: number;
  members: boolean;
};
