// Pure wikitext helpers for the equipment importer; tested in tests/equipment-import.test.mjs.
import { plain, templateParams } from "./questWikitext.mjs";
import { fileName } from "./wikiApi.mjs";
import { canonicalSkillName } from "../src/skillNames.ts";

const CLASSES = ["melee", "ranged", "magic", "necromancy"];
const ARMOUR_TYPES = ["power", "tank", "hybrid"];

/**
 * The item names a list page links to: {{Eqinforow|ge=Name}} rows and {{Eqinforow|name=[[Name]]}}
 * rows (items without a Grand Exchange entry), without repeats, in page order. The rows' other
 * parameters (dontaddtototal, price, ...) and the totals rows are not names.
 */
export function parseListPage(wikitext) {
  const names = [];
  for (const m of wikitext.matchAll(/\{\{\s*Eqinforow\s*\|\s*(ge|name)\s*=\s*([^|{}]*(?:\[\[[^\]]*\]\][^|{}]*)*)/gi)) {
    const name = plain(m[2]);
    if (name && !names.includes(name)) names.push(name);
  }
  return names;
}

/** The skill levels in a requirements field, e.g. "{{sc|attack|80}}{{sc|strength|80}}". */
export function parseRequirements(text = "") {
  const wear = [];
  for (const m of text.matchAll(/\{\{\s*sc\s*\|\s*([^|}]+?)\s*\|\s*(\d+)/gi)) {
    const skill = canonicalSkillName(m[1]);
    if (skill) wear.push({ skill, level: Number(m[2]) });
  }
  return wear;
}

/** Version 1's value of a field: field1 if present, else the unnumbered field. */
const field = (params, key) => {
  const value = params?.[key + "1"] ?? params?.[key];
  return value === undefined || value === "" ? undefined : value;
};
const yes = (value) => /^yes$/i.test(value ?? "");

/** An equipment item from its Wiki page, or undefined when the page has no {{Infobox Bonuses}}. */
export function parseItem(name, wikitext) {
  const bonuses = templateParams(wikitext, "Infobox Bonuses");
  if (!bonuses) return undefined;
  const info = templateParams(wikitext, "Infobox Item");
  const recipe = templateParams(wikitext, "Infobox Recipe");
  const image = field(info, "image")?.match(/\[\[\s*(?:File|Image):([^\]|]+)/i)?.[1];
  const className = (bonuses.class ?? "").toLowerCase();
  const type = (bonuses.type ?? "").toLowerCase();
  const tier = Number(bonuses.tier);
  const skill = canonicalSkillName(recipe?.skill1 ?? "");
  const skillLevel = Number(recipe?.skill1lvl);
  return {
    name,
    wiki: name,
    ...(image ? { image: fileName(image) } : {}),
    slot: (bonuses.slot ?? "").toLowerCase(),
    class: CLASSES.includes(className) ? className : "none",
    tier: Number.isFinite(tier) ? tier : 0,
    ...(ARMOUR_TYPES.includes(type) ? { armourType: type } : {}),
    wear: parseRequirements(bonuses.requirements),
    members: yes(field(info, "members")),
    tradeable: yes(field(info, "tradeable")),
    ...(skill && Number.isFinite(skillLevel) ? { recipe: { skill, level: skillLevel } } : {}),
  };
}
