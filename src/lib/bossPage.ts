import type { BossRecord } from "../bossTypes.ts";
import { COMBAT_EQUIPMENT } from "../equipmentCombat.ts";
import type { EquipmentRecommendation } from "../equipmentTypes.ts";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** A guide's "2026-11" stamp as "Nov 2026"; anything else is shown as written. */
export function checkedLabel(checked: string): string {
  const match = /^(\d{4})-(\d{2})$/.exec(checked);
  const month = match ? MONTHS[Number(match[2]) - 1] : undefined;
  return match && month ? `${month} ${match[1]}` : checked;
}

/**
 * Rarity text fit to show: drops a leftover wiki `<!--` comment, and reads an empty or
 * truncated "N/" rarity as "Unknown".
 */
export function displayRarity(rarity: string): string {
  const text = rarity.split("<!--")[0].trim();
  return !text || /^\d+\/$/.test(text) ? "Unknown" : text;
}

/** The item's rarity in the first drop-table version that lists it. */
export function firstRarity(boss: BossRecord, item: string): string | undefined {
  for (const drops of Object.values(boss.drops)) {
    const drop = drops.find((d) => d.item === item);
    if (drop) return displayRarity(drop.rarity);
  }
  return undefined;
}

/** The first "tier N" in a setup line, or undefined when the line states none. */
export function statedTier(text: string): number | undefined {
  const match = /\btier (\d+)/i.exec(text);
  return match ? Number(match[1]) : undefined;
}

const STYLE_SKILL = { melee: "Attack", ranged: "Ranged", magic: "Magic" } as const;
const GEAR_SLOT = /^(melee|ranged|magic) (weapon|off hand|body|ammunition)$/;

/**
 * Example gear for a guide's setup line: the best item per core slot from the Skills page's
 * equipment tables, up to the line's stated tier. No stated tier means no icons, never a guess.
 */
export function setupGear(
  style: keyof typeof STYLE_SKILL,
  text: string,
  members: boolean,
): EquipmentRecommendation[] {
  const tier = statedTier(text);
  if (tier === undefined) return [];
  const best = new Map<string, EquipmentRecommendation>();
  for (const item of COMBAT_EQUIPMENT[STYLE_SKILL[style]]?.items ?? []) {
    if (item.optional || !GEAR_SLOT.test(item.slot) || item.from > tier) continue;
    if (item.members && !members) continue;
    const held = best.get(item.slot);
    if (!held || item.from > held.from) best.set(item.slot, item);
  }
  const weapon = best.get(`${style} weapon`);
  if (weapon?.twoHanded) best.delete(`${style} off hand`);
  return [...best.values()];
}
