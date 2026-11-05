// Shared RS3 skill registry; Platform API records are matched by name, never position.
export const RS3_SKILL_NAMES = [
  "Attack",
  "Defence",
  "Strength",
  "Constitution",
  "Ranged",
  "Prayer",
  "Magic",
  "Cooking",
  "Woodcutting",
  "Fletching",
  "Fishing",
  "Firemaking",
  "Crafting",
  "Smithing",
  "Mining",
  "Herblore",
  "Agility",
  "Thieving",
  "Slayer",
  "Farming",
  "Runecrafting",
  "Hunter",
  "Construction",
  "Summoning",
  "Dungeoneering",
  "Divination",
  "Invention",
  "Archaeology",
  "Necromancy",
] as const;

export type SkillName = (typeof RS3_SKILL_NAMES)[number];

const skillLookup: Record<string, true> = {};
for (const name of RS3_SKILL_NAMES) skillLookup[name] = true;

export function isSkillName(value: unknown): value is SkillName {
  return typeof value === "string" && skillLookup[value] === true;
}
