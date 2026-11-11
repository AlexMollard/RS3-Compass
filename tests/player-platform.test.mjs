import test from "node:test";
import assert from "node:assert/strict";
import { get } from "svelte/store";
import { createCompassController } from "../src/lib/profileStore.ts";
import { fetchPlayer } from "../src/lib/playerClient.ts";
import { isPlayerLookup } from "../src/lib/playerData.ts";
import { findPlayerQuest } from "../src/lib/playerProgress.ts";
import { QUESTS } from "../src/data.ts";
import {
  availableQuests,
  platformPlayer,
} from "./fixtures/platform-player.mjs";

const KEY = "rs3-compass-design-v1";
const current = (controller) => {
  const saved = get(controller.state);
  return saved.profiles.find((profile) => profile.id === saved.activeId);
};
function storageFor(t, saved) {
  const descriptor = Object.getOwnPropertyDescriptor(
    globalThis,
    "localStorage",
  );
  const storage = new Map(saved ? [[KEY, JSON.stringify(saved)]] : []);
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value),
    },
  });
  t.after(() => {
    if (descriptor)
      Object.defineProperty(globalThis, "localStorage", descriptor);
    else delete globalThis.localStorage;
  });
  return storage;
}

test("independent Platform refresh failures preserve last good snapshots and local preparation across reload", (t) => {
  storageFor(t);
  const controller = createCompassController();
  const restored = createCompassController();
  t.after(() => {
    controller.destroy();
    restored.destroy();
  });
  controller.initialize();
  const first = platformPlayer({
    levels: { Mining: 1, Attack: 120 },
    statistics: {
      overall: { level: 3232, xp: 5709998811, rank: 6622 },
      skills: { Mining: { xp: 0 }, Attack: { xp: 200000000, rank: 363 } },
      activities: [{ name: "RuneScore", score: 32265, rank: 5231 }],
    },
    quests: availableQuests(["Cook's Assistant"]),
    events: {
      status: "available",
      name: "Real Player",
      events: [
        {
          type: "rs_plog_quest",
          date: "2026-11-04T15:50:20+01:00",
          text: "Quest complete: Dragon Slayer",
          details: "Quest Complete!",
        },
        {
          type: "rs_plog_levelup_count",
          date: "2026-11-04T15:40:20Z",
          text: "Levelled up Mining.",
          details: "I am now level 100.",
        },
        {
          type: "rs_plog_item_found",
          date: "2026-11-04T15:30:20Z",
          text: "I found a rune platebody",
          details: "A reported find, not proof of current ownership.",
        },
      ],
    },
  });
  controller.addPlayer(first, "Group Ironman", "members");
  assert.deepEqual(current(controller).completedQuests, ["cooks-assistant"]);
  assert.equal(current(controller).levels.Mining, 1);
  assert.deepEqual(current(controller).packed, []);
  controller.updateProfile((profile) => ({
    ...profile,
    completedQuests: [...profile.completedQuests, "dragon-slayer"],
    notes: { "train-Mining": "Bank before leaving" },
    packed: ["dragon-slayer::Anti-dragon shield"],
    activeTask: "train-Mining",
    trainingRanges: { Mining: 30 },
    trainingMethods: { Mining: "mithril" },
  }));
  const before = structuredClone(current(controller));
  const others = structuredClone(
    get(controller.state).profiles.filter((p) => p.id !== before.id),
  );
  controller.addPlayer(
    {
      ...first,
      fetchedAt: 4567,
      levels: { Mining: 2 },
      quests: { status: "unavailable", reason: "service-unavailable" },
      events: { status: "unavailable", reason: "not-member" },
    },
    "Solo Ironman",
    "f2p",
  );
  const after = current(controller);
  assert.deepEqual(after.questProgress, before.questProgress);
  assert.deepEqual(after.eventLog, before.eventLog);
  assert.equal(after.questImportStatus, "service-unavailable");
  assert.equal(after.eventImportStatus, "not-member");
  assert.equal(after.statistics.fetchedAt, 4567);
  assert.equal(after.statistics.skills.Mining.xp, 0);
  assert.equal(after.levels.Attack, 120);
  for (const field of [
    "completedQuests",
    "notes",
    "packed",
    "activeTask",
    "trainingRanges",
    "trainingMethods",
    "kind",
    "mode",
  ])
    assert.deepEqual(after[field], before[field], field);
  assert.deepEqual(
    get(controller.state).profiles.filter((p) => p.id !== before.id),
    others,
  );
  restored.initialize();
  assert.equal(get(restored.storageError), false);
  assert.deepEqual(current(restored), after);
  restored.addPlayer(
    {
      ...first,
      fetchedAt: 5678,
      events: { status: "available", name: first.name, events: [] },
    },
    "Solo Ironman",
    "f2p",
  );
  assert.deepEqual(current(restored).eventLog, { events: [], fetchedAt: 5678 });
  assert.equal(current(restored).eventImportStatus, "available");
  assert.deepEqual(current(restored).notes, before.notes);
});

test("legacy imported players restore without optional Platform snapshots or lost notes", (t) => {
  const seed = createCompassController();
  seed.addPlayer(platformPlayer(), "Solo Ironman", "f2p");
  seed.updateProfile((profile) => ({
    ...profile,
    questImportStatus: "available",
    notes: { cook: "Keep the old save" },
    completedQuests: ["cooks-assistant"],
  }));
  const saved = structuredClone(get(seed.state));
  const legacy = saved.profiles.find((p) => p.id === saved.activeId);
  for (const key of [
    "statistics",
    "questProgress",
    "eventLog",
    "eventImportStatus",
    "hiscoresImportStatus",
    "hiscoresLevels",
    "publicFetchedAt",
  ])
    delete legacy[key];
  const storage = storageFor(t, saved);
  const original = storage.get(KEY);
  const controller = createCompassController();
  t.after(() => controller.destroy());
  controller.initialize();
  assert.equal(get(controller.storageError), false);
  assert.deepEqual(get(controller.state), saved);
  assert.equal(storage.get(KEY), original);
});

