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
        : quest.availability === "removed"
          ? "Removed"
          : "",
  );
  // One colour per RuneScape difficulty tier, low to high.
  let tier = $derived(
    (
      {
        Novice: "novice",
        Intermediate: "intermediate",
        Experienced: "experienced",
        Master: "master",
        Grandmaster: "grandmaster",
      } as Record<string, string>
    )[quest.difficulty] ?? "other",
  );
  let detail = $derived(
    [
      quest.length !== "None" && quest.length !== "Unknown" ? quest.length : "",
      availability || (quest.kind ? activityType : ""),
    ]
      .filter(Boolean)
      .join(" · "),
  );
</script>

{#snippet icon(size: number)}<span
    class="quest-state"
    class:is-complete={completed}
    class:is-members={quest.members}
    ><GameArt file={quest.icon} {size} />{#if quest.members}<span
        class="members-badge"
        title="Members"
        ><GameArt file="P2P_icon.png" size={14} alt="Members" /></span
      >{/if}{#if completed}<Check class="quest-complete-mark" size={12} />{/if}</span
  >{/snippet}

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
    >{@render icon(24)}<span class="queue-quest-name"
      ><strong>{quest.name}</strong><small
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
    class:done={completed}
    aria-label={`Open preparation for ${quest.name}${quest.members ? ", members" : ""}${completed ? ", completed" : ""}`}
    aria-pressed={selected}
    onclick={() => onOpen(quest.id)}
    >{@render icon(22)}<span class="quest-nav-text"
      ><strong>{quest.name}</strong><span class="quest-meta"
        ><span class="difficulty difficulty-{tier}">{quest.difficulty}</span
        >{#if detail}<span class="quest-detail">{detail}</span>{/if}</span
      ></span
    >{#if next && !completed}<em class="quest-next-mark">Next</em>{/if}<span
      class="reference-action"
      aria-hidden="true"
      ><ChevronRight size={15} /></span
    ></button
  >{/if}

<style>
  .quest-state {
    position: relative;
  }
  .quest-state.is-members {
    border-color: #7a6233;
  }
  .members-badge {
    position: absolute;
    top: -6px;
    right: -7px;
    display: grid;
    place-items: center;
    width: 16px;
    height: 16px;
    background: #12191e;
    border-radius: 50%;
    box-shadow: 0 0 0 1px #12191e;
  }
  .quest-nav-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
    flex: 1 1 auto;
  }
  .quest-nav-text strong {
    overflow-wrap: anywhere;
  }
  .quest-meta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 2px 8px;
    font-size: 0.6875rem;
    line-height: 1.3;
    color: var(--muted);
  }
  .difficulty {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-weight: 600;
    letter-spacing: 0.2px;
  }
  .difficulty::before {
    content: "";
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: currentColor;
  }
  .difficulty-novice {
    color: #8fc79a;
  }
  .difficulty-intermediate {
    color: #86b4d6;
  }
  .difficulty-experienced {
    color: #d9c27a;
  }
  .difficulty-master {
    color: #e09a5f;
  }
  .difficulty-grandmaster {
    color: #e07a74;
  }
  .difficulty-other {
    color: #b59fd6;
  }
  .journal-row.done strong {
    color: var(--muted);
  }
</style>

