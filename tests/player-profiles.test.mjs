import test from "node:test";
import assert from "node:assert/strict";
import { get } from "svelte/store";
import { createCompassController } from "../src/lib/profileStore.ts";
import { SKILLS, trainingMethod } from "../src/data.ts";
import {
  availableQuests,
  platformPlayer,
} from "./fixtures/platform-player.mjs";

const KEY = "rs3-compass-design-v1";
const player = platformPlayer();
const current = (controller) => {
  const saved = get(controller.state);
  return saved.profiles.find((p) => p.id === saved.activeId);
};

test("A real lookup creates an isolated profile without fictional sample achievements or notes", () => {
  const controller = createCompassController();
  const samples = structuredClone(get(controller.state).profiles);
  controller.addPlayer(player, "Group Ironman", "members");
  const real = current(controller);
  assert.deepEqual(
    get(controller.state).profiles.filter((p) => p.id !== real.id),
    samples,
  );
  assert.equal(real.id, "rs3:real player");
  assert.equal(real.source, "hiscores");
  assert.equal(real.kind, "Group Ironman");
  assert.equal(real.mode, "members");
  assert.deepEqual(real.levels, player.levels);
  assert.deepEqual(
    [
      real.completedQuests,
      real.packed,
      real.completedTasks,
      real.notes,
      real.trainingRanges,
    ],
    [[], [], [], {}, {}],
  );
});

test("Controllers do not share mutable user state across SSR requests", () => {
  const first = createCompassController(),
    second = createCompassController();
  const untouched = structuredClone(get(second.state));
  first.updateProfile((p) => ({
    ...p,
    notes: { ...p.notes, cook: "Only this browser" },
    mode: "members",
  }));
  first.addPlayer(player, "Solo Ironman", "f2p");
  assert.deepEqual(get(second.state), untouched);
});

test("Legacy profiles survive the framework cutover and later storage writes recover after quota failure", (t) => {
  const descriptor = Object.getOwnPropertyDescriptor(
    globalThis,
    "localStorage",
  );
  const controller = createCompassController();
  const legacy = structuredClone(get(controller.state));
  legacy.profiles.forEach((p) => delete p.trainingRanges);
  legacy.profiles[0].notes = { "train-Smithing": "Keep this legacy note" };
  const storage = new Map([[KEY, JSON.stringify(legacy)]]);
  let full = false;
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => {
        if (full) throw new Error("Quota exceeded");
        storage.set(key, value);
      },
    },
  });
  t.after(() => {
    controller.destroy();
    if (descriptor)
      Object.defineProperty(globalThis, "localStorage", descriptor);
    else delete globalThis.localStorage;
  });
  controller.initialize();
  assert.deepEqual(get(controller.state), legacy);
  full = true;
  controller.updateProfile((p) => ({
    ...p,
    notes: { ...p.notes, cook: "Unsaved change" },
  }));
  assert.equal(get(controller.storageError), true);
  assert.deepEqual(JSON.parse(storage.get(KEY)), legacy);
  full = false;
  controller.updateProfile((p) => ({
    ...p,
    notes: { ...p.notes, cook: "Recovered change" },
  }));
  assert.equal(get(controller.storageError), false);
  const restored = JSON.parse(storage.get(KEY));
  assert.equal(restored.profiles[0].notes.cook, "Recovered change");
  assert.equal(
    restored.profiles[0].notes["train-Smithing"],
    "Keep this legacy note",
  );
  assert.deepEqual(restored.profiles[1], legacy.profiles[1]);
});

test("A fresh controller is unwelcomed until a sample is picked", () => {
  const controller = createCompassController();
  assert.equal(get(controller.state).welcomed, false);
  controller.selectProfile("aster");
  assert.equal(get(controller.state).welcomed, true);
  const other = createCompassController();
  other.welcome();
  assert.equal(get(other.state).welcomed, true);
  const looked = createCompassController();
  looked.addPlayer(player, "Solo Ironman", "f2p");
  assert.equal(get(looked.state).welcomed, true);
});

