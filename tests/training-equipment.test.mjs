import test from "node:test";
import assert from "node:assert/strict";
import {
  SKILLS,
  SAMPLE_PROFILES,
  availableStages,
  availableTrainingOptions,
} from "../src/data.ts";
import { EQUIPMENT_IMPORTED } from "../src/equipmentImported.ts";
import { EQUIPMENT_ITEMS } from "../src/equipmentExtras.ts";
import { gearClass, gearRowLabel, trainingGear } from "../src/trainingEquipment.ts";
import { tokenizeGameText } from "../src/lib/gameText.ts";

const character = (levels = {}, mode = "members", kind = "Solo Ironman") => ({
  ...structuredClone(SAMPLE_PROFILES[0]),
  levels,
  mode,
  kind,
});
const skillOf = (name) => SKILLS.find((skill) => skill.name === name);
const methodOf = (skillName, id) =>
  skillOf(skillName)
    .stages.flatMap((stage) => stage.options)
    .find((option) => option.id === id);
const maxed = Object.fromEntries(
  ["Attack", "Strength", "Defence", "Ranged", "Magic", "Necromancy", "Constitution", "Slayer", "Prayer"].map((s) => [s, 99]),
);
const COMBAT = ["Attack", "Strength", "Defence", "Constitution", "Ranged", "Magic", "Slayer", "Necromancy"];
const RITUALS = ["communion", "greater-communion", "powerful-communion"];
const combatMethods = () =>
  COMBAT.flatMap((name) =>
    skillOf(name).stages.flatMap((stage) =>
      stage.options.filter((o) => !RITUALS.includes(o.id)).map((option) => ({ skill: name, stage, option })),
    ),
  );

test("Every combat method has a Wiki-checked minimum with a stated reason", () => {
  const methods = combatMethods();
  assert.ok(methods.length > 40);
  for (const { skill, option } of methods) {
    const context = `${skill} ${option.id} (${option.title})`;
    assert.ok(option.gear, context + " has no gear minimum");
    assert.equal(option.gear.checked, "2026-11-16", context);
    assert.ok(Number.isInteger(option.gear.minTier) && option.gear.minTier >= 1 && option.gear.minTier <= 99, context);
    assert.ok(option.gear.reason.trim().length > 20, context + " needs a real reason");
  }
  for (const id of RITUALS) assert.equal(methodOf("Necromancy", id).gear, undefined, id);
});

test("Necromancy at hill giants keeps its own minimum rather than the chickens'", () => {
  const stages = skillOf("Necromancy").stages;
  const chickens = stages[0].options.find((o) => o.id === "necro-combat");
  const giants = stages[1].options.find((o) => o.id === "necro-combat");
  assert.match(giants.gear.reason, /giant/i);
  assert.ok(giants.gear.minTier > chickens.gear.minTier);
});

test("Skills map to the documented gear class", () => {
  assert.equal(gearClass("Attack"), "melee");
  assert.equal(gearClass("Strength"), "melee");
  assert.equal(gearClass("Ranged"), "ranged");
  assert.equal(gearClass("Magic"), "magic");
  assert.equal(gearClass("Necromancy"), "necromancy");
  assert.equal(gearClass("Defence", "ranged"), "ranged");
  assert.equal(gearClass("Constitution", "magic"), "magic");
  assert.equal(gearClass("Slayer", "necromancy"), "necromancy");
  assert.equal(gearClass("Mining"), "tool");
  assert.equal(gearClass("Woodcutting"), "tool");
  assert.equal(gearClass("Archaeology"), "tool");
  assert.equal(gearClass("Prayer"), undefined);
  assert.equal(gearClass("Fishing"), undefined);
});

