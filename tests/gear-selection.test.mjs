import assert from "node:assert/strict";
import test from "node:test";
import { routeFor } from "../src/equipmentCuration.ts";
import { EQUIPMENT_IMPORTED } from "../src/equipmentImported.ts";
import { selectGear } from "../src/gearSelection.ts";
import { RS3_SKILL_NAMES } from "../src/skillNames.ts";

const item = (name, slot, tier, wear = {}, extra = {}) => ({
  name,
  wiki: name,
  slot,
  class: "melee",
  tier,
  armourType: ["head", "body", "legs", "hands", "feet"].includes(slot) ? "tank" : undefined,
  wear: Object.entries(wear).map(([skill, level]) => ({ skill, level })),
  members: true,
  tradeable: false,
  route: { kind: "smith", note: "Smithed." },
  ...extra,
});
const drop = { route: { kind: "rare-drop", note: "Rare drop." } };

const profile = (levels, extra = {}) => ({
  id: "test",
  name: "Test",
  kind: "Solo Ironman",
  mode: "members",
  levels,
  completedQuests: [],
  packed: [],
  completedTasks: [],
  activeTask: "",
  notes: {},
  ...extra,
});
const row = (rows, name) => rows.find((r) => r.row === name);

test("worked example 1", () => {
  const items = [
    item("Test bane 2h", "2h", 80, { Attack: 80 }),
    item("Test boss 2h", "2h", 80, { Attack: 80 }, drop),
    item("Test elder 2h", "2h", 90, { Attack: 90 }),
    item("Test body 80", "body", 80, { Defence: 80 }),
    item("Test body 85", "body", 85, { Defence: 85 }),
  ];
  const rows = selectGear({ class: "melee", profile: profile({ Attack: 85, Defence: 82 }), items });
  const twoH = row(rows, "2h");
  assert.equal(twoH.best.item.name, "Test boss 2h");
  assert.equal(twoH.easier.item.name, "Test bane 2h");
  assert.equal(twoH.next.item.name, "Test elder 2h");
  assert.deepEqual(twoH.next.missing, [{ skill: "Attack", level: 90, recorded: 85 }]);
  const body = row(rows, "body");
  assert.equal(body.best.item.name, "Test body 80");
  assert.equal(body.next.item.name, "Test body 85");
  assert.deepEqual(
    rows.map((r) => r.row),
    ["2h", "body"],
  );
});

test("worked example 2 F2P hides members and dedupes easier", () => {
  const items = [
    item("Test f2p bow", "2h", 40, { Ranged: 40 }, { class: "ranged", members: false }),
    item("Test members bow", "2h", 45, { Ranged: 45 }, { class: "ranged" }),
    item("Test members drop", "2h", 45, { Ranged: 45 }, { class: "ranged", members: false, route: { kind: "rare-drop", note: "", members: true } }),
  ];
  const rows = selectGear({ class: "ranged", profile: profile({ Ranged: 45 }, { mode: "f2p" }), items });
  const twoH = row(rows, "2h");
  assert.equal(twoH.best.item.name, "Test f2p bow");
  assert.equal(twoH.easier, undefined);
  for (const r of rows)
    for (const pick of [r.best, r.easier, r.atLeast, r.next].filter(Boolean))
      assert.ok(!pick.item.members && !pick.route.members, pick.item.name);
});

test("worked example 3 unrecorded Defence", () => {
  const items = [
    item("Test 2h", "2h", 60, { Attack: 60 }),
    item("Test bronze body", "body", 5),
    item("Test rune body", "body", 50, { Defence: 50 }),
    item("Test rune helm", "head", 50, { Defence: 50 }),
  ];
  const rows = selectGear({ class: "melee", profile: profile({ Attack: 70 }), items });
  for (const name of ["body", "head"]) {
    assert.equal(row(rows, name).unrecorded, "Defence", name);
    assert.equal(row(rows, name).best, undefined, name);
    assert.equal(row(rows, name).next, undefined, name);
  }
  assert.equal(row(rows, "2h").best.item.name, "Test 2h");
});

test("a secondary unrecorded skill above next does not prompt", () => {
  const items = [
    item("Test bronze 2h", "2h", 1),
    item("Test iron 2h", "2h", 10, { Attack: 10 }),
    item("Test slayer 2h", "2h", 20, { Slayer: 31 }),
  ];
  const twoH = row(selectGear({ class: "melee", profile: profile({ Attack: 1 }), items }), "2h");
  assert.equal(twoH.unrecorded, undefined);
  assert.equal(twoH.best.item.name, "Test bronze 2h");
  assert.equal(twoH.next.item.name, "Test iron 2h");
});

