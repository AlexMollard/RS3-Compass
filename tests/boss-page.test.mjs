import assert from "node:assert/strict";
import test from "node:test";
import {
  checkedLabel,
  displayRarity,
  firstRarity,
  setupGear,
  statedTier,
} from "../src/lib/bossPage.ts";

test("checkedLabel formats a year-month stamp without timezone drift", () => {
  assert.equal(checkedLabel("2026-11"), "Nov 2026");
  assert.equal(checkedLabel("2026-01"), "Jan 2026");
  assert.equal(checkedLabel("autumn"), "autumn");
  assert.equal(checkedLabel("2026-13"), "2026-13");
});

test("displayRarity cleans broken wiki rarity text", () => {
  assert.equal(displayRarity("1/"), "Unknown");
  assert.equal(displayRarity(""), "Unknown");
  assert.equal(displayRarity("Very rare<!--1/320"), "Very rare");
  assert.equal(displayRarity("1/512"), "1/512");
  assert.equal(
    firstRarity({ drops: { Normal: [{ item: "Pet", quantity: "1", rarity: "1/" }] } }, "Pet"),
    "Unknown",
  );
});

test("firstRarity reads the first version that lists the item", () => {
  const boss = {
    drops: {
      Normal: [{ item: "Bones", quantity: "1", rarity: "Always" }],
      "Hard Mode": [
        { item: "Head", quantity: "1", rarity: "1/500" },
        { item: "Bones", quantity: "1", rarity: "1/2" },
      ],
    },
  };
  assert.equal(firstRarity(boss, "Bones"), "Always");
  assert.equal(firstRarity(boss, "Head"), "1/500");
  assert.equal(firstRarity(boss, "Pet"), undefined);
  assert.equal(firstRarity({ drops: {} }, "Pet"), undefined);
});

test("statedTier reads the first tier in a setup line", () => {
  assert.equal(statedTier("Tier 70+ weapon, tier 65+ armour"), 70);
  assert.equal(statedTier("Blue or green dragonhide with rune crossbows"), undefined);
});

test("setupGear picks the best core item per slot up to the stated tier", () => {
  const melee = setupGear("melee", "Tier 50+ weapon and armour", true);
  assert.ok(melee.length > 0);
  assert.ok(melee.every((item) => item.from <= 50 && !item.optional));
  assert.equal(new Set(melee.map((item) => item.slot)).size, melee.length);
  assert.ok(melee.some((item) => item.slot === "melee weapon" && item.from === 50));
  // No tier stated: no icons rather than a guess.
  assert.deepEqual(setupGear("ranged", "Dragonhide and a crossbow", true), []);
  // Free accounts never get members gear.
  const f2p = setupGear("melee", "Tier 70+ weapon", false);
  assert.ok(f2p.every((item) => !item.members));
});
