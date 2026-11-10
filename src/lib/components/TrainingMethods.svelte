<script lang="ts">
  import {
    availableTrainingOptions,
    trainingMethod,
    trainingRangeLabel,
    type Profile,
    type SkillRecord,
  } from "../../data";
  import { wikiHref } from "../../wiki";
  import GameArt from "./GameArt.svelte";
  import GameText from "./GameText.svelte";
  import GameWindow from "./GameWindow.svelte";
  import StatusChip from "./StatusChip.svelte";
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
  const rangeLabel = $derived(
    trainingRangeLabel(skill, stage, profile.mode) +
      (profile.mode === "members" ? " · Members" : " · F2P"),
  );
</script>

{#if selected}
  <div class="training-method-view">
    <GameWindow title="Method" trailing={rangeLabel}>
      <div class="method-body">
        <div
          class="method-cards"
          role="radiogroup"
          aria-label="Training method"
        >
          {#each options as option (option.id)}
            {@const isSelected = option.id === selected.id}
            {@const site = option.sites[0]}
            <label class="method-card" class:selected={isSelected}>
              <input
                type="radio"
                name={`training-method-${skill.name}`}
                value={option.id}
                checked={isSelected}
                aria-label={option.title}
                onchange={() => {
                  if (option.id !== selected.id) onSelect(option.id);
                }}
              />
              <GameArt file={option.image} size={56} />
              <span class="method-copy">
                <span class="method-title"
                  ><b>{option.title}</b>{#if site}{" · "}<a
                      href={wikiHref(site.wiki)}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={site.label + " on RuneScape Wiki (opens a new tab)"}
                      >{site.label}</a
                    >{/if}</span
                >
                {#if isSelected}<span class="method-description"
                    ><GameText text={option.method} /></span
                  >{/if}
              </span>
              {#if isSelected}<StatusChip tone="ok" label="Selected" />
              {:else if profile.mode === "members" && option.members && !stage.members}<StatusChip
                  label="Members"
                />{/if}
            </label>
          {/each}
        </div>
        <p class="method-benefit">
          <GameArt file={selected.image} size={28} />
          <span
            ><strong>Why it helps:</strong>
            <GameText text={selected.benefit} /></span
          >
        </p>
        {#if selected.risks}<p class="method-risk">
            <strong>Take care</strong>
            <GameText text={selected.risks} />
          </p>{/if}
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
        {#if stage.method || skill.payoff}<details class="training-guidance">
            <summary>Training setup and unlocks</summary>
            {#if stage.method}<p><GameText text={stage.method} /></p>{/if}
            <p><GameText text={skill.payoff} /></p>
          </details>{/if}
        <a
          class="method-wiki"
          href={wikiHref(selected.wiki)}
          target="_blank"
          rel="noopener noreferrer"
          >{selected.title} on RuneScape Wiki<span class="sr-only">
            (opens a new tab)</span
          ></a
        >
      </div>
    </GameWindow>
    <TrainingEquipment {skill} {stage} {profile} method={selected} />
  </div>
{/if}

<style>
  .training-method-view {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
  .method-body {
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding: 18px;
  }
  .method-cards {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .method-card {
    position: relative;
    display: flex;
    gap: 14px;
    align-items: flex-start;
    padding: 14px;
    border: 1px solid #33434d;
    border-radius: 4px;
    background: var(--well);
    cursor: pointer;
  }
  .method-card:hover {
    border-color: #8fa3b1;
  }
  .method-card.selected {
    border-color: var(--gold);
    background: var(--panel-raised);
    box-shadow: inset 0 -2px 0 var(--gold);
  }
  .method-card:has(input:focus-visible) {
    outline: 2px solid var(--gold-bright);
    outline-offset: 2px;
  }
  .method-card input {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    margin: 0;
    opacity: 0;
    cursor: pointer;
  }
  .method-card :global(.game-art) {
    flex: none;
    width: 56px;
    height: 56px;
    object-fit: contain;
    background: #0d161c;
    border: 1px solid #3a4a55;
    border-radius: 3px;
  }
  .method-copy {
    flex: 1 1 auto;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .method-title b {
    font-size: 16px;
    font-weight: 600;
  }
  /* Lift links above the radio overlay so they stay clickable. */
  .method-title a {
    position: relative;
    z-index: 1;
    color: var(--text);
  }
  .method-title a:hover {
    color: var(--gold-bright);
  }
  .method-description {
    color: #c9d4da;
    line-height: 1.6;
  }
  .method-description :global(a) {
    position: relative;
    z-index: 1;
  }
  .method-card > :global(.status-chip) {
    flex: none;
  }
  .method-benefit {
    display: flex;
    gap: 10px;
    align-items: flex-start;
    margin: 0;
    padding: 12px 14px;
    border: 1px solid #33434d;
    border-radius: 3px;
    background: var(--well);
    line-height: 1.6;
  }
  .method-benefit :global(.game-art) {
    flex: none;
    width: 28px;
    height: 28px;
    object-fit: contain;
  }
  .method-risk {
    margin: 0;
    line-height: 1.6;
    border-left: 2px solid var(--gold);
    padding-left: 0.75rem;
  }
  .method-risk > strong {
    color: var(--text);
    margin-right: 0.35rem;
  }
  .method-requirements,
  .training-guidance {
    border-top: 1px solid var(--line);
  }
  summary {
    min-height: 44px;
    padding-block: 0.65rem;
    font-weight: 600;
    cursor: pointer;
  }
  summary span {
    color: var(--muted);
    font-weight: 500;
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
  .method-wiki {
    align-self: flex-start;
    display: inline-flex;
    align-items: center;
    min-height: 40px;
    color: var(--text);
    text-underline-offset: 3px;
  }
  @media (max-width: 760px) {
    .method-body {
      padding: 14px;
    }
    .method-card {
      flex-wrap: wrap;
      gap: 12px;
    }
    .method-copy {
      flex-basis: calc(100% - 60px);
    }
    .method-card :global(.game-art) {
      width: 48px;
      height: 48px;
    }
  }
</style>
