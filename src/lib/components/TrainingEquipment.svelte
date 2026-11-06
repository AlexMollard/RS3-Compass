<script lang="ts">
  import {
    trainingRangeLabel,
    type Profile,
    type SkillRecord,
    type TrainingOption,
  } from "../../data";
  import type { EquipmentRecommendation } from "../../equipmentTypes";
  import {
    equipmentLevels,
    resolveTrainingEquipment,
    type CombatStyle,
  } from "../../trainingEquipment";
  import { wikiHref } from "../../wiki";
  import { WORN_LAYOUT, wornSlot } from "../wornSlots";
  import ChoiceStrip from "./ChoiceStrip.svelte";
  import GameArt from "./GameArt.svelte";
  import GameText from "./GameText.svelte";
  import GameWindow from "./GameWindow.svelte";
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
  // The first target item per worn slot fills the equipment screen.
  const worn = $derived.by(() => {
    const slots = new Map<string, EquipmentRecommendation>();
    for (const item of equipment?.target ?? []) {
      const slot = wornSlot(item.slot);
      if (slot && !slots.has(slot)) slots.set(slot, item);
    }
    return slots;
  });
</script>

{#snippet levels(
  item: Pick<EquipmentRecommendation, "levels">,
  label: string,
)}
  {#each equipmentLevels(item, profile) as check (check.skill)}
    <div class="req">
      <span class="req-label">{label}</span>
      <span
        class="lvl"
        class:miss={check.status === "below"}
        class:unknown={check.status === "unknown"}>{check.level}</span
      >
      <span class="req-skill"
        ><GameText text={check.skill} /> · recorded {check.recorded ??
          "?"}</span
      >
      {#if check.status === "met"}<span class="req-state met">✓ Met</span>
      {:else if check.status === "below"}<span class="req-state below"
          >▲ {check.level - (check.recorded ?? 0)} below</span
        >
      {:else}<span class="req-state unknown">Not recorded</span>{/if}
    </div>
  {/each}
{/snippet}

{#snippet equipmentRow(item: EquipmentRecommendation)}
  {@const routes = item.acquisition.filter(
    (route) => profile.mode === "members" || !route.members,
  )}
  <div class="kit-item">
    <a
      class="kit-name"
      href={wikiHref(item.wiki)}
      target="_blank"
      rel="noopener noreferrer"
    >
      <GameArt file={item.image} size={40} />
      <span
        ><strong>{item.name}</strong><small
          >{item.slot}{item.members ? " · Members" : ""}</small
        ></span
      >
    </a>
    {#if item.condition}<p class="unlock-check">
        <GameText text={item.condition} />
      </p>{/if}
    {#if item.levels?.length}{@render levels(item, "Use")}{/if}
    {#if item.unlocks?.length}<p class="unlock-check">
        Check unlock: <GameText text={item.unlocks.join(" · ")} />
      </p>{/if}
    {#if routes[0]}
      {@const route = routes[0]}
      {#if route.levels?.length}{@render levels(route, "Make")}{/if}
      {#if route.unlocks?.length}<p class="unlock-check">
          Check unlock: <GameText text={route.unlocks.join(" · ")} />
        </p>{/if}
      {#if !route.levels?.length}<p class="route-note">
          <strong><GameText text={route.label} />:</strong>
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
          <strong><GameText text={routes[0].label} />:</strong>
          <GameText text={routes[0].note} />
        </p>{/if}
      {#each routes.slice(1) as route}
        <div class="alternative-route">
          <strong><GameText text={route.label} /></strong>
          {@render levels(route, "Make")}
          {#if route.unlocks?.length}<p>
              Check unlock: <GameText text={route.unlocks.join(" · ")} />
            </p>{/if}
          <p><GameText text={route.note} /></p>
        </div>
      {/each}
    </details>
  </div>
{/snippet}

{#if equipment}
  <GameWindow
    title="Target kit"
    trailing={"For " +
      trainingRangeLabel(skill, stage, profile.mode).toLowerCase()}
    className="training-equipment"
  >
    <div class="kit-body">
      {#if worn.size}
        <div class="kit-doll">
          <div class="doll" aria-label="Worn equipment" role="group">
            {#each WORN_LAYOUT as row}
              {#each row as slot}
                {#if slot === null}<span></span>
                {:else}
                  {@const item = worn.get(slot)}
                  <span
                    class="eq"
                    class:full={item}
                    title={item ? item.name : undefined}
                    >{#if item}<GameArt file={item.image} size={28} />{/if}{slot}</span
                  >
                {/if}
              {/each}
            {/each}
          </div>
          <span class="cap">Only filled slots matter here</span>
        </div>
      {/if}
      <div class="kit-list">
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
        {#if equipment.note}<p class="cap">
            <GameText text={equipment.note} />
          </p>{/if}
        {#if equipment.planningLevel !== undefined && equipment.target.length}
          <p class="cap">
            Aim for this kit in the selected range; unmet checks show
            preparation gaps.
          </p>
        {/if}
        {#each equipment.target as item (item.slot + (item.condition ?? ""))}{@render equipmentRow(
            item,
          )}{/each}
        {#if currentAlternatives.length}<details
            class="equipment-group current-options"
          >
            <summary
              >Current-level alternatives <span
                >{currentAlternatives.length}</span
              ></summary
            >
            <p class="cap">
              Based on recorded use levels, not owned items or what you can
              craft.
            </p>
            {#each currentAlternatives as item (item.name)}{@render equipmentRow(
                item,
              )}{/each}
          </details>{/if}
        {#if equipment.upgrades.length}<details class="equipment-group">
            <summary
              >Other upgrades <span>{equipment.upgrades.length}</span></summary
            >
            {#each equipment.upgrades as item (item.name)}{@render equipmentRow(
                item,
              )}{/each}
          </details>{/if}
        {#if equipment.optional.length}<details class="equipment-group">
            <summary
              >Optional equipment <span>{equipment.optional.length}</span
              ></summary
            >
            {#each equipment.optional as item (item.name)}{@render equipmentRow(
                item,
              )}{/each}
          </details>{/if}
        <p class="cap">
          Suggestions, not a required minimum kit or proof of ownership. Check
          unlocks and combat risks.
        </p>
      </div>
    </div>
  </GameWindow>
{/if}

<style>
  .kit-body {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    gap: 24px;
    padding: 18px;
  }
  .kit-doll {
    flex: 0 0 196px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .doll {
    display: grid;
    grid-template-columns: repeat(3, 52px);
    gap: 8px;
    justify-content: center;
    padding: 12px;
    background: #3b3226;
    border: 1px solid #5a4b37;
    border-radius: 3px;
    box-shadow: inset 0 0 0 2px #1d1810;
  }
  .eq {
    aspect-ratio: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    padding: 2px;
    background: #2a231a;
    border: 1px solid #4a3e2e;
    border-radius: 3px;
    box-shadow: inset 0 2px 3px #00000070;
    font-size: 9px;
    line-height: 1.15;
    color: #b9a888;
    text-align: center;
  }
  .eq.full {
    border-color: var(--gold);
    background: #3a3020;
    color: #f3e6c7;
  }
  .eq :global(.game-art) {
    width: 26px;
    height: 22px;
    object-fit: contain;
  }
  .cap {
    margin: 0;
    font-size: var(--font-caption);
    line-height: 1.5;
    color: var(--muted);
  }
  .kit-doll > .cap {
    text-align: center;
  }
  .kit-list {
    flex: 1 1 260px;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 18px;
  }
  .kit-list :global(.choice-fieldset) {
    margin: 0;
  }
  .kit-name {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 44px;
    color: inherit;
    text-decoration: none;
  }
  .kit-name :global(.game-art) {
    flex: none;
    width: 40px;
    height: 40px;
    object-fit: contain;
    background: #0d161c;
    border: 1px solid #3a4a55;
    border-radius: 3px;
  }
  .kit-name strong {
    font-size: 15px;
    font-weight: 600;
    text-decoration: underline;
    text-underline-offset: 3px;
  }
  .kit-name:hover strong {
    color: var(--gold-bright);
  }
  .kit-name small {
    display: block;
    color: var(--muted);
    font-size: var(--font-caption);
    margin-top: 0.15rem;
  }
  .req {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 0;
    border-top: 1px solid #24323b;
  }
  .kit-name + .req,
  .kit-name + .unlock-check {
    margin-top: 8px;
  }
  .req-label {
    flex: none;
    width: 48px;
    font-size: var(--font-caption);
    font-weight: 700;
    letter-spacing: 1.55px;
    text-transform: uppercase;
    color: var(--muted);
  }
  .lvl {
    flex: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 34px;
    height: 28px;
    padding: 0 6px;
    border: 1px solid #63775d;
    border-radius: 3px;
    background: #31443b;
    font-weight: 600;
    font-size: 13px;
    color: #d6e2c4;
  }
  .lvl.miss {
    border-color: var(--warn);
    background: transparent;
    color: var(--warn);
  }
  .lvl.unknown {
    border-color: #425260;
    background: transparent;
    color: var(--muted);
  }
  .req-skill {
    flex: 1 1 auto;
    min-width: 0;
  }
  .req-state {
    flex: none;
    font-weight: 600;
    font-size: var(--font-caption);
  }
  .req-state.met {
    color: var(--green);
  }
  .req-state.below {
    color: var(--warn);
  }
  .req-state.unknown {
    color: var(--muted);
  }
  .unlock-check {
    margin: 0;
    padding: 6px 0;
    font-size: var(--font-caption);
    color: var(--gold);
  }
  .route-note,
  .equipment-detail p {
    margin-block: 0.25rem;
    font-size: var(--font-caption);
    color: var(--muted);
  }
  .equipment-detail summary {
    min-height: 32px;
    padding-block: 0.3rem;
    font-size: var(--font-caption);
    color: var(--muted);
    cursor: pointer;
  }
  .equipment-group {
    border-top: 1px solid #24323b;
  }
  .equipment-group > summary {
    min-height: 44px;
    padding-block: 0.7rem;
    font-weight: 600;
    cursor: pointer;
  }
  .equipment-group > summary span {
    color: var(--muted);
    font-weight: 500;
    margin-left: 0.35rem;
  }
  .equipment-group > .kit-item,
  .equipment-group > .cap {
    margin-bottom: 14px;
  }
  .alternative-route {
    padding-top: 0.65rem;
  }
  @media (max-width: 760px) {
    .kit-body {
      padding: 14px;
      gap: 14px;
    }
    .kit-doll {
      flex: 1 1 100%;
    }
    .req {
      gap: 8px;
    }
    .req-label {
      width: 44px;
    }
  }
</style>
