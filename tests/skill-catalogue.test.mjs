import test from "node:test";
import assert from "node:assert/strict";
import {
  SKILLS,
  SAMPLE_PROFILES,
  availableStages,
  skillNeedsMembership,
  trainingStage,
  stageLocations,
} from "../src/data.ts";
import { RS3_SKILL_NAMES } from "../src/skillNames.ts";
import { LOCATIONS } from "../src/locations.ts";

const profile = (skill, level, mode = "members") => ({
  ...structuredClone(SAMPLE_PROFILES[0]),
  mode,
  levels: { [skill]: level },
});

test("Every public RS3 skill identity has one reachable Compass guide", () => {
  assert.deepEqual(
    SKILLS.map((skill) => skill.name).sort(),
    [...RS3_SKILL_NAMES].sort(),
  );
});

test("Training ranges remain contiguous and select the correct method at both sides of each boundary", () => {
  for (const skill of SKILLS) {
    assert.ok(skill.stages.length > 0, skill.name + " has no training method");
    assert.equal(
      skill.stages[0].from,
      1,
      skill.name + " has no starting method",
    );
    for (let index = 0; index < skill.stages.length; index++) {
      const stage = skill.stages[index];
      assert.ok(
        Number.isInteger(stage.from) &&
          Number.isInteger(stage.to) &&
          stage.from >= 1 &&
          stage.to > stage.from &&
          stage.to <= 120,
        skill.name + " has an invalid range",
      );
      assert.equal(
        trainingStage(skill, profile(skill.name, stage.from)),
        stage,
        skill.name + " selected a wrong starting method",
      );
      if (index > 0) {
        const previous = skill.stages[index - 1];
        assert.equal(
          previous.to,
          stage.from,
          skill.name + " has a gap or overlap",
        );
        assert.equal(
          trainingStage(skill, profile(skill.name, stage.from - 1)),
          previous,
          skill.name + " advanced before the boundary",
        );
      }
    }
  }
});

test("Free-play methods never recommend a member location or a method above the trial", () => {
  for (const skill of SKILLS) {
    for (const stage of availableStages(skill, "f2p")) {
      assert.equal(
        Boolean(stage.members),
        false,
        skill.name + ": member method leaked",
      );
      if (skill.freeToPlayCap !== undefined)
        assert.ok(
          stage.to <= skill.freeToPlayCap,
          skill.name + ": trial range exceeds cap",
        );
      for (const id of stageLocations(stage, "f2p"))
        assert.equal(LOCATIONS[id].members, false, skill.name + ": " + id);
    }
  }
});

test("Trial caps distinguish five-level skills, expanded twenty-level trials and fully locked Invention", () => {
  for (const [name, cap] of Object.entries({
    Agility: 5,
    Herblore: 5,
    Thieving: 5,
    Slayer: 5,
    Farming: 5,
    Hunter: 5,
    Summoning: 5,
    Divination: 5,
    Construction: 20,
    Archaeology: 20,
    Necromancy: 20,
    Invention: 0,
  })) {
    const skill = SKILLS.find((skill) => skill.name === name);
    assert.equal(skill.freeToPlayCap, cap, name);
    assert.equal(
      skillNeedsMembership(skill, profile(name, Math.max(1, cap), "f2p")),
      true,
      name,
    );
    assert.equal(
      skillNeedsMembership(skill, profile(name, Math.max(1, cap), "members")),
      false,
      name,
    );
    if (cap > 0)
      assert.equal(
        skillNeedsMembership(skill, profile(name, cap - 1, "f2p")),
        false,
        name,
      );
    else assert.equal(trainingStage(skill, profile(name, 1, "f2p")), undefined);
  }
});

test("Full free-play skills remain usable at high levels rather than becoming false member trials", () => {
  const trials = new Set([
    "Agility",
    "Herblore",
    "Thieving",
    "Slayer",
    "Farming",
    "Hunter",
    "Summoning",
    "Divination",
    "Construction",
    "Archaeology",
    "Necromancy",
    "Invention",
  ]);
  for (const skill of SKILLS.filter((skill) => !trials.has(skill.name))) {
    assert.equal(skill.freeToPlayCap, undefined, skill.name);
    assert.equal(
      skillNeedsMembership(skill, profile(skill.name, 110, "f2p")),
      false,
      skill.name,
    );
    assert.ok(
      trainingStage(skill, profile(skill.name, 110, "f2p")),
      skill.name,
    );
  }
});

test("A stored member method survives mode changes without being recommended in the free trial", () => {
  const skill = SKILLS.find((skill) => skill.name === "Herblore");
  const p = { ...profile("Herblore", 30), trainingRanges: { Herblore: 13 } };
  assert.equal(trainingStage(skill, p).from, 13);
  assert.equal(trainingStage(skill, { ...p, mode: "f2p" }).from, 1);
  assert.equal(skillNeedsMembership(skill, { ...p, mode: "f2p" }), true);
  assert.equal(trainingStage(skill, p).from, 13);
});
