import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { QUESTS, availableTrainingOptions, skillByName, trainingStage } from "../src/data.ts";
import {
  DISTURBANCES,
  DUNGEONEERING_WEAPONS,
  ENDGAME_TARGETS,
  NECRO_STORY,
  PROGRESS_TARGETS,
  RITUAL_QUESTS,
  SOUL_GATES,
  XP_TARGETS,
  progressKey,
} from "../src/necromancyGuide.ts";
import { NECRO_RITUALS, NECRO_UPGRADES } from "../src/necromancyImported.ts";
import { isSkillName } from "../src/skillNames.ts";

// Hand-judged Necromancy data (spec: docs/superpowers/specs/2026-11-16-necromancy-guide-design.md), checked on the Wiki.
const CHECKED = "2026-11-16";
const WIKI = /^https:\/\/runescape\.wiki\/w\/\S+$/;
const FILE = /^[^\s/]+\.(png|gif)$/;
const quests = new Map(QUESTS.map((q) => [q.id, q]));
const necromancy = skillByName("Necromancy");

const dated = (entry, label) => {
  assert.equal(entry.checked, CHECKED, `${label} checked`);
  assert.ok(entry.sources.length > 0, `${label} has sources`);
  // CheckedSources keys its links by URL, so a repeat would break the render.
  assert.equal(new Set(entry.sources).size, entry.sources.length, `${label} sources are unique`);
  for (const url of entry.sources) assert.match(url, WIKI, `${label} source ${url}`);
  if (entry.mainNote !== undefined) assert.ok(entry.mainNote.trim(), `${label} mainNote`);
};
const text = (value, label) => assert.ok(typeof value === "string" && value.trim(), `${label} text`);
const image = (file, label) => {
  if (file !== undefined) assert.match(file, FILE, `${label} image`);
};

test("the guide module imports types only, so it stays out of the main chunk", () => {
  const source = readFileSync(new URL("../src/necromancyGuide.ts", import.meta.url), "utf8");
  const imports = source.split(/\r?\n/).filter((l) => /^import\b/.test(l));
  for (const line of imports) assert.match(line, /^import type /, line);
});

test("the storyline names real quests, in level order, with their icons", () => {
  assert.equal(NECRO_STORY[0].quest, "necromancy");
  assert.equal(new Set(NECRO_STORY.map((s) => s.quest)).size, NECRO_STORY.length, "each quest once");
  let level = 0;
  for (const step of NECRO_STORY) {
    const quest = quests.get(step.quest);
    assert.ok(quest, `${step.quest} is a QUESTS id`);
    // The page shows the quest's own icon, so every storyline quest needs one.
    assert.ok(quest.icon, `${step.quest} icon`);
    assert.equal(step.members, quest.members, `${step.quest} members`);
    assert.ok(step.level >= level, `${step.quest} is in level order`);
    level = step.level;
    const listed = quest.requirements.find((r) => r.skill === "Necromancy")?.level;
    if (listed !== undefined) assert.equal(step.level, listed, `${step.quest} level matches QUESTS`);
    if (step.souls !== undefined) {
      assert.ok(SOUL_GATES.some((g) => g.souls === step.souls), `${step.quest} souls is a soul gate`);
    }
    if (step.optional !== undefined) assert.equal(step.optional, true, `${step.quest} optional is only ever true`);
    text(step.unlocks, step.quest);
    dated(step, step.quest);
  }
});

test("the main storyline is complete", () => {
  const main = NECRO_STORY.filter((s) => !s.optional).map((s) => s.quest);
  assert.deepEqual(main, [
    "necromancy",
    "kili-row",
    "rune-mythos",
    "vessel-of-the-harbinger",
    "the-spirit-of-war",
    "tomes-of-the-warlock",
    "requiem-for-a-dragon",
    "remains-of-the-necrolord",
    "alpha-vs-omega",
  ]);
});

test("soul gates are the Wiki's, ascending", () => {
  assert.deepEqual(
    SOUL_GATES.map((g) => g.souls),
    [3000, 4500, 8500, 30000, 35000],
  );
  for (const gate of SOUL_GATES) {
    text(gate.unlocks, `${gate.souls} souls`);
    dated(gate, `${gate.souls} souls`);
  }
});

