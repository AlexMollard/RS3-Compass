import { parse } from "parse5";
import { isGroupLookup, normalizeGroupQuery } from "../groupData.ts";
import type { GroupLookup, GroupQuery } from "../groupTypes.ts";
import { isRecord, isSafeInteger } from "../guards.ts";
import { LruMap } from "../lru.ts";
import { normalizePlayerName, playerKey } from "../playerName.ts";
import {
  createClientLimiter,
  createWindowLimiter,
  IN_FLIGHT_RETRY_SECONDS,
} from "./rateLimit.ts";
import { upstreamInit } from "./upstream.ts";

export const GROUP_CACHE_MS = 10 * 60 * 1000;
const MAX_CACHED = 128;
const MAX_IN_FLIGHT = 8;
const MAX_PER_MINUTE = 60;
const MAX_HTML = 2_000_000;

type Node = {
  nodeName: string;
  value?: string;
  attrs?: { name: string; value: string }[];
  childNodes?: Node[];
  parentNode?: Node;
};
type RecordValue = Record<string, unknown>;
const attr = (node: Node, name: string) =>
  node.attrs?.find((item) => item.name === name)?.value;
const sameName = (a: string, b: string) =>
  a.trim().replace(/ +/g, " ").toLocaleLowerCase("en") ===
  b.trim().replace(/ +/g, " ").toLocaleLowerCase("en");

export class GroupLookupError extends Error {
  readonly status: number;
  /** Seconds a 429 asks the caller to wait, when known. */
  readonly retryAfter?: number;
  constructor(message: string, status: number, retryAfter?: number) {
    super(message);
    this.status = status;
    this.retryAfter = retryAfter;
  }
}
const busy = (retryAfter?: number) =>
  new GroupLookupError(
    "Group lookup is busy. Wait a moment before trying again.",
    429,
    retryAfter,
  );
const unavailable = () =>
  new GroupLookupError(
    "RuneScape's group service returned unavailable or invalid data. Existing progress has not changed.",
    502,
  );
const notFound = () =>
  new GroupLookupError(
    "No group was found in that size and type. Check the group name and category.",
    404,
  );

function nodes(root: Node): Node[] {
  const result: Node[] = [];
  const stack = [root];
  while (stack.length) {
    const node = stack.pop()!;
    result.push(node);
    if (result.length > 100_000) throw unavailable();
    if (node.childNodes)
      for (let i = node.childNodes.length - 1; i >= 0; i--)
        stack.push(node.childNodes[i]);
  }
  return result;
}

function document(html: string): Node {
  if (html.length > MAX_HTML) throw unavailable();
  return parse(html) as unknown as Node;
}

