<script lang="ts">
  import type { Snippet } from "svelte";
  import GameArt from "./GameArt.svelte";
  let {
    title,
    icon,
    trailing,
    className = "",
    variant = "window",
    children,
  }: {
    title: string;
    icon?: string;
    trailing?: string | number;
    className?: string;
    variant?: "window" | "plain";
    children: Snippet;
  } = $props();
</script>

<section class="tool-window {className}" aria-label={variant === "plain" ? title : undefined}>
  {#if variant === "window"}
    <header class="window-title">
      {#if icon}<GameArt file={icon} />{/if}
      <h2>{title}</h2>
      {#if trailing != null}<span>{trailing}</span>{/if}
    </header>
  {/if}
  {@render children()}
</section>
