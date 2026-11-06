<script lang="ts">
  import GameArt from "./GameArt.svelte";
  let { name, size = 48 }: { name: string; size?: number } = $props();
  let failed = $state<string | null>(null);
  let source = $derived(
    "https://secure.runescape.com/m=avatar-rs/" +
      encodeURIComponent(name) +
      "/chat.png",
  );
</script>

<span
  class="player-portrait"
  style:width={size + "px"}
  style:height={size + "px"}
>
  {#if failed === source}
    <GameArt file="Group_Ironman_helm.png" size={size - 8} />
  {:else}
    <img
      src={source}
      alt=""
      width={size - 8}
      height={size - 8}
      loading="lazy"
      decoding="async"
      onerror={() => (failed = source)}
    />
  {/if}
</span>

<style>
  .player-portrait {
    display: inline-flex;
    flex: 0 0 auto;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--line);
    background: radial-gradient(ellipse at top, var(--panel-raised), var(--bg));
    box-shadow: inset 0 1px 0 #ffffff12;
    border-radius: 4px;
    overflow: hidden;
  }
  img {
    display: block;
    object-fit: contain;
  }
</style>
