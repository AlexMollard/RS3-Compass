export function normalizePlayerName(value: unknown): string {
  if (typeof value !== "string")
    throw new Error("Enter a RuneScape player name.");
  const name = value.trim().replaceAll("_", " ").replace(/ +/g, " ");
  if (!/^[\p{L}\p{N} -]{1,12}$/u.test(name)) {
    throw new Error(
      "Use a player name of 1–12 letters, numbers, spaces or hyphens.",
    );
  }
  return name;
}
