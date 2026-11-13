import { BOSS_GUIDES, type BossGuide } from "./bossGuides.ts";
import type { BossRecord } from "./bossTypes.ts";
import { IMPORTED_BOSSES } from "./bossesImported.ts";

export const BOSSES: readonly BossRecord[] = IMPORTED_BOSSES;

const bossesById = new Map(BOSSES.map((boss) => [boss.id, boss]));

export const bossById = (id: string): BossRecord | undefined => bossesById.get(id);

/** The bosses whose requirements include this quest. */
export const bossesUnlockedBy = (questId: string): BossRecord[] =>
  BOSSES.filter((boss) =>
    boss.requirements.some((req) => req.kind === "quest" && req.quest === questId),
  );

const GENERIC_UNIQUES = [
  /clue scroll/i,
  /casket/i,
  /^crystal triskelion/i,
  /^starved ancient effigy$/i,
  /^(gold|green|crimson|blue) charms?$/i,
  /^coins$/i,
  /\(\d+\)$/, // a potion dose, e.g. "Antipoison (4)"
  /potion|brew|restore/i,
  /^spirit shards$/i,
  /^key token$/i,
  /\blamp\b/i,
];

/** Drops generic items (clue scrolls, potions, charms…) that the import's rarity heuristic picks up. */
export const filterUniques = (uniques: readonly string[]): string[] =>
  uniques.filter((item) => !GENERIC_UNIQUES.some((pattern) => pattern.test(item)));

/** Applies a guide's hand-checked corrections: removes first, then adds anything not already listed. */
export function applyUniqueOverrides(
  uniques: readonly string[],
  guide: Pick<BossGuide, "uniques"> | undefined,
): string[] {
  const removed = new Set(guide?.uniques?.remove);
  const kept = uniques.filter((item) => !removed.has(item));
  return [...new Set([...kept, ...(guide?.uniques?.add ?? [])])];
}

/** The boss's collection log items. Use this, never `boss.uniques`. */
export const bossUniques = (boss: BossRecord): string[] =>
  applyUniqueOverrides(filterUniques(boss.uniques), BOSS_GUIDES[boss.id]);
