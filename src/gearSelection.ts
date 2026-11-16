import type { Profile } from "./data.ts";
import { EASY_KINDS, EQUIPMENT_CURATION, routeFor } from "./equipmentCuration.ts";
import { EQUIPMENT_IMPORTED } from "./equipmentImported.ts";
import type { GearRoute, GearSlot, GearTool, ImportedItem } from "./equipmentTypes.ts";
import { levelStatus } from "./lib/levelStatus.ts";
import type { SkillName } from "./skillNames.ts";

/** The style a gear table is picked for: a combat class, or a skilling tool. */
export type GearStyle = "melee" | "ranged" | "magic" | "necromancy" | "tool";
export type GearRowName = "2h" | "main hand" | "off hand" | "head" | "body" | "legs" | "hands" | "feet" | "tool";
export type LevelGap = { skill: SkillName; level: number; recorded?: number };

export interface GearPick {
  item: ImportedItem;
  route: GearRoute;
  /** Unmet levels needed to wear the item. */
  missing: LevelGap[];
  /** Unmet quests needed to wear the item (quest IDs). */
  missingQuests: string[];
  /** Unmet levels on the route to get the item. */
  routeMissing: LevelGap[];
  /** Unmet quests on the route to get the item (quest IDs). */
  routeMissingQuests: string[];
}

export interface GearRow {
  row: GearRowName;
  best?: GearPick;
  easier?: GearPick;
  atLeast?: GearPick & { reason: string };
  next?: GearPick;
  /** A wear skill to record before anything can be picked. */
  unrecorded?: SkillName;
}

export interface SelectGearOptions {
  class: GearStyle;
  profile: Profile;
  minTier?: number;
  minReason?: string;
  maxTier?: number;
  items?: ImportedItem[];
  toolSlot?: GearTool | string;
}

// Shields ("off-hand") are not a training row: dual wield is main hand plus off-hand weapon.
const ROW_OF: Partial<Record<GearSlot, GearRowName>> = {
  "2h": "2h",
  weapon: "main hand",
  "off-hand weapon": "off hand",
  head: "head",
  body: "body",
  legs: "legs",
  hands: "hands",
  feet: "feet",
};
const ROW_ORDER: GearRowName[] = ["2h", "main hand", "off hand", "head", "body", "legs", "hands", "feet", "tool"];
// The gathering skill a tool's strength follows; other wear skills (Firemaking on an adze) are extra gates.
const TOOL_SKILL: Record<GearTool, SkillName> = { pickaxe: "Mining", hatchet: "Woodcutting", mattock: "Archaeology" };

// routeFor tests every curated family RegExp; cache it per item since selection runs on each render.
const routes = new WeakMap<ImportedItem, GearRoute>();
const routeOf = (item: ImportedItem): GearRoute => {
  let route = routes.get(item);
  if (!route) routes.set(item, (route = routeFor(item)));
  return route;
};

interface Candidate {
  item: ImportedItem;
  route: GearRoute;
  rank: number;
  wear: { skill: SkillName; level: number }[];
  quests: string[];
}

const armourOrder = (c: Candidate) => (c.item.armourType === "power" ? 0 : 1);
/** Weakest first: rank, then power before tank, then name. */
const weakestFirst = (a: Candidate, b: Candidate) =>
  a.rank - b.rank || a.item.tier - b.item.tier || armourOrder(a) - armourOrder(b) || a.item.name.localeCompare(b.item.name);

/**
 * For each gear row, the best item the player can wear, an easier one to get, a minimum and the next upgrade.
 * In tool mode (`class: "tool"`), `minTier` and `maxTier` are gathering-skill levels (e.g. Mining), not item tiers.
 */
