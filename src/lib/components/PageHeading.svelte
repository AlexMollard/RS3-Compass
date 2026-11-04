<script lang="ts">
  import type { Snippet } from "svelte";
  let {
    title,
    subtitle,
    trailing,
  }: { title: string; subtitle?: string; trailing?: Snippet } = $props();
</script>

<div class="utility-heading">
  <div>
    <h1>{title}</h1>
    {#if subtitle != null}<p class="page-subtitle">{subtitle}</p>{/if}
  </div>
  {@render trailing?.()}
</div>
