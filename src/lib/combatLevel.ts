/** Every skill the combat level formula reads. Necromancy and Summoning are both in the current Wiki formula. */
export const COMBAT_SKILLS = [
  "Attack",
  "Strength",
  "Ranged",
  "Magic",
  "Necromancy",
  "Defence",
  "Constitution",
  "Prayer",
  "Summoning",
] as const;

/**
 * A player's combat level, from https://runescape.wiki/w/Combat_level (checked 2026-11-16):
 * (1.3 * max(Att + Str, 2 Mag, 2 Rang, 2 Necr) + Def + Const + floor(Pray / 2) + floor(Summ / 2)) / 4, rounded down.
 * Worked values from that page: a new player (Constitution 10, the rest 1) is 3; 120 Attack, Strength, Ranged, Magic
 * and Necromancy with 99 in the other four is 152. It is undefined while any skill the formula reads is unrecorded.
 */
export function combatLevel(levels: Record<string, number>): number | undefined {
  if (COMBAT_SKILLS.some((skill) => levels[skill] == null)) return undefined;
  const l = levels;
  const offence = Math.max(
    l.Attack + l.Strength,
    2 * l.Magic,
    2 * l.Ranged,
    2 * l.Necromancy,
  );
  return Math.floor(
    (1.3 * offence + l.Defence + l.Constitution + Math.floor(l.Prayer / 2) + Math.floor(l.Summoning / 2)) / 4,
  );
}
