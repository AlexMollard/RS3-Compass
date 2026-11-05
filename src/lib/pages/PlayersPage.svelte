<script lang="ts">
  import { onMount, untrack } from "svelte";
  import { getCompass, getPlayerActions } from "../compassContext";
  import PlayerManager from "../components/PlayerManager.svelte";
  import PageHeading from "../components/PageHeading.svelte";
  import Button from "../components/Button.svelte";

  const controller = getCompass();
  const actions = getPlayerActions();
  const saved = controller.state;
  const sync = controller.syncState;
  let mounted = $state(false);
  let ids = $derived(
    $saved.profiles.filter((p) => p.source === "hiscores").map((p) => p.id),
  );
  let key = $derived(JSON.stringify(ids));
  let busy = $derived(
    ids.some(
      (id) =>
        $sync[id]?.state === "queued" || $sync[id]?.state === "refreshing",
    ),
  );
  function refresh(staleOnly = true) {
    if (document.visibilityState !== "hidden")
      void controller.refreshPlayers(ids, {
        staleOnly,
        scope: staleOnly ? "players" : undefined,
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
    key;
    if (mounted) untrack(() => refresh());
    return () => controller.cancelRefreshScope("players");
  });
</script>

<div class="players-page page-enter">
  <PageHeading
    title="Players"
    subtitle="Separate preparation journals and public game snapshots."
  >
    {#snippet trailing()}<Button
        variant="primary"
        onclick={() => actions.lookup()}>Add a player</Button
      >{/snippet}
  </PageHeading>
  <div class="workspace-actions">
    <Button disabled={!ids.length || busy} onclick={() => refresh(false)}
      >{busy ? "Refreshing players…" : "Refresh all players"}</Button
    >
    <Button variant="quiet" onclick={controller.exportProgress}
      >Export progress</Button
    >
    <a href="/groups">Group Ironman →</a><a href="/activity">Activity feeds →</a
    >
  </div>
  <p class="sync-policy">
    Public snapshots refresh while this view is visible, when their cache
    expires. Jagex and Compass caching can each add delay. Notes, packing and
    planning settings stay on this device; refreshes do not switch your
    character.
  </p>
  <PlayerManager />
</div>

<style>
  .workspace-actions {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 10px 18px;
    margin: 20px 0 12px;
  }
  .workspace-actions a {
    color: var(--gold-bright);
    text-underline-offset: 3px;
  }
  .sync-policy {
    max-width: 85ch;
    color: var(--muted);
    font-size: var(--font-caption);
    margin-bottom: 24px;
  }
</style>
