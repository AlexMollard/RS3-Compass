import test from "node:test";
import assert from "node:assert/strict";
import {
  CARD,
  earlierQuests,
  layoutQuestMap,
  pathColumns,
  questStatus,
  questTiers,
} from "../src/lib/questMap.ts";
import { QUESTS, SAMPLE_PROFILES, progressionQuests } from "../src/data.ts";

const q = (id, ...questRequirements) => ({ id, questRequirements });
// a and b start; c needs a; d needs c and b; e needs a missing quest.
const SMALL = [q("a"), q("b"), q("c", "a"), q("d", "c", "b"), q("e", "zz")];

test("status is done, ready when every earlier quest is done, else locked", () => {
  const done = new Set(["a"]);
  assert.equal(questStatus(SMALL[0], done), "done");
  assert.equal(questStatus(SMALL[2], done), "ready");
  assert.equal(questStatus(SMALL[3], done), "locked");
});

test("earlier quests are transitive, exclude the quest itself and survive a cycle", () => {
  assert.deepEqual([...earlierQuests("d", SMALL)].sort(), ["a", "b", "c"]);
  assert.deepEqual([...earlierQuests("a", SMALL)], []);
  const loop = [q("x", "y"), q("y", "x")];
  assert.deepEqual([...earlierQuests("x", loop)], ["y"]);
});

test("a quest's tier is its longest chain of earlier quests; missing ones are ignored", () => {
  const tiers = questTiers(SMALL);
  assert.deepEqual(Object.fromEntries(tiers), { a: 0, b: 0, c: 1, d: 2, e: 0 });
});

test("the map puts every earlier quest left of the quest that needs it, with no overlaps", () => {
  const quests = progressionQuests(SAMPLE_PROFILES[0]);
  const layout = layoutQuestMap(quests);
  assert.equal(layout.nodes.size, quests.length);
  const ids = new Set(quests.map((x) => x.id));
  for (const quest of quests)
    for (const r of quest.questRequirements.filter((id) => ids.has(id)))
      assert.ok(
        layout.nodes.get(r).x + CARD.width <= layout.nodes.get(quest.id).x,
        `${r} should sit left of ${quest.id}`,
      );
  const spots = new Set([...layout.nodes.values()].map((n) => `${n.x},${n.y}`));
  assert.equal(spots.size, quests.length);
  for (const n of layout.nodes.values()) {
    assert.ok(n.x + CARD.width <= layout.width && n.y + CARD.height <= layout.height);
  }
});

test("a path ends with the goal alone and starts with quests that need nothing on it", () => {
  const columns = pathColumns("d", SMALL);
  assert.deepEqual(columns.at(-1), ["d"]);
  assert.deepEqual(columns[0].sort(), ["a", "b"]);
  assert.deepEqual(columns[1], ["c"]);
});

test("a goal with no earlier quests is a path of one; an unknown goal is empty", () => {
  assert.deepEqual(pathColumns("a", SMALL), [["a"]]);
  assert.deepEqual(pathColumns("nope", SMALL), []);
});

test("Plague's End's path covers its whole quest chain from the real catalogue", () => {
  const columns = pathColumns("plagues-end", QUESTS);
  const all = columns.flat();
  assert.equal(columns.at(-1)[0], "plagues-end");
  assert.equal(all.length - 1, earlierQuests("plagues-end", QUESTS).size);
  for (const id of ["within-the-light", "making-history", "catapult-construction"])
    assert.ok(all.includes(id), id);
});

test("an umbrella quest's path includes every one of its subquests", () => {
  for (const umbrella of QUESTS.filter((q) => QUESTS.some((s) => s.name.startsWith(q.name + ": ")))) {
    const earlier = earlierQuests(umbrella.id, QUESTS);
    const missing = QUESTS.filter((s) => s.name.startsWith(umbrella.name + ": ") && !earlier.has(s.id));
    assert.deepEqual(missing.map((s) => s.id), [], umbrella.id);
  }
  const rfd = pathColumns("recipe-for-disaster", QUESTS).flat();
  assert.equal(rfd.filter((id) => id.startsWith("recipe-for-disaster-")).length, 10);
  // Jagex awards Recipe for Disaster's quest points on its subquests, not the umbrella.
  const umbrella = QUESTS.find((q) => q.id === "recipe-for-disaster");
  assert.equal(umbrella.rewards.some((line) => /^\d+ quest points?/.test(line)), false);
});
