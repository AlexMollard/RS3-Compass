import test from "node:test";
import assert from "node:assert/strict";
import {
  SKILLS,
  SAMPLE_PROFILES,
  availableStages,
  availableTrainingOptions,
} from "../src/data.ts";
import { RS3_SKILL_NAMES } from "../src/skillNames.ts";
import {
  EQUIPMENT_GUIDES,
  equipmentLevels,
  resolveTrainingEquipment,
  selectEquipment,
} from "../src/trainingEquipment.ts";
import { tokenizeGameText } from "../src/lib/gameText.ts";

const character = (levels = {}, mode = "f2p") => ({
  ...structuredClone(SAMPLE_PROFILES[0]),
  levels,
  mode,
});
const attack = SKILLS.find((skill) => skill.name === "Attack");
const range = attack.stages.find((stage) => stage.from === 20);
const method = range.options[0];
const row = (name, from, extra = {}) => ({
  name,
  wiki: name,
  image: "Iron_dagger.png",
  from,
  levels: [{ skill: "Attack", level: from }],
  slot: "weapon",
  note: "A training weapon.",
  acquisition: [{ label: "Make", note: "Make with your own materials." }],
  ...extra,
});

function assertLevels(levels, context) {
  for (const requirement of levels ?? []) {
    assert.ok(
      RS3_SKILL_NAMES.includes(requirement.skill),
      context + " unknown required skill",
    );
    assert.ok(
      Number.isInteger(requirement.level) &&
        requirement.level >= 1 &&
        requirement.level <= 120,
      context + " invalid required level",
    );
  }
}
export function assertEquipmentCatalogue(skills, guides) {
  assert.deepEqual(
    Object.keys(guides).sort(),
    skills.map((skill) => skill.name).sort(),
    "Equipment guide identities do not match skills",
  );
  for (const skill of skills) {
    const guide = guides[skill.name];
    assert.ok(
      guide.items.length > 0,
      skill.name + " missing equipment catalogue",
    );
    const methods = new Set(
      skill.stages.flatMap((stage) => stage.options.map((option) => option.id)),
    );
    for (const item of guide.items) {
      const context = skill.name + " " + item.name;
      assert.ok(
        Number.isInteger(item.from) && item.from >= 1 && item.from <= 120,
        context + " invalid equipment milestone",
      );
      assert.ok(
        [item.name, item.slot, item.wiki, item.image].every(
          (value) => typeof value === "string" && value.trim(),
        ),
        context + " incomplete equipment identity",
      );
      assert.ok(
        typeof item.note === "string" && item.note.trim(),
        context + " missing equipment explanation",
      );
      for (const field of ["members", "optional"])
        assert.ok(
          item[field] === undefined || typeof item[field] === "boolean",
          context + " invalid " + field,
        );
      assertLevels(item.levels, context);
      if (item.planningSkill)
        assert.ok(
          RS3_SKILL_NAMES.includes(item.planningSkill),
          context + " unknown planning skill",
        );
      for (const id of item.methods ?? [])
        assert.ok(methods.has(id), context + " unknown method " + id);
      assert.ok(
        Array.isArray(item.acquisition) && item.acquisition.length > 0,
        context + " missing Ironman acquisition route",
      );
      for (const route of item.acquisition) {
        assert.ok(
          route?.label && route?.note,
          context + " incomplete Ironman acquisition route",
        );
        assertLevels(route.levels, context + " acquisition");
      }
    }
    for (const mode of ["f2p", "members"])
      for (const stage of availableStages(skill, mode))
        for (const option of availableTrainingOptions(stage, mode)) {
          const context = `${skill.name} ${stage.from} ${mode} ${option.id}`;
          const p = character({ [skill.name]: stage.from }, mode);
          const selected = selectEquipment(guide, option, p, stage.from);
          assert.ok(
            selected.current.length || selected.upgrades.length || guide.note,
            context + " has no equipment or explanation",
          );
          assert.equal(
            new Set(
              selected.current.map(
                (item) => item.slot + (item.condition ?? ""),
              ),
            ).size,
            selected.current.length,
            context + " conflicting equipment slots",
          );
          for (const items of [
            selected.target,
            selected.upgrades,
            selected.optional,
          ])
            assert.equal(
              new Set(items.map((item) => item.name)).size,
              items.length,
              context + " ambiguous equipment identity",
            );
          for (const item of [
            ...selected.current,
            ...selected.target,
            ...selected.upgrades,
            ...selected.optional,
          ]) {
            assert.ok(
              !item.methods || item.methods.includes(option.id),
              context + " incompatible method equipment",
            );
            if (mode === "f2p") {
              assert.equal(
                Boolean(item.members),
                false,
                context + " members equipment leaked",
              );
              assert.ok(
                item.acquisition.some((route) => !route.members),
                context + " has no free Ironman acquisition route",
              );
            }
          }
          const candidates = guide.items.filter(
            (item) =>
              !item.optional &&
              (mode === "members" || !item.members) &&
              item.acquisition.some(
                (route) => mode === "members" || !route.members,
              ) &&
              (!item.methods || item.methods.includes(option.id)),
          );
          const identities = candidates.map(
            (item) => item.slot + "::" + item.from,
          );
          assert.equal(
            new Set(identities).size,
            identities.length,
            context + " ambiguous equipment progression",
          );
        }
  }
}

