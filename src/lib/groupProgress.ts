import type { Profile } from "../data.ts";
import type { GroupLookup, GroupMember } from "./groupTypes.ts";
import { playerKey } from "./playerName.ts";

/** Any player being compared: a group member or a saved player, by name. */
export interface ComparedPlayer {
  member: { name: string };
  profile?: Profile;
}

export interface GroupPlayer extends ComparedPlayer {
  member: GroupMember;
}

/** Skills where each player's published level is higher; skills either lacks are left out. */
export function headToHead(
  a: Profile | undefined,
  b: Profile | undefined,
  skills: readonly string[],
): { aAhead: number; bAhead: number; level: number } {
  const result = { aAhead: 0, bAhead: 0, level: 0 };
  for (const skill of skills) {
    const x = a?.hiscoresLevels?.[skill],
      y = b?.hiscoresLevels?.[skill];
    if (x === undefined || y === undefined) continue;
    if (x > y) result.aAhead++;
    else if (y > x) result.bAhead++;
    else result.level++;
  }
  return result;
}

/** Quest titles one player completed and the other did not, from public quest data. */
export function questDifference(
  a: Profile | undefined,
  b: Profile | undefined,
): { onlyA: string[]; onlyB: string[] } | undefined {
  const done = (p: Profile | undefined) =>
    p?.questProgress &&
    new Map(
      p.questProgress.records
        .filter((r) => r.status === "COMPLETED")
        .map((r) => [r.title.toLocaleLowerCase("en"), r.title]),
    );
  const left = done(a),
    right = done(b);
  if (!left || !right) return undefined;
  const only = (x: Map<string, string>, y: Map<string, string>) =>
    [...x].filter(([key]) => !y.has(key)).map(([, title]) => title).sort();
  return { onlyA: only(left, right), onlyB: only(right, left) };
}

export function groupPlayers(
  group: GroupLookup,
  profiles: readonly Profile[],
): GroupPlayer[] {
  const byName = new Map(
    profiles
      .filter((p) => p.source === "hiscores")
      .map((p) => [playerKey(p.name), p]),
  );
  return group.members.map((member) => ({
    member,
    profile: byName.get(playerKey(member.name)),
  }));
}

export function groupSkillSummary(
  players: readonly ComparedPlayer[],
  skill: string,
) {
  let highest: number | undefined;
  let known = 0;
  const leaders: string[] = [];
  for (const { member, profile } of players) {
    const level = profile?.hiscoresLevels?.[skill];
    if (level === undefined) continue;
    known++;
    if (highest === undefined || level > highest) {
      highest = level;
      leaders.length = 0;
      leaders.push(member.name);
    } else if (level === highest) leaders.push(member.name);
  }
  return { highest, known, leaders };
}

export interface SkillGap {
  skill: string;
  highest: number;
  lowest: number;
  gap: number;
  leaders: string[];
  trailing: string[];
}

/** Largest published-level spreads. `skills` order is the in-game tie-break. */
export function widestGaps(
  players: readonly ComparedPlayer[],
  skills: readonly string[],
  limit = 5,
): SkillGap[] {
  const gaps: SkillGap[] = [];
  for (const skill of skills) {
    const known = players.flatMap(({ member, profile }) => {
      const level = profile?.hiscoresLevels?.[skill];
      return level === undefined ? [] : [{ name: member.name, level }];
    });
    if (known.length < 2) continue;
    const highest = Math.max(...known.map((k) => k.level));
    const lowest = Math.min(...known.map((k) => k.level));
    if (highest === lowest) continue;
    gaps.push({
      skill,
      highest,
      lowest,
      gap: highest - lowest,
      leaders: known.filter((k) => k.level === highest).map((k) => k.name),
      trailing: known.filter((k) => k.level === lowest).map((k) => k.name),
    });
  }
  // Array.sort is stable, so equal gaps keep the in-game order.
  return gaps.sort((a, b) => b.gap - a.gap).slice(0, limit);
}
