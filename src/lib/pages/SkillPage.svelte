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
  import { getCompass } from "../compassContext";
  import { questPath } from "../navigation";
  import ActivityNotes from "../components/ActivityNotes.svelte";
  import SectionHeading from "../components/SectionHeading.svelte";
  import ActivityHeader from "../components/ActivityHeader.svelte";
  import Button from "../components/Button.svelte";
  import ChoiceStrip from "../components/ChoiceStrip.svelte";
  import GameText from "../components/GameText.svelte";
  import ItemList from "../components/ItemList.svelte";
  import SkillGrid from "../components/SkillGrid.svelte";
  import PageHeading from "../components/PageHeading.svelte";
  import ResponsivePicker from "../components/ResponsivePicker.svelte";
  import SearchField from "../components/SearchField.svelte";
  import TrainingMethods from "../components/TrainingMethods.svelte";
  import TrainingMap from "../components/TrainingMap.svelte";
  import WikiAction from "../components/WikiAction.svelte";
  import PlayerStatistics from "../components/PlayerStatistics.svelte";
  let { selectedSkill = "" }: { selectedSkill?: string } = $props();
  const controller = getCompass();
  const saved = controller.state;
  const compact = controller.compact;
  const saveError = controller.storageError;
  let profile = $derived(
    $saved.profiles.find((p) => p.id === $saved.activeId) ?? $saved.profiles[0],
  );
  let skill = $derived(
    SKILLS.find((s) => s.name === selectedSkill) ?? SKILLS[0],
  );
  let search = $state("");
  let target = $state(20);
  let level = $state("");
  let message = $state("");
  let identity = $state("");
  $effect(() => {
    const key = profile.id + "::" + skill.name;
    if (key !== identity) {
      identity = key;
      const recorded = profile.levels[skill.name];
      target =
        recorded == null
          ? Math.min(
              skill.goal,
              profile.mode === "f2p"
                ? (skill.freeToPlayCap ?? skill.maxLevel)
                : skill.maxLevel,
            )
          : (targetOptions.find((value) => value > recorded) ??
            targetOptions.at(-1) ??
            skill.goal);
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
    supplies.filter((item) => profile.packed.includes(task + "::" + item)),
  );
  let done = $derived(profile.completedTasks.includes(task));
  let next = $derived(nextQuest(profile));
  let targetOptions = $derived.by(() => {
    const cap = profile.mode === "f2p" ? skill.freeToPlayCap : undefined;
    return [
      ...new Set([
        skill.goal,
        20,
        30,
        50,
        99,
        skill.maxLevel,
        ...stages.map((range) => range.to),
        ...(cap && cap > 0 ? [cap] : []),
      ]),
    ]
      .filter((value) => value <= (cap ?? skill.maxLevel))
      .sort((a, b) => a - b);
  });
  $effect(() => {
    if (targetOptions.length && !targetOptions.includes(target))
      target = targetOptions[0];
  });
  let filtered = $derived(
    SKILLS.filter((s) => s.name.toLowerCase().includes(search.toLowerCase())),
  );
  let ratio = $derived(
    current == null ? 0 : Math.min(100, Math.round((current / target) * 100)),
  );
  function saveLevel(event: SubmitEvent) {
    event.preventDefault();
    const n = Number(level);
    if (!Number.isInteger(n) || n < 1 || n > 120) {
      message = "Enter a whole level from 1 to 120.";
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
      packed: toggleItem(p.packed, task + "::" + item),
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
  <PageHeading
    title="Skills"
    subtitle="Methods, equipment, and supplies for the selected skill."
    >{#snippet trailing()}<div class="skill-workspace-controls">
        <span class="badge badge-gold"
          >{profile.mode === "members" ? "Members view" : "F2P view"}</span
        >
        <Button
          variant="quiet"
          className="compact-switch"
          aria-pressed={$compact}
          onclick={() => compact.update((value) => !value)}
        >
          {$compact ? "Expand workspace" : "Compact training"}
        </Button>
      </div>{/snippet}</PageHeading
  >
  <div class="journal-layout skill-layout">
    <ResponsivePicker label="Skill" selection={skill.name}
      ><aside class="panel journal-list">
        <div class="skill-picker-search">
          <SearchField
            label="Search skills"
            placeholder="Find a skill…"
            value={search}
            onChange={(v) => (search = v)}
          />
        </div>
        <SkillGrid
          skills={filtered}
          levels={profile.levels}
          selected={skill.name}
          compact
        />
        <div class="skill-picker-wiki">
          <WikiAction page={skill.wiki} label={skill.name + " on the Wiki"} />
        </div>
      </aside></ResponsivePicker
    >
    <article class="panel skill-detail">
      <ActivityHeader
        title={skill.name}
        wiki={skill.wiki}
        image={skill.icon}
        eyebrow={skill.category.toUpperCase()}
        >{#snippet meta()}<p>
            <GameText text={skill.description} />
          </p>{/snippet}</ActivityHeader
      >
      <div class="detail-body">
        <section class="skill-progress-card">
          <PlayerStatistics {profile} skill={skill.name} />
          <div class="skill-progress-top">
            <div>
              <span class="eyebrow">YOUR RECORDED LEVEL</span>
              <div class="big-level">
                {current ?? "—"}
                {#if targetOptions.length}<span>→ {target}</span>{/if}
              </div>
            </div>
            {#if targetOptions.length}<label class="target-selector"
                >Session target<select
                  aria-label="Training target"
                  bind:value={target}
                  >{#each targetOptions as n}<option value={n}>Level {n}</option
                    >{/each}</select
                ></label
              >{/if}
          </div>
          {#if targetOptions.length}<div class="progress-track">
              <span style:width={ratio + "%"}></span>
            </div>
            <div class="progress-caption">
              <span
                >{current == null
                  ? "Record your level to personalise the guide"
                  : current >= target
                    ? "Recorded level target reached"
                    : target - current + " levels to your target"}</span
              ><span>Level progress, not XP progress</span>
            </div>{/if}
          <form class="level-form" onsubmit={saveLevel}>
            <label
              >Update recorded level<input
                aria-label={skill.name + " level"}
                type="number"
                min="1"
                max="120"
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
        </section>
        <div class="training-workspace">
          <section class="training-content">
            {#if stage && method}
              <ChoiceStrip
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
              <TrainingMethods
                {skill}
                {stage}
                {profile}
                selectedId={method.id}
                onSelect={selectMethod}
              />
            {:else}
              <div class="notice">
                <div>
                  <strong
                    >{needsMembership
                      ? "Free-to-play access limit"
                      : "No training method in this view"}</strong
                  >
                  <p>
                    {needsMembership
                      ? skill.freeToPlayCap === 0
                        ? "This skill requires membership."
                        : `The free-to-play trial ends at level ${skill.freeToPlayCap}.`
                      : "Open the skill reference to review available training."}
                    Your recorded progress remains safe.
                  </p>
                  {#if needsMembership}<Button onclick={switchMembers}
                      >Switch to Members</Button
                    >{/if}
                </div>
              </div>
            {/if}
          </section>
          <aside class="training-preparation" aria-label="Training preparation">
            {#if stage && method}
              <section class="panel packing-card">
                <SectionHeading title="Before you go">
                  {#snippet aside()}{#if supplies.length}<span class="badge"
                        >{packedItems.length}/{supplies.length} packed</span
                      >{/if}{/snippet}
                </SectionHeading>
                {#if supplies.length}
                  <div
                    class="packing-progress"
                    role="progressbar"
                    aria-label="Packed supplies"
                    aria-valuemin={0}
                    aria-valuemax={supplies.length}
                    aria-valuenow={packedItems.length}
                  >
                    <span
                      style:width={(packedItems.length / supplies.length) *
                        100 +
                        "%"}
                    ></span>
                  </div>
                {/if}
                <ItemList
                  items={supplies}
                  checked={packedItems}
                  onToggle={toggleSupply}
                />
                <p class="sample-note">
                  Packing checks are manual; they do not read your bank or
                  inventory.
                </p>
              </section>
              <TrainingMap {method} {profile} />
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
            <div class="detail-actions">
              <Button
                variant={done ? "success" : "secondary"}
                aria-pressed={done}
                disabled={(!stage || !method || needsMembership) && !done}
                onclick={complete}
              >
                {done ? "Recorded complete · undo" : "Mark session complete"}
              </Button>
              {#if done && next}<Button
                  variant="link"
                  onclick={() => void goto(questPath(next!.id))}
                  >Open next quest →</Button
                >{/if}
            </div>
            {#if done}<p class="training-completion" role="status">
                Session recorded. Levels, XP and supplies are not changed.
              </p>{/if}
          </aside>
        </div>
      </div>
    </article>
  </div>
</div>

<style>
  .skill-workspace-controls {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 10px;
  }
  .training-preparation {
    display: grid;
    gap: 16px;
  }
  .training-preparation .packing-card {
    margin: 0;
  }
  .training-completion {
    color: var(--green);
    margin: 0;
  }
  .skill-detail {
    container: skill-detail / inline-size;
  }
  .skill-picker-search {
    position: sticky;
    top: 0;
    z-index: 1;
    padding-bottom: 12px;
    background: var(--panel);
  }
  .skill-picker-wiki {
    margin-top: 12px;
    padding-top: 8px;
    border-top: 1px solid var(--line);
  }
  .skill-picker-wiki :global(a) {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
  }
  @container skill-detail (min-width: 740px) {
    .training-workspace {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(220px, 0.5fr);
      gap: 1.5rem;
    }
  }
  @media (min-width: 1001px) {
    .skill-layout {
      grid-template-columns: minmax(280px, 340px) minmax(0, 1fr);
    }
    .skill-page :global(.guide-picker) {
      position: sticky;
      top: calc(var(--topbar-height, 72px) + 16px);
      max-height: calc(100dvh - var(--topbar-height, 72px) - 32px);
      align-self: start;
      overflow-y: auto;
      overscroll-behavior: contain;
    }
  }
  @media (max-width: 1000px) {
    :global(.skill-layout .journal-list) {
      max-height: 60dvh;
      overflow-y: auto;
    }
  }
  .training-content,
  .training-preparation {
    min-width: 0;
  }
  .training-preparation {
    padding-top: 0;
    align-self: start;
  }
  .training-access p {
    font-size: 0.875rem;
    line-height: 1.6;
  }
  .training-access {
    border-top: 1px solid var(--line);
    margin-top: 0.5rem;
  }
  .training-access > summary {
    min-height: 44px;
    padding-block: 0.7rem;
    cursor: pointer;
    font-size: 0.875rem;
  }
</style>
