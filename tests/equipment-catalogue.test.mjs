import assert from "node:assert/strict";
import test from "node:test";
import { EQUIPMENT_CURATION, routeFor } from "../src/equipmentCuration.ts";
import { EQUIPMENT_IMPORTED } from "../src/equipmentImported.ts";
import { QUESTS } from "../src/data.ts";
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
    ...Object.entries(EQUIPMENT_CURATION.noWearRequirement),
  ];
  const bad = entries.filter(
    ([, e]) => e.checked !== "2026-11-16" || !e.sources.some((s) => s.startsWith("https://runescape.wiki/w/")),
  );
  assert.deepEqual(bad.map(([name]) => name), []);
});

test("every curated route and wear quest names an imported item, and every family matches one", () => {
  const names = new Set(EQUIPMENT_IMPORTED.map((i) => i.name));
  const missing = [
    ...Object.keys(EQUIPMENT_CURATION.routes),
    ...Object.keys(EQUIPMENT_CURATION.wearQuests),
    ...Object.keys(EQUIPMENT_CURATION.noWearRequirement),
  ].filter((n) => !names.has(n));
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
  // Boss parts: Queen Black Dragon (about 1/51), TzKal-Zuk behind a Divination swap cycle, and Zamorak.
  assert.equal(routeFor(item("Royal crossbow")).kind, "rare-drop");
  assert.equal(routeFor(item("Ek-ZekKil")).kind, "rare-drop");
  assert.equal(routeFor(item("Bow of the Last Guardian")).kind, "rare-drop");
  // Sold at Skulgrimen's Battle Gear; no recipe.
  assert.equal(routeFor(item("Berserker helm")).kind, "shop");
});

test("no combat item at tier 70 or higher has an unknown route", () => {
  const unknown = EQUIPMENT_IMPORTED.filter((i) => !i.tool && i.tier >= 70 && routeFor(i).kind === "unknown");
  assert.deepEqual(unknown.map((i) => i.name), []);
});

test("curated quests exist, and curated names are neither stale nor repeated", () => {
  const quests = new Set(QUESTS.map((q) => q.id));
  const curated = [
    ...Object.entries(EQUIPMENT_CURATION.routes).map(([n, r]) => [n, r.quests ?? []]),
    ...EQUIPMENT_CURATION.families.map((f) => [f.match, f.route.quests ?? []]),
    ...Object.entries(EQUIPMENT_CURATION.wearQuests).map(([n, w]) => [n, w.quests]),
  ];
  assert.deepEqual(curated.flatMap(([n, ids]) => ids.filter((id) => !quests.has(id)).map((id) => `${n}: ${id}`)), []);
  // The importer fails on an excluded name that no Wiki category lists; here, none may be repeated or also curated.
  const { exclude, routes, wearQuests } = EQUIPMENT_CURATION;
  assert.equal(new Set(exclude).size, exclude.length);
  assert.deepEqual(exclude.filter((n) => n in routes || n in wearQuests), []);
});

test("every item at tier 20 or higher with no wear requirement is on the verified allowlist", () => {
  const allowed = new Set(Object.keys(EQUIPMENT_CURATION.noWearRequirement));
  const empty = EQUIPMENT_IMPORTED.filter((i) => i.tier >= 20 && !i.wear.length);
  assert.deepEqual(empty.filter((i) => !allowed.has(i.name)).map((i) => i.name), []);
  // An allowlisted item that now has requirements is stale.
  assert.deepEqual(EQUIPMENT_IMPORTED.filter((i) => allowed.has(i.name) && i.wear.length).map((i) => i.name), []);
});

test("Dominion Tower gloves carry their stated prerequisites", () => {
  for (const name of ["Goliath gloves (black)", "Spellcaster gloves", "Swift gloves"]) {
    const route = routeFor(item(name));
    assert.equal(route.kind, "reward", name);
    assert.ok(route.quests?.length && route.levels?.length && route.unlocks?.length, name);
  }
  assert.deepEqual(item("Goliath gloves (black)").wear.map((w) => `${w.skill} ${w.level}`), ["Attack 80", "Defence 80"]);
  assert.deepEqual(item("Pernix body").wear.map((w) => `${w.skill} ${w.level}`), ["Defence 80", "Constitution 80"]);
});

test("port-resource gear names the player-owned port", () => {
  for (const name of ["Tetsu body", "Tetsu katana", "Death Lotus chaps", "Death Lotus dart", "Seasinger's hood", "Seasinger kiba"]) {
    const route = routeFor(item(name));
    assert.ok(["smith", "craft"].includes(route.kind), name);
    assert.match(route.note, /player-owned port/, name);
  }
});