// The app picks a training stage with trainingStage (level in [from, to), else the last stage) and then filters its
// options by access mode, so an option id resolves to the option in that stage. Every level an XP target covers must
// resolve its id there, or the page would show a different method than the one judged.
const resolves = (mode, level, id) => {
  const profile = { levels: { Necromancy: level }, mode };
  const stage = trainingStage(necromancy, profile);
  return availableTrainingOptions(stage, mode).some((o) => o.id === id);
};
const covers = (targets, upTo) => {
  const sorted = [...targets].sort((a, b) => a.from - b.from);
  assert.equal(sorted[0].from, 1, "starts at 1");
  for (let i = 1; i < sorted.length; i++) assert.equal(sorted[i].from, sorted[i - 1].to, `no gap or overlap at ${sorted[i].from}`);
  assert.ok(sorted.at(-1).to >= upTo, `reaches ${upTo}`);
};

test("XP targets cover 1-120 for members and 1-20 for free-to-play, with no gaps", () => {
  covers(XP_TARGETS, 120);
  assert.equal(XP_TARGETS.at(-1).to, 120);
  const free = XP_TARGETS.filter((t) => !t.members);
  covers(free, 20);
  // The free cap is inclusive: an F2P level is clamped to 20, so the last free entry ends exactly there.
  assert.equal(free.at(-1).to, 20);
});

test("every XP target resolves to its option in the stage the app picks", () => {
  for (const t of XP_TARGETS) {
    const label = `${t.from}-${t.to} ${t.optionId}`;
    assert.ok(t.from < t.to, `${label} range`);
    text(t.note, label);
    dated(t, label);
    for (let level = t.from; level < t.to || (t.to === 120 && level === 120); level++) {
      assert.ok(resolves("members", level, t.optionId), `${label} at ${level} (members)`);
      if (t.altOptionId) assert.ok(resolves("members", level, t.altOptionId), `${label} alternative at ${level}`);
    }
    if (!t.members) {
      // Free entries also cover the F2P cap itself, where most free profiles sit.
      for (let level = t.from; level < t.to || level === 20; level++) {
        if (level > 20) break;
        assert.ok(resolves("f2p", level, t.optionId), `${label} at ${level} (free)`);
      }
    }
  }
});

const target = (t, label) => {
  text(t.name, label);
  text(t.wiki, `${label} wiki`);
  text(t.detail, `${label} detail`);
  image(t.image, label);
};

test("every upgrade step with a Kili task has exactly one progress target, and nothing else does", () => {
  const steps = NECRO_UPGRADES.filter((s) => s.task);
  const keys = steps.map((s) => progressKey(s.line, s.tier));
  assert.deepEqual(Object.keys(PROGRESS_TARGETS).sort(), [...keys].sort());
  for (const step of steps) {
    const key = progressKey(step.line, step.tier);
    const entry = PROGRESS_TARGETS[key];
    assert.equal(entry.line, step.line, `${key} line`);
    assert.equal(entry.tier, step.tier, `${key} tier`);
    assert.equal(entry.task, step.task, `${key} task`);
    assert.ok(entry.targets.length > 0, `${key} names its targets`);
    entry.targets.forEach((t, i) => target(t, `${key} target ${i}`));
    if (entry.requires !== undefined) text(entry.requires, `${key} requires`);
    if (entry.note !== undefined) text(entry.note, `${key} note`);
    if (entry.drop) {
      // A boss drop must be one of the step's imported materials, in the same quantity.
      const material = step.materials.find((m) => m.item === entry.drop.item);
      assert.ok(material, `${key} drop ${entry.drop.item} is a material`);
      assert.equal(entry.drop.qty, material.qty, `${key} drop quantity`);
      text(entry.drop.rate, `${key} drop rate`);
      image(entry.drop.image, `${key} drop`);
      target(entry.drop.from, `${key} drop source`);
    }
    dated(entry, key);
  }
});

test("tier 10 steps have no progress target, and every later step has one", () => {
  // Tier 10 comes from Necromancy! with no Kili task; callers fall back to the step's quest.
  for (const step of NECRO_UPGRADES) {
    const key = progressKey(step.line, step.tier);
    if (step.tier === 10) assert.equal(PROGRESS_TARGETS[key], undefined, `${key} has no entry`);
    else assert.ok(PROGRESS_TARGETS[key], `${key} has an entry`);
  }
  assert.ok(NECRO_UPGRADES.some((s) => s.tier === 10), "the import has tier 10 steps");
});

