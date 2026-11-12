import assert from "node:assert/strict";
import test from "node:test";
import {
  lootRows,
  lootSummary,
  meanQuantity,
  rarityProbability,
} from "../src/lib/bossLoot.ts";

const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} !~ ${b}`);

test("rarityProbability", () => {
  near(rarityProbability("3/520"), 3 / 520);
  assert.ok(Math.abs(rarityProbability("3/520") - 0.005769) < 1e-6);
  assert.equal(rarityProbability("Always"), 1);
  near(rarityProbability("1/5,000"), 0.0002);
  assert.equal(rarityProbability("Common"), undefined);
});

test("meanQuantity", () => {
  assert.equal(meanQuantity("12000-16000"), 14000);
  assert.equal(meanQuantity("14 (noted)"), 14);
  assert.equal(meanQuantity("1,000"), 1000);
  assert.equal(meanQuantity("lots"), undefined);
});

const drops = [
  { item: "Mole claw", quantity: "1", rarity: "Always" },
  { item: "Coins", quantity: "100-200", rarity: "1/2" },
  { item: "Mystery", quantity: "1", rarity: "1/10" },
];

test("lootRows prices, sorts and leaves unpriced last", () => {
  const rows = lootRows(drops, { "Mole claw": 440 });
  assert.deepEqual(
    rows.map((r) => [r.item, r.perKill]),
    [
      ["Mole claw", 440],
      ["Coins", 75],
      ["Mystery", undefined],
    ],
  );
  assert.equal(rows[1].price, 1);
  assert.equal(rows[2].price, undefined);
});

test("lootSummary", () => {
  const s = lootSummary(lootRows(drops, { "Mole claw": 440 }));
  assert.equal(s.average, 515);
  assert.equal(s.unpriced, 1);
  assert.equal(s.top[0].item, "Mole claw");
  assert.equal(s.top.length, 2);
});

test("lootSummary keeps only the 3 biggest", () => {
  const many = ["a", "b", "c", "d"].map((item) => ({
    item,
    quantity: "1",
    rarity: "Always",
  }));
  const s = lootSummary(lootRows(many, { a: 1, b: 4, c: 3, d: 2 }));
  assert.deepEqual(s.top.map((r) => r.item), ["b", "c", "d"]);
});

test("no prices: only Coins is priced", () => {
  const rows = lootRows(drops, undefined);
  assert.deepEqual(
    rows.filter((r) => r.price !== undefined).map((r) => r.item),
    ["Coins"],
  );
  assert.equal(lootSummary(rows).unpriced, drops.length - 1);
});

test("empty input", () => {
  assert.deepEqual(lootRows([], {}), []);
  assert.deepEqual(lootSummary([]), { average: 0, unpriced: 0, top: [] });
});
