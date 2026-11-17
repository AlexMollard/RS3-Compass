<script lang="ts">
  import { onMount, untrack } from "svelte";
  import { page } from "$app/state";
  import { getCompass, getPlayerActions } from "../compassContext";
  import { playerKey } from "../playerName";
  import {
    mergeActivity,
    weeklyTotals,
    type ActivitySource,
  } from "../activityFeed";
  import ActivityFeed from "../components/ActivityFeed.svelte";
  import PageHeading from "../components/PageHeading.svelte";
  import ChoiceStrip from "../components/ChoiceStrip.svelte";
  import Button from "../components/Button.svelte";
  import GameWindow from "../components/GameWindow.svelte";
  import PlayerPortrait from "../components/PlayerPortrait.svelte";
  import StatusChip from "../components/StatusChip.svelte";
  import { isSnapshotStale } from "../sourceStatus";
  import { relativeTime } from "../relativeTime";
  import { startVisibleRefresh } from "../visibleRefresh";
  import type { Profile } from "../../data";

  const controller = getCompass();
  const actions = getPlayerActions();
  const saved = controller.state;
  const sync = controller.syncState;
  let groupFilter = $state("all");
  let playerFilter = $state("all");
  let mounted = $state(false);
  let groups = $derived($saved.groups ?? []);
  let selectedGroup = $derived(
    groups.find((g) => String(g.id) === groupFilter),
  );
  let roster = $derived(
    new Set((selectedGroup?.members ?? []).map((m) => playerKey(m.name))),
  );
  let profiles = $derived(
    $saved.profiles.filter(
      (p) =>
        p.source === "hiscores" &&
        (!selectedGroup || roster.has(playerKey(p.name))),
    ),
  );
  let selectedPlayer = $derived(
    profiles.some((p) => p.id === playerFilter) ? playerFilter : "all",
  );
  let watched = $derived(
    selectedPlayer === "all"
      ? profiles
      : profiles.filter((p) => p.id === selectedPlayer),
  );
  let sourceIds = $derived(watched.map((p) => p.id));
  let sourceKey = $derived(JSON.stringify(sourceIds));
  let sources: ActivitySource[] = $derived(
    profiles.map((p) => ({
      playerId: p.id,
      name: p.name,
      events: p.eventLog?.events,
      fetchedAt: p.eventLog?.fetchedAt,
      status: p.eventImportStatus,
    })),
  );
  let refreshing = $derived(
    watched.filter((p) => $sync[p.id]?.state === "refreshing").length,
  );
  let queued = $derived(
    watched.filter((p) => $sync[p.id]?.state === "queued").length,
  );
  // Re-stamped whenever a refresh brings new sources, so ages do not freeze at mount.
  let now = $derived.by(() => {
    void sources;
    return Date.now();
  });
  let lastFetched = $derived(
    Math.max(0, ...watched.map((p) => p.eventLog?.fetchedAt ?? 0)),
  );
  let totals = $derived(weeklyTotals(sources, now));
  let eventCounts = $derived(
    new Map(sources.map((s) => [s.playerId, mergeActivity([s]).length])),
  );
  let totalEvents = $derived(
    [...eventCounts.values()].reduce((sum, n) => sum + n, 0),
  );
  // Players with nothing loaded are explained under Needs attention, not offered as a filter.
  let playerChoices = $derived(profiles.filter((p) => eventCounts.get(p.id)));
  const plural = (n: number, word: string) =>
    `${n} ${word}${n === 1 ? "" : "s"}`;
  let attention = $derived(
    profiles.filter((p) => {
      const state = $sync[p.id]?.state;
      return (
        state !== "refreshing" && state !== "queued" && chipFor(p).tone !== "ok"
      );
    }),
  );
  /** Mirrors chipFor's order so the chip and the sentence agree. */
  function attentionCopy(profile: Profile): { message: string; retry: boolean } {
    const syncState = $sync[profile.id];
    const status = profile.eventImportStatus;
    if (syncState?.state === "error")
      return {
        message: `${syncState.message ?? ""} Any previous snapshot is kept.`.trim(),
        retry: true,
      };
    if (quiet(status))
      return { message: statusCopy(status)!.message, retry: false };
    if (isSnapshotStale(profile, syncState))
      return {
        message: profile.eventLog
          ? `The last refresh failed. Showing events from ${relativeTime(profile.eventLog.fetchedAt, now)}.`
          : "The last refresh failed. Showing the last snapshot.",
        retry: true,
      };
    const copy = statusCopy(status);
    if (copy) return { message: copy.message, retry: true };
    return { message: "Events have not been loaded yet.", retry: true };
  }
  function statusCopy(status?: string) {
    if (status === "not-member")
      return {
        tone: "private" as const,
        message:
          "This event log requires active membership; Jagex reports this account is not a member.",
      };
    if (status === "private-or-unavailable")
      return {
        tone: "private" as const,
        message: "Jagex did not expose an event log for this player.",
      };
    if (status === "service-unavailable")
      return {
        tone: "failed" as const,
        message:
          "The event service could not be reached. Any last available snapshot is kept.",
      };
    return undefined;
  }
  const quiet = (status?: string) =>
    status === "private-or-unavailable" || status === "not-member";
  function chipFor(profile: Profile): {
    tone: "ok" | "warn" | "bad" | "info" | "neutral";
    label: string;
  } {
    const status = profile.eventImportStatus;
    const n = profile.eventLog?.events.length ?? 0;
    if ($sync[profile.id]?.state === "error")
      return { tone: "bad", label: "Refresh failed" };
    if (status === "not-member")
      return { tone: "info", label: "Needs membership" };
    if (status === "private-or-unavailable")
      return { tone: "neutral", label: "Private or unavailable" };
    if (isSnapshotStale(profile, $sync[profile.id]))
      return { tone: "warn", label: "Stale snapshot" };
    if (profile.eventLog)
      return { tone: "ok", label: `${n} ${n === 1 ? "event" : "events"}` };
    if (status === "service-unavailable")
      return { tone: "bad", label: "Event service unavailable" };
    return { tone: "neutral", label: "Not loaded yet" };
  }
  $effect(() => {
    groupFilter = page.url.searchParams.get("group") ?? "all";
  });
  $effect(() => {
    playerFilter = page.url.searchParams.get("player") ?? "all";
  });
  function refresh(staleOnly = true) {
    if (document.visibilityState !== "hidden" && sourceIds.length)
      void controller.refreshPlayers(sourceIds, {
        staleOnly,
        scope: staleOnly ? "activity" : undefined,
      });
  }
  onMount(() => {
    mounted = true;
    return startVisibleRefresh(() => refresh());
  });
  $effect(() => {
    sourceKey;
    if (mounted) untrack(() => refresh());
    return () => controller.cancelRefreshScope("activity");
  });
