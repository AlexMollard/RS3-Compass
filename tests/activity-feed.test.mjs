import test from "node:test";
import assert from "node:assert/strict";
import {
  filterGroup,
  groupActivity,
  isHighlight,
  levelUp,
  mergeActivity,
  weeklyTotals,
} from "../src/lib/activityFeed.ts";

const event = (text, date) => ({
  type: "rs_plog_quest",
  text,
  details: text,
  date,
});
const source = (id, events, status = "available") => ({
  playerId: id,
  name: id,
  events,
  status,
  fetchedAt: 1000,
});

test("interleaves members chronologically without collapsing different players' identical events", () => {
  const shared = event(
    "Quest complete: Cook's Assistant",
    "2026-11-06T10:00:00Z",
  );
  const earlier = event(
    "Quest complete: The Restless Ghost",
    "2026-11-05T10:00:00Z",
  );
  const rows = mergeActivity([
    source("Alice", [earlier, shared, shared]),
    source("Bob", [shared]),
  ]);
  assert.equal(rows.length, 3);
  assert.deepEqual(
    rows
      .slice(0, 2)
      .map((r) => r.playerId)
      .sort(),
    ["Alice", "Bob"],
  );
  assert.equal(rows[2].event.text, earlier.text);
  assert.equal(new Set(rows.map((r) => r.key)).size, 3);
});

test("one inaccessible member does not discard another member or the last successful events", () => {
  const old = event("Quest complete: Cook's Assistant", "2026-11-05T10:00:00Z");
  const current = event(
    "Quest complete: The Restless Ghost",
    "2026-11-06T10:00:00Z",
  );
  const rows = mergeActivity([
    source("Alice", [old], "service-unavailable"),
    source("Bob", [current]),
    source("Carol", undefined, "private-or-unavailable"),
  ]);
  assert.deepEqual(
    rows.map((r) => r.playerId),
    ["Bob", "Alice"],
  );
});

test("snapshot event identities stay stable after a reordered or repeated response", () => {
  const a = event("Quest complete: Cook's Assistant", "2026-11-06T10:00:00Z");
  const b = event("Quest complete: The Restless Ghost", "2026-11-05T10:00:00Z");
  assert.deepEqual(
    mergeActivity([source("Alice", [a, b])]),
    mergeActivity([source("Alice", [b, a, a])]),
  );
});

const level = (skill, n, date) => ({
  type: "rs_plog_levelup_count",
  text: `Levelled up ${skill}.`,
  details: `I levelled my ${skill} skill, I am now level ${n}.`,
  date,
});
const drop = (item, date) => ({
  type: "rs_plog_item_drop",
  text: `I found a ${item}`,
  details: "",
  date,
});
const at = (local) => new Date(local).toISOString();

test("reads the skill and level from a level-up event", () => {
  assert.deepEqual(levelUp(level("Mining", 100, at("2026-11-17T10:00:00"))), {
    skill: "Mining",
    level: 100,
  });
  assert.deepEqual(
    levelUp({ ...level("Mining", 1, ""), details: "Levelled up." }),
    { skill: "Mining", level: undefined },
  );
  assert.equal(
    levelUp(event("Quest complete: Cook's Assistant", "")),
    undefined,
  );
});

test("highlights rare drops and level 99 or 120 only", () => {
  assert.equal(isHighlight(level("Prayer", 99, "")), true);
  assert.equal(isHighlight(level("Slayer", 120, "")), true);
  assert.equal(isHighlight(level("Herblore", 92, "")), false);
  assert.equal(isHighlight(drop("Saradomin hilt", "")), true);
  assert.equal(
    isHighlight(event("Quest complete: Cook's Assistant", "")),
    false,
  );
});

test("groups by local day and batches each player's level-ups for the day", () => {
  const now = new Date("2026-11-17T20:00:00").getTime();
  const rows = mergeActivity([
    source("Alice", [
      level("Mining", 81, at("2026-11-17T18:00:00")),
      level("Smithing", 79, at("2026-11-17T17:59:00")),
      level("Prayer", 99, at("2026-11-17T17:58:00")),
      event("Quest complete: Plague's End", at("2026-11-16T12:00:00")),
      level("Herblore", 92, at("2026-11-16T11:00:00")),
    ]),
    source("Bob", [level("Fishing", 75, at("2026-11-17T17:59:30"))]),
    source("Carol", [event("Quest complete: Broken", "not a date")]),
  ]);
  const days = groupActivity(rows, now);
  assert.deepEqual(
    days.map((d) => [d.label, d.count]),
    [
      ["Today", 4],
      ["Yesterday", 2],
      ["Date unknown", 1],
    ],
  );
  // Bob's level lands between Alice's; Alice's still fold into one batch.
  assert.deepEqual(
    days[0].items.map((i) =>
      i.kind === "levels" ? i.skills.map((s) => s.skill) : i.row.playerId,
    ),
    [["Mining", "Smithing", "Prayer"], "Bob"],
  );
  assert.equal(days[0].items[0].highlight, true);
  // A lone level-up stays an ordinary row.
  assert.deepEqual(
    days[1].items.map((i) => i.kind),
    ["event", "event"],
  );
});

test("a skill levelled several times in a day becomes one range", () => {
  const now = new Date("2026-11-17T20:00:00").getTime();
  const rows = mergeActivity([
    source("Aku", [
      level("Thieving", 53, at("2026-11-17T12:00:00")),
      level("Thieving", 50, at("2026-11-17T11:00:00")),
      level("Thieving", 52, at("2026-11-17T10:00:00")),
      { ...level("Agility", 1, at("2026-11-17T09:00:00")), details: "" },
    ]),
  ]);
  const [batch] = groupActivity(rows, now)[0].items;
  assert.deepEqual(batch.skills, [
    { skill: "Thieving", from: 50, to: 53, count: 3 },
    { skill: "Agility", count: 1 },
  ]);
});

test("filter chips group the detailed categories", () => {
  assert.deepEqual(
    [
      "Level gained",
      "XP milestone",
      "Item found",
      "Quest points",
      "Dungeoneering",
      "Music unlocked",
      "Activity",
    ].map(filterGroup),
    ["Levels", "Levels", "Drops", "Quests", "Combat", "Other", "Other"],
  );
});

test("weekly totals count only the last 7 days of returned events", () => {
  const now = new Date("2026-11-17T20:00:00").getTime();
  const totals = weeklyTotals(
    [
      source("Alice", [
        level("Mining", 81, at("2026-11-17T18:00:00")),
        level("Smithing", 79, at("2026-11-17T17:00:00")),
        event("Quest complete: Plague's End", at("2026-11-12T12:00:00")),
        event("Quest complete: Old", at("2026-11-01T12:00:00")),
        drop("Saradomin hilt", at("2026-11-16T12:00:00")),
      ]),
      source("Carol", undefined, "private-or-unavailable"),
    ],
    now,
  );
  assert.deepEqual(totals, [
    { playerId: "Alice", name: "Alice", levels: 2, quests: 1, drops: 1 },
  ]);
});
