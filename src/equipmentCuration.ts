// Hand-checked judgement on top of src/equipmentImported.ts. Routes are derived from Wiki facts by
// scripts/import-equipment.mjs; this file only covers what that derivation can't, each with a Wiki source.
import type { GearCuration, GearRoute, GearRouteKind, ImportedItem } from "./equipmentTypes.ts";

const checked = "2026-11-16";

export const EQUIPMENT_CURATION: GearCuration = {
  checked,
  excludeCategories: {
    "Dyed equipment": "Cosmetic recolours of an item that is imported under its base name.",
    "Equipment applied cosmetic changes": "Cosmetic kits applied to an item that is imported under its base name.",
    "Ornamental armour": "Trimmed, gilded and ornament kits of armour imported under its base name.",
    "Heraldic armour": "Heraldic designs of armour imported under its base name.",
    "Heraldic POH items": "Player-owned house banners and heraldic shields.",
    "Augmented items": "Augmented items count as their base item.",
    "Dungeoneering items": "Only usable inside Daemonheim.",
    "Location restricted equipment": "Only usable in one place (minigames, quests, Dimension of Disaster).",
    "Stealing Creation": "Only usable inside the Stealing Creation minigame.",
    "Removed content": "No longer in the game.",
    "Holiday items": "Holiday event items.",
  },
  exclude: [
    // Their Infobox Bonuses has no tier (checked 2026-11-16), so they can't sit on a tier ladder.
    "Barb-tail harpoon", // a Fishing tool
    "Boxing gloves (blue)", // a minigame novelty
    "Boxing gloves (red)",
    "Dramen staff", // a quest item
    "Empty Easter basket", // holiday items
    "Full Easter basket",
    "Law talisman staff", // a Runecrafting novelty
  ],
  routes: {},
  families: [],
  wearQuests: {},
};

export const EASY_KINDS: GearRouteKind[] = ["smith", "craft", "shop", "common-drop", "reward", "quest"];

const UNKNOWN: GearRoute = { kind: "unknown", note: "See the Wiki for how to get it." };

/** How to get an item: a curated route, then a curated family, then the route derived from Wiki data. */
export function routeFor(item: ImportedItem): GearRoute {
  return (
    EQUIPMENT_CURATION.routes[item.name] ??
    EQUIPMENT_CURATION.families.find((f) => new RegExp(f.match).test(item.name))?.route ??
    item.route ??
    UNKNOWN
  );
}
