<script lang="ts">
  // Copied from QuestFinder: the quest finder's filters are built on quest routes,
  // difficulty and completion, so it isn't a prop rename away from bosses.
  import { Info, Search, X } from "@lucide/svelte";
  import type { BossRecord } from "../../bossTypes";
  import type { Profile } from "../../data";
  import { ladder, visibleBosses } from "../bossLadder";
  import ChoiceStrip from "./ChoiceStrip.svelte";
  import FallbackArt from "./FallbackArt.svelte";
  import IconButton from "./IconButton.svelte";

  let {
    bosses,
    profile,
    current,
    onOpen,
  }: {
    bosses: readonly BossRecord[];
    profile: Profile;
    current?: BossRecord;
    onOpen: (id: string) => void;
  } = $props();
  const uid = $props.id();

  let dialog: HTMLDialogElement;
  let input = $state<HTMLInputElement>();
  let query = $state("");
  let tier = $state("all");
  let active = $state(0);

  // The ladder the player sees (F2P bosses only in F2P mode); search finds every boss.
  let route = $derived(visibleBosses(profile, bosses));
  let everyBoss = $derived(ladder(bosses));
  let position = $derived(route.findIndex((b) => b.id === current?.id) + 1);
  let needle = $derived(query.trim().toLowerCase());
  let rows = $derived(
    (needle ? everyBoss : route).filter(
      (b) => (tier === "all" || b.tier === tier) && b.name.toLowerCase().includes(needle),
    ),
  );
  let hiddenMembers = $derived(!!needle && profile.mode === "f2p" && rows.some((b) => b.members));

  function open() {
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
      dialog.querySelector(`#${uid}-row-${active}`)?.scrollIntoView({ block: "nearest" });
    } else if (event.key === "Enter" && rows[active]) {
      event.preventDefault();
      choose(rows[active].id);
    }
  }
  $effect(() => {
    void needle, tier;
    active = 0;
  });
</script>

{#snippet highlighted(text: string)}
  {@const at = needle ? text.toLowerCase().indexOf(needle) : -1}
  {#if at < 0}{text}{:else}{text.slice(0, at)}<mark>{text.slice(at, at + needle.length)}</mark
    >{text.slice(at + needle.length)}{/if}
{/snippet}

<button type="button" class="finder-trigger" aria-haspopup="dialog" onclick={open}
  ><Search size={16} /><span class="finder-trigger-label">Boss log · find a boss</span><span
    class="finder-trigger-count">{position ? `${position} of ${route.length}` : `${route.length} bosses`}</span
  ></button
>

<dialog class="app-dialog boss-finder" bind:this={dialog} aria-label="Find a boss">
  <div class="finder-bar">
    <Search size={18} aria-hidden="true" />
    <input
      bind:this={input}
      bind:value={query}
      onkeydown={onKeydown}
      aria-label="Search bosses"
      aria-controls={uid + "-list"}
      aria-activedescendant={rows.length ? uid + "-row-" + active : undefined}
      placeholder={`Search ${route.length} bosses`}
      autocomplete="off"
      spellcheck="false"
    />
    <kbd>Esc</kbd><IconButton framed={false} label="Close boss search" onclick={() => dialog.close()}
      ><X size={18} /></IconButton
    >
  </div>
  <div class="finder-filters">
    <ChoiceStrip
      variant="joined"
      label="Tier"
      name={uid + "-tier"}
      value={tier}
      choices={[
        { value: "all", label: "All" },
        { value: "Free", label: "Free" },
        { value: "Low", label: "Low" },
        { value: "Mid", label: "Mid" },
        { value: "High", label: "High" },
      ]}
      onChange={(v) => (tier = v)}
    />
  </div>
  <ul class="finder-list" id={uid + "-list"} role="listbox" aria-label="Bosses">
    <li class="finder-group" role="presentation">
      {needle ? `${rows.length} ${rows.length === 1 ? "match" : "matches"} · ladder order` : "Ladder order"}
    </li>
    {#each rows as b, index (b.id)}<li role="presentation">
        <button
          id={uid + "-row-" + index}
          type="button"
          role="option"
          class="finder-row"
          aria-selected={index === active}
          class:active={index === active}
          onclick={() => choose(b.id)}
          onmousemove={() => (active = index)}
          ><FallbackArt file={b.image} size={28} className="finder-art" /><span class="finder-text"
            ><strong>{@render highlighted(b.name)}</strong><small
              >{b.tier} tier · Level {b.level}{b.members ? " · Members" : " · F2P"}{b.id === current?.id
                ? " · open now"
                : ""}</small
            ></span
          ></button
        >
      </li>{/each}
    {#if !rows.length}<li class="finder-empty" role="presentation">No bosses match.</li>{/if}
  </ul>
  {#if hiddenMembers}<p class="finder-note">
      <Info size={16} aria-hidden="true" />You are planning in F2P. Members bosses show in search; switch
      to Members planning to fight them.
    </p>{/if}
  <div class="finder-foot" aria-hidden="true">
    <span><kbd>↑</kbd> <kbd>↓</kbd> move</span><span><kbd>Enter</kbd> open</span><span
      ><kbd>Esc</kbd> close</span
    >
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
  :global(.app-dialog.boss-finder) {
    width: min(640px, calc(100vw - 32px));
    max-height: calc(100dvh - 92px);
    margin: 72px auto auto;
    padding: 0;
    background: var(--panel-raised);
    border: 1px solid var(--edge);
    border-radius: 2px;
    color: var(--text);
  }
  :global(.boss-finder[open]) {
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
  .finder-row :global(.finder-art) {
    width: 28px;
    height: 28px;
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
    :global(.app-dialog.boss-finder) {
      margin-top: 16px;
      max-height: calc(100dvh - 32px);
    }
  }
</style>
