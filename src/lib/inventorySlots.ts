import type { QuestRecord } from "../data.ts";
import {
  lineArt,
  tokenizeGameText,
  type GameTextReference,
} from "./gameText.ts";
import { packKey } from "./packing.ts";
import type { RewardReference } from "./questRewards.ts";

type LineLinks = Readonly<Record<number, Readonly<Record<string, string>>>>;

/** The catalogue's art for exactly this phrase ("food", "pickaxe"), for links whose page has no sprite. */
function catalogueArt(phrase: string): Pick<GameTextReference, "image" | "imageUrl"> {
  const [only, ...rest] = tokenizeGameText(phrase);
  const art = !rest.length && !only?.reference?.search ? only?.reference : undefined;
  return art?.image ? { image: art.image } : art?.imageUrl ? { imageUrl: art.imageUrl } : {};
}

/**
 * Each supply line's Wiki links (SUPPLY_LINKS, keyed by line index) as GameText references by line
 * text. Linked items carry their Wiki sprite, else the catalogue's art for the same phrase; an
 * anchored page ("Antipoison#(3)") links to its page.
 */
export function supplyReferences(
  quest: Pick<QuestRecord, "id" | "supplies">,
  links: Readonly<Record<string, LineLinks>>,
  pages: Readonly<Record<string, RewardReference>>,
): Map<string, GameTextReference[]> {
  const byLine = new Map<string, GameTextReference[]>();
  for (const [index, lineLinks] of Object.entries(links[quest.id] ?? {})) {
    const line = quest.supplies[Number(index)];
    if (line === undefined) continue;
    byLine.set(
      line,
      Object.entries(lineLinks).map(([name, page]) => {
        const { kind, image } = pages[page] ?? {};
        return {
          name,
          wiki: page.split("#")[0],
          kind: kind === "item" || kind === "place" ? kind : "reference",
          ...(image ? { image } : catalogueArt(name)),
        };
      }),
    );
  }
  return byLine;
}

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

const pageKey = (page: string) => page.replaceAll("_", " ").toLocaleLowerCase("en");

/**
 * Lays a quest's supplies into backpack slots; `packed` holds packing keys. Slots come from the
 * catalogue; `references` (supplyReferences) only swap in a line's Wiki item sprites: a one-slot
 * line shows its first item sprite, Wiki or catalogue, and a listed item the sprite of its linked page.
 */
export function inventorySlots(
  quest: Pick<QuestRecord, "id" | "supplies">,
  packed: readonly string[],
  references?: ReadonlyMap<string, readonly GameTextReference[]>,
): { slots: InventorySlot[]; empty: number; overflow: number } {
  const slots: InventorySlot[] = [];
  for (const line of quest.supplies) {
    const key = packKey(quest.id, line);
    const isPacked = packed.includes(key);
    const items = lineItems(line);
    const linked = references?.get(line);
    if (!items.length) {
      slots.push({ id: key, line, key, packed: isPacked, art: lineArt(line, linked), title: line });
      continue;
    }
    const sprites = (linked ?? []).filter((reference) => reference.kind === "item" && reference.image);
    items.forEach(({ reference, quantity, stackable }, index) => {
      const names = [reference.name, ...(reference.aliases ?? [])].map(pageKey);
      const art =
        sprites.find(
          (sprite) => pageKey(sprite.wiki) === pageKey(reference.wiki) || names.includes(pageKey(sprite.name)),
        ) ?? reference;
      const base = { line, key, packed: isPacked, art };
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