export function selectGear(options: SelectGearOptions): GearRow[] {
  const { profile, minTier, maxTier } = options;
  const tools = options.class === "tool";
  if (tools && !options.toolSlot) return [];
  const members = profile.mode === "members";
  const regular = profile.kind === "Regular account";
  const completed = new Set(profile.completedQuests);

  // One pass over the catalogue: filter by style, membership and tier, and bucket by row.
  const buckets = new Map<GearRowName, Candidate[]>();
  for (const item of options.items ?? EQUIPMENT_IMPORTED) {
    if (tools ? item.tool !== options.toolSlot : item.tool || item.class !== options.class) continue;
    if (item.armourType === "hybrid") continue;
    const row = tools ? "tool" : ROW_OF[item.slot];
    if (!row) continue;
    const route = routeOf(item);
    if (!members && (item.members || route.members)) continue;
    // Tools ignore Attack: it's the requirement to wield them as a weapon, not to use them.
    const wear = tools ? item.wear.filter((w) => w.skill !== "Attack") : item.wear;
    // A tool without a gathering-skill requirement can't be ranked (Inferno adze imports only Firemaking 92).
    const rank = tools ? wear.find((w) => w.skill === TOOL_SKILL[item.tool!])?.level : item.tier;
    if (rank === undefined) continue;
    if (maxTier !== undefined && rank > maxTier) continue;
    const quests = EQUIPMENT_CURATION.wearQuests[item.name]?.quests ?? [];
    let bucket = buckets.get(row);
    if (!bucket) buckets.set(row, (bucket = []));
    bucket.push({ item, route, rank, wear, quests });
  }

  const gaps = (levels: { skill: SkillName; level: number }[] = []): LevelGap[] =>
    levels
      .filter((l) => levelStatus(profile.levels[l.skill], l.level) !== "met")
      .map((l) => (profile.levels[l.skill] == null ? { ...l } : { ...l, recorded: profile.levels[l.skill] }));
  const pick = (c: Candidate): GearPick => ({
    item: c.item,
    route: c.route,
    missing: gaps(c.wear),
    missingQuests: c.quests.filter((q) => !completed.has(q)),
    routeMissing: gaps(c.route.levels),
    routeMissingQuests: (c.route.quests ?? []).filter((q) => !completed.has(q)),
  });
  const easy = (c: Candidate) => EASY_KINDS.includes(c.route.kind) || (regular && c.item.tradeable);
  const wearable = (c: Candidate) =>
    c.wear.every((w) => levelStatus(profile.levels[w.skill], w.level) === "met") && c.quests.every((q) => completed.has(q));
  // A skill the player hasn't recorded, on an item that no recorded level rules out.
  const unknownSkill = (c: Candidate) =>
    c.wear.some((w) => levelStatus(profile.levels[w.skill], w.level) === "below")
      ? undefined
      : c.wear.find((w) => profile.levels[w.skill] == null)?.skill;
  // Strongest first: rank, tier, power before tank, then a harder route before an easy one (so an equal-tier
  // boss drop is best and the smithable item is easier), then name.
  const strongestFirst = (a: Candidate, b: Candidate) =>
    b.rank - a.rank ||
    b.item.tier - a.item.tier ||
    armourOrder(a) - armourOrder(b) ||
    Number(easy(a)) - Number(easy(b)) ||
    a.item.name.localeCompare(b.item.name);

  const rows: GearRow[] = [];
  for (const name of ROW_ORDER) {
    const candidates = buckets.get(name);
    if (!candidates) continue;
    candidates.sort(strongestFirst);
    const best = candidates.find(wearable);
    const above = best ? candidates.filter((c) => c.rank > best.rank) : candidates;
    const next = above.reduce<Candidate | undefined>((low, c) => (!low || weakestFirst(c, low) < 0 ? c : low), undefined);
    // When nothing is wearable, or only requirement-free items are (bronze), and the next item is gated only by
    // an unrecorded level, prompt for that level rather than fall back.
    const unrecorded = next && (!best || best.wear.length === 0) ? unknownSkill(next) : undefined;
    const row: GearRow = { row: name };
    if (unrecorded) row.unrecorded = unrecorded;
    else {
      if (best) row.best = pick(best);
      const easier = candidates.find((c) => easy(c) && wearable(c));
      if (easier && easier !== best) row.easier = pick(easier);
      if (next) row.next = pick(next);
    }
    if (minTier !== undefined) {
      const eligible = candidates.filter((c) => c.rank >= minTier);
      const preferred = eligible.some(easy) ? eligible.filter(easy) : eligible;
      const atLeast = preferred.sort(weakestFirst)[0];
      if (atLeast) row.atLeast = { ...pick(atLeast), reason: options.minReason ?? "" };
    }
    rows.push(row);
  }
  return rows;
}
