// Pure wikitext helpers for scripts/import-quests.mjs; tested in tests/quest-import.test.mjs.

/** The parameters of the first {{name ...}} template, split at top-level pipes. */
export function templateParams(text, name) {
  const start = text.search(new RegExp("\\{\\{\\s*" + name.replace(/ /g, "[ _]") + "\\s*[|}\\n]", "i"));
  if (start === -1) return undefined;
  let depth = 0;
  let link = 0;
  let current = "";
  const parts = [];
  for (let i = start + 2; i < text.length; i++) {
    const two = text.slice(i, i + 2);
    if (two === "{{") { depth++; current += two; i++; continue; }
    if (two === "[[") { link++; current += two; i++; continue; }
    if (two === "]]") { link--; current += two; i++; continue; }
    if (two === "}}") {
      if (depth === 0) { parts.push(current); break; }
      depth--; current += two; i++; continue;
    }
    if (text[i] === "|" && depth === 0 && link === 0) { parts.push(current); current = ""; continue; }
    current += text[i];
  }
  const params = {};
  for (const part of parts.slice(1)) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    params[part.slice(0, eq).trim().toLowerCase()] = part.slice(eq + 1).trim();
  }
  return params;
}

export const grouped = (n) => Number(String(n).replace(/,/g, "")).toLocaleString("en");

