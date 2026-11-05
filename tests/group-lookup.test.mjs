import test from "node:test";
import assert from "node:assert/strict";
import {
  createGroupLookupService,
  GroupLookupError,
  parseGroupListing,
  parseGroupRoster,
  GROUP_CACHE_MS,
} from "../src/lib/server/groupLookup.ts";

const query = { name: "ironmanies", size: 3, isCompetitive: true };
const entry = {
  id: 422362,
  name: "ironmanies",
  size: 3,
  isCompetitive: true,
  founder: true,
  groupTotalLevel: 3517,
  groupTotalXp: 25446861,
  toHighlight: true,
};
function listing(content = [entry], totalPages = 1) {
  const groups = {
    content,
    empty: !content.length,
    first: true,
    last: true,
    numberOfElements: content.length,
    pageNumber: 0,
    size: content.length,
    totalElements: content.length,
    totalPages,
  };
  const flight = `34:${JSON.stringify(["$", "$L4c", null, { data: { groups }, groupSize: 3, mode: "competitive" }])}\n`;
  return `<script>self.__next_f.push(${JSON.stringify([1, flight])})</script>`;
}
function detail(names = ["Warmiar", "Ariatsa", "sunakyu"]) {
  return `<section><h1 data-testid="Heading">ironmanies</h1>${names.map((name) => `<div data-testid="GroupMember"><img data-testid="AvatarImage" title="${name}" src="https://secure.runescape.com/m=avatar-rs/${name}/chat.png?h=80&amp;w=80"></div>`).join("")}</section>`;
}
const response = (body, status = 200) => new Response(body, { status });

test("official flight records and semantic avatar identities produce group data", () => {
  assert.deepEqual(parseGroupListing(listing(), query), {
    id: 422362,
    name: "ironmanies",
    size: 3,
    isCompetitive: true,
    founder: true,
    totalLevel: 3517,
    totalXp: 25446861,
    rank: 1,
  });
  assert.deepEqual(parseGroupRoster(detail(), "ironmanies", 3), [
    { name: "Warmiar" },
    { name: "Ariatsa" },
    { name: "sunakyu" },
  ]);
});

test("empty search is not found; malformed or mismatched sources fail closed", () => {
  assert.throws(
    () => parseGroupListing(listing([]), query),
    (error) => error instanceof GroupLookupError && error.status === 404,
  );
  assert.throws(
    () => parseGroupListing(listing([], 0), query),
    (error) => error instanceof GroupLookupError && error.status === 404,
  );
  for (const html of [
    "<html></html>",
    listing([{ ...entry, founder: undefined }]),
    listing([{ ...entry, isCompetitive: false }]),
    listing([{ ...entry, name: "other" }]),
  ]) {
    assert.throws(
      () => parseGroupListing(html, query),
      (error) => error instanceof GroupLookupError && error.status === 502,
    );
  }
  for (const html of [
    detail([]),
    detail(["Warmiar", "warmiar"]),
    detail(["A", "B", "C", "D"]),
    detail().replace("secure.runescape.com", "example.org"),
  ]) {
    assert.throws(
      () => parseGroupRoster(html, "ironmanies", 3),
      (error) => error instanceof GroupLookupError && error.status === 502,
    );
  }
});

test("coalesces aliases, caches successes and does not cache failed source data", async () => {
  let calls = 0;
  let time = 1000;
  let broken = false;
  const service = createGroupLookupService(
    async (url) => {
      calls++;
      return response(
        url.searchParams.has("name") ? (broken ? "bad" : listing()) : detail(),
      );
    },
    () => time,
  );
  const [a, b] = await Promise.all([
    service.lookup(query),
    service.lookup({ ...query, name: "  IRONMANIES  " }),
  ]);
  assert.deepEqual(a, b);
  assert.equal(calls, 2);
  await service.lookup(query);
  assert.equal(calls, 2);
  time += GROUP_CACHE_MS;
  broken = true;
  await assert.rejects(service.lookup(query));
  broken = false;
  await service.lookup(query);
  assert.equal(calls, 5);
});

test("rejects oversized streaming responses before reading further", async () => {
  let cancelled = false;
  let reads = 0;
  const stream = new ReadableStream({
    pull(controller) {
      reads++;
      controller.enqueue(new Uint8Array(1_100_000));
    },
    cancel() {
      cancelled = true;
    },
  });
  const service = createGroupLookupService(async () => new Response(stream));
  await assert.rejects(
    service.lookup(query),
    (error) => error instanceof GroupLookupError && error.status === 502,
  );
  assert.equal(cancelled, true);
  assert.ok(reads <= 3);
});

test("reads the public roster header without confusing repeated member-detail avatars", () => {
  const avatar = (name) =>
    `<img data-testid="AvatarImage" title="${name}" src="https://secure.runescape.com/m=avatar-rs/${name}/chat.png?h=80&amp;w=80">`;
  const html = `<header>${avatar("Other Player")}</header><section><h1 data-testid="Heading">ironmanies</h1><nav>${avatar("Warmiar")}${avatar("Ariatsa")}${avatar("sunakyu")}</nav><details data-testid="GroupMemberTotal">${avatar("Warmiar")}</details></section>`;
  assert.deepEqual(parseGroupRoster(html, "ironmanies", 3), [
    { name: "Warmiar" },
    { name: "Ariatsa" },
    { name: "sunakyu" },
  ]);
});