test("Every skill and available method has coherent Ironman equipment routes", () =>
  assertEquipmentCatalogue(SKILLS, EQUIPMENT_GUIDES));

test("Equipment baseline follows recorded use levels without mutating the catalogue", () => {
  const guide = {
    items: [
      row("later", 40),
      row("starter", 1),
      row("next range", 50),
      row("range start", 20),
      row("upgrade", 45),
    ],
  };
  const snapshot = structuredClone(guide);
  const selected = selectEquipment(guide, method, character({ Attack: 43 }));
  assert.deepEqual(
    selected.current.map((item) => item.name),
    ["later"],
  );
  assert.deepEqual(
    selected.upgrades.map((item) => item.name),
    ["next range", "upgrade"],
  );
  assert.deepEqual(guide, snapshot);
  assert.equal(
    selectEquipment(guide, method, character({ Attack: 99 })).current[0].name,
    "next range",
  );
  assert.equal(
    selectEquipment(guide, method, character()).current[0].name,
    "starter",
  );
});

test("Current combat options use actual equip skills while the range target remains separate", () => {
  const strength = SKILLS.find((skill) => skill.name === "Strength");
  const strengthStage = strength.stages.find((stage) => stage.from === 80);
  const ankou = strengthStage.options.find((option) => option.id === "ankou");
  const melee = resolveTrainingEquipment(
    strength,
    strengthStage,
    ankou,
    character({ Strength: 80, Attack: 1, Defence: 1 }, "members"),
  );
  const weapon = melee.current.find((item) => item.slot === "melee weapon");
  assert.equal(weapon.from, 1);
  assert.equal(
    melee.target.find((item) => item.slot === "melee weapon").from,
    80,
  );

  const ranged = SKILLS.find((skill) => skill.name === "Ranged");
  const rangedStage = ranged.stages.find((stage) => stage.from === 50);
  const rangedMethod = rangedStage.options.find(
    (option) => option.id === "ankou",
  );
  const lowDefence = resolveTrainingEquipment(
    ranged,
    rangedStage,
    rangedMethod,
    character({ Ranged: 50, Defence: 1 }, "members"),
  );
  assert.equal(
    lowDefence.current.find((item) => item.slot === "ranged body").from,
    1,
  );
  const highDefence = resolveTrainingEquipment(
    ranged,
    rangedStage,
    rangedMethod,
    character({ Ranged: 90, Defence: 90 }, "members"),
  );
  assert.ok(
    highDefence.current.find((item) => item.slot === "ranged weapon").from > 79,
  );
  assert.ok(
    highDefence.current.find((item) => item.slot === "ranged body").from > 1,
  );

  const unknown = resolveTrainingEquipment(
    strength,
    strengthStage,
    ankou,
    character({}, "members"),
  );
  const basic = unknown.current.find((item) => item.slot === "melee weapon");
  assert.equal(basic.from, 1);
  assert.equal(
    equipmentLevels(basic, character({}, "members"))[0].status,
    "unknown",
  );
});

