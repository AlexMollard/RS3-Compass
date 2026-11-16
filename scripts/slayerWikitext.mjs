// Pure helpers for the Slayer importer (scripts/import-slayer.mjs); tested in tests/slayer-import.test.mjs.
// Task lists come from the Lua data modules Module:Slayer assignments/<Master>, which Module:Slayer Tasks by
// Master requires to render each Slayer assignment/<Master> table. Masters come from Template:Slayer masters/table.
import { nameKey, slug } from "./wikiApi.mjs";
import { canonicalSkillName } from "../src/skillNames.ts";

/**
 * The value of a Lua data module that returns a table literal (`return { ["Name"] = { min = 1, ... } }`).
 * Reads strings, numbers, booleans, nil and nested tables only, and throws on anything else: it never evaluates code.
 * A `nil` field is left undefined.
 */
export function parseLuaTable(source) {
  let i = 0;
  const fail = (what) => {
    throw new Error(`Lua: ${what} at ${i}: ${JSON.stringify(source.slice(i, i + 40))}`);
  };
  const skip = () => {
    for (;;) {
      while (i < source.length && /\s/.test(source[i])) i++;
      if (source.startsWith("--[[", i)) {
        const end = source.indexOf("]]", i);
        if (end < 0) fail("unclosed comment");
        i = end + 2;
      } else if (source.startsWith("--", i)) {
        while (i < source.length && source[i] !== "\n") i++;
      } else return;
    }
  };
  const expect = (text) => {
    skip();
    if (!source.startsWith(text, i)) fail(`expected ${text}`);
    i += text.length;
  };
  const string = () => {
    const quote = source[i++];
    let out = "";
    while (source[i] !== quote) {
      if (i >= source.length || source[i] === "\n") fail("unclosed string");
      if (source[i] === "\\") {
        const c = source[i + 1];
        out += c === "n" ? "\n" : c === "t" ? "\t" : c;
        i += 2;
      } else out += source[i++];
    }
    i++;
    return out;
  };
  const value = () => {
    skip();
    const c = source[i];
    if (c === "{") return table();
    if (c === '"' || c === "'") return string();
    const number = /^-?\d+(?:\.\d+)?/.exec(source.slice(i));
    if (number) {
      i += number[0].length;
      return Number(number[0]);
    }
    for (const [word, v] of [["nil", undefined], ["true", true], ["false", false]])
      if (new RegExp(`^${word}\\b`).test(source.slice(i))) {
        i += word.length;
        return v;
      }
    fail("unexpected value");
  };
  const table = () => {
    expect("{");
    const out = {};
    let position = 1;
    for (;;) {
      skip();
      if (source[i] === "}") {
        i++;
        return out;
      }
      let key;
      if (source[i] === "[") {
        i++;
        key = value();
        expect("]");
        expect("=");
      } else {
        const ident = /^([A-Za-z_]\w*)\s*=(?!=)/.exec(source.slice(i));
        if (ident && !["nil", "true", "false"].includes(ident[1])) {
          key = ident[1];
          i += ident[0].length;
        } else key = position++;
      }
      const v = value();
      if (v !== undefined) out[key] = v;
      skip();
      if (source[i] === "," || source[i] === ";") i++;
      else if (source[i] !== "}") fail("expected , or }");
    }
  };
  expect("return");
  const result = value();
  skip();
  if (i !== source.length) fail("trailing input");
  return result;
}

const FILE = /\[\[File:([^|\]]+?)\.png(?:\|[^\]]*)?\]\]\s*/gi;
const QUEST_ATOM = /^\[\[File:Quest\.png(?:\|[^\]]*)?\]\]\s*\[\[([^|\]]+)(?:\|[^\]]*)?\]\]$/i;
const SKILL_ATOM = /^\[\[File:([^|\]]+?)\.png(?:\|[^\]]*)?\]\]\s*(\d+)$/i;
const MEMBERS_ATOM = /^\[\[File:P2P icon\.png(?:\|[^\]]*)?\]\]\s*\[\[Members\]\]$/i;
const isAtom = (clause) =>
  QUEST_ATOM.test(clause) ||
  MEMBERS_ATOM.test(clause) ||
  (SKILL_ATOM.test(clause) && !!canonicalSkillName(SKILL_ATOM.exec(clause)[1]));

