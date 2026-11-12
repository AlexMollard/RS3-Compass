// RuneScape Wiki API helpers shared by the importers (scripts/import-quests.mjs, scripts/import-bosses.mjs).
const API = "https://runescape.wiki/api.php";
const BATCH = 50;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
export const chunks = (list) =>
  Array.from({ length: Math.ceil(list.length / BATCH) }, (_, i) =>
    list.slice(i * BATCH, i * BATCH + BATCH),
  );
export const nameKey = (name) =>
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
export const fileName = (name) => name.trim().replace(/^File:/i, "").replaceAll(" ", "_");

/** The helpers that call the Wiki, sending the given user agent. */
export function createWikiApi(userAgent) {
  async function api(params) {
    const url = new URL(API);
    for (const [k, v] of Object.entries({ format: "json", formatversion: "2", ...params }))
      url.searchParams.set(k, v);
    for (let attempt = 0; ; attempt++) {
      const response = await fetch(url, { headers: { "user-agent": userAgent } });
      if (response.ok) {
        await sleep(300);
        return response.json();
      }
      if (attempt >= 3) throw new Error(`${response.status} for ${url}`);
      await sleep(2000 * (attempt + 1));
    }
  }

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

  return { api, pageContents, servedFiles, categoryMembers };
}