test("best needs every wear requirement", () => {
  const items = [item("Test 2h 60", "2h", 60, { Attack: 60 }), item("Test 2h 80", "2h", 80, { Attack: 80, Strength: 80 })];
  const twoH = row(selectGear({ class: "melee", profile: profile({ Attack: 85, Strength: 70 }), items }), "2h");
  assert.equal(twoH.best.item.name, "Test 2h 60");
  assert.deepEqual(twoH.next.missing, [{ skill: "Strength", level: 80, recorded: 70 }]);
});

test("power beats tank at equal tier", () => {
  const items = [
    item("Test a tank body", "body", 70, { Defence: 70 }),
    item("Test b power body", "body", 70, { Defence: 70 }, { armourType: "power" }),
  ];
  const body = row(selectGear({ class: "melee", profile: profile({ Defence: 70 }), items }), "body");
  assert.equal(body.best.item.name, "Test b power body");
});

test("hybrid is never best", () => {
  const items = [
    item("Test tank body", "body", 60, { Defence: 60 }),
    item("Test hybrid body", "body", 70, { Defence: 70 }, { armourType: "hybrid" }),
  ];
  const body = row(selectGear({ class: "melee", profile: profile({ Defence: 99 }), items }), "body");
  assert.equal(body.best.item.name, "Test tank body");
  assert.equal(body.next, undefined);
});

test("regular account counts tradeable as easy", () => {
  const items = [
    item("Test smith 2h", "2h", 70, { Attack: 70 }),
    item("Test drop 2h", "2h", 75, { Attack: 75 }, { ...drop, tradeable: true }),
    item("Test boss 2h", "2h", 80, { Attack: 80 }, drop),
  ];
  const easier = (kind) => row(selectGear({ class: "melee", profile: profile({ Attack: 99 }, { kind }), items }), "2h").easier;
  assert.equal(easier("Regular account").item.name, "Test drop 2h");
  assert.equal(easier("Group Ironman").item.name, "Test smith 2h");
});

test("wear quest blocks best", () => {
  const items = [item("Test helm", "head", 40, { Defence: 40 }), item("Helm of Neitiznot", "head", 55, { Defence: 55 })];
  const blocked = row(selectGear({ class: "melee", profile: profile({ Defence: 60 }), items }), "head");
  assert.equal(blocked.best.item.name, "Test helm");
  assert.equal(blocked.next.item.name, "Helm of Neitiznot");
  assert.deepEqual(blocked.next.missingQuests, ["the-fremennik-isles"]);
  const done = profile({ Defence: 60 }, { completedQuests: ["the-fremennik-isles"] });
  assert.equal(row(selectGear({ class: "melee", profile: done, items }), "head").best.item.name, "Helm of Neitiznot");
});

test("nothing wearable shows next", () => {
  const items = [item("Test 2h 70", "2h", 70, { Attack: 70 }), item("Test 2h 80", "2h", 80, { Attack: 80 })];
  const twoH = row(selectGear({ class: "melee", profile: profile({ Attack: 50 }), items }), "2h");
  assert.equal(twoH.best, undefined);
  assert.equal(twoH.unrecorded, undefined);
  assert.equal(twoH.next.item.name, "Test 2h 70");
});

test("empty profile prompts", () => {
  for (const style of ["melee", "ranged", "magic", "necromancy"]) {
    const rows = selectGear({ class: style, profile: profile({}) });
    assert.ok(rows.length > 0, style);
    for (const r of rows) assert.ok(r.unrecorded || r.next, `${style} ${r.row}`);
  }
  const tools = selectGear({ class: "tool", toolSlot: "pickaxe", profile: profile({}) });
  assert.equal(tools[0].unrecorded, "Mining");
});

test("atLeast prefers an easy route at minTier", () => {
  const items = [
    item("Test a drop 2h", "2h", 70, { Attack: 70 }, drop),
    item("Test b smith 2h", "2h", 70, { Attack: 70 }),
    item("Test low 2h", "2h", 60, { Attack: 60 }),
  ];
  const twoH = row(selectGear({ class: "melee", profile: profile({ Attack: 65 }), items, minTier: 70, minReason: "Our pick" }), "2h");
  assert.equal(twoH.atLeast.item.name, "Test b smith 2h");
  assert.equal(twoH.atLeast.reason, "Our pick");
  assert.deepEqual(twoH.atLeast.missing, [{ skill: "Attack", level: 70, recorded: 65 }]);
});

