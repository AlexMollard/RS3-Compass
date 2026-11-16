import test from "node:test";
import assert from "node:assert/strict";
import {
  SKILLS,
  SAMPLE_PROFILES,
  availableStages,
  availableTrainingOptions,
  trainingMethod,
  skillByName,
  skillNeedsMembership,
  trainingStage,
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

test("skillByName finds the same record as a search of SKILLS", () => {
  for (const skill of SKILLS) assert.equal(skillByName(skill.name), skill);
  for (const name of ["", "mining", "Mining ", "Skills", "constructor"])
    assert.equal(skillByName(name), undefined);
});

test("Training Wiki links name articles, not missing subpages", () => {
  // The Wiki has no "Skill/Training" subpages; those links 404.
  for (const skill of SKILLS)
    if (skill.trainingWiki)
      assert.ok(!skill.trainingWiki.includes("/"), skill.name);
});

export function assertTrainingRanges(skills) {
  for (const skill of skills) {
    assert.ok(skill.stages.length > 0, skill.name + " has no training method");
    assert.equal(
      skill.stages[0].from,
      1,
      skill.name + " has no starting method",
    );
    assert.ok([99, 110, 120].includes(skill.maxLevel), skill.name + " cap");
    assert.equal(
      skill.stages.at(-1).to,
      skill.maxLevel,
      skill.name + " stops before the cap",
    );
    assert.equal(
      trainingStage(skill, profile(skill.name, skill.maxLevel)),
      skill.stages.at(-1),
      skill.name + " loses its final training range",
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
}
test("Training ranges cover the cap and select correctly on both sides of each boundary", () =>
  assertTrainingRanges(SKILLS));

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
    }
  }
});

export function assertTrainingChoices(skills, locations) {
  for (const skill of skills)
    for (const stage of skill.stages) {
      const context = `${skill.name} ${stage.from}`;
      assert.equal(
        new Set(stage.options.map((option) => option.id)).size,
        stage.options.length,
        context + " ambiguous method identity",
      );
      for (const mode of ["f2p", "members"]) {
        const options = availableTrainingOptions(stage, mode);
        if (mode === "members" || !stage.members)
          assert.ok(
            options.length > 0,
            context + " has no usable " + mode + " choice",
          );
        if (mode === "f2p")
          assert.equal(
            options.some((option) => option.members),
            false,
            context + " leaks members",
          );
        for (const option of options) {
          for (const id of option.locations) {
            assert.ok(locations[id], context + " missing location " + id);
            if (mode === "f2p")
              assert.equal(
                locations[id].members,
                false,
                context + " locked destination",
              );
          }
          assert.ok(
            Array.isArray(option.sites),
            context + " missing map contract",
          );
          assert.ok(
            option.sites.length || option.locationNote,
            context + " neither mapped nor portable",
          );
          for (const site of option.sites) {
            assert.ok(
              Number.isInteger(site.map.x) &&
                site.map.x >= 0 &&
                site.map.x < 6400,
              context + " map x",
            );
            assert.ok(
              Number.isInteger(site.map.y) &&
                site.map.y >= 0 &&
                site.map.y < 12800,
              context + " map y",
            );
            assert.ok(
              [0, 1, 2, 3].includes(site.map.plane),
              context + " map plane",
            );
            assert.ok(
              site.map.mapId === undefined ||
                (Number.isInteger(site.map.mapId) && site.map.mapId >= -1),
              context + " map ID",
            );
          }
        }
      }
    }
}
test("Method identities, access and map destinations remain usable in both modes", () =>
  assertTrainingChoices(SKILLS, LOCATIONS));

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
    const character = profile(skill.name, skill.maxLevel, "f2p");
    const stage = trainingStage(skill, character);
    assert.equal(skillNeedsMembership(skill, character), false, skill.name);
    assert.equal(
      stage.to,
      skill.maxLevel,
      skill.name + " falls back to an early guide",
    );
    assert.equal(
      trainingMethod(skill, character, stage).members ?? false,
      false,
      skill.name,
    );
  }
});

const COMBAT = ["Attack", "Strength", "Defence", "Constitution", "Ranged", "Magic", "Necromancy"];
const combatStages = () =>
  COMBAT.flatMap((name) => skillByName(name).stages.map((stage) => ({ skill: name, stage })));

test("Every combat method says when it was checked and which Wiki guide it follows", () => {
  for (const { skill, stage } of combatStages())
    for (const option of stage.options) {
      const context = `${skill} ${stage.from} ${option.id}`;
      assert.equal(option.checked, "2026-11-16", context);
      assert.ok(option.sources?.length, context + " has no source");
      for (const source of option.sources) assert.match(source, /^https:\/\/runescape\.wiki\/w\/\S+$/, context);
    }
});

test("Members see members methods first; F2P keeps the free order and sees none", () => {
  for (const { skill, stage } of combatStages()) {
    const context = `${skill} ${stage.from}`;
    const members = availableTrainingOptions(stage, "members");
    const firstFree = members.findIndex((option) => !option.members);
    if (firstFree >= 0)
      assert.ok(members.slice(firstFree).every((option) => !option.members), context + " has a members method after a free one");
    const free = availableTrainingOptions(stage, "f2p");
    assert.ok(free.every((option) => !option.members), context);
    assert.deepEqual(
      free.map((option) => option.id),
      members.filter((option) => !option.members).map((option) => option.id),
      context + " reorders the free methods",
    );
  }
});

test("Combat minimums stay valid item tiers", () => {
  for (const { skill, stage } of combatStages())
    for (const option of stage.options)
      if (option.gear)
        assert.ok(Number.isInteger(option.gear.minTier) && option.gear.minTier >= 1 && option.gear.minTier <= 99, `${skill} ${option.id}`);
});

test("The level 1 range leads with a quest for members and troll chuckers for free melee", () => {
  const attack = skillByName("Attack").stages[0];
  assert.equal(availableTrainingOptions(attack, "members")[0].id, "waterfall-quest");
  assert.equal(availableTrainingOptions(attack, "f2p")[0].id, "troll-chuckers");
  // A saved method the refresh removed falls back to the range's first method.
  const p = { ...profile("Attack", 60), trainingMethods: { Attack: "cockroach-soldiers" } };
  assert.equal(trainingMethod(skillByName("Attack"), p).id, "abyss-creatures");
  assert.equal(trainingMethod(skillByName("Attack"), { ...p, mode: "f2p" }).id, "ankou");
});

test("A stored member method survives mode changes without being recommended in the free trial", () => {
  const skill = SKILLS.find((skill) => skill.name === "Herblore");
  const p = { ...profile("Herblore", 30), trainingRanges: { Herblore: 13 } };
  assert.equal(trainingStage(skill, p).from, 13);
  assert.equal(trainingStage(skill, { ...p, mode: "f2p" }).from, 1);
  assert.equal(skillNeedsMembership(skill, { ...p, mode: "f2p" }), true);
  assert.equal(trainingStage(skill, p).from, 13);
});