test("Jagex miniquest, saga and ellipsis variants match without confusing different quests", () => {
  const profile = {
    questProgress: availableQuests([
      "There's No Place Like Home...",
      "Three's Company",
      "The Knight’s Sword",
    ]),
  };
  for (const [name, expected] of [
    ["There's No Place Like Home (miniquest)", "There's No Place Like Home..."],
    ["Three's Company (saga)", "Three's Company"],
    ["The Knight's Sword", "The Knight’s Sword"],
  ])
    assert.equal(findPlayerQuest(profile, { name }).title, expected);
  assert.equal(
    findPlayerQuest(
      profile,
      QUESTS.find((q) => q.name === "Dragon Slayer"),
    ),
    undefined,
  );
});

test("Jagex titles match Wiki-named catalogue quests and series parts", () => {
  const titles = [
    "Raksha, the Shadow Colossus",
    "Tears of Guthix",
    "Foreshadowing",
    "Flashback",
    "Fortunes",
    "Finale",
    "My One and Only Lute",
    "Flesh and Bone",
    "Hermy and Bass",
    "Skelly By Everlight",
    "Recipe for Disaster: Defeating the Culinaromancer",
  ];
  const profile = { questProgress: availableQuests(titles) };
  const matched = QUESTS.filter((q) => findPlayerQuest(profile, q)).map((q) => q.id);
  for (const id of [
    "raksha-the-shadow-colossus-quest",
    "tears-of-guthix-quest",
    "once-upon-a-time-in-gielinor-foreshadowing",
    "that-old-black-magic-skelly-by-everlight",
    "recipe-for-disaster-defeating-the-culinaromancer",
  ])
    assert.ok(matched.includes(id), id);
  assert.equal(matched.length, titles.length);
});

test("malformed and cross-player responses cannot be imported; valid empty logs and zero XP remain available", async (t) => {
  const original = globalThis.fetch;
  t.after(() => {
    globalThis.fetch = original;
  });
  const good = platformPlayer({
    levels: { Mining: 1 },
    statistics: {
      overall: {},
      skills: { Mining: { xp: 0 } },
      activities: [{ name: "RuneScore", score: 0 }],
    },
    quests: availableQuests([], { questPoints: 0 }),
    events: { status: "available", name: "Real Player", events: [] },
  });
  globalThis.fetch = async () => new Response(JSON.stringify(good));
  const result = await fetchPlayer("Real_Player");
  assert.equal(result.statistics.skills.Mining.xp, 0);
  assert.equal(result.quests.questPoints, 0);
  assert.equal(result.events.status, "available");
  for (const mutate of [
    (p) => {
      p.name = "Other Player";
      p.quests.name = p.name;
      p.events.name = p.name;
    },
    (p) => {
      p.statistics.skills.Mining.xp = -1;
    },
    (p) => {
      p.quests.questPoints = 501;
    },
    (p) => {
      p.events.events = [
        { type: "new", date: "invalid", text: "Reported event", details: "" },
      ];
    },
    (p) => {
      p.quests = { status: "available", completedTitles: ["Cook's Assistant"] };
    },
  ]) {
    const bad = structuredClone(good);
    mutate(bad);
    globalThis.fetch = async () => new Response(JSON.stringify(bad));
    await assert.rejects(fetchPlayer("Real Player"), /invalid player data/);
  }
});

test("lookup validation accepts independent available sources and rejects conflicting or empty primary data", () => {
  const emptyStatistics = () => ({ overall: {}, skills: {}, activities: [] });
  const partial = platformPlayer({
    hiscoresImportStatus: "unranked-or-unavailable",
    levels: {},
    statistics: emptyStatistics(),
    quests: availableQuests([], { questPoints: 0, maxQuestPoints: 0 }),
  });
  assert.equal(isPlayerLookup(partial), true);
  assert.equal(
    isPlayerLookup({
      ...partial,
      hiscoresImportStatus: "service-unavailable",
      quests: { status: "unavailable", reason: "service-unavailable" },
      events: { status: "available", name: "Real_Player", events: [] },
    }),
    true,
  );
  assert.equal(isPlayerLookup(platformPlayer()), true);

  for (const mutate of [
    (p) => {
      delete p.hiscoresImportStatus;
    },
    (p) => {
      p.hiscoresImportStatus = "private-or-unavailable";
    },
    (p) => {
      p.levels = { Mining: 1 };
    },
    (p) => {
      p.statistics.overall = { xp: 0 };
    },
    (p) => {
      p.statistics.skills = { Mining: {} };
    },
    (p) => {
      p.statistics.activities = [{ name: "RuneScore", score: 0 }];
    },
    (p) => {
      p.statistics.extra = {};
    },
    (p) => {
      p.quests = { status: "unavailable", reason: "service-unavailable" };
    },
    (p) => {
      p.quests.name = "Other Player";
    },
    (p) => {
      p.hiscoresImportStatus = "available";
    },
  ]) {
    const bad = structuredClone(partial);
    mutate(bad);
    assert.equal(isPlayerLookup(bad), false);
  }
  for (const levels of [
    {},
    { Unknown: 1 },
    { Mining: 0 },
    { Mining: 121 },
    { Mining: 1.5 },
  ]) {
    assert.equal(isPlayerLookup(platformPlayer({ levels })), false);
  }
  assert.equal(
    isPlayerLookup(
      platformPlayer({
        statistics: { overall: {}, skills: { Unknown: {} }, activities: [] },
      }),
    ),
    false,
  );
});