/** Wikitext as plain text: skill icons become the skill's name, other icons go, links become their display text. */
export function plainText(wikitext) {
  return wikitext
    .replace(FILE, (_, file) => (canonicalSkillName(file) ? canonicalSkillName(file) + " " : ""))
    .replace(/\[\[(?:[^|\]]*\|)?([^\]]+)\]\]/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

const questIndex = (quests) => new Map(quests.map((q) => [nameKey(q.name), q.id]));

/**
 * The "other" unlock requirements of one task. The text splits into clauses at ", " only where the clause
 * before is a whole requirement (a skill level, a quest, the members marker) or the clause after starts with
 * an icon, so "X and own a fire cape, TokHaar-Kal or Igneous Kal" stays one clause. A clause becomes a level
 * or a quest only when it is exactly that; anything else ("partial completion of X", "X or Y") stays text.
 * `unmatched` lists quest names that matched no QUESTS entry; they stay in `text`.
 */
export function parseRequirements(other = "", quests = []) {
  const index = questIndex(quests);
  const result = { levels: [], quests: [], text: [], members: false, unmatched: [] };
  const clauses = [];
  for (const piece of other.trim().split(", ")) {
    if (!piece) continue;
    const last = clauses.length - 1;
    if (last < 0 || isAtom(clauses[last]) || piece.startsWith("[[File:")) clauses.push(piece);
    else clauses[last] += ", " + piece;
  }
  for (const clause of clauses.map((c) => c.trim())) {
    const quest = QUEST_ATOM.exec(clause);
    const skill = SKILL_ATOM.exec(clause);
    if (MEMBERS_ATOM.test(clause)) result.members = true;
    else if (quest && index.has(nameKey(quest[1]))) result.quests.push(index.get(nameKey(quest[1])));
    else if (skill && canonicalSkillName(skill[1]))
      result.levels.push({ skill: canonicalSkillName(skill[1]), level: Number(skill[2]) });
    else {
      if (quest) result.unmatched.push(quest[1]);
      result.text.push(plainText(clause));
    }
  }
  return result;
}

/**
 * The tasks of one master from its Module:Slayer assignments/<Master> source. A row without a whole-number
 * weight, or with a bad amount, is rejected into `invalid`, never defaulted. A task is members-only when the
 * master is, or when the Wiki marks it with the members icon. No Slayer requirement means level 1. A combat
 * level requirement goes in `combat`, which is absent when there is none.
 * `wikiPages` maps a lower-case task name to its page where Module:Slayer assignments/disambig overrides
 * the "<Name> (Slayer assignment)" default.
 */
export function parseAssignments(master, source, { quests = [], members, wikiPages = {} }) {
  const data = parseLuaTable(source);
  const tasks = [];
  const invalid = [];
  const unmatched = [];
  const whole = (n, min) => Number.isInteger(n) && n >= min;
  for (const name of Object.keys(data).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))) {
    const row = data[name];
    const reqs = row.reqs ?? {};
    const problems = [
      !whole(row.min, 1) && "no minimum amount",
      !whole(row.max, 1) && "no maximum amount",
      whole(row.min, 1) && whole(row.max, 1) && row.min > row.max && "minimum above maximum",
      row.weight === undefined ? "no weight" : !whole(row.weight, 0) && `bad weight ${row.weight}`,
      ...Object.keys(reqs)
        .filter((k) => !["combat", "other"].includes(k) && !canonicalSkillName(k))
        .map((k) => `unknown requirement ${k}`),
      ...Object.entries(reqs)
        .filter(([k, v]) => k !== "other" && !whole(v, 0))
        .map(([k, v]) => `bad ${k} level ${v}`),
    ].filter(Boolean);
    if (problems.length) {
      invalid.push({ name, problems });
      continue;
    }
    const parsed = parseRequirements(reqs.other, quests);
    unmatched.push(...parsed.unmatched);
    const levels = Object.entries(reqs)
      .filter(([k, v]) => !["combat", "other", "slayer"].includes(k) && v > 0)
      .map(([k, v]) => ({ skill: canonicalSkillName(k), level: v }));
    const key = name.toLowerCase().replace(/ \(slayer assignment\)$/, "");
    tasks.push({
      id: slug(name),
      master,
      name,
      wiki: wikiPages[key] ?? `${name} (Slayer assignment)`,
      amount: [row.min, row.max],
      slayer: reqs.slayer > 0 ? reqs.slayer : 1,
      ...(reqs.combat > 0 ? { combat: reqs.combat } : {}),
      requirements: {
        levels: [...levels, ...parsed.levels],
        quests: parsed.quests,
        text: parsed.text,
      },
      weight: row.weight,
      members: members || parsed.members,
    });
  }
  return { tasks, invalid, unmatched };
}

