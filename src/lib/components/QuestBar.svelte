<script lang="ts">
  import { goto } from "$app/navigation";
  import { ChevronLeft, ChevronRight } from "@lucide/svelte";
  import { QUESTS, type Profile } from "../../data";
  import { questPath } from "../navigation";
  import GameArt from "./GameArt.svelte";
  import QuestFinder from "./QuestFinder.svelte";

  let { profile, selectedId }: { profile: Profile; selectedId: string } = $props();
  let quest = $derived(QUESTS.find((q) => q.id === selectedId) ?? QUESTS[1]);
  // Previous and next follow the planning route; a members quest opened in F2P
  // planning steps through the full catalogue instead.
  let route = $derived(QUESTS.filter((q) => profile.mode === "members" || !q.members));
  let list = $derived(route.some((q) => q.id === quest.id) ? route : QUESTS);
  let at = $derived(list.findIndex((q) => q.id === quest.id));
  let previous = $derived(at > 0 ? list[at - 1] : undefined);
  let next = $derived(list[at + 1]);
</script>

<div class="quest-bar">
  <QuestFinder
    quests={QUESTS}
    {profile}
    current={quest}
    onOpen={(id) => void goto(questPath(id))}
  />
  {#if previous || next}<nav class="quest-step" aria-label="Previous and next quest">
      {#if previous}<a
          href={questPath(previous.id)}
          class="step-link"
          aria-label={"Previous quest: " + previous.name}
          title={previous.name}
          ><ChevronLeft size={16} aria-hidden="true" /><GameArt
            file={previous.icon}
            size={22}
          /><span class="step-text"><small>Previous</small><span>{previous.name}</span></span></a
        >{/if}{#if next}<a
          href={questPath(next.id)}
          class="step-link step-next"
          aria-label={"Next quest: " + next.name}
          title={next.name}
          ><span class="step-text"><small>Next</small><span>{next.name}</span></span><GameArt
            file={next.icon}
            size={22}
          /><ChevronRight size={16} aria-hidden="true" /></a
        >{/if}
    </nav>{/if}
</div>

<style>
  .quest-bar {
    display: flex;
    flex: 1;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px;
    min-width: 0;
  }
  .quest-step {
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
  .step-link :global(svg) {
    flex: none;
    color: var(--muted);
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
    .quest-step {
      flex: 1 1 100%;
      margin-left: 0;
    }
  }
</style>
