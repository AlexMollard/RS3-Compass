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

/**
 * Per player, the skills they lead alone; plus the skills with a shared top,
 * all in `skills` order. Only skills every player with published levels
 * publishes count; a player without published levels gets undefined, never [].
 */
export function leadSplit(
  profiles: readonly Profile[],
  skills: readonly string[],
): { sole: (string[] | undefined)[]; tied: string[] } {
  const ranked = profiles.filter((p) => p.hiscoresLevels);
  const sole = new Map(ranked.map((p) => [p, [] as string[]]));
  const tied: string[] = [];
  if (ranked.length >= 2)
    for (const skill of skills) {
      const levels = ranked.map((p) => p.hiscoresLevels![skill]);
      if (levels.some((level) => level === undefined)) continue;
      const highest = Math.max(...(levels as number[]));
      const leaders = ranked.filter((_, i) => levels[i] === highest);
      if (leaders.length > 1) tied.push(skill);
      else sole.get(leaders[0])!.push(skill);
    }
  return { sole: profiles.map((p) => sole.get(p)), tied };
}

export interface StatStanding {
  best: boolean;
  /** The best value is shared with another player. */
  tied: boolean;
  /** Distance from the best value; undefined when unknown or unbeaten by anyone. */
  behind: number | undefined;
}

/**
 * Each value's place against the best one. Unknown values stay unknown, and
 * with fewer than two known values nobody leads.
 */
export function statStandings(
  values: readonly (number | undefined)[],
  lowerIsBetter = false,
): StatStanding[] {
  const known = values.filter((v): v is number => v !== undefined);
  if (known.length < 2)
    return values.map(() => ({ best: false, tied: false, behind: undefined }));
  const best = lowerIsBetter ? Math.min(...known) : Math.max(...known);
  const tied = known.filter((v) => v === best).length > 1;
  return values.map((v) =>
    v === undefined
      ? { best: false, tied: false, behind: undefined }
      : { best: v === best, tied: v === best && tied, behind: Math.abs(v - best) },
  );
}

/**
 * Quest titles each player completed that none of the others did. Players
 * without public quest data get undefined and are left out of everyone
 * else's comparison; fewer than two with data gives undefined.
 */
export function questDifference(
  profiles: readonly (Profile | undefined)[],
): (string[] | undefined)[] | undefined {
  const done = profiles.map(
    (p) =>
      p?.questProgress &&
      new Map(
        p.questProgress.records
          .filter((r) => r.status === "COMPLETED")
          .map((r) => [r.title.toLocaleLowerCase("en"), r.title]),
      ),
  );
  if (done.filter(Boolean).length < 2) return undefined;
  return done.map(
    (mine, i) =>
      mine &&
      [...mine]
        .filter(([key]) => !done.some((other, j) => j !== i && other?.has(key)))
        .map(([, title]) => title)
        .sort(),
  );
}

export interface SkillStanding {
  name: string;
  /** Published level; undefined when unrecorded, never 0. */
  level: number | undefined;
  /** Holds the highest published level; ties all hold it. */
  top: boolean;
  /** Levels below the highest; undefined unless two players publish the skill. */
  behind: number | undefined;
}

/** Each player's published level in a skill, the shared highlight and how far each trails the leader. */
export function skillStandings(
  players: readonly ComparedPlayer[],
  skill: string,
): SkillStanding[] {
  const { highest, known } = groupSkillSummary(players, skill);
  return players.map(({ member, profile }) => {
    const level = profile?.hiscoresLevels?.[skill];
    return {
      name: member.name,
      level,
      top: level !== undefined && level === highest,
      behind:
        level !== undefined && highest !== undefined && known >= 2
          ? highest - level
          : undefined,
    };
  });
}

/**
 * Four-letter column labels. Names that would share one drop the prefix
 * they have in common, so "GIM Alba" and "GIM Bran" read ALBA and BRAN.
 */
