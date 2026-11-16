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
  /** Requirements with no QUESTS entry ("Barbarian Training"), kept as Wiki text. */
  text?: string[];
  location?: string;
};

/**
 * One master's Slayer assignment, from the Wiki's Module:Slayer assignments/<Master>. `requirements.quests`
 * holds quest IDs from QUESTS; anything else stays in `requirements.text`. `combat` is the combat level the
 * master needs before assigning the task, absent when there is none. `weight` is absent where the Wiki gives none
 * (its table shows "?"): the task can still be assigned, but how often is unknown.
 */
export type SlayerTask = {
  id: string;
  master: string;
  name: string;
  wiki: string;
  amount: [number, number];
  slayer: number;
  combat?: number;
  requirements: { levels: { skill: SkillName; level: number }[]; quests: string[]; text: string[] };
  weight?: number;
  members: boolean;
};
