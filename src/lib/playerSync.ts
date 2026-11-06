import { get, writable } from "svelte/store";
import type { Profile } from "../data.ts";
import type { PlayerLookup } from "./playerTypes.ts";
import type { PlayerSyncStatus } from "./compassContext.ts";
import { fetchPlayer, PlayerFetchError } from "./playerClient.ts";

const CACHE_MS = 10 * 60_000;
const RETRY_MS = 60_000;

export interface SyncTarget {
  id: string;
  name: string;
  groupId?: number;
  kind: Profile["kind"];
  mode: Profile["mode"];
}

interface Job {
  target: SyncTarget;
  abort: AbortController;
  promise: Promise<void>;
  scopes: Set<string>;
  finish(): void;
}

export function createPlayerSynchronizer(options: {
  profile(id: string): Profile | undefined;
  allowed(target: SyncTarget): boolean;
  apply(player: PlayerLookup, target: SyncTarget): void;
  fetch?: typeof fetchPlayer;
  now?: () => number;
  visible?: () => boolean;
}) {
  const state = writable<Record<string, PlayerSyncStatus>>({});
  const jobs = new Map<string, Job>();
  const queue: Job[] = [];
  const clock = options.now ?? Date.now;
  const visible =
    options.visible ??
    (() =>
      typeof document === "undefined" || document.visibilityState !== "hidden");
  let running = 0;
  let stopped = false;
  let cooldownUntil = 0;
  let wakeTimer: ReturnType<typeof setTimeout> | undefined;

  function status(id: string, value: PlayerSyncStatus) {
    state.update((current) => ({ ...current, [id]: value }));
  }
  function dueAt(profile: Profile | undefined) {
    const fetchedAt = profile?.publicFetchedAt ?? profile?.hiscoresFetchedAt;
    if (
      fetchedAt == null ||
      !profile?.hiscoresImportStatus ||
      !profile.questImportStatus ||
      !profile.eventImportStatus
    )
      return 0;
    const previous = get(state)[profile.id];
    const degraded =
      profile.hiscoresImportStatus === "service-unavailable" ||
      profile.questImportStatus === "service-unavailable" ||
      profile.eventImportStatus === "service-unavailable";
    return degraded
      ? (previous?.attemptedAt ?? 0) + RETRY_MS
      : fetchedAt + CACHE_MS;
  }
  function received(player: PlayerLookup): PlayerSyncStatus {
    const partial =
      player.hiscoresImportStatus !== "available" ||
      player.quests.status !== "available" ||
      player.events.status !== "available";
    const transient =
      player.hiscoresImportStatus === "service-unavailable" ||
      (player.quests.status === "unavailable" &&
        player.quests.reason === "service-unavailable") ||
      (player.events.status === "unavailable" &&
        player.events.reason === "service-unavailable");
    return {
      state: "idle",
      attemptedAt: clock(),
      nextRefreshAt: Math.max(
        clock(),
        transient ? clock() + RETRY_MS : player.fetchedAt + CACHE_MS,
      ),
      message: partial
        ? "Public snapshot loaded; some source data is unavailable."
        : "Public snapshot loaded.",
    };
  }
  async function run(job: Job) {
    const { target, abort } = job;
    status(target.id, { state: "refreshing", attemptedAt: clock() });
    try {
      const player = await (options.fetch ?? fetchPlayer)(
        target.name,
        abort.signal,
      );
      if (
        stopped ||
        abort.signal.aborted ||
        jobs.get(target.id) !== job ||
        !options.allowed(target)
      )
        return;
      options.apply(player, target);
      status(target.id, received(player));
    } catch (error) {
      if (
        stopped ||
        abort.signal.aborted ||
        jobs.get(target.id) !== job ||
        !options.allowed(target)
      )
        return;
      const retryMs =
        error instanceof PlayerFetchError && error.retryAfterMs
          ? error.retryAfterMs
          : RETRY_MS;
      if (error instanceof PlayerFetchError && error.retryAfterMs)
        cooldownUntil = Math.max(cooldownUntil, clock() + retryMs);
      status(target.id, {
        state: "error",
        attemptedAt: clock(),
        nextRefreshAt: clock() + retryMs,
        rateLimited:
          error instanceof PlayerFetchError && !!error.retryAfterMs
            ? true
            : undefined,
        message:
          error instanceof Error
            ? error.message
            : "Player service unavailable. Saved progress is unchanged.",
      });
    } finally {
      if (jobs.get(target.id) === job) jobs.delete(target.id);
      running--;
      job.finish();
      pump();
    }
  }
  function pump() {
    clearTimeout(wakeTimer);
    wakeTimer = undefined;
    if (stopped || !visible()) return;
    if (cooldownUntil > clock()) {
      if (queue.length) wakeTimer = setTimeout(pump, cooldownUntil - clock());
      return;
    }
    while (running < 2 && queue.length) {
      const job = queue.shift()!;
      if (
        job.abort.signal.aborted ||
        !job.scopes.size ||
        !options.allowed(job.target)
      ) {
        if (jobs.get(job.target.id) === job) jobs.delete(job.target.id);
        job.finish();
        continue;
      }
      running++;
      void run(job);
    }
  }
  function refresh(
    target: SyncTarget,
    staleOnly = false,
    scope = "manual",
  ): Promise<void> {
    if (stopped || !options.allowed(target)) return Promise.resolve();
    const current = jobs.get(target.id);
    if (current) {
      current.scopes.add(scope);
      return current.promise;
    }
    const previous = get(state)[target.id];
    const next = Math.max(
      dueAt(options.profile(target.id)),
      previous?.nextRefreshAt ?? 0,
    );
    if (next > clock()) {
      if (!staleOnly)
        status(target.id, {
          ...previous,
          state: previous?.state === "error" ? "error" : "idle",
          nextRefreshAt: next,
          message:
            previous?.state === "error"
              ? previous.message
              : "Using the cached public snapshot; no extra request was sent.",
        });
      return Promise.resolve();
    }
    let finish!: () => void;
    const promise = new Promise<void>((resolve) => {
      finish = resolve;
    });
    const job: Job = {
      target,
      abort: new AbortController(),
      promise,
      finish,
      scopes: new Set([scope]),
    };
    jobs.set(target.id, job);
    queue.push(job);
    status(target.id, {
      state: "queued",
      nextRefreshAt: cooldownUntil || undefined,
    });
    pump();
    return promise;
  }
  function cancel(id: string) {
    const job = jobs.get(id);
    if (job) {
      job.abort.abort();
      jobs.delete(id);
      job.finish();
    }
    state.update((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
  }
  return {
    state,
    refresh,
    wake: pump,
    cancel,
    received(id: string, player: PlayerLookup) {
      if (!jobs.has(id)) status(id, received(player));
    },
    cancelScope(scope: string) {
      for (const [id, job] of jobs) {
        job.scopes.delete(scope);
        // Already-started requests may finish safely; withdraw only obsolete queued demand.
        if (!job.scopes.size && get(state)[id]?.state === "queued") cancel(id);
      }
    },
    cancelGroup(id: number) {
      for (const [playerId, job] of jobs) {
        job.scopes.delete("group-import:" + id);
        if (
          !job.scopes.size &&
          (job.target.groupId === id ||
            get(state)[playerId]?.state === "queued")
        )
          cancel(playerId);
      }
    },
    destroy() {
      stopped = true;
      clearTimeout(wakeTimer);
      for (const id of jobs.keys()) cancel(id);
      queue.length = 0;
    },
  };
}
