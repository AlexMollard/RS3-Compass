<script lang="ts">
  import { tokenizeGameText } from "../gameText";
  import { wikiHref, wikiImage } from "../../wiki";
  let { text }: { text: string } = $props();
  let segments = $derived(tokenizeGameText(text));
</script>

<span class="game-text"
  >{#each segments as segment}{#if segment.reference}<a
        class="wiki-ref {segment.reference.kind === 'item' ? 'item-ref' : ''}"
        data-reference-kind={segment.reference.kind}
        href={wikiHref(segment.reference.wiki)}
        target="_blank"
        rel="noopener noreferrer"
        title={segment.reference.name + " on RuneScape Wiki"}
        >{#if segment.reference.image}<img
            src={wikiImage(segment.reference.image)}
            alt=""
            loading="lazy"
            decoding="async"
          />{/if}<span>{segment.text}</span></a
      >{:else}{segment.text}{/if}{/each}</span
>
