<script lang="ts">
  import { onMount, untrack } from "svelte";
  import { Download, RefreshCw } from "@lucide/svelte";
  import { getCompass } from "../compassContext";
  import PlayerManager from "../components/PlayerManager.svelte";
  import PageHeading from "../components/PageHeading.svelte";
  import Button from "../components/Button.svelte";

  const controller = getCompass();
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
    subtitle="Each character keeps its own notes, packing and plans."
  >
    {#snippet trailing()}<div class="head-actions">
        <a class="btn btn-quiet" href="/groups">Group Ironman</a>
        <a class="btn btn-quiet" href="/compare">Compare players</a>
        <a class="btn btn-quiet" href="/activity">Activity feeds</a>
        <Button variant="quiet" onclick={controller.exportProgress}
          ><Download size={16} aria-hidden="true" />Export progress</Button
        >
        <Button disabled={!ids.length || busy} onclick={() => refresh(false)}
          ><RefreshCw size={16} aria-hidden="true" />{busy
            ? "Refreshing players…"
            : "Refresh public players"}</Button
        >
      </div>{/snippet}
  </PageHeading>
  <PlayerManager />
</div>

<style>
  .head-actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }
  .head-actions :global(.btn) {
    min-height: 40px;
  }
</style>
