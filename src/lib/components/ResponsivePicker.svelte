<script lang="ts">
  import { onMount, tick, type Snippet } from "svelte";
  import { afterNavigate } from "$app/navigation";
  import { ChevronDown, ChevronUp } from "@lucide/svelte";
  import GameArt from "./GameArt.svelte";
  let {
    label,
    selection,
    icon,
    mode = "dropdown",
    children,
  }: {
    label: string;
    selection: string;
    /** Wiki art for the current selection, shown on the panel trigger. */
    icon?: string;
    mode?: "dropdown" | "panel";
    children: Snippet;
  } = $props();
  const id = $props.id();
  let wide = $state(false);
  let expanded = $state(false);
  let trigger = $state<HTMLButtonElement>();
  let sheet = $state<HTMLDivElement>();
  $effect(() => {
    selection;
    expanded = false;
  });
  onMount(() => {
    const query = window.matchMedia("(min-width: 1001px)");
    const update = () => {
      wide = query.matches;
      if (wide) expanded = false;
    };
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  });
  let sheetOpen = $derived(mode === "panel" && expanded && !wide);
  async function openSheet() {
    expanded = true;
    await tick();
    sheet?.querySelector<HTMLInputElement>("input")?.focus();
  }
  function closeSheet() {
    expanded = false;
    trigger?.focus();
  }
  const focusable =
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  function onKeydown(event: KeyboardEvent) {
    if (!sheetOpen || !trigger || !sheet) return;
    if (event.key === "Escape") {
      event.preventDefault();
      closeSheet();
      return;
    }
    if (event.key !== "Tab") return;
    // Queried per keypress: the filter's clear button comes and goes.
    const stops = [
      trigger,
      ...sheet.querySelectorAll<HTMLElement>(focusable),
    ].filter((element) => element.offsetParent !== null);
    const first = stops[0];
    const last = stops[stops.length - 1];
    const active = document.activeElement;
    if (event.shiftKey && (active === first || !stops.includes(active as HTMLElement))) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && (active === last || !stops.includes(active as HTMLElement))) {
      event.preventDefault();
      first.focus();
    }
  }
  function onWindowClick(event: MouseEvent) {
    // Choosing an entry closes the sheet and returns focus to the trigger.
    if (!sheetOpen || !sheet) return;
    const target = event.target as Element | null;
    if (target && sheet.contains(target) && target.closest("a[href]")) {
      refocus = true;
      closeSheet();
    }
  }
  // The router blurs and resets focus during navigation, so restore it after.
  let refocus = false;
  afterNavigate(() => {
    if (!refocus) return;
    refocus = false;
    trigger?.focus();
  });
</script>

<svelte:window onkeydown={onKeydown} onclick={onWindowClick} />

{#if mode === "panel"}
  <div class="guide-picker picker-panel" class:open={sheetOpen}>
    <button
      bind:this={trigger}
      type="button"
      class="picker-trigger"
      aria-expanded={sheetOpen}
      aria-controls={id}
      onclick={() => (sheetOpen ? closeSheet() : void openSheet())}
    >
      {#if icon}<GameArt file={icon} size={26} />{/if}
      <strong>{selection}</strong>
      <span class="picker-trigger-hint"
        >{sheetOpen ? "Close" : "Change " + label.toLowerCase()}</span
      >
      {#if sheetOpen}<ChevronUp size={18} aria-hidden="true" />{:else}<ChevronDown
          size={18}
          aria-hidden="true"
        />{/if}
    </button>
    {#if sheetOpen}<button
        type="button"
        class="picker-backdrop"
        tabindex="-1"
        aria-label={"Close " + label.toLowerCase() + " list"}
        onclick={closeSheet}
      ></button>{/if}
    <div
      bind:this={sheet}
      {id}
      class="picker-sheet"
      role={sheetOpen ? "dialog" : undefined}
      aria-modal={sheetOpen ? "true" : undefined}
      aria-label={sheetOpen ? "Choose " + label.toLowerCase() : undefined}
    >
      {@render children()}
    </div>
  </div>
{:else}
  <details
    class="guide-picker"
    open={wide || expanded}
    ontoggle={(event) => {
      if (!wide) expanded = event.currentTarget.open;
    }}
  >
    <summary aria-label={"Choose " + label.toLowerCase() + ": " + selection}
      ><span>{label}</span><strong>{selection}</strong><ChevronDown
        size={18}
        aria-hidden="true"
      /></summary
    >{@render children()}
  </details>
{/if}

<style>
  .picker-trigger,
  .picker-backdrop {
    display: none;
  }
  @media (max-width: 1000px) {
    .picker-panel {
      position: relative;
    }
    .picker-panel.open {
      z-index: 25;
    }
    .picker-trigger {
      position: relative;
      z-index: 2;
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
      min-height: 44px;
      padding: 0 10px;
      border: 1px solid var(--edge);
      border-radius: 4px;
      background: #0d161c;
      color: var(--text);
      font: 600 15px "DM Sans", sans-serif;
      text-align: left;
      cursor: pointer;
    }
    .picker-trigger strong {
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-weight: 600;
    }
    .picker-trigger-hint {
      margin-left: auto;
      font-size: var(--font-caption);
      font-weight: 500;
      color: var(--muted);
      white-space: nowrap;
    }
    .picker-trigger :global(svg) {
      flex: none;
    }
    .picker-trigger:focus-visible {
      outline: 2px solid var(--gold-bright);
      outline-offset: 2px;
    }
    .open .picker-trigger {
      border-color: var(--gold);
      background: var(--panel-raised);
    }
    .picker-sheet {
      display: none;
    }
    .open .picker-sheet {
      position: absolute;
      top: 100%;
      left: 8px;
      right: 8px;
      z-index: 2;
      display: block;
      max-height: calc(100dvh - var(--topbar-height, 72px) - 140px);
      overflow-y: auto;
      overscroll-behavior: contain;
      padding: 12px;
      background:
        linear-gradient(125deg, #ffffff06, transparent 60%),
        repeating-linear-gradient(0deg, #00000010 0 1px, transparent 1px 3px),
        var(--panel);
      border: 1px solid #c5a46b80;
      border-top: 0;
      border-radius: 0 0 4px 4px;
      box-shadow: 0 12px 28px #000000a0;
    }
    .picker-backdrop {
      position: fixed;
      inset: var(--topbar-height, 72px) 0 0;
      z-index: 1;
      display: block;
      width: 100%;
      padding: 0;
      border: 0;
      background: #070c10b8;
      cursor: default;
    }
  }
</style>