test("at equal tier, easier and atLeast take the most ordinary route (smith > craft > shop > drop > quest > reward)", () => {
  const kind = (k) => ({ route: { kind: k, note: k } });
  const items = [
    item("Test a reward 2h", "2h", 80, { Attack: 80 }, kind("reward")),
    item("Test b quest 2h", "2h", 80, { Attack: 80 }, kind("quest")),
    item("Test c shop 2h", "2h", 80, { Attack: 80 }, kind("shop")),
    item("Test d smith 2h", "2h", 80, { Attack: 80 }, kind("smith")),
    item("Test boss 2h", "2h", 80, { Attack: 80 }, drop),
  ];
  const twoH = row(selectGear({ class: "melee", profile: profile({ Attack: 85 }), items, minTier: 80, minReason: "r" }), "2h");
  assert.equal(twoH.best.item.name, "Test boss 2h");
  assert.equal(twoH.easier.item.name, "Test d smith 2h");
  assert.equal(twoH.atLeast.item.name, "Test d smith 2h");
  const noSmith = items.filter((i) => !/smith|shop/.test(i.name));
  assert.equal(row(selectGear({ class: "melee", profile: profile({ Attack: 85 }), items: noSmith }), "2h").easier.item.name, "Test b quest 2h");
});

test("a curated tool level ranks a tool whose infobox lists only Attack", () => {
  const hatchet = (name, attack) => ({
    ...item(name, "weapon", attack, { Attack: attack }),
    members: false,
    tool: "hatchet",
  });
  const items = [hatchet("Bronze hatchet", 1), hatchet("Rune hatchet", 50), hatchet("Unknown hatchet", 30)];
  const [r] = selectGear({ class: "tool", toolSlot: "hatchet", profile: profile({ Woodcutting: 50, Attack: 1 }), items });
  assert.equal(r.best.item.name, "Rune hatchet");
  assert.deepEqual(r.best.missing, []);
  assert.equal(r.easier, undefined);
});

test("route gaps are exposed separately from wear gaps", () => {
  const items = [
    item("Test 2h", "2h", 70, { Attack: 70 }, { route: { kind: "smith", note: "", levels: [{ skill: "Smithing", level: 70 }] } }),
  ];
  const best = row(selectGear({ class: "melee", profile: profile({ Attack: 70, Smithing: 60 }), items }), "2h").best;
  assert.deepEqual(best.missing, []);
  assert.deepEqual(best.routeMissing, [{ skill: "Smithing", level: 70, recorded: 60 }]);
});

test("tools rank by wear level, ignore Attack and stay out of combat rows", () => {
  const tool = (name, mining, extra = {}) => item(name, "weapon", 1, { Mining: mining, Attack: 99 }, { tool: "pickaxe", ...extra });
  const items = [
    tool("Test rune pickaxe", 50, { members: false }),
    tool("Test rune pickaxe + 1", 50),
    tool("Test dragon pickaxe", 60, drop),
    tool("Test elder pickaxe", 90),
    tool("Test hatchet", 1, { tool: "hatchet" }),
  ];
  const [r] = selectGear({ class: "tool", toolSlot: "pickaxe", profile: profile({ Mining: 61, Attack: 1 }), items });
  assert.equal(r.row, "tool");
  assert.equal(r.best.item.name, "Test dragon pickaxe");
  assert.equal(r.easier.item.name, "Test rune pickaxe");
  assert.equal(r.next.item.name, "Test elder pickaxe");
  assert.deepEqual(r.next.missing, [{ skill: "Mining", level: 90, recorded: 61 }]);
  assert.deepEqual(selectGear({ class: "melee", profile: profile({ Attack: 99, Mining: 99 }), items }), []);
});

test("an unrecorded extra skill does not hide a real best", () => {
  const items = [
    item("Test dragon pickaxe", "weapon", 1, { Mining: 60 }, { tool: "pickaxe" }),
    item("Test adze", "weapon", 1, { Mining: 61, Firemaking: 92 }, { tool: "pickaxe" }),
    item("Test elder pickaxe", "weapon", 1, { Mining: 90 }, { tool: "pickaxe" }),
  ];
  const [r] = selectGear({ class: "tool", toolSlot: "pickaxe", profile: profile({ Mining: 61 }), items });
  assert.equal(r.unrecorded, undefined);
  assert.equal(r.best.item.name, "Test dragon pickaxe");
  // Next is the closest upgrade: Mining 90 is nearer than the adze's Firemaking 92.
  assert.equal(r.next.item.name, "Test elder pickaxe");
  assert.deepEqual(r.next.missing, [{ skill: "Mining", level: 90, recorded: 61 }]);
});

