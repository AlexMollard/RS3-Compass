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

/** Case-insensitive identity of a player name; throws like normalizePlayerName. */
export function playerKey(name: unknown): string {
  return normalizePlayerName(name).toLowerCase();
}

/** Persisted id of a public profile. Stored in localStorage: never change the format. */
export function publicProfileId(name: unknown): string {
  return "rs3:" + playerKey(name);
}

/** Whether two names are the same player; an invalid name never matches. */
export function samePlayerName(a: string, b: string): boolean {
  try {
    return playerKey(a) === playerKey(b);
  } catch {
    return false;
  }
}
