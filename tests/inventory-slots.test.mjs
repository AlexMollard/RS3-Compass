import test from "node:test";
import assert from "node:assert/strict";
import { inventorySlots, supplyReferences } from "../src/lib/inventorySlots.ts";
import { QUESTS } from "../src/data.ts";
import { REWARD_REFERENCES, SUPPLY_LINKS } from "../src/questsImported.ts";

const quest = (supplies) => ({ id: "q", supplies });

test("one slot per supply line with quest-scoped keys", () => {
  const { slots, empty } = inventorySlots(quest(["Egg", "Pot of flour"]), []);
  assert.equal(slots.length, 2);
  assert.equal(empty, 26);
  assert.deepEqual(
    slots.map((s) => s.key),
    ["q::Egg", "q::Pot of flour"],
  );
  assert.deepEqual(
    slots.map((s) => s.line),
    ["Egg", "Pot of flour"],
  );
});

test("a line whose key is packed is marked packed", () => {
  const { slots } = inventorySlots(quest(["Egg", "Pot of flour"]), [
    "q::Pot of flour",
    "other::Egg",
  ]);
  assert.deepEqual(
    slots.map((s) => s.packed),
    [false, true],
  );
});

test("free text still produces a slot", () => {
  const { slots, empty } = inventorySlots(quest(["Food, if you want it"]), []);
  assert.equal(slots.length, 1);
  assert.equal(slots[0].key, "q::Food, if you want it");
  assert.equal(empty, 27);
});

test("more lines than the inventory holds leaves no empty slots", () => {
  const lines = Array.from({ length: 30 }, (_, n) => "Item " + n);
  const { slots, empty } = inventorySlots(quest(lines), []);
  assert.equal(slots.length, 30);
  assert.equal(empty, 0);
});

const summary = (line) =>
  inventorySlots(quest([line]), []).slots.map((s) => [s.art?.name ?? null, s.count ?? 1]);

test("a non-stackable count takes one slot per item", () => {
  assert.deepEqual(summary("2 iron bars"), [
    ["Iron bar", 1],
    ["Iron bar", 1],
  ]);
  assert.equal(summary("25 coal").length, 25);
});

test("stackable items share one slot with their count", () => {
  assert.deepEqual(summary("100 coins"), [["Coins", 100]]);
  assert.deepEqual(summary("2,000 coins to purchase the ship"), [["Coins", 2000]]);
  assert.deepEqual(summary("6 air runes"), [["Air rune", 6]]);
  assert.deepEqual(summary("10 feathers"), [["Feather", 10]]);
  assert.deepEqual(summary("10 fishing bait"), [["Fishing bait", 10]]);
  assert.deepEqual(summary("7 basic ghostly ink for drawing glyphs"), [["Basic ghostly ink", 7]]);
});

test("seeds name the seed, not the vegetable, and stack", () => {
  assert.deepEqual(summary("3 cabbage seeds (6 recommended)"), [["Cabbage seed", 3]]);
  assert.deepEqual(summary("3 onion seeds (6 recommended)"), [["Onion seed", 3]]);
});

test("unnoted overrides stacking and counts every item", () => {
  const { slots, overflow, empty } = inventorySlots(
    quest(["50 unnoted rune essence or 25 unnoted pure essence"]),
    [],
  );
  assert.equal(slots.length, 50);
  assert.ok(slots.every((s) => s.art?.name === "Rune essence" && !s.count));
  assert.equal(overflow, 22);
  assert.equal(empty, 0);
});

test("each listed item keeps its own count; alternatives are ignored", () => {
  assert.deepEqual(summary("90 steel nails, 3 planks, and a hammer"), [
    ["Steel nails", 90],
    ["Plank", 1],
    ["Plank", 1],
    ["Plank", 1],
    ["Hammer", 1],
  ]);
  assert.deepEqual(summary("A beer or 2 coins to buy one"), [["Beer", 1]]);
  assert.deepEqual(summary("1 blue dye and 1 orange dye; alternatively make orange from red dye and yellow dye."), [
    ["Blue dye", 1],
    ["Orange dye", 1],
  ]);
});

