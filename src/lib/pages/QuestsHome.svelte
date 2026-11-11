<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import { ChevronDown, Crosshair, X } from "@lucide/svelte";
  import { QUESTS, nextQuest, progressionQuests } from "../../data";
  import { activeProfile, getCompass } from "../compassContext";
  import { questPath } from "../navigation";
  import {
    difficultyColor,
    earlierQuests,
    layoutQuestMap,
    pathColumns,
    type QuestStatus,
  } from "../questMap";
  import { questStartStatus } from "../questReadiness";
  import Button from "../components/Button.svelte";
  import ChoiceStrip from "../components/ChoiceStrip.svelte";
  import GameArt from "../components/GameArt.svelte";
  import GameWindow from "../components/GameWindow.svelte";
  import QuestFinder from "../components/QuestFinder.svelte";
  import QuestMap from "../components/QuestMap.svelte";
  import QuestPathView from "../components/QuestPathView.svelte";

  const saved = getCompass().state;
  // Big storyline finales offered as one-click goals.
  const SUGGESTED = ["plagues-end", "recipe-for-disaster", "desert-treasure", "sliskes-endgame"];

  let profile = $derived(activeProfile($saved));
  let route = $derived(progressionQuests(profile));
  let routeIds = $derived(new Set(route.map((q) => q.id)));
  let layout = $derived(layoutQuestMap(route));
  let completed = $derived(new Set(profile.completedQuests));
  let status = $derived(
    new Map<string, QuestStatus>(
      route.map((q) => [q.id, questStartStatus(q, profile, completed)]),
    ),
  );
  let counts = $derived({
    done: route.filter((q) => status.get(q.id) === "done").length,
    ready: route.filter((q) => status.get(q.id) === "ready").length,
    levels: route.filter((q) => status.get(q.id) === "levels").length,
    locked: route.filter((q) => status.get(q.id) === "locked").length,
  });

  // The goal comes from the link first, then the last goal picked on this device.
  const storageKey = (id: string) => `compass.questGoal.${id}`;
  let stored = $state<string | undefined>();
  $effect(() => {
    try {
      stored = localStorage.getItem(storageKey(profile.id)) ?? undefined;
    } catch {
      stored = undefined;
    }
  });
  let urlGoal = $derived(page.url.searchParams.get("goal") ?? undefined);
  let goalId = $derived([urlGoal, stored].find((id) => id && routeIds.has(id)));
  let goal = $derived(goalId ? QUESTS.find((q) => q.id === goalId) : undefined);
  let view = $derived(goal && page.url.searchParams.get("view") === "path" ? "path" : "map");

  let path = $derived.by(() => {
    if (!goalId) return new Set<string>();
    const set = earlierQuests(goalId, route);
    set.add(goalId);
    return set;
  });
  let earlierCount = $derived(Math.max(0, path.size - 1));
  let earlierDone = $derived([...path].filter((id) => id !== goalId && completed.has(id)).length);
  let columns = $derived(goalId ? pathColumns(goalId, route) : []);

  let selectedId = $state<string | undefined>();
  let selected = $derived(
    route.find((q) => q.id === (selectedId ?? goalId)) ?? undefined,
  );
  let selectedEarlier = $derived(selected ? earlierQuests(selected.id, route) : new Set<string>());
  let selectedEarlierDone = $derived([...selectedEarlier].filter((id) => completed.has(id)).length);

  let focus = $derived(nextQuest(profile)?.id);
  let ready = $derived(route.filter((q) => status.get(q.id) === "ready"));
  let suggestions = $derived(
    SUGGESTED.filter((id) => routeIds.has(id) && id !== goalId && !completed.has(id)).map(
      (id) => route.find((q) => q.id === id)!,
    ),
  );
  let finder = $state<QuestFinder>();

  function setUrl(next: { goal?: string; view?: string }) {
    const url = new URL(page.url.href);
    for (const [key, value] of Object.entries(next))
      if (value) url.searchParams.set(key, value);
      else url.searchParams.delete(key);
    void goto(url, { replace: true, reset: false });
  }
  function chooseGoal(id: string | undefined) {
    try {
      if (id) localStorage.setItem(storageKey(profile.id), id);
      else localStorage.removeItem(storageKey(profile.id));
    } catch {
      // Storage can be unavailable; the goal still lives in the link.
    }
    stored = id;
    selectedId = undefined;
    setUrl({ goal: id, view: id ? page.url.searchParams.get("view") ?? undefined : undefined });
  }
</script>

