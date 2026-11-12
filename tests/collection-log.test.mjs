import test from "node:test";
import assert from "node:assert/strict";
import {
  autoMatches,
  bossLogProgress,
  isAutoCollected,
  isCollected,
  logKey,
  mergeAutoTicks,
  toggleCollected,
} from "../src/lib/collectionLog.ts";

const mole = { id: "giant-mole", uniques: ["Mole claw", "Mole skin", "Pet"] };
const kbd = { id: "king-black-dragon", uniques: ["Draconic visage", "Pet"] };
const event = (text, type = "rs_plog_item_drop") => ({
  type,
  date: "13-Nov-2026 10:00",
  text,
  details: "",
});
const profile = (extra = {}) => ({
  id: "p",
  name: "P",
  kind: "Regular account",
  mode: "members",
  levels: {},
  completedQuests: [],
  packed: [],
  completedTasks: [],
  activeTask: "",
  notes: {},
  ...extra,
});
const withEvents = (events, extra) =>
  profile({ eventLog: { events, fetchedAt: 1 }, ...extra });

test("logKey joins the boss id and item verbatim", () => {
  assert.equal(logKey("giant-mole", "Mole claw"), "boss:giant-mole:Mole claw");
});

test("An item drop matches a boss unique ignoring case and the article", () => {
  assert.deepEqual(autoMatches([event("I found a mole claw.")], [mole, kbd]), [
    "boss:giant-mole:Mole claw",
  ]);
});

test("An item a boss doesn't list doesn't match", () => {
  assert.deepEqual(
    autoMatches([event("I found a dragon pickaxe")], [mole, kbd]),
    [],
  );
});

test("Non-item events never match, even with matching text", () => {
  assert.deepEqual(
    autoMatches([event("I found a mole claw.", "rs_plog_quest")], [mole]),
    [],
  );
});

test("A shared unique matches every boss once, however often it drops", () => {
  assert.deepEqual(
    autoMatches(
      [event("I found a Pet."), event("I found a pet")],
      [mole, kbd],
    ),
    ["boss:giant-mole:Pet", "boss:king-black-dragon:Pet"],
  );
});

test("autoMatches uses the given uniques function", () => {
  assert.deepEqual(
    autoMatches([event("I found a mole claw.")], [mole], () => ["Mole skin"]),
    [],
  );
});

test("Merging writes new matches to both lists and marks them auto", () => {
  const merged = mergeAutoTicks(withEvents([event("I found a mole claw.")]), [
    mole,
  ]);
  assert.deepEqual(merged.collected, ["boss:giant-mole:Mole claw"]);
  assert.deepEqual(merged.collectedAuto, ["boss:giant-mole:Mole claw"]);
  assert.equal(isCollected(merged, "boss:giant-mole:Mole claw"), true);
  assert.equal(isAutoCollected(merged, "boss:giant-mole:Mole claw"), true);
});

test("Review Focus 5: an unticked auto match isn't re-added by the same events", () => {
  const events = [event("I found a mole claw.")];
  const key = "boss:giant-mole:Mole claw";
  const merged = mergeAutoTicks(withEvents(events), [mole]);
  const unticked = toggleCollected(merged, key);
  assert.equal(isCollected(unticked, key), false);
  assert.equal(isAutoCollected(unticked, key), false);
  const again = mergeAutoTicks(
    { ...unticked, eventLog: { events, fetchedAt: 2 } },
    [mole],
  );
  assert.equal(again.collected.includes(key), false);
  assert.equal(again.collectedAuto.includes(key), true);
});

test("Merging with no new matches returns the identical profile", () => {
  const none = withEvents([event("I found a dragon pickaxe")]);
  assert.equal(mergeAutoTicks(none, [mole]), none);
  const noLog = profile();
  assert.equal(mergeAutoTicks(noLog, [mole]), noLog);
  const merged = mergeAutoTicks(withEvents([event("I found a mole claw.")]), [
    mole,
  ]);
  assert.equal(mergeAutoTicks(merged, [mole]), merged);
});

test("Merging keeps hand ticks and doesn't duplicate a key ticked by hand", () => {
  const key = "boss:giant-mole:Mole claw";
  const before = withEvents([event("I found a mole claw.")], {
    collected: [key, "boss:giant-mole:Mole skin"],
  });
  const merged = mergeAutoTicks(before, [mole]);
  assert.deepEqual(merged.collected, [key, "boss:giant-mole:Mole skin"]);
  assert.deepEqual(merged.collectedAuto, [key]);
  assert.deepEqual(before.collectedAuto, undefined);
});

test("Toggling adds a hand tick, then removes it, returning new profiles", () => {
  const key = "boss:giant-mole:Mole skin";
  const start = profile();
  const on = toggleCollected(start, key);
  assert.notEqual(on, start);
  assert.deepEqual(on.collected, [key]);
  assert.equal(isAutoCollected(on, key), false);
  assert.equal(start.collected, undefined);
  const off = toggleCollected(on, key);
  assert.deepEqual(off.collected, []);
  assert.deepEqual(on.collected, [key]);
});

test("Re-ticking an unticked auto match labels it auto again", () => {
  const key = "boss:giant-mole:Mole claw";
  const merged = mergeAutoTicks(withEvents([event("I found a mole claw.")]), [
    mole,
  ]);
  const back = toggleCollected(toggleCollected(merged, key), key);
  assert.equal(isAutoCollected(back, key), true);
});

test("bossLogProgress counts ticked uniques out of the boss's uniques", () => {
  const p = profile({
    collected: [
      "boss:giant-mole:Mole claw",
      "boss:king-black-dragon:Draconic visage",
      "boss:giant-mole:Not a unique",
    ],
  });
  assert.deepEqual(bossLogProgress(p, mole), { got: 1, total: 3 });
  assert.deepEqual(bossLogProgress(profile(), mole), { got: 0, total: 3 });
  assert.deepEqual(
    bossLogProgress(p, mole, () => ["Mole claw"]),
    { got: 1, total: 1 },
  );
});