test("Defence and Constitution style choices resolve one coherent dragon setup", () => {
  for (const skillName of ["Defence", "Constitution"]) {
    const skill = SKILLS.find((entry) => entry.name === skillName);
    const stage = skill.stages.find((entry) =>
      entry.options.some((option) => option.id === "blue-dragons"),
    );
    const method = stage.options.find((option) => option.id === "blue-dragons");
    const original = structuredClone(method);
    for (const [style, body] of [
      ["Attack", "melee body"],
      ["Ranged", "ranged body"],
      ["Magic", "magic body"],
      ["Necromancy", "necromancy body"],
    ]) {
      const result = resolveTrainingEquipment(
        skill,
        stage,
        method,
        character(
          { Attack: 50, Ranged: 50, Magic: 50, Necromancy: 50, Defence: 50 },
          "members",
        ),
        style,
      );
      assert.ok(
        result.current.some((item) => item.slot === body),
        `${skillName} ${style}`,
      );
      const bodies = result.current.filter((item) =>
        item.slot.endsWith(" body"),
      );
      assert.equal(bodies.length, 1);
      const names = result.current.map((item) => item.name);
      if (style === "Necromancy") {
        assert.ok(!names.includes("Anti-dragon shield"));
        assert.ok(names.includes("Super antifire (3)"));
      } else {
        assert.ok(names.includes("Anti-dragon shield"));
      }
    }
    const freeNecro = resolveTrainingEquipment(
      skill,
      stage,
      method,
      character({ Necromancy: 20, Defence: 50 }),
      "Necromancy",
    );
    assert.deepEqual(freeNecro.current, []);
    assert.deepEqual(method, original);
  }
});

test("Slayer master style gear keeps conditional assignment tools and the selected method", () => {
  const skill = SKILLS.find((entry) => entry.name === "Slayer");
  const stage = skill.stages.find((entry) =>
    entry.options.some((option) => option.id === "sumona"),
  );
  const method = stage.options.find((option) => option.id === "sumona");
  const before = structuredClone(method);
  for (const style of ["Attack", "Ranged", "Magic", "Necromancy"]) {
    const result = resolveTrainingEquipment(
      skill,
      stage,
      method,
      character(
        {
          Slayer: 80,
          Attack: 50,
          Ranged: 50,
          Magic: 50,
          Necromancy: 50,
          Defence: 50,
        },
        "members",
      ),
      style,
    );
    assert.ok(
      result.current.some(
        (item) => item.name === "Rock hammer" && item.condition,
      ),
    );
    assert.ok(
      result.current.some((item) => item.name === "Earmuffs" && item.condition),
    );
    assert.ok(result.current.some((item) => item.slot.endsWith(" body")));
  }
  assert.deepEqual(method, before);
});

test("Membership and acquisition-route filtering happen before choosing a slot's highest tier", () => {
  const guide = {
    items: [
      row("free", 20),
      row("member item", 30, { members: true }),
      row("member-only source", 40, {
        acquisition: [
          { label: "Member quest", note: "Reward.", members: true },
        ],
      }),
    ],
  };
  const free = selectEquipment(guide, method, character({ Attack: 45 }));
  assert.equal(free.current[0].name, "free");
  const members = selectEquipment(
    guide,
    method,
    character({ Attack: 45 }, "members"),
  );
  assert.equal(members.current[0].name, "member-only source");
});

test("Method-specific tackle cannot replace equipment for a different selected method", () => {
  const guide = {
    items: [
      row("net", 1, { methods: ["net"] }),
      row("rod", 20, { methods: ["rod"] }),
    ],
  };
  const selected = selectEquipment(
    guide,
    { ...method, id: "net" },
    character({ Attack: 45 }),
  );
  assert.deepEqual(
    selected.current.map((item) => item.name),
    ["net"],
  );
  assert.deepEqual(selected.upgrades, []);
});

test("Optional acquisition alternatives are retained rather than hidden by a higher-tier boss drop", () => {
  const guide = {
    items: [
      row("baseline", 20),
      row("Slayer drop", 30, { optional: true }),
      row("boss drop", 40, { optional: true }),
    ],
  };
  const selected = selectEquipment(guide, method, character({ Attack: 45 }));
  assert.deepEqual(
    selected.current.map((item) => item.name),
    ["baseline"],
  );
  assert.deepEqual(
    selected.optional.map((item) => item.name),
    ["Slayer drop", "boss drop"],
  );
});

