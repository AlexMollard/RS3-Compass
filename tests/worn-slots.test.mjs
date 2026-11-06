import test from "node:test";
import assert from "node:assert/strict";
import { wornSlot } from "../src/lib/wornSlots.ts";

test("worn tools and weapons go in the main hand", () => {
  assert.equal(wornSlot("pickaxe"), "Main hand");
  assert.equal(wornSlot("melee weapon"), "Main hand");
  assert.equal(wornSlot("necromancy main hand"), "Main hand");
});

test("armour roles map to their worn slot", () => {
  assert.equal(wornSlot("ranged body upgrade"), "Body");
  assert.equal(wornSlot("magic off hand"), "Off hand");
  assert.equal(wornSlot("dragonfire protection"), "Off hand");
  assert.equal(wornSlot("ranged ammunition"), "Ammo");
  assert.equal(wornSlot("Blacksmith's helmet"), "Head");
  assert.equal(wornSlot("Cooking gauntlets"), "Hands");
  assert.equal(wornSlot("Boots of lightness"), "Feet");
});

test("carried items are not worn", () => {
  assert.equal(wornSlot("ore box"), undefined);
  assert.equal(wornSlot("Body talisman"), undefined);
  assert.equal(wornSlot("tackle"), undefined);
});
