// Edge cases for every trust-boundary validator, run through its public entry point,
// so the copies that share one guard are shown to accept and reject the same input.
import test from "node:test";
import assert from "node:assert/strict";
import { get } from "svelte/store";
import { createCompassController } from "../src/lib/profileStore.ts";
import { isGroupLookup } from "../src/lib/groupData.ts";
import {
  isPlayerEvents,
  isPlayerLookup,
  isQuestProgress,
} from "../src/lib/playerData.ts";
import { parseEventResponse } from "../src/lib/server/eventLookup.ts";
import { parseQuestResponse } from "../src/lib/server/questLookup.ts";
import { platformPlayer } from "./fixtures/platform-player.mjs";

const MAX_DATE = 8_640_000_000_000_000;
// [value, accepted as a skill level]
const LEVELS = [
  [1, true],
  [120, true],
  [0, false],
  [-1, false],
  [121, false],
  [1.5, false],
  [2 ** 53, false],
  [NaN, false],
  ["5", false],
  [null, false],
];

test("public player lookups accept only integer skill levels from 1 to 120", () => {
  for (const [level, ok] of LEVELS)
    assert.equal(isPlayerLookup(platformPlayer({ levels: { Mining: level } })), ok, String(level));
  for (const levels of [{ Nope: 5 }, { constructor: 5 }, [], null])
    assert.equal(isPlayerLookup(platformPlayer({ levels })), false);
  for (const [fetchedAt, ok] of [[0, true], [MAX_DATE, true], [MAX_DATE + 1, false], [-1, false], [1.5, false]])
    assert.equal(isPlayerLookup(platformPlayer({ fetchedAt })), ok, String(fetchedAt));
  assert.equal(isPlayerLookup([]), false);
});

const group = (extra = {}, member = {}) => ({
  id: 1,
  name: "Example Group",
  size: 2,
  isCompetitive: true,
  founder: true,
  totalLevel: 300,
  totalXp: 0,
  fetchedAt: 123,
  members: [{ name: "Alice", ...member }],
  ...extra,
});

test("saved groups accept the same skill levels and bounded integers", () => {
  for (const [level, ok] of LEVELS)
    assert.equal(isGroupLookup(group({}, { levels: { Attack: level } })), ok, String(level));
  for (const levels of [{}, { Nope: 5 }, { constructor: 5 }, [], null])
    assert.equal(isGroupLookup(group({}, { levels })), false);
  for (const [fetchedAt, ok] of [[MAX_DATE, true], [MAX_DATE + 1, false], [-1, false], [1.5, false]])
    assert.equal(isGroupLookup(group({ fetchedAt })), ok, String(fetchedAt));
  for (const [totalXp, ok] of [[2 ** 53 - 1, true], [2 ** 53, false], [-1, false]])
    assert.equal(isGroupLookup(group({ totalXp })), ok, String(totalXp));
  assert.equal(isGroupLookup(group({ id: 0 })), false);
  assert.equal(isGroupLookup(group({}, { totalLevel: 0 })), false);
  assert.equal(isGroupLookup(group({ members: [[]] })), false);
  assert.equal(isGroupLookup([]), false);
});

const event = {
  type: "future_type",
  date: "2024-08-02T15:50:20+01:00",
  text: "Found an item",
  details: "",
};

test("the server event parser and the saved-event guard agree on every event", () => {
  for (const [entry, ok] of [
    [event, true],
    [{ ...event, extra: 1 }, true],
    [{ ...event, date: "2024-08-02T15:50:20.5Z" }, true],
    [{ ...event, text: "   " }, false],
    [{ ...event, type: " " }, false],
    [{ ...event, details: undefined }, false],
    [{ ...event, date: "2024-08-02" }, false],
    [{ ...event, date: "2024-08-02T15:50:20" }, false],
    [{ ...event, date: "9999-99-99T99:99:99Z" }, false],
    [null, false],
    [[], false],
  ]) {
    const parsed = parseEventResponse({ name: "Example", events: [entry] });
    assert.equal(parsed.status === "available", ok, JSON.stringify(entry));
    assert.equal(isPlayerEvents([entry]), ok, JSON.stringify(entry));
  }
});

