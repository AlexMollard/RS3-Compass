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

export interface EquipmentGuide {
  note?: string;
  items: EquipmentRecommendation[];
}
