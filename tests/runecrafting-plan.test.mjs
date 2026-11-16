import assert from "node:assert/strict";
import test from "node:test";
import { ALTARS } from "../src/runecraftingGuide.ts";
import {
  altarAccess,
  craftNow,
  defaultXpRule,
  essencePerTrip,
  essenceSources,
  isIronman,
  planStock,
  questState,
  runesPerEssence,
  unlockNext,
} from "../src/runecraftingPlan.ts";

const profile = (over = {}) => ({
  id: "p",
  kind: "Solo Ironman",
  mode: "members",
  completedQuests: [],
  levels: { Runecrafting: 82 },
  ...over,
});
const QUESTS = [
  "enter-the-abyss-miniquest",
  "rune-mythos",
  "lost-city",
  "what-lies-below",
  "mournings-end-part-ii",
  "lunar-diplomacy",
  "legacy-of-seergaze",
];
const example = (over = {}) => profile({ completedQuests: QUESTS, ...over });
const KIT = { pouches: ["small", "medium", "large", "giant"], familiar: "lurker" };
const blood = { rune: "Blood", have: 4200, want: 20000 };
const astral = { rune: "Astral", have: 2000, want: 10000 };
const soul = { rune: "Soul", have: 300, want: 5000 };
const altar = (rune) => ALTARS.find((a) => a.rune === rune);

test("worked example 1: trips, craft-now choice and unlock steps", () => {
  const p = example();
  assert.equal(essencePerTrip(KIT), 66);

  const b = planStock(p, KIT, 82, blood);
  assert.deepEqual([b.perEssence, b.essence, b.trips], [1, 15800, 240]);
  const a = planStock(p, KIT, 82, astral);
  assert.deepEqual([a.perEssence, a.essence, a.trips], [2, 4000, 61]);

  const save = craftNow(p, { ...KIT, xpRule: "save-essence" }, 82);
  assert.equal(save.xp.method.needsEssence, false);
  const fast = craftNow(p, { ...KIT, xpRule: "fastest" }, 82);
  assert.equal(fast.xp.method.id, "abyss-75-90");
  assert.ok(fast.xp.sources.length > 0);

  const steps = unlockNext(p, KIT, 82);
  const find = (track) => steps.find((s) => s.track === track);
  assert.ok(find("savvy").reqs.some((r) => r.text.includes("95")));
  const pouch = find("pouch");
  assert.equal(pouch.name, "Massive pouch");
  assert.ok(pouch.reqs.some((r) => r.text.includes("90")));
  const soulStep = find("altar");
  assert.equal(soulStep.name, "Soul altar");
  assert.equal(soulStep.reqs.find((r) => r.text === "'Phite Club").state, "unmet");
  assert.equal(soulStep.reqs.find((r) => r.text.includes("90")).state, "unmet");
});

test("the altar unlock step is Cosmic without Lost City", () => {
  const p = example({ completedQuests: QUESTS.filter((q) => q !== "lost-city") });
  assert.equal(unlockNext(p, KIT, 82).find((s) => s.track === "altar").name, "Cosmic altar");
});

test("a level-110 player with every quest done sees no altar step, and Savvy copy shows the percentage", () => {
  const p = example({ levels: { Runecrafting: 110 }, completedQuests: [...QUESTS, "phite-club"] });
  const steps = unlockNext(p, KIT, 82);
  assert.equal(steps.find((s) => s.track === "savvy").name, "Savvy Runecrafting +275%");
  const done = unlockNext(p, KIT, 110);
  assert.equal(done.find((s) => s.track === "altar"), undefined);
  const time = steps.find((s) => s.name === "Time altar");
  assert.equal(time.track, "milestone");
  assert.ok(time.reqs.some((r) => r.state === "check"));
});

test("unknown quests stay in the craft-now choice, marked unknown", () => {
  const p = profile({ questImportStatus: "service-unavailable" });
  const now = craftNow(p, { xpRule: "fastest" }, 82);
  assert.equal(now.xp.method.id, "abyss-75-90");
  assert.ok(now.xp.reqs.some((r) => r.state === "unknown"));
});

test("worked example 2: a locked Soul target is skipped", () => {
  const p = example();
  const kit = { ...KIT, stock: [blood, astral, soul] };
  const plan = planStock(p, kit, 82, soul);
  assert.equal(plan.trips, 0);
  assert.equal(plan.essence, 0);
  assert.ok(plan.locked.length > 0);
  const now = craftNow(p, kit, 82);
  assert.notEqual(now.stock.target.rune, "Soul");
  assert.ok(now.skippedLocked.some((s) => s.target.rune === "Soul"));
});

test("worked example 3: an empty kit carries 28 and has no stock", () => {
  assert.equal(essencePerTrip({}), 28);
  assert.equal(craftNow(example(), {}, 82).stock, undefined);
});

test("target reached needs nothing", () => {
  const plan = planStock(example(), KIT, 82, { rune: "Blood", have: 25000, want: 20000 });
  assert.deepEqual([plan.remaining, plan.essence, plan.trips], [0, 0, 0]);
});

test("expansive is not stacked with the other pouches", () => {
  const all = ["small", "medium", "large", "giant", "massive", "expansive"];
  assert.equal(essencePerTrip({ pouches: all }), 97);
});

test("familiar and infinity outfit add capacity", () => {
  assert.equal(essencePerTrip({ familiar: "titan", infinityOutfit: true }), 28 + 20 + 12);
});

test("unknown quests stay unknown, not unmet", () => {
  const p = profile({ questImportStatus: "service-unavailable" });
  assert.equal(questState(p, "phite-club"), "unknown");
  assert.equal(questState(profile({ questImportStatus: "available" }), "phite-club"), "unmet");
  assert.equal(questState(profile({ completedQuests: ["phite-club"], questImportStatus: "service-unavailable" }), "phite-club"), "met");
});

test("a level that is not recorded returns needsLevel", () => {
  assert.deepEqual(craftNow(example(), KIT, undefined), { needsLevel: true });
});

test("ironman defaults", () => {
  assert.equal(isIronman("Solo Ironman"), true);
  assert.equal(isIronman("Group Ironman"), true);
  assert.equal(isIronman("Regular account"), false);
  assert.equal(defaultXpRule("Solo Ironman"), "save-essence");
  assert.equal(defaultXpRule("Regular account"), "fastest");
});

test("runesPerEssence counts multipliers reached", () => {
  assert.equal(runesPerEssence(altar("Astral"), 81), 1);
  assert.equal(runesPerEssence(altar("Astral"), 82), 2);
});

test("altarAccess reports level, quest and in-game checks", () => {
  const reqs = altarAccess(example(), altar("Time"));
  assert.ok(reqs.some((r) => r.state === "check"));
  assert.equal(reqs.find((r) => r.text.includes("100")).state, "unmet");
});

test("essenceSources puts met sources before unmet ones", () => {
  const views = essenceSources(example(), "pure");
  assert.ok(views.length > 1);
  const firstUnmet = views.findIndex((v) => !v.met);
  assert.ok(views.slice(firstUnmet).every((v) => !v.met));
});

test("an attuner method needs the attuner", () => {
  const p = example({ levels: { Runecrafting: 105 } });
  const fast = { xpRule: "fastest" };
  assert.notEqual(craftNow(p, fast, 105).xp.method.id, "runic-attuner");
  assert.equal(craftNow(p, { ...fast, attuner: true }, 105).xp.method.id, "runic-attuner");
});
