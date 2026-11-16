import assert from "node:assert/strict";
import test from "node:test";
import { selectGear } from "../src/gearSelection.ts";

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
    item("Test bane 2h", "2h", 79, { Attack: 80 }),
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
  assert.equal(r.next.item.name, "Test adze");
  assert.deepEqual(r.next.missing, [{ skill: "Firemaking", level: 92 }]);
});

test("dual wield rows stay separate and shields are not a row", () => {
  const items = [
    item("Test 2h", "2h", 60),
    item("Test sword", "weapon", 60),
    item("Test offhand sword", "off-hand weapon", 60),
    item("Test shield", "off-hand", 60),
  ];
  const rows = selectGear({ class: "melee", profile: profile({}), items });
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
  const twoH = row(selectGear({ class: "melee", profile: profile({}), items, maxTier: 70 }), "2h");
  assert.equal(twoH.best.item.name, "Test 2h 60");
  assert.equal(twoH.next, undefined);
});
