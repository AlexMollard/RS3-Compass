<script lang="ts">
  import { onMount, untrack } from "svelte";
  import { page } from "$app/state";
  import { getCompass, getPlayerActions } from "../compassContext";
  import { playerKey } from "../playerName";
  import type { ActivitySource } from "../activityFeed";
  import ActivityFeed from "../components/ActivityFeed.svelte";
  import PageHeading from "../components/PageHeading.svelte";
  import ChoiceStrip from "../components/ChoiceStrip.svelte";
  import Button from "../components/Button.svelte";
  import GameWindow from "../components/GameWindow.svelte";
  import PlayerPortrait from "../components/PlayerPortrait.svelte";
  import SourceBanner from "../components/SourceBanner.svelte";
  import StatusChip from "../components/StatusChip.svelte";
  import { isSnapshotStale } from "../sourceStatus";
  import { relativeTime } from "../relativeTime";
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
  let errors = $derived(watched.filter((p) => $sync[p.id]?.state === "error"));
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
      return { tone: "info", label: "Needs membership and a public Event Log" };
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
    const timer = window.setInterval(() => refresh(), 60_000);
    const visible = () => refresh();
    document.addEventListener("visibilitychange", visible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", visible);
    };
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
    subtitle="Recent public Adventurer's Log events, with player attribution."
  >
    {#snippet trailing()}<Button
        onclick={() => refresh(false)}
        disabled={!sourceIds.length || !!refreshing || !!queued}
        >Refresh activity</Button
      >{/snippet}
  </PageHeading>
  <div class="activity-actions">
    <a href="/players">Manage players →</a><a href="/groups">Group Ironman →</a>
  </div>
  {#if groups.length}<ChoiceStrip
      label="Group"
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
    {#each errors as profile (profile.id)}<SourceBanner
        notice={{
          tone: quiet(profile.eventImportStatus) ? "private" : "failed",
          title: `${profile.name}: refresh failed`,
          message: `${$sync[profile.id].message ?? ""} Any previous snapshot is kept.`.trim(),
          retry: true,
        }}
        onRetry={() =>
          void controller.refreshPlayers([profile.id], { staleOnly: false })}
      />{/each}
    {#each profiles as profile (profile.id)}
      {@const copy = statusCopy(profile.eventImportStatus)}
      {#if copy && $sync[profile.id]?.state !== "error"}<SourceBanner
          notice={{
            tone: copy.tone,
            title: `${profile.name}: event log unavailable`,
            message: copy.message,
            retry: false,
          }}
        />{/if}
    {/each}
    <div class="two">
      <ActivityFeed
        {sources}
        active={true}
        showFilters={true}
        framed={true}
        initialLimit={20}
        playerId={selectedPlayer}
        onPlayerChange={(id) => (playerFilter = id)}
      />
      <GameWindow title="Who's included" className="included">
        <ul class="people">
          {#each profiles as profile (profile.id)}
            {@const chip = chipFor(profile)}
            {@const log = profile.eventLog}
            <li>
              <PlayerPortrait name={profile.name} size={36} />
              <span class="who">
                <b>{profile.name}</b>
                <span class="cap"
                  >{#if log}{log.events.length}
                    {log.events.length === 1 ? "event" : "events"} · updated
                    <time title={new Date(log.fetchedAt).toLocaleString()}
                      >{relativeTime(log.fetchedAt)}</time
                    >{:else}No events loaded yet{/if}</span
                >
                {#if log && !log.events.length && !statusCopy(profile.eventImportStatus)}<span
                    class="cap">No public events were returned.</span
                  >{/if}
                <a
                  class="cap"
                  href={"https://secure.runescape.com/m=adventurers-log/api/v1/playerEvents/" +
                    encodeURIComponent(profile.name)}
                  target="_blank"
                  rel="noopener noreferrer">Jagex source ↗</a
                >
              </span>
              <StatusChip tone={chip.tone} label={chip.label} />
            </li>
          {/each}
        </ul>
        <p class="cap note">
          Turn on the Event Log in RuneMetrics settings in-game to appear here.
        </p>
      </GameWindow>
    </div>
  {/if}
</div>

<style>
  .activity-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 20px;
    margin: 16px 0 24px;
  }
  .activity-actions a {
    color: var(--gold-bright);
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
    flex: 1 1 100px;
    min-width: 0;
    overflow-wrap: anywhere;
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
