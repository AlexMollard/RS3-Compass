// The hand-written items skill pages list under the gear table, and the item links they give game text.
// Kept apart from src/trainingEquipment.ts so src/lib/gameText.ts, loaded on every page, never pulls in
// the imported gear catalogue.
import type { ItemReference } from "./data.ts";
import type { EquipmentGuide } from "./equipmentTypes.ts";
import { COMBAT_EXTRAS, EQUIPMENT_MATERIALS } from "./equipmentCombat.ts";
import { SKILLING_EQUIPMENT } from "./equipmentSkilling.ts";
import type { SkillName } from "./skillNames.ts";

export const EQUIPMENT_EXTRAS: Partial<Record<SkillName, EquipmentGuide>> = {
  ...COMBAT_EXTRAS,
  ...SKILLING_EQUIPMENT,
};

export const EQUIPMENT_ITEMS: ItemReference[] = [
  ...new Map<string, ItemReference>(
    [
      ...Object.values(EQUIPMENT_EXTRAS).flatMap((guide) => guide.items),
      ...EQUIPMENT_MATERIALS,
    ].map((item) => [item.name.toLowerCase(), item] as const),
  ).values(),
];
