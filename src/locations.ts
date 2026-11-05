import { CORE_LOCATIONS } from "./skillsCore.ts";
import { COMBAT_LOCATIONS } from "./skillsCombat.ts";
import { ARTISAN_LOCATIONS } from "./skillsArtisan.ts";
import { SUPPORT_LOCATIONS } from "./skillsSupport.ts";
import { FOUNDATION_LOCATIONS } from "./questsFoundations.ts";
import { UNLOCK_LOCATIONS } from "./questsUnlocks.ts";
import { TALE_LOCATIONS } from "./questsTales.ts";
import { ADVENTURE_LOCATIONS } from "./questsAdventures.ts";
import { SIDE_LOCATIONS } from "./questsSideActivities.ts";
import { SEASONAL_LOCATIONS } from "./questsSeasonal.ts";

export interface LocationRecord {
  name: string;
  wiki: string;
  image: string;
  members: boolean;
  summary: string;
  access?: string;
}

// Images and access details are drawn from each linked RuneScape Wiki location article.
export const LOCATIONS: Record<string, LocationRecord> = {
  ...FOUNDATION_LOCATIONS,
  ...UNLOCK_LOCATIONS,
  ...TALE_LOCATIONS,
  ...ADVENTURE_LOCATIONS,
  ...SIDE_LOCATIONS,
  ...SEASONAL_LOCATIONS,
  "Lumbridge Castle": {
    name: "Lumbridge Castle",
    wiki: "Lumbridge Castle",
    image: "Lumbridge_Castle.png",
    members: false,
    summary: "The ground-floor kitchen is the start of Cook's Assistant.",
    access: "The kitchen range requires completion of Cook's Assistant.",
  },
  Falador: {
    name: "Falador",
    wiki: "Falador",
    image: "Falador.png",
    members: false,
    summary:
      "Asgarnia's capital is home to the White Knights and the Artisans' Workshop.",
  },
  "Asgarnian Ice Dungeon": {
    name: "Asgarnian Ice Dungeon",
    wiki: "Asgarnian Ice Dungeon",
    image: "Asgarnian_Ice_Dungeon_entrance.png",
    members: false,
    summary: "Mine blurite ore for The Knight's Sword.",
    access: "Aggressive monsters guard the dungeon; bring food and take care.",
  },
  "Champions' Guild": {
    name: "Champions' Guild",
    wiki: "Champions' Guild",
    image: "Champions'_Guild_exterior.png",
    members: false,
    summary:
      "Find the guildmaster in the guild south-west of Varrock for Dragon Slayer.",
    access: "The front door requires 33 quest points.",
  },
  Crandor: {
    name: "Crandor",
    wiki: "Crandor",
    image: "Crandor.png",
    members: false,
    summary: "Island near Karamja with dangerous combat.",
    access:
      "Reached during Dragon Slayer; the return passage opens from the island side.",
  },
  "Baxtorian Falls": {
    name: "Baxtorian Falls",
    wiki: "Baxtorian Falls",
    image: "Baxtorian_Falls.png",
    members: true,
    summary: "The falls in Kandarin are the setting for Waterfall Quest.",
  },
  "Tree Gnome Village": {
    name: "Tree Gnome Village",
    wiki: "Tree Gnome Village (location)",
    image: "Tree_Gnome_Village.png",
    members: true,
    summary: "King Bolren's village lies inside a hedge maze in Kandarin.",
    access: "Spirit tree travel requires completing Tree Gnome Village.",
  },
  "Burthorpe mine": {
    name: "Burthorpe mine",
    wiki: "Burthorpe mine",
    image: "Burthorpe_mine_entrance.png",
    members: false,
    summary: "Copper ore, tin ore and iron ore near a furnace and anvils.",
  },
  "Lumbridge south-west mine": {
    name: "Lumbridge south-west mine",
    wiki: "Lumbridge south-west mine",
    image: "Lumbridge_south-west_mine.png",
    members: false,
    summary: "Iron ore at 10 Mining; coal at 20. No quest unlock needed.",
  },
  "Varrock south-east mine": {
    name: "Varrock south-east mine",
    wiki: "Varrock south-east mine",
    image: "Varrock_south-east_mine.png",
    members: false,
    summary: "Mine mithril ore; bank at Varrock east bank.",
    access: "Mithril requires 30 Mining; adamantite requires 40.",
  },
  "Rimmington mine": {
    name: "Rimmington mine",
    wiki: "Rimmington mine",
    image: "Rimmington_mine.png",
    members: false,
    summary: "Mine adamantite ore; use the Port Sarim metal bank.",
    access: "Adamantite requires 40 Mining.",
  },
  "Dwarven luminite mine": {
    name: "Dwarven luminite mine",
    wiki: "Dwarven luminite mine",
    image: "Dwarven_luminite_mine.png",
    members: false,
    summary: "Luminite rocks in the southern Dwarven mines.",
    access:
      "Luminite requires 40 Mining; king scorpions may be aggressive to lower-level players.",
  },
  "Coal truck mine": {
    name: "Coal truck mine",
    wiki: "Coal truck mine",
    image: "Coal_truck_mine.png",
    members: true,
    summary:
      "Members alternative with automatic truck storage. Shared mines may be more convenient.",
    access:
      "20 Mining. The shortcut needs 20 Agility; the longer walk does not. Collect stored coal near Seers' Village.",
  },
  "Artisans' Workshop": {
    name: "Artisans' Workshop",
    wiki: "Artisans' Workshop",
    image: "Artisans'_Workshop_interior.png",
    members: false,
    summary:
      "A Smithing workshop in south-east Falador with furnaces and anvils.",
  },
  "Draynor Village": {
    name: "Draynor Village",
    wiki: "Draynor Village",
    image: "NewDraynor.png",
    members: false,
    summary:
      "A village with a bank, coastal fishing spots and nearby willow trees.",
  },
  Lumbridge: {
    name: "Lumbridge",
    wiki: "Lumbridge",
    image: "Lumbridge.png",
    members: false,
    summary:
      "A River Lum town with a castle, church, farms and beginner training areas.",
  },
  Gunnarsgrunn: {
    name: "Gunnarsgrunn",
    wiki: "Barbarian Village",
    image: "Barbarian_Village.png",
    members: false,
    summary:
      "A village on the River Lum with fly-fishing spots and pottery facilities.",
    access: "Trout requires 20 Fishing; salmon requires 30.",
  },
  ...CORE_LOCATIONS,
  ...COMBAT_LOCATIONS,
  ...ARTISAN_LOCATIONS,
  ...SUPPORT_LOCATIONS,
};
