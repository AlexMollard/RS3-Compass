import test from "node:test";
import assert from "node:assert/strict";
import {
  parseEventResponse,
  lookupEvents,
} from "../src/lib/server/eventLookup.ts";
const json = (value, status = 200) =>
  new Response(JSON.stringify(value), { status });
const event = {
  type: "future_type",
  date: "2024-08-02T15:50:20+01:00",
  text: "Found an item",
  details: "A description",
};

test("empty logs and unknown types with offset timestamps remain valid", () => {
  assert.deepEqual(parseEventResponse({ name: "Example", events: [] }), {
    status: "available",
    name: "Example",
    events: [],
  });
  assert.deepEqual(parseEventResponse({ name: "Example", events: [event] }), {
    status: "available",
    name: "Example",
    events: [event],
  });
});

test("invalid timestamps, records and oversized logs are unavailable", () => {
  for (const events of [
    [{ ...event, date: "not a date" }],
    [{ ...event, date: "2024-08-02T15:50:20" }],
    [{ ...event, details: null }],
    [{ ...event, text: "" }],
    Array(21).fill(event),
  ])
    assert.deepEqual(parseEventResponse({ name: "Example", events }), {
      status: "unavailable",
      reason: "service-unavailable",
    });
});

test("errors on non-200 responses distinguish hidden, nonmember and failure", async () => {
  for (const [error, reason] of [
    ["PLAYER_NOT_FOUND", "private-or-unavailable"],
    ["PLAYER_NOT_MEMBER", "not-member"],
    ["INTERNAL_ERROR", "service-unavailable"],
  ])
    assert.deepEqual(
      await lookupEvents("Example", async () => json({ error }, 403)),
      { status: "unavailable", reason },
    );
  assert.deepEqual(
    await lookupEvents("Example", async () =>
      json({ name: "Other", events: [] }),
    ),
    { status: "unavailable", reason: "service-unavailable" },
  );
  assert.deepEqual(
    await lookupEvents(
      "Example",
      async () => new Response("bad", { status: 500 }),
    ),
    { status: "unavailable", reason: "service-unavailable" },
  );
});
