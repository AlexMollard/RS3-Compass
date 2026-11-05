import { QUESTS, type ItemReference } from "../data.ts";
import { LOCATIONS } from "../locations.ts";
import { RS3_SKILL_NAMES } from "../skillNames.ts";
import { CORE_ITEMS } from "../skillsCore.ts";
import { COMBAT_ITEMS } from "../skillsCombat.ts";
import { ARTISAN_ITEMS } from "../skillsArtisan.ts";
import { SUPPORT_ITEMS } from "../skillsSupport.ts";
import { FOUNDATION_ITEMS } from "../questsFoundations.ts";
import { UNLOCK_ITEMS } from "../questsUnlocks.ts";
import { TALE_ITEMS } from "../questsTales.ts";
import { ADVENTURE_ITEMS } from "../questsAdventures.ts";
import { SIDE_ITEMS } from "../questsSideActivities.ts";
import { SEASONAL_ITEMS } from "../questsSeasonal.ts";
import { QUEST_REWARD_ITEMS } from "../questRewardItems.ts";
import { EQUIPMENT_ITEMS } from "../trainingEquipment.ts";

interface Reference {
  name: string;
  wiki: string;
  image?: string;
  aliases?: string[];
  kind: "item" | "quest" | "skill" | "place" | "reference";
}