test("A background sync without selecting does not mark the visitor welcomed", () => {
  const controller = createCompassController();
  controller.addPlayer(player, "Solo Ironman", "f2p", { select: false });
  assert.equal(get(controller.state).welcomed, false);
  controller.destroy();
});

test("A stored save without the welcomed field is treated as welcomed", (t) => {
  const descriptor = Object.getOwnPropertyDescriptor(
    globalThis,
    "localStorage",
  );
  const saved = structuredClone(get(createCompassController().state));
  delete saved.welcomed;
  const storage = new Map([[KEY, JSON.stringify(saved)]]);
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value),
    },
  });
  const controller = createCompassController();
  t.after(() => {
    controller.destroy();
    if (descriptor)
      Object.defineProperty(globalThis, "localStorage", descriptor);
    else delete globalThis.localStorage;
  });
  controller.initialize();
  assert.equal(get(controller.storageError), false);
  assert.equal(get(controller.state).welcomed, true);
  assert.equal(JSON.parse(storage.get(KEY)).version, 1);
});

test("Removing every sample persists an empty workspace across reload and permits a fresh lookup", (t) => {
  const descriptor = Object.getOwnPropertyDescriptor(
    globalThis,
    "localStorage",
  );
  const storage = new Map();
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value),
    },
  });
  const first = createCompassController();
  const reloaded = createCompassController();
  t.after(() => {
    first.destroy();
    reloaded.destroy();
    if (descriptor)
      Object.defineProperty(globalThis, "localStorage", descriptor);
    else delete globalThis.localStorage;
  });
  first.initialize();
  for (const profile of get(first.state).profiles)
    first.removePlayer(profile.id);
  const empty = { version: 1, activeId: "", profiles: [], welcomed: false };
  assert.deepEqual(JSON.parse(storage.get(KEY)), empty);
  first.destroy();
  reloaded.initialize();
  assert.equal(get(reloaded.storageError), false);
  assert.deepEqual(get(reloaded.state), empty);
  reloaded.addPlayer(player, "Solo Ironman", "f2p");
  const real = current(reloaded);
  assert.equal(real.id, "rs3:real player");
  assert.deepEqual(real.completedQuests, []);
  assert.deepEqual(real.completedTasks, []);
  assert.deepEqual(real.packed, []);
  assert.deepEqual(real.notes, {});
  assert.deepEqual(JSON.parse(storage.get(KEY)), get(reloaded.state));
});

test("An empty profile list with a nonempty selection is not overwritten", (t) => {
  const descriptor = Object.getOwnPropertyDescriptor(
    globalThis,
    "localStorage",
  );
  const original = JSON.stringify({
    version: 1,
    activeId: "missing",
    profiles: [],
  });
  let stored = original;
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: { getItem: () => stored, setItem: (_, value) => (stored = value) },
  });
  const controller = createCompassController();
  t.after(() => {
    controller.destroy();
    if (descriptor)
      Object.defineProperty(globalThis, "localStorage", descriptor);
    else delete globalThis.localStorage;
  });
  controller.initialize();
  assert.equal(get(controller.storageError), true);
  assert.equal(stored, original);
});

test("An unsupported saved format is not overwritten with sample data", (t) => {
  const descriptor = Object.getOwnPropertyDescriptor(
    globalThis,
    "localStorage",
  );
  const original = JSON.stringify({
    version: 2,
    profiles: [{ name: "Future progress" }],
  });
  let stored = original;
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: { getItem: () => stored, setItem: (_, value) => (stored = value) },
  });
  const controller = createCompassController();
  t.after(() => {
    controller.destroy();
    if (descriptor)
      Object.defineProperty(globalThis, "localStorage", descriptor);
    else delete globalThis.localStorage;
  });
  controller.initialize();
  controller.updateProfile((p) => ({ ...p, mode: "members" }));
  assert.equal(get(controller.storageError), true);
  assert.equal(stored, original);
});

