<script lang="ts">
  import { Skull } from "@lucide/svelte";
  import { wikiImage } from "../../wiki";
  import "../../GameArt.css";

  // Wiki art with an icon tile when there is no file or the sprite fails to load.
  let {
    file,
    size,
    icon: Icon = Skull,
    className = "",
  }: {
    file?: string;
    size: number;
    icon?: typeof Skull;
    className?: string;
  } = $props();
  let failed = $state<string>();
</script>

{#if file && failed !== file}<img
    class="game-art {className}"
    src={wikiImage(file)}
    alt=""
    width={size}
    height={size}
    loading="lazy"
    decoding="async"
    onerror={() => (failed = file)}
  />{:else}<span class="art-fallback {className}" aria-hidden="true"
    ><Icon size={Math.max(14, Math.round(size / 2.5))} /></span
  >{/if}

<style>
  .art-fallback {
    display: grid;
    flex: none;
    place-items: center;
    background: var(--panel-raised);
    border: 1px solid var(--frame-line);
    border-radius: 3px;
    color: var(--muted);
  }
</style>
