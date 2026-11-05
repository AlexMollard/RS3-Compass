import test from "node:test";
import assert from "node:assert/strict";
import { mergeActivity } from "../src/lib/activityFeed.ts";

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
