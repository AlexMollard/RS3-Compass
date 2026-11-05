import test from "node:test";
import assert from "node:assert/strict";
import { get } from "svelte/store";
import { createPlayerSynchronizer } from "../src/lib/playerSync.ts";
import { PlayerFetchError } from "../src/lib/playerClient.ts";
import { createCompassController } from "../src/lib/profileStore.ts";
import {
  platformPlayer,
  availableQuests,
} from "./fixtures/platform-player.mjs";

const target = (name, groupId) => ({
  id: "rs3:" + name.toLowerCase(),
  name,
  kind: "Group Ironman",
  mode: "f2p",
  ...(groupId == null ? {} : { groupId }),
});
const deferred = () => {
  let resolve;
  const promise = new Promise((done) => {
    resolve = done;
  });
  return { promise, resolve };
};
const snapshot = (name, fetchedAt) =>
  platformPlayer({
    name,
    fetchedAt,
    quests: availableQuests([], { name }),
    events: { status: "available", name, events: [] },
  });

test("refreshes coalesce by player, run at most two at once and reuse fresh snapshots", async (t) => {
  let now = 1_000_000;
  const requests = new Map();
  const calls = [];
  const engine = createPlayerSynchronizer({
    now: () => now,
    visible: () => true,
    profile: () => undefined,
    allowed: () => true,
    apply() {},
    fetch: (name) => {
      calls.push(name);
      const job = deferred();
      requests.set(name, job);
      return job.promise;
    },
  });
  t.after(() => engine.destroy());
  const a = engine.refresh(target("Alice"));
  assert.equal(engine.refresh(target("Alice")), a);
  const b = engine.refresh(target("Bob"));
  const c = engine.refresh(target("Carol"));
  assert.deepEqual(calls, ["Alice", "Bob"]);
  assert.equal(get(engine.state)["rs3:carol"].state, "queued");
  requests.get("Alice").resolve(snapshot("Alice", now));
  await a;
  assert.deepEqual(calls, ["Alice", "Bob", "Carol"]);
  requests.get("Bob").resolve(snapshot("Bob", now));
  requests.get("Carol").resolve(snapshot("Carol", now));
  await Promise.all([b, c]);
  await engine.refresh(target("Alice"));
  assert.equal(calls.length, 3);
  assert.match(get(engine.state)["rs3:alice"].message, /cached/);
});

test("hidden views queue work without requests and resume only when visible", async (t) => {
  let visible = false;
  let calls = 0;
  const engine = createPlayerSynchronizer({
    visible: () => visible,
    profile: () => undefined,
    allowed: () => true,
    apply() {},
    fetch: async (name) => {
      calls++;
      return snapshot(name, Date.now());
    },
  });
  t.after(() => engine.destroy());
  const work = engine.refresh(target("Alice"));
  assert.equal(calls, 0);
  assert.equal(get(engine.state)["rs3:alice"].state, "queued");
  visible = true;
  engine.wake();
  await work;
  assert.equal(calls, 1);
});

test("a removed player cannot be revived by a transport that ignores cancellation", async (t) => {
  let allowed = true;
  let applied = 0;
  const late = deferred();
  const engine = createPlayerSynchronizer({
    visible: () => true,
    profile: () => undefined,
    allowed: () => allowed,
    apply() {
      applied++;
    },
    fetch: () => late.promise,
  });
  t.after(() => engine.destroy());
  const work = engine.refresh(target("Alice", 12));
  allowed = false;
  engine.cancel("rs3:alice");
  await work;
  late.resolve(snapshot("Alice", Date.now()));
  await new Promise((done) => setImmediate(done));
  assert.equal(applied, 0);
  assert.equal(get(engine.state)["rs3:alice"], undefined);
});

test("rate limits pause queued players until Retry-After rather than immediately retrying", async (t) => {
  let now = 1_000_000;
  const calls = [];
  const bob = deferred();
  const engine = createPlayerSynchronizer({
    now: () => now,
    visible: () => true,
    profile: () => undefined,
    allowed: () => true,
    apply() {},
    fetch: (name) => {
      calls.push(name);
      if (name === "Alice")
        return Promise.reject(new PlayerFetchError("Busy", 15_000));
      if (name === "Bob") return bob.promise;
      return Promise.resolve(snapshot(name, now));
    },
  });
  t.after(() => engine.destroy());
  const a = engine.refresh(target("Alice"));
  const b = engine.refresh(target("Bob"));
  const c = engine.refresh(target("Carol"));
  await a;
  assert.deepEqual(calls, ["Alice", "Bob"]);
  assert.equal(get(engine.state)["rs3:alice"].nextRefreshAt, now + 15_000);
  now += 15_000;
  engine.wake();
  await c;
  bob.resolve(snapshot("Bob", now));
  await b;
  assert.deepEqual(calls, ["Alice", "Bob", "Carol"]);
});

