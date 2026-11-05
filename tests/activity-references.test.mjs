import test from "node:test";
import assert from "node:assert/strict";
import { createActivityWikiLookup } from "../src/lib/activityWiki.ts";
import {
  activitySubject,
  activityReference,
  activityCategory,
  activitySkillReferences,
} from "../src/lib/activityPresentation.ts";
import { tokenizeGameText } from "../src/lib/gameText.ts";
import { setImmediate } from "node:timers/promises";

const json = (value) => new Response(JSON.stringify(value));
const articleResponse = () => ({
  query: {
    redirects: [{ from: "Ivar's bonecrusher maul", to: "Bonecrusher maul" }],
    pages: {
      1105016: {
        ns: 0,
        title: "Bonecrusher maul",
        pageimage: "Bonecrusher_maul_detail.png",
        thumbnail: {
          source:
            "https://runescape.wiki/images/thumb/Bonecrusher_maul_detail.png/64px-Bonecrusher_maul_detail.png",
        },
      },
      "-1": { ns: 0, title: "Missing relic", missing: "" },
    },
  },
});

test("reported whole-item identities override shorter curated names without changing source text", () => {
  const text = "I found a rune platebody (g).";
  const event = { type: "rs_plog_item_found", text };
  const subject = activitySubject(event);
  assert.equal(subject.name, "rune platebody (g)");
  const reference = activityReference(
    { ...subject, reference: undefined },
    {
      wiki: "Rune platebody (g)",
      image: "Rune_platebody_(g).png",
    },
  );
  const segments = tokenizeGameText(text, [reference]);
  assert.equal(segments.map((part) => part.text).join(""), text);
  assert.deepEqual(
    segments
      .filter((part) => part.reference)
      .map((part) => part.reference.wiki),
    ["Rune platebody (g)"],
  );
  const unresolved = activityReference({
    name: "an unclassified reported item",
    kind: "item",
  });
  assert.equal(unresolved.search, true);
  assert.equal(unresolved.image, undefined);
  assert.equal(activitySubject({ type: "constructor", text }), undefined);
  assert.equal(activityCategory("new_future_event"), "Activity");
  assert.equal(
    activitySubject({
      type: "rs_plog_quest",
      text: "Quest complete: There's No Place Like Home...",
    }).name,
    "There's No Place Like Home",
  );
});

test("overlapping activity subjects share a batched Wiki lookup and resolve redirects to the correct item art", async () => {
  let time = 0,
    calls = 0,
    release;
  const gate = new Promise((resolve) => {
    release = resolve;
  });
  const service = createActivityWikiLookup(
    async () => {
      calls++;
      await gate;
      return json(articleResponse());
    },
    () => time,
  );
  const first = service.lookup(["Ivar's bonecrusher maul", "Missing relic"]);
  const second = service.lookup(["Ivar’s_bonecrusher_maul"]);
  release();
  const [a, b] = await Promise.all([first, second]);
  assert.equal(calls, 1);
  assert.equal(a.get("Ivar's bonecrusher maul").wiki, "Bonecrusher maul");
  assert.equal(
    a.get("Ivar's bonecrusher maul").image,
    "Bonecrusher_maul_detail.png",
  );
  assert.equal(b.get("Ivar’s_bonecrusher_maul").wiki, "Bonecrusher maul");
  assert.equal(a.has("Missing relic"), false);
  time = 299_999;
  await service.lookup(["Ivar's bonecrusher maul", "Missing relic"]);
  assert.equal(calls, 1);
  time = 300_000;
  await service.lookup(["Missing relic"]);
  assert.equal(calls, 2);
  await service.lookup(["Ivar's bonecrusher maul"]);
  assert.equal(calls, 2);
});

