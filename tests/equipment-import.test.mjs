import test from "node:test";
import assert from "node:assert/strict";
import {
  classifyRoute,
  parseListPage,
  parseItem,
  parseRequirements,
  rarityBand,
} from "../scripts/equipmentWikitext.mjs";

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

// Trimmed from the Globetrotter arm guards page: a numbered Bonuses infobox beside unnumbered fields.
const globetrotter = `{{Infobox Item
|version1 = 1
|version2 = 25
|name = Globetrotter arm guards
|image1 = [[File:Globetrotter arm guards.png]]
|members = Yes
|tradeable = No
}}
{{Infobox Bonuses
|version1 = 1
|version2 = 25
|requirements1 = None
|requirements2 = {{sc|defence|25}}
|class = hybrid
|class1 = none
|slot = hands
|tier1 = 0
|tier2 = 25
|image = Globetrotter outfit equipped.png
}}`;

test("numbered Bonuses fields use version 1, falling back to the unnumbered field", () => {
  const item = parseItem("Globetrotter arm guards", globetrotter);
  assert.equal(item.class, "none");
  assert.equal(item.tier, 0);
  assert.equal(item.slot, "hands");
  assert.deepEqual(item.wear, []);
});

test("missing or unrecognised class, slot and tier stay undefined", () => {
  const item = parseItem("Odd", "{{Infobox Bonuses\n|class = hybrid\n|tier = n/a\n}}");
  assert.equal(item.class, undefined);
  assert.equal(item.slot, undefined);
  assert.equal(item.tier, undefined);
  assert.equal(parseItem("Blank", "{{Infobox Bonuses\n|tier =\n}}").tier, undefined);
});

test("parseListPage reads positional names and keys that are not first", () => {
  const names = parseListPage(
    "{{Eqinforow|Positional helm}}\n{{Eqinforow|dontaddtototal=y|ge=Late key helm}}\n{{Eqinforow|price={{x|1}}|name=[[Linked shield]]}}\n{{Eqinforow|totals=yes}}",
  );
  assert.deepEqual(names, ["Positional helm", "Late key helm", "Linked shield"]);
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

test("a requirements field of None is no requirement; an absent field is unknown", () => {
  // Bronze full helm writes "|requirements = None".
  const helm = parseItem("Bronze full helm", "{{Infobox Bonuses\n|requirements = None\n|class = melee\n|slot = head\n|tier = 5\n}}");
  assert.deepEqual(helm.wear, []);
  const empty = parseItem("Blank helm", "{{Infobox Bonuses\n|requirements =\n|class = melee\n|slot = head\n|tier = 5\n}}");
  assert.deepEqual(empty.wear, []);
  const absent = parseItem("Odd helm", "{{Infobox Bonuses\n|class = melee\n|slot = head\n|tier = 5\n}}");
  assert.equal(absent.wear, undefined);
});

test("rarityBand follows Module:DropsLine: below 1/64 is rare", () => {
  assert.equal(rarityBand("1/240"), "rare");
  assert.equal(rarityBand("1/64"), "common");
  assert.equal(rarityBand("1/65"), "rare");
  assert.equal(rarityBand("214/2,559"), "common");
  assert.equal(rarityBand("Always"), "common");
  assert.equal(rarityBand("Very rare"), "rare");
  assert.equal(rarityBand("Varies"), "varies");
  assert.equal(rarityBand("Once"), undefined);
});

// Facts as the importer reads them from the Wiki's recipe, storeline and dropsline Bucket tables.
const facts = (recipes = {}, stores = {}, drops = {}) => ({
  recipes: new Map(Object.entries(recipes)),
  stores: new Map(Object.entries(stores)),
  drops: new Map(Object.entries(drops)),
});

test("a recipe needing a rare-only drop is a rare drop, not a craft", () => {
  const f = facts(
    { "Noxious scythe": [{ materials: ["Araxxi's fang", "Spider leg"], skills: ["Crafting"] }] },
    {},
    { "Araxxi's fang": [{ page: "Araxxi#Solo", rarity: "1/240" }], "Spider leg": [{ page: "Araxxi", rarity: "Always" }] },
  );
  const route = classifyRoute({ name: "Noxious scythe", members: true, recipe: { skill: "Crafting", level: 90 } }, f);
  assert.equal(route.kind, "rare-drop");
  assert.match(route.note, /Araxxi's fang, a rare drop from Araxxi/);
});

test("a smithing chain down to basic materials is smith, despite a stray rare drop of the bar", () => {
  const f = facts(
    {
      "Elder rune platebody": [{ materials: ["Elder rune bar"], skills: ["Smithing"] }],
      "Elder rune bar": [{ materials: ["Rune bar", "Light animica"], skills: ["Smithing"] }],
    },
    {},
    { "Elder rune bar": [{ page: "Some boss", rarity: "1/500" }], "Elder rune platebody": [{ page: "Some boss", rarity: "1/900" }] },
  );
  const route = classifyRoute({ name: "Elder rune platebody", members: true, recipe: { skill: "Smithing", level: 90 } }, f);
  assert.deepEqual(route.levels, [{ skill: "Smithing", level: 90 }]);
  assert.equal(route.kind, "smith");
});

test("a reward container's common roll doesn't make a rare boss material easy", () => {
  const f = facts(
    { "Superior tetsu katana": [{ materials: ["Tetsu katana", "Tetsu sword upgrade kit"], skills: ["Smithing"] }] },
    {},
    {
      "Tetsu sword upgrade kit": [
        { page: "Seiryu the Azure Serpent", rarity: "1/1,000", types: ["combat"] },
        { page: "Lucky Charm (Temple of Aminishi)", rarity: "25/1,000", types: ["reward"] },
      ],
    },
  );
  assert.equal(classifyRoute({ name: "Superior tetsu katana", members: true }, f).kind, "rare-drop");
});

test("shops, reward shops and drops", () => {
  const f = facts(
    {},
    { "Rune kiteshield": [{ page: "Armour Store", currency: ["coins"] }], "Chaotic rapier": [{ page: "Daemonheim Rewards", currency: ["dungeoneering tokens"] }] },
    { "Torva platebody": [{ page: "Nex", rarity: "1/384" }], "Dragon platelegs": [{ page: "Nex", rarity: "1/300" }, { page: "Ork", rarity: "Common" }] },
  );
  const kind = (name) => classifyRoute({ name, members: true }, f)?.kind;
  assert.equal(kind("Rune kiteshield"), "shop");
  assert.equal(kind("Chaotic rapier"), "reward");
  assert.equal(kind("Torva platebody"), "rare-drop");
  assert.equal(kind("Dragon platelegs"), "common-drop");
  assert.equal(kind("Mystery helm"), undefined);
});
