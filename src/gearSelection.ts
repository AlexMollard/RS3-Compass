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
// The skill a weapon row's items are worn with; armour rows use Defence.
const WEAPON_SKILL: Record<Exclude<GearStyle, "tool">, SkillName> = {
  melee: "Attack",
  ranged: "Ranged",
  magic: "Magic",
  necromancy: "Necromancy",
};
const WEAPON_ROWS: GearRowName[] = ["2h", "main hand", "off hand"];

const TOOL_LEVELS = EQUIPMENT_CURATION.toolLevels.map((t) => ({ ...t, re: new RegExp(t.match) }));
/** A tool's use levels: its imported wear without Attack, plus a curated gathering level the infobox lacks. */
function toolWear(item: ImportedItem) {
  // Tools ignore Attack: it's the requirement to wield them as a weapon, not to use them.
  const wear = item.wear.filter((w) => w.skill !== "Attack");
  const skill = TOOL_SKILL[item.tool!];
  if (wear.some((w) => w.skill === skill)) return wear;
  const curated = TOOL_LEVELS.find((t) => t.skill === skill && t.re.test(item.name));
  return curated ? [...wear, { skill: curated.skill, level: curated.level }] : wear;
}

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
/** How ordinary the route is: its place in EASY_KINDS (smith first), other kinds last. */
const ease = (c: Candidate) => {
  const i = EASY_KINDS.indexOf(c.route.kind);
  return i < 0 ? EASY_KINDS.length : i;
};
/**
 * Best's tie-break at equal tier: a known hard route (rare-drop) first, so the boss drop is best and the smithed
 * item easier; then the easy routes in EASY_KINDS order; an unknown route last, so a known item wins the tie.
 */
const routeOrder = (c: Candidate) =>
  c.route.kind === "unknown" ? EASY_KINDS.length + 1 : EASY_KINDS.includes(c.route.kind) ? 1 + ease(c) : 0;
// Easier and Wear at least break a tier tie on the more ordinary route first, so a smithed tank piece beats
// a minigame power piece (Penance gloves) of the same tier.
const minimumFirst = (a: Candidate, b: Candidate) =>
  a.rank - b.rank ||
  a.item.tier - b.item.tier ||
  ease(a) - ease(b) ||
  armourOrder(a) - armourOrder(b) ||
  a.item.name.localeCompare(b.item.name);
const easiestStrongest = (a: Candidate, b: Candidate) =>
  b.rank - a.rank ||
  b.item.tier - a.item.tier ||
  ease(a) - ease(b) ||
  armourOrder(a) - armourOrder(b) ||
  a.item.name.localeCompare(b.item.name);

/**
 * For each gear row, the best item the player can wear, an easier one to get, a minimum and the next upgrade.
 * In tool mode (`class: "tool"`), `minTier` and `maxTier` are gathering-skill levels (e.g. Mining), not item tiers.
 * A `minTier` of 1 or lower gives no Wear at least pick.
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
    const wear = tools ? toolWear(item) : item.wear;
    // A tool without a gathering level, imported or curated (toolLevels), can't be ranked.
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
  // The highest wear level the player hasn't met (an unrecorded skill counts as unmet), or 0 when only a quest gates it.
  const highestUnmet = (c: Candidate) =>
    Math.max(0, ...c.wear.filter((w) => levelStatus(profile.levels[w.skill], w.level) !== "met").map((w) => w.level));
  // Strongest first: rank, tier, power before tank, then the route order (a known hard route, then easy routes,
  // then unknown), then name. Tradeability never breaks the tie.
  const strongestFirst = (a: Candidate, b: Candidate) =>
    b.rank - a.rank ||
    b.item.tier - a.item.tier ||
    armourOrder(a) - armourOrder(b) ||
    routeOrder(a) - routeOrder(b) ||
    a.item.name.localeCompare(b.item.name);
  // Next is the upgrade closest in reach: the lowest highest-unmet level, then the strongest, then the most
  // ordinary route, so Annihilation (Attack 87) comes before a tier-86 sword that needs Attack 99.
  const closestFirst = (a: Candidate, b: Candidate) =>
    highestUnmet(a) - highestUnmet(b) ||
    b.rank - a.rank ||
    b.item.tier - a.item.tier ||
    ease(a) - ease(b) ||
    armourOrder(a) - armourOrder(b) ||
    a.item.name.localeCompare(b.item.name);
  // Each row is judged on its primary skill: Defence for armour, the class skill for weapons, the gathering
  // skill for a tool. With that unrecorded the row asks for it instead of guessing; any other unrecorded skill
  // only keeps the items that need it out of Best.
  const primarySkill = (row: GearRowName): SkillName =>
    tools ? TOOL_SKILL[options.toolSlot as GearTool] : WEAPON_ROWS.includes(row) ? WEAPON_SKILL[options.class as Exclude<GearStyle, "tool">] : "Defence";

  const rows: GearRow[] = [];
  for (const name of ROW_ORDER) {
    const candidates = buckets.get(name);
    if (!candidates) continue;
    candidates.sort(strongestFirst);
    const row: GearRow = { row: name };
    const primary = primarySkill(name);
    if (profile.levels[primary] == null) row.unrecorded = primary;
    else {
      const best = candidates.find(wearable);
      const above = best ? candidates.filter((c) => c.rank > best.rank) : candidates;
      const next = [...above].sort(closestFirst)[0];
      if (best) row.best = pick(best);
      const easier = candidates.filter((c) => easy(c) && wearable(c)).sort(easiestStrongest)[0];
      if (easier && easier !== best) row.easier = pick(easier);
      if (next) row.next = pick(next);
    }
    // A minimum of tier 1 or lower means any item will do, so no pick (it would only surface joke items).
    if (minTier !== undefined && minTier > 1) {
      const eligible = candidates.filter((c) => c.rank >= minTier);
      const preferred = eligible.some(easy) ? eligible.filter(easy) : eligible;
      const atLeast = preferred.sort(minimumFirst)[0];
      if (atLeast) row.atLeast = { ...pick(atLeast), reason: options.minReason ?? "" };
    }
    rows.push(row);
  }
  return rows;
}
