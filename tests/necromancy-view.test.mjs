import assert from "node:assert/strict";
import test from "node:test";
import { gearPath, killNext, ritualsFor, soulStatus, storyProgress } from "../src/necromancyView.ts";

// What the Necromancy guide shows for a profile (spec: docs/superpowers/specs/2026-11-16-necromancy-guide-design.md,
// worked examples and Review Focus). Example 1 follows Ruling 3: Vessel of the Harbinger comes before The Spirit of War.
const profile = (levels, extra = {}) => ({
  id: "p",
  name: "P",
  kind: "Solo Ironman",
  mode: "members",
  levels,
  completedQuests: [],
  packed: [],
  completedTasks: [],
  activeTask: "",
  notes: {},
  ...extra,
});
const STORY_TO_70 = ["necromancy", "kili-row", "rune-mythos"];
const ALL_STORY = [
  ...STORY_TO_70,
  "vessel-of-the-harbinger",
  "the-spirit-of-war",
  "tomes-of-the-warlock",
  "requiem-for-a-dragon",
  "remains-of-the-necrolord",
  "alpha-vs-omega",
];
const example1 = (extra = {}) =>
  profile({ Necromancy: 64, Defence: 60 }, { completedQuests: STORY_TO_70, ...extra });
const f2p = (necromancy) => profile({ Necromancy: necromancy }, { mode: "f2p" });
const status = (reqs, label) => reqs.find((r) => r.label === label)?.status;

test("Example 1: nothing recorded at Necromancy 64 assumes tier 60 and needs The Spirit of War for tier 70", () => {
  const weapon = gearPath(example1(), "weapon");
  assert.equal(weapon.current, 60);
  assert.equal(weapon.assumed, true);
  assert.equal(weapon.next.step.line, "weapon");
  assert.equal(weapon.next.step.tier, 70);
  const reqs = weapon.next.reqs;
  assert.equal(status(reqs, "Necromancy 70"), "below");
  assert.equal(status(reqs, "The Spirit of War"), "below");
  assert.equal(status(reqs, "Kili's Knowledge V"), "check");
  assert.equal(status(reqs, "4 × Ensouled bar per weapon"), "check");
  assert.equal(status(reqs, "50 × Bone rune per weapon"), "check");
  assert.equal(weapon.endgame, undefined);

  const robe = gearPath(example1(), "robe");
  assert.equal(robe.robeLine, "deathwarden");
  assert.equal(robe.current, 60);
  assert.equal(robe.assumed, true);
  assert.equal(robe.next.step.line, "deathwarden");
  assert.equal(status(robe.next.reqs, "Defence 70"), "below");
});

test("Example 1: the storyline's next quest is Vessel of the Harbinger, and The Spirit of War's souls are unknown", () => {
  const story = storyProgress(example1());
  assert.deepEqual(
    story.filter((s) => s.state === "done").map((s) => s.quest.quest),
    STORY_TO_70,
  );
  assert.deepEqual(
    story.filter((s) => s.state === "next").map((s) => s.quest.quest),
    ["vessel-of-the-harbinger"],
  );
  const vessel = story.find((s) => s.quest.quest === "vessel-of-the-harbinger");
  assert.equal(status(vessel.reqs, "Necromancy 46"), "met");
  assert.equal(status(vessel.reqs, "Prayer 40"), "unknown");
  const war = story.find((s) => s.quest.quest === "the-spirit-of-war");
  assert.equal(war.state, "locked");
  assert.equal(status(war.reqs, "Necromancy 65"), "below");
  assert.equal(status(war.reqs, "3,000 souls"), "unknown");
  // Optional quests are never "next", even when they come first.
  assert.equal(story.find((s) => s.quest.quest === "that-old-black-magic").state, "locked");
});

test("Example 1: kill armoured zombies for XP, complete Vessel of the Harbinger for progress, ensoul bars next", () => {
  const kill = killNext(example1());
  assert.equal(kill.xp.option.id, "armoured-zombies");
  assert.equal(kill.xp.range, "60–79");
  assert.equal(killNext(profile({ Necromancy: 99 })).xp.range, "90–120");
  assert.equal(kill.progress.text, "Complete Vessel of the Harbinger");
  assert.equal(kill.progress.target, "Vessel of the Harbinger");
  assert.equal(status(kill.progress.reqs, "Prayer 40"), "unknown");

  const rituals = ritualsFor(example1());
  assert.equal(rituals.forNextUpgrade, "ensoul-material-unensouled-bar");
  assert.equal(rituals.siteTier, 2);
  assert.ok(rituals.inks.includes("Greater ghostly ink"));
  assert.ok(!rituals.inks.includes("Powerful ghostly ink"));
  assert.ok(rituals.now.every((r) => r.level <= 64));
  assert.equal(rituals.next.level, 80);

  const souls = soulStatus(example1());
  assert.equal(souls.souls, undefined);
  assert.equal(souls.next.souls, 3000);
  assert.equal(souls.next.status, "unknown");
});

