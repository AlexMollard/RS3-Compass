import type { Profile } from "../data.ts";
import type { GroupLookup, GroupMember } from "./groupTypes.ts";
import { normalizePlayerName } from "./playerName.ts";

export interface GroupPlayer {
  member: GroupMember;
  profile?: Profile;
}

export function groupPlayers(
  group: GroupLookup,
  profiles: readonly Profile[],
): GroupPlayer[] {
  const key = (name: string) => normalizePlayerName(name).toLowerCase();
  const byName = new Map(
    profiles
      .filter((p) => p.source === "hiscores")
      .map((p) => [key(p.name), p]),
  );
  return group.members.map((member) => ({
    member,
    profile: byName.get(key(member.name)),
  }));
}

export function groupSkillSummary(
  players: readonly GroupPlayer[],
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
  players: readonly GroupPlayer[],
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
