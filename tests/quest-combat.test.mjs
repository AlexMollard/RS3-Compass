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
