import { QUESTS, type Profile } from "../data.ts";
import type { BossRecord, BossTier } from "../bossTypes.ts";

export const TIER_ORDER: Record<BossTier, number> = {
  Free: 0,
  Low: 1,
  Mid: 2,
  High: 3,
};

/** Recommended raw combat stat per tier (editable in one place). */
export const TIER_STATS: Record<BossTier, number> = {
  Free: 60,
  Low: 75,
  Mid: 85,
  High: 95,
};

const STAGES: Record<BossTier, string> = {
  Free: "Start here",
  Low: "Early members",
  Mid: "Mid-game",
  High: "Endgame",
};

export type BossStatus = {
  kind: "members" | "quest" | "skill" | "ready" | "levels" | "unknown";
  text: string;
  quest?: string;
};

export const stageOf = (tier: BossTier): string => STAGES[tier];

export function ladder(bosses: readonly BossRecord[]): BossRecord[] {
  return [...bosses].sort(
    (a, b) =>
      TIER_ORDER[a.tier] - TIER_ORDER[b.tier] ||
      a.level - b.level ||
      a.name.localeCompare(b.name),
  );
}

export function visibleBosses(
  profile: Profile,
  bosses: readonly BossRecord[],
): BossRecord[] {
  const ordered = ladder(bosses);
  return profile.mode === "f2p" ? ordered.filter((b) => !b.members) : ordered;
}

export function meetsTier(
  levels: Record<string, number>,
  tier: BossTier,
): boolean {
  const lv = (skill: string) => levels[skill] ?? 1;
  const best = Math.max(
    Math.min(lv("Attack"), lv("Strength")),
    lv("Ranged"),
    lv("Magic"),
  );
  const need = TIER_STATS[tier];
  return best >= need && lv("Constitution") >= need && lv("Defence") >= need;
}

const questName = (id: string) => QUESTS.find((q) => q.id === id)?.name ?? id;

export function bossStatus(profile: Profile, boss: BossRecord): BossStatus {
  if (boss.members && profile.mode === "f2p") {
    return { kind: "members", text: "Members only" };
  }
  for (const req of boss.requirements) {
    if (req.kind === "quest" && !profile.completedQuests.includes(req.quest)) {
      return {
        kind: "quest",
        text: `After ${questName(req.quest)}`,
        quest: req.quest,
      };
    }
  }
  const recorded = Object.keys(profile.levels).length > 0;
  if (recorded) {
    for (const req of boss.requirements) {
      if (req.kind === "skill" && (profile.levels[req.skill] ?? 1) < req.level) {
        return { kind: "skill", text: `Needs ${req.level} ${req.skill}` };
      }
    }
  }
  if (!recorded) return { kind: "unknown", text: "Levels not recorded" };
  if (meetsTier(profile.levels, boss.tier)) {
    return { kind: "ready", text: "Ready now" };
  }
  return {
    kind: "levels",
    text: `Around ${TIER_STATS[boss.tier]} combat stats`,
  };
}

export function nextBoss(
  profile: Profile,
  bosses: readonly BossRecord[],
  collected: ReadonlySet<string>,
  uniquesOf: (boss: BossRecord) => readonly string[] = (b) => b.uniques,
): BossRecord | undefined {
  const visible = visibleBosses(profile, bosses);
  const logComplete = (b: BossRecord) => {
    const uniques = uniquesOf(b);
    return (
      uniques.length > 0 && uniques.every((u) => collected.has(`boss:${b.id}:${u}`))
    );
  };
  return (
    visible.find(
      (b) => bossStatus(profile, b).kind === "ready" && !logComplete(b),
    ) ?? visible.find((b) => bossStatus(profile, b).kind !== "ready")
  );
}

export function defaultDropVersion(
  boss: BossRecord,
  mode: Profile["mode"],
): string | undefined {
  const keys = Object.keys(boss.drops);
  if (keys.length === 0) return undefined;
  const f2p = (k: string) => /\bf2p\b|free-to-play/i.test(k);
  return (mode === "f2p" ? keys.find(f2p) : keys.find((k) => !f2p(k))) ?? keys[0];
}