test("a description is one item, and every slot from a line shares its packing key", () => {
  assert.deepEqual(summary("A bucket of compost or supercompost"), [["Bucket", 1]]);
  assert.equal(
    summary("For dye-making instead: 2 woad leaves, 3 redberries, 2 onions and 15 coins for three dyes.").length,
    1,
  );
  const { slots } = inventorySlots(quest(["3 split fir logs and 15 steel nails"]), [
    "q::3 split fir logs and 15 steel nails",
  ]);
  assert.equal(slots.length, 4);
  assert.ok(slots.every((s) => s.packed && s.key === "q::3 split fir logs and 15 steel nails"));
  assert.equal(new Set(slots.map((s) => s.id)).size, 4);
});

// SUPPLY_LINKS-shaped links and a reference table, as scripts/import-quests.mjs writes them.
const linked = (supplies, links, pages) => {
  const q = quest(supplies);
  return { q, references: supplyReferences(q, { q: links }, pages) };
};

test("Wiki links give supply lines their sprites without changing slots or keys", () => {
  const { q, references } = linked(
    ["3 cadava berries", "10 fishing bait", "Antipoison (3)", "100 coins", "Food, if you want it"],
    {
      0: { "cadava berries": "Cadava berries" },
      1: { "fishing bait": "Fishing bait" },
      2: { "Antipoison (3)": "Antipoison#(3)" },
      4: { Food: "Food" },
    },
    {
      "Cadava berries": { kind: "item", image: "Cadava_berries.png" },
      "Fishing bait": { kind: "item", image: "Fishing_bait_(Wiki).png" },
      "Antipoison#(3)": { kind: "item", image: "Antipoison_(3).png" },
      Food: { kind: "other" },
    },
  );
  // The anchor picks the sprite; the link goes to the page.
  assert.deepEqual(references.get("Antipoison (3)"), [
    { name: "Antipoison (3)", wiki: "Antipoison", kind: "item", image: "Antipoison_(3).png" },
  ]);
  const plain = inventorySlots(q, []).slots;
  const { slots } = inventorySlots(q, [], references);
  assert.deepEqual(
    slots.map((s) => [s.id, s.key, s.count]),
    plain.map((s) => [s.id, s.key, s.count]),
  );
  assert.deepEqual(
    slots.map((s) => s.art?.image),
    [
      "Cadava_berries.png", // no catalogue entry: one slot, now with the Wiki sprite
      "Fishing_bait_(Wiki).png", // the catalogue's item, drawn with the linked page's sprite
      "Antipoison_(3).png",
      "Coins_1000_detail.png", // unlinked: catalogue art
      "Cooked_meat.png", // linked page without a sprite: the catalogue's art for the phrase
    ],
  );
});

test("a one-slot line shows its first item sprite, Wiki or catalogue", () => {
  const { q, references } = linked(
    ["About 600 coins (about 300 with ring of charos (a))", "Some charcoal or papyrus"],
    { 0: { "ring of charos (a)": "Ring of charos (a)" }, 1: { charcoal: "Charcoal", papyrus: "Papyrus" } },
    {
      "Ring of charos (a)": { kind: "item", image: "Ring_of_charos_(a).png" },
      Charcoal: { kind: "item", image: "Charcoal.png" },
      Papyrus: { kind: "item", image: "Papyrus.png" },
    },
  );
  assert.deepEqual(
    inventorySlots(q, [], references).slots.map((s) => s.art?.image),
    ["Coins_1000_detail.png", "Charcoal.png"],
  );
});

test("imported Soul Searching supplies carry Wiki sprites", () => {
  const soul = QUESTS.find((q) => q.id === "soul-searching");
  const references = supplyReferences(soul, SUPPLY_LINKS, REWARD_REFERENCES);
  const sprites = soul.supplies.map((line) => references.get(line)?.[0]?.image);
  assert.deepEqual(sprites, [
    "Cadava_berries.png",
    "Fishing_bait.png",
    "Antipoison_(3).png",
    "Charcoal.png",
    "Papyrus.png",
  ]);
  const { slots } = inventorySlots(soul, [], references);
  for (const file of ["Cadava_berries.png", "Charcoal.png", "Papyrus.png", "Antipoison_(3).png"])
    assert.ok(slots.some((s) => s.art?.image === file), file);
  // Every supply-linked page is in the shared table.
  for (const lines of Object.values(SUPPLY_LINKS))
    for (const links of Object.values(lines))
      for (const page of Object.values(links)) assert.ok(REWARD_REFERENCES[page], page);
});
