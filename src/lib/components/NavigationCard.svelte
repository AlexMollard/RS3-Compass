<script lang="ts">
  import { ChevronRight, ExternalLink } from "@lucide/svelte";
  import { wikiHref } from "../../wiki";
  import GameArt from "./GameArt.svelte";
  import GameText from "./GameText.svelte";
  let {
    title,
    label,
    image,
    value,
    detail,
    selected,
    wiki,
    onOpen,
  }: {
    title: string;
    label: string;
    image?: string;
    value?: string | number;
    detail?: string;
    selected?: boolean;
    wiki?: string;
    onOpen: () => void;
  } = $props();
</script>

<div class="navigation-card" class:selected>
  <button
    type="button"
    class="navigation-main"
    aria-label={label}
    aria-pressed={selected}
    onclick={onOpen}
    >{#if image}<span class="navigation-icon"><GameArt file={image} /></span
      >{/if}<strong>{title}</strong>{#if value != null}<span
        class="navigation-value">{value}</span
      >{/if}<ChevronRight size={16} /></button
  >{#if detail != null}<div class="navigation-detail">
      <GameText text={detail} />
    </div>{/if}{#if wiki}<a
      class="navigation-wiki"
      href={wikiHref(wiki)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={title + " on RuneScape Wiki"}
      title={title + " on RuneScape Wiki (opens a new tab)"}
      ><ExternalLink size={16} /></a
    >{/if}
</div>
