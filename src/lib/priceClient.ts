import type { Prices } from "./bossLoot";
import { isRecord } from "./guards";

/** Live Grand Exchange prices for `names`, or undefined on any failure. */
export async function fetchPrices(names: string[]): Promise<Prices | undefined> {
  try {
    const response = await fetch(
      `/api/prices?names=${names.map(encodeURIComponent).join("|")}`,
    );
    if (!response.ok) return undefined;
    const body: unknown = await response.json();
    if (!isRecord(body) || !isRecord(body.prices)) return undefined;
    return body.prices as Prices;
  } catch {
    return undefined;
  }
}
