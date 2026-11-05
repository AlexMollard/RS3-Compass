import test from "node:test";
import assert from "node:assert/strict";
import { get } from "svelte/store";
import { createCompassController } from "../src/lib/profileStore.ts";
import { platformPlayer } from "./fixtures/platform-player.mjs";

const player = (name) => platformPlayer({ name, levels: { Mining: 30 } });

test("Removing an inactive player does not select another account or alter remaining progress", () => {
  const controller = createCompassController();
  controller.addPlayer(player("First Player"), "Solo Ironman", "f2p");
  controller.updateProfile((p) => ({
    ...p,
    notes: { "train-Mining": "Keep my notes" },
    packed: ["train-Mining::Iron ore"],
  }));
  controller.addPlayer(player("Next Player"), "Group Ironman", "members");
  controller.selectProfile("rs3:first player");
  const before = structuredClone(get(controller.state));
  controller.removePlayer("rs3:next player");
  assert.deepEqual(get(controller.state), {
    ...before,
    profiles: before.profiles.filter((p) => p.id !== "rs3:next player"),
  });
});

test("Removing the active player selects a valid remaining profile without altering it", () => {
  const controller = createCompassController();
  const samples = structuredClone(get(controller.state).profiles);
  controller.addPlayer(player("First Player"), "Solo Ironman", "f2p");
  controller.removePlayer("rs3:first player");
  const saved = get(controller.state);
  assert.deepEqual(saved.profiles, samples);
  assert.ok(saved.profiles.some((p) => p.id === saved.activeId));
});

test("Both fictional profiles, including legacy samples, can be removed without affecting real progress", () => {
  const controller = createCompassController();
  const samples = get(controller.state).profiles.map((p) => p.id);
  controller.state.update((saved) => ({
    ...saved,
    profiles: saved.profiles.map((p, index) => {
      if (index !== 0) return p;
      const legacy = { ...p };
      delete legacy.source;
      return legacy;
    }),
  }));
  controller.addPlayer(player("First Player"), "Solo Ironman", "f2p");
  controller.updateProfile((p) => ({
    ...p,
    notes: { quest: "Keep" },
    packed: ["quest::rope"],
    completedQuests: ["quest"],
    completedTasks: ["task"],
  }));
  const real = structuredClone(
    get(controller.state).profiles.find((p) => p.id === "rs3:first player"),
  );
  for (const id of samples) controller.removePlayer(id);
  assert.deepEqual(get(controller.state).profiles, [real]);
  assert.equal(get(controller.state).activeId, real.id);
  controller.removePlayer(real.id);
  assert.deepEqual(get(controller.state), {
    version: 1,
    activeId: "",
    profiles: [],
  });
});

test("An unknown cached-player ID leaves all profiles unchanged", () => {
  const controller = createCompassController();
  const before = structuredClone(get(controller.state));
  controller.removePlayer("missing");
  assert.deepEqual(get(controller.state), before);
});

test("Removing an inactive profile preserves the remembered player; removing the last clears it", (t) => {
  const documentDescriptor = Object.getOwnPropertyDescriptor(
    globalThis,
    "document",
  );
  const locationDescriptor = Object.getOwnPropertyDescriptor(
    globalThis,
    "location",
  );
  const document = { cookie: "" };
  Object.defineProperty(globalThis, "document", {
    configurable: true,
    value: document,
  });
  Object.defineProperty(globalThis, "location", {
    configurable: true,
    value: { protocol: "https:" },
  });
  t.after(() => {
    if (documentDescriptor)
      Object.defineProperty(globalThis, "document", documentDescriptor);
    else delete globalThis.document;
    if (locationDescriptor)
      Object.defineProperty(globalThis, "location", locationDescriptor);
    else delete globalThis.location;
  });
  const controller = createCompassController();
  const samples = get(controller.state).profiles.map((p) => p.id);
  controller.addPlayer(player("First Player"), "Solo Ironman", "f2p");
  const cookie = document.cookie;
  for (const id of samples) controller.removePlayer(id);
  assert.equal(document.cookie, cookie);
  controller.removePlayer("missing");
  assert.equal(document.cookie, cookie);
  controller.removePlayer("rs3:first player");
  assert.match(document.cookie, /^rs3_compass_player=; Max-Age=0;/);
});
