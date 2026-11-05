<script lang="ts">
  import type { PlayerEvent, PlayerImportStatus } from "../playerTypes";
  import ActivityFeed from "./ActivityFeed.svelte";
  let {
    events,
    fetchedAt,
    status,
    active = false,
    playerName,
  }: {
    events?: PlayerEvent[];
    fetchedAt?: number;
    status?: PlayerImportStatus;
    active?: boolean;
    playerName: string;
  } = $props();
</script>

<section class="activity" aria-label="Recent Adventurer's Log events">
  <h3>Recent activity</h3>
  <ActivityFeed
    sources={[
      { playerId: playerName, name: playerName, events, fetchedAt, status },
    ]}
    {active}
    initialLimit={5}
  />
</section>

<style>
  .activity {
    border-top: 1px solid var(--line);
    margin-top: 14px;
    padding-top: 14px;
    overflow-wrap: anywhere;
  }
  h3 {
    font-size: 1rem;
    margin: 0;
  }
</style>