<div class="quests-home page-enter">
  <header class="quests-head">
    <div>
      <h1>Quests</h1>
      <p>
        <strong>{counts.done} of {route.length}</strong> complete ·
        <strong class="ready-count">{counts.ready}</strong> you can start now ·
        {counts.levels} need higher levels ·
        {counts.locked} need earlier quests first
      </p>
    </div>
    <ChoiceStrip
      variant="joined"
      label="View"
      name="quests-view"
      value={view}
      choices={[
        { value: "map", label: "Map" },
        { value: "path", label: "Path", description: goal ? undefined : "Pick a goal to see its path" },
      ]}
      onChange={(v) => (goal ? setUrl({ view: v === "path" ? "path" : undefined }) : finder?.open())}
    />
  </header>

  <div class="goal-row">
    <span class="eyebrow">Goal</span>
    {#if goal}<button type="button" class="goal-button" aria-haspopup="dialog" onclick={() => finder?.open()}
        ><GameArt file={goal.icon} size={30} /><span class="goal-text"
          ><strong>{goal.name}</strong><small
            >{earlierCount
              ? `${earlierCount} earlier quests · ${earlierDone} done`
              : "No earlier quests needed"}</small
          ></span
        ><span class="goal-change">Change<ChevronDown size={14} aria-hidden="true" /></span></button
      ><button type="button" class="goal-clear" aria-label="Clear goal" title="Clear goal" onclick={() => chooseGoal(undefined)}
        ><X size={16} /></button
      >{:else}<Button variant="primary" onclick={() => finder?.open()}
        ><Crosshair size={16} />Pick a goal</Button
      >{/if}
    {#if suggestions.length}<span class="or-try">Or try</span>
      {#each suggestions as q (q.id)}<button type="button" class="suggestion" onclick={() => chooseGoal(q.id)}
          >{q.name}</button
        >{/each}{/if}
    <span class="legend" aria-hidden="true"
      ><span><i class="key done"></i>Completed</span><span><i class="key ready"></i>Can start</span><span
        ><i class="key levels"></i>Needs levels</span
      ><span><i class="key locked"></i>Needs earlier quests</span></span
    >
  </div>

  <QuestFinder
    bind:this={finder}
    quests={route}
    {profile}
    current={goal}
    trigger={false}
    label="Choose a goal quest"
    onOpen={(id) => chooseGoal(id)}
  />

  <div class="quests-body">
    {#if view === "path" && goal}<GameWindow
        title={"Path to " + goal.name}
        trailing={earlierCount ? `${earlierDone} of ${earlierCount} done` : undefined}
        className="path-window"
      >
        {#if earlierCount}<QuestPathView {columns} quests={route} {status} />{:else}<p class="empty">
            {goal.name} needs no earlier quests. You can <a href={questPath(goal.id)}>start it now</a>.
          </p>{/if}
      </GameWindow>{:else}<GameWindow title="Quest map" trailing="{route.length} quests" className="map-window">
        <p class="map-intro">
          Columns count the earlier quests that stand before each quest, and lines join a quest to the
          quests it needs. The coloured edge is difficulty. Zoom out and the names fold into dots.
        </p>
        <QuestMap
          quests={route}
          {layout}
          {status}
          {path}
          goal={goalId}
          selected={selected?.id}
          {focus}
          onSelect={(id) => (selectedId = id)}
        />
      </GameWindow>{/if}

    <aside class="quests-side">
      {#if selected}<GameWindow title={selected.id === goalId ? "Goal" : "Selected"}>
          <div class="selected-head">
            <GameArt file={selected.icon} size={48} />
            <div>
              <strong>{selected.name}</strong>
              <small
                ><i class="diff" style:background={difficultyColor(selected.difficulty)}></i>{selected.difficulty} ·
                {selected.length} · {selected.members ? "Members" : "Free"}</small
              >
              <small class="state {status.get(selected.id)}"
                >{status.get(selected.id) === "done"
                  ? "Completed"
                  : status.get(selected.id) === "ready"
                    ? "Can start now"
                    : status.get(selected.id) === "levels"
                      ? "Needs higher levels"
                      : "Needs earlier quests"}</small
              >
            </div>
          </div>
          {#if selectedEarlier.size}<div class="progress">
              <span>Earlier quests done <strong>{selectedEarlierDone} of {selectedEarlier.size}</strong></span>
              <span class="bar"
                ><span style:width="{(selectedEarlierDone / selectedEarlier.size) * 100}%"></span></span
              >
            </div>{/if}
          <div class="side-actions">
            {#if selected.id === goalId}{#if earlierCount && view !== "path"}<Button
                  variant="primary"
                  onclick={() => setUrl({ view: "path" })}>Show its path</Button
                >{/if}{:else}<Button variant="primary" onclick={() => chooseGoal(selected!.id)}
                >Make this the goal</Button
              >{/if}
            <a class="btn btn-secondary" href={questPath(selected.id)}>Open quest</a>
          </div>
        </GameWindow>{/if}

      <GameWindow title="Can start now" trailing={ready.length}>
        {#if ready.length}<ul class="ready-list">
            {#each ready.slice(0, 6) as q (q.id)}<li>
                <a href={questPath(q.id)}
                  ><GameArt file={q.icon} size={26} /><span
                    ><strong>{q.name}</strong><small
                      ><i class="diff" style:background={difficultyColor(q.difficulty)}></i>{q.difficulty} ·
                      {q.length}</small
                    ></span
                  ></a
                >
              </li>{/each}
          </ul>
          {#if ready.length > 6}<p class="more">
              and {ready.length - 6} more, shown with a gold dot on the map
            </p>{/if}{:else}<p class="empty">
            Nothing to start: every quest on your route is done or waiting on earlier quests or levels.
          </p>{/if}
      </GameWindow>
    </aside>
  </div>
</div>

<style>
  .quests-home {
    display: flex;
    flex-direction: column;
    gap: 18px;
    container-type: inline-size;
  }
  .quests-head {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    justify-content: space-between;
    gap: 12px 24px;
  }
  .quests-head h1 {
    margin: 0;
    font: 600 32px/38px Cinzel, Georgia, serif;
    color: var(--heading);
  }
  .quests-head p {
    margin: 4px 0 0;
    color: var(--muted);
  }
  .quests-head strong {
    color: var(--text);
  }
  .quests-head .ready-count {
    color: var(--gold-bright);
  }
  .goal-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px 12px;
  }
  .eyebrow {
    font-size: 12px;
    line-height: 17px;
    font-weight: 700;
    letter-spacing: 1.55px;
    text-transform: uppercase;
    color: var(--muted);
  }
  .goal-button {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 48px;
    padding: 0 14px 0 8px;
    background: #22323d;
    border: 1px solid var(--gold-bright);
    border-radius: 4px;
    color: #f2dfba;
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .goal-text {
    display: flex;
    flex-direction: column;
  }
  .goal-text strong {
    line-height: 18px;
  }
  .goal-text small {
    font-size: 12px;
    line-height: 15px;
    color: var(--muted);
  }
  .goal-change {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    margin-left: 8px;
    color: var(--gold-bright);
    font-weight: 600;
  }
  .goal-clear {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    background: none;
    border: 1px solid var(--frame-line);
    border-radius: 4px;
    color: var(--muted);
    cursor: pointer;
  }
  .or-try {
    font-size: 12px;
    color: var(--muted);
  }
  .suggestion {
    min-height: 34px;
    padding: 0 12px;
    background: var(--panel);
    border: 1px solid var(--edge);
    border-radius: 4px;
    color: var(--text);
    font: inherit;
    cursor: pointer;
  }
  .suggestion:hover,
  .goal-clear:hover {
    border-color: var(--gold);
    color: var(--gold-bright);
  }
  .legend {
    display: flex;
    flex-wrap: wrap;
    gap: 6px 16px;
    margin-left: auto;
    font-size: 12px;
    color: var(--muted);
  }
  .legend span {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .key {
    width: 10px;
    height: 10px;
    border-radius: 50%;
  }
  .key.done {
    background: var(--green);
  }
  .key.ready {
    background: #d6b576;
  }
  .key.levels {
    background: #8a7650;
  }
  .key.locked {
    background: #3a4c58;
    box-shadow: inset 0 0 0 1px var(--edge);
  }
  .quests-body {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 300px;
    align-items: start;
    gap: 20px;
  }
  .quests-body :global(.map-window),
  .quests-body :global(.path-window) {
    min-width: 0;
    overflow: hidden;
  }
  .map-intro {
    margin: 0;
    padding: 10px 14px;
    font-size: 12px;
    line-height: 17px;
    color: var(--muted);
    border-bottom: 1px solid var(--line);
  }
  .quests-side {
    display: flex;
    flex-direction: column;
    gap: 20px;
    min-width: 0;
  }
  .selected-head {
    display: flex;
    gap: 12px;
    padding: 14px;
  }
  .selected-head > div {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .selected-head strong {
    font-size: 15px;
    line-height: 20px;
    color: var(--heading);
  }
  .selected-head small {
    font-size: 12px;
    line-height: 17px;
    color: var(--muted);
  }
  .state.done {
    color: var(--green);
  }
  .state.ready {
    color: var(--gold-bright);
  }
  .state.levels {
    color: #c9ad78;
  }
  .diff {
    display: inline-block;
    width: 7px;
    height: 7px;
    margin-right: 6px;
    border-radius: 50%;
  }
  .progress {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 0 14px 4px;
    font-size: 12px;
    color: var(--muted);
  }
  .progress strong {
    color: var(--text);
  }
  .bar {
    height: 6px;
    background: var(--well);
    border: 1px solid var(--line);
    border-radius: 3px;
    overflow: hidden;
  }
  .bar span {
    display: block;
    height: 100%;
    background: var(--green);
  }
  .side-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    padding: 12px 14px 14px;
  }
  .side-actions > :global(*) {
    flex: 1 1 auto;
  }
  .ready-list {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .ready-list a {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 48px;
    padding: 4px 14px;
    border-bottom: 1px solid var(--line);
    color: var(--text);
    text-decoration: none;
  }
  .ready-list a:hover {
    background: var(--panel-raised);
  }
  .ready-list span {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .ready-list strong {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .ready-list small {
    font-size: 12px;
    line-height: 16px;
    color: var(--muted);
  }
  .more,
  .empty {
    margin: 0;
    padding: 10px 14px;
    font-size: 12px;
    color: var(--muted);
  }
  @container (max-width: 900px) {
    .quests-body {
      grid-template-columns: minmax(0, 1fr);
    }
    .legend {
      margin-left: 0;
    }
  }
</style>
