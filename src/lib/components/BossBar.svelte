<script lang="ts">
  import { goto } from "$app/navigation";
  import { ChevronLeft, ChevronRight, Swords } from "@lucide/svelte";
  import { BOSSES, bossById } from "../../bosses";
  import type { Profile } from "../../data";
  import { ladder, visibleBosses } from "../bossLadder";
  import { bossPath } from "../navigation";
  import BossFinder from "./BossFinder.svelte";
  import FallbackArt from "./FallbackArt.svelte";

  let { profile, selectedId }: { profile: Profile; selectedId: string } = $props();
  let boss = $derived(bossById(selectedId));
  // Previous and next follow the ladder the player sees (F2P bosses only in F2P mode); a
  // members boss opened in F2P mode steps through the full ladder instead.
  let visible = $derived(visibleBosses(profile, BOSSES));
  let list = $derived(visible.some((b) => b.id === selectedId) ? visible : ladder(BOSSES));
  let at = $derived(list.findIndex((b) => b.id === selectedId));
  let previous = $derived(at > 0 ? list[at - 1] : undefined);
  let next = $derived(at >= 0 ? list[at + 1] : undefined);
</script>

<div class="boss-bar">
  <a class="ladder-link" href="/bossing"><Swords size={16} aria-hidden="true" />Boss ladder</a>
  <BossFinder bosses={BOSSES} {profile} current={boss} onOpen={(id) => void goto(bossPath(id))} />
  {#if previous || next}<nav class="boss-step" aria-label="Previous and next boss">
      {#if previous}<a
          href={bossPath(previous.id)}
          class="step-link"
          aria-label={"Previous boss: " + previous.name}
          title={previous.name}
          ><ChevronLeft size={16} aria-hidden="true" /><FallbackArt
            file={previous.image}
            size={22}
            className="step-art"
          /><span class="step-text"><small>Previous</small><span>{previous.name}</span></span></a
        >{/if}{#if next}<a
          href={bossPath(next.id)}
          class="step-link step-next"
          aria-label={"Next boss: " + next.name}
          title={next.name}
          ><span class="step-text"><small>Next</small><span>{next.name}</span></span><FallbackArt
            file={next.image}
            size={22}
            className="step-art"
          /><ChevronRight size={16} aria-hidden="true" /></a
        >{/if}
    </nav>{/if}
</div>

<style>
  .boss-bar {
    display: flex;
    flex: 1;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px;
    min-width: 0;
  }
  .ladder-link {
    display: inline-flex;
    flex: none;
    align-items: center;
    gap: 8px;
    min-height: var(--control-size);
    padding: 0 14px;
    border: 1px solid var(--gold);
    border-radius: 4px;
    color: var(--gold-bright);
    font-weight: 600;
    text-decoration: none;
  }
  .ladder-link:hover {
    background: var(--panel);
    color: var(--heading);
  }
  .boss-step {
    display: flex;
    flex: 0 1 360px;
    min-width: 0;
    margin-left: auto;
    border: 1px solid var(--line);
    border-radius: 4px;
    overflow: hidden;
  }
  .step-link {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1 1 0;
    min-width: 0;
    min-height: var(--control-size);
    padding: 0 12px 0 8px;
    color: var(--text);
    text-decoration: none;
  }
  .step-link:hover {
    background: var(--panel);
  }
  .step-link > :global(svg) {
    flex: none;
    color: var(--muted);
  }
  .step-link :global(.step-art) {
    width: 22px;
    height: 22px;
  }
  .step-next {
    justify-content: flex-end;
    padding: 0 8px 0 12px;
    text-align: right;
  }
  .step-link + .step-link {
    border-left: 1px solid var(--line);
  }
  .step-text {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .step-next .step-text {
    align-items: flex-end;
  }
  .step-text small {
    font-size: 9px;
    line-height: 11px;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: var(--muted);
  }
  .step-text span {
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    line-height: 16px;
    font-weight: 600;
  }
  @media (max-width: 760px) {
    .boss-step {
      flex: 1 1 100%;
      margin-left: 0;
    }
  }
</style>
