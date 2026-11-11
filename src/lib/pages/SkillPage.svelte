<script lang="ts">
  import { goto } from "$app/navigation";
  import {
    SKILLS,
    availableStages,
    nextQuest,
    type Profile,
    toggleItem,
    skillNeedsMembership,
    trainingStage,
    trainingMethod,
    trainingSupplies,
    trainingRangeLabel,
  } from "../../data";
  import { wikiHref } from "../../wiki";
  import { activeProfile, getCompass } from "../compassContext";
  import { parseLevel } from "../levelChanges";
  import { questPath } from "../navigation";
  import { packKey } from "../packing";
  import ActivityNotes from "../components/ActivityNotes.svelte";
  import Button from "../components/Button.svelte";
  import ChoiceStrip from "../components/ChoiceStrip.svelte";
  import GameArt from "../components/GameArt.svelte";
  import GameText from "../components/GameText.svelte";
  import GameWindow from "../components/GameWindow.svelte";
  import ItemList from "../components/ItemList.svelte";
  import SkillGrid from "../components/SkillGrid.svelte";
  import ResponsivePicker from "../components/ResponsivePicker.svelte";
  import SearchField from "../components/SearchField.svelte";
  import SourceBanner from "../components/SourceBanner.svelte";
  import TrainingMethods from "../components/TrainingMethods.svelte";
  import TrainingMap from "../components/TrainingMap.svelte";
  import WikiAction from "../components/WikiAction.svelte";
  import PlayerStatistics from "../components/PlayerStatistics.svelte";
  let { selectedSkill = "" }: { selectedSkill?: string } = $props();
  const controller = getCompass();
  const saved = controller.state;
  const compact = controller.compact;
  const saveError = controller.storageError;
  let profile = $derived(activeProfile($saved));
  let skill = $derived(
    SKILLS.find((s) => s.name === selectedSkill) ?? SKILLS[0],
  );
  let search = $state("");
  let level = $state("");
  let message = $state("");
  let identity = $state("");
  $effect(() => {
    const key = profile.id + "::" + skill.name;
    if (key !== identity) {
      identity = key;
      level = profile.levels[skill.name]?.toString() ?? "";
      message = "";
    }
  });
  let current = $derived(profile.levels[skill.name]);
  $effect(() => {
    level = current?.toString() ?? "";
  });
  let stages = $derived(availableStages(skill, profile.mode));
  let needsMembership = $derived(skillNeedsMembership(skill, profile));
  let stage = $derived(
    needsMembership ? undefined : trainingStage(skill, profile),
  );
  let method = $derived(trainingMethod(skill, profile, stage));
  let supplies = $derived(
    stage && method ? trainingSupplies(stage, method) : [],
  );
  let task = $derived("train-" + skill.name);
  let packedItems = $derived(
    supplies.filter((item) => profile.packed.includes(packKey(task, item))),
  );
  let done = $derived(profile.completedTasks.includes(task));
  let next = $derived(nextQuest(profile));
  // Session target: the level after the selected range, capped at the view's
  // maximum (10–19 aims for 20; the last range aims for the cap itself).
  let target = $derived.by(() => {
    if (!stage) return undefined;
    const cap =
      profile.mode === "f2p"
        ? (skill.freeToPlayCap ?? skill.maxLevel)
        : skill.maxLevel;
    return Math.min(stage.to, cap);
  });
  let filtered = $derived(
    SKILLS.filter((s) => s.name.toLowerCase().includes(search.toLowerCase())),
  );
  let ratio = $derived(
    current == null || !target
      ? 0
      : Math.min(100, Math.round((current / target) * 100)),
  );
  function saveLevel(event: SubmitEvent) {
    event.preventDefault();
    const n = parseLevel(level, skill.maxLevel);
    if (typeof n !== "number") {
      message = `Enter a level from 1 to ${skill.maxLevel}`;
      return;
    }
    controller.updateProfile((p) => ({
      ...p,
      levels: { ...p.levels, [skill.name]: n },
    }));
    message = $saveError
      ? "Level changed in this tab, but the browser could not save it."
      : skill.name + " level saved on this device.";
  }
  function selectTraining(from: number, selectedId?: string) {
    const range = stages.find((entry) => entry.from === from);
    if (!range || needsMembership) return;
    const selected = trainingMethod(skill, profile, range, selectedId);
    if (!selected) return;
    controller.updateProfile((p) => {
      const previousRange =
        p.trainingRanges?.[skill.name] ?? trainingStage(skill, p)?.from;
      const previousMethod =
        p.trainingMethods?.[skill.name] ?? trainingMethod(skill, p, range)?.id;
      const changed =
        previousRange !== range.from || previousMethod !== selected.id;
      return {
        ...p,
        activeTask: task,
        trainingRanges: { ...p.trainingRanges, [skill.name]: range.from },
        trainingMethods: { ...p.trainingMethods, [skill.name]: selected.id },
        completedTasks: changed
          ? p.completedTasks.filter((id) => id !== task)
          : p.completedTasks,
      };
    });
  }
  function selectMethod(id: string) {
    if (stage) selectTraining(stage.from, id);
  }
  function rememberTrainingSelection(p: Profile): Profile {
    if (
      !stage ||
      !method ||
      (p.trainingRanges?.[skill.name] !== undefined &&
        p.trainingMethods?.[skill.name] !== undefined)
    )
      return p;
    return {
      ...p,
      trainingRanges: {
        ...p.trainingRanges,
        [skill.name]: p.trainingRanges?.[skill.name] ?? stage.from,
      },
      trainingMethods: {
        ...p.trainingMethods,
        [skill.name]: p.trainingMethods?.[skill.name] ?? method.id,
      },
    };
  }
  function toggleSupply(item: string) {
    controller.updateProfile((p) => ({
      ...rememberTrainingSelection(p),
      activeTask: task,
      packed: toggleItem(p.packed, packKey(task, item)),
    }));
  }
  function complete() {
    controller.updateProfile((p) => ({
      ...rememberTrainingSelection(p),
      activeTask: task,
      completedTasks: toggleItem(p.completedTasks, task),
    }));
  }
  function switchMembers() {
    controller.updateProfile((p) => ({ ...p, mode: "members" }));
  }
