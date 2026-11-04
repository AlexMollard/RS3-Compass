import { normalizePlayerName } from "./playerName.ts";

const COOKIE = "rs3_compass_player";
const MAX_AGE = 60 * 60 * 24 * 180;

export function readRememberedPlayer(): string {
  const value = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(COOKIE + "="));
  if (!value) return "";
  try {
    return normalizePlayerName(
      decodeURIComponent(value.slice(COOKIE.length + 1)),
    );
  } catch {
    return "";
  }
}

export function rememberPlayer(name: string): void {
  const secure = location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${COOKIE}=${encodeURIComponent(normalizePlayerName(name))}; Max-Age=${MAX_AGE}; Path=/; SameSite=Lax${secure}`;
}

export function clearRememberedPlayer(): void {
  const secure = location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${COOKIE}=; Max-Age=0; Path=/; SameSite=Lax${secure}`;
}
