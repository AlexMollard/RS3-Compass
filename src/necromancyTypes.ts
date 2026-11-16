import type { SkillName } from "./skillNames";

/** An item and how many of it a ritual takes or gives. `image` is the Wiki file name, when the Wiki has one. */
export type RitualItem = { item: string; qty: number; image?: string };

/**
 * One recipe of a Necromancy ritual, from the Wiki's Module:Necromancy/rituals/data. A ritual with several recipes
 * (Lesser communion burns a dozen kinds of bone) is one Ritual per recipe, sharing its name, level, tier, XP and ticks.
 * `image` is the ritual's own Wiki file, or its first output's when it has none.
 */
export type Ritual = {
  id: string;
  name: string;
  level: number;
  tier: 1 | 2 | 3;
  inputs: RitualItem[];
  outputs: RitualItem[];
  xp: number;
  ticks: number;
  members: boolean;
  image?: string;
};

/** A ritual glyph. `ink` is the highest ghostly ink its recipe uses, the one that gates it. */
export type Glyph = {
  id: string;
  name: string;
  level: number;
  tier: 1 | 2 | 3;
  alteration: boolean;
  ink: string;
  image?: string;
};

/**
 * One step of a gear line's upgrade ladder. `weapon` is the Death guard and Skull lantern (each costs `per: "weapon"`),
 * the robes cost `per: "set"` (five pieces). `wear` is what the tier needs to wear. `task` is Kili's task for the tier.
 * `quests` holds QUESTS ids. `image` is a Wiki file for the tier's gear.
 */
export type UpgradeStep = {
  line: "weapon" | "deathwarden" | "deathdealer";
  tier: number;
  wear: { skill: SkillName; level: number }[];
  task?: string;
  quests: string[];
  materials: { item: string; qty: number; per: "weapon" | "set"; image?: string }[];
  members: boolean;
  image?: string;
};