test("the server quest parser and the saved-quest guard agree on statuses and counts", () => {
  const server = (quest, extra = {}) =>
    parseQuestResponse({
      name: "Example",
      qp: 1,
      qp_max: 5,
      quests: { 1: { title: "Q", eligible: true, members: false, difficulty: 0, qp: 1, status: "STARTED", ...quest } },
      ...extra,
    }).status === "available";
  const client = (quest, extra = {}) =>
    isQuestProgress({
      questPoints: 1,
      maxQuestPoints: 5,
      records: [{ id: "1", title: "Q", eligible: true, members: false, difficulty: 0, questPoints: 1, status: "STARTED", ...quest }],
      ...extra,
    });
  for (const [status, ok] of [
    ["NOT_STARTED", true],
    ["STARTED", true],
    ["COMPLETED", true],
    ["completed", false],
    ["", false],
    [undefined, false],
    [1, false],
  ]) {
    assert.equal(server({ status }), ok, String(status));
    assert.equal(client({ status }), ok, String(status));
  }
  for (const [difficulty, ok] of [[0, true], [-1, false], [1.5, false], [2 ** 53, false]]) {
    assert.equal(server({ difficulty }), ok, String(difficulty));
    assert.equal(client({ difficulty }), ok, String(difficulty));
  }
  for (const [qp, ok] of [[0, true], [-1, false], [1.5, false]]) {
    assert.equal(server({}, { qp, qp_max: 5 }), ok, String(qp));
    assert.equal(client({}, { questPoints: qp }), ok, String(qp));
  }
  assert.equal(server({}, { quests: [] }), false);
  assert.equal(parseQuestResponse([]).status, "unavailable");
});

const KEY = "rs3-compass-design-v1";

/** Whether a save with `mutate` applied to its first profile loads unchanged. */
function loads(t, mutate) {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  const saved = structuredClone(get(createCompassController().state));
  const result = mutate(saved) ?? saved;
  const storage = new Map([[KEY, JSON.stringify(result)]]);
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value),
    },
  });
  const controller = createCompassController();
  try {
    controller.initialize();
    return (
      JSON.stringify(get(controller.state).profiles) ===
      JSON.stringify(result.profiles)
    );
  } finally {
    controller.destroy();
    if (descriptor) Object.defineProperty(globalThis, "localStorage", descriptor);
    else delete globalThis.localStorage;
  }
}

test("saved profiles accept the same skill levels in every level map", (t) => {
  for (const [level, ok] of LEVELS) {
    if (Number.isNaN(level)) continue; // JSON cannot store NaN
    for (const field of ["levels", "trainingRanges", "hiscoresLevels"])
      assert.equal(
        loads(t, (s) => {
          s.profiles[0][field] = { Attack: level };
        }),
        ok,
        `${field} ${level}`,
      );
  }
  assert.equal(loads(t, () => {}), true);
  assert.equal(loads(t, (s) => void (s.profiles[0].hiscoresLevels = {})), false);
  assert.equal(loads(t, (s) => void (s.profiles[0].hiscoresLevels = { Nope: 5 })), false);
  assert.equal(loads(t, (s) => void (s.profiles[0].levels = { Nope: 5 })), true);
  for (const field of ["levels", "trainingRanges", "trainingMethods", "notes", "hiscoresLevels"]) {
    assert.equal(loads(t, (s) => void (s.profiles[0][field] = [])), false, field);
    assert.equal(loads(t, (s) => void (s.profiles[0][field] = null)), false, field);
  }
  assert.equal(loads(t, (s) => void (s.profiles[0] = [])), false);
  assert.equal(loads(t, (s) => [s]), false);
});
