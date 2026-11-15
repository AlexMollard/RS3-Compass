import assert from "node:assert/strict";
import test from "node:test";
import { EQUIPMENT_CURATION, routeFor } from "../src/equipmentCuration.ts";
import { EQUIPMENT_IMPORTED } from "../src/equipmentImported.ts";
import { isSkillName } from "../src/skillNames.ts";

const CLASSES = ["melee", "ranged", "magic", "necromancy"];
const SLOTS = ["2h", "weapon", "off-hand weapon", "off-hand", "head", "body", "legs", "hands", "feet"];
const item = (name) => {
  const found = EQUIPMENT_IMPORTED.find((i) => i.name === name);
  assert.ok(found, `${name} is imported`);
  return found;
};

// Tier 0 is a real Wiki value (Argonlike armour, Fremennik boots).
test("every item has a gear slot, a tier and wear skills", () => {
  const bad = EQUIPMENT_IMPORTED.filter(
    (i) =>
      !SLOTS.includes(i.slot) ||
      !Number.isInteger(i.tier) ||
      i.tier < 0 ||
      i.tier > 120 ||
      !i.wear.every((w) => isSkillName(w.skill) && w.level >= 1 && w.level <= 120),
  );
  assert.deepEqual(bad.map((i) => i.name), []);
});

test("no item name appears twice", () => {
  const names = EQUIPMENT_IMPORTED.map((i) => i.name);
  assert.equal(new Set(names).size, names.length);
});

test("no excluded name is imported", () => {
  const excluded = new Set(EQUIPMENT_CURATION.exclude);
  assert.deepEqual(EQUIPMENT_IMPORTED.filter((i) => excluded.has(i.name)).map((i) => i.name), []);
});

test("every curated entry is dated 2026-11-16 with a Wiki source", () => {
  const entries = [
    ...Object.entries(EQUIPMENT_CURATION.routes),
    ...EQUIPMENT_CURATION.families.map((f) => [f.match, f.route]),
    ...Object.entries(EQUIPMENT_CURATION.wearQuests),
  ];
  const bad = entries.filter(
    ([, e]) => e.checked !== "2026-11-16" || !e.sources.some((s) => s.startsWith("https://runescape.wiki/w/")),
  );
  assert.deepEqual(bad.map(([name]) => name), []);
});

test("every curated route and wear quest names an imported item, and every family matches one", () => {
  const names = new Set(EQUIPMENT_IMPORTED.map((i) => i.name));
  const missing = [...Object.keys(EQUIPMENT_CURATION.routes), ...Object.keys(EQUIPMENT_CURATION.wearQuests)].filter(
    (n) => !names.has(n),
  );
  assert.deepEqual(missing, []);
  const idle = EQUIPMENT_CURATION.families.filter((f) => !EQUIPMENT_IMPORTED.some((i) => new RegExp(f.match).test(i.name)));
  assert.deepEqual(idle.map((f) => f.match), []);
});

test("tools are tagged and kept out of the combat classes' counts", () => {
  assert.equal(item("Rune pickaxe").tool, "pickaxe");
  assert.equal(item("Rune hatchet").tool, "hatchet");
  assert.equal(item("Rune mattock").tool, "mattock");
});

test("each combat style has a body at tier 90 or higher", () => {
  for (const style of CLASSES)
    assert.ok(
      EQUIPMENT_IMPORTED.some((i) => !i.tool && i.class === style && i.slot === "body" && i.tier >= 90),
      `${style} has a tier 90+ body`,
    );
});

test("routes come from Wiki recipe, shop and drop data", () => {
  assert.equal(routeFor(item("Noxious scythe")).kind, "rare-drop");
  assert.match(routeFor(item("Noxious scythe")).note, /Araxxi's fang/);
  assert.equal(routeFor(item("Elder rune platebody")).kind, "smith");
  assert.equal(routeFor(item("Bane 2h sword")).kind, "smith");
  // Crafted, but from Telos's dormant godsword, whose drop rate "Varies".
  assert.equal(routeFor(item("Zaros godsword")).kind, "rare-drop");
  // Sold at Skulgrimen's Battle Gear; no recipe.
  assert.equal(routeFor(item("Berserker helm")).kind, "shop");
});
