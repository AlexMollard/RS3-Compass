import type { ReactNode } from "react";
import { QUESTS, SAMPLE_PROFILES } from "./data";
import { wikiHref, wikiImage } from "./wiki";
import { LOCATIONS } from "./locations";

interface Reference {
  name: string;
  wiki: string;
  image?: string;
  aliases?: string[];
  kind: "item" | "quest" | "skill" | "place" | "reference";
}

const items: Omit<Reference, "kind">[] = [
  { name: "Pot of flour", wiki: "Pot_of_flour", image: "Pot_of_flour.png" },
  {
    name: "Bucket of milk",
    wiki: "Bucket_of_milk",
    image: "Bucket_of_milk.png",
  },
  { name: "Egg", wiki: "Egg", image: "Egg.png", aliases: ["eggs"] },
  { name: "Redberry pie", wiki: "Redberry_pie", image: "Redberry_pie.png" },
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
    aliases: [quest.name.replaceAll("'", "’")],
    kind: "quest" as const,
  })),
  {
    name: "What's Mine is Yours",
    wiki: "What's_Mine_is_Yours",
    aliases: ["What’s Mine is Yours"],
    kind: "quest",
  },
  ...[
    ...new Set([
      ...SAMPLE_PROFILES.flatMap((profile) => Object.keys(profile.levels)),
      "Agility",
    ]),
  ].map((name) => ({ name, wiki: name, kind: "skill" as const })),
  { name: "Lumbridge swamp", wiki: "Lumbridge_Swamp", kind: "place" },
  { name: "Metal bank", wiki: "Metal_bank", kind: "reference" },
  { name: "Food", wiki: "Food", kind: "reference" },
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

export default function GameText({ text }: { text: string }) {
  const content: ReactNode[] = [];
  let cursor = 0;
  for (const match of text.matchAll(pattern)) {
    const index = match.index!;
    if (index > cursor) content.push(text.slice(cursor, index));
    const reference = byAlias.get(match[0].toLocaleLowerCase("en"))!;
    content.push(
      <a
        key={index}
        className={"wiki-ref " + (reference.kind === "item" ? "item-ref" : "")}
        data-reference-kind={reference.kind}
        href={wikiHref(reference.wiki)}
        target="_blank"
        rel="noopener noreferrer"
        title={reference.name + " on RuneScape Wiki"}
      >
        {reference.image && (
          <img src={wikiImage(reference.image)} alt="" loading="lazy" />
        )}
        <span>{match[0]}</span>
      </a>,
    );
    cursor = index + match[0].length;
  }
  if (cursor < text.length) content.push(text.slice(cursor));
  return <span className="game-text">{content}</span>;
}
