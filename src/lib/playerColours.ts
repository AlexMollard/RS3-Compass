/**
 * One fixed colour per compared player slot, by position, never by rank.
 * The first three pass colour-blind separation on the dark surface; four and
 * five rely on each box's position and label, so colour never carries identity alone.
 */
export const PLAYER_COLOURS = [
  "#3987e5",
  "#d95926",
  "#199e70",
  "#d55181",
  "#9085e9",
] as const;

export const playerColour = (index: number) =>
  PLAYER_COLOURS[index % PLAYER_COLOURS.length];
