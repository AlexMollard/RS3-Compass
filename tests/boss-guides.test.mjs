import assert from "node:assert/strict";
import test from "node:test";
import { BOSS_GUIDES } from "../src/bossGuides.ts";
import {
  applyUniqueOverrides,
  bossById,
  bossUniques,
  filterUniques,
} from "../src/bosses.ts";

const F2P = ["ivar-king-of-bones", "giant-mole", "king-black-dragon", "chaos-elemental"];

test("every guide belongs to a known boss", () => {
  for (const id of Object.keys(BOSS_GUIDES)) assert.ok(bossById(id), id);
});

test("every ironman next is a boss id", () => {
  for (const [id, guide] of Object.entries(BOSS_GUIDES))
    if (guide.ironman?.next) assert.ok(bossById(guide.ironman.next), id);
});

test("every guide has 3 to 5 mechanics", () => {
  for (const [id, guide] of Object.entries(BOSS_GUIDES)) {
    assert.ok(guide.mechanics.length >= 3, id);
    assert.ok(guide.mechanics.length <= 5, id);
  }
});

test("checked is a year and month", () => {
  for (const [id, guide] of Object.entries(BOSS_GUIDES))
    assert.match(guide.checked, /^\d{4}-\d{2}$/, id);
});

test("all four free-to-play bosses have a guide with ironman notes", () => {
  for (const id of F2P) {
    assert.ok(BOSS_GUIDES[id], id);
    assert.ok(BOSS_GUIDES[id].ironman, id);
  }
});

test("every guide has setup for at least one style and no repeated bring lines", () => {
  for (const [id, guide] of Object.entries(BOSS_GUIDES)) {
    assert.ok(guide.setup.length >= 1, id);
    assert.equal(new Set(guide.bring).size, guide.bring.length, id);
  }
});

test("applyUniqueOverrides removes, then adds without duplicates", () => {
  const guides = { mole: { uniques: { remove: ["Mole skin"], add: ["Molly", "Rotten fang"] } } };
  assert.deepEqual(
    applyUniqueOverrides(["Mole skin", "Rotten fang", "Dragon 2h sword"], guides.mole),
    ["Rotten fang", "Dragon 2h sword", "Molly"],
  );
  assert.deepEqual(applyUniqueOverrides(["A"], undefined), ["A"]);
});

test("bossUniques applies the guide's overrides", () => {
  const mhekarnahz = bossById("flesh-hatcher-mhekarnahz");
  assert.ok(mhekarnahz.uniques.includes("Hexhunter bow"));
  assert.ok(!bossUniques(mhekarnahz).includes("Hexhunter bow"));
  assert.ok(bossUniques(mhekarnahz).includes("Stalker's charm"));
});

test("filterUniques drops generic items", () => {
  assert.deepEqual(
    filterUniques([
      "Sealed clue scroll (hard)",
      "Clue scroll (elite)",
      "Reward casket (master)",
      "Crystal triskelion",
      "Crystal triskelion fragment 1",
      "Starved ancient effigy",
      "Gold charm",
      "Crimson charm",
      "Coins",
      "Antipoison (4)",
      "Prayer potion (2)",
      "Saradomin brew",
      "Super restore",
      "Spirit shards",
      "Key token",
      "Medium prismatic lamp",
    ]),
    [],
  );
});

test("filterUniques keeps boss-specific items", () => {
  const keep = [
    "Stalker's charm",
    "Seeker's charm",
    "Godsword shard 1",
    "Black dragon egg (unchecked)",
    "Dragon kite ornament kit (or)",
    "Key to the Crossing",
    "Jail cell key",
    "Soulbound lantern",
    "Holy elixir",
    "Dragon 2h sword",
    "Rotten fang",
  ];
  assert.deepEqual(filterUniques(keep), keep);
});