test("the XP target follows the player's level, not the range they picked in the method list", () => {
  const kill = killNext(example1({ trainingRanges: { Necromancy: 20 } }));
  assert.equal(kill.xp.option.id, "armoured-zombies");
});

test("Example 2: weapon tier 50 recorded with 3,200 souls", () => {
  const p = example1({ necromancy: { weaponTier: 50, souls: 3200 } });
  const weapon = gearPath(p, "weapon");
  assert.equal(weapon.current, 50);
  assert.equal(weapon.assumed, false);
  assert.equal(weapon.next.step.tier, 60);
  assert.equal(status(weapon.next.reqs, "Kili's Knowledge IV"), "check");
  assert.equal(status(weapon.next.reqs, "3 × Ensouled bar per weapon"), "check");
  assert.equal(status(weapon.next.reqs, "25 × Bone rune per weapon"), "check");
  // The 3,000 gate stays next until The Spirit of War is done, and these souls meet it.
  const souls = soulStatus(p);
  assert.equal(souls.souls, 3200);
  assert.equal(souls.next.souls, 3000);
  assert.equal(souls.next.status, "met");
  assert.equal(status(storyProgress(p).find((s) => s.quest.quest === "the-spirit-of-war").reqs, "3,000 souls"), "met");
});

test("Example 3: free-to-play at Necromancy 15", () => {
  const p = f2p(15);
  assert.deepEqual(
    storyProgress(p).map((s) => [s.quest.quest, s.state]),
    [["necromancy", "next"]],
  );
  const weapon = gearPath(p, "weapon");
  assert.equal(weapon.current, 10);
  assert.equal(weapon.assumed, true);
  assert.equal(weapon.next, undefined);
  assert.equal(weapon.endgame, undefined);
  assert.equal(gearPath(p, "robe").next, undefined);
  assert.equal(soulStatus(p), undefined);
  const kill = killNext(p);
  assert.equal(kill.progress, undefined);
  assert.equal(kill.xp.option.id, "necro-combat");
  const rituals = ritualsFor(p);
  assert.ok(rituals.now.length > 0);
  assert.ok(rituals.now.every((r) => !r.members && r.level <= 15));
  assert.deepEqual([...new Set(rituals.now.map((r) => r.name))], ["Lesser necroplasm", "Lesser communion"]);
  assert.equal(rituals.next, undefined);
  assert.equal(rituals.siteTier, 1);
  assert.equal(rituals.forNextUpgrade, undefined);
});

test("Review Focus 1: a recorded weapon tier leaves the robe tier assumed", () => {
  const p = example1({ necromancy: { weaponTier: 40 } });
  assert.equal(gearPath(p, "weapon").assumed, false);
  const robe = gearPath(p, "robe");
  assert.equal(robe.assumed, true);
  assert.equal(robe.current, 60);
});

test("Review Focus 2: 0 souls is below the gate; unrecorded souls are unknown", () => {
  assert.equal(soulStatus(example1({ necromancy: { souls: 0 } })).next.status, "below");
  assert.equal(soulStatus(example1({ necromancy: { souls: 0 } })).souls, 0);
  assert.equal(soulStatus(example1()).next.status, "unknown");
});

test("after The Spirit of War, the next soul gate is the first one above the recorded souls", () => {
  const done = [...STORY_TO_70, "vessel-of-the-harbinger", "the-spirit-of-war"];
  const p = example1({ completedQuests: done, necromancy: { souls: 3200 } });
  assert.equal(soulStatus(p).next.souls, 4500);
  assert.equal(soulStatus(p).next.status, "below");
});

test("Review Focus 4: a tier 90 weapon has no next step and points at Rasial", () => {
  const p = profile({ Necromancy: 92, Defence: 90 }, { completedQuests: STORY_TO_70, necromancy: { weaponTier: 90 } });
  const weapon = gearPath(p, "weapon");
  assert.equal(weapon.next, undefined);
  assert.equal(weapon.endgame.boss, "Rasial, the First Necromancer");
  assert.equal(status(weapon.endgame.reqs, "Alpha vs Omega"), "below");
  assert.equal(status(weapon.endgame.reqs, "Necromancy 95"), "below");
  assert.equal(killNext(p).progress.text, "Complete Vessel of the Harbinger");
  assert.equal(ritualsFor(p).forNextUpgrade, undefined);
});

