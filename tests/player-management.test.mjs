import test from "node:test";
import assert from "node:assert/strict";
import { get } from "svelte/store";
import { createCompassController } from "../src/lib/profileStore.ts";

const player = (name) => ({
  name,
  levels: { Mining: 30 },
  fetchedAt: 1234,
  quests: { status: "unavailable", reason: "private-or-unavailable" },
});

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

test("Removing the only real player leaves an explicitly sampled workspace, not an invalid empty state", () => {
  const controller = createCompassController();
  controller.addPlayer(player("First Player"), "Solo Ironman", "f2p");
  const saved = get(controller.state);
  controller.state.set({
    ...saved,
    profiles: saved.profiles.filter((p) => p.source === "hiscores"),
  });
  controller.removePlayer("rs3:first player");
  const after = get(controller.state);
  assert.equal(
    after.profiles.some((p) => p.source === "hiscores"),
    false,
  );
  assert.ok(after.profiles.some((p) => p.id === after.activeId));
});

test("An unknown cached-player ID cannot remove a sample or other profile", () => {
  const controller = createCompassController();
  const before = structuredClone(get(controller.state));
  controller.removePlayer("missing");
  controller.removePlayer(before.activeId);
  assert.deepEqual(get(controller.state), before);
});
