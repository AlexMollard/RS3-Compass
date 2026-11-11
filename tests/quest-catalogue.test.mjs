import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import {
  QUESTS,
  SAMPLE_PROFILES,
  nextQuest,
  progressionQuests,
} from "../src/data.ts";
import { LOCATIONS } from "../src/locations.ts";
import { RS3_SKILL_NAMES } from "../src/skillNames.ts";
import { tokenizeGameText } from "../src/lib/gameText.ts";

const inventory = JSON.parse(
  readFileSync(
    new URL("./fixtures/f2p-inventory-2026-11-04.json", import.meta.url),
    "utf8",
  ),
);
const key = (value) =>
  value.normalize("NFKC").replaceAll("’", "'").toLowerCase();

function assertCoverage(quests) {
  const actual = quests
    .filter((q) => !q.members)
    .map((q) => ({ name: q.name, kind: q.kind ?? "quest" }))
    .sort((a, b) => a.name.localeCompare(b.name));
  const expected = inventory.activities
    .map(({ name, kind }) => ({ name, kind }))
    .sort((a, b) => a.name.localeCompare(b.name));
  assert.deepEqual(actual, expected);
}
function assertUniqueIdentities(quests) {
  for (const field of ["id", "name"]) {
    const seen = new Set();
    const duplicates = [];
    for (const quest of quests) {
      const value = key(quest[field]);
      if (seen.has(value)) duplicates.push(quest[field]);
      seen.add(value);
    }
    assert.deepEqual(duplicates, [], "Duplicate quest " + field);
  }
}
function assertReferences(quests) {
  const ids = new Set(quests.map((q) => q.id));
  const missing = [];
  for (const quest of quests) {
    if (!LOCATIONS[quest.start.location])
      missing.push(quest.id + " location: " + quest.start.location);
    for (const id of quest.questRequirements)
      if (!ids.has(id)) missing.push(quest.id + " prerequisite: " + id);
  }
  assert.deepEqual(missing, []);
}
function assertEnums(quests) {
  const skills = new Set(RS3_SKILL_NAMES);
  for (const quest of quests) {
    assert.ok(
      [undefined, "quest", "miniquest", "saga"].includes(quest.kind),
      quest.id + " kind",
    );
    assert.ok(
      [undefined, "seasonal", "tutorial"].includes(quest.availability),
      quest.id + " availability",
    );
    const targets = new Set();
    for (const level of quest.requirements) {
      assert.ok(skills.has(level.skill), quest.id + ": " + level.skill);
      assert.ok(
        Number.isInteger(level.level) && level.level >= 1 && level.level <= 120,
        quest.id + " level",
      );
      const target =
        level.skill + ":" + level.level + ":" + Boolean(level.recommended);
      assert.equal(
        targets.has(target),
        false,
        quest.id + " duplicate target: " + target,
      );
      targets.add(target);
    }
  }
}
function assertAcyclic(quests) {
  const byId = new Map(quests.map((q) => [q.id, q]));
  const visited = new Set();
  const visiting = new Set();
  function visit(id, path) {
    assert.equal(
      visiting.has(id),
      false,
      "Prerequisite cycle: " + [...path, id].join(" -> "),
    );
    if (visited.has(id)) return;
    visiting.add(id);
    for (const dependency of byId.get(id).questRequirements)
      visit(dependency, [...path, id]);
    visiting.delete(id);
    visited.add(id);
  }
  for (const quest of quests) visit(quest.id, []);
}

test("The November 2026 Wiki/Jagex inventory is covered without substituting historical quests", () =>
  assertCoverage(QUESTS));
test("Quest identifiers and lookup titles are unambiguous case-insensitively", () =>
  assertUniqueIdentities(QUESTS));
test("Every quest prerequisite and starter location resolves", () =>
  assertReferences(QUESTS));
