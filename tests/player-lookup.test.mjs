import test from "node:test";
import assert from "node:assert/strict";
import {
  createPlayerLookupService,
  parseHiscores,
  playerCacheMs,
  PLAYER_CACHE_MS,
  PLAYER_PARTIAL_CACHE_MS,
} from "../src/lib/server/playerLookup.ts";
import { createClientLimiter } from "../src/lib/server/rateLimit.ts";
import { normalizePlayerName } from "../src/lib/playerName.ts";
import { RS3_SKILL_NAMES } from "../src/skillNames.ts";

const payload = (name = "Example") => ({
  name,
  skills: [
    { name: "Overall", rank: 2, level: 2000, xp: 5000000000 },
    ...RS3_SKILL_NAMES.map((name) => ({
      name:
        name === "Constitution"
          ? "Hitpoints"
          : name === "Runecrafting"
            ? "Runecraft"
            : name,
      rank: 10,
      level: 50,
      xp: 100,
    })),
  ],
  activities: [{ id: 999, name: "RuneScore", rank: 4, score: 0 }],
});
const json = (value, status = 200) =>
  new Response(JSON.stringify(value), { status });
const auxiliary = (url) => {
  const name = decodeURIComponent(url.pathname.split("/").at(-1));
  return url.pathname.includes("playerQuests")
    ? json({ name, qp: 0, qp_max: 500, quests: {} })
    : json({ name, events: [] });
};
const fetchAll = (calls) => async (url) => {
  calls.push(url.toString());
  return url.pathname.includes("index_lite")
    ? json(payload(url.searchParams.get("player")))
    : auxiliary(url);
};

test("names normalize RuneScape separators while rejecting URL, control and length payloads", () => {
  assert.equal(normalizePlayerName("  Iron__Name  "), "Iron Name");
  assert.equal(normalizePlayerName("Abcdefghijkl"), "Abcdefghijkl");
  for (const value of [
    "",
    "Abcdefghijklm",
    "name&player=x",
    "name\r\nHost:x",
    "https://x",
    "../bad",
    null,
  ])
    assert.throws(() => normalizePlayerName(value));
});

test("named shuffled skills and activities preserve unknowns and zeroes", () => {
  const data = payload();
  data.skills.reverse();
  const attack = data.skills.find((s) => s.name === "Attack");
  attack.level = 0;
  attack.rank = -1;
  attack.xp = 0;
  const mining = data.skills.find((s) => s.name === "Mining");
  mining.level = -1;
  mining.xp = -1;
  data.activities.push({
    id: 0,
    name: "Clue Scrolls (easy)",
    rank: -1,
    score: -1,
  });
  const result = parseHiscores(data, "Example", 1);
  assert.equal(result.levels.Attack, undefined);
  assert.equal(result.levels.Mining, undefined);
  assert.deepEqual(result.statistics.skills.Attack, { xp: 0 });
  assert.deepEqual(result.statistics.skills.Mining, { rank: 10 });
  assert.deepEqual(result.statistics.overall, {
    level: 2000,
    xp: 5000000000,
    rank: 2,
  });
  assert.equal(result.levels.Overall, undefined);
  assert.deepEqual(result.statistics.activities, [
    { name: "RuneScore", rank: 4, score: 0 },
    { name: "Clue Scrolls (easy)" },
  ]);
});

test("missing, duplicate, invalid and malformed skill responses fail closed", () => {
  for (const mutate of [
    (d) => d.skills.pop(),
    (d) => d.skills.push(d.skills[0]),
    (d) => {
      d.skills[1].rank = 0;
    },
    (d) => {
      d.skills[1].level = 121;
    },
    (d) => {
      d.activities[0].score = -2;
    },
  ]) {
    const data = payload();
    mutate(data);
    assert.throws(() => parseHiscores(data, "Example", 1));
  }
  assert.throws(() => parseHiscores("<html>", "Example", 1));
});

test("concurrent aliases share every request and ten minute cache", async () => {
  let time = 1000;
  const calls = [];
  const service = createPlayerLookupService(fetchAll(calls), () => time);
  const [a, b] = await Promise.all([
    service.lookup("Example_Name"),
    service.lookup("example name"),
  ]);
  assert.strictEqual(a, b);
  assert.equal(calls.length, 4);
  time += PLAYER_CACHE_MS - 1;
  await service.lookup("example name");
  assert.equal(calls.length, 4);
  time++;
  await service.lookup("example name");
  assert.equal(calls.length, 8);
});

