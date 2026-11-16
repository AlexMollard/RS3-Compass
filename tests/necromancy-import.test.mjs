import assert from "node:assert/strict";
import test from "node:test";
import { parseGlyphs, parseRituals, parseUpgrades, upgradePic, upgradeTable } from "../scripts/necromancyWikitext.mjs";

// Trimmed from Module:Necromancy/rituals/data (https://runescape.wiki/w/Module:Necromancy/rituals/data, fetched 2026-11-16).
const lua = `return {
	["glyphs"] = {
		["Elemental I"] = {
			["type"] = "foundational",
			["tier"] = 1,
			["recipe"] = { ["Basic ghostly ink"] = 3 },
			["lvl"] = 1
		},
		["Multiply II"] = {
			["type"] = "alteration",
			["tier"] = 2,
			["alteration"] = {
				["output"] = 40,
				["attraction"] = 40
			},
			["recipe"] = { ["Ectoplasm"] = 1, ["Basic ghostly ink"] = 2, ["Regular ghostly ink"] = 2 },
			["lvl"] = 66
		}
	},
	["rituals"] = {
		["Greater necroplasm"] = {
			["recipes"] = {
				{ { ["Lesser necroplasm"] = 200 }, { ["Greater necroplasm"] = 100, ["Ectoplasm"] = 7 } }
			},
			["type"] = "necroplasm",
			["glyphs"] = { ["Elemental I"] = 1, ["Elemental II"] = 2, ["Reagent II"] = 2 },
			["tier"] = 2,
			["lvl"] = 60,
			["ticks"] = 58,
			["xp"] = 1480
		},
		["Lesser communion"] = {
			["recipes"] = {
				{ { ["Bones"] = 1 }, { ["Soul"] = 1, ["Ectoplasm"] = 3 } },
				{ { ["Big bones"] = 1 }, { ["Soul"] = 2, ["Ectoplasm"] = 3 } }
			},
			["type"] = "communion",
			["glyphs"] = { ["Elemental I"] = 1, ["Commune I"] = 2 },
			["tier"] = 1,
			["lvl"] = 5,
			["ticks"] = 33,
			["xp"] = 200
		}
	},
	["glyphduration"] = { ["foundational"] = { 6, 12, 18 } }
}`;

test("lesser communion is level 5, tier 1, 200 XP, with a ritual per recipe", () => {
  const rituals = parseRituals(lua).filter((r) => r.name === "Lesser communion");
  assert.equal(rituals.length, 2);
  const [bones, big] = rituals;
  assert.equal(bones.level, 5);
  assert.equal(bones.tier, 1);
  assert.equal(bones.xp, 200);
  assert.equal(bones.ticks, 33);
  assert.equal(bones.members, false);
  assert.deepEqual(bones.inputs, [{ item: "Bones", qty: 1 }]);
  assert.deepEqual(big.outputs, [{ item: "Soul", qty: 2 }, { item: "Ectoplasm", qty: 3 }]);
  assert.notEqual(bones.id, big.id);
});

test("greater necroplasm takes 200 lesser for 100 greater and 1,480 XP, and is members-only above level 20", () => {
  const ritual = parseRituals(lua).find((r) => r.name === "Greater necroplasm");
  assert.deepEqual(ritual.inputs, [{ item: "Lesser necroplasm", qty: 200 }]);
  assert.deepEqual(ritual.outputs, [{ item: "Greater necroplasm", qty: 100 }, { item: "Ectoplasm", qty: 7 }]);
  assert.equal(ritual.xp, 1480);
  assert.equal(ritual.members, true);
  assert.equal(ritual.id, "greater-necroplasm");
});

test("a Wiki members flag makes a low-level ritual members-only", () => {
  const flagged = lua.replace('["lvl"] = 5,', '["lvl"] = 5, ["members"] = true,');
  assert.equal(parseRituals(flagged).find((r) => r.name === "Lesser communion").members, true);
});

test("glyphs keep their tier, kind and highest ink", () => {
  const [elemental, multiply] = parseGlyphs(lua);
  assert.deepEqual(elemental, { id: "elemental-i", name: "Elemental I", level: 1, tier: 1, alteration: false, ink: "Basic ghostly ink" });
  assert.equal(multiply.alteration, true);
  assert.equal(multiply.ink, "Regular ghostly ink");
});

test("a ritual row with an unknown field or shape throws", () => {
  assert.throws(() => parseRituals(lua.replace('["xp"] = 1480', '["xp"] = 1480, ["bonus"] = 2')), /unknown fields: bonus/);
  assert.throws(() => parseRituals(lua.replace('["xp"] = 1480', '["xp"] = "lots"')), /XP/);
  assert.throws(() => parseRituals(lua.replace('["Lesser necroplasm"] = 200', '["Lesser necroplasm"] = { 200 }')), /inputs/);
  assert.throws(() => parseRituals(lua.replace('["lvl"] = 60', '["lvl"] = 60, ["tier"] = 4')), /tier is not 1-3/);
  assert.throws(() => parseGlyphs(lua.replace('["Basic ghostly ink"] = 3', '["Murky ink"] = 3')), /unknown ink/);
  assert.throws(() => parseRituals("return { glyphs = {} }"), /no "rituals" table/);
});

