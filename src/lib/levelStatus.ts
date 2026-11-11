export type LevelStatus = "met" | "below" | "unknown";

/** Whether a recorded level reaches a requirement; an unrecorded level is unknown. */
export function levelStatus(
  recorded: number | null | undefined,
  need: number,
): LevelStatus {
  if (recorded == null) return "unknown";
  return recorded >= need ? "met" : "below";
}
