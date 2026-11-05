<script lang="ts">
  import { goto } from "$app/navigation";
  import {
    SKILLS,
    availableStages,
    skillNeedsMembership,
    trainingStage,
    trainingMethod,
    trainingSupplies,
    trainingRangeLabel,
  } from "../../data";
  import { getCompass } from "../compassContext";
  import ActivityHeader from "../components/ActivityHeader.svelte";
  import Button from "../components/Button.svelte";
  import ChoiceStrip from "../components/ChoiceStrip.svelte";
  import GameArt from "../components/GameArt.svelte";
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
  const saveError = controller.storageError;
  let profile = $derived(
    $saved.profiles.find((p) => p.id === $saved.activeId) ?? $saved.profiles[0],
  );
  let skill = $derived(
    SKILLS.find((s) => s.name === selectedSkill) ?? SKILLS[0],
  );
  let search = $state("");
  let band = $state<number | null>(null);
  let methodId = $state<string | undefined>(undefined);
  let target = $state(20);
  let level = $state("");
  let message = $state("");
  let identity = $state("");
  $effect(() => {
    const key = profile.id + "::" + skill.name;
    if (key !== identity) {
      identity = key;
      band = null;
      methodId = undefined;
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
    needsMembership
      ? undefined
      : (stages.find((s) => s.from === band) ?? trainingStage(skill, profile)),
  );
  let method = $derived(trainingMethod(skill, profile, stage, methodId));
  let supplies = $derived(
    stage && method ? trainingSupplies(stage, method) : [],
  );
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
  function start() {
    if (!stage || !method || needsMembership) return;
    controller.updateProfile((p) => ({
      ...p,
      activeTask: "train-" + skill.name,
      trainingRanges: { ...p.trainingRanges, [skill.name]: stage!.from },
      trainingMethods: { ...p.trainingMethods, [skill.name]: method!.id },
      completedTasks: p.completedTasks.filter(
        (id) => id !== "train-" + skill.name,
      ),
    }));
    void goto("/play");
  }
  function switchMembers() {
    controller.updateProfile((p) => ({ ...p, mode: "members" }));
  }
</script>

<div class="skill-page page-enter">
  <PageHeading
    title="Skills"
    subtitle="Methods, equipment, and supplies for the selected skill."
    >{#snippet trailing()}<span class="badge badge-gold"
        ><GameArt file={skill.icon} size={16} />
        {profile.mode === "members" ? "Members view" : "F2P view"}</span
      >{/snippet}</PageHeading
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
        artwork={skill.artwork}
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
                onChange={(value) => {
                  band = Number(value);
                  methodId = undefined;
                }}
              />
              <TrainingMethods
                {skill}
                {stage}
                {profile}
                selectedId={methodId}
                onSelect={(id) => (methodId = id)}
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
          <aside class="training-preparation">
            {#if stage && method}
              <Button variant="primary" onclick={start}
                >Prepare training →</Button
              >
              <TrainingMap {method} {profile} />
              <details class="session-supplies">
                <summary
                  >Session supplies <span>{supplies.length}</span></summary
                >
                <ItemList items={supplies} />
              </details>
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
          </aside>
        </div>
      </div>
    </article>
  </div>
</div>

<style>
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
  .training-preparation > :global(.btn) {
    margin-block: 0 1rem;
    width: 100%;
  }
  .training-access p {
    font-size: 0.875rem;
    line-height: 1.6;
  }
  .training-access,
  .session-supplies {
    border-top: 1px solid var(--line);
    margin-top: 0.5rem;
  }
  .training-access > summary,
  .session-supplies > summary {
    min-height: 44px;
    padding-block: 0.7rem;
    cursor: pointer;
    font-size: 0.875rem;
  }
  .session-supplies summary span {
    color: var(--muted);
    margin-left: 0.35rem;
  }
</style>
