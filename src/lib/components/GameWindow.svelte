<script lang="ts">
  import type { Snippet } from "svelte";
  import GameArt from "./GameArt.svelte";
  let {
    title,
    icon,
    trailing,
    className = "",
    children,
  }: {
    title: string;
    icon?: string;
    trailing?: string | number;
    className?: string;
    children: Snippet;
  } = $props();
</script>

<section class="tool-window {className}">
  <header class="window-title">
    {#if icon}<GameArt file={icon} />{/if}
    <h2>{title}</h2>
    {#if trailing != null}<span>{trailing}</span>{/if}
  </header>
  {@render children()}
</section>