test("all-source not-found caching recovers when public data becomes available", async () => {
  let time = 0,
    found = false;
  const calls = [];
  const success = fetchAll(calls);
  const service = createPlayerLookupService(
    async (url) => {
      if (found) return success(url);
      calls.push(url.toString());
      return new Response(null, { status: 404 });
    },
    () => time,
  );
  await assert.rejects(service.lookup("Example"), { status: 404 });
  found = true;
  time = 29_999;
  await assert.rejects(service.lookup("example"), { status: 404 });
  assert.equal(calls.length, 3);
  time = 30_000;
  assert.equal((await service.lookup("Example")).levels.Mining, 50);
  assert.equal(calls.length, 7);
});

test("unranked Hiscores retain matching public quests and events for the normal cache", async () => {
  let time = 0;
  let calls = 0;
  const service = createPlayerLookupService(
    async (url) => {
      calls++;
      if (url.pathname.includes("index_lite"))
        return new Response(null, { status: 404 });
      if (url.pathname.includes("playerQuests"))
        return json({
          name: "ExAmPlE",
          qp: 1,
          qp_max: 10,
          quests: {
            1: {
              title: "Quest",
              eligible: true,
              members: false,
              difficulty: 0,
              qp: 1,
              status: "COMPLETED",
            },
          },
        });
      return json({ name: "Example", events: [] });
    },
    () => time,
  );
  const result = await service.lookup("example");
  assert.equal(result.name, "ExAmPlE");
  assert.equal(result.hiscoresImportStatus, "unranked-or-unavailable");
  assert.deepEqual(result.levels, {});
  assert.deepEqual(result.statistics, {
    overall: {},
    skills: {},
    activities: [],
  });
  assert.equal(result.quests.records[0].title, "Quest");
  assert.equal(result.events.status, "available");
  time = PLAYER_CACHE_MS - 1;
  await service.lookup("Example");
  assert.equal(calls, 3);
  time++;
  await service.lookup("Example");
  assert.equal(calls, 6);
});

test("transient Hiscores failure keeps auxiliary data and retries after 30 seconds", async () => {
  let time = 0;
  let calls = 0;
  let recovered = false;
  const service = createPlayerLookupService(
    async (url) => {
      calls++;
      if (url.pathname.includes("index_lite"))
        return recovered ? json(payload("Example")) : json({ broken: true });
      return auxiliary(url);
    },
    () => time,
  );
  const partial = await service.lookup("Example");
  assert.equal(partial.hiscoresImportStatus, "service-unavailable");
  assert.deepEqual(partial.levels, {});
  assert.equal(partial.quests.status, "available");
  assert.equal(partial.events.status, "available");
  recovered = true;
  time = 29_999;
  await service.lookup("Example");
  assert.equal(calls, 3);
  time++;
  const full = await service.lookup("Example");
  assert.equal(full.hiscoresImportStatus, "available");
  assert.equal(full.levels.Mining, 50);
  assert.equal(calls, 7);
});

test("failed auxiliary sources retain Hiscores and mismatched identities cannot supply a profile", async () => {
  const service = createPlayerLookupService(async (url) => {
    if (url.pathname.includes("index_lite")) return json(payload("Example"));
    if (url.pathname.includes("playerQuests"))
      return json({ name: "Someone Else", qp: 0, qp_max: 0, quests: {} });
    return new Response(null, { status: 503 });
  });
  const result = await service.lookup("Example");
  assert.equal(result.name, "Example");
  assert.equal(result.hiscoresImportStatus, "available");
  assert.equal(result.levels.Mining, 50);
  assert.equal(result.quests.reason, "service-unavailable");
  assert.equal(result.events.reason, "service-unavailable");
  const noMatchingSource = createPlayerLookupService(async (url) =>
    url.pathname.includes("index_lite")
      ? new Response(null, { status: 404 })
      : json({
          name: "Someone Else",
          qp: 0,
          qp_max: 0,
          quests: {},
          events: [],
        }),
  );
  await assert.rejects(noMatchingSource.lookup("Example"), { status: 502 });
});

test("budget counts actual calls, allows hits, and avoids reserving unsent requests", async () => {
  let time = 0;
  const calls = [];
  const service = createPlayerLookupService(fetchAll(calls), () => time);
  for (let i = 0; i < 15; i++) await service.lookup("Player " + i);
  assert.equal(calls.length, 60);
  await service.lookup("Player 0");
  assert.equal(calls.length, 60);
  await assert.rejects(service.lookup("Player 15"), { status: 429 });
  assert.equal(calls.length, 60);
  time = 60000;
  await service.lookup("Player 15");
  assert.equal(calls.length, 64);
});

