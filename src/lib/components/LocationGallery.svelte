<script lang="ts">
  import { ExternalLink } from "@lucide/svelte";
  import type { Profile } from "../../data";
  import { LOCATIONS } from "../../locations";
  import { wikiHref } from "../../wiki";
  import GameArt from "./GameArt.svelte";
  import GameText from "./GameText.svelte";
  let {
    locations,
    profile,
  }: { locations: readonly string[]; profile: Profile } = $props();
</script>

<div class="location-gallery">
  {#each locations as id (id)}
    {@const location = LOCATIONS[id]}
    <article class="location-card">
      <a
        class="location-photo"
        href={wikiHref(location.wiki)}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={location.name + " on RuneScape Wiki"}
        ><GameArt
          file={location.image}
          alt={location.name}
          size={300}
          thumbnail
        /></a
      >
      <div class="location-caption">
        <a
          href={wikiHref(location.wiki)}
          target="_blank"
          rel="noopener noreferrer"
          ><span>{location.name}</span><ExternalLink
            size={16}
            aria-hidden="true"
          /></a
        >
        <p><GameText text={location.summary} /></p>
        {#if location.members}<p class="location-access">
            {profile.mode === "f2p"
              ? "Members access required."
              : "Members location."}
          </p>{/if}
        {#if location.access}<p class="location-access">
            <GameText text={location.access} />
          </p>{/if}
      </div>
    </article>
  {/each}
</div>
