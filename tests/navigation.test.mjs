import test from "node:test";
import assert from "node:assert/strict";
import { NAV_GROUPS, PHONE_TABS, routeFor } from "../src/lib/navigation.ts";
import { load as loadQuestRoute } from "../src/routes/quests/[[id]]/+page.ts";
import { load as loadSkill } from "../src/routes/skills/[[name]]/+page.ts";

test("an unknown quest id is a 404, not a different quest", () => {
  assert.throws(() => loadQuestRoute({ params: { id: "not-a-real-quest" } }), (e) => e.status === 404);
  assert.doesNotThrow(() => loadQuestRoute({ params: { id: "cooks-assistant" } }));
  assert.doesNotThrow(() => loadQuestRoute({ params: {} }));
});

test("skill addresses redirect other cases and reject unknown skills", () => {
  const skill = (name) => () => loadSkill({ params: { name } });
  assert.equal(skill(undefined)(), undefined);
  assert.equal(skill("Attack")(), undefined);
  assert.throws(skill("attack"), { status: 308, location: "/skills/Attack" });
  assert.throws(skill("Foo"), { status: 404 });
});

test("routeFor maps paths to shell routes", () => {
  assert.equal(routeFor("/"), "home");
  assert.equal(routeFor("/quests/cooks-assistant"), "quests");
  assert.equal(routeFor("/levels"), "levels");
  assert.equal(routeFor("/groups"), "groups");
  assert.equal(routeFor("/compare"), "compare");
  assert.equal(routeFor("/players/"), "players");
  assert.equal(routeFor("/play"), "home");
});

test("the People phone tab covers players, groups and activity", () => {
  const people = PHONE_TABS.find((tab) => tab.label === "People");
  assert.ok(people);
  assert.ok(people.matches.includes("activity"));
  assert.ok(people.matches.includes("groups"));
  assert.ok(people.matches.includes("compare"));
  assert.ok(people.matches.includes("players"));
});

test("the rail groups Plan and People in order", () => {
  assert.deepEqual(
    NAV_GROUPS.map((group) => group.label),
    ["Plan", "People"],
  );
  assert.deepEqual(
    NAV_GROUPS[0].items.map((item) => item.label),
    ["Home", "Quests", "Skills"],
  );
});
