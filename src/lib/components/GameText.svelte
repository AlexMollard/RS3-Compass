<script lang="ts">
  import { tokenizeGameText, type GameTextReference } from "../gameText";
  import { wikiHref, wikiImage } from "../../wiki";
  let {
    text,
    references,
    catalogue = true,
  }: {
    text: string;
    references?: readonly GameTextReference[];
    catalogue?: boolean;
  } = $props();
  let segments = $derived(tokenizeGameText(text, references, catalogue));
</script>

<span class="game-text"
  >{#each segments as segment}{#if segment.reference}<a
        class="wiki-ref {segment.reference.kind === 'item' ? 'item-ref' : ''}"
        data-reference-kind={segment.reference.kind}
        href={segment.reference.search
          ? "https://runescape.wiki/w/Special:Search?search=" +
            encodeURIComponent(segment.reference.wiki)
          : wikiHref(segment.reference.wiki)}
        target="_blank"
        rel="noopener noreferrer"
        title={segment.reference.search
          ? "Exact Wiki artwork unavailable; search for " +
            segment.reference.name
          : segment.reference.name + " on RuneScape Wiki"}
        >{#if segment.reference.imageUrl || segment.reference.image}<img
            src={segment.reference.imageUrl ??
              wikiImage(segment.reference.image!)}
            alt=""
            loading="lazy"
            decoding="async"
          />{/if}<span>{segment.text}</span></a
      >{:else}{segment.text}{/if}{/each}</span
>
