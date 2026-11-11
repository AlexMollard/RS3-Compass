import assert from "node:assert/strict";
import test from "node:test";
import { LruMap } from "../src/lib/lru.ts";

const keys = (lru, all) => all.filter((k) => lru.peek(k) !== undefined);

test("LruMap evicts the least recently stored entry beyond its cap", () => {
  const lru = new LruMap(2);
  lru.set("a", 1);
  lru.set("b", 2);
  lru.set("c", 3);
  assert.deepEqual(keys(lru, ["a", "b", "c"]), ["b", "c"]);
});

test("get marks an entry as recently used; peek does not", () => {
  const lru = new LruMap(2);
  lru.set("a", 1);
  lru.set("b", 2);
  assert.equal(lru.get("a"), 1);
  lru.set("c", 3);
  assert.deepEqual(keys(lru, ["a", "b", "c"]), ["a", "c"]);
  assert.equal(lru.peek("a"), 1);
  lru.set("d", 4);
  assert.deepEqual(keys(lru, ["a", "c", "d"]), ["c", "d"]);
});

test("set replaces a value and moves it to most recent", () => {
  const lru = new LruMap(2);
  lru.set("a", 1);
  lru.set("b", 2);
  lru.set("a", 10);
  lru.set("c", 3);
  assert.equal(lru.get("a"), 10);
  assert.equal(lru.get("b"), undefined);
});

test("missing keys, falsy values and delete", () => {
  const lru = new LruMap(3);
  assert.equal(lru.get("x"), undefined);
  lru.set("zero", 0);
  lru.set("none", null);
  assert.equal(lru.get("zero"), 0);
  assert.equal(lru.get("none"), null);
  assert.equal(lru.delete("zero"), true);
  assert.equal(lru.delete("zero"), false);
  assert.equal(lru.get("zero"), undefined);
});
