import assert from "node:assert/strict";
import test, { mock } from "node:test";
import { startVisibleRefresh } from "../src/lib/visibleRefresh.ts";

test("startVisibleRefresh runs on each tick and visibility change until stopped", (t) => {
  mock.timers.enable({ apis: ["setInterval"] });
  const document = new EventTarget();
  globalThis.document = document;
  t.after(() => {
    mock.timers.reset();
    delete globalThis.document;
  });
  const calls = [];
  const stop = startVisibleRefresh((...args) => calls.push(args));
  mock.timers.tick(59_999);
  assert.equal(calls.length, 0);
  mock.timers.tick(1);
  assert.equal(calls.length, 1);
  document.dispatchEvent(new Event("visibilitychange"));
  assert.equal(calls.length, 2);
  // The callback never receives the event, so a page's default argument applies.
  assert.ok(calls.every((args) => args.length === 0));
  stop();
  mock.timers.tick(120_000);
  document.dispatchEvent(new Event("visibilitychange"));
  assert.equal(calls.length, 2);
});

test("startVisibleRefresh honours a custom interval", (t) => {
  mock.timers.enable({ apis: ["setInterval"] });
  globalThis.document = new EventTarget();
  t.after(() => {
    mock.timers.reset();
    delete globalThis.document;
  });
  let calls = 0;
  const stop = startVisibleRefresh(() => calls++, 1000);
  mock.timers.tick(3000);
  stop();
  assert.equal(calls, 3);
});
