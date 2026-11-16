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

test("setupGear picks the best imported item per slot up to the stated tier", () => {
  const melee = setupGear("melee", "Tier 50+ weapon and armour", true);
  assert.ok(melee.length > 0);
  assert.ok(melee.every((item) => item.tier <= 50 && item.class === "melee"));
  assert.equal(new Set(melee.map((item) => item.slot)).size, melee.length);
  assert.ok(melee.some((item) => item.slot === "2h" && item.tier === 50));
  // Weapons and armour both appear.
  assert.ok(melee.some((item) => item.slot === "body"));
});

test("setupGear still builds a kit at the top tier", () => {
  for (const style of ["melee", "ranged", "magic"]) {
    const kit = setupGear(style, "Tier 99 weapon and armour", true);
    assert.ok(kit.length > 0, style);
    assert.ok(kit.some((item) => item.tier >= 90), style);
  }
});

test("setupGear never exceeds a lower stated tier", () => {
  const kit = setupGear("melee", "Tier 80 weapon", true);
  assert.ok(kit.length > 0);
  assert.ok(kit.every((item) => item.tier <= 80));
  assert.ok(kit.some((item) => item.tier === 80));
});

test("setupGear shows no hand items beside a two-handed weapon", () => {
  const kit = setupGear("melee", "Tier 70 weapon", true);
  assert.ok(kit.some((item) => item.slot === "2h"));
  assert.ok(!kit.some((item) => item.slot === "weapon" || item.slot === "off-hand weapon"));
});

test("setupGear gives no icons when the line states no tier", () => {
  assert.deepEqual(setupGear("ranged", "Dragonhide and a crossbow", true), []);
});

test("setupGear kits hold no lucky, golden or Starfury promotion item", () => {
  for (const style of ["melee", "ranged", "magic"])
    for (const tier of [50, 70, 80, 90, 95])
      for (const members of [true, false]) {
        const kit = setupGear(style, `Tier ${tier} weapon and armour`, members);
        const context = `${style} ${tier} ${members ? "members" : "f2p"}`;
        assert.deepEqual(kit.filter((i) => /^(Lucky|Golden|Starfury) /.test(i.name)).map((i) => i.name), [], context);
      }
  // Lucky Bandos boots tied Bandos boots at tier 70 and won on name order before.
  assert.ok(setupGear("melee", "Tier 70 armour", true).some((i) => i.name === "Bandos boots"));
});

test("setupGear never gives free accounts members gear", () => {
  const f2p = setupGear("melee", "Tier 70+ weapon", false);
  assert.ok(f2p.length > 0);
  assert.ok(f2p.every((item) => !item.members));
});
