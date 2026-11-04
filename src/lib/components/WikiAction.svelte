<script lang="ts">
  import { ExternalLink } from "@lucide/svelte";
  import { wikiHref } from "../../wiki";
  let {
    page,
    label,
    primary = false,
  }: { page: string; label: string; primary?: boolean } = $props();
</script>

<a
  href={wikiHref(page)}
  target="_blank"
  rel="noopener noreferrer"
  class={primary ? "btn btn-primary" : "text-link"}
  >{label}<ExternalLink size={primary ? 15 : 13} /></a
>
