<script lang="ts">
  import type { Profile, SkillRecord, TrainingOption } from "../../data";
  import type { EquipmentRecommendation } from "../../equipmentTypes";
  import {
    equipmentLevels,
    resolveTrainingEquipment,
    type CombatStyle,
  } from "../../trainingEquipment";
  import { wikiHref } from "../../wiki";
  import ChoiceStrip from "./ChoiceStrip.svelte";
  import GameArt from "./GameArt.svelte";
  import GameText from "./GameText.svelte";
  let {
    skill,
    stage,
    method,
    profile,
  }: {
    skill: SkillRecord;
    stage: SkillRecord["stages"][number];
    method: TrainingOption;
    profile: Profile;
  } = $props();
  let style = $state<CombatStyle>("Attack");
  const styleChoices = [
    { value: "Attack", label: "Melee" },
    { value: "Ranged", label: "Ranged" },
    { value: "Magic", label: "Magic" },
    { value: "Necromancy", label: "Necromancy" },
  ];
  const chooseStyle = $derived(
    ["Defence", "Constitution", "Slayer"].includes(skill.name),
  );
  const equipment = $derived(
    resolveTrainingEquipment(skill, stage, method, profile, style),
  );
  const currentAlternatives = $derived(
    equipment?.current.filter(
      (item) => !equipment.target.some((target) => target.name === item.name),
    ) ?? [],
  );
</script>

