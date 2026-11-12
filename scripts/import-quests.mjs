// Generates src/questsImported.ts from the RuneScape Wiki.
// Run locally: node --experimental-strip-types scripts/import-quests.mjs
// Order: the Wiki's quest progression guide, then any remaining Category:Quests pages.
// Hand-written quests in src/quests*.ts always win; imported records never replace them.
import { writeFileSync } from "node:fs";
import { QUESTS } from "../src/data.ts";
import { IMPORTED_QUESTS } from "../src/questsImported.ts";
import { RS3_SKILL_NAMES } from "../src/skillNames.ts";
import { groupRewards } from "../src/lib/questRewards.ts";
import {
  bullets,
  firstLink,
  linkedBullets,
  links,
  mapPin,
  musicTracks,
  parseQuestreq,
  plain,
  questSeries,
  spriteFiles,
  templateParams,
  wikiPage,
} from "./questWikitext.mjs";

const API = "https://runescape.wiki/api.php";
const USER_AGENT = "RS3 Compass quest import (https://github.com/AlexMollard/RS3-Compass)";
const OUT = new URL("../src/questsImported.ts", import.meta.url);
const BATCH = 50;
// Quests whose start text links nowhere with a pin: the Wiki page that has one.
const START_PAGES = {
  "Legends' Quest": ["Legends' guard"],
  // Starts at any house portal; Rimmington is the first one players get.
  "A Clockwork Syringe": ["Rimmington"],
};
// Umbrella quests whose quest points Jagex awards on the subquests instead (umbrella qp 0).
const SUBQUEST_QP = new Set(["Recipe for Disaster"]);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function api(params) {
  const url = new URL(API);
  for (const [k, v] of Object.entries({ format: "json", formatversion: "2", ...params }))
    url.searchParams.set(k, v);
  for (let attempt = 0; ; attempt++) {
    const response = await fetch(url, { headers: { "user-agent": USER_AGENT } });
    if (response.ok) {
      await sleep(300);
      return response.json();
    }
    if (attempt >= 3) throw new Error(`${response.status} for ${url}`);
    await sleep(2000 * (attempt + 1));
  }
}
const chunks = (list) =>
  Array.from({ length: Math.ceil(list.length / BATCH) }, (_, i) =>
    list.slice(i * BATCH, i * BATCH + BATCH),
  );
const nameKey = (name) =>
  name.normalize("NFKC").replaceAll("’", "'").replaceAll("_", " ").trim().toLowerCase();
