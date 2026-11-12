import type { BossDrop } from "../bossTypes.ts";

export type Prices = Readonly<Record<string, number>>;
export type LootRow = BossDrop & { price?: number; perKill?: number };

const num = (s: string): number | undefined => {
  const n = Number(s.replace(/,/g, "").trim());
  return s.trim() !== "" && Number.isFinite(n) ? n : undefined;
};

export function rarityProbability(rarity: string): number | undefined {
  const r = rarity.trim();
  if (r === "Always") return 1;
  const m = /^([\d,]+)\/([\d,]+)$/.exec(r);
  if (!m) return undefined;
  const a = num(m[1]);
  const b = num(m[2]);
  return a === undefined || b === undefined || b === 0 ? undefined : a / b;
}

export function meanQuantity(quantity: string): number | undefined {
  const q = quantity.replace(/\(noted\)/gi, "").replace(/,/g, "").trim();
  const range = /^(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)$/.exec(q);
  if (range) return (Number(range[1]) + Number(range[2])) / 2;
  return num(q);
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
