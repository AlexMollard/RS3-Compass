import test from "node:test";
import assert from "node:assert/strict";
import {
  isSnapshotStale,
  profileSourceNotice,
} from "../src/lib/sourceStatus.ts";

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
