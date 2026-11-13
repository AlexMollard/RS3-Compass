<script lang="ts">
  import type { BossRecord } from "../../bossTypes";
  import type { BossStatus } from "../bossLadder";
  import { bossPath, questPath } from "../navigation";
  import FallbackArt from "./FallbackArt.svelte";
  import StatusChip from "./StatusChip.svelte";

  let {
    boss,
    rank,
    status,
    got,
    total,
    tags,
  }: {
    boss: BossRecord;
    rank: number;
    status: BossStatus;
    got: number;
    total: number;
    tags: string[];
  } = $props();

  const TONES = {
    ready: "ok",
    quest: "warn",
    skill: "warn",
    levels: "info",
    members: "neutral",
    unknown: "neutral",
  } as const;
</script>

<li class="boss-row" class:ready={status.kind === "ready"}>
  <span class="rank">{rank}</span>
  <FallbackArt file={boss.image} size={40} className="boss-art" />
  <span class="who">
    <a class="name" href={bossPath(boss.id)}>{boss.name}</a>
    <small>Level {boss.level} · {boss.team}</small>
  </span>
  <span class="tags">
    <span class="tag tier">{boss.tier} tier</span>
    {#if !boss.members}<span class="tag tier">F2P</span>{/if}
  </span>
  <span class="status">
    {#if status.kind === "quest" && status.quest}<a class="status-link" href={questPath(status.quest)}
        ><StatusChip tone={TONES[status.kind]} label={status.text} /></a
      >{:else}<StatusChip tone={TONES[status.kind]} label={status.text} />{/if}
  </span>
  <span class="why">
    {#each tags as tag (tag)}<span class="tag">{tag}</span>{/each}
  </span>
  <span class="log" class:complete={total > 0 && got === total}>{got} / {total} log</span>
</li>

<style>
  .boss-row {
    position: relative;
    display: grid;
    grid-template-columns: 26px 40px minmax(0, 1.5fr) auto minmax(0, 1.5fr) minmax(0, 1fr) 64px;
    align-items: center;
    gap: 12px;
    min-height: 56px;
    padding: 8px 14px;
    border-bottom: 1px solid var(--line);
  }
  .boss-row:hover {
    background: var(--panel-raised);
  }
  /* Ready rows get a green edge; nothing is dimmed, so text keeps full contrast. */
  .boss-row.ready {
    box-shadow: inset 3px 0 0 var(--green);
  }
  .rank {
    color: var(--muted);
    font-weight: 700;
    text-align: right;
  }
  .boss-row :global(.boss-art) {
    width: 40px;
    height: 40px;
  }
  .who {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .name {
    font-size: 14px;
    font-weight: 600;
    color: var(--text);
    text-decoration: none;
  }
  /* The whole row opens the boss; the quest link sits above it. */
  .name::after {
    content: "";
    position: absolute;
    inset: 0;
  }
  .name:hover {
    color: var(--gold-bright);
  }
  .name:focus-visible {
    outline: none;
  }
  .boss-row:has(.name:focus-visible) {
    outline: 2px solid var(--gold);
    outline-offset: -2px;
  }
  small {
    font-size: 12px;
    line-height: 16px;
    color: var(--muted);
  }
  .tags,
  .why {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    min-width: 0;
  }
  .tag {
    display: inline-block;
    padding: 0 7px;
    border: 1px solid var(--frame-line);
    border-radius: 3px;
    color: var(--muted);
    font-size: 11px;
    line-height: 18px;
    font-weight: 600;
    letter-spacing: 0.3px;
    white-space: nowrap;
  }
  .tag.tier {
    color: var(--blue);
  }
  .status {
    min-width: 0;
  }
  /* Long quest names wrap inside the chip instead of spilling into the next column. */
  .status :global(.status-chip) {
    white-space: normal;
  }
  .status-link {
    position: relative;
    z-index: 1;
    text-decoration: none;
  }
  .status-link:hover :global(.status-chip) {
    text-decoration: underline;
  }
  .log {
    font-size: 12px;
    color: var(--muted);
    text-align: right;
    white-space: nowrap;
  }
  .log.complete {
    color: var(--green);
  }
  @container (max-width: 900px) {
    .boss-row {
      grid-template-columns: 26px 40px minmax(0, 1fr) auto;
      row-gap: 6px;
    }
    .tags,
    .status,
    .why {
      grid-column: 3 / -1;
    }
    .log {
      grid-column: 4;
      grid-row: 1;
    }
  }
</style>
