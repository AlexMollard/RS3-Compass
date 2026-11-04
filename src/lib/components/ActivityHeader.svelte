<script lang="ts">
  import type { Snippet } from "svelte";
  import { wikiHref } from "../../wiki";
  import GameArt from "./GameArt.svelte";
  import GameText from "./GameText.svelte";
  let {
    title,
    wiki,
    image,
    eyebrow,
    artwork,
    onOpen,
    meta,
  }: {
    title: string;
    wiki: string;
    image: string;
    eyebrow: string;
    artwork?: string;
    onOpen?: () => void;
    meta?: Snippet;
  } = $props();
</script>

<header class="activity-header">
  <a
    class="activity-header-icon"
    href={wikiHref(wiki)}
    target="_blank"
    rel="noopener noreferrer"
    aria-label={title + " on RuneScape Wiki"}><GameArt file={image} /></a
  >
  <div class="activity-header-copy">
    <span class="eyebrow">{eyebrow}</span>
    <h2>
      {#if onOpen}<button
          type="button"
          class="activity-title-button"
          onclick={onOpen}>{title}</button
        >{:else}<GameText text={title} />{/if}
    </h2>
    {@render meta?.()}
  </div>
  {#if artwork}<a
      class="activity-artwork-link"
      href={wikiHref(wiki)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={title + " artwork on RuneScape Wiki"}
      ><GameArt
        file={artwork}
        size={112}
        thumbnail
        className="activity-artwork"
      /></a
    >{/if}
</header>
