<script lang="ts">
  import type { Profile, TrainingOption, TrainingSite } from "../../data";
  import { wikiHref } from "../../wiki";
  import GameArt from "./GameArt.svelte";
  import GameText from "./GameText.svelte";
  import LocationGallery from "./LocationGallery.svelte";
  import WorldMap from "./WorldMap.svelte";
  let { method, profile }: { method: TrainingOption; profile: Profile } =
    $props();
  let selectedKey = $state("");
  const key = (site: TrainingSite) =>
    `${site.label}:${site.map.mapId ?? 28}:${site.map.plane}:${site.map.x}:${site.map.y}`;
  const site = $derived(
    method.sites.find((entry) => key(entry) === selectedKey) ?? method.sites[0],
  );
  const art = $derived(site?.image ?? method.image);
</script>

<section class="training-map" aria-label="Training location">
  <h3>Where to train</h3>
  {#if site}
    {#if method.sites.length > 1}
      <label
        >Training location
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
      >{#if method.sites.length > 1}<GameArt
          file={art}
          size={32}
        />{/if}{site.label} ↗</a
    >
    {#if site.access}<p><GameText text={site.access} /></p>{/if}
    {#if method.locationNote}<p><GameText text={method.locationNote} /></p>{/if}
    <WorldMap
      point={site.map}
      label={site.label}
      markerIcon={art}
      markerWiki={site.wiki}
    />
  {:else if method.locationNote}
    <p><GameText text={method.locationNote} /></p>
  {/if}
  {#if method.locations.length}
    <details class="location-details">
      <summary>Location details and artwork</summary><LocationGallery
        locations={method.locations}
        {profile}
      />
    </details>
  {/if}
</section>

<style>
  .training-map {
    min-width: 0;
  }
  h3 {
    margin-bottom: 0.7rem;
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
    gap: 0.5rem;
    text-decoration: underline;
    text-underline-offset: 3px;
    margin-bottom: 0.65rem;
    line-height: 1.5;
  }
  .site-reference :global(.game-art) {
    width: 32px;
    height: 36px;
  }
  p {
    color: var(--muted);
    font-size: 0.875rem;
    margin-bottom: 0.65rem;
    line-height: 1.6;
  }
  .location-details {
    margin-top: 0.5rem;
  }
  summary {
    min-height: 44px;
    padding-block: 0.65rem;
    font-size: 0.875rem;
  }
</style>
