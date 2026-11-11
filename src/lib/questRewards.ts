import { RS3_SKILL_NAMES } from "../skillNames.ts";

export interface RewardGroups {
  questPoints: string[];
  experience: string[];
  unlocks: string[];
  items: string[];
}

/** One header chip per reward group; `more` counts the group's other lines. */
export interface RewardSummary {
  group: keyof RewardGroups;
  text: string;
  more: number;
  /** The only skill with fixed XP, when there is exactly one. */
  skill?: string;
}

const QUEST_POINTS = /^(\d+) quest points?\b/i;
const EXPERIENCE = /\bXP\b|\bexperience\b|\blamps?\b/i;
const UNLOCK =
  /^(ability|use of|travel)\b|\baccess\b|\btitles?\b|\bemotes?\b|\bteleport\b|\bpet\b|\boverrides?\b|\bunlock/i;

/** Sorts reward lines for display; each line lands in exactly one group. */
export function groupRewards(rewards: readonly string[]): RewardGroups {
  const groups: RewardGroups = {
    questPoints: [],
    experience: [],
    unlocks: [],
    items: [],
  };
  for (const line of rewards) {
    if (QUEST_POINTS.test(line)) groups.questPoints.push(line);
    else if (EXPERIENCE.test(line)) groups.experience.push(line);
    else if (UNLOCK.test(line)) groups.unlocks.push(line);
    else groups.items.push(line);
  }
  return groups;
}

export interface LampReward {
  /** The lamp's own skill; absent when the player picks one (`choice`) or the Wiki names none. */
  skill?: string;
  xp?: number;
  level?: number;
  choice: boolean;
  count: number;
  /** The skills a choice lamp offers, as the Wiki lists them. */
  options?: string;
  text: string;
}

const ANY_SKILL_XP = new RegExp(`([\\d,]+) (${RS3_SKILL_NAMES.join("|")}) XP\\b`, "g");
const NUMBER_WORDS: Record<string, number> = { two: 2, three: 3, four: 4, five: 5, six: 6 };
const amount = (text: string) => Number(text.replace(/,/g, ""));

/**
 * Fixed XP per skill, and the lamps. XP a lamp grants ("2,500 Hunter XP lamp",
 * "lamp ... grants 2,500 Hunter XP") is lamp XP, not fixed XP.
 */
export function experienceRewards(lines: readonly string[]) {
  const fixed = new Map<string, number>();
  const lamps: LampReward[] = [];
  for (const line of lines) {
    const level = Number(line.match(/\blevel (\d+)/i)?.[1]) || undefined;
    const options = line.match(
      /\b(?:one of(?: the following skills)?|a choice of):?\s*([^()]+?)\s*(?:[()]|$)/i,
    )?.[1];
    const choice = /chosen skill|\bone of\b|any skill|your choice|choice of/i.test(line);
    let lampMatches = 0;
    let fixedMatches = 0;
    for (const match of line.matchAll(ANY_SKILL_XP)) {
      const before = line.slice(0, match.index);
      const after = line.slice(match.index + match[0].length);
      if (/^\s*lamp\b/i.test(after) || /\bgrants\s*$/i.test(before)) {
        lampMatches++;
        lamps.push({ skill: match[2], xp: amount(match[1]), level, choice: false, count: 1, text: line });
      } else {
        fixedMatches++;
        fixed.set(match[2], (fixed.get(match[2]) ?? 0) + amount(match[1]));
      }
    }
    if (!lampMatches && /\blamps?\b|\brequires? level\b/i.test(line)) {
      const words = line.match(/\b(two|three|four|five|six|\d+)\s+(?:[\w-]+\s+){0,2}lamps\b/i)?.[1];
      const xp = fixedMatches
        ? undefined
        : amount(line.match(/([\d,]+)\s+(?:[A-Z]\w+\s+)?(?:XP|experience)\b/)?.[1] ?? "");
      lamps.push({
        xp: xp || undefined,
        level,
        choice,
        count: words ? (NUMBER_WORDS[words.toLowerCase()] ?? Number(words)) : 1,
        ...(choice && options ? { options } : {}),
        text: line,
      });
    }
  }
  return { fixed, lamps };
}

/** Header chips: every reward group appears, so nothing is hidden behind quest points. */
export function rewardSummary(rewards: readonly string[]): RewardSummary[] {
  const groups = groupRewards(rewards);
  const chips: RewardSummary[] = [];
  const points = groups.questPoints[0]?.match(QUEST_POINTS);
  if (points)
    chips.push({
      group: "questPoints",
      text: `${points[1]} ${points[1] === "1" ? "quest point" : "quest points"}`,
      more: 0,
    });
  if (groups.experience.length) {
    const { fixed, lamps } = experienceRewards(groups.experience);
    const total = [...fixed.values()].reduce((sum, n) => sum + n, 0);
    const [only] = fixed.size === 1 ? [...fixed.keys()] : [];
    const fixedText = only
      ? `${total.toLocaleString("en")} ${only} XP`
      : fixed.size
        ? `${total.toLocaleString("en")} XP in ${fixed.size} skills`
        : "";
    const count = lamps.reduce((sum, lamp) => sum + lamp.count, 0);
    const lampText = count ? `${count} XP ${count === 1 ? "lamp" : "lamps"}` : "";
    chips.push({
      group: "experience",
      text: [fixedText, lampText].filter(Boolean).join(" + ") || "Experience",
      more: 0,
      ...(only ? { skill: only } : {}),
    });
  }
  for (const group of ["items", "unlocks"] as const)
    if (groups[group].length)
      chips.push({
        group,
        text: groups[group][0],
        more: groups[group].length - 1,
      });
  return chips;
}