test("Attack at 85 shows the 2h setup beside the dual-wield main hand and off hand", () => {
  const { rows } = trainingGear("Attack", methodOf("Attack", "ankou"), character({ Attack: 85, Defence: 82 }));
  const names = rows.map((row) => row.row);
  for (const name of ["2h", "main hand", "off hand", "body"]) assert.ok(names.includes(name), name);
  const twoH = rows.find((row) => row.row === "2h");
  assert.equal(twoH.best.item.slot, "2h");
  assert.ok(twoH.best.item.wear.every((w) => w.skill !== "Attack" || w.level <= 85));
  assert.equal(rows.find((row) => row.row === "main hand").best.item.slot, "weapon");
  assert.equal(rows.find((row) => row.row === "off hand").best.item.slot, "off-hand weapon");
  // Body is judged on the recorded Defence level, not on the bottom of the range.
  const body = rows.find((row) => row.row === "body").best.item;
  assert.ok(body.tier > 50 && body.wear.every((w) => w.skill !== "Defence" || w.level <= 82), body.name);
  assert.equal(twoH.atLeast.reason, methodOf("Attack", "ankou").gear.reason);
});

test("Defence, Constitution and Slayer take their rows from the chosen style", () => {
  const profile = character({ Ranged: 70, Defence: 70, Magic: 70, Slayer: 80 });
  for (const skill of ["Defence", "Constitution"]) {
    const { rows } = trainingGear(skill, methodOf(skill, "ankou"), profile, "ranged");
    const picked = rows.flatMap((row) => [row.best, row.easier, row.atLeast]).filter(Boolean);
    assert.ok(picked.length > 0, skill);
    assert.ok(picked.every((pick) => pick.item.class === "ranged"), skill);
  }
  const { rows } = trainingGear("Slayer", methodOf("Slayer", "sumona"), profile, "magic");
  assert.ok(rows.flatMap((row) => [row.best]).filter(Boolean).every((pick) => pick.item.class === "magic"));
});

test("Slayer keeps its finishers and assignment tools as extras", () => {
  const profile = character({ Slayer: 80, Attack: 70, Defence: 70 });
  const gargoyles = trainingGear("Slayer", methodOf("Slayer", "gargoyles"), profile, "melee");
  assert.ok(gargoyles.extras.some((item) => item.name === "Rock hammer"));
  assert.equal(new Set(gargoyles.extras.map((item) => item.name)).size, gargoyles.extras.length);
  const sumona = trainingGear("Slayer", methodOf("Slayer", "sumona"), profile, "ranged");
  for (const name of ["Rock hammer", "Earmuffs", "Enchanted gem"])
    assert.ok(sumona.extras.some((item) => item.name === name), name);
  const free = trainingGear("Slayer", methodOf("Slayer", "jacquelyn"), character({ Slayer: 1 }, "f2p"), "melee");
  assert.ok(free.extras.every((item) => !item.members));
});

test("Dragon methods carry the protection that fits the style", () => {
  const profile = character({ Attack: 60, Ranged: 60, Magic: 60, Necromancy: 60, Defence: 60 });
  const dragons = methodOf("Defence", "blue-dragons");
  for (const style of ["melee", "ranged", "magic"]) {
    const { extras } = trainingGear("Defence", dragons, profile, style);
    assert.ok(extras.some((item) => item.name === "Anti-dragon shield"), style);
  }
  const necro = trainingGear("Defence", dragons, profile, "necromancy");
  assert.ok(necro.extras.some((item) => item.name === "Super antifire (3)"));
  assert.ok(!necro.extras.some((item) => item.name === "Anti-dragon shield"));
  const wild = methodOf("Constitution", "wilderness-blue-dragons");
  const freeNecro = trainingGear("Constitution", wild, character({ Necromancy: 20, Defence: 50 }, "f2p"), "necromancy");
  assert.deepEqual(freeNecro.rows, []);
  assert.match(freeNecro.note, /super antifire/i);
});

test("An unrecorded wear level asks for the level instead of falling back to bronze", () => {
  const { rows } = trainingGear("Attack", methodOf("Attack", "cows"), character({ Attack: 40 }));
  const body = rows.find((row) => row.row === "body");
  assert.equal(body.unrecorded, "Defence");
  assert.equal(body.best, undefined);
  assert.ok(rows.find((row) => row.row === "2h").best, "the weapon row still works off Attack");
});

