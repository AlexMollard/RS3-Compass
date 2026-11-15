import type { ItemReference } from "./data.ts";
import type { SkillName } from "./skillNames.ts";

export interface EquipmentAcquisition {
  label: string;
  members?: boolean;
  levels?: { skill: SkillName; level: number }[];
  unlocks?: string[];
  note: string;
}

export interface EquipmentRecommendation extends ItemReference {
  from: number;
  slot: string;
  // A practical progression milestone, not an extra requirement to use the item.
  planningSkill?: SkillName;
  members?: boolean;
  optional?: boolean;
  // Leaves no hand free, so no off-hand item is recommended alongside it.
  twoHanded?: boolean;
  condition?: string;
  levels?: { skill: SkillName; level: number }[];
  unlocks?: string[];
  note: string;
  methods?: string[];
  acquisition: EquipmentAcquisition[];
}

export type GearRouteKind =
  | "smith"
  | "craft"
  | "shop"
  | "common-drop"
  | "rare-drop"
  | "reward"
  | "quest"
  | "unknown";

/** How to get an item. */
export interface GearRoute {
  kind: GearRouteKind;
  note: string;
  levels?: { skill: SkillName; level: number }[];
  quests?: string[];
  unlocks?: string[];
  members?: boolean;
}

export type GearClass = "melee" | "ranged" | "magic" | "necromancy" | "none";
export type GearSlot = "2h" | "weapon" | "off-hand weapon" | "off-hand" | "head" | "body" | "legs" | "hands" | "feet";
export type GearTool = "pickaxe" | "hatchet" | "mattock";

/** An equipment item's facts from its Wiki page (src/equipmentImported.ts, generated). */
export interface ImportedItem {
  name: string;
  /** Wiki page title. */
  wiki: string;
  image?: string;
  slot: GearSlot;
  class: GearClass;
  tier: number;
  armourType?: "power" | "tank" | "hybrid";
  /** Skill levels needed to wear it; empty when the Wiki lists none. */
  wear: { skill: SkillName; level: number }[];
  members: boolean;
  tradeable: boolean;
  recipe?: { skill: SkillName; level: number };
  /** A skilling tool, from the Wiki's Pickaxes, Hatchets or Mattocks category. */
  tool?: GearTool;
  /** The route derived from Wiki recipe, shop and drop data; absent when none was found. */
  route?: GearRoute;
}

/** A hand-checked fact: the date it was checked against the Wiki, and the pages it came from. */
export interface Checked {
  checked: string;
  sources: string[];
}

export interface GearCuration {
  /** Wiki categories whose members are never imported, with the reason. */
  excludeCategories: Record<string, string>;
  /** Item names never imported (cosmetic, holiday, discontinued, or no usable Wiki data). */
  exclude: string[];
  /** Routes for single items; they win over families and the derived route. */
  routes: Record<string, GearRoute & Checked>;
  /** Routes for every item whose name matches `match` (a RegExp source). */
  families: { match: string; route: GearRoute & Checked }[];
  /** Quests needed to equip an item. */
  wearQuests: Record<string, { quests: string[] } & Checked>;
  checked: string;
}

export interface EquipmentGuide {
  note?: string;
  items: EquipmentRecommendation[];
}