{#snippet levels(item: Pick<EquipmentRecommendation, "levels">)}
  {#each equipmentLevels(item, profile) as check (check.skill)}
    <span
      class:below={check.status === "below"}
      class:unknown={check.status === "unknown"}
    >
      <GameText text={`${check.level} ${check.skill}`} />
      <small
        >{check.status === "unknown"
          ? "· unrecorded"
          : `· recorded ${check.recorded}${check.status === "below" ? " — below" : ""}`}</small
      >
    </span>
  {/each}
{/snippet}

{#snippet equipmentRow(item: EquipmentRecommendation)}
  {@const routes = item.acquisition.filter(
    (route) => profile.mode === "members" || !route.members,
  )}
  <div class="equipment-row">
    <a
      class="equipment-name"
      href={wikiHref(item.wiki)}
      target="_blank"
      rel="noopener noreferrer"
    >
      <GameArt file={item.image} size={32} />
      <span
        ><strong>{item.name}</strong><small
          >{item.slot}{item.members ? " · Members" : ""}</small
        ></span
      >
    </a>
    <div class="equipment-requirements">
      {#if item.condition}<p class="unlock-check">
          <GameText text={item.condition} />
        </p>{/if}
      {#if item.levels?.length}<div class="requirement-line">
          <span class="requirement-label">Use</span>
          <div class="level-checks">{@render levels(item)}</div>
        </div>{/if}
      {#if item.unlocks?.length}<p class="unlock-check">
          Check unlock: <GameText text={item.unlocks.join(" · ")} />
        </p>{/if}
      {#if routes[0]}
        {@const route = routes[0]}
        <div class="requirement-line acquisition">
          <span class="requirement-label"><GameText text={route.label} /></span>
          <div class="level-checks">{@render levels(route)}</div>
        </div>
        {#if route.unlocks?.length}<p class="unlock-check">
            Check unlock: <GameText text={route.unlocks.join(" · ")} />
          </p>{/if}
        {#if !route.levels?.length}<p class="route-note">
            <GameText text={route.note} />
          </p>{/if}
      {/if}
      <details class="equipment-detail">
        <summary
          >{routes.length > 1
            ? "Other routes and item details"
            : "Item details"}</summary
        >
        <p><GameText text={item.note} /></p>
        {#if routes[0]?.levels?.length}<p>
            <strong>{routes[0].label}:</strong>
            <GameText text={routes[0].note} />
          </p>{/if}
        {#each routes.slice(1) as route}
          <div class="alternative-route">
            <strong><GameText text={route.label} /></strong>
            <div class="level-checks">{@render levels(route)}</div>
            {#if route.unlocks?.length}<p>
                Check unlock: <GameText text={route.unlocks.join(" · ")} />
              </p>{/if}
            <p><GameText text={route.note} /></p>
          </div>
        {/each}
      </details>
    </div>
  </div>
{/snippet}

{#if equipment}
  <section class="training-equipment" aria-label="Recommended equipment">
    <h3>
      {equipment.planningLevel === undefined
        ? "Recommended equipment"
        : "Recommended target kit"}
    </h3>
    {#if chooseStyle}
      <ChoiceStrip
        label="Equipment combat style"
        name={`equipment-style-${skill.name}`}
        value={style}
        choices={styleChoices}
        onChange={(value) => {
          style = value as CombatStyle;
        }}
      />
    {/if}
    {#if equipment.note}<p class="equipment-guide-note">
        <GameText text={equipment.note} />
      </p>{/if}
    {#if equipment.planningLevel !== undefined && equipment.target.length}
      <p class="equipment-guide-note">
        Aim for this kit in the selected range; unmet checks show preparation
        gaps.
      </p>
    {/if}
    <div class="equipment-list">
      {#each equipment.target as item (item.slot + (item.condition ?? ""))}{@render equipmentRow(
          item,
        )}{/each}
    </div>
    {#if currentAlternatives.length}<details
        class="equipment-group current-options"
      >
        <summary
          >Current-level alternatives <span>{currentAlternatives.length}</span
          ></summary
        >
        <p class="equipment-guide-note">
          Based on recorded use levels, not owned items or what you can craft.
        </p>
        {#each currentAlternatives as item (item.name)}{@render equipmentRow(
            item,
          )}{/each}
      </details>{/if}
    {#if equipment.upgrades.length}<details class="equipment-group">
        <summary
          >Other equipment upgrades
          <span>{equipment.upgrades.length}</span></summary
        >
        {#each equipment.upgrades as item (item.name)}{@render equipmentRow(
            item,
          )}{/each}
      </details>{/if}
    {#if equipment.optional.length}<details class="equipment-group">
        <summary
          >Optional equipment <span>{equipment.optional.length}</span></summary
        >
        {#each equipment.optional as item (item.name)}{@render equipmentRow(
            item,
          )}{/each}
      </details>{/if}
    <p class="ownership-note">
      Suggestions, not a required minimum kit or proof of ownership. Check
      unlocks and combat risks.
    </p>
  </section>
{/if}

<style>
  .training-equipment {
    margin-top: 1.4rem;
    border-top: 1px solid var(--line);
    padding-top: 1rem;
  }
  h3 {
    font-size: 1rem;
    margin-bottom: 0.6rem;
  }
  .equipment-guide-note,
  .ownership-note {
    color: var(--muted);
    font-size: 0.85rem;
    line-height: 1.5;
  }
  .equipment-guide-note {
    margin-bottom: 0.65rem;
  }
  .equipment-list {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 260px), 1fr));
    gap: 0 1rem;
  }
  .equipment-row {
    padding-block: 0.8rem;
    border-bottom: 1px solid var(--line);
  }
  .equipment-name {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    color: inherit;
    text-decoration: none;
  }
  .equipment-name strong {
    text-decoration: underline;
    text-underline-offset: 3px;
  }
  .equipment-name small {
    display: block;
    color: var(--muted);
    font-size: 0.8rem;
    margin-top: 0.15rem;
  }
  .equipment-name :global(.game-art) {
    width: 32px;
    height: 32px;
  }
  .equipment-requirements {
    margin-left: 2.65rem;
    margin-top: 0.35rem;
    font-size: 0.85rem;
    line-height: 1.55;
  }
  .requirement-line {
    display: flex;
    gap: 0.55rem;
    align-items: baseline;
    flex-wrap: wrap;
  }
  .requirement-label {
    color: var(--muted);
    min-width: 2.6rem;
  }
  .level-checks {
    display: flex;
    gap: 0.4rem 0.9rem;
    flex-wrap: wrap;
  }
  .level-checks > span {
    display: inline;
  }
  .level-checks small {
    color: var(--muted);
    font-size: inherit;
  }
  .below,
  .below small,
  .unlock-check {
    color: var(--gold);
  }
  .unknown {
    color: var(--muted);
  }
  .route-note,
  .equipment-detail p {
    color: var(--muted);
    margin-block: 0.25rem;
  }
  .equipment-detail summary {
    min-height: 32px;
    padding-block: 0.3rem;
    color: var(--muted);
  }
  .equipment-group {
    border-bottom: 1px solid var(--line);
  }
  .equipment-group > summary {
    min-height: 44px;
    padding-block: 0.7rem;
  }
  .equipment-group > summary span {
    color: var(--muted);
    margin-left: 0.35rem;
  }
  .alternative-route {
    padding-top: 0.65rem;
  }
  .ownership-note {
    margin-top: 0.65rem;
  }
</style>
