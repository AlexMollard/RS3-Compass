<script lang="ts">
  import type { QuestReadiness } from "../questReadiness";
  let {
    readiness,
    anchors,
  }: {
    readiness: QuestReadiness;
    /** Turns the tiles into jump links; `start` adds a phone-only Start tile. */
    anchors?: { levels: string; pack: string; danger: string; start?: string };
  } = $props();
  let levels = $derived(readiness.levels);
  let pack = $derived(readiness.pack);
  let tiles = $derived([
    {
      label: "Levels",
      href: anchors?.levels,
      tone:
        levels.unknown > 0
          ? "tone-muted"
          : levels.met === levels.total
            ? "tone-ok"
            : "tone-warn",
      value:
        levels.total === 0
          ? "None"
          : levels.unknown > 0
            ? "? unknown"
            : levels.met + " / " + levels.total,
    },
    {
      label: "Pack",
      href: anchors?.pack,
      tone: pack.packed === pack.total ? "tone-ok" : "tone-warn",
      value: pack.packed + " / " + pack.total,
    },
    {
      label: "Danger",
      href: anchors?.danger,
      tone: "",
      value: readiness.danger ?? "None",
    },
  ]);
</script>

<div class="readiness" class:jump={anchors}>
  {#each tiles as tile (tile.label)}
    <svelte:element
      this={tile.href ? "a" : "div"}
      class="readiness-tile"
      href={tile.href}
      ><span class="cap">{tile.label}</span><strong class={tile.tone}
        >{tile.value}</strong
      ></svelte:element
    >
  {/each}
  {#if anchors?.start}<a class="readiness-tile readiness-start" href={anchors.start}
      ><span class="cap">Start</span><strong>Map</strong></a
    >{/if}
</div>

<style>
  .readiness {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
  }
  .readiness-tile {
    padding: 10px;
    border: 1px solid #33434d;
    border-radius: 3px;
    background: var(--well);
    min-width: 0;
  }
  .cap {
    display: block;
    font-size: var(--font-caption);
    color: var(--muted);
  }
  .readiness-tile strong {
    display: block;
    overflow-wrap: anywhere;
  }
  .tone-ok {
    color: var(--green);
  }
  .tone-warn {
    color: var(--warn);
  }
  .tone-muted {
    color: var(--muted);
  }
  /* Jump strip: tiles joined by 1px seams, as on the Quest board */
  .jump {
    gap: 1px;
    background: #2f3e48;
  }
  .jump .readiness-tile {
    min-height: 44px;
    padding: 12px 18px;
    border: 0;
    border-radius: 0;
    background: #131f28;
    color: var(--text);
    text-decoration: none;
  }
  .jump .readiness-tile:hover strong {
    text-decoration: underline;
    text-underline-offset: 3px;
  }
  .readiness-start {
    display: none;
  }
  @media (max-width: 760px) {
    .jump {
      grid-auto-flow: column;
      grid-template-columns: none;
      grid-auto-columns: minmax(0, 1fr);
    }
    .jump .readiness-tile {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 56px;
      padding: 8px 4px;
      text-align: center;
    }
  }
</style>
