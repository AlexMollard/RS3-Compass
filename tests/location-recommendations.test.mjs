import assert from "node:assert/strict";
import test from "node:test";
import { QUESTS, SKILLS, stageLocations } from "../src/data.ts";
import { LOCATIONS } from "../src/locations.ts";

const stages = SKILLS.flatMap((skill) => skill.stages);

test("every quest and training destination resolves to a location card", () => {
  const references = [
    ...QUESTS.flatMap((quest) => quest.locations),
    ...stages.flatMap((stage) => [
      ...stage.locations,
      ...(stage.memberLocations ?? []),
    ]),
  ];
  assert.deepEqual(
    [...new Set(references.filter((id) => !Object.hasOwn(LOCATIONS, id)))],
    [],
  );
});

test("location names cannot collide in case-insensitive game references", () => {
  const names = Object.values(LOCATIONS).map((location) =>
    location.name.toLocaleLowerCase("en"),
  );
  assert.deepEqual(
    names.filter((name, index) => names.indexOf(name) !== index),
    [],
  );
});

test("free-to-play recommendations never include a members-only destination", () => {
  const forbidden = stages.flatMap((stage) =>
    stageLocations(stage, "f2p").filter((id) => LOCATIONS[id]?.members),
  );
  assert.deepEqual(forbidden, []);
});

test("membership adds the coal-truck option without contaminating the free route", () => {
  const coal = SKILLS.find((skill) => skill.name === "Mining").stages.find(
    (stage) => stage.from === 20,
  );
  const freeRoute = [...stageLocations(coal, "f2p")];
  const membersRoute = stageLocations(coal, "members");
  assert.equal(
    membersRoute.some((id) => LOCATIONS[id].members),
    true,
  );
  assert.equal(
    freeRoute.every((id) => membersRoute.includes(id)),
    true,
  );
  assert.deepEqual(stageLocations(coal, "f2p"), freeRoute);
});
