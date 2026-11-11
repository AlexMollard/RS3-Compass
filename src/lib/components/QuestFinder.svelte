<script lang="ts">
  import { Check, Info, Search, X } from "@lucide/svelte";
  import type { Profile, QuestRecord } from "../../data";
  import ChoiceStrip from "./ChoiceStrip.svelte";
  import GameArt from "./GameArt.svelte";
  import IconButton from "./IconButton.svelte";

  let {
    quests,
    profile,
    current,
    onOpen,
  }: {
    quests: readonly QuestRecord[];
    profile: Profile;
    current: QuestRecord;
    onOpen: (id: string) => void;
  } = $props();

  let dialog: HTMLDialogElement;
  let input = $state<HTMLInputElement>();
  let query = $state("");
  let type = $state<"all" | "quests" | "mini">("all");
  let progress = $state<"todo" | "done" | "any">("todo");
  let active = $state(0);

  const isMini = (q: QuestRecord) => q.kind === "miniquest" || q.kind === "saga";
  const done = (q: QuestRecord) => profile.completedQuests.includes(q.id);
  // The route the planner follows; members quests join it only in Members planning.
  let route = $derived(quests.filter((q) => profile.mode === "members" || !q.members));
  let position = $derived(route.findIndex((q) => q.id === current.id) + 1);
  let needle = $derived(query.trim().toLowerCase());
  let matches = $derived(
    // Searching also finds members quests in F2P planning; they open with a membership notice.
    (needle ? quests : route).filter(
      (q) =>
        (type === "all" || (type === "mini") === isMini(q)) &&
        (progress === "any" || (progress === "done") === done(q)) &&
        q.name.toLowerCase().includes(needle),
    ),
  );
  let upNext = $derived.by(() => {
    if (needle) return [];
    const from = Math.max(0, position - 1);
    return [...route.slice(from), ...route.slice(0, from)]
      .filter((q) => !done(q))
      .slice(0, 3);
  });
  let rows = $derived([...upNext, ...matches]);
  let hiddenMembers = $derived(
    !!needle && profile.mode === "f2p" && matches.some((q) => q.members),
  );

  export function open() {
    query = "";
    active = 0;
    if (!dialog.open) dialog.showModal();
    input?.focus();
  }
  function choose(id: string) {
    dialog.close();
    onOpen(id);
  }
  function onKeydown(event: KeyboardEvent) {
    if (event.isComposing) return;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const step = event.key === "ArrowDown" ? 1 : -1;
      active = (active + step + rows.length) % Math.max(rows.length, 1);
      dialog
        .querySelector(`#quest-finder-${active}`)
        ?.scrollIntoView({ block: "nearest" });
    } else if (event.key === "Enter" && rows[active]) {
      event.preventDefault();
      choose(rows[active].id);
    }
  }
  $effect(() => {
    void needle, type, progress;
    active = 0;
  });
</script>

