import type { BossRecord } from "./bossTypes.ts";
import { IMPORTED_BOSSES } from "./bossesImported.ts";

export const BOSSES: readonly BossRecord[] = IMPORTED_BOSSES;

const bossesById = new Map(BOSSES.map((boss) => [boss.id, boss]));

export const bossById = (id: string): BossRecord | undefined => bossesById.get(id);
