<script lang="ts">
  import { Crosshair, Lock, Maximize, Minus, Plus } from "@lucide/svelte";
  import type { QuestRecord } from "../../data";
  import {
    CARD,
    difficultyColor,
    shortQuestName,
    type MapLayout,
    type QuestStatus,
  } from "../questMap";

  let {
    quests,
    layout,
    status,
    path,
    goal,
    selected,
    focus,
    onSelect,
  }: {
    quests: readonly QuestRecord[];
    layout: MapLayout;
    status: ReadonlyMap<string, QuestStatus>;
    /** The goal and every quest before it; drawn in gold. */
    path: ReadonlySet<string>;
    goal?: string;
    selected?: string;
    /** Where the map opens when there is no goal. */
    focus?: string;
    onSelect: (id: string) => void;
  } = $props();

  const MAX = 2;
  /** Below this zoom the named cards fold into dots. */
  const DOTS = 0.6;
  const MINI = 200;

  let viewport = $state<HTMLDivElement>();
  let width = $state(0);
  let height = $state(0);
  let scale = $state(1);
  let tx = $state(0);
  let ty = $state(0);

  let fitScale = $derived(
    width && height ? Math.min(width / layout.width, height / layout.height) * 0.96 : 0.3,
  );
  let min = $derived(Math.min(0.25, fitScale));
  let dots = $derived(scale < DOTS);
  let miniScale = $derived(Math.min(MINI / layout.width, 150 / layout.height));

  let edges = $derived.by(() => {
    const plain: string[] = [];
    const gold: string[] = [];
    for (const q of quests)
      for (const r of q.questRequirements) {
        const a = layout.nodes.get(r);
        const b = layout.nodes.get(q.id);
        if (!a || !b) continue;
        const x1 = a.x + CARD.width;
        const y1 = a.y + CARD.height / 2;
        const x2 = b.x;
        const y2 = b.y + CARD.height / 2;
        const mx = (x1 + x2) / 2;
        const d = `M${x1} ${y1}C${mx} ${y1} ${mx} ${y2} ${x2} ${y2}`;
        (path.has(q.id) && path.has(r) ? gold : plain).push(d);
      }
    return { plain: plain.join(""), gold: gold.join("") };
  });

  const clamp = (s: number) => Math.min(MAX, Math.max(min, s));

  // Zoom, fit and jumps ease toward a target view; drags and pans move at once.
  // Repeated wheel ticks build on the target, so zooming stays anchored under the pointer.
  let target = { scale: 1, tx: 0, ty: 0 };
  let frame = 0;
  function animateTo(next: typeof target) {
    target = next;
    if (frame) return;
    let last = performance.now();
    const step = (now: number) => {
      // Close ~22% of the gap per 16ms, independent of frame rate.
      const k = 1 - Math.pow(0.78, (now - last) / 16);
      last = now;
      scale += (target.scale - scale) * k;
      tx += (target.tx - tx) * k;
      ty += (target.ty - ty) * k;
      const settled =
        Math.abs(target.scale - scale) < 0.0005 &&
        Math.abs(target.tx - tx) < 0.5 &&
        Math.abs(target.ty - ty) < 0.5;
      if (settled) {
        ({ scale, tx, ty } = target);
        frame = 0;
      } else frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
  }
  function jumpTo(next: typeof target) {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    target = next;
    ({ scale, tx, ty } = next);
  }
  $effect(() => () => cancelAnimationFrame(frame));

  function centreOn(id: string | undefined, s = Math.max(target.scale, 1), instant = false) {
    const node = id ? layout.nodes.get(id) : undefined;
    if (!node) return fit(instant);
    const next = clamp(s);
    (instant ? jumpTo : animateTo)({
      scale: next,
      tx: width / 2 - (node.x + CARD.width / 2) * next,
      ty: height / 2 - (node.y + CARD.height / 2) * next,
    });
  }
  function fit(instant = false) {
    const s = fitScale;
    (instant ? jumpTo : animateTo)({
      scale: s,
      tx: (width - layout.width * s) / 2,
      ty: (height - layout.height * s) / 2,
    });
  }
  function zoomAt(factor: number, cx = width / 2, cy = height / 2, instant = false) {
    const from = instant ? { scale, tx, ty } : target;
    const next = clamp(from.scale * factor);
    (instant ? jumpTo : animateTo)({
      scale: next,
      tx: cx - ((cx - from.tx) / from.scale) * next,
      ty: cy - ((cy - from.ty) / from.scale) * next,
    });
  }
  function panBy(dx: number, dy: number) {
    jumpTo({ scale: target.scale, tx: target.tx + dx, ty: target.ty + dy });
  }

  // Open on the goal, or on the focus quest, once the viewport has a size; re-centre when the goal changes.
  let placedFor: string | undefined | null = null;
  $effect(() => {
    if (!width || !height) return;
    const spot = goal ?? focus;
    if (placedFor === spot) return;
    // The first placement is instant; a goal picked later glides there.
    const first = placedFor === null;
    placedFor = spot;
    centreOn(spot, 1, first);
  });

  // Plain wheel moves the map; Ctrl/Cmd+wheel and trackpad pinch zoom around the pointer.
  $effect(() => {
    const el = viewport;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const box = el.getBoundingClientRect();
      // Line-mode wheels report lines, not pixels.
      const unit = e.deltaMode === 1 ? 16 : 1;
      const dy = e.deltaY * unit;
      if (e.ctrlKey || e.metaKey) {
        // A mouse notch (~100px) zooms ~18%; trackpad pinch sends small deltas and stays fine-grained.
        const notch = Math.max(-50, Math.min(50, dy));
        zoomAt(Math.exp(-notch * 0.004), e.clientX - box.left, e.clientY - box.top);
      } else if (e.shiftKey) panBy(-dy, 0);
      else panBy(-e.deltaX * unit, -dy);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  });

  // Drag to move with one pointer, pinch with two. A drag never counts as a click.
  const pointers = new Map<number, { x: number; y: number }>();
  let drag = $state<{ x: number; y: number; tx: number; ty: number; moved: boolean }>();
  let pinch: { distance: number; scale: number } | undefined;
  let swallowClick = false;
  const spread = () => {
    const [a, b] = [...pointers.values()];
    return { distance: Math.hypot(a.x - b.x, a.y - b.y), cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2 };
  };
  function onPointerDown(e: PointerEvent) {
    if (e.button !== 0 && e.button !== 1) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 2) {
      pinch = { distance: spread().distance, scale };
      drag = undefined;
    } else drag = { x: e.clientX, y: e.clientY, tx, ty, moved: false };
  }
  function onPointerMove(e: PointerEvent) {
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinch && pointers.size === 2) {
      const { distance, cx, cy } = spread();
      const box = viewport!.getBoundingClientRect();
      zoomAt((pinch.scale * (distance / pinch.distance)) / scale, cx - box.left, cy - box.top, true);
      swallowClick = true;
      return;
    }
    if (!drag) return;
    const dx = e.clientX - drag.x;
    const dy = e.clientY - drag.y;
    if (!drag.moved && Math.hypot(dx, dy) < 4) return;
    if (!drag.moved) {
      drag.moved = true;
      viewport?.setPointerCapture(e.pointerId);
    }
    jumpTo({ scale, tx: drag.tx + dx, ty: drag.ty + dy });
  }
  function onPointerUp(e: PointerEvent) {
    pointers.delete(e.pointerId);
    if (drag?.moved) swallowClick = true;
    drag = undefined;
    if (pointers.size < 2) pinch = undefined;
  }
  function onClickCapture(e: MouseEvent) {
    if (!swallowClick) return;
    swallowClick = false;
    e.stopPropagation();
    e.preventDefault();
  }
  function onKeydown(e: KeyboardEvent) {
    if (e.target !== viewport) return;
    const step = 80;
    const keys: Record<string, () => void> = {
      "+": () => zoomAt(1.25),
      "=": () => zoomAt(1.25),
      "-": () => zoomAt(0.8),
      "0": () => zoomAt(1 / target.scale),
      "!": () => fit(),
      ArrowLeft: () => panBy(step, 0),
      ArrowRight: () => panBy(-step, 0),
      ArrowUp: () => panBy(0, step),
      ArrowDown: () => panBy(0, -step),
    };
    const run = e.shiftKey && e.code === "Digit1" ? () => fit() : keys[e.key];
    if (!run) return;
    e.preventDefault();
    run();
  }

  function onMini(e: PointerEvent) {
    if (e.type === "pointerdown") (e.currentTarget as Element).setPointerCapture(e.pointerId);
    else if (!(e.buttons & 1)) return;
    const box = (e.currentTarget as Element).getBoundingClientRect();
    const x = (e.clientX - box.left) / miniScale;
    const y = (e.clientY - box.top) / miniScale;
    jumpTo({ scale, tx: width / 2 - x * scale, ty: height / 2 - y * scale });
  }

  const tierLabel = (tier: number) => (tier === 0 ? "Start" : String(tier));
