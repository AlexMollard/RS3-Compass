import { get, writable } from "svelte/store";
import {
  QUESTS,
  SAMPLE_PROFILES,
  detectedAccountKind,
  isAccountKind,
  nextQuest,
  type Profile,
} from "../data.ts";
import type { CompassController, SavedState } from "./compassContext";
import { playerKey, publicProfileId } from "./playerName.ts";
import { clearRememberedPlayer, rememberPlayer } from "./rememberedPlayer.ts";
import {
  isFetchedAt,
  isHiscoresImportStatus,
  isPlayerEvents,
  isPlayerImportStatus,
  isPlayerStatistics,
  isQuestProgress,
} from "./playerData.ts";
import { questTitleKey } from "./playerProgress.ts";
import { createPlayerSynchronizer, type SyncTarget } from "./playerSync.ts";
import { snapshotFetchedAt } from "./sourceStatus.ts";
import { isGroupLookup } from "./groupData.ts";
import { isRecord, isSkillLevel, isSkillLevelMap } from "./guards.ts";
import { BOSSES } from "../bosses.ts";
import { mergeAutoTicks } from "./collectionLog.ts";

const KEY = "rs3-compass-design-v1";

function validProfile(value: unknown): value is Profile {
  if (!value || typeof value !== "object") return false;
  const p = value as Partial<Profile>;
  return (
    typeof p.id === "string" &&
    typeof p.name === "string" &&
    isAccountKind(p.kind) &&
    (p.mode === "f2p" || p.mode === "members") &&
    typeof p.activeTask === "string" &&
    (p.source === undefined ||
      p.source === "sample" ||
      p.source === "hiscores") &&
    (p.hiscoresFetchedAt === undefined ||
      (typeof p.hiscoresFetchedAt === "number" &&
        Number.isFinite(p.hiscoresFetchedAt) &&
        p.hiscoresFetchedAt >= 0)) &&
    (p.publicFetchedAt === undefined || isFetchedAt(p.publicFetchedAt)) &&
    (p.hiscoresImportStatus === undefined ||
      isHiscoresImportStatus(p.hiscoresImportStatus)) &&
    (p.hiscoresLevels === undefined ||
      (isSkillLevelMap(p.hiscoresLevels) &&
        Object.keys(p.hiscoresLevels).length > 0)) &&
    (p.questImportStatus === undefined ||
      isPlayerImportStatus(p.questImportStatus)) &&
    (p.eventImportStatus === undefined ||
      isPlayerImportStatus(p.eventImportStatus)) &&
    (p.statistics === undefined ||
      (isPlayerStatistics(p.statistics) &&
        isFetchedAt(p.statistics.fetchedAt))) &&
    (p.questProgress === undefined ||
      (isQuestProgress(p.questProgress) &&
        isFetchedAt(p.questProgress.fetchedAt))) &&
    (p.eventLog === undefined ||
      (!!p.eventLog &&
        isPlayerEvents(p.eventLog.events) &&
        isFetchedAt(p.eventLog.fetchedAt))) &&
    (p.trainingRanges === undefined ||
      (isRecord(p.trainingRanges) &&
        Object.values(p.trainingRanges).every((n) => isSkillLevel(n)))) &&
    (p.trainingMethods === undefined ||
      (isRecord(p.trainingMethods) &&
        Object.values(p.trainingMethods).every(
          (id) => typeof id === "string" && id.length > 0 && id.length <= 128,
        ))) &&
    [p.collected, p.collectedAuto].every(
      (a) =>
        a === undefined ||
        (Array.isArray(a) && a.every((x) => typeof x === "string")),
    ) &&
    isRecord(p.levels) &&
    Object.values(p.levels).every((n) => isSkillLevel(n)) &&
    [p.completedQuests, p.packed, p.completedTasks].every(
      (a) => Array.isArray(a) && a.every((x) => typeof x === "string"),
    ) &&
    isRecord(p.notes) &&
    Object.values(p.notes).every((n) => typeof n === "string")
  );
}

