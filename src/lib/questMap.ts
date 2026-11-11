import type { QuestRecord } from "../data.ts";

type Node = Pick<QuestRecord, "id" | "questRequirements">;

/** "levels": every earlier quest is done but a required skill level is not (see questStartStatus). */
export type QuestStatus = "done" | "ready" | "levels" | "locked";

/** Difficulty edge colours, matching the dots in the quest finder. */
export const difficultyColor = (difficulty: string) =>
  ({
    Novice: "#8fc79a",
    Intermediate: "#86b4d6",
    Experienced: "#d9c27a",
    Master: "#e09a5f",
    Grandmaster: "#e07a74",
  })[difficulty] ?? "#b59fd6";

/** A quest's name without the "(miniquest)" style suffix, for tight labels. */
export const shortQuestName = (name: string) =>
  name.replace(/ \((miniquest|quest|saga|historical)\)$/i, "");

/** Done, ready (every earlier quest done) or locked. */
export function questStatus(quest: Node, completed: ReadonlySet<string>): QuestStatus {
  if (completed.has(quest.id)) return "done";
  return quest.questRequirements.every((id) => completed.has(id)) ? "ready" : "locked";
}

/** Every quest that must be finished before `id`, however far back; never `id` itself. */
export function earlierQuests(id: string, quests: readonly Node[]): Set<string> {
  const byId = new Map(quests.map((q) => [q.id, q]));
  const found = new Set<string>();
  const walk = (at: string) => {
    for (const r of byId.get(at)?.questRequirements ?? [])
      if (r !== id && !found.has(r)) {
        found.add(r);
        walk(r);
      }
  };
  walk(id);
  return found;
}

/**
 * Tier of each quest: the length of its longest chain of earlier quests within `quests`.
 * Requirements outside the set are ignored; a cycle is cut where it is found.
 */
export function questTiers(quests: readonly Node[]): Map<string, number> {
  const byId = new Map(quests.map((q) => [q.id, q]));
  const tier = new Map<string, number>();
  const visiting = new Set<string>();
  const depth = (id: string): number => {
    const known = tier.get(id);
    if (known != null) return known;
    if (visiting.has(id)) return -1;
    visiting.add(id);
    const reqs = byId.get(id)!.questRequirements.filter((r) => byId.has(r));
    const value = reqs.length ? 1 + Math.max(...reqs.map(depth)) : 0;
    visiting.delete(id);
    tier.set(id, value);
    return value;
  };
  quests.forEach((q) => depth(q.id));
  return tier;
}

export interface MapLayout {
  /** Top-left corner of each quest's card. */
  nodes: Map<string, { x: number; y: number; tier: number }>;
  tiers: { tier: number; x: number; width: number }[];
  width: number;
  height: number;
}

export const CARD = { width: 168, height: 28 } as const;
const COLUMN = CARD.width + 12;
const ROW = CARD.height + 8;
const TIER_GAP = 40;
const TOP = 36;
const EDGE = 24;
const ROWS_PER_COLUMN = 40;

/**
 * Lays quests out in tiers, left to right. A tall tier splits into side-by-side columns,
 * and each quest sits near the average height of the quests it needs, so lines stay short.
 */
export function layoutQuestMap(quests: readonly Node[]): MapLayout {
  const tierOf = questTiers(quests);
  const order = new Map(quests.map((q, i) => [q.id, i]));
  const nodes: MapLayout["nodes"] = new Map();
  const tiers: MapLayout["tiers"] = [];
  const count = Math.max(-1, ...tierOf.values()) + 1;
  let x = EDGE;
  for (let t = 0; t < count; t++) {
    const members = quests.filter((q) => tierOf.get(q.id) === t);
    const key = (q: Node) => {
      const ys = q.questRequirements.flatMap((r) => (nodes.has(r) ? [nodes.get(r)!.y] : []));
      return ys.length ? ys.reduce((a, b) => a + b, 0) / ys.length : order.get(q.id)! * ROW;
    };
    const keyed = members.map((q) => ({ q, k: key(q) }));
    keyed.sort((a, b) => a.k - b.k || order.get(a.q.id)! - order.get(b.q.id)!);
    const columns = Math.max(1, Math.ceil(members.length / ROWS_PER_COLUMN));
    keyed.forEach(({ q }, i) =>
      nodes.set(q.id, {
        x: x + (i % columns) * COLUMN,
        y: TOP + Math.floor(i / columns) * ROW,
        tier: t,
      }),
    );
    const width = columns * COLUMN - (COLUMN - CARD.width);
    tiers.push({ tier: t, x, width });
    x += width + TIER_GAP;
  }
  const bottom = Math.max(TOP, ...[...nodes.values()].map((n) => n.y + CARD.height));
  return { nodes, tiers, width: x - TIER_GAP + EDGE, height: bottom + EDGE };
}

/**
 * Columns for the path to `goal`: its earlier quests by tier within that path, the goal alone
 * last. Each column is ordered so a quest sits near the quests it needs.
 */
export function pathColumns(goal: string, quests: readonly Node[]): string[][] {
  const keep = earlierQuests(goal, quests);
  keep.add(goal);
  const subset = quests.filter((q) => keep.has(q.id));
  if (!subset.some((q) => q.id === goal)) return [];
  const tierOf = questTiers(subset);
  const last = tierOf.get(goal)!;
  const columns: string[][] = Array.from({ length: last + 1 }, () => []);
  const rank = new Map<string, number>();
  for (let t = 0; t <= last; t++) {
    const members = subset.filter((q) => tierOf.get(q.id) === t);
    const key = (q: Node) => {
      const rs = q.questRequirements.flatMap((r) => (rank.has(r) ? [rank.get(r)!] : []));
      return rs.length ? rs.reduce((a, b) => a + b, 0) / rs.length : 0;
    };
    members.sort((a, b) => key(a) - key(b));
    members.forEach((q, i) => rank.set(q.id, i));
    columns[t] = members.map((q) => q.id);
  }
  return columns.filter((c) => c.length);
}