{#snippet highlighted(text: string)}
  {@const at = needle ? text.toLowerCase().indexOf(needle) : -1}
  {#if at < 0}{text}{:else}{text.slice(0, at)}<mark
      >{text.slice(at, at + needle.length)}</mark
    >{text.slice(at + needle.length)}{/if}
{/snippet}

{#snippet row(q: QuestRecord, index: number)}
  <li role="presentation">
    <button
      id={"quest-finder-" + index}
      type="button"
      role="option"
      class="finder-row"
      aria-selected={index === active}
      class:active={index === active}
      onclick={() => choose(q.id)}
      onmousemove={() => (active = index)}
      ><span class="finder-icon"
        ><GameArt file={q.icon} size={28} />{#if q.members}<span
            class="finder-members"
            title="Members"
            ><GameArt file="P2P_icon.png" size={13} alt="Members" /></span
          >{/if}</span
      ><span class="finder-text"
        ><strong>{@render highlighted(q.name)}</strong><small
          ><span class="finder-dot difficulty-{q.difficulty.toLowerCase()}"
          ></span>{q.difficulty} · {q.length}{isMini(q)
            ? " · Miniquest"
            : ""}{q.members ? " · Members" : ""}{q.id === current.id
            ? " · open now"
            : ""}</small
        ></span
      >{#if done(q)}<Check class="finder-done" size={16} aria-label="Completed" />{/if}</button
    >
  </li>
{/snippet}

<button
  type="button"
  class="finder-trigger"
  aria-haspopup="dialog"
  onclick={open}
  ><Search size={16} /><span class="finder-trigger-label"
    >Quest log · find a quest</span
  >{#if position}<span class="finder-trigger-count"
      >{position} of {route.length}</span
    >{/if}</button
>

<dialog class="app-dialog quest-finder" bind:this={dialog} aria-label="Find a quest">
  <div class="finder-bar">
    <Search size={18} aria-hidden="true" />
    <input
      bind:this={input}
      bind:value={query}
      onkeydown={onKeydown}
      aria-label="Search quests and miniquests"
      aria-controls="quest-finder-list"
      aria-activedescendant={rows.length ? "quest-finder-" + active : undefined}
      placeholder={`Search ${route.length} quests and miniquests`}
      autocomplete="off"
      spellcheck="false"
    />
    <kbd>Esc</kbd><IconButton
      framed={false}
      label="Close quest search"
      onclick={() => dialog.close()}><X size={18} /></IconButton
    >
  </div>
  <div class="finder-filters">
    <ChoiceStrip
      variant="joined"
      label="Type"
      name="finder-type"
      value={type}
      choices={[
        { value: "all", label: "All" },
        { value: "quests", label: "Quests" },
        { value: "mini", label: "Miniquests" },
      ]}
      onChange={(v) => (type = v as typeof type)}
    />
    <ChoiceStrip
      variant="joined"
      label="Progress"
      name="finder-progress"
      value={progress}
      choices={[
        { value: "todo", label: "To do" },
        { value: "done", label: "Completed" },
        { value: "any", label: "Any" },
      ]}
      onChange={(v) => (progress = v as typeof progress)}
    />
  </div>
  <ul class="finder-list" id="quest-finder-list" role="listbox" aria-label="Quests">
    {#if upNext.length}<li class="finder-group" role="presentation">
        Continue the route
      </li>{/if}
    {#each upNext as q, i (q.id)}{@render row(q, i)}{/each}
    <li class="finder-group" role="presentation">
      {needle
        ? `${matches.length} ${matches.length === 1 ? "match" : "matches"} · route order`
        : "All quests · route order"}
    </li>
    {#each matches as q, i (q.id)}{@render row(q, upNext.length + i)}{/each}
    {#if !matches.length}<li class="finder-empty" role="presentation">
        No quests match.{#if progress !== "any"}
          <button type="button" class="text-link" onclick={() => (progress = "any")}
            >Show all progress</button
          >{/if}
      </li>{/if}
  </ul>
  {#if hiddenMembers}<p class="finder-note">
      <Info size={16} aria-hidden="true" />You are planning in F2P. Members
      quests show in search with the shield; switch to Members planning to
      play them.
    </p>{/if}
  <div class="finder-foot" aria-hidden="true">
    <span><kbd>↑</kbd> <kbd>↓</kbd> move</span><span><kbd>Enter</kbd> open</span
    ><span><kbd>Esc</kbd> close</span>
  </div>
</dialog>

<style>
  .finder-trigger {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1 1 320px;
    max-width: 520px;
    min-width: 0;
    min-height: var(--control-size);
    padding: 0 12px;
    background: var(--bg);
    border: 1px solid var(--edge);
    border-radius: 4px;
    color: var(--text);
    font: 600 var(--font-ui) / 1.3 "DM Sans", sans-serif;
    cursor: pointer;
  }
  .finder-trigger:hover {
    border-color: var(--gold);
  }
  .finder-trigger-label {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    text-align: left;
  }
  .finder-trigger-count {
    flex: none;
    font-weight: 400;
    color: var(--muted);
  }
  :global(.app-dialog.quest-finder) {
    width: min(640px, calc(100vw - 32px));
    max-height: calc(100dvh - 92px);
    margin: 72px auto auto;
    padding: 0;
    background: var(--panel-raised);
    border: 1px solid var(--edge);
    border-radius: 2px;
    color: var(--text);
  }
  :global(.quest-finder[open]) {
    display: flex;
    flex-direction: column;
  }
  .finder-bar {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 56px;
    padding: 0 8px 0 16px;
    border-bottom: 1px solid #34444f;
    color: var(--muted);
  }
  .finder-bar:focus-within {
    border-bottom-color: var(--gold);
  }
  .finder-bar input {
    flex: 1;
    min-width: 0;
    background: none;
    border: 0;
    outline: none;
    color: var(--text);
    font: 16px/22px "DM Sans", sans-serif;
  }
  kbd {
    font: 600 11px "DM Sans", sans-serif;
    color: var(--muted);
    border: 1px solid #425260;
    border-radius: 3px;
    padding: 2px 6px;
  }
  .finder-filters {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    padding: 12px 16px;
    border-bottom: 1px solid #34444f;
  }
  .finder-filters :global(legend) {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
  }
  .finder-list {
    list-style: none;
    margin: 0;
    padding: 0 0 8px;
    overflow-y: auto;
    overscroll-behavior: contain;
  }
  .finder-group {
    padding: 12px 16px 4px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 1.4px;
    text-transform: uppercase;
    color: var(--muted);
  }
  .finder-row {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    min-height: 52px;
    padding: 6px 16px;
    background: none;
    border: 0;
    color: var(--text);
    text-align: left;
    font: inherit;
    cursor: pointer;
  }
  .finder-row.active {
    background: #273e50;
    box-shadow: inset 2px 0 var(--gold);
  }
  .finder-icon {
    position: relative;
    display: inline-flex;
    flex: none;
  }
  .finder-members {
    position: absolute;
    top: -6px;
    right: -7px;
    display: grid;
    place-items: center;
    width: 16px;
    height: 16px;
    background: #12191e;
    border-radius: 50%;
  }
  .finder-text {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }
  .finder-text small {
    font-size: var(--font-caption);
    color: var(--muted);
  }
  .finder-text mark {
    background: none;
    color: var(--gold-bright);
    text-decoration: underline;
  }
  .finder-dot {
    display: inline-block;
    width: 7px;
    height: 7px;
    margin-right: 5px;
    border-radius: 50%;
    background: #b59fd6;
  }
  .difficulty-novice {
    background: #8fc79a;
  }
  .difficulty-intermediate {
    background: #86b4d6;
  }
  .difficulty-experienced {
    background: #d9c27a;
  }
  .difficulty-master {
    background: #e09a5f;
  }
  .difficulty-grandmaster {
    background: #e07a74;
  }
  .finder-row :global(.finder-done) {
    flex: none;
    color: var(--green);
  }
  .finder-empty {
    padding: 12px 16px;
    color: var(--muted);
  }
  .finder-note {
    display: flex;
    gap: 10px;
    margin: 0 16px 8px;
    padding: 10px 12px;
    background: var(--panel);
    border: 1px solid #34444f;
    border-radius: 4px;
    color: var(--muted);
  }
  .finder-note :global(svg) {
    flex: none;
    color: var(--blue);
  }
  .finder-foot {
    display: flex;
    gap: 14px;
    padding: 10px 16px;
    border-top: 1px solid #34444f;
    font-size: var(--font-caption);
    color: var(--muted);
  }
  @media (max-width: 760px) {
    .finder-foot,
    .finder-bar kbd {
      display: none;
    }
    :global(.app-dialog.quest-finder) {
      margin-top: 16px;
      max-height: calc(100dvh - 32px);
    }
  }
</style>