test("refreshing another player preserves selection, local plans and separate quest completion", async (t) => {
  const controller = createCompassController();
  t.after(() => controller.destroy());
  controller.addPlayer(snapshot("Alice", 1000), "Group Ironman", "members");
  controller.updateProfile((p) => ({
    ...p,
    levels: { ...p.levels, Cooking: 71 },
    completedQuests: ["dragon-slayer"],
    completedTasks: ["train-Smithing"],
    trainingRanges: { Mining: 30 },
    activeTask: "train-Mining",
    notes: { quest: "Keep this" },
    packed: ["quest::rope"],
    trainingMethods: { Mining: "iron" },
  }));
  controller.addPlayer(snapshot("Bob", 1000), "Solo Ironman", "f2p");
  const before = structuredClone(get(controller.state));
  const fetched = platformPlayer({
    ...snapshot("Alice", Date.now()),
    levels: { Mining: 60 },
    quests: availableQuests(["Cook's Assistant"], { name: "Alice" }),
  });
  t.mock.method(
    globalThis,
    "fetch",
    async () =>
      new Response(JSON.stringify(fetched), {
        headers: { "content-type": "application/json" },
      }),
  );
  await controller.refreshPlayers(["rs3:alice"]);
  const after = get(controller.state);
  assert.equal(after.activeId, "rs3:bob");
  assert.deepEqual(
    after.profiles.find((p) => p.id === "rs3:bob"),
    before.profiles.find((p) => p.id === "rs3:bob"),
  );
  const alice = after.profiles.find((p) => p.id === "rs3:alice");
  assert.equal(alice.levels.Mining, 60);
  assert.equal(alice.levels.Cooking, 71);
  const previousAlice = before.profiles.find((p) => p.id === alice.id);
  for (const field of [
    "notes",
    "packed",
    "trainingMethods",
    "trainingRanges",
    "activeTask",
    "completedTasks",
    "kind",
    "mode",
  ])
    assert.deepEqual(alice[field], previousAlice[field], field);
  assert.ok(alice.completedQuests.includes("dragon-slayer"));
  assert.ok(alice.completedQuests.includes("cooks-assistant"));
  assert.ok(
    !after.profiles
      .find((p) => p.id === "rs3:bob")
      .completedQuests.includes("cooks-assistant"),
  );
});

test("failed public refreshes leave successful snapshots and planning state intact", async (t) => {
  const controller = createCompassController();
  t.after(() => controller.destroy());
  controller.addPlayer(snapshot("Alice", 1000), "Solo Ironman", "f2p");
  const before = structuredClone(get(controller.state));
  t.mock.method(globalThis, "fetch", async () => {
    throw new Error("Offline");
  });
  await controller.refreshPlayers();
  assert.deepEqual(get(controller.state), before);
  assert.equal(get(controller.syncState)["rs3:alice"].state, "error");
});

test("removing a group cancels pending new members but keeps existing players", async (t) => {
  const controller = createCompassController();
  t.after(() => controller.destroy());
  controller.saveGroup({
    id: 12,
    name: "Example",
    size: 2,
    isCompetitive: false,
    founder: false,
    totalLevel: 10,
    totalXp: 0,
    members: [{ name: "Alice" }, { name: "Bob" }],
    fetchedAt: 1000,
  });
  const existing = structuredClone(get(controller.state).profiles);
  const pending = [];
  t.mock.method(globalThis, "fetch", () => {
    const job = deferred();
    pending.push(job);
    return job.promise;
  });
  const work = controller.importGroupMembers(12);
  controller.removeGroup(12);
  await work;
  for (const job of pending)
    job.resolve(new Response(JSON.stringify(snapshot("Alice", Date.now()))));
  await new Promise((done) => setImmediate(done));
  assert.deepEqual(get(controller.state).profiles, existing);
  assert.deepEqual(get(controller.state).groups, []);
});

test("leaving an automatic scope withdraws queued work but preserves other scopes and explicit refreshes", async (t) => {
  let visible = true;
  const calls = [];
  const pending = new Map();
  const engine = createPlayerSynchronizer({
    visible: () => visible,
    profile: () => undefined,
    allowed: () => true,
    apply() {},
    fetch: (name) => {
      calls.push(name);
      const job = deferred();
      pending.set(name, job);
      return job.promise;
    },
  });
  t.after(() => engine.destroy());
  const a = engine.refresh(target("Alice"), true, "old-view");
  const b = engine.refresh(target("Bob"), true, "old-view");
  const obsolete = engine.refresh(target("Carol"), true, "old-view");
  const shared = engine.refresh(target("Dora"), true, "old-view");
  engine.refresh(target("Dora"), true, "current-view");
  const manual = engine.refresh(target("Eve"));
  visible = false;
  engine.cancelScope("old-view");
  pending.get("Alice").resolve(snapshot("Alice", Date.now()));
  pending.get("Bob").resolve(snapshot("Bob", Date.now()));
  await Promise.all([a, b, obsolete]);
  assert.deepEqual(calls, ["Alice", "Bob"]);
  visible = true;
  engine.wake();
  assert.deepEqual(calls, ["Alice", "Bob", "Dora", "Eve"]);
  pending.get("Dora").resolve(snapshot("Dora", Date.now()));
  pending.get("Eve").resolve(snapshot("Eve", Date.now()));
  await Promise.all([shared, manual]);
  assert.equal(get(engine.state)["rs3:carol"], undefined);
});