test("Wearing mithril armour and self-smithing it use independent recorded skills", () => {
  const item = EQUIPMENT_GUIDES.Defence.items.find(
    (item) => item.name === "Mithril platebody",
  );
  const p = character({ Defence: 35, Mining: 12, Smithing: 8 });
  assert.deepEqual(
    equipmentLevels(item, p).map((check) => check.status),
    ["met"],
  );
  assert.deepEqual(
    equipmentLevels(item.acquisition[0], p).map((check) => [
      check.skill,
      check.status,
    ]),
    [
      ["Mining", "below"],
      ["Smithing", "below"],
    ],
  );
  assert.deepEqual(
    equipmentLevels(item.acquisition[0], character()).map((check) => [
      check.recorded,
      check.status,
    ]),
    [
      [undefined, "unknown"],
      [undefined, "unknown"],
    ],
  );
});

test("Ore-box planning follows Mining progression without inventing a Mining use requirement", () => {
  const mining = SKILLS.find((skill) => skill.name === "Mining");
  const method = mining.stages[0].options[0];
  const profile = character({ Mining: 12, Smithing: 8 }, "members");
  const current = selectEquipment(EQUIPMENT_GUIDES.Mining, method, profile);
  const box = current.current.find((item) => item.slot === "ore box");
  assert.equal(box.name, "Iron ore box");
  assert.deepEqual(equipmentLevels(box, profile), []);
  assert.equal(
    selectEquipment(
      EQUIPMENT_GUIDES.Mining,
      method,
      character({}, "members"),
    ).current.find((item) => item.slot === "ore box").name,
    "Bronze ore box",
  );
});

