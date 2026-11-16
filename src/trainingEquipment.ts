import type { Profile, TrainingOption } from "./data.ts";
import type { EquipmentRecommendation, GearTool } from "./equipmentTypes.ts";
import { EQUIPMENT_EXTRAS } from "./equipmentExtras.ts";
import { selectGear, type GearRow, type GearStyle } from "./gearSelection.ts";
import { levelStatus } from "./lib/levelStatus.ts";
import type { SkillName } from "./skillNames.ts";

export type CombatClass = Exclude<GearStyle, "tool">;

/** Skills trained with any combat style; their page offers a style choice. */
export const STYLE_SKILLS: SkillName[] = ["Defence", "Constitution", "Slayer"];
const OWN_CLASS: Partial<Record<SkillName, CombatClass>> = {
  Attack: "melee",
  Strength: "melee",
  Ranged: "ranged",
  Magic: "magic",
  Necromancy: "necromancy",
};
const TOOLS: Partial<Record<SkillName, GearTool>> = {
  Mining: "pickaxe",
  Woodcutting: "hatchet",
  Archaeology: "mattock",
};
// The skill whose extras (dragonfire protection, finishers) go with each style.
const STYLE_EXTRAS: Record<CombatClass, SkillName> = {
  melee: "Attack",
  ranged: "Ranged",
  magic: "Magic",
  necromancy: "Necromancy",
};
const DRAGONS = ["blue-dragons", "wilderness-blue-dragons"];

/** The gear class a skill page shows; `style` applies to Defence, Constitution and Slayer. */
export function gearClass(skill: SkillName, style: CombatClass = "melee"): GearStyle | undefined {
  if (STYLE_SKILLS.includes(skill)) return style;
  return OWN_CLASS[skill] ?? (TOOLS[skill] ? "tool" : undefined);
}

const usable = (item: EquipmentRecommendation, profile: Profile) =>
  (!item.planningSkill || item.from <= (profile.levels[item.planningSkill] ?? 1)) &&
  (item.levels ?? []).every(({ skill, level }) => levelStatus(profile.levels[skill], level) === "met");

/**
 * A guide's items for the method: per slot (or condition), the furthest step the recorded levels reach,
 * or the first step when none is reached; then optional items.
 */
function pickExtras(items: EquipmentRecommendation[], methodId: string, profile: Profile) {
  const available = items.filter(
    (item) =>
      (profile.mode === "members" || !item.members) &&
      item.acquisition.some((route) => profile.mode === "members" || !route.members) &&
      (!item.methods || item.methods.includes(methodId)),
  );
  const slots = new Map<string, EquipmentRecommendation[]>();
  for (const item of available.filter((item) => !item.optional)) {
    const key = item.condition ? `${item.slot}:${item.condition}` : item.slot;
    slots.set(key, [...(slots.get(key) ?? []), item]);
  }
  const picked = [...slots.values()].map((group) => {
    const reached = group.filter((item) => usable(item, profile));
    return reached.length
      ? reached.reduce((best, item) => (item.from > best.from ? item : best))
      : group.reduce((low, item) => (item.from < low.from ? item : low));
  });
  return [...picked, ...available.filter((item) => item.optional)];
}

/**
 * A skill page's gear: one row per slot from the imported catalogue, plus the hand-written extras
 * (finishers, protection, skill tools) for the method.
 */
export function trainingGear(
  skill: SkillName,
  method: TrainingOption,
  profile: Profile,
  style: CombatClass = "melee",
): { rows: GearRow[]; extras: EquipmentRecommendation[]; note?: string } {
  const chooseStyle = STYLE_SKILLS.includes(skill);
  const gearStyle = gearClass(skill, style);
  if (chooseStyle && style === "necromancy" && DRAGONS.includes(method.id) && profile.mode !== "members")
    return {
      rows: [],
      extras: [],
      note: "The dual-weapon Necromancy setup needs members' super antifire. Choose another style for this F2P dragon method.",
    };
  // A combat table needs the method's minimum; Necromancy rituals have none because they are not fights.
  const rows =
    gearStyle === "tool"
      ? selectGear({ class: "tool", toolSlot: TOOLS[skill], profile })
      : gearStyle && method.gear
        ? selectGear({ class: gearStyle, profile, minTier: method.gear.minTier, minReason: method.gear.reason })
        : [];
  // Necromancy extras are keyed by the Necromancy page's own method ids.
  const styleMethod =
    style === "necromancy" && DRAGONS.includes(method.id)
      ? "necro-blue-dragons"
      : style === "necromancy" && method.id === "gargoyles"
        ? "necro-gargoyles"
        : method.id;
  const sources: [EquipmentRecommendation[], string][] = chooseStyle
    ? [
        [EQUIPMENT_EXTRAS[STYLE_EXTRAS[style]]?.items ?? [], styleMethod],
        [skill === "Slayer" ? (EQUIPMENT_EXTRAS.Slayer?.items ?? []) : [], method.id],
      ]
    : [[EQUIPMENT_EXTRAS[skill]?.items ?? [], method.id]];
  const extras = [
    ...new Map(
      sources.flatMap(([items, id]) => pickExtras(items, id, profile)).map((item) => [item.name, item] as const),
    ).values(),
  ];
  return { rows, extras, note: chooseStyle ? undefined : EQUIPMENT_EXTRAS[skill]?.note };
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
      status: levelStatus(recorded, requirement.level),
    };
  });
}