test("Each quest lists every prerequisite once (a duplicate crashes the quest page)", () => {
  const repeated = QUESTS.filter(
    (q) => new Set(q.questRequirements).size !== q.questRequirements.length,
  ).map((q) => q.id);
  assert.deepEqual(repeated, []);
});
test("Imported quest-point requirements stay visible as preparation notes", () => {
  const needs = {
    "heroes-quest": 56,
    "legends-quest": 107,
    "recipe-for-disaster-defeating-the-culinaromancer": 176,
    "carnillean-rising": 50,
    "tears-of-guthix-quest": 44,
    wanted: 33,
    "enlightened-journey": 21,
  };
  for (const [id, points] of Object.entries(needs))
    assert.ok(
      QUESTS.find((q) => q.id === id)?.preparationNotes?.includes(`Requires ${points} quest points.`),
      id,
    );
});
test("Quest kinds, availability and level checks use valid domain identities", () =>
  assertEnums(QUESTS));
test("Quest prerequisites cannot soft-lock progression with a cycle", () =>
  assertAcyclic(QUESTS));

test("Seasonal, tutorial and member-only completion do not block the ordinary F2P queue", () => {
  const profile = structuredClone(SAMPLE_PROFILES[0]);
  profile.mode = "f2p";
  profile.completedQuests = QUESTS.filter(
    (q) => !q.availability && !q.completionMembers,
  ).map((q) => q.id);
  assert.equal(nextQuest(profile), undefined);
  profile.mode = "members";
  assert.equal(nextQuest(profile)?.id, "benedicts-world-tour");
});

test("The ordinary route omits event, tutorial and partial-access activities without removing them from the catalogue", () => {
  const profile = { ...structuredClone(SAMPLE_PROFILES[0]), mode: "f2p" };
  const unavailable = [
    "learning-the-ropes",
    "its-snow-bother",
    "a-christmas-reunion",
    "cold-front",
    "great-egg-spectations",
    "corporate-egg-spionage",
    "field-of-screams",
    "guys-and-dolls",
    "all-souls-eve",
    "benedicts-world-tour",
  ];
  const route = new Set(progressionQuests(profile).map((quest) => quest.id));
  for (const id of unavailable) {
    assert.equal(
      route.has(id),
      false,
      id + " leaked into the ordinary F2P route",
    );
    assert.ok(
      QUESTS.some((quest) => quest.id === id),
      id + " disappeared from the catalogue",
    );
  }
  profile.mode = "members";
  assert.ok(
    progressionQuests(profile).some(
      (quest) => quest.id === "benedicts-world-tour",
    ),
  );
});

test("Item plurals and upgraded equipment resolve to the correct linked artwork", () => {
  for (const [text, expected, image] of [
    ["20 balls of wool", "Ball of wool", "Ball of wool.png"],
    ["2 raw sardines", "Raw sardine", "Raw sardine.png"],
    [
      "adamant platebody + 2",
      "Adamant platebody + 2",
      "Adamant platebody + 2.png",
    ],
    ["fairylight whip", "Fairylight whip", "Fairylight whip.png"],
    ["rat's tail", "Rat's tail", "Rat's tail.png"],
    ["limestone bricks", "Limestone brick", "Limestone brick.png"],
    [
      "five ancient bones",
      "Ancient bones (The Restless Ghost)",
      "Ancient bones (The Restless Ghost).png",
    ],
  ]) {
    const references = tokenizeGameText(text)
      .filter((part) => part.reference)
      .map((part) => part.reference);
    assert.deepEqual(
      references.map((reference) => ({
        wiki: reference.wiki.replaceAll("_", " "),
        image: reference.image?.replaceAll("_", " "),
      })),
      [{ wiki: expected, image }],
    );
  }
});

test("Miniquest names without their journal suffix still link to their correct Wiki article", () => {
  const references = tokenizeGameText(
    "Doric's Task II follows Doric's Task I.",
  ).filter((part) => part.reference);
  assert.deepEqual(
    references.map((part) => part.reference.wiki.replaceAll("_", " ")),
    ["Doric's Task II (miniquest)", "Doric's Task I (miniquest)"],
  );
});
