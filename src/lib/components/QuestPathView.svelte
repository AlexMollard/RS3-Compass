<script lang="ts">
  import { Check, Lock } from "@lucide/svelte";
  import type { QuestRecord } from "../../data";
  import { questPath } from "../navigation";
  import { difficultyColor, type QuestStatus } from "../questMap";
  import GameArt from "./GameArt.svelte";

  let {
    columns,
    quests,
    status,
  }: {
    /** Earlier quests by tier, the goal alone last (from pathColumns). */
    columns: string[][];
    quests: readonly QuestRecord[];
    status: ReadonlyMap<string, QuestStatus>;
  } = $props();

  const W = 196;
  const H = 52;
  const PITCH = 62;
  const GAP = 56;
  const PAD = 16;

  let byId = $derived(new Map(quests.map((q) => [q.id, q])));
  let spots = $derived.by(() => {
    const tallest = Math.max(...columns.map((c) => c.length));
    const at = new Map<string, { x: number; y: number }>();
    columns.forEach((column, i) => {
      // Centre each column against the tallest, so short columns sit mid-height.
      const offset = ((tallest - column.length) * PITCH) / 2;
      column.forEach((id, j) => at.set(id, { x: PAD + i * (W + GAP), y: PAD + offset + j * PITCH }));
    });
    return at;
  });
  let size = $derived({
    width: PAD * 2 + columns.length * W + (columns.length - 1) * GAP,
    height: PAD * 2 + Math.max(...columns.map((c) => c.length)) * PITCH - (PITCH - H),
  });
  let lines = $derived(
    [...spots].flatMap(([id, b]) =>
      (byId.get(id)?.questRequirements ?? []).flatMap((r) => {
        const a = spots.get(r);
        if (!a) return [];
        const x1 = a.x + W;
        const y1 = a.y + H / 2;
        const x2 = b.x;
        const y2 = b.y + H / 2;
        const mx = (x1 + x2) / 2;
        return [{ d: `M${x1} ${y1}C${mx} ${y1} ${mx} ${y2} ${x2} ${y2}`, done: status.get(r) === "done" }];
      }),
    ),
  );
  const heading = (i: number) =>
    i === columns.length - 1 ? "Goal" : i === 0 ? "No earlier quests" : `${i} ${i === 1 ? "step" : "steps"} in`;
</script>

<div class="path-scroll">
  <div class="path-heads" style:width="{size.width}px">
    {#each columns as _, i (i)}<span style:left="{PAD + i * (W + GAP)}px" style:width="{W}px"
        >{heading(i)}</span
      >{/each}
  </div>
  <div class="path-board" style:width="{size.width}px" style:height="{size.height}px">
    <svg width={size.width} height={size.height} aria-hidden="true">
      {#each lines as line, i (i)}<path class:done={line.done} d={line.d} />{/each}
    </svg>
    <ol class="path-cards">
      {#each columns.flat() as id (id)}
        {@const q = byId.get(id)}
        {@const spot = spots.get(id)}
        {@const s = status.get(id) ?? "locked"}
        {#if q && spot}<li style:left="{spot.x}px" style:top="{spot.y}px">
            <a
              href={questPath(id)}
              class="path-card {s}"
              class:goal={id === columns.at(-1)?.[0]}
              style:--difficulty={difficultyColor(q.difficulty)}
              ><GameArt file={q.icon} size={24} /><span class="text"
                ><strong>{q.name}</strong><small
                  >{s === "done"
                    ? "Completed"
                    : s === "ready"
                      ? "Can start now"
                      : s === "levels"
                        ? "Needs higher levels"
                        : q.difficulty + " · " + q.length}</small
                ></span
              >{#if s === "done"}<Check size={16} class="state" aria-label="Completed" />{:else if s === "locked"}<Lock
                  size={14}
                  class="state"
                  aria-label="Needs earlier quests"
                />{/if}</a
            >
          </li>{/if}
      {/each}
    </ol>
  </div>
</div>

<style>
  .path-scroll {
    overflow-x: auto;
    padding-bottom: 8px;
  }
  .path-heads {
    position: relative;
    height: 36px;
    border-bottom: 1px solid var(--line);
  }
  .path-heads span {
    position: absolute;
    top: 10px;
    font-size: 11px;
    line-height: 16px;
    font-weight: 700;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: var(--muted);
  }
  .path-board {
    position: relative;
  }
  .path-board svg {
    position: absolute;
    inset: 0;
  }
  .path-board path {
    fill: none;
    stroke: var(--gold);
    stroke-opacity: 0.75;
    stroke-width: 1.6;
  }
  .path-board path.done {
    stroke: var(--green);
    stroke-opacity: 0.6;
  }
  .path-cards {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .path-cards li {
    position: absolute;
  }
  .path-card {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 196px;
    height: 52px;
    box-sizing: border-box;
    padding: 0 10px;
    background: var(--panel-raised);
    border: 1px solid var(--frame-line);
    border-left: 3px solid var(--difficulty);
    border-radius: 3px;
    color: var(--heading);
    text-decoration: none;
  }
  .path-card:hover {
    border-color: var(--gold-bright);
    border-left-color: var(--difficulty);
  }
  .path-card.done {
    background: #162a26;
  }
  .path-card.ready {
    border-color: var(--gold);
    border-left-color: var(--difficulty);
  }
  .path-card.locked {
    background: #141f27;
    color: #b0bec7;
  }
  .path-card.goal {
    background: #3a3221;
    border-color: var(--gold-bright);
    border-left-color: var(--difficulty);
    box-shadow: 0 0 0 3px #e5c89233;
  }
  .text {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-width: 0;
  }
  .text strong {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 13px;
    line-height: 17px;
  }
  .text small {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 11px;
    line-height: 15px;
    color: var(--muted);
  }
  .path-card.ready small {
    color: var(--gold-bright);
  }
  .path-card.levels small {
    color: #c9ad78;
  }
  .path-card :global(.state) {
    flex: none;
    color: var(--muted);
  }
  .path-card.done :global(.state) {
    color: var(--green);
  }
</style>