test("one client's share cannot drain the shared budget, and 429s carry the real wait", async () => {
  let time = 0;
  const calls = [];
  const service = createPlayerLookupService(fetchAll(calls), () => time);
  for (let i = 0; i < 6; i++) await service.lookup("Player " + i, "1.1.1.1");
  await service.lookup("Player 0", "1.1.1.1");
  assert.equal(calls.length, 24);
  time = 10_000;
  await assert.rejects(service.lookup("Player 6", "1.1.1.1"), {
    status: 429,
    retryAfter: 50,
  });
  assert.equal(calls.length, 24);
  await service.lookup("Player 6", "2.2.2.2");
  for (let i = 7; i < 15; i++) await service.lookup("Player " + i);
  assert.equal(calls.length, 60);
  await assert.rejects(service.lookup("Player 15"), {
    status: 429,
    retryAfter: 50,
  });
});

test("the per-client limiter forgets the least recently seen clients past its cap", () => {
  const take = createClientLimiter(1);
  assert.equal(take("a", 0), undefined);
  assert.equal(take("a", 1000), 59);
  for (let i = 0; i < 1024; i++) take("client " + i, 1000);
  assert.equal(take("a", 1000), undefined);
});

test("partial response at budget boundary keeps available data and retries after short cache", async () => {
  let time = 0;
  let calls = 0;
  const service = createPlayerLookupService(
    async (url) => {
      calls++;
      if (calls === 2) time = 1;
      return url.pathname.includes("index_lite")
        ? json(payload(url.searchParams.get("player")))
        : auxiliary(url);
    },
    () => time,
  );
  for (let i = 0; i < 15; i++) await service.lookup("Player " + i);
  time = 60_000;
  const result = await service.lookup("Example");
  assert.equal(calls, 62);
  assert.equal(result.levels.Mining, 50);
  assert.equal(result.quests.status, "available");
  assert.deepEqual(result.events, {
    status: "unavailable",
    reason: "service-unavailable",
  });
  time = 90_000;
  const refreshed = await service.lookup("Example");
  assert.equal(refreshed.events.status, "available");
  assert.equal(calls, 66);
});

test("bounded concurrency joins pending aliases and releases after failure", async () => {
  let release,
    fail = true,
    calls = 0;
  const gate = new Promise((resolve) => {
    release = resolve;
  });
  const service = createPlayerLookupService(async (url) => {
    calls++;
    if (url.pathname.includes("index_lite")) {
      await gate;
      if (fail) return new Response(null, { status: 503 });
      return json(payload(url.searchParams.get("player")));
    }
    return fail ? new Response(null, { status: 503 }) : auxiliary(url);
  });
  const pending = Array.from({ length: 8 }, (_, i) =>
    service.lookup("Player " + i).catch((e) => e),
  );
  const alias = service.lookup("PLAYER 0").catch((e) => e);
  await assert.rejects(service.lookup("Player 9"), { status: 429 });
  release();
  await Promise.all([...pending, alias]);
  assert.equal(calls, 24);
  fail = false;
  assert.equal((await service.lookup("Player 0")).levels.Mining, 50);
  assert.equal(calls, 28);
});

test("LRU eviction preserves recently used entries", async () => {
  let time = 0;
  const calls = [];
  const service = createPlayerLookupService(fetchAll(calls), () => time);
  // Move time so rate window resets without expiring the positive cache.
  for (let i = 0; i < 128; i++) {
    if (i % 15 === 0) time += 60000;
    await service.lookup("Player " + i);
  }
  await service.lookup("Player 0");
  time += 60000;
  await service.lookup("Player 128");
  const before = calls.length;
  await service.lookup("Player 0");
  assert.equal(calls.length, before);
  await service.lookup("Player 1");
  assert.equal(calls.length, before + 4);
});

test("known nonmember events use the normal cache without hiding a later membership change", async () => {
  let time = 0,
    member = false;
  const calls = [];
  const success = fetchAll(calls);
  const service = createPlayerLookupService(
    async (url) => {
      if (!member && url.pathname.includes("playerEvents")) {
        calls.push(url.toString());
        return json({ error: "PLAYER_NOT_MEMBER" }, 403);
      }
      return success(url);
    },
    () => time,
  );
  assert.equal((await service.lookup("Example")).events.reason, "not-member");
  member = true;
  time = PLAYER_CACHE_MS - 1;
  assert.equal((await service.lookup("example")).events.reason, "not-member");
  assert.equal(calls.length, 4);
  time++;
  assert.equal((await service.lookup("Example")).events.status, "available");
  assert.equal(calls.length, 8);
});

