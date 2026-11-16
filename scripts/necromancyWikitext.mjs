// Pure helpers for the Necromancy importer (scripts/import-necromancy.mjs); tested in tests/necromancy-import.test.mjs.
// Rituals and glyphs come from the Lua data module Module:Necromancy/rituals/data. Upgrade materials come from the
// Wiki's upgrade tables (Template:Death Skull upgrades, Template:Deathdealer upgrades and the table on the
// Deathwarden robe armour page). Every parser throws on a shape it does not know.
import { slug } from "./wikiApi.mjs";
import { parseLuaTable } from "./slayerWikitext.mjs";

export { parseLuaTable };

// Ghostly inks, lowest to highest. Ectoplasm is the only other ingredient of a glyph.
export const INKS = ["Basic ghostly ink", "Regular ghostly ink", "Greater ghostly ink", "Powerful ghostly ink"];

const fail = (what) => {
  throw new Error(`Necromancy data: ${what}`);
};
const isObject = (v) => typeof v === "object" && v !== null && !Array.isArray(v);
const positive = (v, what) => (Number.isInteger(v) && v > 0 ? v : fail(`${what} is not a positive whole number: ${JSON.stringify(v)}`));
const onlyKeys = (row, allowed, what) => {
  const extra = Object.keys(row).filter((k) => !allowed.includes(k));
  if (extra.length) fail(`${what} has unknown fields: ${extra.join(", ")}`);
};
const tierOf = (v, what) => ([1, 2, 3].includes(v) ? v : fail(`${what} tier is not 1-3: ${JSON.stringify(v)}`));
const items = (map, what) => {
  if (!isObject(map) || !Object.keys(map).length) fail(`${what} is not a list of items`);
  return Object.entries(map).map(([item, qty]) => ({ item, qty: positive(qty, `${what} ${item}`) }));
};
/**
 * The source of the module's top-level `["key"] = { ... }` table, found by matching braces (skipping strings and
 * comments). The module's other tables (disturbances, tome XP) hold fractions and "2,367.6", which parseLuaTable
 * rightly refuses, so each table the importer needs is cut out and parsed alone.
 */
function tableSource(lua, key) {
  const start = new RegExp(`\\[\\s*["']${key}["']\\s*\\]\\s*=\\s*\\{`).exec(lua);
  if (!start) fail(`the module has no "${key}" table`);
  let depth = 0;
  for (let i = start.index + start[0].length - 1; i < lua.length; i++) {
    const c = lua[i];
    if (c === '"' || c === "'") {
      for (i++; lua[i] !== c; i++) if (i >= lua.length || lua[i] === "\n") fail(`unclosed string in "${key}"`);
    } else if (lua.startsWith("--", i)) {
      while (i < lua.length && lua[i] !== "\n") i++;
    } else if (c === "{") depth++;
    else if (c === "}" && --depth === 0) return lua.slice(start.index + start[0].length - 1, i + 1);
  }
  return fail(`the "${key}" table is not closed`);
}
const section = (lua, key) => {
  const data = parseLuaTable(`return ${tableSource(lua, key)}`);
  return isObject(data) ? data : fail(`"${key}" is not a table`);
};

/** Every glyph of the module's `glyphs` table. */
export function parseGlyphs(lua) {
  return Object.entries(section(lua, "glyphs")).map(([name, row]) => {
    if (!isObject(row)) fail(`glyph ${name} is not a table`);
    onlyKeys(row, ["type", "tier", "recipe", "lvl", "alteration"], `glyph ${name}`);
    if (!["foundational", "alteration"].includes(row.type)) fail(`glyph ${name} has type ${JSON.stringify(row.type)}`);
    const recipe = items(row.recipe, `glyph ${name} recipe`);
    const inks = recipe.filter((r) => r.item !== "Ectoplasm").map((r) => INKS.indexOf(r.item));
    if (!inks.length || inks.includes(-1)) fail(`glyph ${name} uses an unknown ink: ${recipe.map((r) => r.item).join(", ")}`);
    return {
      id: slug(name),
      name,
      level: positive(row.lvl, `glyph ${name} level`),
      tier: tierOf(row.tier, `glyph ${name}`),
      alteration: row.type === "alteration",
      ink: INKS[Math.max(...inks)],
    };
  });
}

/**
 * Every ritual of the module's `rituals` table, one per recipe (a ritual with several recipes repeats its name,
 * level, tier, XP and ticks). A ritual is members-only above level 20 (the free-to-play cap) or when the Wiki flags it.
 */
