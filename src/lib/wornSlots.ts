/** Worn-equipment layout, row by row, as the in-game equipment screen. `null` is a gap. */
export const WORN_LAYOUT = [
  [null, "Head", null],
  ["Cape", "Neck", "Ammo"],
  ["Main hand", "Body", "Off hand"],
  [null, "Legs", null],
  ["Hands", "Feet", "Ring"],
] as const;

export type WornSlot = Exclude<(typeof WORN_LAYOUT)[number][number], null>;

// shortcut: keyword match on the catalogue's free-text slot roles. Add a typed
// worn slot to EquipmentRecommendation if the catalogue grows past these words.
const rules: [RegExp, WornSlot][] = [
  [/off hand|dragonfire protection/i, "Off hand"],
  [/body(?! talisman)/i, "Body"],
  [/ammunition/i, "Ammo"],
  [/helmet/i, "Head"],
  [/gauntlets|gloves/i, "Hands"],
  [/boots/i, "Feet"],
  [/weapon|main hand|pickaxe|hatchet|mattock|magic upgrade/i, "Main hand"],
];

/** Maps a catalogue slot role ("pickaxe", "melee body") to a worn slot, if it is worn. */
export function wornSlot(slot: string): WornSlot | undefined {
  return rules.find(([pattern]) => pattern.test(slot))?.[1];
}
