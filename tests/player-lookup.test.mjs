import test from "node:test";
import assert from "node:assert/strict";
import {
  createPlayerLookupService,
  parseHiscores,
  PLAYER_CACHE_MS,
} from "../src/lib/server/playerLookup.ts";
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

test("concurrent aliases share all three requests and ten minute cache", async () => {
  let time = 1000;
  const calls = [];
  const service = createPlayerLookupService(fetchAll(calls), () => time);
  const [a, b] = await Promise.all([
    service.lookup("Example_Name"),
    service.lookup("example name"),
  ]);
  assert.strictEqual(a, b);
  assert.equal(calls.length, 3);
  time += PLAYER_CACHE_MS - 1;
  await service.lookup("example name");
  assert.equal(calls.length, 3);
  time++;
  await service.lookup("example name");
  assert.equal(calls.length, 6);
});

test("not-found caching skips auxiliary requests but recovers when a public entry becomes available", async () => {
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
  assert.equal(calls.length, 1);
  time = 30_000;
  assert.equal((await service.lookup("Example")).levels.Mining, 50);
  assert.equal(calls.length, 4);
});

test("budget counts actual calls, allows hits, and avoids reserving unsent requests", async () => {
  let time = 0;
  const calls = [];
  const service = createPlayerLookupService(fetchAll(calls), () => time);
  for (let i = 0; i < 20; i++) await service.lookup("Player " + i);
  assert.equal(calls.length, 60);
  await service.lookup("Player 0");
  assert.equal(calls.length, 60);
  await assert.rejects(service.lookup("Player 20"), { status: 429 });
  assert.equal(calls.length, 60);
  time = 60000;
  await service.lookup("Player 20");
  assert.equal(calls.length, 63);
});

test("partial response at budget boundary keeps levels and retries after short cache", async () => {
  let time = 0;
  let calls = 0;
  const service = createPlayerLookupService(
    async (url) => {
      calls++;
      if (url.pathname.includes("index_lite"))
        return url.searchParams.get("player").startsWith("Missing")
          ? new Response(null, { status: 404 })
          : json(payload());
      return auxiliary(url);
    },
    () => time,
  );
  for (let i = 0; i < 58; i++)
    await assert.rejects(service.lookup("Missing " + i), { status: 404 });
  const result = await service.lookup("Example");
  assert.equal(calls, 60);
  assert.equal(result.levels.Mining, 50);
  assert.equal(result.quests.status, "available");
  assert.deepEqual(result.events, {
    status: "unavailable",
    reason: "service-unavailable",
  });
  time = 60000;
  const refreshed = await service.lookup("Example");
  assert.equal(refreshed.events.status, "available");
  assert.equal(calls, 63);
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
    return auxiliary(url);
  });
  const pending = Array.from({ length: 8 }, (_, i) =>
    service.lookup("Player " + i).catch((e) => e),
  );
  const alias = service.lookup("PLAYER 0").catch((e) => e);
  await assert.rejects(service.lookup("Player 9"), { status: 429 });
  release();
  await Promise.all([...pending, alias]);
  assert.equal(calls, 8);
  fail = false;
  assert.equal((await service.lookup("Player 0")).levels.Mining, 50);
  assert.equal(calls, 11);
});

test("LRU eviction preserves recently used entries", async () => {
  let time = 0;
  const calls = [];
  const service = createPlayerLookupService(fetchAll(calls), () => time);
  // Move time so rate window resets without expiring the positive cache.
  for (let i = 0; i < 128; i++) {
    if (i % 20 === 0) time += 60000;
    await service.lookup("Player " + i);
  }
  await service.lookup("Player 0");
  time += 60000;
  await service.lookup("Player 128");
  const before = calls.length;
  await service.lookup("Player 0");
  assert.equal(calls.length, before);
  await service.lookup("Player 1");
  assert.equal(calls.length, before + 3);
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
  assert.equal(calls.length, 3);
  time++;
  assert.equal((await service.lookup("Example")).events.status, "available");
  assert.equal(calls.length, 6);
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
  for (let index = 0; index < 40; index++)
    await assert.rejects(service.lookup("Absent " + index), { status: 404 });
  time = 59_000;
  for (let index = 40; index < 60; index++)
    await assert.rejects(service.lookup("Absent " + index), { status: 404 });
  time = 60_000;
  for (let index = 60; index < 100; index++)
    await assert.rejects(service.lookup("Absent " + index), { status: 404 });
  await assert.rejects(service.lookup("Absent 100"), { status: 429 });
  assert.equal(calls, 100);
  await assert.rejects(service.lookup("Absent 40"), { status: 404 });
  assert.equal(calls, 100);
  time = 119_000;
  await assert.rejects(service.lookup("Absent 100"), { status: 404 });
  assert.equal(calls, 101);
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