const items: ItemReference[] = [
  { name: "Pot of flour", wiki: "Pot_of_flour", image: "Pot_of_flour.png" },
  {
    name: "Bucket of milk",
    wiki: "Bucket_of_milk",
    image: "Bucket_of_milk.png",
  },
  { name: "Egg", wiki: "Egg", image: "Egg.png", aliases: ["eggs"] },
  { name: "Redberry pie", wiki: "Redberry_pie", image: "Redberry_pie.png" },
  {
    name: "Anti-dragon shield",
    wiki: "Anti-dragon shield",
    image: "Anti-dragon_shield.png",
  },
  { name: "Rope", wiki: "Rope", image: "Rope.png", aliases: ["ropes"] },
  {
    name: "Air rune",
    wiki: "Air rune",
    image: "Air_rune.png",
    aliases: ["air runes"],
  },
  {
    name: "Earth rune",
    wiki: "Earth rune",
    image: "Earth_rune.png",
    aliases: ["earth runes"],
  },
  {
    name: "Water rune",
    wiki: "Water rune",
    image: "Water_rune.png",
    aliases: ["water runes"],
  },
  { name: "Logs", wiki: "Logs", image: "Logs.png", aliases: ["normal logs"] },
  {
    name: "Iron bar",
    wiki: "Iron_bar",
    image: "Iron_bar.png",
    aliases: ["iron bars"],
  },
  {
    name: "Pickaxe",
    wiki: "Pickaxe",
    image: "Bronze_pickaxe.png",
    aliases: ["pickaxes"],
  },
  {
    name: "Ore box",
    wiki: "Ore_box",
    image: "Bronze_ore_box.png",
    aliases: ["ore boxes"],
  },
  { name: "Steel nails", wiki: "Steel_nails", image: "Steel_nails.png" },
  { name: "Plank", wiki: "Plank", image: "Plank.png", aliases: ["planks"] },
  { name: "Coins", wiki: "Coins", image: "Coins_1000_detail.png" },
  {
    name: "Copper ore",
    wiki: "Copper_ore",
    image: "Copper_ore.png",
    aliases: ["copper"],
  },
  { name: "Tin ore", wiki: "Tin_ore", image: "Tin_ore.png", aliases: ["tin"] },
  { name: "Iron ore", wiki: "Iron_ore", image: "Iron_ore.png" },
  { name: "Mithril ore", wiki: "Mithril_ore", image: "Mithril_ore.png" },
  {
    name: "Adamantite ore",
    wiki: "Adamantite_ore",
    image: "Adamantite_ore.png",
  },
  { name: "Coal", wiki: "Coal", image: "Coal.png" },
  { name: "Luminite", wiki: "Luminite", image: "Luminite.png" },
  { name: "Iron ore box", wiki: "Iron_ore_box", image: "Iron_ore_box.png" },
  { name: "Steel ore box", wiki: "Steel_ore_box", image: "Steel_ore_box.png" },
  {
    name: "Mithril ore box",
    wiki: "Mithril_ore_box",
    image: "Mithril_ore_box.png",
  },
  {
    name: "Adamant ore box",
    wiki: "Adamant_ore_box",
    image: "Adamant_ore_box.png",
  },
  { name: "Blurite ore", wiki: "Blurite_ore", image: "Blurite_ore.png" },
  { name: "Raw crayfish", wiki: "Raw_crayfish", image: "Raw_crayfish.png" },
  { name: "Raw trout", wiki: "Raw_trout", image: "Raw_trout.png" },
  { name: "Raw salmon", wiki: "Raw_salmon", image: "Raw_salmon.png" },
  { name: "Raw shrimps", wiki: "Raw_shrimps", image: "Raw_shrimps.png" },
  { name: "Raw anchovies", wiki: "Raw_anchovies", image: "Raw_anchovies.png" },
  {
    name: "Small fishing net",
    wiki: "Small_fishing_net",
    image: "Small_fishing_net.png",
  },
  {
    name: "Bronze bar",
    wiki: "Bronze_bar",
    image: "Bronze_bar.png",
    aliases: ["bronze bars"],
  },
  {
    name: "Steel bar",
    wiki: "Steel_bar",
    image: "Steel_bar.png",
    aliases: ["steel bars"],
  },
  {
    name: "Hammer",
    wiki: "Hammer",
    image: "Hammer.png",
    aliases: ["tool-belt hammer"],
  },
  {
    name: "Fly fishing rod",
    wiki: "Fly_fishing_rod",
    image: "Fly_fishing_rod.png",
    aliases: ["fly-fishing rod"],
  },
  {
    name: "Feather",
    wiki: "Feather",
    image: "Feather.png",
    aliases: ["feathers"],
  },
  {
    name: "Gold bar",
    wiki: "Gold_bar",
    image: "Gold_bar.png",
    aliases: ["gold bars"],
  },
  {
    name: "Diamond",
    wiki: "Diamond",
    image: "Diamond.png",
    aliases: ["diamonds"],
  },
  { name: "Mithril seeds", wiki: "Mithril_seeds", image: "Mithril_seeds.png" },
  {
    name: "Fishing bait",
    wiki: "Fishing_bait",
    image: "Fishing_bait.png",
    aliases: ["bait"],
  },
  { name: "Unfired bowl", wiki: "Bowl_(unfired)", image: "Bowl_(unfired).png" },
  {
    name: "Wizard's mind bomb",
    wiki: "Wizard's_mind_bomb",
    image: "Wizard's_mind_bomb.png",
    aliases: ["wizard’s mind bomb"],
  },
  { name: "Silk", wiki: "Silk", image: "Silk.png" },
  { name: "Crayfish cage", wiki: "Crayfish_cage", image: "Crayfish_cage.png" },
  { name: "Lobster pot", wiki: "Lobster_pot", image: "Lobster_pot.png" },
  {
    name: "Strength XP lamp",
    wiki: "Strength_XP_lamp_(Dragon_Slayer)",
    image: "Strength_XP_lamp_(Dragon_Slayer).png",
  },
  {
    name: "Defence XP lamp",
    wiki: "Defence_XP_lamp_(Dragon_Slayer)",
    image: "Defence_XP_lamp_(Dragon_Slayer).png",
  },
  {
    name: "Deathwarden robes",
    wiki: "Deathwarden_robe_armour",
    image: "Deathwarden_robe_top_(tier_10).png",
  },
  ...CORE_ITEMS,
  ...COMBAT_ITEMS,
  ...ARTISAN_ITEMS,
  ...SUPPORT_ITEMS,
  ...FOUNDATION_ITEMS,
  ...UNLOCK_ITEMS,
  ...TALE_ITEMS,
  ...ADVENTURE_ITEMS,
  ...SIDE_ITEMS,
  ...SEASONAL_ITEMS,
  ...QUEST_REWARD_ITEMS,
  ...EQUIPMENT_ITEMS,
];
const references: Reference[] = [
  ...items.map((item) => ({ ...item, kind: "item" as const })),
  ...Object.values(LOCATIONS).map((location) => ({
    name: location.name,
    wiki: location.wiki,
    aliases: [location.name.replaceAll("'", "’")],
    kind: "place" as const,
  })),
  ...QUESTS.map((quest) => ({
    name: quest.name,
    wiki: quest.wiki,
    aliases: [
      quest.name.replaceAll("'", "’"),
      quest.name.replace(/\s+\((?:miniquest|saga)\)$/, ""),
      quest.name.replace(/\s+\((?:miniquest|saga)\)$/, "").replaceAll("'", "’"),
      ...(quest.id === "theres-no-place-like-home"
        ? ["There's No Place Like Home", "There’s No Place Like Home"]
        : []),
    ],
    kind: "quest" as const,
  })),
  ...[
    { name: "Kili Row", wiki: "Kili_Row" },
    { name: "Bar Crawl", wiki: "Bar_Crawl_(miniquest)" },
    { name: "Priest in Peril", wiki: "Priest_in_Peril" },
    { name: "Ghosts Ahoy", wiki: "Ghosts_Ahoy" },
    { name: "Smoking Kills", wiki: "Smoking_Kills" },
    { name: "The Jack of Spades", wiki: "The_Jack_of_Spades" },
    { name: "Jack of Spades", wiki: "The_Jack_of_Spades" },
    { name: "Swan Song", wiki: "Swan_Song" },
    { name: "Plague's End", wiki: "Plague's_End" },
    { name: "The Great Brain Robbery", wiki: "The_Great_Brain_Robbery" },
    { name: "The Branches of Darkmeyer", wiki: "The_Branches_of_Darkmeyer" },
    { name: "As a First Resort", wiki: "As_a_First_Resort" },
    { name: "Barbarian Training", wiki: "Barbarian_Training" },
    { name: "Family Crest", wiki: "Family_Crest" },
    {
      name: "A Fairy Tale I - Growing Pains",
      wiki: "A_Fairy_Tale_I_-_Growing_Pains",
      aliases: ["Fairy Tale I"],
    },
    { name: "A Guild of Our Own", wiki: "A_Guild_of_Our_Own" },
    { name: "Temple of Ikov", wiki: "Temple_of_Ikov" },
    { name: "Necromancy!", wiki: "Necromancy!" },
  ].map((quest) => ({
    ...quest,
    aliases: [...(quest.aliases ?? []), quest.name.replaceAll("'", "’")],
    kind: "quest" as const,
  })),
  ...RS3_SKILL_NAMES.map((name) => ({
    name,
    wiki: name,
    kind: "skill" as const,
  })),
  { name: "Lumbridge swamp", wiki: "Lumbridge_Swamp", kind: "place" },
  { name: "Metal bank", wiki: "Metal_bank", kind: "reference" },
  { name: "Food", wiki: "Food", image: "Cooked_meat.png", kind: "reference" },
  { name: "Sostratus", wiki: "Sostratus", kind: "reference" },
  ...["I", "II", "III", "IV", "V", "VI", "VII"].map((tier) => ({
    name: `Kili's Knowledge ${tier}`,
    wiki: `Kili's Knowledge ${tier}`,
    kind: "reference" as const,
  })),
];
const byAlias = new Map<string, Reference>();
for (const reference of references) {
  for (const alias of [reference.name, ...(reference.aliases || [])]) {
    byAlias.set(alias.toLocaleLowerCase("en"), reference);
  }
}
const aliases = [...byAlias.keys()].sort(
  (left, right) => right.length - left.length,
);
const pattern = new RegExp(
  "(?<![\\p{L}\\p{N}])(" +
    aliases
      .map((alias) => alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .join("|") +
    ")(?![\\p{L}\\p{N}])",
  "giu",
);

export type GameTextSegment = { text: string; reference?: Reference };

export function tokenizeGameText(text: string): GameTextSegment[] {
  const segments: GameTextSegment[] = [];
  let cursor = 0;
  for (const match of text.matchAll(pattern)) {
    const index = match.index!;
    if (index > cursor) segments.push({ text: text.slice(cursor, index) });
    segments.push({
      text: match[0],
      reference: byAlias.get(match[0].toLocaleLowerCase("en"))!,
    });
    cursor = index + match[0].length;
  }
  if (cursor < text.length) segments.push({ text: text.slice(cursor) });
  return segments;
}