test("the rolling request budget expires old calls without forgetting more recent traffic", async () => {
  let time = 0,
    calls = 0;
  const service = createPlayerLookupService(
    async () => {
      calls++;
      return new Response(null, { status: 404 });
    },
    () => time,
  );
  for (let index = 0; index < 10; index++)
    await assert.rejects(service.lookup("Absent " + index), { status: 404 });
  time = 59_000;
  for (let index = 10; index < 20; index++)
    await assert.rejects(service.lookup("Absent " + index), { status: 404 });
  time = 60_000;
  for (let index = 20; index < 30; index++)
    await assert.rejects(service.lookup("Absent " + index), { status: 404 });
  await assert.rejects(service.lookup("Absent 30"), { status: 429 });
  assert.equal(calls, 90);
  await assert.rejects(service.lookup("Absent 10"), { status: 404 });
  assert.equal(calls, 90);
  time = 119_000;
  await assert.rejects(service.lookup("Absent 30"), { status: 404 });
  assert.equal(calls, 93);
});

test("Jagex wire names import Constitution and Runecrafting without relying on row position", () => {
  const data = payload();
  Object.assign(
    data.skills.find((skill) => skill.name === "Hitpoints"),
    { level: 99, xp: 200000000, rank: 311 },
  );
  Object.assign(
    data.skills.find((skill) => skill.name === "Runecraft"),
    { level: 110, xp: 200000000, rank: 147 },
  );
  data.skills.reverse();
  const player = parseHiscores(data, "Example", 1234);
  assert.equal(player.levels.Constitution, 99);
  assert.equal(player.levels.Runecrafting, 110);
  assert.equal(player.levels.Hitpoints, undefined);
  assert.equal(player.levels.Runecraft, undefined);
  assert.deepEqual(player.statistics.skills.Constitution, {
    xp: 200000000,
    rank: 311,
  });
  assert.deepEqual(player.statistics.skills.Runecrafting, {
    xp: 200000000,
    rank: 147,
  });
});

test("the Ironman Hiscores decide whether a ranked player is an Ironman", async () => {
  const lookup = async (ironmanStatus, mainRanked = true) => {
    const calls = [];
    const service = createPlayerLookupService(async (url) => {
      calls.push(url.pathname);
      if (url.pathname.startsWith("/m=hiscore_ironman/"))
        return ironmanStatus === 200
          ? json(payload("Example"))
          : new Response(null, { status: ironmanStatus });
      if (url.pathname.includes("index_lite"))
        return mainRanked
          ? json(payload("Example"))
          : new Response(null, { status: 404 });
      return auxiliary(url);
    });
    const result = await service.lookup("Example");
    return { ironman: result.ironman, calls };
  };
  assert.equal((await lookup(200)).ironman, true);
  assert.equal((await lookup(404)).ironman, false);
  const failed = await lookup(503);
  assert.equal(failed.ironman, undefined);
  assert.equal(failed.calls.length, 4);
  const unranked = await lookup(200, false);
  assert.equal(unranked.ironman, undefined);
  assert.ok(!unranked.calls.some((path) => path.startsWith("/m=hiscore_ironman/")));
});

test("only a temporary source failure shortens the player cache", () => {
  const ok = { status: "available" };
  const down = { status: "unavailable", reason: "service-unavailable" };
  const hidden = { status: "unavailable", reason: "private-or-unavailable" };
  const player = (hiscoresImportStatus, quests, events) => ({
    hiscoresImportStatus,
    quests,
    events,
  });
  assert.equal(playerCacheMs(player("available", ok, ok)), PLAYER_CACHE_MS);
  assert.equal(playerCacheMs(player("not-found", hidden, hidden)), PLAYER_CACHE_MS);
  for (const transient of [
    player("service-unavailable", ok, ok),
    player("available", down, ok),
    player("available", ok, down),
  ])
    assert.equal(playerCacheMs(transient), PLAYER_PARTIAL_CACHE_MS);
});

test("non-breaking spaces in names normalize to ordinary spaces", () => {
  assert.equal(normalizePlayerName("GIM Invoker"), "GIM Invoker");
  assert.equal(normalizePlayerName(" Iron  Name "), "Iron Name");
});
