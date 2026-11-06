import type { QuestRecord } from "../data.ts";

export interface InventorySlot {
  line: string;
  key: string;
  packed: boolean;
}

const INVENTORY_SIZE = 28;

/** Lays a quest's supply lines into a 28-slot inventory; `packed` holds packing keys. */
export function inventorySlots(
  quest: Pick<QuestRecord, "id" | "supplies">,
  packed: readonly string[],
): { slots: InventorySlot[]; empty: number } {
  // shortcut: one slot per supply line, because the catalogue has no stack or quantity data. Split slots by quantity once supplies gain structured counts.
  const slots = quest.supplies.map((line) => {
    const key = quest.id + "::" + line;
    return { line, key, packed: packed.includes(key) };
  });
  return { slots, empty: Math.max(0, INVENTORY_SIZE - slots.length) };
}