</script>

<div class="quest-map">
  <!-- The map is a pannable surface (role="application") that takes drag, wheel and arrow keys. -->
  <!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
  <div
    class="map-viewport"
    class:dragging={drag?.moved}
    bind:this={viewport}
    bind:clientWidth={width}
    bind:clientHeight={height}
    role="application"
    aria-label="Quest map. Drag or use the arrow keys to move, plus and minus to zoom."
    aria-roledescription="pannable map"
    tabindex="0"
    onpointerdown={onPointerDown}
    onpointermove={onPointerMove}
    onpointerup={onPointerUp}
    onpointercancel={onPointerUp}
    onclickcapture={onClickCapture}
    onmousedown={(e) => {
      // Middle-drag pans the map; stop the browser starting its autoscroll circle.
      if (e.button === 1) e.preventDefault();
    }}
    onauxclick={(e) => e.button === 1 && e.preventDefault()}
    onkeydown={onKeydown}
  >
    <div
      class="map-world"
      style:width="{layout.width}px"
      style:height="{layout.height}px"
      style:transform="translate({tx}px, {ty}px) scale({scale})"
    >
      {#if !dots}{#each layout.tiers as t (t.tier)}<span
            class="tier-label"
            style:left="{t.x}px"
            style:width="{t.width}px">{tierLabel(t.tier)}</span
          >{/each}{/if}
      <svg class="map-lines" width={layout.width} height={layout.height} aria-hidden="true">
        <path class="line" d={edges.plain} />
        <path class="line gold" d={edges.gold} />
      </svg>
      {#each quests as q (q.id)}
        {@const node = layout.nodes.get(q.id)}
        {@const s = status.get(q.id) ?? "locked"}
        {#if node}<button
            type="button"
            class="map-quest {s}"
            class:dot={dots}
            class:on-path={path.has(q.id)}
            class:goal={q.id === goal}
            class:selected={q.id === selected}
            style:left="{node.x}px"
            style:top="{node.y}px"
            style:--difficulty={difficultyColor(q.difficulty)}
            style:--dot="{Math.min(26, 11 / scale)}px"
            title="{q.name} · {q.difficulty} · {s === 'done'
              ? 'Completed'
              : s === 'ready'
                ? 'Can start now'
                : 'Needs earlier quests'}"
            aria-label={q.name}
            aria-pressed={q.id === selected}
            onclick={() => onSelect(q.id)}
            >{#if !dots}<span class="mark" aria-hidden="true"
                >{#if s === "done"}<svg viewBox="0 0 24 24" width="12" height="12"
                    ><path d="m5 12 5 5 9-10" /></svg
                  >{:else if s === "ready"}<span class="ready-dot"></span>{:else}<Lock
                    size={11}
                  />{/if}</span
              ><span class="name">{shortQuestName(q.name)}</span>{/if}</button
          >{/if}
      {/each}
    </div>

    <p class="map-hint">Drag to move · Ctrl+scroll or pinch to zoom</p>

    <div class="map-toolbar" role="toolbar" aria-label="Map controls">
      <button type="button" aria-label="Zoom out" title="Zoom out (−)" onclick={() => zoomAt(0.8)}
        ><Minus size={16} /></button
      >
      <button
        type="button"
        class="zoom-level"
        title="Reset to 100% (0)"
        aria-label="Zoom {Math.round(scale * 100)}%, reset to 100%"
        onclick={() => zoomAt(1 / target.scale)}>{Math.round(scale * 100)}%</button
      >
      <button type="button" aria-label="Zoom in" title="Zoom in (+)" onclick={() => zoomAt(1.25)}
        ><Plus size={16} /></button
      >
      <span class="sep" aria-hidden="true"></span>
      <button type="button" class="wide" title="Fit all (Shift+1)" onclick={() => fit()}
        ><Maximize size={15} />Fit all</button
      >
      {#if goal}<button type="button" class="wide gold" onclick={() => centreOn(goal)}
          ><Crosshair size={15} />Go to goal</button
        >{/if}
    </div>

    <svg
      class="minimap"
      width={layout.width * miniScale}
      height={layout.height * miniScale}
      viewBox="0 0 {layout.width} {layout.height}"
      role="img"
      aria-label="Overview of the whole map"
      onpointerdown={(e) => {
        e.stopPropagation();
        onMini(e);
      }}
      onpointermove={onMini}
    >
      {#each quests as q (q.id)}
        {@const node = layout.nodes.get(q.id)}
        {#if node}<rect
            class="mini {status.get(q.id)}"
            class:on-path={path.has(q.id)}
            x={node.x}
            y={node.y}
            width={CARD.width}
            height={CARD.height}
          />{/if}
      {/each}
      <rect
        class="mini-view"
        x={-tx / scale}
        y={-ty / scale}
        width={width / scale}
        height={height / scale}
      />
    </svg>
  </div>
</div>

<style>
  .quest-map {
    position: relative;
  }
  .map-viewport {
    position: relative;
    height: clamp(420px, 64vh, 760px);
    overflow: hidden;
    background:
      radial-gradient(circle at 1px 1px, #ffffff0a 1px, transparent 0) 0 0 / 24px 24px,
      var(--bg);
    cursor: grab;
    touch-action: none;
    user-select: none;
  }
  .map-viewport.dragging {
    cursor: grabbing;
  }
  .map-viewport:focus-visible {
    outline: 2px solid var(--gold-bright);
    outline-offset: -2px;
  }
  .map-world {
    position: absolute;
    top: 0;
    left: 0;
    transform-origin: 0 0;
    will-change: transform;
  }
  .tier-label {
    position: absolute;
    top: 8px;
    text-align: center;
    font-size: 11px;
    line-height: 14px;
    font-weight: 700;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: var(--muted);
  }
  .map-lines {
    position: absolute;
    inset: 0;
    overflow: visible;
    pointer-events: none;
  }
  .line {
    fill: none;
    stroke: var(--edge);
    stroke-opacity: 0.32;
    stroke-width: 1;
    vector-effect: non-scaling-stroke;
  }
  .line.gold {
    stroke: var(--gold-bright);
    stroke-opacity: 0.85;
    stroke-width: 1.6;
  }
  .map-quest {
    position: absolute;
    display: flex;
    align-items: center;
    gap: 6px;
    width: 168px;
    height: 28px;
    /* The app's buttons have a 40px minimum; map cards are fixed to their slot. */
    min-height: 0;
    box-sizing: border-box;
    padding: 0 8px 0 0;
    background: var(--panel-raised);
    border: 1px solid var(--frame-line);
    border-left: 3px solid var(--difficulty);
    border-radius: 3px;
    color: var(--heading);
    font-family: inherit;
    font-size: 12px;
    font-weight: 600;
    line-height: 14px;
    text-align: left;
    white-space: nowrap;
    cursor: pointer;
  }
  .map-quest:hover {
    border-color: var(--gold);
    border-left-color: var(--difficulty);
  }
  .map-quest.done {
    background: #162a26;
    color: #b9cbc2;
  }
  .map-quest.locked {
    background: #141f27;
    border-color: #2f3f4a;
    border-left-color: var(--difficulty);
    color: #8496a2;
    font-weight: 400;
  }
  .map-quest.on-path {
    border-color: var(--gold);
    border-left-color: var(--difficulty);
  }
  .map-quest.goal {
    background: #3a3221;
    border-color: var(--gold-bright);
    border-left-color: var(--difficulty);
    box-shadow: 0 0 0 3px #e5c89233;
  }
  .map-quest.selected {
    outline: 2px solid var(--gold-bright);
    outline-offset: 2px;
  }
  .mark {
    display: flex;
    justify-content: center;
    flex: 0 0 18px;
    color: var(--muted);
  }
  .mark svg {
    fill: none;
    stroke: var(--green);
    stroke-width: 3;
  }
  .ready-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #d6b576;
  }
  .name {
    overflow: hidden;
    text-overflow: ellipsis;
  }
  /* Zoomed out: each card becomes a dot at its card's centre, sized to stay visible. */
  .map-quest.dot {
    width: var(--dot);
    height: var(--dot);
    margin: calc((28px - var(--dot)) / 2) 0 0 calc((168px - var(--dot)) / 2);
    padding: 0;
    border: 0;
    border-radius: 50%;
    background: #3a4c58;
  }
  .map-quest.dot.done {
    background: var(--green);
  }
  .map-quest.dot.ready {
    background: #d6b576;
  }
  .map-quest.dot.on-path {
    box-shadow: 0 0 0 calc(var(--dot) / 5) var(--gold-bright);
  }
  .map-quest.dot.goal {
    background: var(--gold-bright);
    box-shadow: 0 0 0 calc(var(--dot) / 3) #e5c89255;
  }
  .map-hint {
    position: absolute;
    top: 10px;
    right: 12px;
    margin: 0;
    padding: 4px 8px;
    background: #0d151bcc;
    border-radius: 3px;
    font-size: 11px;
    line-height: 16px;
    color: var(--muted);
    pointer-events: none;
  }
  .map-toolbar {
    position: absolute;
    left: 50%;
    bottom: 14px;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: 2px;
    padding: 4px;
    background: #0d151bf2;
    border: 1px solid var(--frame-line);
    border-radius: 6px;
    box-shadow: 0 8px 20px #00000080;
  }
  .map-toolbar button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    min-width: 32px;
    min-height: 0;
    height: 32px;
    padding: 0 6px;
    border: 0;
    border-radius: 4px;
    background: none;
    color: var(--text);
    font-family: inherit;
    font-size: 12px;
    font-weight: 600;
    line-height: 1;
    cursor: pointer;
  }
  .map-toolbar button:hover {
    background: #22323d;
  }
  .map-toolbar .zoom-level {
    width: 52px;
    font-variant-numeric: tabular-nums;
  }
  .map-toolbar .wide {
    padding: 0 10px;
  }
  .map-toolbar .gold {
    color: var(--gold-bright);
  }
  .sep {
    width: 1px;
    height: 20px;
    margin: 0 4px;
    background: var(--frame-line);
  }
  .minimap {
    position: absolute;
    right: 12px;
    bottom: 14px;
    padding: 6px;
    background: #0d151bee;
    border: 1px solid var(--frame-line);
    border-radius: 3px;
    box-shadow: 0 6px 16px #00000066;
    cursor: pointer;
    overflow: hidden;
  }
  .mini {
    fill: #3a4c58;
  }
  .mini.done {
    fill: var(--green);
  }
  .mini.ready {
    fill: #d6b576;
  }
  .mini.on-path {
    fill: var(--gold-bright);
  }
  .mini-view {
    fill: #e5c89214;
    stroke: var(--gold-bright);
    stroke-width: 2;
    vector-effect: non-scaling-stroke;
  }
  @media (max-width: 760px) {
    .minimap,
    .map-hint {
      display: none;
    }
  }
</style>
