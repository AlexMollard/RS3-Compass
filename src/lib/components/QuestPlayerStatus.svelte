<script lang="ts">
  import type { Profile, QuestRecord } from "../../data";
  import { findPlayerQuest } from "../playerProgress";
  import StatusChip from "./StatusChip.svelte";
  let { profile, quest }: { profile: Profile; quest: QuestRecord } = $props();
  let source = $derived(findPlayerQuest(profile, quest));
  let stale = $derived(profile.questImportStatus !== "available");
  let checked = $derived(profile.completedQuests.includes(quest.id));
</script>

{#if profile.source === "hiscores" && profile.questProgress}
  <section class="quest-player-status" aria-label="Jagex quest status">
    {#if source}
      <div class="source-status-row">
        <span class="badge" class:badge-gold={source.status === "STARTED"}>
          Jagex: {source.status === "COMPLETED"
            ? "Completed"
            : source.status === "STARTED"
              ? "Started"
              : "Not started"}
        </span>
        {#if source.status !== "COMPLETED"}
          <span
            >{source.eligible
              ? "Requirements met according to Jagex"
              : "Requirements not met according to Jagex"}</span
          >
        {/if}
        {#if stale}<StatusChip tone="warn" label="Last available status" />{/if}
      </div>
      <details>
        <summary>Source details</summary>
        <p>
          Fetched {new Date(profile.questProgress.fetchedAt).toLocaleString()}.
          {stale
            ? "The latest quest refresh was unavailable; this snapshot is retained."
            : "Quests synchronize on logout, world hop and periodically in-game. Jagex and Compass can each cache data for up to 10 minutes."}
          Eligibility does not replace Compass packing or preparation checks.
          {#if checked && source.status !== "COMPLETED"}Your existing Compass
            completion check is kept.{/if}
        </p>
      </details>
    {:else}
      <p>Jagex has not supplied a matching status for this activity.</p>
    {/if}
  </section>
{/if}

<style>
  .quest-player-status {
    margin: 8px 0 16px;
    min-width: 0;
  }
  .source-status-row {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px 12px;
  }
  .source-status-row > span:not(.badge),
  .quest-player-status p {
    font-size: var(--font-caption);
    color: var(--muted);
  }
  .quest-player-status details > summary {
    width: fit-content;
    min-height: 44px;
    padding: 10px 0;
    cursor: pointer;
    font-size: var(--font-caption);
  }
  .quest-player-status p {
    margin: 4px 0;
  }
</style>
