import test from "node:test";
import assert from "node:assert/strict";
import { normalizePlayerName } from "../src/lib/playerName.ts";
import {
  createPlayerLookupService,
  parseHiscores,
  PLAYER_CACHE_MS,
} from "../src/lib/server/playerLookup.ts";

const names = [
  "Attack",
  "Defence",
  "Strength",
  "Constitution",
  "Ranged",
  "Prayer",
  "Magic",
  "Cooking",
  "Woodcutting",
  "Fletching",
  "Fishing",
  "Firemaking",
  "Crafting",
  "Smithing",
  "Mining",
  "Herblore",
  "Agility",
  "Thieving",
  "Slayer",
  "Farming",
  "Runecrafting",
  "Hunter",
  "Construction",
  "Summoning",
  "Dungeoneering",
  "Divination",
  "Invention",
  "Archaeology",
  "Necromancy",
];
const rows = () => [
  "50,3232,5709998811",
  ...names.map((_, i) => `${9000 + i},${10 + i},${1000000 + i}`),
  "500,40",
];
const response = () => new Response(rows().join("\r\n"));
const withQuests = (hiscores) => (url, options) =>
  url.hostname === "apps.runescape.com"
    ? Promise.resolve(
        new Response(
          JSON.stringify({
            quests: [{ title: "Cook's Assistant", status: "NOT_STARTED" }],
          }),
        ),
      )
    : hiscores(url, options);

test("Names normalise RuneScape separators without admitting URL or control-character payloads", () => {
  assert.equal(normalizePlayerName("  Iron__Name  "), "Iron Name");
  assert.equal(normalizePlayerName("Abcdefghijkl"), "Abcdefghijkl");
  for (const value of [
    "",
    "Abcdefghijklm",
    "name&player=x",
    "name\r\nHost:x",
    "https://x",
    null,
  ])
    assert.throws(() => normalizePlayerName(value));
});

test("Hiscores levels map to all current RS3 skills, not rank, XP, Overall or activity rows", () => {
  const player = parseHiscores(rows().join("\r\n"), "Example", 1234);
  assert.deepEqual(player, {
    name: "Example",
    fetchedAt: 1234,
    levels: Object.fromEntries(names.map((name, i) => [name, i + 10])),
  });
});

test("Unranked skills stay unknown, while published level one is retained", () => {
  const input = rows();
  input[1] = "-1,-1,-1";
  input[2] = "-1,0,0";
  input[3] = "-1,1,0";
  const { levels } = parseHiscores(input.join("\n"), "Example", 0);
  assert.equal("Attack" in levels, false);
  assert.equal("Defence" in levels, false);
  assert.equal(levels.Strength, 1);
  assert.equal(levels.Necromancy, 38);
});

test("Incomplete, HTML and out-of-bound upstream responses cannot become saved player data", () => {
  const invalid = rows();
  invalid[15] = "3,121,42";
  for (const input of [
    "<html>Unavailable</html>",
    rows().slice(0, 12).join("\n"),
    invalid.join("\n"),
  ])
    assert.throws(
      () => parseHiscores(input, "Example", 0),
      (error) => error.status === 502,
    );
});

test("Concurrent case/separator aliases share one combined lookup, cache valid data, then refresh after expiry", async () => {
  let clock = 1000,
    calls = 0,
    release;
  const gate = new Promise((resolve) => (release = resolve));
  const service = createPlayerLookupService(
    withQuests(async () => {
      calls++;
      await gate;
      return response();
    }),
    () => clock,
  );
  const first = service.lookup("Iron_Name"),
    second = service.lookup("iron name");
  release();
  assert.deepEqual(await first, await second);
  assert.equal(calls, 1);
  await service.lookup("IRON NAME");
  assert.equal(calls, 1);
  clock += PLAYER_CACHE_MS + 1;
  const refreshed = await service.lookup("Iron Name");
  assert.equal(calls, 2);
  assert.equal(refreshed.fetchedAt, clock);
});

test("A transient rejection releases single-flight state so the next attempt can recover", async () => {
  let calls = 0;
  const service = createPlayerLookupService(
    withQuests(() => {
      if (++calls === 1) throw new Error("Network down");
      return Promise.resolve(response());
    }),
  );
  await assert.rejects(
    service.lookup("Example"),
    (error) => error.status === 502,
  );
  assert.equal((await service.lookup("Example")).levels.Mining, 24);
  assert.equal(calls, 2);
});

test("Not-found results are short-cached without blocking recovery after expiry", async () => {
  let clock = 0,
    calls = 0;
  const service = createPlayerLookupService(
    withQuests(async () =>
      ++calls === 1 ? new Response("Not found", { status: 404 }) : response(),
    ),
    () => clock,
  );
  await assert.rejects(
    service.lookup("Unranked"),
    (error) => error.status === 404,
  );
  await assert.rejects(
    service.lookup("unranked"),
    (error) => error.status === 404,
  );
  assert.equal(calls, 1);
  clock += 31_000;
  assert.equal((await service.lookup("Unranked")).levels.Attack, 10);
  assert.equal(calls, 2);
});

test("Upstream concurrency is bounded while identical pending names can still join", async () => {
  let release,
    calls = 0;
  const gate = new Promise((resolve) => (release = resolve));
  const service = createPlayerLookupService(
    withQuests(async () => {
      calls++;
      await gate;
      return response();
    }),
  );
  const pending = Array.from({ length: 8 }, (_, i) =>
    service.lookup("Player " + i),
  );
  await assert.rejects(
    service.lookup("Extra"),
    (error) => error.status === 429,
  );
  const joined = service.lookup("player 0");
  release();
  await Promise.all([...pending, joined]);
  assert.equal(calls, 8);
});

test("The per-minute miss budget protects the upstream without rejecting cached lookups", async () => {
  let clock = 0,
    calls = 0;
  const service = createPlayerLookupService(
    withQuests(async () => {
      calls++;
      return response();
    }),
    () => clock,
  );
  for (let i = 0; i < 60; i++) await service.lookup("Player " + i);
  await assert.rejects(
    service.lookup("Over budget"),
    (error) => error.status === 429,
  );
  await service.lookup("Player 0");
  assert.equal(calls, 60);
  clock = 60_001;
  await service.lookup("Over budget");
  assert.equal(calls, 61);
});

test("The bounded player cache retains a hot entry while evicting the least recently used account", async () => {
  let clock = 0;
  const calls = new Map();
  const service = createPlayerLookupService(
    withQuests(async (url) => {
      const name = url.searchParams.get("player");
      calls.set(name, (calls.get(name) ?? 0) + 1);
      return response();
    }),
    () => clock,
  );
  for (let index = 0; index < 128; index++) {
    if (index > 0 && index % 50 === 0) clock += 60_001;
    await service.lookup("Cached " + index);
  }
  await service.lookup("Cached 0");
  await service.lookup("Cached 128");
  await service.lookup("Cached 0");
  await service.lookup("Cached 1");
  assert.equal(calls.get("Cached 0"), 1);
  assert.equal(calls.get("Cached 1"), 2);
});