test("every Deathdealer step names Hermod for its hermodic plates", () => {
  for (const step of NECRO_UPGRADES.filter((s) => s.materials.some((m) => m.item === "Hermodic plate"))) {
    const entry = PROGRESS_TARGETS[progressKey(step.line, step.tier)];
    assert.equal(entry.drop?.item, "Hermodic plate", `${step.line} ${step.tier}`);
    assert.equal(entry.drop.from.wiki, "Hermod, the Spirit of War");
  }
});

test("the tier 95 bosses carry their requirements", () => {
  assert.deepEqual(
    ENDGAME_TARGETS.map((b) => b.boss),
    ["Rasial, the First Necromancer", "Amascut, the Devourer"],
  );
  for (const boss of ENDGAME_TARGETS) {
    assert.ok(boss.lines.length > 0 && boss.lines.every((l) => l === "weapon" || l === "robe"), `${boss.boss} lines`);
    assert.ok(boss.quests.length > 0, `${boss.boss} needs a quest`);
    for (const id of boss.quests) assert.ok(quests.has(id), `${boss.boss} quest ${id}`);
    for (const { skill, level } of boss.skills) {
      assert.ok(isSkillName(skill), `${boss.boss} skill ${skill}`);
      assert.ok(Number.isInteger(level) && level > 0, `${boss.boss} ${skill} level`);
    }
    assert.ok(boss.drops.length > 0, `${boss.boss} drops`);
    for (const drop of boss.drops) {
      text(drop.item, `${boss.boss} drop`);
      text(drop.rate, `${boss.boss} ${drop.item} rate`);
      image(drop.image, `${boss.boss} ${drop.item}`);
    }
    text(boss.wiki, `${boss.boss} wiki`);
    text(boss.note, boss.boss);
    image(boss.image, boss.boss);
    dated(boss, boss.boss);
  }
  // Devourer's Guard is a main-hand weapon, so Amascut only moves the weapon line.
  assert.deepEqual(ENDGAME_TARGETS[1].lines, ["weapon"]);
  // It needs 95 Necromancy to wield, above the 90 to fight Amascut, so the guide offers it only from 95.
  assert.equal(ENDGAME_TARGETS[1].wield, 95);
  for (const boss of ENDGAME_TARGETS) {
    if (boss.wield !== undefined) assert.ok(Number.isInteger(boss.wield) && boss.wield > 0, `${boss.boss} wield`);
  }
});

test("ritual quest gates name real rituals and quests", () => {
  const names = new Set(NECRO_RITUALS.map((r) => r.name));
  assert.ok(Object.keys(RITUAL_QUESTS).length > 0);
  for (const [name, gate] of Object.entries(RITUAL_QUESTS)) {
    assert.ok(names.has(name), `${name} is a ritual`);
    assert.ok(quests.has(gate.quest), `${name} quest ${gate.quest}`);
    dated(gate, name);
  }
});

test("the disturbances line is cited", () => {
  text(DISTURBANCES.note, "disturbances");
  dated(DISTURBANCES, "disturbances");
});

test("the Dungeoneering weapons are cited, in level order", () => {
  assert.deepEqual(
    DUNGEONEERING_WEAPONS.map((w) => [w.name, w.level]),
    [
      ["Gravite", 55],
      ["Chaotic", 80],
      ["Ruinous", 90],
    ],
  );
  for (const w of DUNGEONEERING_WEAPONS) {
    assert.ok(Number.isInteger(w.dungeoneering) && w.dungeoneering > 0, `${w.name} Dungeoneering`);
    assert.ok(w.purchases.length > 0, `${w.name} purchases`);
    for (const p of w.purchases) {
      assert.ok(p.items.length > 0, `${w.name} items`);
      assert.ok(Number.isInteger(p.tokens) && p.tokens > 0, `${w.name} tokens`);
      if (p.plus !== undefined) text(p.plus, `${w.name} plus`);
      image(p.image, w.name);
    }
    text(w.note, w.name);
    if (w.unverified !== undefined) text(w.unverified, `${w.name} unverified`);
    dated(w, w.name);
  }
});
