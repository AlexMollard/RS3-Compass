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
const SKILL_XP = new RegExp(
  `([\\d,]+) (${RS3_SKILL_NAMES.join("|")}) XP\\b(?! lamp)`,
  "g",
);

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

/** Fixed XP per skill, and whether any line also grants lamps or unnamed XP. */
export function experienceTotals(lines: readonly string[]) {
  const xp = new Map<string, number>();
  let lamp = false;
  for (const line of lines) {
    let found = false;
    for (const match of line.matchAll(SKILL_XP)) {
      found = true;
      const skill = match[2];
      xp.set(skill, (xp.get(skill) ?? 0) + Number(match[1].replace(/,/g, "")));
    }
    if (!found || /\blamps?\b/i.test(line)) lamp = true;
  }
  return { xp, lamp };
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
    const { xp, lamp } = experienceTotals(groups.experience);
    const total = [...xp.values()].reduce((sum, n) => sum + n, 0);
    const [only] = xp.size === 1 ? [...xp.keys()] : [];
    const fixed = only
      ? `${total.toLocaleString("en")} ${only} XP`
      : xp.size
        ? `${total.toLocaleString("en")} XP in ${xp.size} skills`
        : "";
    chips.push({
      group: "experience",
      text: fixed ? (lamp ? `${fixed} + lamps` : fixed) : "XP lamps",
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
