<script lang="ts">
  import type { TrainingOption, TrainingSite } from "../../data";
  import { wikiHref } from "../../wiki";
  import GameArt from "./GameArt.svelte";
  import GameText from "./GameText.svelte";
  import WorldMap from "./WorldMap.svelte";
  let { method }: { method: TrainingOption } = $props();
  let selectedKey = $state("");
  const key = (site: TrainingSite) =>
    `${site.label}:${site.map.mapId ?? 28}:${site.map.plane}:${site.map.x}:${site.map.y}`;
  const site = $derived(
    method.sites.find((entry) => key(entry) === selectedKey) ?? method.sites[0],
  );
  const art = $derived(site?.image ?? method.image);
</script>

{#if site}
  <section class="training-map" aria-label="Training location map">
    <h3>Where to train</h3>
    {#if method.sites.length > 1}
      <label>
        Training location
        <select
          aria-label="Training location"
          value={key(site)}
          onchange={(event) => (selectedKey = event.currentTarget.value)}
        >
          {#each method.sites as entry (key(entry))}<option value={key(entry)}
              >{entry.label}</option
            >{/each}
        </select>
      </label>
    {/if}
    <a
      class="site-reference"
      href={wikiHref(site.wiki)}
      target="_blank"
      rel="noopener noreferrer"
    >
      <GameArt file={art} size={72} />
      <strong>{site.label} ↗</strong>
    </a>
    {#if method.locationNote}<p><GameText text={method.locationNote} /></p>{/if}
    {#if site.access}<p><GameText text={site.access} /></p>{/if}
    <WorldMap
      point={site.map}
      label={site.label}
      markerIcon={art}
      markerWiki={site.wiki}
    />
  </section>
{:else if method.locationNote}
  <p class="portable-location"><GameText text={method.locationNote} /></p>
{/if}

<style>
  .training-map {
    min-width: 0;
    margin-top: 1.25rem;
  }
  h3 {
    margin-bottom: 0.65rem;
    font-size: 1rem;
  }
  label {
    display: grid;
    gap: 0.35rem;
    margin-bottom: 0.65rem;
  }
  select {
    width: 100%;
    min-width: 0;
    min-height: 44px;
  }
  .site-reference {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    text-decoration: underline;
    text-underline-offset: 3px;
    margin-bottom: 0.75rem;
  }
  .site-reference :global(.game-art) {
    width: 72px;
    height: 96px;
  }
  p {
    color: var(--muted);
    font-size: 0.875rem;
    margin-bottom: 0.65rem;
    line-height: 1.6;
  }
  .portable-location {
    margin-block: 1rem;
  }
</style>