test("F2P hides members gear and every combat row has a reachable minimum", () => {
  for (const mode of ["f2p", "members"])
    for (const name of ["Attack", "Strength", "Ranged", "Magic", "Necromancy"]) {
      const skill = skillOf(name);
      for (const stage of availableStages(skill, mode))
        for (const option of availableTrainingOptions(stage, mode)) {
          if (!option.gear) continue;
          const levels = mode === "f2p" && name === "Necromancy" ? { Necromancy: 20, Defence: 99 } : maxed;
          const { rows } = trainingGear(name, option, character(levels, mode));
          const context = `${name} ${option.id} ${mode}`;
          assert.ok(rows.length > 0, context);
          for (const row of rows) {
            for (const pick of [row.best, row.easier, row.atLeast, row.next].filter(Boolean))
              if (mode === "f2p") assert.equal(pick.item.members, false, context + " " + pick.item.name);
            if (row.best) assert.ok(row.atLeast, `${context} ${row.row} has no minimum`);
          }
        }
    }
});

test("Tool skills show the tool row with no invented minimum", () => {
  const mining = skillOf("Mining");
  const option = mining.stages.at(-1).options.at(-1);
  const { rows, extras } = trainingGear("Mining", option, character({ Mining: 61, Smithing: 60 }));
  assert.deepEqual(
    rows.map((row) => row.row),
    ["tool"],
  );
  assert.equal(rows[0].best.item.tool, "pickaxe");
  assert.equal(rows[0].atLeast, undefined);
  assert.ok(extras.some((item) => /ore box$/.test(item.name)));
  const archaeology = skillOf("Archaeology").stages[0].options[0];
  assert.equal(trainingGear("Archaeology", archaeology, character({ Archaeology: 50 })).rows[0].best.item.tool, "mattock");
});

test("Woodcutting picks a hatchet by its curated Woodcutting level", () => {
  const method = skillOf("Woodcutting").stages[0].options[0];
  const best = (level, mode) => trainingGear("Woodcutting", method, character({ Woodcutting: level }, mode)).rows[0];
  assert.equal(best(1, "f2p").best.item.name, "Bronze hatchet");
  assert.equal(best(50, "f2p").best.item.name, "Rune hatchet");
  assert.equal(best(50, "members").best.item.name, "Rune hatchet");
  assert.deepEqual(best(50, "members").best.missing, []);
  assert.equal(best(60, "members").best.item.name, "Dragon hatchet");
});

test("The tool row is named after the skill's tool, with or without a pick", () => {
  assert.equal(gearRowLabel("tool", "Woodcutting"), "Hatchet");
  assert.equal(gearRowLabel("tool", "Mining"), "Pickaxe");
  assert.equal(gearRowLabel("tool", "Archaeology"), "Mattock");
  assert.equal(gearRowLabel("2h", "Attack"), "Two-handed");
  const { rows } = trainingGear("Woodcutting", skillOf("Woodcutting").stages[0].options[0], character({}));
  assert.equal(rows[0].unrecorded, "Woodcutting");
});

test("Ranged lists ammunition for its level, with Lowe's arrows on F2P", () => {
  const ankou = methodOf("Ranged", "ankou");
  const ammo = (profile, method = ankou, skill = "Ranged", style) =>
    trainingGear(skill, method, profile, style).extras.filter((item) => /arrow|bolts/i.test(item.name));
  assert.equal(ammo(character({ Ranged: 80 })).length, 1);
  assert.equal(ammo(character({ Ranged: 80 }))[0].name, "Bane arrow");
  const free = ammo(character({ Ranged: 45 }, "f2p"));
  assert.equal(free[0].name, "Adamant arrow");
  assert.match(free[0].acquisition[0].note, /Lowe/);
  assert.equal(ammo(character({ Ranged: 60 }), methodOf("Ranged", "blue-dragons"))[0].name, "Rune bolts");
  assert.ok(ammo(character({ Ranged: 70, Slayer: 80 }), methodOf("Slayer", "sumona"), "Slayer", "ranged").length);
  assert.equal(ammo(character({ Attack: 80 }), methodOf("Attack", "ankou"), "Attack").length, 0);
});