// Next's flight stream contains JSON strings, not executable application code. Parse only JSON records.
export function parseGroupListing(
  html: string,
  query: GroupQuery,
): {
  id: number;
  name: string;
  size: GroupQuery["size"];
  isCompetitive: boolean;
  founder: boolean;
  totalLevel: number;
  totalXp: number;
  rank?: number;
} {
  const candidates: RecordValue[] = [];
  for (const node of nodes(document(html))) {
    if (node.nodeName !== "script") continue;
    const text =
      node.childNodes?.map((child) => child.value ?? "").join("") ?? "";
    const prefix = "self.__next_f.push(";
    if (!text.startsWith(prefix) || !text.endsWith(")")) continue;
    let envelope: unknown;
    try {
      envelope = JSON.parse(text.slice(prefix.length, -1));
    } catch {
      continue;
    }
    if (
      !Array.isArray(envelope) ||
      envelope[0] !== 1 ||
      typeof envelope[1] !== "string"
    )
      continue;
    for (const line of envelope[1].split("\n")) {
      const colon = line.indexOf(":");
      if (colon < 1 || !/^[0-9a-f]+$/i.test(line.slice(0, colon))) continue;
      let value: unknown;
      try {
        value = JSON.parse(line.slice(colon + 1));
      } catch {
        continue;
      }
      const stack: unknown[] = [value];
      let visited = 0;
      while (stack.length) {
        const item = stack.pop();
        if (++visited > 100_000) throw unavailable();
        if (Array.isArray(item)) stack.push(...item);
        else if (isRecord(item)) {
          if (
            isRecord(item.data) &&
            isRecord(item.data.groups) &&
            item.groupSize === query.size &&
            item.mode === (query.isCompetitive ? "competitive" : "regular")
          )
            candidates.push(item.data.groups);
          stack.push(...Object.values(item));
        }
      }
    }
  }
  if (candidates.length !== 1) throw unavailable();
  const groups = candidates[0];
  if (
    !Array.isArray(groups.content) ||
    typeof groups.empty !== "boolean" ||
    !isSafeInteger(groups.numberOfElements) ||
    groups.numberOfElements !== groups.content.length ||
    groups.empty !== (groups.content.length === 0) ||
    !isSafeInteger(groups.pageNumber) ||
    !isSafeInteger(groups.size) ||
    !isSafeInteger(groups.totalElements) ||
    !isSafeInteger(groups.totalPages) ||
    (!groups.empty && groups.totalPages === 0) ||
    typeof groups.first !== "boolean" ||
    typeof groups.last !== "boolean"
  )
    throw unavailable();
  const matches = groups.content.filter(
    (v: unknown) =>
      isRecord(v) && typeof v.name === "string" && sameName(v.name, query.name),
  );
  if (matches.length === 0) {
    if (groups.empty) throw notFound();
    throw unavailable();
  }
  if (matches.length !== 1) throw unavailable();
  const group = matches[0] as RecordValue;
  if (
    !isSafeInteger(group.id, 1) ||
    typeof group.name !== "string" ||
    group.size !== query.size ||
    group.isCompetitive !== query.isCompetitive ||
    typeof group.founder !== "boolean" ||
    !isSafeInteger(group.groupTotalLevel, 1) ||
    !isSafeInteger(group.groupTotalXp) ||
    group.toHighlight !== true
  )
    throw unavailable();
  const index = groups.content.indexOf(matches[0]);
  const rank = groups.pageNumber * groups.size + index + 1;
  if (!isSafeInteger(rank, 1)) throw unavailable();
  return {
    id: group.id,
    name: group.name,
    size: query.size,
    isCompetitive: query.isCompetitive,
    founder: group.founder,
    totalLevel: group.groupTotalLevel,
    totalXp: group.groupTotalXp,
    rank,
  };
}

export function parseGroupRoster(
  html: string,
  name: string,
  size: number,
): { name: string }[] {
  const all = nodes(document(html));
  const sections = all.filter(
    (node) =>
      node.nodeName === "section" &&
      nodes(node).some(
        (child) =>
          child.nodeName === "h1" &&
          attr(child, "data-testid") === "Heading" &&
          child.childNodes?.some(
            (text) =>
              text.nodeName === "#text" &&
              typeof text.value === "string" &&
              sameName(text.value, name),
          ),
      ),
  );
  if (sections.length !== 1) throw unavailable();
  const images = nodes(sections[0]).filter((node) => {
    if (node.nodeName !== "img" || attr(node, "data-testid") !== "AvatarImage")
      return false;
    // Member accordions repeat avatars; the roster is the header outside those details.
    for (
      let parent = node.parentNode;
      parent && parent !== sections[0];
      parent = parent.parentNode
    )
      if (parent.nodeName === "details") return false;
    return true;
  });
  if (images.length < 1 || images.length > size) throw unavailable();
  const names = new Set<string>();
  return images.map((image) => {
    const source = attr(image, "src");
    const title = attr(image, "title");
    if (!source || !title) throw unavailable();
    let url: URL;
    let parsedName: string;
    try {
      url = new URL(source);
      if (
        url.origin !== "https://secure.runescape.com" ||
        !url.pathname.startsWith("/m=avatar-rs/") ||
        !url.pathname.endsWith("/chat.png")
      )
        throw unavailable();
      parsedName = normalizePlayerName(
        decodeURIComponent(
          url.pathname.slice("/m=avatar-rs/".length, -"/chat.png".length),
        ),
      );
      if (playerKey(title) !== playerKey(parsedName)) throw unavailable();
    } catch {
      throw unavailable();
    }
    const key = playerKey(parsedName);
    if (names.has(key)) throw unavailable();
    names.add(key);
    return { name: normalizePlayerName(title) };
  });
}

