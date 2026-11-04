import test from "node:test";
import assert from "node:assert/strict";
import { parseQuestResponse } from "../src/lib/server/questLookup.ts";
import { createPlayerLookupService } from "../src/lib/server/playerLookup.ts";
import { RS3_SKILL_NAMES } from "../src/skillNames.ts";

const hiscores = () =>
  new Response(
    ["1,3000,5000000000", ...RS3_SKILL_NAMES.map(() => "100,50,100000")].join(
      "\n",
    ),
  );

test("Only genuinely completed public quests are imported", () => {
  assert.deepEqual(
    parseQuestResponse({
      quests: [
        { title: "Cook's Assistant", status: "COMPLETED" },
        { title: "The Knight's Sword", status: "STARTED" },
        { title: "Dragon Slayer", status: "NOT_STARTED" },
      ],
    }),
    { status: "available", completedTitles: ["Cook's Assistant"] },
  );
  assert.deepEqual(
    parseQuestResponse({
      quests: [{ title: "Cook's Assistant", status: "NOT_STARTED" }],
    }),
    { status: "available", completedTitles: [] },
  );
});

test("An empty/private quest response is unavailable, not a successful zero-completion import", () => {
  for (const value of [
    { quests: [], loggedIn: "false" },
    { error: "PROFILE_PRIVATE" },
  ])
    assert.deepEqual(parseQuestResponse(value), {
      status: "unavailable",
      reason: "private-or-unavailable",
    });
});

test("Malformed or unknown statuses fail quest import closed rather than marking completion", () => {
  for (const value of [
    null,
    [],
    { quests: [{ title: "Cook's Assistant", status: "ELIGIBLE" }] },
    { quests: [{ title: "", status: "COMPLETED" }] },
    { quests: [{ title: "Cook's Assistant", status: "COMPLETED" }, null] },
  ])
    assert.deepEqual(parseQuestResponse(value), {
      status: "unavailable",
      reason: "service-unavailable",
    });
});

test("A quest-service outage does not discard valid public skill levels", async () => {
  const service = createPlayerLookupService(async (url) => {
    if (url.hostname === "apps.runescape.com")
      throw new Error("Quest service down");
    return hiscores();
  });
  const player = await service.lookup("Example");
  assert.equal(player.levels.Mining, 50);
  assert.deepEqual(player.quests, {
    status: "unavailable",
    reason: "service-unavailable",
  });
});

test("A combined lookup coalesces and caches both upstream services, while a Hiscores failure skips quests", async () => {
  const calls = { levels: 0, quests: 0 };
  const service = createPlayerLookupService(async (url) => {
    if (url.hostname === "apps.runescape.com") {
      calls.quests++;
      return new Response(
        JSON.stringify({
          quests: [{ title: "Cook's Assistant", status: "COMPLETED" }],
        }),
      );
    }
    calls.levels++;
    return url.searchParams.get("player") === "Missing"
      ? new Response("Missing", { status: 404 })
      : hiscores();
  });
  const [first, second] = await Promise.all([
    service.lookup("Example"),
    service.lookup("example"),
  ]);
  assert.deepEqual(first.quests, {
    status: "available",
    completedTitles: ["Cook's Assistant"],
  });
  assert.deepEqual(first, second);
  await service.lookup("EXAMPLE");
  assert.deepEqual(calls, { levels: 1, quests: 1 });
  await assert.rejects(
    service.lookup("Missing"),
    (error) => error.status === 404,
  );
  assert.deepEqual(calls, { levels: 2, quests: 1 });
});
