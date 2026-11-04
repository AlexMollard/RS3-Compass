<script lang="ts">
  import type { Snippet } from "svelte";
  let { title, aside }: { title: string; aside?: Snippet } = $props();
</script>

<div class="section-heading">
  <h3>{title}</h3>
  {@render aside?.()}
</div>