export function parseRituals(lua, { f2pCap = 20 } = {}) {
  const out = [];
  for (const [name, row] of Object.entries(section(lua, "rituals"))) {
    if (!isObject(row)) fail(`ritual ${name} is not a table`);
    onlyKeys(row, ["recipes", "type", "glyphs", "tier", "lvl", "ticks", "xp", "members"], `ritual ${name}`);
    if (row.members !== undefined && typeof row.members !== "boolean") fail(`ritual ${name} members is not a boolean`);
    if (!isObject(row.recipes) || !Object.keys(row.recipes).length) fail(`ritual ${name} has no recipes`);
    const recipes = Object.values(row.recipes).map((pair, i) => {
      if (!isObject(pair) || Object.keys(pair).join() !== "1,2") fail(`ritual ${name} recipe ${i + 1} is not an input/output pair`);
      return { inputs: items(pair[1], `ritual ${name} inputs`), outputs: items(pair[2], `ritual ${name} outputs`) };
    });
    const level = positive(row.lvl, `ritual ${name} level`);
    for (const recipe of recipes)
      out.push({
        id: recipes.length === 1 ? slug(name) : `${slug(name)}-${slug(recipe.inputs.map((r) => r.item).join(" "))}`,
        name,
        level,
        tier: tierOf(row.tier, `ritual ${name}`),
        inputs: recipe.inputs,
        outputs: recipe.outputs,
        xp: positive(row.xp, `ritual ${name} XP`),
        ticks: positive(row.ticks, `ritual ${name} ticks`),
        members: level > f2pCap || row.members === true,
      });
  }
  return out;
}

/** The first `pic=` in an upgrade table's header, such as "Death guard (tier 90)". It names a piece of the line's gear. */
export function upgradePic(wikitext) {
  const pic = /\{\{plink\|[^|}]+\|pic=([^|}]+?)\s*(?:\||\}\})/.exec(wikitext)?.[1];
  if (!pic || !/\(tier \d+\)$/.test(pic)) fail(`no "(tier N)" pic in the upgrade table header: ${JSON.stringify(pic)}`);
  return pic;
}

/** The one upgrade table of a Wiki page (the table with a "Quantity per slot" header), for pages that have no template. */
export function upgradeTable(page) {
  const tables = page.split(/^\{\|/m).slice(1).filter((t) => t.includes("Quantity per slot"));
  if (tables.length !== 1) fail(`expected one upgrade table on the page, found ${tables.length}`);
  return "{|" + tables[0].split(/^\|\}/m)[0] + "|}";
}

const LABEL =/^!\s*(?:[a-z]+="[^"]*"\s*)*\|?\s*(.*)$/i;
const MATERIAL = /^\|\s*\{\{plinkt\|([^|}]+)\}\}/;

/**
 * The materials of each tier in a Wiki upgrade table, as { line, tier, materials }. `weapon` tables have a Death guard
 * and a Skull lantern column then a full-set total, and cost `per: "weapon"`. Robe tables have five slot columns then a
 * full-set total, and cost `per: "set"`. The columns must add up to the total. A tier range ("20-60", the
 * deathwarden robes' total inside the deathdealer table) is skipped, and the table's Total row ends it.
 */
export function parseUpgrades(wikitext, line = "weapon") {
  const slots = line === "weapon" ? 2 : 5;
  const steps = new Map();
  let tier;
  for (const row of wikitext.split(/^\|-.*$/m)) {
    const cells = row
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => /^[!|]/.test(l) && !l.startsWith("|}"));
    const data = cells.filter((l) => l.startsWith("|"));
    if (!data.length) continue;
    if (cells.some((l) => l.includes("||") || l.includes("!!"))) fail(`upgrade row with several cells on a line: ${cells[0]}`);
    const label = cells.filter((l) => l.startsWith("!"));
    if (label.length > 1) fail(`upgrade row with ${label.length} header cells: ${label.join(" ")}`);
    if (label.length) {
      const text = LABEL.exec(label[0])[1].replace(/<ref[\s\S]*?<\/ref>/g, "").trim();
      if (text === "Total") break;
      if (/^\d+$/.test(text)) tier = Number(text);
      else if (/^\d+-\d+$/.test(text)) tier = null;
      else fail(`unknown upgrade tier label ${JSON.stringify(text)}`);
    } else if (tier === undefined) fail("upgrade material row before any tier");
    if (tier === null) continue;
    const material = MATERIAL.exec(data[0]);
    if (!material) fail(`tier ${tier} row does not start with a material: ${data[0]}`);
    const counts = data.slice(1).map((l) => (/^\|\s*(\d+)\s*$/.test(l) ? Number(/\d+/.exec(l)[0]) : fail(`tier ${tier} ${material[1]}: unexpected cell ${l}`)));
    if (counts.length !== slots + 1) fail(`tier ${tier} ${material[1]} has ${counts.length} quantities, expected ${slots + 1}`);
    const total = counts.pop();
    if (counts.reduce((a, b) => a + b, 0) !== total) fail(`tier ${tier} ${material[1]}: ${counts.join("+")} is not ${total}`);
    if (line === "weapon" && counts[0] !== counts[1]) fail(`tier ${tier} ${material[1]}: the two weapons differ`);
    steps.set(tier, [
      ...(steps.get(tier) ?? []),
      { item: material[1].trim(), qty: line === "weapon" ? counts[0] : total, per: line === "weapon" ? "weapon" : "set" },
    ]);
  }
  if (!steps.size) fail("the upgrade table has no tiers");
  return [...steps].map(([t, materials]) => ({ line, tier: t, materials }));
}
