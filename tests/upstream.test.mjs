import assert from "node:assert/strict";
import test from "node:test";
import { UPSTREAM_TIMEOUT_MS, upstreamInit } from "../src/lib/server/upstream.ts";

test("upstreamInit sends the accept type and user agent verbatim", () => {
  assert.deepEqual(upstreamInit("text/html", "RS3 Compass test").headers, {
    accept: "text/html",
    "user-agent": "RS3 Compass test",
  });
  assert.equal(UPSTREAM_TIMEOUT_MS, 8000);
});

test("upstreamInit creates a live timeout signal for every request", () => {
  const a = upstreamInit("application/json", "x");
  const b = upstreamInit("application/json", "x");
  assert.ok(a.signal instanceof AbortSignal);
  assert.equal(a.signal.aborted, false);
  assert.notEqual(a.signal, b.signal);
});
