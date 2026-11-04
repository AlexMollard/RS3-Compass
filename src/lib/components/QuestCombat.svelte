<script lang="ts">
  import { ExternalLink } from "@lucide/svelte";
  import type { QuestRecord } from "../../data";
  import { QUEST_COMBAT, type QuestEnemy } from "../../combatData";
  import { wikiHref } from "../../wiki";
  import GameArt from "./GameArt.svelte";
  import GameText from "./GameText.svelte";
  import SectionHeading from "./SectionHeading.svelte";
  import "../../QuestCombat.css";
  let { quest }: { quest: QuestRecord } = $props();
  let plan = $derived(QUEST_COMBAT[quest.id]);
</script>

{#snippet enemies(list: QuestEnemy[])}
  <ul class="quest-enemies">
    {#each list as enemy (enemy.wiki)}
      <li>
        <a
          href={wikiHref(enemy.wiki)}
          target="_blank"
          rel="noreferrer"
          class="quest-enemy-reference"
        >
          <GameArt file={enemy.image} size={36} thumbnail />
          <span
            ><strong>{enemy.name}</strong><small
              >Combat level {enemy.level}</small
            ></span
          >
          <ExternalLink size={14} />
        </a>
      </li>
    {/each}
  </ul>
{/snippet}
<section class="detail-section quest-combat" aria-label="Combat and danger">
  <SectionHeading title="Combat and danger" />
  {#if plan.required.length}<h4>Required fights</h4>
    {@render enemies(plan.required)}{:else}<p class="combat-no-fights">
      No required kills.
    </p>{/if}
  {#if plan.hazards.length}<h4>Dangerous or optional encounters</h4>
    {@render enemies(plan.hazards)}{/if}
  {#if plan.notes.length}<ul class="combat-notes">
      {#each plan.notes as note (note)}<li><GameText text={note} /></li>{/each}
    </ul>{/if}
</section>