export const slug = (name) =>
  name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/['’!.]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
const fileName = (name) => name.trim().replace(/^File:/i, "").replaceAll(" ", "_");

async function pageContents(titles) {
  const pages = new Map();
  for (const batch of chunks(titles)) {
    const json = await api({
      action: "query",
      prop: "revisions",
      rvprop: "content",
      rvslots: "main",
      redirects: "1",
      titles: batch.join("|"),
    });
    const redirects = new Map(
      (json.query.redirects ?? []).map((r) => [r.to, r.from]),
    );
    for (const page of json.query.pages) {
      if (page.missing || !page.revisions) continue;
      const content = page.revisions[0].slots.main.content;
      pages.set(page.title, content);
      const from = redirects.get(page.title);
      if (from) pages.set(from, content);
    }
  }
  return pages;
}

async function existingFiles(files) {
  const found = new Set();
  for (const batch of chunks([...new Set(files)])) {
    const json = await api({
      action: "query",
      prop: "imageinfo",
      titles: batch.map((f) => "File:" + f).join("|"),
    });
    for (const page of json.query.pages)
      if (!page.missing && page.imageinfo) found.add(fileName(page.title));
  }
  return found;
}

/**
 * Each existing file → the file /images/ actually serves. A redirected file name ("Coins.png" →
 * "Coins_10000.png") exists for the API but 404s as an image URL, so sprites store the target.
 */
async function servedFiles(files) {
  const served = new Map();
  for (const batch of chunks([...new Set(files)])) {
    const json = await api({
      action: "query",
      prop: "imageinfo",
      redirects: "1",
      titles: batch.map((f) => "File:" + f).join("|"),
    });
    const resolve = new Map();
    for (const n of json.query.normalized ?? []) resolve.set(n.from, n.to);
    for (const r of json.query.redirects ?? []) resolve.set(r.from, r.to);
    const found = new Set(json.query.pages.filter((p) => !p.missing && p.imageinfo).map((p) => p.title));
    for (const file of batch) {
      let title = "File:" + file;
      for (let i = 0; i < 3 && resolve.has(title); i++) title = resolve.get(title);
      if (found.has(title)) served.set(file, fileName(title));
    }
  }
  return served;
}

async function pageImages(titles) {
  const images = new Map();
  for (const batch of chunks([...new Set(titles)])) {
    const json = await api({
      action: "query",
      prop: "pageimages",
      piprop: "name",
      redirects: "1",
      titles: batch.join("|"),
    });
    const redirects = new Map((json.query.redirects ?? []).map((r) => [r.to, r.from]));
    for (const page of json.query.pages) {
      if (!page.pageimage) continue;
      images.set(page.title, page.pageimage);
      const from = redirects.get(page.title);
      if (from) images.set(from, page.pageimage);
    }
  }
  return images;
}

// Infobox templates that say what a linked page is; the first kind listed wins (Ghast is NPC and Monster).
const KIND_TEMPLATES = [
  ["item", ["Item", "Bonuses"]],
  ["spell", ["Spell"]],
  ["music", ["Music"]],
  ["npc", ["NPC", "Monster"]],
  ["place", ["Location", "City", "Dungeon", "Shop"]],
];
// For pages without such an infobox, such as the "Ancient Magicks" spellbook.
const KIND_CATEGORIES = [["spell", "Spells"], ["music", "Music tracks"]];

/** Each page's kind (item, spell, music, npc, place or other) and its title after redirects. */
async function pageKinds(pages) {
  const kinds = new Map();
  const templates = KIND_TEMPLATES.flatMap(([, names]) => names.map((n) => "Template:Infobox " + n));
  const categories = KIND_CATEGORIES.map(([, name]) => "Category:" + name);
  for (const batch of chunks([...new Set(pages)])) {
    const resolve = new Map();
    const found = new Map();
    let next;
    do {
      const json = await api({
        action: "query",
        prop: "templates|categories",
        tltemplates: templates.join("|"),
        tllimit: "max",
        clcategories: categories.join("|"),
        cllimit: "max",
        redirects: "1",
        titles: batch.join("|"),
        ...next,
      });
      for (const n of json.query.normalized ?? []) resolve.set(n.from, n.to);
      for (const r of json.query.redirects ?? []) resolve.set(r.from, r.to);
      for (const page of json.query.pages) {
        if (page.missing || page.invalid) continue;
        const marks = found.get(page.title) ?? new Set();
        for (const t of [...(page.templates ?? []), ...(page.categories ?? [])]) marks.add(t.title);
        found.set(page.title, marks);
      }
      next = json.continue;
    } while (next);
    for (const page of batch) {
      let title = page;
      for (let i = 0; i < 3 && resolve.has(title); i++) title = resolve.get(title);
      const marks = found.get(title) ?? new Set();
      const kind =
        KIND_TEMPLATES.find(([, names]) => names.some((n) => marks.has("Template:Infobox " + n)))?.[0] ??
        KIND_CATEGORIES.find(([, name]) => marks.has("Category:" + name))?.[0] ??
        "other";
      kinds.set(page, { kind, title });
    }
  }
  return kinds;
}

function lead(content) {
  const infobox = content.search(/\{\{\s*Infobox Quest/i);
  let rest = content.slice(infobox === -1 ? 0 : infobox);
  if (infobox !== -1) {
    let depth = 0;
    for (let i = 0; i < rest.length; i++) {
      if (rest.startsWith("{{", i)) { depth++; i++; }
      else if (rest.startsWith("}}", i)) { depth--; i++; if (depth === 0) { rest = rest.slice(i + 1); break; } }
    }
  }
  const paragraph = rest
    .split(/\n==/)[0]
    .split("\n")
    .map((l) => l.trim())
    .find((l) => l && !l.startsWith("{{") && !l.startsWith("[[File") && !l.startsWith("|") && !l.startsWith("}}"));
  const text = plain(paragraph ?? "");
  const sentences = text.match(/[^.!?]+[.!?]+(\s|$)/g) ?? [text];
  let why = "";
  for (const sentence of sentences) {
    if (why && (why + sentence).length > 260) break;
    why += sentence;
  }
  return why.trim();
}

function parseQuest(title, content, questreq, npcPins) {
  const details = templateParams(content, "Quest details");
  const infobox = templateParams(content, "Infobox Quest") ?? {};
  if (!details) return { skip: "no Quest details" };
  const members = /^yes/i.test(details.members ?? "");
  const npcWiki = firstLink(details.start) ?? title;
  const startLinks = [...links(details.start), ...(START_PAGES[title] ?? [])];
  const map =
    mapPin(details.start_path) ??
    startLinks.map((link) => npcPins.get(link)).find(Boolean);
  if (!map) return { skip: "no start map pin", startLinks };
  const npc = npcWiki.replace(/\s*\(.*\)$/, "");
  const skills = new Map();
  for (const m of (details.requirements ?? "").matchAll(/\{\{\s*Skillreq\s*\|([^|}]+)\|(\d+)/gi)) {
    const skill = m[1].trim().replace(/^Hitpoints$/i, "Constitution").replace(/^Runecraft$/i, "Runecrafting");
    const name = RS3_SKILL_NAMES.find((s) => s.toLowerCase() === skill.toLowerCase());
    if (name) skills.set(name, Math.max(skills.get(name) ?? 0, Number(m[2])));
  }
  const notes = bullets(details.requirements).filter((line) => !/^level \d+ /i.test(line));
  // "{{Skillreq|Quest points|N}}" isn't a skill, so it becomes a note rather than vanishing.
  const questPoints = (details.requirements ?? "").match(/\{\{\s*Skillreq\s*\|\s*Quest points\s*\|(\d+)/i)?.[1];
  if (questPoints) notes.push(`Requires ${questPoints} quest points.`);
  const rewardsTemplate = templateParams(content, "Quest rewards") ?? {};
  const qp = SUBQUEST_QP.has(title) ? 0 : Number(rewardsTemplate.qp);
  const rewards = [...(qp > 0 ? [`${qp} quest point${qp === 1 ? "" : "s"}`] : [])];
  // Item and unlock lines keep their Wiki links (by index into rewards) for icons and links.
  const rewardLinks = {};
  const titlePages = new Set();
  for (const line of linkedBullets(rewardsTemplate.rewards)) {
    const groups = groupRewards([line.text]);
    if ((groups.items.length || groups.unlocks.length) && Object.keys(line.links).length) {
      rewardLinks[rewards.length] = line.links;
      for (const page of line.titles) titlePages.add(page);
    }
    rewards.push(line.text);
  }
  // Nested items stay on their parent line: they are often alternatives ("one of the following:").
  // Supply lines keep their Wiki links (by index into supplies, anchors kept) for item sprites.
  const supplies = [];
  const supplyLinks = {};
  for (const line of linkedBullets(details.items, true)) {
    if (Object.keys(line.links).length) supplyLinks[supplies.length] = line.links;
    supplies.push(line.text);
  }
  const image = (infobox.image ?? "").match(/\[\[File:([^|\]]+)/i)?.[1];
  // Required kills: "* 3 [[Ghast]]s (level 35)". Identity is the linked page plus the level.
  const required = [];
  for (const line of (details.kills ?? "").split("\n")) {
    if (!/^\*[^*]/.test(line.trim())) continue;
    const wiki = firstLink(line);
    if (!wiki) continue;
    const levels = line.match(/level[s]?\s*([\d\s,–-]+\d)/i)?.[1].replace(/\s+/g, "");
    const name = wiki.replace(/\s*\(.*\)$/, "");
    const level = levels && /^\d+$/.test(levels) ? Number(levels) : levels || "?";
    const same = required.find((e) => e.wiki === wiki);
    if (same) {
      // One creature at several levels stays one entry: "35, 50".
      if (!String(same.level).split(", ").includes(String(level)))
        same.level = `${same.level}, ${level}`;
      continue;
    }
    required.push({ name, wiki, image: fileName(`${name}.png`), level });
  }
  return {
    rewardLinks,
    supplyLinks,
    titlePages,
    music: musicTracks(rewardsTemplate.music),
    combat: { required, hazards: [], notes: [] },
    record: {
      id: slug(title),
      name: title,
      icon: details.icon ? fileName(details.icon) : "Quest.png",
      artwork: image ? fileName(image) : "Quest.png",
      members,
      difficulty: plain(details.difficulty ?? infobox.difficulty ?? "Unknown") || "Unknown",
      length: plain(details.length ?? "") || "Unknown",
      start: {
        npc,
        npcWiki,
        image: fileName(`${npc} chathead.png`),
        location: plain(infobox.area ?? "") || title,
        meetingPoint: plain(details.start ?? "") || "See the Wiki for the starting point.",
        map,
      },
      why: lead(content) || `${title} on the RuneScape Wiki.`,
      requirements: [...skills].map(([skill, level]) => ({ skill, level })),
      questRequirementNames: questreq.get(title) ?? [],
      preparationNotes: notes,
      supplies,
      rewards: rewards.length ? rewards : ["See the Wiki for rewards."],
      wiki: title.replaceAll(" ", "_"),
    },
  };
}

// --- main ---
const imported = new Set(IMPORTED_QUESTS.map((q) => q.id));
const handWritten = QUESTS.filter((q) => !imported.has(q.id));
const known = new Map();
for (const q of handWritten) {
  known.set(nameKey(q.name), q.id);
  known.set(nameKey(q.wiki), q.id);
  known.set(q.id, q.id);
}

const guide = (await api({ action: "parse", page: "Quests/Progression guide", prop: "wikitext" })).parse.wikitext;
const order = [...new Set([...guide.matchAll(/data-rowid="([^"]+)"/g)].map((m) => m[1].trim()).filter(Boolean))];
async function categoryMembers(name) {
  const members = [];
  let cmcontinue;
  do {
    const json = await api({
      action: "query",
      list: "categorymembers",
      cmtitle: "Category:" + name,
      cmnamespace: "0",
      cmlimit: "500",
      ...(cmcontinue ? { cmcontinue } : {}),
    });
    members.push(...json.query.categorymembers.map((m) => m.title));
    cmcontinue = json.continue?.cmcontinue;
  } while (cmcontinue);
  return members;
}
const category = await categoryMembers("Quests");
const miniquests = new Set(await categoryMembers("Miniquests"));
// Historical and past-event quests stay searchable but leave the planning route.
const removed = new Set(await categoryMembers("Removed content"));
const inCategory = new Set(category);
const titles = [
  ...order.filter((t) => inCategory.has(t)),
  ...category.filter((t) => !order.includes(t)).sort((a, b) => a.localeCompare(b)),
  ...[...miniquests].filter((t) => !inCategory.has(t)).sort((a, b) => a.localeCompare(b)),
].filter((t) => !known.has(nameKey(t)) && !known.has(slug(t)));

const questreqContent = (await pageContents(["Module:Questreq/data"])).get("Module:Questreq/data");
const questreq = parseQuestreq(questreqContent);
const contents = await pageContents(titles);

// Pages without a start pin fall back to the first pin found on a page linked from
// the start text: the NPC first, then the place (e.g. Lumbridge Castle).
const npcPins = new Map();
const unpinned = titles
  .map((title) => contents.get(title) && parseQuest(title, contents.get(title), questreq, npcPins))
  .filter((result) => result?.skip === "no start map pin")
  .flatMap((result) => result.startLinks);
const npcPages = await pageContents([...new Set(unpinned)]);
for (const [npc, content] of npcPages) {
  const pin = mapPin(content);
  if (pin) npcPins.set(npc, pin);
}

const records = [];
const combatPlans = {};
const rewardLinks = {};
const supplyLinks = {};
const titlePages = new Set();
const music = {};
const skipped = [];
for (const title of titles) {
  const content = contents.get(title);
  if (!content) { skipped.push(`${title}: page not found`); continue; }
  const result = parseQuest(title, content, questreq, npcPins);
  const { record, combat, skip } = result;
  if (skip) { skipped.push(`${title}: ${skip}`); continue; }
  if (!record.members) { skipped.push(`${title}: free-to-play, add by hand`); continue; }
  if (miniquests.has(title))
    record.kind = /\(saga\)$/i.test(title) ? "saga" : "miniquest";
  if (removed.has(title)) record.availability = "removed";
  records.push(record);
  combatPlans[record.id] = combat;
  if (Object.keys(result.rewardLinks).length) rewardLinks[record.id] = result.rewardLinks;
  if (Object.keys(result.supplyLinks).length) supplyLinks[record.id] = result.supplyLinks;
  for (const page of result.titlePages) titlePages.add(page);
  if (result.music.length) music[record.id] = result.music;
}

// What each page linked from a reward or supply line is, and a sprite for items whose File:<page>.png
// exists (redirects resolved). An anchored supply link ("Antipoison#(3)") is its page's kind,
// preferring File:<page> (<anchor>).png.
const linkedPages = [
  ...new Set(
    [rewardLinks, supplyLinks].flatMap((table) =>
      Object.values(table).flatMap((lines) => Object.values(lines).flatMap(Object.values)),
    ),
  ),
].filter((page) => !titlePages.has(page));
const kinds = await pageKinds(linkedPages.map((page) => wikiPage(page)));
const sprites = (page) => spriteFiles(kinds.get(wikiPage(page)).title, page);
const items = linkedPages.filter((page) => kinds.get(wikiPage(page)).kind === "item");
const served = await servedFiles(items.flatMap(sprites));
const references = {};
for (const page of linkedPages) {
  const { kind } = kinds.get(wikiPage(page));
  const file = kind === "item" && sprites(page).find((file) => served.has(file));
  const image = file && served.get(file);
  references[page] = image ? { kind, image } : { kind };
}
for (const page of titlePages) references[page] = { kind: "title" };

// No infobox image: use the page's own lead picture (a quest screenshot), never an icon or chathead.
const artless = records.filter((r) => r.artwork === "Quest.png");
const leadImages = await pageImages(artless.map((r) => r.name));
for (const r of artless) {
  const lead = leadImages.get(r.name);
  if (lead && !/(icon|chathead)\.png$|^Quest\.png$|\.svg$/i.test(lead)) r.artwork = fileName(lead);
}

const files = await existingFiles([
  ...records.flatMap((r) => [r.icon, r.artwork, r.start.image]),
  ...Object.values(combatPlans).flatMap((p) => p.required.map((e) => e.image)),
]);
for (const plan of Object.values(combatPlans))
  for (const enemy of plan.required) if (!files.has(enemy.image)) delete enemy.image;
const locationImages = await pageImages(records.map((r) => r.start.location));
const finalIds = new Map([...known]);
for (const r of records) { finalIds.set(nameKey(r.name), r.id); finalIds.set(r.id, r.id); }
const locations = {};
for (const r of records) {
  if (!files.has(r.icon)) r.icon = "Quest.png";
  if (!files.has(r.artwork)) r.artwork = r.icon;
  if (!files.has(r.start.image)) r.start.image = r.icon;
  r.questRequirements = [];
  for (const raw of r.questRequirementNames) {
    // "Full:X" means X must be fully completed, which is still quest X.
    const name = raw.replace(/^Full:/i, "");
    // "Misc:" entries are plain requirements such as "Ability to enter Morytania".
    if (/^Misc:/i.test(name)) {
      r.preparationNotes.push(plain(name.replace(/^Misc:/i, "")));
      continue;
    }
    // "Partial:X" needs only part of X, so it is a note rather than a blocking requirement.
    if (/^Partial:/i.test(name)) {
      r.preparationNotes.push(`Get partway through ${name.replace(/^Partial:/i, "")} first; check the Wiki for the point needed.`);
      continue;
    }
    const id = finalIds.get(nameKey(name)) ?? finalIds.get(slug(name));
    // The Wiki can list one quest twice ("X" and "Full:X"); keep it once.
    if (id && id !== r.id) { if (!r.questRequirements.includes(id)) r.questRequirements.push(id); }
    else r.preparationNotes.push(`Complete ${name} first; Compass doesn't track it.`);
  }
  delete r.questRequirementNames;
  if (!r.preparationNotes.length) delete r.preparationNotes;
  const name = r.start.location;
  locations[name] ??= {
    name,
    wiki: name,
    image: locationImages.get(name) ? fileName(locationImages.get(name)) : r.artwork,
    members: true,
    summary: `Start of ${r.name}.`,
  };
}

// An umbrella quest ("Recipe for Disaster") is finished only once its "Name: ..." subquests are,
// but the Wiki lists just its outer prerequisites. Add the subquests no other subquest needs.
for (const r of records) {
  const subquests = records.filter((s) => s.name.startsWith(r.name + ": "));
  const needed = new Set(subquests.flatMap((s) => s.questRequirements));
  for (const s of subquests)
    if (!needed.has(s.id) && !r.questRequirements.includes(s.id)) r.questRequirements.push(s.id);
}

// Keep the guide order, but pull each imported prerequisite in just before the first
// quest that needs it, so miniquests and late-listed quests appear in a playable order.
const byId = new Map(records.map((r) => [r.id, r]));
const ordered = [];
const placed = new Set();
const place = (record, path = new Set()) => {
  if (placed.has(record.id) || path.has(record.id)) return;
  path.add(record.id);
  for (const id of record.questRequirements) {
    const dependency = byId.get(id);
    if (dependency) place(dependency, path);
  }
  placed.add(record.id);
  ordered.push(record);
};
for (const record of records) place(record);
records.splice(0, records.length, ...ordered);

// Wiki pages (hand-written and imported) that have a "/Quick guide" subpage.
const guidePages = [...handWritten, ...records].map((q) => q.wiki.replaceAll("_", " ") + "/Quick guide");
const quickGuides = [];
for (const batch of chunks(guidePages)) {
  const json = await api({ action: "query", titles: batch.join("|") });
  const normalized = new Map((json.query.normalized ?? []).map((n) => [n.to, n.from]));
  for (const page of json.query.pages)
    if (!page.missing && !page.invalid)
      quickGuides.push((normalized.get(page.title) ?? page.title).replace(/\/Quick guide$/, "").replaceAll(" ", "_"));
}
quickGuides.sort();

// Storyline series per quest (infobox main_series / series_nth); imported pages are already fetched.
const handContents = await pageContents(handWritten.map((q) => q.wiki.replaceAll("_", " ")));
const series = {};
for (const q of [...handWritten, ...records]) {
  const title = q.wiki.replaceAll("_", " ");
  const text = contents.get(title) ?? handContents.get(title);
  const found = text && questSeries(text);
  if (found) series[q.wiki.replaceAll(" ", "_")] = found;
  // Imported quests already have theirs; hand-written ones get music from the same template.
  const tracks = text && !music[q.id] ? musicTracks(templateParams(text, "Quest rewards")?.music) : [];
  if (tracks.length) music[q.id] = tracks;
}
// Tables written one entry per line, keys sorted, to keep the generated file compact and stable.
const table = (object) =>
  Object.entries(object)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([key, value]) => `  ${JSON.stringify(key)}: ${JSON.stringify(value)},`)
    .join("\n");
const sortedSeries = Object.fromEntries(Object.entries(series).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));

const today = new Date().toISOString().slice(0, 10);
const source = `// Generated by scripts/import-quests.mjs on ${today}. Do not edit by hand: rerun the script.
// Source: RuneScape Wiki (CC BY-NC-SA 3.0) — quest pages, Quests/Progression guide and Module:Questreq/data.
// Hand-written quests in src/quests*.ts take precedence and are never imported.
import type { QuestRecord } from "./data";
import type { LocationRecord } from "./locations";
import type { CombatPlan } from "./combatData";
import type { RewardReference } from "./lib/questRewards";

export const IMPORTED_QUESTS: QuestRecord[] = ${JSON.stringify(records, null, 2)};

export const IMPORTED_LOCATIONS: Record<string, LocationRecord> = ${JSON.stringify(locations, null, 2)};

export const IMPORTED_COMBAT: Record<string, CombatPlan> = ${JSON.stringify(combatPlans, null, 2)};

/** Quest wiki pages that have a "/Quick guide" subpage. */
export const QUICK_GUIDES: ReadonlySet<string> = new Set(${JSON.stringify(quickGuides, null, 2)});

/** Storyline series per quest wiki page (from the Wiki infobox main_series / series_nth). */
export const QUEST_SERIES: Readonly<Record<string, { name: string; order: number }>> = ${JSON.stringify(sortedSeries, null, 2)};

/**
 * Wiki pages linked from imported item and unlock reward lines and from supply lines: kind, and the sprite
 * of items that have File:<page>.png (anchored supply links: File:<page> (<anchor>).png first).
 */
export const REWARD_REFERENCES: Readonly<Record<string, RewardReference>> = {
${table(references)}
};

/** Per imported quest id: reward line index → linked label (as the line shows it) → REWARD_REFERENCES page. */
export const REWARD_LINKS: Readonly<Record<string, Readonly<Record<number, Readonly<Record<string, string>>>>>> = {
${table(rewardLinks)}
};

/** Per imported quest id: supply line index → linked label (as the line shows it) → REWARD_REFERENCES page, anchor kept. */
export const SUPPLY_LINKS: Readonly<Record<string, Readonly<Record<number, Readonly<Record<string, string>>>>>> = {
${table(supplyLinks)}
};

/** Music tracks (Wiki pages) each quest unlocks, by quest id. */
export const QUEST_MUSIC: Readonly<Record<string, readonly string[]>> = {
${table(music)}
};
`;
writeFileSync(OUT, source.replace(/\r?\n/g, "\r\n"));
console.log(`Imported ${records.length} quests, ${Object.keys(locations).length} locations.`);
const linkedLines = Object.values(rewardLinks).reduce((sum, lines) => sum + Object.keys(lines).length, 0);
const byKind = {};
for (const { kind } of Object.values(references)) byKind[kind] = (byKind[kind] ?? 0) + 1;
console.log(`Reward lines with links: ${linkedLines}; pages: ${JSON.stringify(byKind)}; item sprites: ${Object.values(references).filter((r) => r.image).length}.`);
const supplyLines = Object.values(supplyLinks).reduce((sum, lines) => sum + Object.keys(lines).length, 0);
console.log(`Supply lines with links: ${supplyLines}.`);
console.log(`Music: ${Object.values(music).flat().length} tracks for ${Object.keys(music).length} quests.`);
console.log(`Skipped ${skipped.length}:`);
for (const line of skipped) console.log("  " + line);