test("Ruling 4: Amascut is offered only from Necromancy 95, where Devourer's Guard can be wielded", () => {
  const done = [...STORY_TO_70, "eclipse-of-the-heart"];
  const at = (necromancy) =>
    gearPath(
      profile({ Necromancy: necromancy, Agility: 65 }, { completedQuests: done, necromancy: { weaponTier: 90 } }),
      "weapon",
    ).endgame;
  // At 92 Amascut's own requirements are met, but its drop can't be wielded yet.
  assert.equal(at(92).boss, "Rasial, the First Necromancer");
  // At 95 Rasial still needs Alpha vs Omega, so Amascut is the boss the player qualifies for.
  assert.equal(at(95).boss, "Amascut, the Devourer");
  assert.equal(status(at(95).reqs, "Eclipse of the Heart"), "met");
});

test("with the whole storyline done, a tier 90 weapon's progress is killing Rasial", () => {
  const p = profile(
    { Necromancy: 95, Dungeoneering: 77, Archaeology: 86, Magic: 66, Prayer: 40 },
    { completedQuests: ALL_STORY, necromancy: { weaponTier: 90 } },
  );
  const progress = killNext(p).progress;
  assert.equal(progress.text, "Kill Rasial, the First Necromancer");
  assert.equal(progress.target, "Rasial, the First Necromancer");
  assert.ok(progress.reqs.every((r) => r.status === "met"));
});

test("Review Focus 5: free-to-play at Necromancy 40 stays at tier 10 with free rituals to level 20", () => {
  const p = f2p(40);
  assert.equal(gearPath(p, "weapon").current, 10);
  assert.equal(gearPath(p, "robe").current, 10);
  // A tier recorded while a member doesn't show members gear in free-to-play.
  assert.equal(gearPath({ ...p, necromancy: { weaponTier: 50 } }, "weapon").current, 10);
  const rituals = ritualsFor(p);
  assert.ok(rituals.now.every((r) => !r.members && r.level <= 20));
  // Lesser ensoul material is free in the data but needs Kili Row, a members quest.
  assert.ok(!rituals.now.some((r) => r.name === "Lesser ensoul material"));
  assert.equal(killNext(p).xp.option.id, "necro-combat");
  assert.equal(killNext(p).xp.range, "5–20");
});

test("the assumed tier stops at the first upgrade whose quest isn't done", () => {
  const p = profile({ Necromancy: 64, Defence: 60 }, { completedQuests: ["necromancy"] });
  assert.equal(gearPath(p, "weapon").current, 10);
  assert.equal(gearPath(p, "weapon").next.step.tier, 20);
  assert.equal(killNext(p).progress.text, "Complete Kili Row");
});

test("unknown quest status doesn't cap the assumed tier; only a quest known not done does", () => {
  // A Hiscores profile whose quest import is unavailable: questStatus is unknown for every quest.
  const p = profile(
    { Necromancy: 99, Defence: 99 },
    { source: "hiscores", questImportStatus: "private-or-unavailable" },
  );
  const weapon = gearPath(p, "weapon");
  assert.equal(weapon.assumed, true);
  assert.equal(weapon.current, 90);
  assert.equal(gearPath(p, "robe").current, 90);
  // Recorded below 90, the next step's quest chip is unknown, not below.
  const next = gearPath({ ...p, necromancy: { weaponTier: 60 } }, "weapon").next;
  assert.equal(status(next.reqs, "The Spirit of War"), "unknown");
  // The storyline's chips stay unknown too: souls unrecorded, levels met.
  const war = storyProgress(p).find((s) => s.quest.quest === "the-spirit-of-war");
  assert.equal(status(war.reqs, "Necromancy 65"), "met");
  assert.equal(status(war.reqs, "3,000 souls"), "unknown");
  // Unknown quests aren't sent back as "Complete Necromancy!": at assumed T90 the target is the endgame boss.
  const progress = killNext(p).progress;
  assert.notEqual(progress.text, "Complete Necromancy!");
  assert.equal(progress.text, "Kill Rasial, the First Necromancer");
  // Rituals behind a quest of unknown status are runnable.
  const names = new Set(ritualsFor(p).now.map((r) => r.name));
  for (const name of ["Lesser ensoul material", "Ensoul material", "Greater ensoul material", "Lesser essence", "Powerful essence"])
    assert.ok(names.has(name), name);
  // A manual profile that knows The Spirit of War isn't done still stops at 60.
  assert.equal(gearPath(profile({ Necromancy: 99, Defence: 99 }, { completedQuests: STORY_TO_70 }), "weapon").current, 60);
});