test("Wiki failures are short cached and recover without permitting untrusted image hosts or title expansion", async () => {
  let time = 0,
    calls = 0;
  const service = createActivityWikiLookup(
    async () => {
      calls++;
      if (calls === 1) return json({ error: { code: "maxlag" } });
      const data = articleResponse();
      data.query.pages["1105016"].thumbnail.source =
        "https://example.invalid/tracker.png";
      return json(data);
    },
    () => time,
  );
  assert.equal((await service.lookup(["Ivar's bonecrusher maul"])).size, 0);
  time = 29_999;
  await service.lookup(["Ivar's bonecrusher maul"]);
  assert.equal(calls, 1);
  time = 30_000;
  const restored = await service.lookup(["Ivar's bonecrusher maul"]);
  assert.equal(
    restored.get("Ivar's bonecrusher maul").wiki,
    "Bonecrusher maul",
  );
  assert.equal(restored.get("Ivar's bonecrusher maul").imageUrl, undefined);
  assert.equal(
    restored.get("Ivar's bonecrusher maul").image,
    "Bonecrusher_maul_detail.png",
  );
  assert.equal(calls, 2);
  assert.equal(
    (await service.lookup(["One|Two", "", "x".repeat(257)])).size,
    0,
  );
  assert.equal(calls, 2);
});

test("queued activity artwork waits for capacity and discards closed views", async (t) => {
  const { promise: gate, resolve: release } = Promise.withResolvers();
  t.after(() => release());
  const calls = [];
  const service = createActivityWikiLookup(async (url) => {
    calls.push(url.searchParams.get("titles"));
    if (calls.length <= 2) await gate;
    return json({
      query: { pages: { 1: { ns: 0, title: url.searchParams.get("titles") } } },
    });
  });
  const first = service.lookup(["Ivar's bonecrusher maul"]);
  const second = service.lookup(["Ivar's magic skull mask"]);
  let settled = false;
  const current = service.lookup(["Shadow dye"]).then((result) => {
    settled = true;
    return result;
  });
  const closing = new AbortController();
  const closed = service.lookup(["Blood dye"], closing.signal);
  closing.abort();
  await setImmediate();
  assert.equal(settled, false);
  assert.equal(calls.length, 2);
  release();
  const [, , result, abandoned] = await Promise.all([
    first,
    second,
    current,
    closed,
  ]);
  assert.equal(result.get("Shadow dye").wiki, "Shadow dye");
  assert.equal(abandoned.size, 0);
  assert.deepEqual(calls, [
    "Ivar's bonecrusher maul",
    "Ivar's magic skull mask",
    "Shadow dye",
  ]);
});

test("rate-deferred artwork resumes after the window while closed views remain unsent", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  t.after(() => t.mock.timers.reset());
  let time = 0;
  const calls = [];
  const service = createActivityWikiLookup(
    async (url) => {
      const title = url.searchParams.get("titles");
      calls.push(title);
      return json({ query: { pages: { 1: { ns: 0, title } } } });
    },
    () => time,
  );
  for (let index = 0; index < 10; index++)
    await service.lookup(["Reported item " + index]);
  let settled = false;
  const current = service.lookup(["Shadow dye"]).then((result) => {
    settled = true;
    return result;
  });
  const closing = new AbortController();
  const closed = service.lookup(["Blood dye"], closing.signal);
  closing.abort();
  await setImmediate();
  assert.equal(settled, false);
  assert.equal(calls.length, 10);
  time = 60_000;
  t.mock.timers.tick(60_000);
  const result = await current;
  assert.equal(result.get("Shadow dye").wiki, "Shadow dye");
  assert.equal((await closed).size, 0);
  assert.equal(calls.length, 11);
  assert.equal(calls.includes("Blood dye"), false);
});

test("reported text links only its typed subjects, not item words inside an NPC name", () => {
  const text =
    "After defeating Ivar, King of Bones, I found an Ivar's bonecrusher maul";
  const event = {
    type: "rs_plog_item_found",
    text: "I found an Ivar's bonecrusher maul",
    details: text,
  };
  const reference = activityReference(activitySubject(event), {
    wiki: "Bonecrusher maul",
    image: "Bonecrusher_maul_detail.png",
  });
  const segments = tokenizeGameText(text, [reference], false);
  assert.equal(segments.map((segment) => segment.text).join(""), text);
  assert.deepEqual(
    segments
      .filter((segment) => segment.reference)
      .map((segment) => segment.reference.wiki),
    ["Bonecrusher maul"],
  );
  assert.equal(activitySkillReferences(event), undefined);
  const skillEvent = {
    type: "rs_plog_levelup_count",
    text: "Levelled up Mining.",
    details: "I levelled my Mining skill, I am now level 100.",
  };
  const skills = activitySkillReferences(skillEvent);
  assert.equal(skills.length, 1);
  assert.equal(skills[0].wiki, "Mining");
});