test("At equal tier the more ordinary route is easier and the minimum", () => {
  const profile = character({ Attack: 85, Defence: 82 });
  const { rows } = trainingGear("Attack", methodOf("Attack", "ankou"), profile);
  const hands = rows.find((row) => row.row === "hands");
  assert.notEqual(hands.atLeast.item.name, "Penance gloves");
  for (const row of rows)
    for (const pick of [row.easier, row.atLeast].filter(Boolean))
      assert.ok(!/^Golden Linza/.test(pick.item.name), pick.item.name);
});

test("Ore-box planning follows Mining progression without inventing a Mining use requirement", () => {
  const method = skillOf("Mining").stages[0].options[0];
  const box = (levels) => trainingGear("Mining", method, character(levels)).extras.find((item) => item.slot === "ore box");
  assert.equal(box({ Mining: 12, Smithing: 8 }).name, "Iron ore box");
  assert.equal(box({}), undefined, "an unrecorded Mining level shows no ore box rather than bronze");
});

test("Inside-floor equipment follows recorded combat level without pretending dungeon level grants weapon access", () => {
  const method = skillOf("Dungeoneering").stages[0].options[0];
  const sword = (levels, mode) => trainingGear("Dungeoneering", method, character(levels, mode)).extras[0].name;
  assert.equal(sword({ Dungeoneering: 1, Attack: 85 }, "f2p"), "Zephyrium 2h sword");
  assert.equal(sword({ Dungeoneering: 1, Attack: 85 }, "members"), "Gorgonite 2h sword");
  assert.equal(sword({ Dungeoneering: 99 }, "f2p"), "Novite 2h sword");
});

test("Method-specific skilling tools stay with their method", () => {
  const fishing = skillOf("Fishing");
  const fly = fishing.stages.flatMap((s) => s.options).find((o) => o.id === "fly-fishing");
  const { rows, extras } = trainingGear("Fishing", fly, character({ Fishing: 30 }, "f2p"));
  assert.deepEqual(rows, []);
  assert.deepEqual(
    extras.map((item) => item.name),
    ["Fly fishing rod"],
  );
});

test("Imported gear carries the name, Wiki page and art its item link needs", () => {
  assert.ok(EQUIPMENT_IMPORTED.length > 500);
  for (const item of EQUIPMENT_IMPORTED) {
    assert.ok(
      [item.name, item.wiki].every((value) => typeof value === "string" && value.trim()),
      item.name + " incomplete item reference",
    );
    // A few Wiki pages have no item image (Mindspike); the table then shows the name alone.
    assert.ok(item.image === undefined || /^[^/\s][^/]*\.(png|gif)$/i.test(item.image), item.name + " " + item.image);
  }
  assert.ok(EQUIPMENT_IMPORTED.filter((item) => !item.image).length < 10);
});

test("The text catalogue links extras and materials without the imported catalogue", () => {
  const names = new Set(EQUIPMENT_ITEMS.map((item) => item.name));
  for (const name of ["Rock hammer", "Anti-dragon shield", "Earmuffs", "Super antifire (3)", "Rune bolts"])
    assert.ok(names.has(name), name);
  assert.ok(!names.has("Rune pickaxe"), "tool ladders are imported, not hand-written");
  assert.equal(names.size, EQUIPMENT_ITEMS.length);
});

test("Recipe plurals and potion names resolve to the intended item and dose", () => {
  const references = tokenizeGameText(
    "20 spirit runes, super antifire, blue dragonhides, spider silk and a desert phoenix feather",
  )
    .filter((segment) => segment.reference?.kind === "item")
    .map((segment) => [segment.reference.wiki, segment.reference.image]);
  assert.deepEqual(references, [
    ["Spirit rune", "Spirit_rune.png"],
    ["Super antifire (3)", "Super_antifire_(3).png"],
    ["Blue dragonhide", "Blue_dragonhide.png"],
    ["Spider silk", "Spider_silk.png"],
    ["Phoenix feather", "Phoenix_feather.png"],
  ]);
});
