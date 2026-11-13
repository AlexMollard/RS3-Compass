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

test("A second tab adopts the other tab's saves instead of overwriting them", (t) => {
  const descriptors = ["localStorage", "window"].map((key) => [
    key,
    Object.getOwnPropertyDescriptor(globalThis, key),
  ]);
  const storage = new Map();
  const tabs = [new EventTarget(), new EventTarget()];
  let writer;
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => {
        const old = storage.get(key) ?? null;
        storage.set(key, value);
        // Browsers notify only the other tabs, and only when the value changes.
        if (old !== value)
          for (const tab of tabs)
            if (tab !== writer)
              tab.dispatchEvent(
                Object.assign(new Event("storage"), { key, newValue: value }),
              );
      },
    },
  });
  const open = (tab) => {
    writer = tab;
    globalThis.window = tab;
    const controller = createCompassController();
    controller.initialize();
    return controller;
  };
  const a = open(tabs[0]);
  const b = open(tabs[1]);
  t.after(() => {
    a.destroy();
    b.destroy();
    for (const [key, descriptor] of descriptors)
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
  });
  writer = tabs[0];
  a.addPlayer(player, "Regular account", "f2p");
  a.updateProfile((p) => ({ ...p, notes: { quest: "Saved in tab A" } }));
  writer = tabs[1];
  b.updateProfile((p) => ({ ...p, activeTask: "train-Mining" }));
  const saved = JSON.parse(storage.get(KEY));
  const real = saved.profiles.find((p) => p.id === "rs3:real player");
  assert.equal(real?.notes.quest, "Saved in tab A");
  assert.equal(real.activeTask, "train-Mining");
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

test("A regular account is saved and restored; an unknown account type is not", (t) => {
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
  const controllers = [];
  const load = () => {
    const controller = createCompassController();
    controllers.push(controller);
    controller.initialize();
    return controller;
  };
  t.after(() => {
    controllers.forEach((c) => c.destroy());
    if (descriptor)
      Object.defineProperty(globalThis, "localStorage", descriptor);
    else delete globalThis.localStorage;
  });
  const first = load();
  first.addPlayer(player, "Regular account", "members");
  const saved = JSON.parse(storage.get(KEY));
  const regular = saved.profiles.find((p) => p.kind === "Regular account");
  assert.ok(regular);
  assert.deepEqual(get(load().state), saved);
  regular.kind = "Pure";
  storage.set(KEY, JSON.stringify(saved));
  assert.ok(
    !get(load().state).profiles.some((p) => p.id === regular.id),
  );
});

test("Hiscores detection sets regular or Solo Ironman on lookup and refresh, and keeps Group Ironman", () => {
  const controller = createCompassController();
  const kindOf = () =>
    get(controller.state).profiles.find((p) => p.source === "hiscores").kind;
  const at = (fetchedAt, ironman) => ({ ...player, fetchedAt, ironman });
  controller.addPlayer(at(1, true), "Regular account", "f2p");
  assert.equal(kindOf(), "Solo Ironman");
  controller.addPlayer(at(2, false), "Solo Ironman", "f2p");
  assert.equal(kindOf(), "Regular account");
  controller.addPlayer(at(3, undefined), "Solo Ironman", "f2p");
  assert.equal(kindOf(), "Regular account");
  const id = get(controller.state).profiles.find((p) => p.source === "hiscores").id;
  controller.updatePlayer(id, { kind: "Group Ironman", mode: "f2p" });
  controller.addPlayer(at(4, false), "Regular account", "f2p");
  assert.equal(kindOf(), "Group Ironman");
  controller.destroy();
});

test("Review Focus 4: a save without collection log fields loads, and a malformed one is kept", (t) => {
  const descriptor = Object.getOwnPropertyDescriptor(
    globalThis,
    "localStorage",
  );
  const legacy = structuredClone(get(createCompassController().state));
  assert.ok(
    legacy.profiles.every(
      (p) => !("collected" in p) && !("collectedAuto" in p),
    ),
  );
  const ticked = structuredClone(legacy);
  ticked.profiles[0].collected = ["boss:giant-mole:Mole claw"];
  ticked.profiles[0].collectedAuto = ["boss:giant-mole:Mole claw"];
  const badCollected = structuredClone(legacy);
  badCollected.profiles[0].collected = [1];
  const badAuto = structuredClone(legacy);
  badAuto.profiles[0].collectedAuto = "boss:giant-mole:Mole claw";
  let stored;
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: { getItem: () => stored, setItem: (_, value) => (stored = value) },
  });
  t.after(() => {
    if (descriptor)
      Object.defineProperty(globalThis, "localStorage", descriptor);
    else delete globalThis.localStorage;
  });
  const load = (saved) => {
    stored = JSON.stringify(saved);
    const original = stored;
    const controller = createCompassController();
    controller.initialize();
    controller.destroy();
    return { controller, original };
  };
  for (const saved of [legacy, ticked]) {
    const { controller } = load(saved);
    assert.equal(get(controller.storageError), false);
    assert.deepEqual(get(controller.state), saved);
  }
  for (const saved of [badCollected, badAuto]) {
    const { controller, original } = load(saved);
    assert.equal(get(controller.storageError), true);
    assert.equal(stored, original);
  }
});

test("A synced event log auto-ticks boss uniques once, and an untick survives the next sync", () => {
  const controller = createCompassController();
  const key = "boss:giant-mole:Clingy mole";
  const withDrop = (fetchedAt) => ({
    ...player,
    fetchedAt,
    events: {
      status: "available",
      name: "Real Player",
      events: [
        {
          type: "rs_plog_item_drop",
          date: "13-Nov-2026 10:00",
          text: "I found a clingy mole.",
          details: "",
        },
      ],
    },
  });
  controller.addPlayer(player, "Regular account", "f2p");
  assert.equal(current(controller).collected, undefined);
  assert.equal(current(controller).collectedAuto, undefined);
  controller.addPlayer(withDrop(2000), "Regular account", "f2p");
  assert.deepEqual(current(controller).collected, [key]);
  assert.deepEqual(current(controller).collectedAuto, [key]);
  controller.updateProfile((p) => ({
    ...p,
    collected: p.collected.filter((k) => k !== key),
  }));
  controller.addPlayer(withDrop(3000), "Regular account", "f2p");
  assert.deepEqual(current(controller).collected, []);
  assert.deepEqual(current(controller).collectedAuto, [key]);
  assert.ok(
    get(controller.state).profiles.every(
      (p) => p.source === "hiscores" || !("collected" in p),
    ),
  );
  controller.destroy();
});