test("a successful automatic refresh does not rewrite the remembered-player cookie", async (t) => {
  const oldDocument = Object.getOwnPropertyDescriptor(globalThis, "document");
  const oldLocation = Object.getOwnPropertyDescriptor(globalThis, "location");
  let cookie = "";
  const writes = [];
  Object.defineProperty(globalThis, "document", {
    configurable: true,
    value: {
      get cookie() {
        return cookie;
      },
      set cookie(value) {
        writes.push(value);
        cookie = value;
      },
    },
  });
  Object.defineProperty(globalThis, "location", {
    configurable: true,
    value: { protocol: "https:" },
  });
  t.after(() => {
    if (oldDocument) Object.defineProperty(globalThis, "document", oldDocument);
    else delete globalThis.document;
    if (oldLocation) Object.defineProperty(globalThis, "location", oldLocation);
    else delete globalThis.location;
  });
  const controller = createCompassController();
  t.after(() => controller.destroy());
  controller.addPlayer(snapshot("Alice", 1000), "Solo Ironman", "f2p");
  const before = cookie;
  const count = writes.length;
  t.mock.method(
    globalThis,
    "fetch",
    async () => new Response(JSON.stringify(snapshot("Alice", Date.now()))),
  );
  await controller.refreshPlayers(["rs3:alice"]);
  assert.equal(cookie, before);
  assert.equal(writes.length, count);
});

test("explicit lookup of an older cached snapshot selects the player without reverting newer data", () => {
  const controller = createCompassController();
  controller.addPlayer(
    { ...snapshot("Alice", 5000), levels: { Mining: 60 } },
    "Solo Ironman",
    "f2p",
  );
  const alice = structuredClone(
    get(controller.state).profiles.find((p) => p.id === "rs3:alice"),
  );
  controller.addPlayer(snapshot("Bob", 6000), "Solo Ironman", "f2p");
  controller.addPlayer(
    { ...snapshot("Alice", 4000), levels: { Mining: 1 } },
    "Solo Ironman",
    "members",
  );
  assert.equal(get(controller.state).activeId, "rs3:alice");
  assert.deepEqual(
    get(controller.state).profiles.find((p) => p.id === "rs3:alice"),
    alice,
  );
  controller.destroy();
});

test("missing Hiscores preserve published levels separately from manual edits while new quest data imports", () => {
  const controller = createCompassController();
  controller.addPlayer(
    {
      ...snapshot("Alice", 1000),
      levels: { Mining: 50 },
      statistics: {
        overall: { xp: 10000 },
        skills: { Mining: { xp: 1234 } },
        activities: [],
      },
    },
    "Group Ironman",
    "f2p",
  );
  const before = structuredClone(
    get(controller.state).profiles.find((p) => p.id === "rs3:alice"),
  );
  controller.updateProfile((p) => ({
    ...p,
    levels: { Mining: 99 },
    notes: { quest: "Keep this" },
  }));
  controller.addPlayer(
    {
      ...snapshot("Alice", 2000),
      hiscoresImportStatus: "unranked-or-unavailable",
      levels: {},
      statistics: { overall: {}, skills: {}, activities: [] },
      quests: availableQuests([], { name: "Alice", questPoints: 8 }),
    },
    "Solo Ironman",
    "members",
    { select: false },
  );
  const after = get(controller.state).profiles.find(
    (p) => p.id === "rs3:alice",
  );
  assert.equal(after.levels.Mining, 99);
  assert.deepEqual(after.hiscoresLevels, { Mining: 50 });
  assert.deepEqual(after.statistics, before.statistics);
  assert.equal(after.hiscoresFetchedAt, 1000);
  assert.equal(after.publicFetchedAt, 2000);
  assert.equal(after.questProgress.questPoints, 8);
  assert.equal(after.hiscoresImportStatus, "unranked-or-unavailable");
  assert.deepEqual(after.notes, { quest: "Keep this" });
  controller.destroy();
});

test("an unranked player with public quests does not acquire fictional levels or XP", () => {
  const controller = createCompassController();
  controller.addPlayer(
    {
      ...snapshot("Alice", 1000),
      hiscoresImportStatus: "unranked-or-unavailable",
      levels: {},
      statistics: { overall: {}, skills: {}, activities: [] },
    },
    "Group Ironman",
    "f2p",
  );
  const player = get(controller.state).profiles.find(
    (p) => p.id === "rs3:alice",
  );
  assert.deepEqual(player.levels, {});
  assert.equal(player.statistics, undefined);
  assert.equal(player.hiscoresLevels, undefined);
  assert.equal(player.hiscoresFetchedAt, undefined);
  assert.ok(player.questProgress);
  controller.destroy();
});
