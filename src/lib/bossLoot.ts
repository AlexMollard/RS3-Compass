import type { BossDrop } from "../bossTypes.ts";

export type Prices = Readonly<Record<string, number>>;
export type LootRow = BossDrop & { price?: number; perKill?: number };

// A plain decimal; commas count only as thousands separators (1,000 / 1,234,567.5).
const num = (s: string): number | undefined => {
  const t = s.trim();
  if (/^\d{1,3}(,\d{3})+(\.\d+)?$/.test(t)) return Number(t.replace(/,/g, ""));
  return /^\d+(\.\d+)?$/.test(t) ? Number(t) : undefined;
};

// A number or an "a-b" range (midpoint).
const numOrRange = (s: string): number | undefined => {
  const parts = s.split("-");
  if (parts.length === 1) return num(s);
  if (parts.length !== 2) return undefined;
  const a = num(parts[0]);
  const b = num(parts[1]);
  return a === undefined || b === undefined ? undefined : (a + b) / 2;
};

export function rarityProbability(rarity: string): number | undefined {
  const r = rarity.trim();
  if (r.toLowerCase() === "always") return 1;
  const parts = r.split("/");
  if (parts.length !== 2) return undefined;
  const a = num(parts[0]);
  const b = num(parts[1]);
  return a === undefined || b === undefined || b === 0 ? undefined : a / b;
}

export function meanQuantity(quantity: string): number | undefined {
  const q = quantity.replace(/\(noted\)/gi, "").trim();
  const whole = numOrRange(q);
  if (whole !== undefined) return whole;
  // Otherwise a comma-separated list of alternatives: average them.
  const values = q.split(",").map(numOrRange);
  if (values.length < 2 || values.some((v) => v === undefined)) return undefined;
  return (values as number[]).reduce((s, v) => s + v, 0) / values.length;
}

export function lootRows(
  drops: readonly BossDrop[],
  prices: Prices | undefined,
): LootRow[] {
  const rows = drops.map((drop): LootRow => {
    const price = drop.item === "Coins" ? 1 : prices?.[drop.item];
    const qty = meanQuantity(drop.quantity);
    const p = rarityProbability(drop.rarity);
    const row: LootRow = { ...drop };
    if (price !== undefined) row.price = price;
    if (price !== undefined && qty !== undefined && p !== undefined) {
      row.perKill = price * qty * p;
    }
    return row;
  });
  // Array.prototype.sort is stable: unpriced rows keep their original order.
  return rows.sort((a, b) => {
    if (a.perKill === undefined || b.perKill === undefined) {
      return (a.perKill === undefined ? 1 : 0) - (b.perKill === undefined ? 1 : 0);
    }
    return b.perKill - a.perKill;
  });
}

export function lootSummary(rows: LootRow[]): {
  average: number;
  unpriced: number;
  top: LootRow[];
} {
  const priced = rows.filter((r) => r.perKill !== undefined);
  return {
    average: priced.reduce((sum, r) => sum + (r.perKill ?? 0), 0),
    unpriced: rows.length - priced.length,
    top: [...priced]
      .sort((a, b) => (b.perKill ?? 0) - (a.perKill ?? 0))
      .slice(0, 3),
  };
}
