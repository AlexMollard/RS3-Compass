import assert from "node:assert/strict";
import test from "node:test";
import { QUESTS } from "../src/data.ts";
import { QUEST_COMBAT } from "../src/combatData.ts";

test("each quest resolves exactly one combat plan without orphaned plans", () => {
  assert.deepEqual(
    Object.keys(QUEST_COMBAT).sort(),
    QUESTS.map((quest) => quest.id).sort(),
  );
});

test("avoidable encounters cannot also be labelled required kills", () => {
  const conflicts = Object.entries(QUEST_COMBAT).flatMap(([quest, plan]) =>
    plan.required
      .filter((enemy) =>
        plan.hazards.some((hazard) => hazard.wiki === enemy.wiki),
      )
      .map((enemy) => ({ quest, enemy: enemy.wiki })),
  );
  assert.deepEqual(conflicts, []);
});

test("Multiple forms of the same creature remain independently renderable", () => {
  for (const [id, plan] of Object.entries(QUEST_COMBAT)) {
    for (const encounters of [plan.required, plan.hazards]) {
      const identities = encounters.map(
        (enemy) => enemy.wiki + ":" + enemy.name,
      );
      assert.equal(
        new Set(identities).size,
        identities.length,
        id + " has indistinguishable encounter forms",
      );
    }
  }
});
