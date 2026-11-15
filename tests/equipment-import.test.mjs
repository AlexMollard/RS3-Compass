import test from "node:test";
import assert from "node:assert/strict";
import { parseListPage, parseItem, parseRequirements } from "../scripts/equipmentWikitext.mjs";

// Trimmed from the RuneScape Wiki pages of the same names (fetched 2026-11-16).
const scythe = `{{Infobox Item
|version1 = new
|version2 = used
|version3 = broken
|name1 = Noxious scythe
|image1 = [[File:Noxious scythe.png]]
|image2 = [[File:Noxious scythe (used).png]]
|members = Yes
|tradeable = Yes
|tradeable2 = No
|equipable = Yes
}}
The '''noxious scythe''' is a level 90 two-handed melee weapon.

==Combat stats==
{{Infobox Bonuses
|bucketname = new
|requirements = {{sc|attack|90}}
|class = melee
|slot = 2h
|tier = 90
|type = halberd
|damage = 2011.5
|image = Noxious scythe equipped.png
}}

==Creation==
{{Switch infobox
|text1 = From leg
|item1 = {{Infobox Recipe
|members = Yes
|ticks = 3
|skill1 = Crafting
|skill1lvl = 90
|skill1exp = 1000
|mat1 = Araxxi's fang
|output1 = Noxious scythe
}}
|text2 = From leg parts
|item2 = {{Infobox Recipe
|members = Yes
|skill1 = Crafting
|skill1lvl = 90
|output1 = Noxious scythe
}}
}}`;

const runePlatebody = `{{Infobox Item
|name = Rune platebody
|image = [[File:Rune platebody.png]]
|members = No
|tradeable = Yes
|equipable = Yes
}}
A '''rune platebody''' is tier 50 melee body armour.

==Combat stats==
{{Infobox Bonuses
|requirements = {{sc|defence|50}}
|class = melee
|slot = body
|tier = 50
|type = tank
|armour = 195.5
|life = 750
}}

==Creation==
{{Infobox Recipe
|members = No
|facility = Anvil
|skill1 = Smithing
|skill1lvl = 50
|mat1 = Rune bar
|output1 = Rune platebody
}}`;

const elderPlus5 = `{{Infobox Item
|version1 = new
|version2 = used
|name1 = Elder rune platebody + 5
|image1 = [[File:Elder rune platebody + 5.png]]
|image2 = [[File:Elder rune platebody + 5 (used).png]]
|members = Yes
|tradeable = No
|tradeable1 = Yes
}}
==Combat stats==
{{Infobox Bonuses
|bucketname = new
|requirements = {{sc|defence|90}}
|class = melee
|slot = body
|tier = 85
|type = tank
|degrades = 60000
|armour = 500.9
}}`;

const meleeArmourExcerpt = `==Tank armours==
{{Armour tile|title=Bronze equipment|def=1|tier=5|members=no|nohr=y|tradeable=yes}}
Bronze armour can be smithed from [[bronze bar]]s at level 1 Smithing, or purchased from stores.
{{Eq infotable|class=Melee|price=yes|noweapon=yes
|{{Eqinforow|ge=Bronze full helm}}
|{{Eqinforow|ge=Bronze med helm|dontaddtototal=y}}
|{{Eqinforow|ge=Bronze platebody}}
|{{Eqinforow|ge=Bronze chainbody|dontaddtototal=y}}
|{{Eqinforow|totals=yes}}
|maleimage=Bronze armour (heavy) equipped (male).png
}}

{{Armour tile|title=Sacred clay equipment|def=1|tier=5|members=yes|tradeable=no}}
{{Eq infotable|class=Melee|price=yes|noweapon=yes
|{{Eqinforow|ge=Sacred clay helm|price={{currencies|stealing creation points|24}}}}
|{{Eqinforow|name=[[Goblin cower shield]]|image=Goblin cower shield (bonus).png|bucketname=Goblin cower shield#bonus}}
|{{Eqinforow|ge=Bronze platebody}}
|{{Eqinforow|totals=yes}}
}}`;

test("Noxious scythe", () => {
  assert.deepEqual(parseItem("Noxious scythe", scythe), {
    name: "Noxious scythe",
    wiki: "Noxious scythe",
    image: "Noxious_scythe.png",
    slot: "2h",
    class: "melee",
    tier: 90,
    wear: [{ skill: "Attack", level: 90 }],
    members: true,
    tradeable: true,
    recipe: { skill: "Crafting", level: 90 },
  });
});

test("Rune platebody is a free-to-play tank piece", () => {
  const item = parseItem("Rune platebody", runePlatebody);
  assert.equal(item.armourType, "tank");
  assert.equal(item.members, false);
  assert.equal(item.slot, "body");
  assert.deepEqual(item.recipe, { skill: "Smithing", level: 50 });
  assert.equal(item.image, "Rune_platebody.png");
});

test("version 1 values win over the unnumbered field", () => {
  const item = parseItem("Elder rune platebody + 5", elderPlus5);
  assert.equal(item.tradeable, true);
  assert.equal(item.tier, 85);
  assert.equal(item.image, "Elder_rune_platebody_+_5.png");
  assert.equal(item.recipe, undefined);
});

test("a page without Infobox Bonuses is not equipment", () => {
  assert.equal(parseItem("Plain item", "{{Infobox Item|name=Plain}}"), undefined);
});

test("parseRequirements reads {{sc}} skills", () => {
  assert.deepEqual(parseRequirements("{{sc|attack|80}}{{sc|strength|80}}"), [
    { skill: "Attack", level: 80 },
    { skill: "Strength", level: 80 },
  ]);
  assert.deepEqual(parseRequirements("None"), []);
});

test("parseListPage returns item names once, in page order", () => {
  const names = parseListPage(meleeArmourExcerpt);
  assert.deepEqual(names, [
    "Bronze full helm",
    "Bronze med helm",
    "Bronze platebody",
    "Bronze chainbody",
    "Sacred clay helm",
    "Goblin cower shield",
  ]);
  assert.ok(!names.some((n) => /dontaddtototal|totals/.test(n)));
});
