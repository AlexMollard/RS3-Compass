import test from "node:test";
import assert from "node:assert/strict";
import { inventorySlots } from "../src/lib/inventorySlots.ts";

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
