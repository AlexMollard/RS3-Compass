<script lang="ts">
  import {
    availableTrainingOptions,
    trainingMethod,
    type Profile,
    type SkillRecord,
  } from "../../data";
  import { wikiHref } from "../../wiki";
  import ChoiceStrip from "./ChoiceStrip.svelte";
  import GameArt from "./GameArt.svelte";
  import GameText from "./GameText.svelte";
  import TrainingEquipment from "./TrainingEquipment.svelte";
  let {
    skill,
    stage,
    profile,
    selectedId,
    onSelect,
  }: {
    skill: SkillRecord;
    stage: SkillRecord["stages"][number];
    profile: Profile;
    selectedId?: string;
    onSelect: (id: string) => void;
  } = $props();
  const options = $derived(availableTrainingOptions(stage, profile.mode));
  const selected = $derived(trainingMethod(skill, profile, stage, selectedId));
</script>

{#if selected}
  <div class="training-method-view">
    {#if options.length > 1}
      <ChoiceStrip
        label="Training method"
        name={`training-method-${skill.name}`}
        value={selected.id}
        choices={options.map((option) => ({
          value: option.id,
          label: option.title,
          image: option.image,
          detail:
            profile.mode === "members" && option.members && !stage.members
              ? "Members"
              : undefined,
        }))}
        onChange={onSelect}
      />
    {/if}
    <a
      class="selected-target"
      href={wikiHref(selected.wiki)}
      target="_blank"
      rel="noopener noreferrer"
      title={selected.title + " on RuneScape Wiki (opens a new tab)"}
    >
      <GameArt file={selected.image} size={48} />
      <strong>{selected.title}</strong>
    </a>
    <p class="method-description"><GameText text={selected.method} /></p>
    <p class="method-benefit">
      <strong>Ironman benefit</strong>
      <GameText text={selected.benefit} />
    </p>
    {#if selected.requirements?.length}
      <details class="method-requirements">
        <summary
          >Access requirements <span>{selected.requirements.length}</span
          ></summary
        >
        <ul>
          {#each selected.requirements as requirement}<li>
              <GameText text={requirement} />
            </li>{/each}
        </ul>
      </details>
    {/if}
    {#if selected.risks}<p class="method-risk">
        <strong>Take care</strong>
        <GameText text={selected.risks} />
      </p>{/if}
    <TrainingEquipment {skill} {profile} method={selected} />
    {#if stage.method || skill.payoff}<details class="training-guidance">
        <summary>Training setup and unlocks</summary>
        {#if stage.method}<p><GameText text={stage.method} /></p>{/if}
        <p><GameText text={skill.payoff} /></p>
      </details>{/if}
  </div>
{/if}

<style>
  .selected-target {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    color: inherit;
    text-decoration: underline;
    text-underline-offset: 3px;
    margin-block: 0.5rem 0.65rem;
  }
  .selected-target :global(.game-art) {
    width: 48px;
    height: 56px;
  }
  .method-description,
  .method-benefit,
  .method-risk {
    line-height: 1.6;
    margin-block: 0.65rem;
  }
  .method-benefit {
    color: var(--muted);
  }
  .method-benefit > strong,
  .method-risk > strong {
    color: var(--text);
    margin-right: 0.35rem;
  }
  .method-risk {
    border-left: 2px solid var(--gold);
    padding-left: 0.75rem;
  }
  .method-requirements,
  .training-guidance {
    margin-top: 0.65rem;
  }
  summary {
    min-height: 44px;
    padding-block: 0.65rem;
  }
  summary span {
    color: var(--muted);
    margin-left: 0.35rem;
  }
  ul {
    margin-block: 0.25rem 0.75rem;
    padding-left: 1.25rem;
    color: var(--muted);
    line-height: 1.6;
  }
  .training-guidance p {
    color: var(--muted);
    line-height: 1.6;
  }
</style>