/** Wikitext to the plain prose Compass shows; GameText re-links known names. */
export function plain(text) {
  let out = text
    .replace(/<ref[^>]*\/>/gi, "")
    .replace(/<ref[^>]*>[\s\S]*?<\/ref>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "");
  for (let i = 0; i < 4; i++)
    out = out
      .replace(/\{\{\s*Skillreq\s*\|([^|}]+)\|(\d+)[^}]*\}\}/gi, "level $2 $1")
      .replace(/\{\{\s*(?:Sxp|Skill XP)\s*\|([^|}]+)\|([\d,]+)[^}]*\}\}/gi, (_, skill, n) => `${grouped(n)} ${skill.trim()} XP`)
      // {{scm|Smithing|8500}} is a skill amount in a sentence ("a total of 8,500 Smithing experience").
      .replace(/\{\{\s*scm\s*\|([^|}]+)\|([\d,]+)[^}]*\}\}/gi, (_, skill, n) => `${grouped(n)} ${skill.trim()}`)
      .replace(/\{\{\s*(?:scl|Skill clickpic)\s*\|([^|}]+)[^}]*\}\}/gi, "$1")
      .replace(/\{\{\s*Coins\s*\|([\d,]+)[^}]*\}\}/gi, (_, n) => `${grouped(n)} coins`)
      .replace(/\{\{\s*(?:plink|plinkp|plinkt|ql|qlink)\s*\|([^|}]+)(?:\|[^}]*)?\}\}/gi, "$1")
      // {{TitleAnchor|t=of the Elves|c=#00FFFF|loc=s}} is the title's own text.
      .replace(/\{\{\s*TitleAnchor\s*\|([^{}]*)\}\}/gi, (_, args) => titleAnchor(args).label)
      .replace(/\{\{\s*(?:Map|NA|Clear|Needed|Bank|Members|FP|M|DisplayTime)[^{}]*\}\}/gi, "")
      .replace(/\{\{[^{}]*\}\}/g, "");
  return out
    .replace(/\[\[(?:File|Image|Category):[^\]]*\]\]/gi, "")
    .replace(/\[\[[^\]|]*\|([^\]]*)\]\]/g, "$1")
    .replace(/\[\[([^\]]*)\]\]/g, "$1")
    .replace(/\[https?:[^\s\]]+ ([^\]]*)\]/g, "$1")
    .replace(/'''?/g, "")
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:)])/g, "$1")
    .replace(/\(\s*\)/g, "")
    .trim();
}

/**
 * The top-level "*" lines as plain text. Nested "**" lines are dropped, or with `join`
 * appended to their parent ("Two lore books: Book A; Book B") so a list keeps its contents.
 */
export function bullets(text = "", join = false) {
  return bulletEntries(text, join).map((entry) => entry.text);
}

/** bullets() with each line's source wikitext (parent plus joined children) kept as `raw`. */
function bulletEntries(text = "", join = false) {
  const lines = [];
  for (const source of text.split("\n")) {
    const line = source.trim();
    if (/^\*[^*]/.test(line)) lines.push({ text: plain(line.slice(1)), children: [], raw: line.slice(1) });
    else if (join && line.startsWith("**") && lines.length) {
      const child = line.replace(/^\*+/, "");
      lines.at(-1).children.push(plain(child));
      lines.at(-1).raw += "\n" + child;
    }
  }
  return lines
    .map(({ text, children, raw }) => {
      const nested = children.filter(Boolean).join("; ").replace(/:;/g, ":");
      return { text: nested ? `${text} ${nested}` : text, raw };
    })
    .filter(({ text }) => text && !/^(none|n\/a)\.?$/i.test(text));
}

/** The Wiki page a title links to; TitleAnchor's own link=, else the list of titles. */
export const TITLES_PAGE = "Titles";

function titleAnchor(args) {
  const named = (key) => args.match(new RegExp(`(?:^|\\|)\\s*${key}\\s*=([^|]*)`, "i"))?.[1].trim();
  return { label: named("t") ?? "", target: wikiPage(named("link") ?? "") || TITLES_PAGE };
}

/** A link target as a Wiki page title: no anchor, spaces, first letter capitalised. */
export function wikiPage(target = "") {
  const page = target.split("#")[0].replaceAll("_", " ").replace(/\s+/g, " ").trim();
  return page.charAt(0).toUpperCase() + page.slice(1);
}

/**
 * The Wiki links in one line's wikitext as label → page, where the label is the text exactly as
 * plain() shows it in `text` (link trails included: "[[Bandos chronicle]]s"). Labels missing from
 * `text`, or used for two different pages, are dropped. `titles` are the pages TitleAnchors link to.
 */
export function lineLinks(raw, text) {
  const source = raw
    .replace(/<ref[^>]*\/>/gi, "")
    .replace(/<ref[^>]*>[\s\S]*?<\/ref>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "");
  const found = [];
  for (const m of source.matchAll(/\[\[([^\]|]*)(?:\|([^\]]*))?\]\](\p{L}*)/gu)) {
    if (/^\s*(?::|File:|Image:|Category:|Media:)/i.test(m[1])) continue;
    found.push({ label: plain(m[2] ?? m[1]) + m[3], target: wikiPage(m[1]) });
  }
  for (const m of source.matchAll(/\{\{\s*(?:plink|plinkp|plinkt)\s*\|([^|}]+)(?:\|[^}]*)?\}\}/gi))
    found.push({ label: plain(m[1]), target: wikiPage(m[1]) });
  const titles = [];
  for (const m of source.matchAll(/\{\{\s*TitleAnchor\s*\|([^{}]*)\}\}/gi)) {
    const title = titleAnchor(m[1]);
    found.push(title);
    titles.push(title.target);
  }
  const links = {};
  const ambiguous = new Set();
  for (const { label, target } of found) {
    if (!label || !target || !text.includes(label)) continue;
    if (links[label] && links[label] !== target) ambiguous.add(label);
    links[label] ??= target;
  }
  for (const label of ambiguous) delete links[label];
  return { links, titles: [...new Set(titles)].filter((t) => Object.values(links).includes(t)) };
}

/** Reward bullets (children joined) with each line's Wiki links; see lineLinks(). */
export function linkedBullets(text = "") {
  return bulletEntries(text, true).map(({ text, raw }) => ({ text, ...lineLinks(raw, text) }));
}

/** The Quest rewards template's music list: each bullet's linked track page, or its plain name. */
export function musicTracks(text = "") {
  const tracks = [];
  for (const source of text.split("\n")) {
    const line = source.trim();
    if (!/^\*/.test(line)) continue;
    const linked = firstLink(line);
    const track = linked ? wikiPage(linked) : plain(line.replace(/^\*+/, "")).replace(/\s*\(.*$/, "");
    if (track && !/^(none|n\/a)\.?$/i.test(track) && !tracks.includes(track)) tracks.push(track);
  }
  return tracks;
}

/** Every [[link]] target in order, without anchors or labels. */
export function links(text = "") {
  return [...text.matchAll(/\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|[^\]]*)?\]\]/g)]
    .map((m) => m[1].trim())
    .filter((t) => !/^(File|Image|Category):/i.test(t));
}

export function firstLink(text = "") {
  const match = text.match(/\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|[^\]]*)?\]\]/);
  return match?.[1].trim();
}

/** The storyline series from {{Infobox Quest}}: main_series and a positive-integer series_nth. */
export function questSeries(text) {
  const infobox = templateParams(text, "Infobox Quest");
  if (!infobox) return undefined;
  const name = plain(infobox.main_series ?? "");
  const nth = (infobox.series_nth ?? "").trim();
  if (!name || /^(none|no)$/i.test(name) || !/^\d+$/.test(nth)) return undefined;
  const order = Number(nth);
  return order > 0 ? { name, order } : undefined;
}

export function parseQuestreq(lua) {
  const map = new Map();
  for (const match of lua.matchAll(/\["([^"]+)"\]\s*=\s*\{([^}]*)\}/g)) {
    if (/^(Follows|Full):/.test(match[1])) continue;
    map.set(match[1], [...match[2].matchAll(/"([^"]+)"/g)].map((m) => m[1]));
  }
  return map;
}

/** The first {{Map}}/{{Maplink}} pin: x=/y= params, a bare "x, y" or "x:N,y:N". */
export function mapPin(text = "") {
  // Quest pages use {{Map}}/{{Maplink}}; NPC infoboxes use {{NPC map|x=..|y=..}}.
  const pin = text.match(/\{\{\s*(?:NPC map|Map(?:link)?)\s*\|([^}]*)\}\}/i);
  if (!pin) {
    // Location pages outline an area: {{Area map|x,y|x,y|...}}; pin its centre.
    const area = text.match(/\{\{\s*Area map\s*\|([^}]*)\}\}/i);
    const points = [...(area?.[1] ?? "").matchAll(/(\d+)\s*,\s*(\d+)/g)].map((m) => [Number(m[1]), Number(m[2])]);
    if (!points.length) return undefined;
    const mean = (i) => Math.round(points.reduce((sum, p) => sum + p[i], 0) / points.length);
    return { x: mean(0), y: mean(1), plane: 0 };
  }
  const parts = pin[1].split("|").map((p) => p.trim());
  const named = Object.fromEntries(
    parts.map((p) => p.split("=").map((s) => s.trim())).filter((p) => p.length === 2),
  );
  let x = Number(named.x), y = Number(named.y);
  if (!Number.isInteger(x) || !Number.isInteger(y)) {
    const bare = parts.map((p) => p.match(/^(\d+)\s*,\s*(\d+)$/)).find(Boolean);
    const colon = pin[1].match(/x:\s*(\d+)\s*,\s*y:\s*(\d+)/i);
    const found = bare ?? colon;
    if (!found) return undefined;
    x = Number(found[1]);
    y = Number(found[2]);
  }
  const plane = Number(named.plane ?? 0);
  const mapId = Number(named.mapid ?? named.mapID ?? -1);
  return {
    x,
    y,
    plane: [0, 1, 2, 3].includes(plane) ? plane : 0,
    ...(mapId > 0 && mapId !== 28 ? { mapId } : {}),
  };
}

