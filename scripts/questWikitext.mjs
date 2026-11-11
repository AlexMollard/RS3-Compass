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
      .replace(/\{\{\s*Sxp\s*\|([^|}]+)\|([\d,]+)[^}]*\}\}/gi, (_, skill, n) => `${grouped(n)} ${skill.trim()} XP`)
      .replace(/\{\{\s*Coins\s*\|([\d,]+)[^}]*\}\}/gi, (_, n) => `${grouped(n)} coins`)
      .replace(/\{\{\s*(?:plink|plinkp|plinkt|ql|qlink)\s*\|([^|}]+)(?:\|[^}]*)?\}\}/gi, "$1")
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

export const bullets = (text = "") =>
  text
    .split("\n")
    .filter((line) => /^\*[^*]/.test(line.trim()))
    .map((line) => plain(line.trim().slice(1)))
    .filter((line) => line && !/^(none|n\/a)\.?$/i.test(line));

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

