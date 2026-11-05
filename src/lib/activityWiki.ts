export interface ActivityWikiArticle {
  wiki: string;
  image?: string;
  imageUrl?: string;
}

function titleKey(title: string): string {
  const clean = title
    .normalize("NFKC")
    .replace(/[‘’]/g, "'")
    .replaceAll("_", " ")
    .trim();
  return clean ? clean[0].toLocaleUpperCase("en") + clean.slice(1) : "";
}

function object(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function readArticles(
  value: unknown,
  titles: string[],
): Map<string, ActivityWikiArticle> {
  const found = new Map<string, ActivityWikiArticle>();
  if (!object(value) || !object(value.query) || !object(value.query.pages))
    return found;
  const aliases = new Map<string, string>();
  for (const entries of [value.query.normalized, value.query.redirects]) {
    if (!Array.isArray(entries)) continue;
    for (const entry of entries) {
      if (
        object(entry) &&
        typeof entry.from === "string" &&
        typeof entry.to === "string"
      )
        aliases.set(titleKey(entry.from), titleKey(entry.to));
    }
  }
  const pages = new Map<string, ActivityWikiArticle>();
  for (const page of Object.values(value.query.pages)) {
    if (
      !object(page) ||
      page.ns !== 0 ||
      typeof page.title !== "string" ||
      "missing" in page ||
      "invalid" in page
    )
      continue;
    const article: ActivityWikiArticle = { wiki: page.title };
    if (typeof page.pageimage === "string" && page.pageimage.trim())
      article.image = page.pageimage;
    if (object(page.thumbnail) && typeof page.thumbnail.source === "string") {
      try {
        const image = new URL(page.thumbnail.source);
        if (
          image.origin === "https://runescape.wiki" &&
          !image.username &&
          !image.password &&
          image.pathname.startsWith("/images/")
        )
          article.imageUrl = image.href;
      } catch {
        /* An invalid thumbnail does not make the verified article invalid. */
      }
    }
    pages.set(titleKey(page.title), article);
  }
  for (const title of titles) {
    let key = titleKey(title);
    const visited = new Set<string>();
    while (aliases.has(key) && !visited.has(key)) {
      visited.add(key);
      const next = aliases.get(key)!;
      if (next === key) break;
      key = next;
    }
    const article = pages.get(key);
    if (article) found.set(title, article);
  }
  return found;
}

export function createActivityWikiLookup(
  fetcher: typeof fetch = fetch,
  now = Date.now,
) {
  const cache = new Map<
    string,
    { article: ActivityWikiArticle | null; expiresAt: number }
  >();
  const inFlight = new Map<string, Promise<ActivityWikiArticle | null>>();
  let activeBatches = 0;
  let windowStart = now();
  let requests = 0;
  const capacityWaiters = new Set<() => void>();
  let capacityTimer: ReturnType<typeof setTimeout> | undefined;

  function wakeWaiting() {
    for (const wake of capacityWaiters) wake();
  }

  function waitForCapacity(signal?: AbortSignal): Promise<void> {
    if (signal?.aborted) return Promise.resolve();
    const { promise, resolve } = Promise.withResolvers<void>();
    const wake = () => {
      capacityWaiters.delete(wake);
      signal?.removeEventListener("abort", wake);
      if (!capacityWaiters.size && capacityTimer !== undefined) {
        clearTimeout(capacityTimer);
        capacityTimer = undefined;
      }
      resolve();
    };
    capacityWaiters.add(wake);
    signal?.addEventListener("abort", wake, { once: true });
    if (requests >= 10 && capacityTimer === undefined) {
      capacityTimer = setTimeout(
        wakeWaiting,
        Math.max(0, windowStart + 60_000 - now()),
      );
    }
    return promise;
  }

  function remember(
    key: string,
    article: ActivityWikiArticle | null,
    ttl: number,
  ) {
    cache.delete(key);
    cache.set(key, { article, expiresAt: now() + ttl });
    while (cache.size > 256) cache.delete(cache.keys().next().value!);
  }

  async function lookup(
    titles: string[],
    signal?: AbortSignal,
  ): Promise<Map<string, ActivityWikiArticle>> {
    const result = new Map<string, ActivityWikiArticle>();
    if (signal?.aborted) return result;
    const waiting = new Map<string, Promise<ActivityWikiArticle | null>>();
    const missing = new Map<string, string>();
    for (const title of titles) {
      if (
        !title.trim() ||
        title.length > 256 ||
        /[|#\u0000-\u001f\u007f]/.test(title)
      )
        continue;
      const key = titleKey(title);
      const cached = cache.get(key);
      if (cached && cached.expiresAt > now()) {
        cache.delete(key);
        cache.set(key, cached);
        if (cached.article) result.set(title, cached.article);
      } else {
        if (cached) cache.delete(key);
        const pending = inFlight.get(key);
        if (pending) waiting.set(title, pending);
        else missing.set(key, key);
      }
    }
    if (now() - windowStart >= 60_000) {
      windowStart = now();
      requests = 0;
    }
    if (missing.size && (activeBatches >= 2 || requests >= 10)) {
      // Defer the first request; closing the view cancels unsent work.
      await waitForCapacity(signal);
      return lookup(titles, signal);
    }
    if (missing.size) {
      // The source log is capped at 20 events, so one query covers every new subject.
      const batchTitles = [...missing.values()].sort();
      const url = new URL("https://runescape.wiki/api.php");
      url.search = new URLSearchParams({
        action: "query",
        format: "json",
        titles: batchTitles.join("|"),
        prop: "pageimages",
        piprop: "name|thumbnail",
        pithumbsize: "64",
        redirects: "1",
        origin: "*",
        maxage: "86400",
        smaxage: "86400",
        maxlag: "5",
      }).toString();
      requests++;
      activeBatches++;
      const batch = (async () => {
        try {
          const response = await fetcher(url, {
            headers: { accept: "application/json" },
            signal: AbortSignal.timeout(8000),
          });
          if (!response.ok) return null;
          const value: unknown = await response.json();
          if (
            !object(value) ||
            "error" in value ||
            !object(value.query) ||
            !object(value.query.pages)
          )
            return null;
          return readArticles(value, batchTitles);
        } catch {
          return null;
        } finally {
          activeBatches--;
          wakeWaiting();
        }
      })();
      for (const [key, title] of missing) {
        const pending = batch
          .then((articles) => {
            const article = articles?.get(title) ?? null;
            remember(
              key,
              article,
              article ? 86_400_000 : articles ? 300_000 : 30_000,
            );
            return article;
          })
          .finally(() => inFlight.delete(key));
        inFlight.set(key, pending);
        waiting.set(title, pending);
      }
    }
    await Promise.all(
      [...waiting].map(async ([title, pending]) => {
        const article = await pending;
        if (article) result.set(title, article);
      }),
    );
    for (const title of titles) {
      const cached = cache.get(titleKey(title));
      if (cached?.article && cached.expiresAt > now())
        result.set(title, cached.article);
    }
    return result;
  }
  return { lookup };
}

export const activityWikiLookup = createActivityWikiLookup();
