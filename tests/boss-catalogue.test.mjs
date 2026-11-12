import assert from "node:assert/strict";
import test from "node:test";
import { BOSSES, bossById } from "../src/bosses.ts";
import { QUESTS } from "../src/data.ts";

// The Wiki table lists no signature drops for these, and no drop is rare enough to qualify.
// (Taraket the Necromancer has none either, but its Hydrix bolt tips drop qualifies.)
const NO_UNIQUES = ["crassian-leviathan", "the-sanctum-guardian"];

test("the catalogue has every Combat bosses row, each once", () => {
  assert.equal(BOSSES.length, 56);
  assert.equal(new Set(BOSSES.map((b) => b.id)).size, BOSSES.length);
});

test("Giant Mole is the Free-tier F2P boss, and the F2P set is exactly four", () => {
  const mole = bossById("giant-mole");
  assert.equal(mole.tier, "Free");
  assert.equal(mole.members, false);
  assert.deepEqual(
    BOSSES.filter((b) => !b.members).map((b) => b.id).sort(),
    ["chaos-elemental", "giant-mole", "ivar-king-of-bones", "king-black-dragon"],
  );
});

test("quest requirements point at real quests", () => {
  const ids = new Set(QUESTS.map((q) => q.id));
  for (const boss of BOSSES)
    for (const r of boss.requirements)
      if (r.kind === "quest") assert.ok(ids.has(r.quest), `${boss.name}: ${r.quest}`);
});

test("every boss has a collection log item, bar the known exceptions", () => {
  for (const boss of BOSSES)
    if (!NO_UNIQUES.includes(boss.id)) assert.ok(boss.uniques.length >= 1, boss.name);
});
