<script lang="ts">
  import { Check, ChevronRight } from "@lucide/svelte";
  import type { QuestRecord } from "../../data";
  import GameArt from "./GameArt.svelte";
  let {
    quest,
    completed,
    selected,
    recommended = false,
    next = false,
    variant = "journal",
    position,
    onOpen,
  }: {
    quest: QuestRecord;
    completed: boolean;
    selected?: boolean;
    recommended?: boolean;
    next?: boolean;
    variant?: "queue" | "journal";
    position?: number;
    onOpen: (id: string) => void;
  } = $props();
  let activityType = $derived(
    quest.kind === "miniquest"
      ? "Miniquest"
      : quest.kind === "saga"
        ? "Saga"
        : "Quest",
  );
  let availability = $derived(
    quest.availability === "seasonal"
      ? "Seasonal"
      : quest.availability === "tutorial"
        ? "Tutorial"
        : "",
  );
</script>

{#if variant === "queue"}<button
    type="button"
    class="queue-row"
    class:complete={completed}
    class:recommended
    aria-label={"Open preparation for " + quest.name}
    aria-pressed={selected}
    onclick={() => onOpen(quest.id)}
    ><span class="queue-position"
      >{#if completed}<Check size={17} />{:else}{String(
          position ?? "",
        ).padStart(2, "0")}{/if}</span
    ><GameArt className="queue-quest-icon" file={quest.icon} /><span
      class="queue-quest-name"
      ><strong
        >{quest.name}{#if quest.members}<GameArt
            className="members-mark"
            file="P2P_icon.png"
            size={14}
            alt="Members"
          />{/if}</strong
      ><small
        >{completed
          ? "Recorded complete"
          : recommended
            ? "Next · prepare levels and items"
            : availability ||
              `${quest.members ? "Members" : "Free-to-play"} ${activityType.toLowerCase()}`}</small
      ></span
    ><span class="queue-reward">{quest.rewards[0]}</span><ChevronRight
      size={16}
    /></button
  >{:else}<button
    type="button"
    class="journal-row quest-nav-row"
    class:selected
    aria-label={"Open preparation for " + quest.name}
    aria-pressed={selected}
    onclick={() => onOpen(quest.id)}
    ><span class="quest-state" class:is-complete={completed}
      ><GameArt file={quest.icon} size={20} />{#if completed}<Check
          class="quest-complete-mark"
          size={12}
        />{/if}</span
    ><span
      ><strong
        >{quest.name}{#if quest.members}<GameArt
            className="members-mark"
            file="P2P_icon.png"
            size={14}
            alt="Members"
          />{/if}</strong
      ><small
        >{quest.members ? "Members" : "Free-to-play"} · {availability ||
          activityType} · {quest.difficulty}</small
      ></span
    >{#if next && !completed}<em class="quest-next-mark">Next</em>{/if}<span
      class="reference-action"
      aria-hidden="true"
      ><ChevronRight size={15} /></span
    ></button
  >{/if}

<style>
  :global(.members-mark) {
    display: inline-block;
    margin-left: 6px;
    vertical-align: -2px;
  }
</style>