/** The lower-case task name → page overrides in Module:Slayer assignments/disambig's `p.data` table. */
export function parseDisambig(source) {
  const block = /p\.data\s*=\s*(\{[\s\S]*?\n\})/.exec(source);
  if (!block) throw new Error("Module:Slayer assignments/disambig has no p.data table");
  return parseLuaTable("return " + block[1]);
}

/**
 * The masters in Template:Slayer masters/table, in table order. "N/A" means no requirement: combat 0, Slayer 1.
 * `wiki` is the first linked master in the name cell (Turael for "Turael / Spria"), whose name the assignment
 * module also uses. A quest name that matches no QUESTS entry is kept in `text`, never dropped.
 */
export function parseMastersTable(wikitext, quests = []) {
  const index = questIndex(quests);
  const text = wikitext.replace(/<ref[^>]*\/>/g, "").replace(/<ref[^>]*>[\s\S]*?<\/ref>/g, "");
  const masters = [];
  for (const row of text.split(/\n\|-[^\n]*\n/)) {
    const lines = row.split("\n").filter((l) => l.startsWith("|") && !l.startsWith("|}"));
    if (!lines.length || row.trimStart().startsWith("{|") || row.trimStart().startsWith("!")) continue;
    const cells = lines
      .flatMap((l) => l.slice(1).split("||"))
      .map((c) => c.replace(/^\s*(?:[\w-]+="[^"]*"\s*)+\|(?!\|)/, "").trim());
    const [heads, nameCell, , locationCell, combatCell, slayerCell, questCell] = cells;
    const wiki = /\[\[([^|\]]+)/.exec(nameCell ?? "")?.[1];
    if (!wiki) throw new Error(`Slayer masters table: no master link in ${JSON.stringify(row.slice(0, 80))}`);
    const level = (cell, skill, none) => {
      if (/^\{\{NA\}\}$/i.test(cell)) return none;
      const m = new RegExp(`^\\{\\{Scm\\|${skill}\\|(\\d+)\\}\\}$`, "i").exec(cell);
      if (!m) throw new Error(`Slayer masters table: ${wiki} has an unreadable ${skill} cell ${JSON.stringify(cell)}`);
      return Number(m[1]);
    };
    const questNames = /^\{\{NA\}\}$/i.test(questCell)
      ? []
      : [...questCell.matchAll(/\[\[([^|\]]+)(?:\|[^\]]*)?\]\]/g)].map((m) => m[1]);
    const image = /\{\{chatlp\|([^|}]+)/i.exec(heads ?? "")?.[1];
    const location = /text=([^|}]+)/.exec(locationCell ?? "")?.[1]?.trim();
    masters.push({
      id: slug(wiki),
      name: plainText(nameCell),
      wiki,
      ...(image ? { image: `${image.trim()} chathead.png` } : {}),
      combat: level(combatCell, "Combat level", 0),
      slayer: level(slayerCell, "Slayer", 1),
      quests: questNames.filter((q) => index.has(nameKey(q))).map((q) => index.get(nameKey(q))),
      text: questNames.filter((q) => !index.has(nameKey(q))),
      ...(location ? { location } : {}),
    });
  }
  return masters;
}