export function shortLabels(names: readonly string[]): string[] {
  const four = (name: string) => name.trim().slice(0, 4).toUpperCase();
  return names.map((name) => {
    const clashes = names.filter((other) => four(other) === four(name));
    if (clashes.length < 2) return four(name);
    let common = 0;
    while (
      clashes.every(
        (other) =>
          other.length > common &&
          other[common].toLowerCase() === clashes[0][common].toLowerCase(),
      )
    )
      common++;
    return four(name.slice(common)) || four(name);
  });
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

export interface GapPlayer {
  name: string;
  level: number;
  xp?: number;
}

export interface SkillGap {
  skill: string;
  /** Published XP spread; absent unless every listed player publishes XP. */
  xpGap?: number;
  levelGap: number;
  /** Every player with a published level, in player order. */
  players: GapPlayer[];
}

/**
 * Compare roster: a click adds a player (replacing the third when three are
 * picked) or removes a picked one, never leaving fewer than two.
 */
export function togglePick(picked: readonly string[], id: string): string[] {
  if (picked.includes(id))
    return picked.length > 2 ? picked.filter((p) => p !== id) : [...picked];
  return picked.length < 3 ? [...picked, id] : [...picked.slice(0, 2), id];
}

const spread = (values: number[]) => Math.max(...values) - Math.min(...values);

/** Each player's published level and XP in a skill, in player order; undefined without a level. */
export function publishedIn(
  players: readonly ComparedPlayer[],
  skill: string,
): (GapPlayer | undefined)[] {
  return players.map(({ member, profile }) => {
    const level = profile?.hiscoresLevels?.[skill];
    if (level === undefined) return undefined;
    const xp = profile?.statistics?.skills?.[skill]?.xp;
    return { name: member.name, level, ...(xp === undefined ? {} : { xp }) };
  });
}

/**
 * "game" order; widest XP "gap" or "level-gap" first; `trails:<index>` for that
 * player's deepest deficits first; `leads:<index>` for their widest leads first.
 */
export type SkillSort =
  | "game"
  | "gap"
  | "level-gap"
  | `trails:${number}`
  | `leads:${number}`;

/**
 * Skill names in the chosen order. Gaps and margins count in XP when every
 * player with a level publishes XP, else in levels after the XP ones; skills
 * with no gap or margin keep game order at the end.
 */
export function sortSkills(
  players: readonly ComparedPlayer[],
  skills: readonly string[],
  sort: SkillSort,
): string[] {
  if (sort === "game") return [...skills];
  // [XP measure, level measure]; only one is used, the other stays -1.
  const key = (skill: string): [number, number] => {
    const all = publishedIn(players, skill);
    const known = all.flatMap((p) => (p ? [p] : []));
    const byXp = known.every((k) => k.xp !== undefined);
    if (sort === "gap" || sort === "level-gap") {
      if (known.length < 2) return [-1, -1];
      const levelGap = spread(known.map((k) => k.level));
      if (sort === "level-gap") return [-1, levelGap];
      return byXp ? [spread(known.map((k) => k.xp!)), -1] : [-1, levelGap];
    }
    const [kind, at] = sort.split(":");
    const mine = all[Number(at)];
    const others = known.filter((k) => k !== mine);
    if (!mine || !others.length) return [-1, -1];
    if (kind === "leads")
      return byXp
        ? [mine.xp! - Math.max(...others.map((o) => o.xp!)), -1]
        : [-1, mine.level - Math.max(...others.map((o) => o.level))];
    return byXp
      ? [Math.max(...known.map((k) => k.xp!)) - mine.xp!, -1]
      : [-1, Math.max(...known.map((k) => k.level)) - mine.level];
  };
  const rank = (n: number) => (n > 0 ? n : -1);
  // Array.sort is stable, so equal keys keep the in-game order.
  return skills
    .map((skill) => ({ skill, key: key(skill) }))
    .sort(
      (a, b) =>
        rank(b.key[0]) - rank(a.key[0]) || rank(b.key[1]) - rank(a.key[1]),
    )
    .map((k) => k.skill);
}

/**
 * Published spreads, widest XP gap first, then skills missing someone's XP by
 * level gap. `skills` order is the in-game tie-break.
 */
export function widestGaps(
  players: readonly ComparedPlayer[],
  skills: readonly string[],
  limit = Infinity,
): SkillGap[] {
  const gaps: SkillGap[] = [];
  for (const skill of skills) {
    const known = publishedIn(players, skill).flatMap((p) => (p ? [p] : []));
    if (known.length < 2) continue;
    const levelGap = spread(known.map((k) => k.level));
    const xpGap = known.every((k) => k.xp !== undefined)
      ? spread(known.map((k) => k.xp!))
      : undefined;
    if (!levelGap && !xpGap) continue;
    gaps.push({
      skill,
      ...(xpGap === undefined ? {} : { xpGap }),
      levelGap,
      players: known,
    });
  }
  // Array.sort is stable, so equal gaps keep the in-game order.
  return gaps
    .sort(
      (a, b) =>
        (b.xpGap ?? -1) - (a.xpGap ?? -1) || b.levelGap - a.levelGap,
    )
    .slice(0, limit);
}
