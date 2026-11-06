import test from "node:test";
import assert from "node:assert/strict";
import { NAV_GROUPS, PHONE_TABS, routeFor } from "../src/lib/navigation.ts";

test("routeFor maps paths to shell routes", () => {
  assert.equal(routeFor("/"), "home");
  assert.equal(routeFor("/quests/cooks-assistant"), "quests");
  assert.equal(routeFor("/levels"), "levels");
  assert.equal(routeFor("/groups"), "groups");
  assert.equal(routeFor("/players/"), "players");
  assert.equal(routeFor("/play"), "home");
});

test("the People phone tab covers players, groups and activity", () => {
  const people = PHONE_TABS.find((tab) => tab.label === "People");
  assert.ok(people);
  assert.ok(people.matches.includes("activity"));
  assert.ok(people.matches.includes("groups"));
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