export function createGroupLookupService(
  fetcher: typeof fetch = fetch,
  now: () => number = Date.now,
) {
  const cache = new LruMap<string, GroupLookup>(MAX_CACHED);
  const pending = new Map<string, Promise<GroupLookup>>();
  const takeUpstream = createWindowLimiter(MAX_PER_MINUTE);
  const takeClient = createClientLimiter();
  async function request(url: URL): Promise<string> {
    const wait = takeUpstream(now());
    if (wait !== undefined) throw busy(wait);
    const response = await fetcher(
      url,
      upstreamInit("text/html", "RS3 Compass public Group Ironman lookup"),
    );
    if (response.status === 429) {
      await response.body?.cancel();
      throw busy();
    }
    if (
      !response.ok ||
      Number(response.headers.get("content-length")) > MAX_HTML ||
      !response.body
    ) {
      await response.body?.cancel();
      throw unavailable();
    }
    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8", { fatal: true });
    const parts: string[] = [];
    let bytes = 0;
    try {
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        bytes += value.byteLength;
        if (bytes > MAX_HTML) {
          await reader.cancel();
          throw unavailable();
        }
        parts.push(decoder.decode(value, { stream: true }));
      }
      parts.push(decoder.decode());
      return parts.join("");
    } finally {
      reader.releaseLock();
    }
  }
  /** `client` identifies the caller for its per-client share; omit it to use only the shared budget. */
  async function lookup(input: unknown, client?: string): Promise<GroupLookup> {
    let query: GroupQuery;
    try {
      query = normalizeGroupQuery(input);
    } catch (cause) {
      throw new GroupLookupError(
        cause instanceof Error ? cause.message : "Enter a group name.",
        400,
      );
    }
    const key = `${query.size}:${query.isCompetitive}:${query.name.toLocaleLowerCase("en")}`;
    const cached = cache.get(key);
    if (cached && cached.fetchedAt + GROUP_CACHE_MS > now()) return cached;
    cache.delete(key);
    const existing = pending.get(key);
    if (existing) return existing;
    if (pending.size >= MAX_IN_FLIGHT) throw busy(IN_FLIGHT_RETRY_SECONDS);
    const clientWait =
      client === undefined ? undefined : takeClient(client, now());
    if (clientWait !== undefined)
      throw new GroupLookupError(
        "Too many group lookups from this connection. Wait a moment before trying again.",
        429,
        clientWait,
      );
    const task = (async () => {
      try {
        const mode = query.isCompetitive ? "competitive" : "regular";
        const base = `https://rs.runescape.com/hiscores/group-ironman/${mode}/${query.size}`;
        const listingUrl = new URL(base);
        listingUrl.searchParams.set("name", query.name);
        listingUrl.searchParams.set("page", "1");
        const listing = parseGroupListing(await request(listingUrl), query);
        const detailUrl = new URL(
          `${base}/${encodeURIComponent(listing.name)}`,
        );
        const members = parseGroupRoster(
          await request(detailUrl),
          listing.name,
          listing.size,
        );
        const result = { ...listing, members, fetchedAt: now() };
        if (!isGroupLookup(result)) throw unavailable();
        cache.set(key, result);
        const alias = `${query.size}:${query.isCompetitive}:${listing.name.toLocaleLowerCase("en")}`;
        cache.set(alias, result);
        return result;
      } catch (cause) {
        throw cause instanceof GroupLookupError ? cause : unavailable();
      }
    })().finally(() => pending.delete(key));
    pending.set(key, task);
    return task;
  }
  return { lookup };
}

export const groupLookupService = createGroupLookupService();
