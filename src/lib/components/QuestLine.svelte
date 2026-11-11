<script lang="ts">
  import { Check } from "@lucide/svelte";
  import type { QuestRecord } from "../../data";
  import { questPath } from "../navigation";
  import GameArt from "./GameArt.svelte";

  let {
    name,
    quests,
    current,
    completed,
  }: {
    name: string;
    quests: readonly QuestRecord[];
    current: QuestRecord;
    completed: readonly string[];
  } = $props();
  let count = $derived(quests.filter((q) => completed.includes(q.id)).length);
</script>

<section class="tool-window quest-line" aria-labelledby="quest-line-title">
  <header class="window-title">
    <h2 id="quest-line-title">Quest line · {name}</h2>
    <span>{count} of {quests.length} complete</span>
  </header>
  <ol aria-label={`${name} quest line, in order`}>
    {#each quests as q (q.id)}
      {@const done = completed.includes(q.id)}
      {@const here = q.id === current.id}
      <li class:done class:here>
        <span class="line-node" aria-hidden="true"
          >{#if done}<Check size={10} strokeWidth={4} />{/if}</span
        >
        <a href={questPath(q.id)} aria-current={here ? "page" : undefined}
          ><GameArt file={q.icon} size={28} /><strong>{q.name}</strong><small
            >{here ? "This quest" : done ? "Completed" : "Not started"}</small
          ></a
        >
      </li>
    {/each}
  </ol>
  <p class="line-note">Series order from the RuneScape Wiki.</p>
</section>

<style>
  ol {
    list-style: none;
    margin: 0;
    padding: 26px 16px 8px;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(120px, 100%), 1fr));
    row-gap: 28px;
  }
  li {
    position: relative;
    padding: 16px 10px 0 0;
    border-top: 2px solid #34444f;
  }
  li.done {
    border-top-color: var(--green);
  }
  li.here {
    border-top-color: var(--gold);
  }
  .line-node {
    position: absolute;
    top: -8px;
    left: 0;
    display: grid;
    place-items: center;
    width: 14px;
    height: 14px;
    box-sizing: border-box;
    border: 2px solid #5f7584;
    border-radius: 50%;
    background: var(--bg);
    color: var(--bg);
  }
  .done .line-node {
    background: var(--green);
    border-color: var(--green);
  }
  .here .line-node {
    background: var(--gold-bright);
    border-color: var(--gold-bright);
    box-shadow: 0 0 0 3px #c5a46b40;
  }
  a {
    display: flex;
    flex-direction: column;
    gap: 2px;
    color: var(--text);
    text-decoration: none;
  }
  a :global(.game-art) {
    margin-bottom: 6px;
  }
  strong {
    line-height: 18px;
    text-wrap: pretty;
  }
  a:hover strong {
    color: var(--gold-bright);
    text-decoration: underline;
  }
  .done strong {
    color: var(--muted);
  }
  .here strong {
    color: var(--gold-bright);
  }
  small {
    font-size: var(--font-caption);
    color: var(--muted);
  }
  .line-note {
    margin: 0;
    padding: 8px 16px 14px;
    font-size: var(--font-caption);
    color: var(--muted);
  }
</style>
