<script lang="ts">
  import {
    QUESTS,
    type Profile,
    type SkillRecord,
    type TrainingOption,
  } from "../../data";
  import type { EquipmentRecommendation } from "../../equipmentTypes";
  import type { GearPick, GearRowName, LevelGap } from "../../gearSelection";
  import {
    STYLE_SKILLS,
    equipmentLevels,
    gearRowLabel,
    trainingGear,
    type CombatClass,
  } from "../../trainingEquipment";
  import { wikiHref } from "../../wiki";
  import ChoiceStrip from "./ChoiceStrip.svelte";
  import GameArt from "./GameArt.svelte";
  import GameText from "./GameText.svelte";
  import GameWindow from "./GameWindow.svelte";
  let {
    skill,
    method,
    profile,
    defaultStyle = "melee",
    omitExtras = [],
  }: {
    /** Extras the caller already lists itself, so they aren't repeated. */
    omitExtras?: string[];
    skill: SkillRecord;
    method: TrainingOption;
    profile: Profile;
    /** The style shown until the player picks one (a Slayer task's fastest style). */
    defaultStyle?: CombatClass;
  } = $props();
  let picked = $state<CombatClass>();
  const style = $derived(picked ?? defaultStyle);
  const styleChoices = [
    { value: "melee", label: "Melee" },
    { value: "ranged", label: "Ranged" },
    { value: "magic", label: "Magic" },
    { value: "necromancy", label: "Necromancy" },
  ];
  const chooseStyle = $derived(STYLE_SKILLS.includes(skill.name));
  const gear = $derived(trainingGear(skill.name, method, profile, style));
  const extras = $derived(
    gear.extras.filter((item) => !omitExtras.includes(item.name)),
  );
  const showMinimum = $derived(gear.rows.some((row) => row.atLeast));
  const columns = $derived(showMinimum ? 4 : 3);
  // The 2h setup and the dual-wield setup are alternatives, so each gets its own group.
  const groups = $derived.by(() => {
    const of = (names: GearRowName[]) =>
      gear.rows.filter((row) => names.includes(row.row));
    return [
      { label: "Two-handed", rows: of(["2h"]) },
      { label: "Or dual wield", rows: of(["main hand", "off hand"]) },
      { label: "Armour", rows: of(["head", "body", "legs", "hands", "feet"]) },
      { label: "", rows: of(["tool"]) },
    ].filter((group) => group.rows.length);
  });
  const questTitle = (id: string) =>
    QUESTS.find((quest) => quest.id === id)?.name ?? id;
</script>

