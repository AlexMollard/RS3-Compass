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