test("Inside-floor equipment follows recorded combat level without pretending dungeon level grants weapon access", () => {
  const skill = SKILLS.find((skill) => skill.name === "Dungeoneering");
  const stage = skill.stages[0];
  const free = selectEquipment(
    EQUIPMENT_GUIDES.Dungeoneering,
    stage.options[0],
    character({ Dungeoneering: 1, Attack: 85 }),
  );
  assert.equal(free.current[0].name, "Zephyrium 2h sword");
  const members = selectEquipment(
    EQUIPMENT_GUIDES.Dungeoneering,
    stage.options[0],
    character({ Dungeoneering: 1, Attack: 85 }, "members"),
  );
  assert.equal(members.current[0].name, "Gorgonite 2h sword");
  assert.equal(
    selectEquipment(
      EQUIPMENT_GUIDES.Dungeoneering,
      stage.options[0],
      character({ Dungeoneering: 99 }),
    ).current[0].name,
    "Novite 2h sword",
  );
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

test("A future blue-dragon range targets rune armour instead of capping the kit at current steel", () => {
  const stage = attack.stages.find((stage) =>
    stage.options.some((option) => option.id === "blue-dragons"),
  );
  const dragons = stage.options.find((option) => option.id === "blue-dragons");
  const profile = character(
    { Attack: 60, Defence: 20, Mining: 20, Smithing: 20 },
    "members",
  );
  const before = structuredClone(profile);
  const result = resolveTrainingEquipment(attack, stage, dragons, profile);
  assert.equal(
    result.current.find((item) => item.slot === "melee body").name,
    "Steel platebody",
  );
  assert.equal(
    result.target.find((item) => item.slot === "melee weapon").name,
    "Orikalkum warhammer",
  );
  const body = result.target.find((item) => item.slot === "melee body");
  assert.equal(body.name, "Rune platebody");
  assert.deepEqual(
    equipmentLevels(body, profile).map((check) => [
      check.skill,
      check.level,
      check.recorded,
      check.status,
    ]),
    [["Defence", 50, 20, "below"]],
  );
  assert.deepEqual(
    equipmentLevels(body.acquisition[0], profile).map((check) => [
      check.skill,
      check.level,
      check.status,
    ]),
    [
      ["Mining", 50, "below"],
      ["Smithing", 50, "below"],
    ],
  );
  assert.ok(!result.upgrades.some((item) => item.name === body.name));
  assert.ok(result.upgrades.some((item) => item.name === "Mithril platebody"));
  assert.deepEqual(profile, before);
});

test("Prospective kits keep stronger use-level options, respect F2P and leave unknown checks unrecorded", () => {
  const stage = attack.stages.find((stage) =>
    stage.options.some((option) => option.id === "wilderness-blue-dragons"),
  );
  const dragons = stage.options.find(
    (option) => option.id === "wilderness-blue-dragons",
  );
  const high = resolveTrainingEquipment(
    attack,
    stage,
    dragons,
    character({ Attack: 85, Defence: 85, Smithing: 1 }, "members"),
  );
  assert.equal(
    high.target.find((item) => item.slot === "melee weapon").name,
    "Bane longsword",
  );
  assert.equal(
    high.target.find((item) => item.slot === "melee body").name,
    "Bane platebody",
  );
  const free = resolveTrainingEquipment(
    attack,
    stage,
    dragons,
    character({ Attack: 60, Defence: 20 }),
  );
  assert.equal(
    free.target.find((item) => item.slot === "melee weapon").name,
    "Rune dagger",
  );
  assert.equal(
    free.target.find((item) => item.slot === "melee body").name,
    "Rune platebody",
  );
  assert.ok(free.target.every((item) => !item.members));
  const unknownProfile = character();
  const unknown = resolveTrainingEquipment(
    attack,
    stage,
    dragons,
    unknownProfile,
  );
  const body = unknown.target.find((item) => item.slot === "melee body");
  assert.equal(body.name, "Rune platebody");
  assert.deepEqual(
    equipmentLevels(body, unknownProfile).map((check) => [
      check.recorded,
      check.status,
    ]),
    [[undefined, "unknown"]],
  );
});

test("A two-handed staff is never paired with an off-hand, in either kit", () => {
  const magic = SKILLS.find((skill) => skill.name === "Magic");
  const offHand = (list) => list.some((item) => item.slot === "magic off hand");
  const kit = (stage, levels) =>
    resolveTrainingEquipment(magic, stage, stage.options[0], character(levels));
  const first = magic.stages[0];
  const later = magic.stages.find((stage) => stage.from >= 20);
  for (const levels of [{}, { Magic: 5 }]) {
    const low = kit(first, levels);
    assert.ok(low.target.some((item) => item.name === "Staff of air"));
    assert.ok(!offHand(low.current) && !offHand(low.target));
    const ahead = kit(later, levels);
    assert.ok(!offHand(ahead.current));
    assert.ok(offHand(ahead.target));
  }
  const wand = kit(first, { Magic: 10 });
  assert.ok(wand.target.some((item) => item.name === "Imphide book"));
});

test("Range targets preserve coherent dragon weapon and protection combinations for each style", () => {
  const skill = SKILLS.find((skill) => skill.name === "Defence");
  const stage = skill.stages.find((stage) =>
    stage.options.some((option) => option.id === "blue-dragons"),
  );
  const method = stage.options.find((option) => option.id === "blue-dragons");
  for (const style of ["Attack", "Ranged", "Magic", "Necromancy"]) {
    const result = resolveTrainingEquipment(
      skill,
      stage,
      method,
      character(
        { Attack: 20, Ranged: 20, Magic: 20, Necromancy: 20, Defence: 20 },
        "members",
      ),
      style,
    );
    const names = result.target.map((item) => item.name);
    if (style === "Attack") assert.ok(names.includes("Rune dagger"));
    if (style === "Ranged") {
      assert.ok(names.includes("Rune crossbow"));
      assert.ok(names.includes("Rune bolts"));
    }
    if (style === "Magic") {
      assert.ok(names.includes("Mystic wand"));
      assert.ok(!result.target.some((item) => item.slot === "magic off hand"));
    }
    if (style === "Necromancy") {
      assert.ok(names.includes("Death guard (tier 50)"));
      assert.ok(names.includes("Skull lantern (tier 50)"));
      assert.ok(names.includes("Super antifire (3)"));
      assert.ok(!names.includes("Anti-dragon shield"));
    } else assert.ok(names.includes("Anti-dragon shield"));
  }
});

test("equipmentLevels marks each recorded level met, below or unknown", () => {
  const item = {
    levels: [
      { skill: "Attack", level: 40 },
      { skill: "Defence", level: 40 },
      { skill: "Mining", level: 40 },
    ],
  };
  assert.deepEqual(equipmentLevels(item, character({ Attack: 40, Defence: 39 })), [
    { skill: "Attack", level: 40, recorded: 40, status: "met" },
    { skill: "Defence", level: 40, recorded: 39, status: "below" },
    { skill: "Mining", level: 40, recorded: undefined, status: "unknown" },
  ]);
  assert.deepEqual(equipmentLevels({}, character()), []);
});
