import test from "node:test";
import assert from "node:assert/strict";
import {
  createPriceLookup,
  PriceLookupError,
} from "../src/lib/server/priceLookup.ts";

function setup(reply = {}, ok = true) {
  const urls = [];
  const clock = { now: 0 };
  const fetch = async (url) => {
    urls.push(String(url));
    return {
      ok,
      status: ok ? 200 : 500,
      json: async () => reply,
    };
  };
  const service = createPriceLookup({ fetch, now: () => clock.now });
  return { urls, clock, service };
}

test("two calls within the hour make one upstream request", async () => {
  const { urls, clock, service } = setup({ "Mole claw": { price: 440 } });
  assert.deepEqual(await service.prices(["Mole claw"]), { "Mole claw": 440 });
  clock.now = 3_600_000;
  assert.deepEqual(await service.prices(["Mole claw"]), { "Mole claw": 440 });
  assert.equal(urls.length, 1);
});

test("a stale entry refetches after the hour", async () => {
  const { urls, clock, service } = setup({ "Mole claw": { price: 440 } });
  await service.prices(["Mole claw"]);
  clock.now = 3_600_001;
  await service.prices(["Mole claw"]);
  assert.equal(urls.length, 2);
});

test("a name missing from the reply is omitted and not refetched", async () => {
  const { urls, service } = setup({ "Mole claw": { price: 440 } });
  assert.deepEqual(await service.prices(["Mole claw", "Nope"]), {
    "Mole claw": 440,
  });
  assert.deepEqual(await service.prices(["Mole claw", "Nope"]), {
    "Mole claw": 440,
  });
  assert.equal(urls.length, 1);
});

test("a non-number price counts as missing", async () => {
  const { service } = setup({ A: { price: "5" }, B: { price: 7 } });
  assert.deepEqual(await service.prices(["A", "B"]), { B: 7 });
});

test("an upstream failure rejects", async () => {
  const { service } = setup({}, false);
  await assert.rejects(
    service.prices(["A"]),
    (e) =>
      e instanceof PriceLookupError &&
      e.status === 502 &&
      /Prices unavailable/.test(e.message),
  );
});

test("requests without a client share one upstream budget", async () => {
  const { urls, service } = setup({ Cached: { price: 1 } });
  await service.prices(["Cached"]);
  for (let i = 1; i < 60; i++) await service.prices([`Item ${i}`]);
  await assert.rejects(
    service.prices(["Item 60"]),
    (e) => e instanceof PriceLookupError && e.status === 429 && e.retryAfter >= 1,
  );
  assert.equal(urls.length, 60);
  assert.deepEqual(await service.prices(["Cached"]), { Cached: 1 });
});

test("101 names are trimmed to 100 in the upstream URL", async () => {
  const { urls, service } = setup({});
  const names = Array.from({ length: 101 }, (_, i) => `Item ${i}`);
  await service.prices([...names, "Item 0"]);
  assert.equal(urls.length, 1);
  const sent = new URL(urls[0]).searchParams.get("name").split("|");
  assert.equal(sent.length, 100);
  assert.ok(!sent.includes("Item 100"));
  assert.match(urls[0], /^https:\/\/api\.weirdgloop\.org\/exchange\/history\/rs\/latest\?name=/);
});

test("an empty list makes no upstream call", async () => {
  const { urls, service } = setup({});
  assert.deepEqual(await service.prices([]), {});
  assert.equal(urls.length, 0);
});

test("a client over its share is throttled with retryAfter", async () => {
  const { service } = setup({ A: { price: 1 } });
  for (let i = 0; i < 30; i++) await service.prices(["A"], "1.2.3.4");
  await assert.rejects(
    service.prices(["A"], "1.2.3.4"),
    (e) => e instanceof PriceLookupError && e.status === 429 && e.retryAfter >= 1,
  );
  await service.prices(["A"], "5.6.7.8");
});