test("members rituals need their quest: ensoul rituals need Kili Row", () => {
  const p = profile({ Necromancy: 64 }, { completedQuests: ["necromancy"] });
  const names = new Set(ritualsFor(p).now.map((r) => r.name));
  assert.ok(names.has("Greater communion"));
  assert.ok(!names.has("Ensoul material"));
  assert.ok(!names.has("Lesser essence"));
  // The next one to unlock is the lowest the player can't run yet, here by doing Kili Row.
  assert.equal(ritualsFor(p).next.name, "Lesser ensoul material");
});

test("progress is the Kili task, with its targets, once the quests are done", () => {
  const p = profile({ Necromancy: 25 }, { completedQuests: ["necromancy", "kili-row"] });
  assert.equal(gearPath(p, "weapon").current, 20);
  const progress = killNext(p).progress;
  assert.equal(progress.text, "Finish Kili's Knowledge I");
  assert.equal(progress.target, "Kili's Knowledge I");
  assert.equal(status(progress.reqs, "Ghostly trolls"), "check");
  assert.equal(status(progress.reqs, "1 × Lesser ensouled bar per weapon"), "check");
});

test("progress is running the ensoul ritual when the step's task is a quest that is done", () => {
  const p = profile({ Necromancy: 25 }, { completedQuests: ["necromancy", "kili-row"], necromancy: { weaponTier: 10 } });
  const next = gearPath(p, "weapon").next;
  assert.equal(next.step.tier, 20);
  // Kili Row is both the task and the quest: one chip, from the quest list.
  assert.equal(next.reqs.filter((r) => r.label === "Kili Row").length, 1);
  assert.equal(status(next.reqs, "Kili Row"), "met");
  const progress = killNext(p).progress;
  assert.equal(progress.text, "Run Lesser ensoul material");
  assert.equal(status(progress.reqs, "1 × Lesser ensouled bar per weapon"), "check");
  assert.equal(ritualsFor(p).forNextUpgrade, "lesser-ensoul-material-lesser-unensouled-bar");
});

test("Ruling 2: Deathdealer branches from Deathwarden tier 60", () => {
  const done = [...STORY_TO_70, "vessel-of-the-harbinger", "the-spirit-of-war"];
  const line = (robeTier, levels = { Necromancy: 70, Defence: 70 }) =>
    gearPath(
      profile(levels, { completedQuests: done, necromancy: { robeTier, robeLine: "deathdealer" } }),
      "robe",
    );
  // Below the branch, the next step is still Deathwarden.
  assert.equal(line(50).next.step.line, "deathwarden");
  assert.equal(line(50).robeLine, "deathdealer");
  const branch = line(60).next;
  assert.equal(branch.step.line, "deathdealer");
  assert.equal(branch.step.tier, 70);
  assert.equal(status(branch.reqs, "Deathwarden tier 60"), "met");
  assert.equal(status(branch.reqs, "Kili's Knowledge V (power)"), "check");
  assert.equal(status(branch.reqs, "5 × Hermodic plate per set"), "check");
  assert.equal(status(branch.reqs, "Necromancy 70"), "met");
  assert.equal(line(70).next.step.tier, 80);
  // Assumed: the highest Deathdealer tier the levels and quests allow.
  const assumed = line(undefined, { Necromancy: 80, Defence: 80 });
  assert.equal(assumed.assumed, true);
  assert.equal(assumed.current, 80);
  assert.equal(assumed.next.step.line, "deathdealer");
  assert.equal(assumed.next.step.tier, 90);
  // Deathdealer needs Necromancy too, so high Defence alone stops at the branch.
  assert.equal(line(undefined, { Necromancy: 64, Defence: 90 }).current, 60);
});

test("a tier 90 robe points at Rasial, never Amascut", () => {
  const p = profile({ Necromancy: 95, Defence: 90, Agility: 65 }, {
    completedQuests: [...STORY_TO_70, "eclipse-of-the-heart"],
    necromancy: { robeTier: 90 },
  });
  const robe = gearPath(p, "robe");
  assert.equal(robe.next, undefined);
  assert.equal(robe.endgame.boss, "Rasial, the First Necromancer");
});