{#snippet gaps(label: string, levels: LevelGap[], quests: string[])}
  {#if levels.length || quests.length}<p class="gaps">
      <span class="gap-label">{label}</span>
      {#each levels as gap (gap.skill)}<span
          class="gap"
          class:unknown={gap.recorded === undefined}
          title={gap.recorded === undefined
            ? `${gap.skill} not recorded`
            : `Recorded ${gap.recorded}`}>{gap.skill} {gap.level}</span
        >{/each}
      {#each quests as quest (quest)}<span class="gap">{questTitle(quest)}</span
        >{/each}
    </p>{/if}
{/snippet}

{#snippet itemLink(item: { name: string; wiki: string; image?: string })}
  <a
    class="gear-item"
    href={wikiHref(item.wiki)}
    target="_blank"
    rel="noopener noreferrer"
    >{#if item.image}<GameArt file={item.image} size={32} />{/if}<span
      >{item.name}</span
    ></a
  >
{/snippet}

{#snippet pick(choice: GearPick)}
  {@render itemLink(choice.item)}
  <p class="route"><GameText text={choice.route.note} images={false} /></p>
  {#if choice.route.unlocks?.length}<p class="route">
      Needs: {choice.route.unlocks.join(" · ")}
    </p>{/if}
  {@render gaps("To wear", choice.missing, choice.missingQuests)}
  {@render gaps("To get", choice.routeMissing, choice.routeMissingQuests)}
{/snippet}

{#if gear.rows.length || extras.length || gear.note}
  <GameWindow title="Gear" trailing={method.title} className="training-equipment">
    <div class="gear-body">
      {#if chooseStyle}
        <ChoiceStrip
          label="Combat style"
          name={`equipment-style-${skill.name}`}
          value={style}
          choices={styleChoices}
          onChange={(value) => {
            picked = value as CombatClass;
          }}
        />
      {/if}
      {#if gear.note}<p class="cap"><GameText text={gear.note} /></p>{/if}
      {#if showMinimum && method.gear}<p class="cap">
          Wear at least is <span class="our-pick">our pick</span>: {method
            .gear.reason}
          <a href={wikiHref(method.wiki)} target="_blank" rel="noopener noreferrer"
            >Wiki</a
          >
        </p>{/if}
      {#if gear.rows.length}
        <table class="gear-table">
          <caption class="sr-only">Gear by slot for {method.title}</caption>
          <thead>
            <tr>
              <th scope="col">Slot</th>
              <th scope="col">Best you can have</th>
              <th scope="col">Easier to get</th>
              {#if showMinimum}<th scope="col">Wear at least</th>{/if}
            </tr>
          </thead>
          {#each groups as group (group.label)}
            <tbody>
              {#if group.label}<tr class="group-row"
                  ><th scope="rowgroup" colspan={columns}>{group.label}</th></tr
                >{/if}
              {#each group.rows as row (row.row)}
                <tr>
                  <th scope="row" class="slot">{gearRowLabel(row.row, skill.name)}</th>
                  {#if row.unrecorded}
                    <td class="record" colspan={columns - 1}>
                      <a href="/levels">Record your {row.unrecorded} level</a>
                    </td>
                  {:else}
                    <td data-label="Best you can have">
                      {#if row.best}{@render pick(row.best)}
                      {:else}<p class="cap">Nothing you can wear yet</p>{/if}
                      {#if row.next}<p class="next">
                          <span class="gap-label">Next</span>
                          <a
                            href={wikiHref(row.next.item.wiki)}
                            target="_blank"
                            rel="noopener noreferrer">{row.next.item.name}</a
                          >
                          {#each row.next.missing as gap (gap.skill)}<span
                              class="gap"
                              class:unknown={gap.recorded === undefined}
                              >{gap.skill} {gap.level}</span
                            >{/each}
                        </p>{/if}
                    </td>
                    <td data-label="Easier to get">
                      {#if row.easier}{@render pick(row.easier)}
                      {:else}<span class="none" aria-label="No easier item"
                          >—</span
                        >{/if}
                    </td>
                    {#if showMinimum}<td data-label="Wear at least">
                        {#if row.atLeast}<span class="our-pick">Our pick</span
                          >{@render pick(row.atLeast)}
                        {:else}<span class="none" aria-label="No minimum">—</span
                          >{/if}
                      </td>{/if}
                  {/if}
                </tr>
              {/each}
            </tbody>
          {/each}
        </table>
      {/if}
      {#if extras.length}
        <div class="extras">
          <h3>Also take</h3>
          <ul>
            {#each extras as item (item.name)}
              {@render extra(item)}
            {/each}
          </ul>
        </div>
      {/if}
    </div>
  </GameWindow>
{/if}

{#snippet extra(item: EquipmentRecommendation)}
  {@const missing = equipmentLevels(item, profile).filter(
    (check) => check.status !== "met",
  )}
  <li>
    {@render itemLink(item)}
    <p class="route"><GameText text={item.condition ?? item.note} /></p>
    {#if missing.length}<p class="gaps">
        <span class="gap-label">To use</span>
        {#each missing as gap (gap.skill)}<span
            class="gap"
            class:unknown={gap.status === "unknown"}>{gap.skill} {gap.level}</span
          >{/each}
      </p>{/if}
  </li>
{/snippet}

<style>
  .gear-body {
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding: 18px;
    min-width: 0;
  }
  .gear-body :global(.choice-fieldset) {
    margin: 0;
  }
  .cap {
    margin: 0;
    font-size: var(--font-caption);
    line-height: 1.5;
    color: var(--muted);
  }
  .gear-table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
  }
  .gear-table th,
  .gear-table td {
    padding: 10px 8px;
    vertical-align: top;
    text-align: left;
    border-top: 1px solid var(--line);
    overflow-wrap: break-word;
  }
  .gear-table thead th {
    border-top: 0;
    font-size: var(--font-caption);
    font-weight: 700;
    letter-spacing: 1.2px;
    text-transform: uppercase;
    color: var(--muted);
  }
  .gear-table thead th:first-child {
    width: 96px;
  }
  .group-row th {
    padding-top: 16px;
    font-size: var(--font-caption);
    font-weight: 700;
    color: var(--gold);
  }
  .slot {
    font-weight: 600;
  }
  .gear-item {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-height: 32px;
    color: inherit;
    text-decoration: underline;
    text-underline-offset: 3px;
    font-weight: 600;
  }
  .gear-item:hover {
    color: var(--gold-bright);
  }
  .gear-item :global(.game-art) {
    flex: none;
    width: 32px;
    height: 32px;
    object-fit: contain;
  }
  .route,
  .next,
  .gaps {
    margin: 4px 0 0;
    font-size: var(--font-caption);
    line-height: 1.45;
    color: var(--muted);
  }
  .next a {
    color: inherit;
    text-underline-offset: 3px;
  }
  .gaps,
  .next {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px 6px;
  }
  .gap-label {
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
  }
  .gap {
    padding: 1px 6px;
    border: 1px solid var(--warn);
    border-radius: 3px;
    color: var(--warn);
  }
  .gap.unknown {
    border-color: #425260;
    color: var(--muted);
  }
  .our-pick {
    display: inline-block;
    margin-right: 6px;
    font-size: var(--font-caption);
    font-weight: 700;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: var(--gold);
  }
  td > .our-pick {
    display: block;
  }
  .record a {
    color: var(--gold-bright);
    font-weight: 600;
    text-underline-offset: 3px;
  }
  .none {
    color: var(--muted);
  }
  .extras h3 {
    margin: 0 0 6px;
    font-size: var(--font-caption);
    letter-spacing: 1.2px;
    text-transform: uppercase;
    color: var(--muted);
  }
  .extras ul {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .extras li {
    padding: 8px 0;
    border-top: 1px solid var(--line);
  }
  @media (max-width: 639px) {
    .gear-body {
      padding: 14px;
    }
    .gear-table,
    .gear-table tbody,
    .gear-table tr,
    .gear-table th,
    .gear-table td {
      display: block;
      width: auto;
    }
    .gear-table thead {
      display: none;
    }
    .gear-table tr {
      padding: 10px 0;
      border-top: 1px solid var(--line);
    }
    .gear-table th,
    .gear-table td {
      border-top: 0;
      padding: 4px 0;
    }
    .group-row {
      border-top: 0;
    }
    .gear-table td[data-label]::before {
      content: attr(data-label);
      display: block;
      font-size: var(--font-caption);
      font-weight: 700;
      letter-spacing: 1px;
      text-transform: uppercase;
      color: var(--muted);
    }
  }
</style>
