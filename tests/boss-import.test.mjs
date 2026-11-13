import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  parseBossesTable,
  parseInfobox,
  parseDrops,
  parseAchievements,
  hasStrategy,
  deriveUniques,
} from "../scripts/bossWikitext.mjs";

const fixture = (name) => readFileSync(new URL(`./fixtures/${name}`, import.meta.url), "utf8");
const bosses = fixture("wiki-bosses.wikitext");
const mole = fixture("wiki-giant-mole.wikitext");
const rows = parseBossesTable(bosses);
const row = (name) => rows.find((r) => r.name === name);

test("the Combat bosses table has every row", () => {
  assert.equal(rows.length, 56);
  assert.ok(rows.every((r) => r.name && r.tier && Number.isFinite(r.level)));
});

test("Giant Mole row", () => {
  assert.deepEqual(
    { ...row("Giant Mole") },
    { ...row("Giant Mole"), name: "Giant Mole", level: 230, tier: "Free", team: "Solo or group", requirements: [] },
  );
  assert.deepEqual(row("Giant Mole").signature, ["Dragon 2h sword", "Mole skin", "Mole claw"]);
});

test("requirements parse as text, skill and quest", () => {
  assert.deepEqual(row("Araxxi").requirements[0], { kind: "text", text: "Access to Morytania" });
  assert.deepEqual(row("Legiones").requirements[0], { kind: "skill", skill: "Slayer", level: 95 });
  assert.deepEqual(row("Amascut, the Devourer").requirements[0], { kind: "quest", name: "Eclipse of the Heart" });
  assert.deepEqual(row("Corporeal Beast").requirements[0], { kind: "quest", name: "Summer's End" });
});

test("Completion of / Partial completion of a link is a quest", () => {
  const table = [
    "==Combat bosses==",
    "{| class=\"wikitable\"",
    "! Name",
    "|-",
    "| [[File:A.png|64px]]",
    "| [[A]]",
    "| 10",
    "| data-sort-value=\"2\" class=\"table-bg-green\" | Low tier",
    "| Solo-only",
    "|",
    "* Completion of [[Ode of the Devourer]]",
    "* Partial completion of [[Some Quest]]",
    "* {{skillreq|Slayer|95}}",
    "|",
    "* {{plink|X}}",
    "| [[1 May]] [[2020]]",
    "|}",
  ].join("\n");
  const [a] = parseBossesTable(table);
  assert.deepEqual(a.requirements, [
    { kind: "quest", name: "Ode of the Devourer" },
    { kind: "quest", name: "Some Quest" },
    { kind: "skill", skill: "Slayer", level: 95 },
  ]);
  assert.equal(a.tier, "Low");
  assert.equal(a.releaseDate, "1 May 2020");
});

test("the last row's release date has no closing table markup", () => {
  const last = rows.at(-1);
  assert.doesNotMatch(last.releaseDate, /[|}]/);
  for (const r of rows) if (r.releaseDate) assert.doesNotMatch(r.releaseDate, /[|}]/, r.name);
});

test("signature lists mix plink and plinkp, and {{na}} cells are empty", () => {
  assert.deepEqual(row("Corporeal Beast").signature.slice(0, 3), ["Holy elixir", "Spectral spirit shield", "Arcane spirit shield"]);
  assert.deepEqual(row("Crassian Leviathan").signature, []);
  assert.equal(row("Crassian Leviathan").releaseDate, "25 February 2019");
  assert.deepEqual(row("Raksha, the Shadow Colossus").requirements, [{ kind: "quest", name: "Raksha, the Shadow Colossus" }]);
});

test("parseInfobox reads the first version", () => {
  assert.deepEqual(parseInfobox(mole), { members: false, lifepoints: 78000, weakness: "None" });
});

test("parseDrops groups by version", () => {
  const drops = parseDrops(mole);
  for (const v of ["Normal", "Normal F2P", "Hard Mode"]) assert.ok(Object.keys(drops).includes(v), v);
  assert.ok(drops.Normal.some((d) => d.item === "Mole claw" && d.quantity === "1" && d.rarity === "Always"));
  assert.deepEqual(parseDrops("no tables here"), {});
});

test("parseDrops merges identical rows within a version", () => {
  const text = [
    "{{DropsTableHead|version=Hard}}",
    "{{DropsLine|name=Rock|quantity=1|rarity=1/10}}",
    "{{DropsLine|name=Rock|quantity=1|rarity=1/10}}",
    "{{DropsLine|name=Rock|quantity=2|rarity=1/10}}",
  ].join("\n");
  assert.equal(parseDrops(text).Hard.length, 2);
});

test("parseDrops ignores a | inside a comment", () => {
  const text = "{{DropsLine|name=Pet|quantity=1|rarity=Very rare<!--1/320|altrarity=1/315-->}}";
  assert.deepEqual(parseDrops(text).Normal, [{ item: "Pet", quantity: "1", rarity: "Very rare" }]);
});

test("parseAchievements strips the (achievement) suffix", () => {
  const list = parseAchievements(mole);
  assert.equal(list.length, 20);
  assert.ok(list.includes("Giant Mole") && list.includes("Whack a Mole I"));
});

test("hasStrategy", () => {
  assert.equal(hasStrategy(mole), true);
  assert.equal(hasStrategy("nothing"), false);
});

test("deriveUniques", () => {
  const uniques = deriveUniques(row("Giant Mole").signature, parseDrops(mole));
  for (const item of ["Dragon 2h sword", "Clingy mole", "Curved bone", "Long bone"]) assert.ok(uniques.includes(item), item);
  for (const item of ["Coins", "Ranarr seed", "Yew logs"]) assert.ok(!uniques.includes(item), item);
  assert.deepEqual(uniques.slice(0, 3), ["Dragon 2h sword", "Mole skin", "Mole claw"]);
});
