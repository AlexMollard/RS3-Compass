// Pure wikitext helpers for the boss importer; tested in tests/boss-import.test.mjs.
import { plain, templateParams } from "./questWikitext.mjs";

const TIERS = ["Free", "Low", "Mid", "High"];

/** The text of "== name ==" up to the next level-2 heading. */
function section(wikitext, name) {
  const start = wikitext.search(new RegExp("^==\\s*" + name + "\\s*==\\s*$", "mi"));
  if (start === -1) return "";
  const rest = wikitext.slice(start).replace(/^[^\n]*\n/, "");
  const end = rest.search(/^==[^=]/m);
  return end === -1 ? rest : rest.slice(0, end);
}

/** Item names from {{plink|X}} / {{plinkp|X}}, in order, without repeats. */
function plinks(text) {
  const names = [...text.matchAll(/\{\{\s*plinkp?\s*\|([^|}]+)/gi)].map((m) => plain(m[1]));
  return [...new Set(names.filter(Boolean))];
}

function requirementsOf(cell) {
  const lines = cell.split("\n").map((l) => l.trim().replace(/^\*+/, "").trim()).filter(Boolean);
  const out = [];
  for (const line of lines) {
    if (/^\{\{\s*na\s*\}\}$/i.test(line)) continue;
    const skills = [...line.matchAll(/\{\{\s*skillreq\s*\|([^|}]+)\|(\d+)/gi)];
    const quests = [
      ...line.matchAll(/\{\{\s*QuestIcon\s*\|([^|}]+)/gi),
      ...(/^(?:partial )?completion of\s*\[\[/i.test(line) ? line.matchAll(/\[\[([^\]|#]+)/g) : []),
    ];
    if (skills.length || quests.length) {
      for (const m of skills) out.push({ kind: "skill", skill: m[1].trim(), level: Number(m[2]) });
      // QuestIcon takes a page title, which can carry a disambiguator: "Raksha, the Shadow Colossus (quest)".
      for (const m of quests) out.push({ kind: "quest", name: plain(m[1]).replace(/\s*\(quest\)$/i, "") });
    } else {
      const text = plain(line);
      if (text) out.push({ kind: "text", text });
    }
  }
  return out;
}

/** The ==Combat bosses== table as rows; other sections are ignored. */
export function parseBossesTable(wikitext) {
  const rows = [];
  for (const chunk of section(wikitext, "Combat bosses").split(/^\|-[^\n]*$/m).slice(1)) {
    // The last row is followed by the table's closing "|}", which isn't part of its last cell.
    const cells = chunk.split(/^\|\}/m)[0].split(/^\|(?![}-])/m).slice(1).map((c) => c.replace(/\s+$/, ""));
    if (cells.length < 5) continue;
    const [image, name, level, tier, team, ...rest] = cells;
    const [requirements = "", signature = "", release = ""] = rest;
    const tierName = tier.match(/\b(Free|Low|Mid|High)\s+tier/i)?.[1];
    const row = {
      name: plain(name),
      level: Number(plain(level).replace(/,/g, "")),
      tier: TIERS.find((t) => t.toLowerCase() === tierName?.toLowerCase()),
      team: plain(team),
      requirements: requirementsOf(requirements),
      signature: plinks(signature),
    };
    const file = image.match(/\[\[(?:File|Image):([^\]|]+)/i)?.[1].trim();
    if (file) row.image = file;
    const date = plain(release);
    if (date) row.releaseDate = date;
    rows.push(row);
  }
  return rows;
}

/** members / lifepoints / weakness from the first {{Infobox Monster}} version. */
export function parseInfobox(wikitext) {
  const box = templateParams(wikitext, "Infobox Monster") ?? {};
  const first = (key) => box[key] ?? box[key + "1"];
  const out = {};
  const members = plain(first("members") ?? "").toLowerCase();
  if (members === "yes" || members === "no") out.members = members === "yes";
  const life = Number(plain(first("lifepoints") ?? "").replace(/,/g, ""));
  if (Number.isFinite(life) && life > 0) out.lifepoints = life;
  const weakness = plain(first("weakness") ?? "");
  if (weakness) out.weakness = weakness;
  return out;
}

/** Drops by version: each {{DropsLine}} belongs to the {{DropsTableHead}} before it ("Normal" if unversioned). */
export function parseDrops(wikitext) {
  const drops = {};
  let version = "Normal";
  for (const m of wikitext.matchAll(/\{\{\s*Drops(TableHead|Line)\s*[|}\n]/gi)) {
    const params = templateParams(wikitext.slice(m.index), "Drops" + m[1]) ?? {};
    if (m[1].toLowerCase() === "tablehead") {
      version = plain(params.version ?? "") || "Normal";
      continue;
    }
    const item = plain(params.name ?? "");
    if (!item) continue;
    const drop = { item, quantity: plain(params.quantity ?? ""), rarity: plain(params.rarity ?? "") };
    const list = (drops[version] ??= []);
    if (!list.some((d) => d.item === drop.item && d.quantity === drop.quantity && d.rarity === drop.rarity)) list.push(drop);
  }
  return drops;
}

/** Achievement names from {{Achievement|Name}}, without "(achievement)". */
export function parseAchievements(wikitext) {
  const names = [...wikitext.matchAll(/\{\{\s*Achievement\s*\|([^|}]+)/gi)].map((m) =>
    plain(m[1]).replace(/\s*\(achievement\)\s*$/i, ""),
  );
  return [...new Set(names.filter(Boolean))];
}

export const hasStrategy = (wikitext) => /\{\{\s*HasStrategy\s*[|}]/i.test(wikitext);

const FILLER = /\b(rune|seed|logs|ore|bar|bones|essence|hide|dragonhide|root|stone spirit)s?$/i;

function isRare(rarity) {
  if (/^(very )?rare$/i.test(rarity)) return true;
  const m = rarity.match(/^([\d,.]+)\s*\/\s*([\d,.]+)$/);
  if (!m) return false;
  const [a, b] = [Number(m[1].replace(/,/g, "")), Number(m[2].replace(/,/g, ""))];
  return b > 0 && a / b < 1 / 100;
}

/** Signature items plus rare drops (any version), minus coins, noted and bulk items. */
export function deriveUniques(signature, drops) {
  const out = [];
  const add = (name) => {
    if (name !== "Coins" && !FILLER.test(name) && !out.includes(name)) out.push(name);
  };
  signature.forEach(add);
  for (const list of Object.values(drops))
    for (const d of list) if (!/\(noted\)/i.test(d.quantity) && isRare(d.rarity)) add(d.item);
  return out;
}