test("Public completion matches Compass quest identities without importing sample progress", () => {
  const controller = createCompassController();
  controller.addPlayer(
    {
      ...player,
      quests: availableQuests([
        "COOK’S ASSISTANT",
        "Dragon Slayer",
        "DORIC’S TASK IV (MINIQUEST)",
        "Three's Company (saga)",
        "Visions of Havenhythe",
        "A quest outside this catalogue",
      ]),
    },
    "Solo Ironman",
    "f2p",
  );
  const real = current(controller);
  assert.deepEqual(real.completedQuests, [
    "cooks-assistant",
    "dragon-slayer",
    "visions-of-havenhythe",
    "dorics-task-iv",
    "threes-company",
  ]);
  assert.equal(real.questImportStatus, "available");
  assert.deepEqual(real.packed, []);
});

test("Public refresh adds completion without removing manual checks or duplicating quest identities", () => {
  const controller = createCompassController();
  controller.addPlayer(player, "Solo Ironman", "f2p");
  controller.updateProfile((p) => ({
    ...p,
    completedQuests: ["knights-sword"],
    notes: { cook: "Keep this" },
  }));
  controller.addPlayer(
    {
      ...player,
      quests: availableQuests(["Cook's Assistant", "Cook's Assistant"]),
    },
    "Solo Ironman",
    "f2p",
  );
  const real = current(controller);
  assert.deepEqual(real.completedQuests.sort(), [
    "cooks-assistant",
    "knights-sword",
  ]);
  assert.deepEqual(real.notes, { cook: "Keep this" });
});

test("Private or unavailable quest responses never erase previously imported or manual completion", () => {
  const controller = createCompassController();
  controller.addPlayer(
    {
      ...player,
      quests: availableQuests(["Cook's Assistant"]),
    },
    "Solo Ironman",
    "members",
  );
  controller.updateProfile((p) => ({
    ...p,
    completedQuests: [...p.completedQuests, "dragon-slayer"],
  }));
  for (const reason of [
    "private-or-unavailable",
    "not-member",
    "service-unavailable",
  ]) {
    controller.addPlayer(
      { ...player, quests: { status: "unavailable", reason } },
      "Solo Ironman",
      "f2p",
    );
    assert.deepEqual(current(controller).completedQuests, [
      "cooks-assistant",
      "dragon-slayer",
    ]);
    assert.equal(current(controller).questImportStatus, reason);
    assert.equal(current(controller).mode, "members");
  }
});

test("a cached training choice survives reload and a temporary free-play view without affecting other players", (t) => {
  const descriptor = Object.getOwnPropertyDescriptor(
    globalThis,
    "localStorage",
  );
  const storage = new Map();
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value),
    },
  });
  const first = createCompassController();
  const restored = createCompassController();
  t.after(() => {
    first.destroy();
    restored.destroy();
    if (descriptor)
      Object.defineProperty(globalThis, "localStorage", descriptor);
    else delete globalThis.localStorage;
  });
  const mining = SKILLS.find((skill) => skill.name === "Mining");
  const range = mining.stages.find(
    (stage) => !stage.members && stage.options.some((option) => option.members),
  );
  const chosen = range.options.find((option) => option.members);
  first.initialize();
  const otherPlayers = structuredClone(get(first.state).profiles.slice(1));
  first.updateProfile((p) => ({
    ...p,
    mode: "members",
    trainingRanges: { Mining: range.from },
    trainingMethods: { Mining: chosen.id },
  }));
  restored.initialize();
  assert.equal(trainingMethod(mining, current(restored)).id, chosen.id);
  restored.updateProfile((p) => ({ ...p, mode: "f2p" }));
  assert.equal(
    trainingMethod(mining, current(restored)).members ?? false,
    false,
  );
  restored.updateProfile((p) => ({ ...p, mode: "members" }));
  assert.equal(trainingMethod(mining, current(restored)).id, chosen.id);
  assert.deepEqual(get(restored.state).profiles.slice(1), otherPlayers);
});