test("next is ordered by the highest level still needed, then tier, then route", () => {
  const items = [
    item("Test best 2h", "2h", 85, { Attack: 85 }, drop),
    item("Test far 2h", "2h", 86, { Attack: 99 }),
    item("Test near 2h", "2h", 87, { Attack: 87 }, drop),
    item("Test strong 2h", "2h", 90, { Attack: 90 }, drop),
    item("Test b smith 2h", "2h", 88, { Attack: 87 }),
    item("Test a reward 2h", "2h", 88, { Attack: 87 }, { route: { kind: "reward", note: "" } }),
  ];
  const twoH = row(selectGear({ class: "melee", profile: profile({ Attack: 85 }), items }), "2h");
  assert.equal(twoH.best.item.name, "Test best 2h");
  // Attack 87 beats 90 and 99; at Attack 87 the tier-88 items beat tier 87, and smith beats reward.
  assert.equal(twoH.next.item.name, "Test b smith 2h");
});

test("a row asks for its primary skill only", () => {
  const items = [
    item("Test sword", "weapon", 10, { Attack: 10 }),
    item("Test sword 20", "weapon", 20, { Attack: 20 }),
    item("Test ranged body", "body", 40, { Ranged: 40 }, { class: "ranged" }),
    item("Test ranged body 50", "body", 50, { Defence: 50, Ranged: 50 }, { class: "ranged" }),
    item("Test bow", "2h", 70, { Ranged: 70 }, { class: "ranged" }),
  ];
  // Melee with Attack unrecorded: the weapon row prompts for Attack, even with requirement-free items around.
  const melee = selectGear({ class: "melee", profile: profile({ Defence: 99 }), items });
  assert.equal(row(melee, "main hand").unrecorded, "Attack");
  assert.equal(row(melee, "main hand").best, undefined);
  // Ranged 70 with Defence unrecorded: armour prompts for Defence rather than showing a Ranged-only body.
  const ranged = selectGear({ class: "ranged", profile: profile({ Ranged: 70 }), items });
  assert.equal(row(ranged, "body").unrecorded, "Defence");
  assert.equal(row(ranged, "body").best, undefined);
  assert.equal(row(ranged, "2h").best.item.name, "Test bow");
  // Attack recorded, Defence not: the weapon row still picks.
  const low = row(selectGear({ class: "melee", profile: profile({ Attack: 10 }), items }), "main hand");
  assert.equal(low.unrecorded, undefined);
  assert.equal(low.best.item.name, "Test sword");
  assert.equal(low.next.item.name, "Test sword 20");
});

test("at equal tier, best takes a known hard route, then easy routes, and an unknown route last", () => {
  const kind = (k) => ({ route: { kind: k, note: k } });
  const items = [
    item("Test a unknown 2h", "2h", 80, { Attack: 80 }, kind("unknown")),
    item("Test b smith 2h", "2h", 80, { Attack: 80 }),
    item("Test c drop 2h", "2h", 80, { Attack: 80 }, drop),
  ];
  const best = (list, extra) => row(selectGear({ class: "melee", profile: profile({ Attack: 80 }, extra), items: list }), "2h").best.item.name;
  assert.equal(best(items), "Test c drop 2h");
  assert.equal(best(items.slice(0, 2)), "Test b smith 2h");
  // A regular account's tie is not broken by tradeability.
  const traded = [
    item("Test a smith 2h", "2h", 80, { Attack: 80 }, { tradeable: true }),
    item("Test c drop 2h", "2h", 80, { Attack: 80 }, { ...drop, tradeable: true }),
  ];
  assert.equal(best(traded, { kind: "Regular account" }), "Test c drop 2h");
});

test("dual wield rows stay separate and shields are not a row", () => {
  const items = [
    item("Test 2h", "2h", 60),
    item("Test sword", "weapon", 60),
    item("Test offhand sword", "off-hand weapon", 60),
    item("Test shield", "off-hand", 60),
  ];
  const rows = selectGear({ class: "melee", profile: profile({ Attack: 1 }), items });
  assert.deepEqual(
    rows.map((r) => [r.row, r.best?.item.name]),
    [
      ["2h", "Test 2h"],
      ["main hand", "Test sword"],
      ["off hand", "Test offhand sword"],
    ],
  );
});

