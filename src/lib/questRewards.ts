import { RS3_SKILL_NAMES } from "../skillNames.ts";

export interface RewardGroups {
  questPoints: string[];
  experience: string[];
  unlocks: string[];
  items: string[];
}

export type RewardHighlight =
  | { kind: "quest-points"; points: number }
  | { kind: "skill-xp"; skill: string; xp: number }
  | { kind: "lamp" }
  | { kind: "unlock"; text: string };

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

/** Short header chips: quest points, fixed skill XP, a lamp marker and the first unlock. */
export function rewardHighlights(
  rewards: readonly string[],
  limit = 5,
): RewardHighlight[] {
  const groups = groupRewards(rewards);
  const chips: RewardHighlight[] = [];
  const points = groups.questPoints[0]?.match(QUEST_POINTS);
  if (points) chips.push({ kind: "quest-points", points: Number(points[1]) });
  const xp = new Map<string, number>();
  let lamp = false;
  for (const line of groups.experience) {
    let found = false;
    for (const match of line.matchAll(SKILL_XP)) {
      found = true;
      const skill = match[2];
      xp.set(skill, (xp.get(skill) ?? 0) + Number(match[1].replace(/,/g, "")));
    }
    if (!found || /\blamps?\b/i.test(line)) lamp = true;
  }
  for (const [skill, amount] of xp)
    chips.push({ kind: "skill-xp", skill, xp: amount });
  if (lamp) chips.push({ kind: "lamp" });
  if (groups.unlocks[0])
    chips.push({ kind: "unlock", text: groups.unlocks[0] });
  return chips.slice(0, limit);
}
