// Pure wikitext helpers for the equipment importer; tested in tests/equipment-import.test.mjs.
import { plain, templateParams } from "./questWikitext.mjs";
import { fileName } from "./wikiApi.mjs";
import { canonicalSkillName } from "../src/skillNames.ts";

const CLASSES = ["melee", "ranged", "magic", "necromancy", "none"];
const ARMOUR_TYPES = ["power", "tank", "hybrid"];

/**
 * The item names a list page links to: {{Eqinforow|ge=Name}} rows and {{Eqinforow|name=[[Name]]}}
 * rows (items without a Grand Exchange entry), without repeats, in page order. The rows' other
 * parameters (dontaddtototal, price, ...) and the totals rows are not names.
 */
export function parseListPage(wikitext) {
  const names = [];
  for (const row of eqinforows(wikitext)) {
    // A first parameter that is not key=value is the name; otherwise ge= or name= anywhere in the row.
    const first = row[0] ?? "";
    const keyed = row.map((p) => p.match(/^\s*(ge|name)\s*=([\s\S]*)$/i)).find(Boolean);
    const name = plain(/^[^=]*$/.test(first) ? first : (keyed?.[2] ?? ""));
    if (name && !names.includes(name)) names.push(name);
  }
  return names;
}

/** Each {{Eqinforow|...}} as its parameters, split at top-level pipes. */
function eqinforows(text) {
  const rows = [];
  for (const start of text.matchAll(/\{\{\s*Eqinforow\s*\|/gi)) {
    let depth = 0;
    let link = 0;
    let current = "";
    const params = [];
    for (let i = start.index + start[0].length; i < text.length; i++) {
      const two = text.slice(i, i + 2);
      if (two === "{{") { depth++; current += two; i++; continue; }
      if (two === "[[") { link++; current += two; i++; continue; }
      if (two === "]]") { link--; current += two; i++; continue; }
      if (two === "}}") {
        if (depth === 0) { params.push(current); break; }
        depth--; current += two; i++; continue;
      }
      if (text[i] === "|" && depth === 0 && link === 0) { params.push(current); current = ""; continue; }
      current += text[i];
    }
    rows.push(params);
  }
  return rows;
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
  // No guessed defaults: a missing or unrecognised class, slot or tier stays undefined for the importer to reject.
  const className = (field(bonuses, "class") ?? "").toLowerCase();
  const type = (field(bonuses, "type") ?? "").toLowerCase();
  const tierText = field(bonuses, "tier");
  const tier = tierText !== undefined && /^\d+$/.test(tierText.trim()) ? Number(tierText) : undefined;
  const skill = canonicalSkillName(recipe?.skill1 ?? "");
  const skillLevel = Number(recipe?.skill1lvl);
  return {
    name,
    wiki: name,
    ...(image ? { image: fileName(image) } : {}),
    slot: field(bonuses, "slot")?.toLowerCase(),
    class: CLASSES.includes(className) ? className : undefined,
    tier,
    ...(ARMOUR_TYPES.includes(type) ? { armourType: type } : {}),
    wear: parseRequirements(field(bonuses, "requirements")),
    members: yes(field(info, "members")),
    tradeable: yes(field(info, "tradeable")),
    ...(skill && Number.isFinite(skillLevel) ? { recipe: { skill, level: skillLevel } } : {}),
  };
}