/** The saved state in `raw`, or undefined when it is not a supported, valid save. */
function parseSaved(raw: string): SavedState | undefined {
  let saved: unknown;
  try {
    saved = JSON.parse(raw);
  } catch {
    return undefined;
  }
  if (!saved || typeof saved !== "object") return undefined;
  const s = saved as SavedState;
  if (
    s.version === 1 &&
    Array.isArray(s.profiles) &&
    (s.groups === undefined ||
      (Array.isArray(s.groups) && s.groups.every(isGroupLookup))) &&
    s.profiles.every(validProfile) &&
    (s.profiles.length === 0
      ? s.activeId === ""
      : s.profiles.some((p) => p.id === s.activeId))
  )
    return {
      ...s,
      welcomed: typeof s.welcomed === "boolean" ? s.welcomed : true,
    };
  return undefined;
}

function rememberSelection(profile: Profile) {
  if (typeof document === "undefined") return;
  if (profile.source === "hiscores") rememberPlayer(profile.name);
  else clearRememberedPlayer();
}

export function createCompassController(): CompassController {
  const state = writable<SavedState>({
    version: 1,
    activeId: SAMPLE_PROFILES[0].id,
    profiles: structuredClone(SAMPLE_PROFILES),
    welcomed: false,
  });
  const storageError = writable(false),
    ready = writable(false),
    compact = writable(false),
    notice = writable("");
  let unsubscribe: (() => void) | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let initialized = false;
  let storageTarget: Window | undefined;
  // Another tab saved: adopt its whole state, selection included, so this
  // tab's next write cannot discard changes it never saw. Writing the same
  // string back fires no further storage event, so the tabs do not ping-pong.
  function onStorage(event: StorageEvent) {
    if (event.key !== KEY || event.newValue === null) return;
    const saved = parseSaved(event.newValue);
    if (saved) state.set(saved);
  }
  const synchronizer = createPlayerSynchronizer({
    profile: (id) => get(state).profiles.find((p) => p.id === id),
    allowed(target) {
      const current = get(state);
      if (
        current.profiles.some(
          (p) => p.id === target.id && p.source === "hiscores",
        )
      )
        return true;
      if (target.groupId !== undefined)
        return (
          current.groups?.some(
            (group) =>
              group.id === target.groupId &&
              group.members.some(
                (member) => playerKey(member.name) === playerKey(target.name),
              ),
          ) ?? false
        );
      return false;
    },
    apply(player, target) {
      controller.addPlayer(player, target.kind, target.mode, { select: false });
    },
  });
  function notify(message: string) {
    notice.set(message);
    clearTimeout(timer);
    timer = setTimeout(() => notice.set(""), 4500);
  }
  const controller: CompassController = {
    state,
    storageError,
    ready,
    compact,
    notice,
    notify,
    syncState: synchronizer.state,
    async refreshPlayers(ids, options) {
      const profiles = get(state).profiles.filter(
        (p) => p.source === "hiscores" && (!ids || ids.includes(p.id)),
      );
      await Promise.all(
        profiles.map((p) =>
          synchronizer.refresh(
            {
              id: p.id,
              name: p.name,
              kind: p.kind,
              mode: p.mode,
            },
            options?.staleOnly,
            options?.scope,
          ),
        ),
      );
    },
    cancelRefreshScope(scope) {
      synchronizer.cancelScope(scope);
    },
    async importGroupMembers(id) {
      const current = get(state);
      const group = current.groups?.find((g) => g.id === id);
      if (!group) return;
      const mode =
        current.profiles.find((p) => p.id === current.activeId)?.mode ?? "f2p";
      await Promise.all(
        group.members.map((member) => {
          const target: SyncTarget = {
            id: publicProfileId(member.name),
            name: member.name,
            groupId: group.id,
            kind: "Group Ironman",
            mode,
          };
          return synchronizer.refresh(target, false, "group-import:" + id);
        }),
      );
    },
    saveGroup(group) {
      if (!isGroupLookup(group)) return;
      state.update((current) => {
        const old = current.groups?.find((g) => g.id === group.id);
        if (old && old.fetchedAt > group.fetchedAt) return current;
        return {
          ...current,
          groups: old
            ? current.groups!.map((g) => (g.id === group.id ? group : g))
            : [...(current.groups ?? []), group],
        };
      });
    },
    removeGroup(id) {
      synchronizer.cancelGroup(id);
      state.update((current) => ({
        ...current,
        groups: (current.groups ?? []).filter((g) => g.id !== id),
      }));
    },
    updatePlayer(id, settings) {
      state.update((current) => ({
        ...current,
        profiles: current.profiles.map((p) =>
          p.id === id ? { ...p, ...settings } : p,
        ),
      }));
    },
    initialize() {
      if (initialized) return;
      initialized = true;
      try {
        const raw = localStorage.getItem(KEY);
        if (raw) {
          const saved = parseSaved(raw);
          if (!saved) {
            storageError.set(true);
            ready.set(true);
            return;
          }
          state.set(saved);
          if (!saved.profiles.length && typeof document !== "undefined")
            clearRememberedPlayer();
        }
      } catch {
        storageError.set(true);
        ready.set(true);
        return;
      }
      unsubscribe = state.subscribe((saved) => {
        try {
          localStorage.setItem(KEY, JSON.stringify(saved));
          storageError.set(false);
        } catch {
          storageError.set(true);
        }
      });
      if (typeof window !== "undefined") {
        storageTarget = window;
        storageTarget.addEventListener("storage", onStorage);
      }
      if (typeof document !== "undefined")
        document.addEventListener?.("visibilitychange", synchronizer.wake);
      ready.set(true);
    },
    destroy() {
      unsubscribe?.();
      storageTarget?.removeEventListener("storage", onStorage);
      storageTarget = undefined;
      clearTimeout(timer);
      synchronizer.destroy();
      if (typeof document !== "undefined")
        document.removeEventListener?.("visibilitychange", synchronizer.wake);
    },
    updateProfile(update) {
      state.update((current) => ({
        ...current,
        profiles: current.profiles.map((p) =>
          p.id === current.activeId ? update(p) : p,
        ),
      }));
    },
    welcome() {
      state.update((current) =>
        current.welcomed === false ? { ...current, welcomed: true } : current,
      );
    },
    selectProfile(id) {
      const profile = get(state).profiles.find((p) => p.id === id);
      if (!profile) return;
      state.update((current) =>
        current.activeId === id && current.welcomed !== false
          ? current
          : { ...current, activeId: id, welcomed: true },
      );
      rememberSelection(profile);
    },
    addPlayer(player, kind, mode, options) {
      const id = publicProfileId(player.name);
      const previousActiveId = get(state).activeId;
      const completed = new Set<string>();
      if (player.quests.status === "available") {
        for (const quest of player.quests.records) {
          if (quest.status === "COMPLETED")
            completed.add(questTitleKey(quest.title));
        }
      }
      const imported = QUESTS.filter((quest) =>
        completed.has(questTitleKey(quest.name)),
      ).map((quest) => quest.id);
      const sourceData: Pick<
        Profile,
        | "statistics"
        | "hiscoresImportStatus"
        | "hiscoresLevels"
        | "hiscoresFetchedAt"
        | "publicFetchedAt"
        | "questProgress"
        | "eventLog"
        | "questImportStatus"
        | "eventImportStatus"
      > = {
        publicFetchedAt: player.fetchedAt,
        hiscoresImportStatus: player.hiscoresImportStatus,
        ...(player.hiscoresImportStatus === "available"
          ? {
              statistics: { ...player.statistics, fetchedAt: player.fetchedAt },
              hiscoresLevels: { ...player.levels },
              hiscoresFetchedAt: player.fetchedAt,
            }
          : {}),
        questImportStatus:
          player.quests.status === "available"
            ? "available"
            : player.quests.reason,
        eventImportStatus:
          player.events.status === "available"
            ? "available"
            : player.events.reason,
        ...(player.quests.status === "available"
          ? {
              questProgress: {
                records: player.quests.records,
                questPoints: player.quests.questPoints,
                maxQuestPoints: player.quests.maxQuestPoints,
                fetchedAt: player.fetchedAt,
              },
            }
          : {}),
        ...(player.events.status === "available"
          ? {
              eventLog: {
                events: player.events.events,
                fetchedAt: player.fetchedAt,
              },
            }
          : {}),
      };
      state.update((current) => {
        const existing = current.profiles.find((p) => p.id === id);
        const fetchedAt = snapshotFetchedAt(existing);
        if (fetchedAt !== undefined && fetchedAt > player.fetchedAt)
          return options?.select === false
            ? current
            : { ...current, activeId: id, welcomed: true };
        let profile: Profile;
        if (existing)
          profile = {
            ...existing,
            name: player.name,
            kind: detectedAccountKind(existing.kind, player.ironman),
            // Only newly published levels replace a level typed for planning.
            levels: {
              ...existing.levels,
              ...Object.fromEntries(
                Object.entries(player.levels).filter(
                  ([skill, level]) =>
                    existing.hiscoresLevels?.[skill] !== level,
                ),
              ),
            },
            completedQuests: [
              ...new Set([...existing.completedQuests, ...imported]),
            ],
            source: "hiscores",
            ...sourceData,
          };
        else {
          profile = {
            id,
            name: player.name,
            kind: detectedAccountKind(kind, player.ironman),
            mode,
            levels: { ...player.levels },
            completedQuests: imported,
            packed: [],
            completedTasks: [],
            notes: {},
            trainingRanges: {},
            activeTask: "",
            source: "hiscores",
            ...sourceData,
          };
          profile.activeTask = nextQuest(profile)?.id ?? "train-Mining";
        }
        if (sourceData.eventLog) profile = mergeAutoTicks(profile, BOSSES);
        return {
          ...current,
          welcomed: options?.select !== false ? true : current.welcomed,
          activeId: options?.select === false ? current.activeId || id : id,
          profiles: existing
            ? current.profiles.map((p) => (p.id === id ? profile : p))
            : [...current.profiles, profile],
        };
      });
      synchronizer.received(id, player);
      if (options?.select !== false || get(state).activeId !== previousActiveId)
        rememberSelection(
          get(state).profiles.find((profile) => profile.id === id)!,
        );
    },
    removePlayer(id) {
      synchronizer.cancel(id);
      let selectionChanged = false;
      let selected: Profile | undefined;
      state.update((current) => {
        if (!current.profiles.some((profile) => profile.id === id))
          return current;
        const profiles = current.profiles.filter(
          (profile) => profile.id !== id,
        );
        const activeId =
          current.activeId === id ? (profiles[0]?.id ?? "") : current.activeId;
        if (current.activeId === id) {
          selectionChanged = true;
          selected = profiles.find((profile) => profile.id === activeId);
        }
        return { ...current, activeId, profiles };
      });
      if (selectionChanged) {
        if (selected) rememberSelection(selected);
        else if (typeof document !== "undefined") clearRememberedPlayer();
      }
    },
    exportProgress() {
      const url = URL.createObjectURL(
        new Blob(
          [
            JSON.stringify(
              {
                format: "rs3-compass-design-preview",
                version: 1,
                profiles: get(state).profiles,
                ...(get(state).groups?.length
                  ? { groups: get(state).groups }
                  : {}),
              },
              null,
              2,
            ),
          ],
          { type: "application/json" },
        ),
      );
      const a = document.createElement("a");
      a.href = url;
      a.download = "rs3-compass-design-preview.json";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    },
  };
  return controller;
}
