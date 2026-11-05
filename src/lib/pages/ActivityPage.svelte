<script lang="ts">
  import { onMount, untrack } from "svelte";
  import { page } from "$app/state";
  import { getCompass, getPlayerActions } from "../compassContext";
  import { normalizePlayerName } from "../playerName";
  import type { ActivitySource } from "../activityFeed";
  import ActivityFeed from "../components/ActivityFeed.svelte";
  import PageHeading from "../components/PageHeading.svelte";
  import ChoiceStrip from "../components/ChoiceStrip.svelte";
  import Button from "../components/Button.svelte";

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
  const key = (name: string) => normalizePlayerName(name).toLowerCase();
  let roster = $derived(
    new Set((selectedGroup?.members ?? []).map((m) => key(m.name))),
  );
  let profiles = $derived(
    $saved.profiles.filter(
      (p) =>
        p.source === "hiscores" && (!selectedGroup || roster.has(key(p.name))),
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
    {#each errors as profile (profile.id)}<p class="source error" role="status">
        <strong>{profile.name}:</strong>
        {$sync[profile.id].message} Any previous snapshot is kept.
      </p>{/each}
    <ActivityFeed
      {sources}
      active={true}
      showFilters={true}
      initialLimit={20}
      playerId={selectedPlayer}
      onPlayerChange={(id) => (playerFilter = id)}
    />
  {/if}
</div>

<style>
  .activity-page {
    max-width: 1100px;
  }
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
  .error {
    color: var(--gold-bright);
  }
</style>