</script>

<div class="page-enter activity-page">
  <PageHeading
    title="Activity"
    subtitle="What your players did recently, from their public Adventurer's Logs."
  >
    {#snippet trailing()}<span class="refresh"
        >{#if lastFetched}<span class="updated"
            >Updated <time title={new Date(lastFetched).toLocaleString()}
              >{relativeTime(lastFetched, now)}</time
            ></span
          >{/if}<Button
          onclick={() => refresh(false)}
          disabled={!sourceIds.length || !!refreshing || !!queued}
          >Refresh activity</Button
        ></span
      >{/snippet}
  </PageHeading>
  {#if groups.length}<ChoiceStrip
      label="Group"
      legend="inline"
      name="activity-group"
      value={selectedGroup ? groupFilter : "all"}
      choices={[
        { value: "all", label: "All saved players" },
        ...groups.map((g) => ({ value: String(g.id), label: g.name })),
      ]}
      onChange={(value) => {
        groupFilter = value;
        playerFilter = "all";
      }}
    />{/if}
  {#if selectedGroup}<p class="source">
      Roster fetched {new Date(selectedGroup.fetchedAt).toLocaleString()} · {profiles.length}/{selectedGroup
        .members.length} member players loaded.
      <a href="/groups">Load missing members</a>.
    </p>{/if}
  {#if !profiles.length}<p>No saved public players in this scope.</p>
    <Button onclick={() => actions.lookup()}>Add a player</Button>
  {:else}
    {#if refreshing || queued}<p class="source" role="status">
        {refreshing} refreshing · {queued} queued. Existing events stay visible.
      </p>{/if}
    <div class="players">
      {#if playerChoices.length > 1}<ChoiceStrip
          label="Player"
          legend="hidden"
          name="activity-player"
          value={selectedPlayer}
          choices={[
            {
              value: "all",
              label: "All players",
              detail: plural(totalEvents, "event"),
            },
            ...playerChoices.map((p) => ({
              value: p.id,
              label: p.name,
              detail: plural(eventCounts.get(p.id) ?? 0, "event"),
            })),
          ]}
          onChange={(value) => (playerFilter = value)}
        />{/if}
      {#if attention.length}<a class="attention-link" href="#needs-attention"
          >{plural(attention.length, "player")}
          {attention.length === 1 ? "needs" : "need"} attention</a
        >{/if}
    </div>
    <div class="two">
      <ActivityFeed
        {sources}
        active={true}
        showFilters={true}
        framed={true}
        initialLimit={20}
        playerId={selectedPlayer}
      />
      <div class="side">
        {#if totals.length}<GameWindow title="Last 7 days">
            <table class="week">
              <thead>
                <tr>
                  <th scope="col">Player</th>
                  <th scope="col">Levels</th>
                  <th scope="col">Quests</th>
                  <th scope="col">Drops</th>
                </tr>
              </thead>
              <tbody>
                {#each totals as row (row.playerId)}
                  <tr>
                    <th scope="row">{row.name}</th>
                    <td>{row.levels}</td>
                    <td>{row.quests}</td>
                    <td>{row.drops}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
            <p class="cap note">Counts only cover events Jagex returned.</p>
          </GameWindow>{/if}
        {#if attention.length}<div id="needs-attention"><GameWindow title="Needs attention">
            <ul class="people">
              {#each attention as profile (profile.id)}
                {@const chip = chipFor(profile)}
                {@const copy = attentionCopy(profile)}
                <li>
                  <PlayerPortrait name={profile.name} size={28} />
                  <span class="who">
                    <b>{profile.name}</b>
                    <StatusChip tone={chip.tone} label={chip.label} />
                    <span class="cap">{copy.message}</span>
                    <span class="links">
                      {#if copy.retry}<Button
                          variant="quiet"
                          onclick={() =>
                            void controller.refreshPlayers([profile.id], {
                              staleOnly: false,
                            })}>Try again</Button
                        >{/if}
                      <a
                        class="cap"
                        href={"https://secure.runescape.com/m=adventurers-log/api/v1/playerEvents/" +
                          encodeURIComponent(profile.name)}
                        target="_blank"
                        rel="noopener noreferrer">Jagex source ↗</a
                      >
                    </span>
                  </span>
                </li>
              {/each}
            </ul>
            <details class="note">
              <summary>How to share your Event Log</summary>
              <p>
                Active members can turn it on in Settings → Gameplay → Chat
                &amp; Social → RuneMetrics Event Log. Changes are not
                retroactive, and kills and level-ups can be batched.
              </p>
            </details>
          </GameWindow></div>{/if}
      </div>
    </div>
  {/if}
</div>

<style>
  .activity-page :global(.utility-heading) {
    margin-bottom: 20px;
  }
  .players {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    gap: 0 16px;
  }
  .attention-link {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    color: var(--muted);
    text-underline-offset: 3px;
  }
  .source {
    color: var(--muted);
    font-size: var(--font-caption);
  }
  .two {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 320px;
    gap: 24px;
    align-items: start;
    margin-top: 20px;
  }
  .people {
    list-style: none;
    margin: 0;
    padding: 6px 16px 10px;
  }
  .people li {
    display: flex;
    flex-wrap: wrap;
    gap: 6px 10px;
    align-items: center;
    padding: 10px 0;
    border-bottom: 1px solid var(--line);
  }
  .people li:last-child {
    border-bottom: 0;
  }
  .who {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
    flex: 1 1 100px;
    min-width: 0;
    overflow-wrap: anywhere;
  }
  .refresh {
    display: inline-flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px;
  }
  .updated {
    font-size: var(--font-caption);
    color: var(--muted);
  }
  .side {
    display: grid;
    gap: 20px;
    min-width: 0;
  }
  .people li {
    align-items: flex-start;
  }
  .links {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px 12px;
  }
  .week {
    width: calc(100% - 32px);
    margin: 8px 16px 0;
    border-collapse: collapse;
    font-size: var(--font-ui);
  }
  .week th,
  .week td {
    padding: 6px 0;
    text-align: right;
    font-variant-numeric: tabular-nums;
  }
  .week thead th {
    font-size: var(--font-caption);
    font-weight: 600;
    color: var(--muted);
  }
  .week th:first-child {
    text-align: left;
  }
  .week tbody tr {
    border-top: 1px solid var(--line);
  }
  details.note summary {
    cursor: pointer;
    min-height: 36px;
    display: flex;
    align-items: center;
    color: var(--gold-bright);
    font-weight: 600;
  }
  details.note p {
    margin: 0;
    color: var(--text);
    font-size: var(--font-ui);
  }
  .cap,
  .note {
    font-size: var(--font-caption);
    color: var(--muted);
  }
  .note {
    margin: 0;
    padding: 0 16px 16px;
  }
  @media (max-width: 980px) {
    .two {
      grid-template-columns: minmax(0, 1fr);
    }
  }
</style>
