import assert from "node:assert/strict";
import test from "node:test";
import { QUESTS, SKILLS, availableTrainingOptions } from "../src/data.ts";
import { LOCATIONS } from "../src/locations.ts";

const stages = SKILLS.flatMap((skill) => skill.stages);

test("every quest and training destination resolves to a location card", () => {
  const references = [
    ...QUESTS.map((quest) => quest.start.location),
    ...stages.flatMap((stage) =>
      stage.options.flatMap((option) => option.locations),
    ),
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
    availableTrainingOptions(stage, "f2p")
      .flatMap((option) => option.locations)
      .filter((id) => LOCATIONS[id]?.members),
  );
  forbidden.push(
    ...QUESTS.filter(
      (quest) => !quest.members && LOCATIONS[quest.start.location]?.members,
    ).map((quest) => quest.start.location),
  );
  assert.deepEqual(forbidden, []);
});
