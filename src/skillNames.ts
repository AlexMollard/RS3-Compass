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

/** The skill named `name` in any letter case, if there is one. */
export function canonicalSkillName(name: string): SkillName | undefined {
  const key = name.toLowerCase();
  return RS3_SKILL_NAMES.find((skill) => skill.toLowerCase() === key);
}

// Row-major order from the RuneScape Skills interface:
// https://runescape.wiki/images/Skill_screen.png
export const SKILL_GAME_ORDER: readonly SkillName[] = [
  "Attack",
  "Constitution",
  "Mining",
  "Strength",
  "Agility",
  "Smithing",
  "Defence",
  "Herblore",
  "Fishing",
  "Ranged",
  "Thieving",
  "Cooking",
  "Prayer",
  "Crafting",
  "Firemaking",
  "Magic",
  "Fletching",
  "Woodcutting",
  "Runecrafting",
  "Slayer",
  "Farming",
  "Construction",
  "Hunter",
  "Summoning",
  "Dungeoneering",
  "Divination",
  "Invention",
  "Archaeology",
  "Necromancy",
];

const skillLookup: Record<string, true> = {};
for (const name of RS3_SKILL_NAMES) skillLookup[name] = true;

export function isSkillName(value: unknown): value is SkillName {
  return typeof value === "string" && skillLookup[value] === true;
}
