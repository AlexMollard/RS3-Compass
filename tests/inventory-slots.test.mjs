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
