import test from "node:test";
import assert from "node:assert/strict";
import {
  isSnapshotStale,
  mapTilesNotice,
  profileSourceNotice,
  rateLimitNotice,
  snapshotFetchedAt,
} from "../src/lib/sourceStatus.ts";
import { hasTransientFailure } from "../src/lib/playerData.ts";

test("snapshotFetchedAt prefers the public lookup time over the legacy Hiscores time", () => {
  assert.equal(snapshotFetchedAt({ publicFetchedAt: 5, hiscoresFetchedAt: 3 }), 5);
  assert.equal(snapshotFetchedAt({ hiscoresFetchedAt: 3 }), 3);
  assert.equal(snapshotFetchedAt({ publicFetchedAt: 0, hiscoresFetchedAt: 3 }), 0);
  assert.equal(snapshotFetchedAt({}), undefined);
  assert.equal(snapshotFetchedAt(undefined), undefined);
});

test("hasTransientFailure flags only service outages, not private or missing sources", () => {
  const ok = { status: "available" };
  const down = { status: "unavailable", reason: "service-unavailable" };
  const hidden = { status: "unavailable", reason: "private-or-unavailable" };
  const player = (hiscoresImportStatus, quests, events) => ({
    hiscoresImportStatus,
    quests,
    events,
  });
  assert.equal(hasTransientFailure(player("available", ok, ok)), false);
  assert.equal(hasTransientFailure(player("not-found", hidden, hidden)), false);
  assert.equal(hasTransientFailure(player("service-unavailable", ok, ok)), true);
  assert.equal(hasTransientFailure(player("available", down, hidden)), true);
  assert.equal(hasTransientFailure(player("available", hidden, down)), true);
});

const hiscores = (extra = {}) => ({ source: "hiscores", ...extra });
const idle = { state: "idle" };

test("sync error shows the failed refresh banner with retry", () => {
  const notice = profileSourceNotice(
    hiscores(),
    { state: "error", message: "x" },
    "home",
  );
  assert.equal(notice.tone, "failed");
  assert.equal(notice.title, "The latest public-data refresh failed");
  assert.equal(notice.retry, true);
  assert.match(notice.message, /^Showing previously saved data\. x/);
});

test("sync error outranks hiscores and quest problems", () => {
  const notice = profileSourceNotice(
    hiscores({
      hiscoresImportStatus: "unranked-or-unavailable",
      questImportStatus: "private-or-unavailable",
    }),
    { state: "error", message: "x" },
    "quests",
  );
  assert.equal(notice.tone, "failed");
});

test("unranked hiscores shows the private notice without retry", () => {
  const notice = profileSourceNotice(
    hiscores({ hiscoresImportStatus: "unranked-or-unavailable" }),
    idle,
    "skills",
  );
  assert.equal(notice.tone, "private");
  assert.equal(notice.retry, false);
  assert.match(notice.message, /^Jagex has no main Hiscores entry/);
});

test("quest import problems show on home and quests only", () => {
  const profile = hiscores({ questImportStatus: "private-or-unavailable" });
  const quests = profileSourceNotice(profile, idle, "quests");
  assert.equal(quests.tone, "private");
  assert.equal(quests.retry, true);
  assert.equal(profileSourceNotice(profile, idle, "home").tone, "private");
  assert.equal(profileSourceNotice(profile, idle, "skills"), null);
});

test("hiscores problem outranks a quest problem", () => {
  const notice = profileSourceNotice(
    hiscores({
      hiscoresImportStatus: "unranked-or-unavailable",
      questImportStatus: "private-or-unavailable",
    }),
    idle,
    "quests",
  );
  assert.equal(notice.title, "Hiscores data unavailable");
});

test("sample profiles and healthy profiles show no notice", () => {
  assert.equal(
    profileSourceNotice({ source: "sample" }, { state: "error" }, "home"),
    null,
  );
  assert.equal(profileSourceNotice({}, undefined, "home"), null);
  assert.equal(
    profileSourceNotice(
      hiscores({ hiscoresImportStatus: "available" }),
      idle,
      "home",
    ),
    null,
  );
});

test("isSnapshotStale follows the stale rule", () => {
  const fresh = hiscores({ hiscoresImportStatus: "available" });
  assert.equal(isSnapshotStale(fresh, idle), false);
  assert.equal(isSnapshotStale(fresh, { state: "error" }), true);
  assert.equal(
    isSnapshotStale(
      hiscores({
        questImportStatus: "private-or-unavailable",
        questProgress: { fetchedAt: 1 },
      }),
      idle,
    ),
    true,
  );
  assert.equal(
    isSnapshotStale(hiscores({ questImportStatus: "private-or-unavailable" })),
    false,
  );
  assert.equal(isSnapshotStale({ source: "sample" }, { state: "error" }), false);
});

test("rateLimitNotice is a calm slowed notice with no retry button", () => {
  const notice = rateLimitNotice(Date.now() + 60000);
  assert.equal(notice.tone, "slowed");
  assert.equal(notice.retry, false);
  assert.match(notice.message, /about a minute/);
});

test("a rate-limited sync error shows the slowed notice, not the failure", () => {
  const notice = profileSourceNotice(
    hiscores(),
    { state: "error", rateLimited: true, nextRefreshAt: Date.now() + 60000 },
    "home",
  );
  assert.equal(notice.tone, "slowed");
});

test("mapTilesNotice reassures that the marker is right", () => {
  const notice = mapTilesNotice();
  assert.equal(notice.tone, "info");
  assert.equal(notice.message, "The marker is still correct.");
});
