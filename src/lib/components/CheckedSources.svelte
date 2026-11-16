<script lang="ts">
  import { wikiTitle } from "../../wiki";
  // "Checked <date> · source 1 · source 2": when advice was last checked and the Wiki pages it rests on.
  let { checked, sources }: { checked: string; sources: string[] } = $props();
</script>

<span class="checked-sources"
  >Checked {checked}{#each sources as source, i (source)}{" · "}<a
      href={source}
      target="_blank"
      rel="noopener noreferrer"
      >source {i + 1}<span class="sr-only"
        >: {wikiTitle(source)} on RuneScape Wiki (opens a new tab)</span
      ></a
    >{/each}</span
>

<style>
  a {
    color: var(--gold-bright);
    text-decoration: underline;
    text-underline-offset: 3px;
  }
</style>
