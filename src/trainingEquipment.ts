import type {
  ItemReference,
  Profile,
  SkillRecord,
  TrainingOption,
} from "./data.ts";
import type {
  EquipmentGuide,
  EquipmentRecommendation,
} from "./equipmentTypes.ts";
import { COMBAT_EQUIPMENT, EQUIPMENT_MATERIALS } from "./equipmentCombat.ts";
import { SKILLING_EQUIPMENT } from "./equipmentSkilling.ts";

export const EQUIPMENT_GUIDES = { ...COMBAT_EQUIPMENT, ...SKILLING_EQUIPMENT };
export const EQUIPMENT_ITEMS: ItemReference[] = [
  ...new Map<string, ItemReference>(
    [
      ...Object.values(EQUIPMENT_GUIDES).flatMap((guide) => guide.items),
      ...EQUIPMENT_MATERIALS,
    ].map((item) => [item.name.toLowerCase(), item] as const),
  ).values(),
];

export function selectEquipment(
  guide: EquipmentGuide,
  method: TrainingOption,
  profile: Profile,
) {
  // The stage describes the training method, not an equipment level.
  const available = guide.items.filter(
    (item) =>
      (profile.mode === "members" || !item.members) &&
      item.acquisition.some(
        (route) => profile.mode === "members" || !route.members,
      ) &&
      (!item.methods || item.methods.includes(method.id)),
  );
  const slots = new Map<string, EquipmentRecommendation[]>();
  for (const item of available.filter((item) => !item.optional)) {
    // Conditional requirements are separate from ordinary equipped slots.
    const key = item.condition ? `${item.slot}:${item.condition}` : item.slot;
    slots.set(key, [...(slots.get(key) ?? []), item]);
  }
  const current: EquipmentRecommendation[] = [];
  const upgrades: EquipmentRecommendation[] = [];
  for (const items of slots.values()) {
    const usable = items.filter((item) => {
      if (
        item.planningSkill &&
        item.from > (profile.levels[item.planningSkill] ?? 1)
      )
        return false;
      if (item.levels?.length)
        return item.levels.every(
          ({ skill: requirement, level }) =>
            profile.levels[requirement] !== undefined &&
            profile.levels[requirement]! >= level,
        );
      return true;
    });
    // A basic example is useful even when a level has not been recorded; it
    // is not evidence that the player owns or can use it.
    const selected = (usable.length ? usable : items).reduce((best, item) =>
      usable.length
        ? item.from > best.from
          ? item
          : best
        : item.from < best.from
          ? item
          : best,
    );
    current.push(selected);
    upgrades.push(
      ...items.filter((item) => item !== selected && item.from > selected.from),
    );
  }
  return {
    note: guide.note,
    current,
    upgrades,
    optional: available.filter((item) => item.optional),
  };
}

export type CombatStyle = "Attack" | "Ranged" | "Magic" | "Necromancy";

export function resolveTrainingEquipment(
  skill: SkillRecord,
  method: TrainingOption,
  profile: Profile,
  style: CombatStyle = "Attack",
) {
  const chooseStyle = ["Defence", "Constitution", "Slayer"].includes(
    skill.name,
  );
  if (!chooseStyle) {
    const guide = EQUIPMENT_GUIDES[skill.name];
    return guide ? selectEquipment(guide, method, profile) : undefined;
  }
  const guide = EQUIPMENT_GUIDES[style];
  if (!guide) return undefined;
  const masters = ["jacquelyn", "vannaka", "sumona", "kuradal", "laniakea"];
  const isDragon = ["blue-dragons", "wilderness-blue-dragons"].includes(
    method.id,
  );
  if (style === "Necromancy" && isDragon && profile.mode === "f2p")
    return {
      note: "The dual-weapon Necromancy example needs members' super antifire. Choose another equipment style for this F2P dragon method.",
      current: [],
      upgrades: [],
      optional: [],
    };
  const isGargoyle = method.id === "gargoyles";
  const context =
    style === "Necromancy"
      ? isDragon
        ? "necro-blue-dragons"
        : isGargoyle
          ? "necro-gargoyles"
          : "necro-combat"
      : skill.name === "Slayer" && masters.includes(method.id)
        ? "slayer-assignment"
        : method.id;
  const result = selectEquipment(guide, { ...method, id: context }, profile);
  if (skill.name !== "Slayer") return result;
  const taskGuide = EQUIPMENT_GUIDES.Slayer;
  if (!taskGuide) return result;
  const task = selectEquipment(taskGuide, method, profile);
  // Slayer's own guide retains the original master and its task-specific tools.
  const withoutFinisher = (items: EquipmentRecommendation[]) =>
    items.filter((item) => item.name !== "Rock hammer");
  return {
    note: result.note,
    current: [...withoutFinisher(result.current), ...task.current],
    upgrades: [...withoutFinisher(result.upgrades), ...task.upgrades],
    optional: [...withoutFinisher(result.optional), ...task.optional],
  };
}

export function equipmentLevels(
  item: Pick<EquipmentRecommendation, "levels">,
  profile: Profile,
) {
  return (item.levels ?? []).map((requirement) => {
    const recorded = profile.levels[requirement.skill];
    return {
      ...requirement,
      recorded,
      status:
        recorded === undefined
          ? "unknown"
          : recorded >= requirement.level
            ? "met"
            : "below",
    };
  });
}