</script>

<div class="skill-page page-enter">
  <div class="skill-toolbar">
    <Button
      variant="quiet"
      aria-pressed={$compact}
      onclick={() => compact.update((value) => !value)}
    >
      {$compact ? "Expand workspace" : "Compact training"}
    </Button>
  </div>
  <div class="skill-layout">
    <ResponsivePicker
      label="Skill"
      selection={skill.name}
      icon={skill.icon}
      mode="panel"
    >
      <aside class="tool-window skill-picker" aria-label="Skills">
        <span class="eye picker-title">Skills</span>
        <SearchField
          label="Filter skills"
          placeholder="Filter skills"
          value={search}
          onChange={(v) => (search = v)}
        />
        <div class="picker-meta">
          <span class="cap">In-game order · {profile.name}</span>
          <span class="cap">? = not recorded</span>
        </div>
        <SkillGrid
          skills={filtered}
          levels={profile.levels}
          selected={skill.name}
          compact
          label="Skills"
        />
        <span class="cap picker-hint"
          >Tap a skill to open its guide. Your range, method and packing for
          each skill are kept.</span
        >
      </aside>
    </ResponsivePicker>

    <div class="skill-centre">
      <section class="tool-window skill-hero" aria-labelledby="skill-title">
        <div class="skill-hero-main">
          <a
            class="skill-hero-icon"
            href={wikiHref(skill.wiki)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={skill.name + " on RuneScape Wiki"}
            ><GameArt file={skill.icon} size={72} /></a
          >
          <div class="skill-hero-copy">
            <span class="eye">{skill.category}</span>
            <h1 id="skill-title">{skill.name}</h1>
            <p><GameText text={skill.description} /></p>
          </div>
          <div class="skill-progress">
            <span class="cap">Recorded level → session target</span>
            <div class="skill-progress-levels">
              {current ?? "?"}{#if target}{" "}<span class="arrow">→</span
                >{" " + target}{/if}
            </div>
            {#if target}<div class="skill-progress-bar">
                <span style:width={ratio + "%"}></span>
              </div>{/if}
            <span class="cap"
              >{current == null
                ? "Not recorded · record your level to personalise the guide"
                : !target
                  ? "Level progress, not XP"
                  : current >= target
                    ? "Session target reached · level progress, not XP"
                    : target -
                      current +
                      (target - current === 1 ? " level" : " levels") +
                      " to go · level progress, not XP"}</span
            >
            <details class="level-update">
              <summary>Update level</summary>
              <PlayerStatistics {profile} skill={skill.name} />
              <form class="level-form" onsubmit={saveLevel}>
                <label
                  >Recorded level<input
                    aria-label={skill.name + " level"}
                    type="number"
                    min="1"
                    max={skill.maxLevel}
                    step="1"
                    required
                    value={level}
                    oninput={(e) => (level = e.currentTarget.value)}
                  /></label
                ><Button type="submit">Save level</Button>
              </form>
              <p class="form-message" role="status">
                <GameText
                  text={message || "Manual entry · update your recorded level"}
                />
              </p>
            </details>
          </div>
        </div>
        {#if stage && method}
          <div class="skill-range">
            <ChoiceStrip
              variant="joined"
              label="Training range"
              name={`training-range-${skill.name}`}
              value={String(stage.from)}
              choices={stages.map((range) => ({
                value: String(range.from),
                label: trainingRangeLabel(skill, range, profile.mode).replace(
                  /^Levels? /,
                  "",
                ),
                description: trainingRangeLabel(skill, range, profile.mode),
              }))}
              onChange={(value) => selectTraining(Number(value))}
            />
          </div>
        {/if}
      </section>

      {#if stage && method}
        <TrainingMethods
          {skill}
          {stage}
          {profile}
          selectedId={method.id}
          onSelect={selectMethod}
        />
      {:else}
        <div class="skill-lock">
          <SourceBanner
            notice={{
              tone: needsMembership ? "private" : "info",
              title: needsMembership
                ? "Free-to-play access limit"
                : "No training method in this view",
              message:
                (needsMembership
                  ? skill.freeToPlayCap === 0
                    ? "This skill requires membership."
                    : `The free-to-play trial ends at level ${skill.freeToPlayCap}.`
                  : "Open the skill reference to review available training.") +
                " Your recorded progress remains safe.",
              retry: false,
            }}
          />
          {#if needsMembership}<Button onclick={switchMembers}
              >Switch to Members view</Button
            >{/if}
        </div>
      {/if}
    </div>

    <aside class="skill-aside" aria-label="Training preparation">
      {#if stage && method}
        <GameWindow
          title="Before you go"
          trailing={supplies.length
            ? packedItems.length + " / " + supplies.length
            : undefined}
          className="skill-pack"
        >
          <div class="window-body">
            <ItemList
              items={supplies}
              checked={packedItems}
              onToggle={toggleSupply}
            />
            <p class="cap">Manual checks. Compass can't see your bank.</p>
          </div>
        </GameWindow>
        <GameWindow title="Where to train" className="skill-where">
          <div class="window-body">
            <TrainingMap {method} {profile} />
          </div>
        </GameWindow>
      {/if}
      <details class="training-access">
        <summary>Access and progression</summary>
        <p><GameText text={skill.membersNote} /></p>
        <WikiAction
          page={profile.mode === "f2p"
            ? (skill.trainingWiki ?? skill.wiki)
            : skill.wiki}
          label="Wiki training reference"
        />
      </details>
      <ActivityNotes
        value={profile.notes[task] || ""}
        onChange={(value) => {
          const id = task;
          controller.updateProfile((p) => ({
            ...rememberTrainingSelection(p),
            activeTask: id,
            notes: { ...p.notes, [id]: value },
          }));
        }}
      />
      <div class="skill-actions">
        <Button
          variant={done ? "success" : "primary"}
          aria-pressed={done}
          disabled={(!stage || !method || needsMembership) && !done}
          onclick={complete}
        >
          {done ? "Recorded complete · undo" : "Mark session complete"}
        </Button>
        <p class="cap">Doesn't add XP or change levels.</p>
        {#if done && next}<Button
            variant="link"
            onclick={() => void goto(questPath(next!.id))}
            >Open next quest →</Button
          >{/if}
        {#if done}<p class="training-completion" role="status">
            Session recorded. Levels, XP and supplies are not changed.
          </p>{/if}
      </div>
    </aside>
  </div>
</div>

<style>
  .skill-toolbar {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 12px;
  }
  .cap {
    margin: 0;
    font-size: var(--font-caption);
    line-height: 1.5;
    color: var(--muted);
  }
  .eye {
    font-size: var(--font-caption);
    font-weight: 700;
    letter-spacing: 1.55px;
    text-transform: uppercase;
    color: var(--muted);
  }

  /* Layout: picker | centre | aside from 1200px; the aside drops under the
     centre below that, and the picker becomes the "Change skill" sheet below
     1001px. */
  .skill-layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 20px;
    align-items: start;
  }
  .skill-centre,
  .skill-aside {
    display: flex;
    flex-direction: column;
    gap: 20px;
    min-width: 0;
  }
  .skill-centre > *,
  .skill-aside > * {
    min-width: 0;
  }
  @media (min-width: 1001px) {
    .skill-layout {
      grid-template-columns: 216px minmax(0, 1fr);
    }
    .skill-layout > :global(.guide-picker) {
      grid-row: 1 / span 2;
      position: sticky;
      top: calc(var(--topbar-height, 72px) + 16px);
      max-height: calc(100dvh - var(--topbar-height, 72px) - 32px);
      overflow-y: auto;
      overscroll-behavior: contain;
    }
    .skill-aside {
      grid-column: 2;
    }
  }
  @media (min-width: 1200px) {
    .skill-layout {
      grid-template-columns: 216px minmax(0, 1fr) 300px;
    }
    .skill-aside {
      grid-column: 3;
      grid-row: 1;
    }
  }
  :global(.is-compact) .skill-layout {
    grid-template-columns: minmax(0, 1fr);
  }
  :global(.is-compact) .skill-aside {
    grid-column: auto;
    grid-row: auto;
  }

  /* Picker: the board's icon-and-level tiles on desktop; names return in the
     wider phone sheet. */
  .skill-picker {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 10px;
  }
  .picker-title {
    padding: 2px 4px;
  }
  .picker-meta {
    display: flex;
    justify-content: space-between;
    gap: 8px;
  }
  .skill-picker :global(.skill-grid.compact) {
    gap: 4px;
  }
  @media (min-width: 1001px) {
    .picker-meta > :first-child,
    .picker-hint {
      display: none;
    }
    .skill-picker :global(.compact .skill-tile) {
      min-height: 44px;
      padding: 0 6px;
      grid-template-columns: auto minmax(0, 1fr);
      background: #0b1318;
      border-color: #2f3e48;
    }
    .skill-picker :global(.compact .skill-tile.selected) {
      border-color: var(--gold-bright);
      background: var(--panel-raised);
      box-shadow: 0 0 0 1px #c5a46b80;
    }
    .skill-picker :global(.compact .skill-tile:hover) {
      border-color: var(--gold);
    }
    .skill-picker :global(.compact .skill-name) {
      display: none;
    }
    .skill-picker :global(.compact .skill-level) {
      font: 600 13px "DM Sans", sans-serif;
      color: var(--text);
    }
    .skill-picker :global(.compact .skill-level.unrecorded) {
      color: var(--muted);
      font-weight: 500;
    }
  }
  @media (max-width: 1000px) {
    .skill-picker {
      padding: 0;
      gap: 10px;
      border: 0;
      background: none;
      box-shadow: none;
      overflow: visible;
    }
    .picker-title {
      display: none;
    }
    .skill-picker :global(.search-field) {
      min-height: 44px;
    }
    .skill-picker :global(.compact .skill-tile.selected) {
      background: var(--panel-raised);
      box-shadow: inset 0 -2px 0 var(--gold);
    }
  }

  /* Header and progress */
  .skill-hero-main {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 18px;
    padding: 20px 22px;
  }
  .skill-hero-icon {
    flex: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 72px;
    height: 72px;
    background: #0d161c;
    border: 1px solid #3a4a55;
    border-radius: 3px;
  }
  .skill-hero-icon :global(.game-art) {
    width: 48px;
    height: 48px;
    object-fit: contain;
  }
  .skill-hero-copy {
    flex: 1 1 200px;
    min-width: 0;
  }
  .skill-hero-copy h1 {
    margin: 0;
    font:
      600 32px/38px "Cinzel",
      Georgia,
      serif;
    letter-spacing: 0.3px;
    color: var(--heading);
  }
  .skill-hero-copy p {
    margin: 2px 0 0;
    color: #c9d4da;
  }
  .skill-progress {
    flex: 0 1 240px;
    min-width: 0;
    display: flex;
    flex-direction: column;
    padding: 12px 14px;
    border: 1px solid #33434d;
    border-radius: 3px;
    background: var(--well);
  }
  .skill-progress-levels {
    font:
      600 28px/1.3 "Cinzel",
      Georgia,
      serif;
    letter-spacing: 0.3px;
    color: var(--heading);
  }
  .arrow {
    color: var(--gold);
  }
  .skill-progress-bar {
    height: 6px;
    margin: 6px 0;
    background: #0b1318;
    border: 1px solid #33434d;
    border-radius: 3px;
    overflow: hidden;
  }
  .skill-progress-bar > span {
    display: block;
    height: 100%;
    background: linear-gradient(90deg, #b89b65, #e5c892);
  }
  .level-update {
    margin-top: 6px;
  }
  .level-update > summary {
    display: inline-flex;
    align-items: center;
    min-height: 40px;
    color: var(--text);
    text-decoration: underline;
    text-underline-offset: 3px;
    cursor: pointer;
  }
  .level-update > summary:hover {
    color: var(--gold-bright);
  }
  .level-update :global(.level-form) {
    margin-top: 8px;
    flex-wrap: wrap;
  }
  .level-update :global(.level-form input) {
    max-width: 120px;
  }
  .skill-range {
    padding: 14px 22px 18px;
    border-top: 1px solid #2f3e48;
  }
  .skill-range :global(.choice-fieldset) {
    margin: 0;
  }
  .skill-lock {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  .skill-lock :global(.source-banner) {
    margin: 0;
    align-self: stretch;
  }

  /* Aside */
  .window-body {
    padding: 14px 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .skill-aside :global(.skill-pack .pack-row) {
    align-items: center;
    min-height: 44px;
    padding: 6px 10px;
    margin-bottom: 8px;
    border: 1px solid var(--edge);
    border-radius: 3px;
    background: var(--well);
  }
  .skill-aside :global(.skill-pack .pack-row input) {
    margin-top: 0;
    accent-color: var(--gold);
    width: 18px;
    height: 18px;
  }
  .skill-aside :global(.skill-where .training-map > h3) {
    display: none;
  }
  .skill-aside :global(.notes-card) {
    border-radius: 3px;
  }
  .training-access {
    border-top: 1px solid var(--line);
  }
  .training-access > summary {
    min-height: 44px;
    padding-block: 0.7rem;
    cursor: pointer;
    font-size: 0.875rem;
  }
  .training-access p {
    font-size: 0.875rem;
    line-height: 1.6;
  }
  .skill-actions {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }
  .skill-actions :global(.btn) {
    justify-content: center;
  }
  .training-completion {
    color: var(--green);
    margin: 0;
  }

  @media (max-width: 760px) {
    .skill-toolbar {
      display: none;
    }
    .skill-layout {
      gap: 16px;
    }
    .skill-centre,
    .skill-aside {
      gap: 16px;
    }
    .skill-hero-main {
      gap: 14px;
      padding: 16px;
    }
    .skill-hero-icon {
      width: 64px;
      height: 64px;
    }
    .skill-hero-copy {
      flex-basis: calc(100% - 78px);
    }
    .skill-hero-copy h1 {
      font-size: 28px;
      line-height: 32px;
    }
    .skill-progress {
      flex: 1 1 100%;
    }
    .skill-range {
      padding: 14px 16px 16px;
    }
    .skill-actions :global(.btn) {
      min-height: 48px;
    }
  }
</style>
