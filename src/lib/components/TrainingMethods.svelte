<script lang="ts">
  import {
    availableTrainingOptions,
    trainingMethod,
    type Profile,
    type SkillRecord,
  } from "../../data";
  import { wikiHref } from "../../wiki";
  import Button from "./Button.svelte";
  import GameArt from "./GameArt.svelte";
  import GameText from "./GameText.svelte";
  import LocationGallery from "./LocationGallery.svelte";
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
  <div
    class="training-options"
    role="group"
    aria-label="Training method choices"
  >
    {#each options as option (option.id)}
      <div class="training-choice" class:selected={selected.id === option.id}>
        <a
          class="training-target"
          href={wikiHref(option.wiki)}
          target="_blank"
          rel="noopener noreferrer"
          title={option.title + " on RuneScape Wiki (opens a new tab)"}
        >
          <GameArt file={option.image} size={36} />
          <span
            ><strong>{option.title}</strong><small
              >{option.members || stage.members
                ? "Members"
                : "Free-to-play"}</small
            ></span
          >
        </a>
        <Button
          variant="quiet"
          aria-label={"Choose " + option.title}
          aria-pressed={selected.id === option.id}
          onclick={() => {
            if (selected?.id !== option.id) onSelect(option.id);
          }}>{selected.id === option.id ? "Selected" : "Choose"}</Button
        >
      </div>
    {/each}
  </div>
  <div class="selected-training-method">
    <p><GameText text={selected.method} /></p>
    <dl class="training-facts">
      <div>
        <dt>Ironman benefit</dt>
        <dd><GameText text={selected.benefit} /></dd>
      </div>
      {#if selected.requirements?.length}
        <div>
          <dt>Check first</dt>
          <dd>
            <ul>
              {#each selected.requirements as requirement}<li>
                  <GameText text={requirement} />
                </li>{/each}
            </ul>
          </dd>
        </div>
      {/if}
      {#if selected.risks}<div class="training-risk">
          <dt>Take care</dt>
          <dd><GameText text={selected.risks} /></dd>
        </div>{/if}
    </dl>
    <LocationGallery locations={selected.locations} {profile} />
  </div>
{/if}

<style>
  .training-options {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 250px), 1fr));
    gap: 0.65rem;
    margin-block: 1rem;
  }
  .training-choice {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.65rem;
    padding: 0.75rem;
    border: 1px solid var(--line);
    background: var(--panel);
  }
  .training-choice.selected {
    border-color: var(--gold);
  }
  .training-target {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    min-width: 0;
    color: inherit;
    text-decoration: none;
  }
  .training-target :global(.game-art) {
    width: 36px;
    height: 48px;
  }
  .training-target strong {
    text-decoration: underline;
    text-underline-offset: 3px;
    text-decoration-color: var(--muted);
  }
  .training-target small {
    display: block;
    margin-top: 0.25rem;
    color: var(--muted);
    font-size: 0.8rem;
  }
  .training-choice :global(.btn) {
    flex-shrink: 0;
    min-height: 44px;
    padding-inline: 0.65rem;
  }
  .selected-training-method > p {
    line-height: 1.65;
  }
  .training-facts {
    display: grid;
    gap: 0.8rem;
    margin-block: 1rem 1.25rem;
  }
  .training-facts > div {
    padding-left: 0.85rem;
    border-left: 2px solid var(--line);
  }
  .training-facts dt {
    font-weight: 600;
    margin-bottom: 0.3rem;
  }
  .training-facts dd {
    margin: 0;
    line-height: 1.6;
    color: var(--muted);
  }
  .training-facts ul {
    margin: 0;
    padding-left: 1.1rem;
  }
  .training-facts li + li {
    margin-top: 0.3rem;
  }
  .training-facts .training-risk {
    border-color: var(--gold);
  }
</style>
