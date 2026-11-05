import { get, writable } from "svelte/store";
import { QUESTS, SAMPLE_PROFILES, nextQuest, type Profile } from "../data.ts";
import type { CompassController, SavedState } from "./compassContext";
import { normalizePlayerName } from "./playerName.ts";
import { clearRememberedPlayer, rememberPlayer } from "./rememberedPlayer.ts";
import {
  isFetchedAt,
  isPlayerEvents,
  isPlayerImportStatus,
  isPlayerStatistics,
  isQuestProgress,
} from "./playerData.ts";
import { questTitleKey } from "./playerProgress.ts";

const KEY = "rs3-compass-design-v1";

function validProfile(value: unknown): value is Profile {
  if (!value || typeof value !== "object") return false;
  const p = value as Partial<Profile>;
  return (
    typeof p.id === "string" &&
    typeof p.name === "string" &&
    (p.kind === "Solo Ironman" || p.kind === "Group Ironman") &&
    (p.mode === "f2p" || p.mode === "members") &&
    typeof p.activeTask === "string" &&
    (p.source === undefined ||
      p.source === "sample" ||
      p.source === "hiscores") &&
    (p.hiscoresFetchedAt === undefined ||
      (typeof p.hiscoresFetchedAt === "number" &&
        Number.isFinite(p.hiscoresFetchedAt) &&
        p.hiscoresFetchedAt >= 0)) &&
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
      (!!p.trainingRanges &&
        typeof p.trainingRanges === "object" &&
        !Array.isArray(p.trainingRanges) &&
        Object.values(p.trainingRanges).every(
          (n) => Number.isInteger(n) && n >= 1 && n <= 120,
        ))) &&
    (p.trainingMethods === undefined ||
      (!!p.trainingMethods &&
        typeof p.trainingMethods === "object" &&
        !Array.isArray(p.trainingMethods) &&
        Object.values(p.trainingMethods).every(
          (id) => typeof id === "string" && id.length > 0 && id.length <= 128,
        ))) &&
    !!p.levels &&
    typeof p.levels === "object" &&
    !Array.isArray(p.levels) &&
    Object.values(p.levels).every(
      (n) => Number.isInteger(n) && n >= 1 && n <= 120,
    ) &&
    [p.completedQuests, p.packed, p.completedTasks].every(
      (a) => Array.isArray(a) && a.every((x) => typeof x === "string"),
    ) &&
    !!p.notes &&
    typeof p.notes === "object" &&
    !Array.isArray(p.notes) &&
    Object.values(p.notes).every((n) => typeof n === "string")
  );
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
  });
  const storageError = writable(false),
    ready = writable(false),
    compact = writable(false),
    notice = writable("");
  let unsubscribe: (() => void) | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let initialized = false;
  function notify(message: string) {
    notice.set(message);
    clearTimeout(timer);
    timer = setTimeout(() => notice.set(""), 4500);
  }
  return {
    state,
    storageError,
    ready,
    compact,
    notice,
    notify,
    initialize() {
      if (initialized) return;
      initialized = true;
      try {
        const raw = localStorage.getItem(KEY);
        if (raw) {
          const saved: unknown = JSON.parse(raw);
          if (saved && typeof saved === "object") {
            const s = saved as SavedState;
            if (
              s.version === 1 &&
              Array.isArray(s.profiles) &&
              s.profiles.every(validProfile) &&
              (s.profiles.length === 0
                ? s.activeId === ""
                : s.profiles.some((p) => p.id === s.activeId))
            ) {
              state.set(s);
              if (!s.profiles.length && typeof document !== "undefined")
                clearRememberedPlayer();
            } else {
              storageError.set(true);
              ready.set(true);
              return;
            }
          } else {
            storageError.set(true);
            ready.set(true);
            return;
          }
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
      ready.set(true);
    },
    destroy() {
      unsubscribe?.();
      clearTimeout(timer);
    },
    updateProfile(update) {
      state.update((current) => ({
        ...current,
        profiles: current.profiles.map((p) =>
          p.id === current.activeId ? update(p) : p,
        ),
      }));
    },
    selectProfile(id) {
      const profile = get(state).profiles.find((p) => p.id === id);
      if (!profile) return;
      state.update((current) =>
        current.activeId === id ? current : { ...current, activeId: id },
      );
      rememberSelection(profile);
    },
    addPlayer(player, kind, mode) {
      const id = "rs3:" + normalizePlayerName(player.name).toLowerCase();
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
        | "questProgress"
        | "eventLog"
        | "questImportStatus"
        | "eventImportStatus"
      > = {
        statistics: { ...player.statistics, fetchedAt: player.fetchedAt },
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
        let profile: Profile;
        if (existing)
          profile = {
            ...existing,
            name: player.name,
            levels: { ...existing.levels, ...player.levels },
            completedQuests: [
              ...new Set([...existing.completedQuests, ...imported]),
            ],
            source: "hiscores",
            hiscoresFetchedAt: player.fetchedAt,
            ...sourceData,
          };
        else {
          profile = {
            id,
            name: player.name,
            kind,
            mode,
            levels: { ...player.levels },
            completedQuests: imported,
            packed: [],
            completedTasks: [],
            notes: {},
            trainingRanges: {},
            activeTask: "",
            source: "hiscores",
            hiscoresFetchedAt: player.fetchedAt,
            ...sourceData,
          };
          profile.activeTask = nextQuest(profile)?.id ?? "train-Mining";
        }
        return {
          ...current,
          activeId: id,
          profiles: existing
            ? current.profiles.map((p) => (p.id === id ? profile : p))
            : [...current.profiles, profile],
        };
      });
      rememberSelection(
        get(state).profiles.find((profile) => profile.id === id)!,
      );
    },
    removePlayer(id) {
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
}
