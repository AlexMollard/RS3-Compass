import type { BossRecord } from "../bossTypes.ts";
import type { Profile } from "../data.ts";
import { activitySubject } from "./activityPresentation.ts";
import type { PlayerEvent } from "./playerTypes.ts";

type UniquesOf = (boss: BossRecord) => readonly string[];
const allUniques: UniquesOf = (boss) => boss.uniques;

export const logKey = (bossId: string, item: string): string =>
  `boss:${bossId}:${item}`;

/** Log keys for every boss unique found in `events`, each key once. */
export function autoMatches(
  events: readonly PlayerEvent[],
  bosses: readonly BossRecord[],
  uniquesOf: UniquesOf = allUniques,
): string[] {
  const found = new Set<string>();
  for (const event of events) {
    const subject = activitySubject(event);
    if (subject?.kind === "item") found.add(subject.name.toLowerCase());
  }
  const keys: string[] = [];
  if (!found.size) return keys;
  for (const boss of bosses)
    for (const item of uniquesOf(boss))
      if (found.has(item.toLowerCase())) keys.push(logKey(boss.id, item));
  return [...new Set(keys)];
}

/**
 * Adds each match from the profile's event log that hasn't been seen before to
 * both `collected` and `collectedAuto`. `collectedAuto` remembers every match
 * already seen, so a match the player unticked is never re-added.
 */
export function mergeAutoTicks(
  profile: Profile,
  bosses: readonly BossRecord[],
  uniquesOf: UniquesOf = allUniques,
): Profile {
  if (!profile.eventLog) return profile;
  const seen = new Set(profile.collectedAuto);
  const fresh = autoMatches(profile.eventLog.events, bosses, uniquesOf).filter(
    (key) => !seen.has(key),
  );
  if (!fresh.length) return profile;
  const collected = profile.collected ?? [];
  const ticked = new Set(collected);
  return {
    ...profile,
    collected: [...collected, ...fresh.filter((key) => !ticked.has(key))],
    collectedAuto: [...(profile.collectedAuto ?? []), ...fresh],
  };
}

export const isCollected = (profile: Profile, key: string): boolean =>
  profile.collected?.includes(key) ?? false;

/** Ticked and first ticked from the activity log. */
export const isAutoCollected = (profile: Profile, key: string): boolean =>
  isCollected(profile, key) && (profile.collectedAuto?.includes(key) ?? false);

/** Unticking removes the key from `collected` only. */
export function toggleCollected(profile: Profile, key: string): Profile {
  const collected = profile.collected ?? [];
  return {
    ...profile,
    collected: collected.includes(key)
      ? collected.filter((k) => k !== key)
      : [...collected, key],
  };
}

export function bossLogProgress(
  profile: Profile,
  boss: BossRecord,
  uniquesOf: UniquesOf = allUniques,
): { got: number; total: number } {
  const uniques = uniquesOf(boss);
  return {
    got: uniques.filter((item) => isCollected(profile, logKey(boss.id, item)))
      .length,
    total: uniques.length,
  };
}