// Trimmed from Template:Death Skull upgrades (https://runescape.wiki/w/Template:Death_Skull_upgrades, fetched 2026-11-16).
const weapons = `{| class="wikitable lighttable sticky-header text-align-center align-left-2"
! rowspan="2" | Tier
! rowspan="2" colspan="2" | Material
! colspan="3" | Quantity per slot
|-
! {{plink|Death guard|pic=Death guard (tier 90)}}
! {{plink|Skull lantern|pic=Skull lantern (tier 90)}}
! Full set
|-
! colspan="6" style="height:1px;" |
|-
! 50
| {{plinkt|Lesser ensouled bar}}
| 3
| 3
| 6
|-
! colspan="6" |
|-
! rowspan="2" | 60
| {{plinkt|Ensouled bar}}
| 3
| 3
| 6
|-
| {{plinkt|Bone rune}}
| 25
| 25
| 50
|-
! colspan="6" |
|-
! rowspan="2" | 70
| {{plinkt|Ensouled bar}}
| 4
| 4
| 8
|-
| {{plinkt|Bone rune}}
| 50
| 50
| 100
|-
! colspan="6" |
|-
! rowspan="2" | Total
| {{plinkt|Ensouled bar}}
| 7
| 7
| 14
|}`;

test("weapon tier 70 is 4 ensouled bars and 50 bone runes per weapon", () => {
  const steps = parseUpgrades(weapons);
  assert.deepEqual(steps.map((s) => s.tier), [50, 60, 70]);
  const t70 = steps.find((s) => s.tier === 70);
  assert.equal(t70.line, "weapon");
  assert.deepEqual(t70.materials, [
    { item: "Ensouled bar", qty: 4, per: "weapon" },
    { item: "Bone rune", qty: 50, per: "weapon" },
  ]);
  assert.deepEqual(steps.find((s) => s.tier === 60).materials[1], { item: "Bone rune", qty: 25, per: "weapon" });
  assert.equal(upgradePic(weapons), "Death guard (tier 90)");
});

// Trimmed from Template:Deathdealer upgrades (https://runescape.wiki/w/Template:Deathdealer_upgrades, fetched 2026-11-16).
const robes = `{| class="wikitable"
! rowspan="2" | Tier
! colspan="6" | Quantity per slot
|-
! {{plink|Deathdealer hood|pic=Deathdealer hood (tier 90)|txt=Hood}}
|-
! rowspan="2" | 20-60<ref group="n">Total materials to create tier 60 deathwarden robes.</ref>
| {{plinkt|Spirit rune}}s
| 45
| 45
| 45
| 45
| 45
| 225
|-
! rowspan="2" | 70
| {{plinkt|Hermodic plate}}
| 1
| 1
| 1
| 1
| 1
| 5
|-
| {{plinkt|Ensouled cloth}}
| 2
| 3
| 3
| 2
| 2
| 12
|}`;

test("robe tiers cost per set, skipping the tier range row", () => {
  const steps = parseUpgrades(robes, "deathdealer");
  assert.deepEqual(steps.map((s) => s.tier), [70]);
  assert.deepEqual(steps[0].materials, [
    { item: "Hermodic plate", qty: 5, per: "set" },
    { item: "Ensouled cloth", qty: 12, per: "set" },
  ]);
  assert.equal(upgradePic(robes), "Deathdealer hood (tier 90)");
});

test("upgrade rows that do not add up, or have an unknown shape, throw", () => {
  assert.throws(() => parseUpgrades(weapons.replace("| 6\n|-\n! colspan=\"6\" |\n|-\n! rowspan=\"2\" | 60", "| 7\n|-\n! colspan=\"6\" |\n|-\n! rowspan=\"2\" | 60")), /is not 7/);
  assert.throws(() => parseUpgrades(weapons.replace("! 50", "! fifty")), /unknown upgrade tier label/);
  assert.throws(() => parseUpgrades(weapons.replace("| 50\n| 50\n| 100", "| 50\n| 100")), /quantities/);
  assert.throws(() => parseUpgrades(weapons.replace("{{plinkt|Bone rune}}\n| 25", "Bone rune\n| 25")), /material/);
  assert.throws(() => parseUpgrades("{|\n|}"), /no tiers/);
  assert.throws(() => parseUpgrades(robes, "weapon"), /quantities/);
});

test("upgradeTable finds the one table with a quantity header", () => {
  const page = `Intro\n{| class="a"\n| x\n|}\nText\n${weapons}\nAfter`;
  assert.equal(upgradeTable(page), weapons);
  assert.throws(() => upgradeTable("nothing"), /found 0/);
});
