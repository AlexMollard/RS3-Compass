import assert from "node:assert/strict";
import test from "node:test";
import { QUESTS } from "../src/data.ts";
import {
  ALTARS,
  ESSENCE_SOURCES,
  FAMILIARS,
  POUCHES,
  SAVVY,
  SAVVY_SOURCE,
  XP_METHODS,
} from "../src/runecraftingGuide.ts";

const WIKI = /^https:\/\/runescape\.wiki\/w\/\S+$/;
const altar = (rune) => ALTARS.find((a) => a.rune === rune);

test("every entry is dated and sourced", () => {
  const all = [...ALTARS, ...POUCHES, ...FAMILIARS, ...XP_METHODS, ...ESSENCE_SOURCES, SAVVY_SOURCE];
  for (const e of all) {
    assert.equal(e.checked, "2026-11-17");
    assert.ok(e.sources.length > 0);
    for (const s of e.sources) assert.match(s, WIKI);
  }
});

test("quest ids exist", () => {
  const ids = new Set(QUESTS.map((q) => q.id));
  for (const e of [...ALTARS, ...XP_METHODS, ...ESSENCE_SOURCES]) {
    for (const q of e.quests) assert.ok(ids.has(q), `${q} is a quest id`);
  }
});

test("rune names are unique", () => {
  const names = ALTARS.map((a) => a.rune);
  assert.equal(new Set(names).size, names.length);
});

test("spec values", () => {
  const levels = {
    Air: 1, Mind: 1, Water: 5, Earth: 9, Fire: 14, Body: 20, Cosmic: 27, Chaos: 35, Astral: 40,
    Nature: 44, Law: 54, Death: 65, Blood: 77, Soul: 90, Time: 100,
    Spirit: 1, Bone: 20, Flesh: 40, Miasma: 60,
  };
  for (const [rune, level] of Object.entries(levels)) assert.equal(altar(rune)?.level, level, rune);
  assert.equal(ALTARS.length, Object.keys(levels).length);
  for (const r of ["Spirit", "Bone", "Flesh", "Miasma"]) assert.equal(altar(r).essence, "impure");
  const pouches = { small: [1, 3], medium: [25, 6], large: [50, 9], giant: [75, 12], massive: [90, 18], expansive: [105, 70] };
  for (const [id, [level, capacity]] of Object.entries(pouches)) {
    const p = POUCHES.find((x) => x.id === id);
    assert.deepEqual([p.level, p.capacity], [level, capacity], id);
  }
  const familiars = { parasite: [54, 7], lurker: [62, 12], titan: [93, 20] };
  for (const [id, [summoning, capacity]] of Object.entries(familiars)) {
    const f = FAMILIARS.find((x) => x.id === id);
    assert.deepEqual([f.summoning, f.capacity], [summoning, capacity], id);
  }
  assert.deepEqual(
    SAVVY.map((s) => [s.level, s.bonus]),
    [[25, 75], [35, 150], [60, 200], [70, 250], [95, 275], [105, 300]],
  );
});

test("altar quests", () => {
  assert.deepEqual(altar("Cosmic").quests, ["lost-city"]);
  assert.deepEqual(altar("Chaos").quests, ["what-lies-below"]);
  assert.deepEqual(altar("Astral").quests, ["lunar-diplomacy"]);
  assert.deepEqual(altar("Death").quests, ["mournings-end-part-ii"]);
  assert.deepEqual(altar("Blood").quests, ["legacy-of-seergaze"]);
  assert.deepEqual(altar("Soul").quests, ["phite-club"]);
  for (const r of ["Spirit", "Bone", "Flesh", "Miasma"]) assert.deepEqual(altar(r).quests, ["rune-mythos"]);
  assert.equal(altar("Time").checkInGame, true);
});

test("multipliers ascend", () => {
  for (const a of ALTARS) {
    for (let i = 1; i < a.multipliers.length; i++) assert.ok(a.multipliers[i] > a.multipliers[i - 1], a.rune);
    if (a.multipliers.length) assert.ok(a.multipliers[0] > a.level, `${a.rune} first multiplier above its level`);
  }
  assert.ok(altar("Astral").multipliers.includes(82));
  assert.ok(altar("Nature").multipliers.includes(91));
  assert.equal(altar("Blood").multipliers[0], 154);
  assert.equal(altar("Soul").multipliers[0], 179);
});

test("xp methods cover 1-110 for both rules", () => {
  for (let level = 1; level <= 110; level++) {
    for (const needsEssence of [false, true]) {
      assert.ok(
        XP_METHODS.some((m) => m.needsEssence === needsEssence && m.from <= level && level < m.to),
        `level ${level}, needsEssence ${needsEssence}`,
      );
    }
  }
});

test("xp method links resolve", () => {
  const runes = new Set(ALTARS.map((a) => a.rune));
  for (const m of XP_METHODS) {
    if (m.altar) assert.ok(runes.has(m.altar), `${m.id} altar`);
    assert.ok(m.rate[0] <= m.rate[1], `${m.id} rate`);
  }
  assert.equal(XP_METHODS.filter((m) => m.requiresAttuner).length, 1);
});

test("The saved-kit validator's literal lists match the guide", async () => {
  const { RUNECRAFTING_RUNES, RUNECRAFTING_POUCHES, RUNECRAFTING_FAMILIARS } = await import(
    "../src/lib/profileStore.ts"
  );
  assert.deepEqual([...RUNECRAFTING_RUNES], ALTARS.map((a) => a.rune));
  assert.deepEqual([...RUNECRAFTING_POUCHES], POUCHES.map((p) => p.id));
  assert.deepEqual([...RUNECRAFTING_FAMILIARS], FAMILIARS.map((f) => f.id));
});
