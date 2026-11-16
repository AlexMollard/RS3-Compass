import type { BossRecord } from "../bossTypes.ts";
import { QUESTS, type Profile } from "../data.ts";
import type { ImportedItem } from "../equipmentTypes.ts";
import { selectGear } from "../gearSelection.ts";
import { RS3_SKILL_NAMES } from "../skillNames.ts";

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

// A boss kit is a reference, not a player check: every level at 120 and every quest done, so only the
// stated tier and free-to-play limit what is shown.
const REFERENCE_QUESTS = QUESTS.map((quest) => quest.id);
const referenceProfile = (members: boolean): Profile => ({
  id: "boss-reference",
  name: "Reference",
  kind: "Regular account",
  mode: members ? "members" : "f2p",
  levels: Object.fromEntries(RS3_SKILL_NAMES.map((skill) => [skill, 120])),
  completedQuests: REFERENCE_QUESTS,
  packed: [],
  completedTasks: [],
  activeTask: "",
  notes: {},
});

/**
 * Example gear for a guide's setup line: the best imported item per slot up to the line's stated tier,
 * as a player with every level and quest would wear it. No stated tier means no icons, never a guess.
 */
export function setupGear(
  style: "melee" | "ranged" | "magic",
  text: string,
  members: boolean,
): ImportedItem[] {
  const tier = statedTier(text);
  if (tier === undefined) return [];
  const rows = selectGear({ class: style, profile: referenceProfile(members), maxTier: tier });
  const twoHanded = rows.some((row) => row.row === "2h" && row.best);
  return rows
    .filter((row) => !(twoHanded && (row.row === "main hand" || row.row === "off hand")))
    .flatMap((row) => (row.best ? [row.best.item] : []));
}
