<script lang="ts">
  import { ExternalLink } from "@lucide/svelte";
  import type { QuestRecord } from "../../data";
  import { LOCATIONS } from "../../locations";
  import { wikiHref } from "../../wiki";
  import GameArt from "./GameArt.svelte";
  import WorldMap from "./WorldMap.svelte";
  let { quest, showMap = true }: { quest: QuestRecord; showMap?: boolean } =
    $props();
  let start = $derived(quest.start);
  let location = $derived(LOCATIONS[start.location]);
</script>

<article class="quest-start" aria-label={"Start " + quest.name}>
  <a
    class="quest-start-portrait"
    href={wikiHref(start.npcWiki)}
    target="_blank"
    rel="noreferrer"><GameArt file={start.image} alt={start.npc} size={88} /></a
  >
  <div class="quest-start-content">
    <span class="quest-start-label"
      >{quest.members ? "Speak to · Members quest" : "Speak to"}</span
    >
    <a
      class="quest-start-npc"
      href={wikiHref(start.npcWiki)}
      target="_blank"
      rel="noreferrer">{start.npc} <ExternalLink size={14} /></a
    >
    <p>
      <a href={wikiHref(location.wiki)} target="_blank" rel="noreferrer"
        >{location.name}</a
      >
      · {start.meetingPoint}
    </p>
    {#if start.access}<p class="quest-start-access">{start.access}</p>{/if}
  </div>
  {#if showMap}<WorldMap point={start.map} npc={start.npc} />{/if}
</article>
