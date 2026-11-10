export function normalizePlayerName(value: unknown): string {
  if (typeof value !== "string")
    throw new Error("Enter a RuneScape player name.");
  // Jagex writes some names with non-breaking spaces; treat them like "_" and " ".
  const name = value.trim().replace(/[_ ]/g, " ").replace(/ +/g, " ");
  if (!/^[\p{L}\p{N} -]{1,12}$/u.test(name)) {
    throw new Error(
      "Use a player name of 1–12 letters, numbers, spaces or hyphens.",
    );
  }
  return name;
}
