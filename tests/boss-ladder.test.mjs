import assert from "node:assert/strict";
import test from "node:test";
import {
  TIER_ORDER,
  TIER_STATS,
  bossStatus,
  defaultDropVersion,
  ladder,
  meetsTier,
  nextBoss,
  stageOf,
  visibleBosses,
} from "../src/lib/bossLadder.ts";

const boss = (id, tier, level, extra = {}) => ({
  id,
  name: id,
  wiki: id,
  level,
  tier,
  team: "Solo",
  members: false,
  requirements: [],
  drops: {},
  uniques: ["Thing"],
  achievements: [],
  ...extra,
});
const profile = (extra = {}) => ({
  mode: "members",
  levels: { Attack: 99, Strength: 99, Defence: 99, Constitution: 99 },
  completedQuests: [],
  ...extra,
});

test("constants", () => {
  assert.deepEqual(TIER_STATS, { Free: 60, Low: 75, Mid: 85, High: 95 });
  assert.ok(TIER_ORDER.Free < TIER_ORDER.Low && TIER_ORDER.Mid < TIER_ORDER.High);
  assert.equal(stageOf("Free"), "Start here");
  assert.equal(stageOf("Low"), "Early members");
  assert.equal(stageOf("Mid"), "Mid-game");
  assert.equal(stageOf("High"), "Endgame");
});

test("ladder orders by tier, level, then name", () => {
  const out = ladder([
    boss("low", "Low", 150),
    boss("b", "Free", 276),
    boss("a", "Free", 230),
    boss("a2", "Free", 230),
  ]).map((b) => b.id);
  assert.deepEqual(out, ["a", "a2", "b", "low"]);
});

test("f2p profiles hide members bosses", () => {
  const bosses = [boss("m", "Free", 1, { members: true }), boss("f", "Free", 2)];
  assert.deepEqual(
    visibleBosses(profile({ mode: "f2p" }), bosses).map((b) => b.id),
    ["f"],
  );
  assert.equal(visibleBosses(profile(), bosses).length, 2);
});

test("status rules in order", () => {
  const m = boss("m", "Free", 1, { members: true });
  assert.equal(bossStatus(profile({ mode: "f2p" }), m).text, "Members only");

  const q = boss("q", "Free", 1, {
    requirements: [{ kind: "quest", quest: "plagues-end" }],
  });
  assert.deepEqual(bossStatus(profile(), q), {
    kind: "quest",
    text: "After Plague's End",
    quest: "plagues-end",
  });
  assert.equal(
    bossStatus(profile({ completedQuests: ["plagues-end"] }), q).kind,
    "ready",
  );

  const s = boss("s", "Free", 1, {
    requirements: [
      { kind: "text", text: "Access to Morytania" },
      { kind: "skill", skill: "Slayer", level: 95 },
    ],
  });
  const slayer80 = profile({ levels: { ...profile().levels, Slayer: 80 } });
  assert.deepEqual(bossStatus(slayer80, s), {
    kind: "skill",
    text: "Needs 95 Slayer",
  });
  // Missing skill key counts as level 1.
  assert.equal(bossStatus(profile(), s).text, "Needs 95 Slayer");
});

test("ready, levels and unknown statuses", () => {
  const b = boss("b", "Mid", 1);
  assert.equal(bossStatus(profile(), b).text, "Ready now");
  const weak = profile({ levels: { Attack: 50, Strength: 50, Defence: 50, Constitution: 50 } });
  assert.deepEqual(bossStatus(weak, b), {
    kind: "levels",
    text: "Around 85 combat stats",
  });
  assert.deepEqual(bossStatus(profile({ levels: {} }), b), {
    kind: "unknown",
    text: "Levels not recorded",
  });
});

test("meetsTier", () => {
  const base = { Attack: 60, Strength: 62, Defence: 60, Constitution: 60 };
  assert.equal(meetsTier(base, "Free"), true);
  assert.equal(meetsTier({ ...base, Defence: 59 }, "Free"), false);
  assert.equal(meetsTier({ Magic: 80, Defence: 80, Constitution: 80 }, "Low"), true);
  assert.equal(meetsTier({ Attack: 99, Strength: 10, Defence: 99, Constitution: 99 }, "Free"), false);
});

test("nextBoss", () => {
  const a = boss("a", "Free", 1);
  const b = boss("b", "Free", 2);
  const high = boss("h", "High", 1);
  const p = profile();
  assert.equal(nextBoss(p, [a, b], new Set(["boss:a:Thing"]))?.id, "b");
  // Everything ready and complete: nothing to suggest.
  assert.equal(
    nextBoss(p, [a, high], new Set(["boss:a:Thing", "boss:h:Thing"])),
    undefined,
  );
  const weak = profile({ levels: { Attack: 70, Strength: 70, Defence: 70, Constitution: 70 } });
  assert.equal(nextBoss(weak, [a, high], new Set(["boss:a:Thing"]))?.id, "h");
  // Zero uniques never counts as log complete.
  const none = boss("n", "Free", 1, { uniques: [] });
  assert.equal(nextBoss(p, [none], new Set())?.id, "n");
  // Custom uniques function.
  assert.equal(nextBoss(p, [a, b], new Set(["boss:a:Thing"]), () => []) ?.id, "a");
});

test("defaultDropVersion", () => {
  const drops = { Normal: [], "Normal F2P": [], "Hard Mode": [] };
  assert.equal(defaultDropVersion(boss("x", "Free", 1, { drops }), "f2p"), "Normal F2P");
  assert.equal(defaultDropVersion(boss("x", "Free", 1, { drops }), "members"), "Normal");
  assert.equal(defaultDropVersion(boss("x", "Free", 1), "members"), undefined);
  assert.equal(
    defaultDropVersion(boss("x", "Free", 1, { drops: { Hard: [] } }), "f2p"),
    "Hard",
  );
  // Some tables name the free version "Free-to-play" rather than "F2P".
  const named = { Members: [], "Free-to-play": [] };
  assert.equal(defaultDropVersion(boss("x", "Free", 1, { drops: named }), "f2p"), "Free-to-play");
  assert.equal(defaultDropVersion(boss("x", "Free", 1, { drops: named }), "members"), "Members");
});