test("maxTier caps candidates", () => {
  const items = [item("Test 2h 60", "2h", 60), item("Test 2h 80", "2h", 80)];
  const twoH = row(selectGear({ class: "melee", profile: profile({ Attack: 1 }), items, maxTier: 70 }), "2h");
  assert.equal(twoH.best.item.name, "Test 2h 60");
  assert.equal(twoH.next, undefined);
});

// The real catalogue (src/equipmentImported.ts): these pin symptoms found by probing it.
const levels = (n, omit = []) => Object.fromEntries(RS3_SKILL_NAMES.filter((s) => !omit.includes(s)).map((s) => [s, n]));
const real = (style, levels, extra) => selectGear({ class: style, profile: profile(levels, extra) });
const ARMOUR = ["head", "body", "legs", "hands", "feet"];
const WEAPONS = ["2h", "main hand", "off hand"];

test("real catalogue: Ranged 70 with Defence unrecorded asks for Defence on every armour row", () => {
  const rows = real("ranged", levels(70, ["Defence"]));
  for (const name of ARMOUR) {
    assert.equal(row(rows, name).unrecorded, "Defence", name);
    assert.equal(row(rows, name).best, undefined, name);
    assert.equal(row(rows, name).easier, undefined, name);
  }
  for (const name of WEAPONS) assert.ok(row(rows, name).best, name);
});

test("real catalogue: Attack unrecorded asks for Attack on the melee weapon rows", () => {
  const rows = real("melee", levels(70, ["Attack"]));
  for (const name of WEAPONS) {
    assert.equal(row(rows, name).unrecorded, "Attack", name);
    assert.equal(row(rows, name).best, undefined, name);
  }
  for (const name of ARMOUR) assert.ok(row(rows, name).best, name);
});

test("real catalogue: Attack 1 with nothing else recorded still picks the weapon rows", () => {
  const rows = real("melee", { Attack: 1 });
  for (const name of WEAPONS) {
    assert.equal(row(rows, name).unrecorded, undefined, name);
    assert.ok(row(rows, name).best, name);
    assert.ok(row(rows, name).next, name);
  }
  for (const name of ARMOUR) assert.equal(row(rows, name).unrecorded, "Defence", name);
});

test("real catalogue: holiday, quest-stage and novelty items are never Best at Ranged 10 or Magic 10", () => {
  const banned = /^(Snowball|Lunar staff - pt\d|Rubber turkey|Off-hand rubber turkey|Mouse toy|Two-handed swordfish|Relomia's wand|Starfury .*|Lucky .*|Golden .*)$/;
  for (const style of ["ranged", "magic"])
    for (const mode of ["members", "f2p"]) {
      const picks = real(style, levels(10), { mode }).flatMap((r) => [r.best, r.easier]).filter(Boolean);
      assert.ok(picks.length > 0, `${style} ${mode}`);
      assert.deepEqual(picks.filter((p) => banned.test(p.item.name)).map((p) => p.item.name), [], `${style} ${mode}`);
    }
});

test("real catalogue: at Attack 85 the next 2h upgrade needs at most Attack 90", () => {
  const next = row(real("melee", levels(85)), "2h").next;
  assert.ok(next, "a next 2h");
  const attack = next.item.wear.find((w) => w.skill === "Attack")?.level ?? 0;
  assert.ok(attack > 85 && attack <= 90, `${next.item.name} needs Attack ${attack}`);
});

test("real catalogue: on F2P Attack 1, no unknown route is Best when a known item ties its tier", () => {
  const rows = real("melee", levels(1), { mode: "f2p" });
  for (const r of rows.filter((r) => r.best?.route.kind === "unknown")) {
    // An unknown-route Best is fine only when no wearable known-route item shares its slot, tier and armour type.
    const known = EQUIPMENT_IMPORTED.filter(
      (i) =>
        i.class === "melee" &&
        !i.tool &&
        !i.members &&
        i.tier === r.best.item.tier &&
        i.armourType === r.best.item.armourType &&
        i.slot === r.best.item.slot &&
        i.wear.every((w) => w.level <= 1) &&
        routeFor(i).kind !== "unknown" &&
        !routeFor(i).members,
    );
    assert.deepEqual(known.map((i) => i.name), [], `${r.row}: ${r.best.item.name}`);
  }
  // Mining 1: the Dwarven army axe (route unknown) ties the bronze pickaxe and must not beat it.
  const [pickaxe] = selectGear({ class: "tool", toolSlot: "pickaxe", profile: profile(levels(1)) });
  assert.notEqual(pickaxe.best.route.kind, "unknown", pickaxe.best.item.name);
});
