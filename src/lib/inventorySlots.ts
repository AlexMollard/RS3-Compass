import type { QuestRecord } from "../data.ts";
import {
  lineArt,
  tokenizeGameText,
  type GameTextReference,
} from "./gameText.ts";
import { packKey } from "./packing.ts";

export interface InventorySlot {
  /** Unique per slot, for rendering. */
  id: string;
  line: string;
  /** Packing key shared by every slot from one supply line. */
  key: string;
  packed: boolean;
  art?: GameTextReference;
  /** Stack size shown on a stackable slot; omitted for single items. */
  count?: number;
  title: string;
}

export const INVENTORY_SIZE = 28;

// Stackable in a backpack without noting. Anything else takes one slot per item.
const STACKABLE =
  /^(coins|thread|feather|fishing bait|(\w+ )?nails|\w+ rune|\w+ ghostly ink|\w+ seeds?)$/i;

/** The part of a supply line that lists what to carry, before alternatives and explanations. */
function mainClause(line: string): string {
  const cut = line.search(/;|\(|,? or |,? alternatively | for | to | — /i);
  return cut === -1 ? line : line.slice(0, cut);
}

// What may sit between list items: separators, an optional count, an article, and noted/unnoted.
const LEAD = /^(?:optional:?\s*(?:pack\s+)?)?(?:,|\band\b|\bplus\b|\s)*(?:(\d[\d,]*)\s+|an?\s+)?(unnoted\s+|noted\s+)?$/i;

interface LineItem {
  reference: GameTextReference;
  quantity: number;
  stackable: boolean;
}

/** Items named in a supply line's main clause, with the count written before each. */
export function lineItems(line: string): LineItem[] {
  const items: LineItem[] = [];
  let gap = "";
  for (const segment of tokenizeGameText(mainClause(line))) {
    const reference = segment.reference;
    if (!reference || reference.kind !== "item" || reference.search || !(reference.image || reference.imageUrl)) {
      gap += segment.text;
      continue;
    }
    const lead = LEAD.exec(items.length ? gap : gap.trimStart());
    gap = "";
    // Prose before the first item means the line isn't a plain list; keep it as one slot.
    if (!lead && !items.length) return [];
    // Text that isn't a plain list (e.g. "bucket of compost") describes the previous item.
    if (!lead) continue;
    const quantity = lead[1] ? Number(lead[1].replace(/,/g, "")) : 1;
    if (!(quantity >= 1)) continue;
    const noting = lead[2]?.trim().toLowerCase();
    items.push({
      reference,
      quantity,
      stackable: noting === "noted" || (noting !== "unnoted" && STACKABLE.test(reference.name)),
    });
  }
  return items;
}

/** Lays a quest's supplies into backpack slots; `packed` holds packing keys. */
export function inventorySlots(
  quest: Pick<QuestRecord, "id" | "supplies">,
  packed: readonly string[],
): { slots: InventorySlot[]; empty: number; overflow: number } {
  const slots: InventorySlot[] = [];
  for (const line of quest.supplies) {
    const key = packKey(quest.id, line);
    const isPacked = packed.includes(key);
    const items = lineItems(line);
    if (!items.length) {
      slots.push({ id: key, line, key, packed: isPacked, art: lineArt(line), title: line });
      continue;
    }
    items.forEach(({ reference, quantity, stackable }, index) => {
      const base = { line, key, packed: isPacked, art: reference };
      if (stackable) {
        slots.push({
          ...base,
          id: `${key}#${index}`,
          count: quantity > 1 ? quantity : undefined,
          title: `${quantity.toLocaleString("en")} × ${reference.name}`,
        });
        return;
      }
      for (let n = 0; n < quantity; n++) {
        slots.push({ ...base, id: `${key}#${index}.${n}`, title: reference.name });
      }
    });
  }
  return {
    slots,
    empty: Math.max(0, INVENTORY_SIZE - slots.length),
    overflow: Math.max(0, slots.length - INVENTORY_SIZE),
  };
}
