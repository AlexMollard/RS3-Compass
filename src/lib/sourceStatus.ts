import type { Profile } from "../data.ts";

export type SourceTone =
  | "stale"
  | "failed"
  | "notFound"
  | "slowed"
  | "private"
  | "info";

export interface SourceNotice {
  tone: SourceTone;
  title: string;
  message: string;
  retry: boolean;
}

type SyncInfo = {
  state: string;
  message?: string;
  nextRefreshAt?: number;
  rateLimited?: boolean;
};

const isPublic = (profile: Profile) => profile.source === "hiscores";

/** When the public snapshot was taken; older saves only have hiscoresFetchedAt. */
export const snapshotFetchedAt = (
  profile?: Pick<Profile, "publicFetchedAt" | "hiscoresFetchedAt">,
): number | undefined => profile?.publicFetchedAt ?? profile?.hiscoresFetchedAt;

/** Jagex asked us to slow down: a calm wait, not a failure. */
export function rateLimitNotice(nextRefreshAt?: number): SourceNotice {
  const wait = nextRefreshAt ? nextRefreshAt - Date.now() : 60_000;
  const when =
    wait > 90_000
      ? `in about ${Math.ceil(wait / 60_000)} minutes`
      : "in about a minute";
  return {
    tone: "slowed",
    title: "Waiting before the next refresh.",
    message: `Jagex asked us to slow down. Compass will retry ${when}.`,
    retry: false,
  };
}

export function mapTilesNotice(): SourceNotice {
  return {
    tone: "info",
    title: "Some map tiles couldn't load.",
    message: "The marker is still correct.",
    retry: false,
  };
}

/** A public snapshot is stale when its sync errored, or an import failed while older data is kept. */
export function isSnapshotStale(
  profile: Profile,
  sync?: { state: string },
): boolean {
  if (!isPublic(profile)) return false;
  if (sync?.state === "error") return true;
  const failed = (status?: string) => !!status && status !== "available";
  return (
    (failed(profile.hiscoresImportStatus) &&
      !!(profile.hiscoresLevels || profile.statistics)) ||
    (failed(profile.questImportStatus) && !!profile.questProgress) ||
    (failed(profile.eventImportStatus) && !!profile.eventLog)
  );
}

export function profileSourceNotice(
  profile: Profile,
  sync: SyncInfo | undefined,
  view: "home" | "quests" | "skills",
): SourceNotice | null {
  if (!isPublic(profile)) return null;
  if (sync?.state === "error") {
    if (sync.rateLimited) return rateLimitNotice(sync.nextRefreshAt);
    return {
      tone: "failed",
      title: "The latest public-data refresh failed",
      message:
        `Showing previously saved data. ${sync.message ?? ""}` +
        (sync.nextRefreshAt
          ? ` Next request after ${new Date(sync.nextRefreshAt).toLocaleString()}.`
          : ""),
      retry: true,
    };
  }
  const hiscores = profile.hiscoresImportStatus;
  if (hiscores && hiscores !== "available") {
    const unranked = hiscores === "unranked-or-unavailable";
    return {
      tone: unranked ? "private" : "failed",
      title: "Hiscores data unavailable",
      message: `${
        unranked
          ? "Jagex has no main Hiscores entry for this player."
          : "The Hiscores source could not be refreshed."
      } Available quest and activity data is kept. ${
        profile.hiscoresLevels
          ? "Previous public skill data is retained."
          : "Skill levels remain unrecorded unless entered manually."
      }`,
      retry: false,
    };
  }
  const quests = profile.questImportStatus;
  if (view !== "skills" && quests && quests !== "available") {
    const message =
      quests === "private-or-unavailable"
        ? "Jagex did not expose quest status for this player. Existing checks are kept; you can mark completion manually."
        : quests === "not-member"
          ? "Jagex reports this account is not an active member. Existing checks are kept; planning mode does not change membership."
          : "The quest service could not be reached. Existing checks are kept.";
    return {
      tone: quests === "private-or-unavailable" ? "private" : "info",
      title: "Quest data unavailable",
      message:
        message +
        (profile.questProgress ? " The last successful snapshot is stale." : ""),
      retry: true,
    };
  }
  return null;
}
