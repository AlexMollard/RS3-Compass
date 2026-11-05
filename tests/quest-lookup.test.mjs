import test from "node:test";
import assert from "node:assert/strict";
import {
  parseQuestResponse,
  lookupQuests,
} from "../src/lib/server/questLookup.ts";
import { createPlayerLookupService } from "../src/lib/server/playerLookup.ts";
import { RS3_SKILL_NAMES } from "../src/skillNames.ts";
const quest = (title, status, eligible = false) => ({
  title,
  status,
  eligible,
  members: true,
  difficulty: 2,
  qp: 2,
});
const data = () => ({
  name: "Example",
  qp: 7,
  qp_max: 500,
  quests: {
    1: quest("Finished", "COMPLETED", true),
    2: quest("Ongoing", "STARTED"),
    3: quest("Future", "NOT_STARTED"),
  },
});
const json = (value, status = 200) =>
  new Response(JSON.stringify(value), { status });

test("quest statuses, eligibility, numeric IDs and authoritative QP survive import", () => {
  const result = parseQuestResponse(data());
  assert.equal(result.status, "available");
  assert.equal(result.name, "Example");
  assert.equal(result.questPoints, 7);
  assert.equal(result.maxQuestPoints, 500);
  assert.deepEqual(
    result.records.map((q) => [q.id, q.status, q.eligible, q.questPoints]),
    [
      ["1", "COMPLETED", true, 2],
      ["2", "STARTED", false, 2],
      ["3", "NOT_STARTED", false, 2],
    ],
  );
});

test("malformed quest payloads cannot replace a good snapshot", () => {
  for (const mutate of [
    (d) => {
      d.quests[1].status = "UNKNOWN";
    },
    (d) => {
      d.quests[1].eligible = "true";
    },
    (d) => {
      delete d.qp;
    },
    (d) => {
      d.qp = d.qp_max + 1;
    },
    (d) => {
      d.quests = [];
    },
    (d) => {
      d.quests.bad = d.quests[1];
    },
  ]) {
    const input = data();
    mutate(input);
    assert.deepEqual(parseQuestResponse(input), {
      status: "unavailable",
      reason: "service-unavailable",
    });
  }
  assert.deepEqual(parseQuestResponse({ error: "PLAYER_NOT_FOUND" }), {
    status: "unavailable",
    reason: "private-or-unavailable",
  });
  assert.equal(
    parseQuestResponse({ name: "Example", qp: 0, qp_max: 500, quests: {} })
      .status,
    "available",
  );
});

test("non-200 errors are decoded, paths escaped, and different accounts rejected", async () => {
  let path;
  const fetcher = async (url) => {
    path = url.pathname;
    return json({ error: "PLAYER_NOT_MEMBER" }, 403);
  };
  assert.deepEqual(await lookupQuests("Example Name", fetcher), {
    status: "unavailable",
    reason: "not-member",
  });
  assert.ok(path.endsWith("Example%20Name"));
  assert.deepEqual(await lookupQuests("Other", async () => json(data())), {
    status: "unavailable",
    reason: "service-unavailable",
  });
});

test("quest outage leaves levels and successful events intact, then retries", async () => {
  let time = 0;
  let fail = true;
  const service = createPlayerLookupService(
    async (url) => {
      if (url.pathname.includes("index_lite"))
        return json({
          name: "Example",
          skills: [
            { name: "Overall", rank: 1, level: 1000, xp: 100 },
            ...RS3_SKILL_NAMES.map((name) => ({
              name,
              rank: 1,
              level: 50,
              xp: 100,
            })),
          ],
          activities: [],
        });
      if (url.pathname.includes("playerQuests"))
        return fail ? json({ error: "INTERNAL_ERROR" }, 500) : json(data());
      return json({ name: "EXAMPLE", events: [] });
    },
    () => time,
  );
  const first = await service.lookup("Example");
  assert.equal(first.levels.Mining, 50);
  assert.equal(first.name, "EXAMPLE");
  assert.deepEqual(first.quests, {
    status: "unavailable",
    reason: "service-unavailable",
  });
  assert.equal(first.events.status, "available");
  fail = false;
  time = 30000;
  assert.equal((await service.lookup("Example")).quests.status, "available");
});
