<script lang="ts">
  import { SKILLS } from "../../data";
  import { widestGaps, type ComparedPlayer } from "../groupProgress";
  import { skillPath } from "../navigation";
  import GameWindow from "./GameWindow.svelte";
  import GameArt from "./GameArt.svelte";
  import StatusChip from "./StatusChip.svelte";

  let { players }: { players: ComparedPlayer[] } = $props();

  let gaps = $derived(
    widestGaps(
      players,
      SKILLS.map((s) => s.name),
    ),
  );
  let withoutLevels = $derived(
    players.filter((p) => !p.profile?.hiscoresLevels).map((p) => p.member.name),
  );
</script>

<GameWindow title="Widest gaps">
  {#if gaps.length}
    <ul class="gap-list">
      {#each gaps as gap (gap.skill)}
        {@const skill = SKILLS.find((s) => s.name === gap.skill)}
        <li>
          {#if skill}<GameArt file={skill.icon} size={28} />{/if}
          <span class="gap-text"
            ><a href={skillPath(gap.skill)}>{gap.skill}</a><br /><span
              class="caption"
              >{gap.leaders.join(", ")} {gap.highest} · {gap.trailing.join(", ")}
              {gap.lowest}</span
            ></span
          >
          <StatusChip tone="warn" label={String(gap.gap)} />
        </li>
      {/each}
    </ul>
  {:else}
    <p class="side-copy">
      No gaps to show yet. A skill needs published levels from at least two
      players that differ.
    </p>
  {/if}
  {#if withoutLevels.length}<p class="caption side-copy">
      {withoutLevels.join(", ")}
      {withoutLevels.length === 1 ? "has" : "have"} no published levels, so {withoutLevels.length ===
      1
        ? "they are"
        : "they are all"} left out of gaps.
    </p>{/if}
</GameWindow>

<style>
  .gap-list {
    list-style: none;
    margin: 0;
    padding: 6px 16px 8px;
  }
  .gap-list li {
    display: flex;
    gap: 10px;
    align-items: center;
    padding: 10px 0;
    border-bottom: 1px solid #24323b;
  }
  .gap-list li:last-child {
    border-bottom: 0;
  }
  .gap-text {
    flex: 1 1 auto;
    min-width: 0;
    overflow-wrap: anywhere;
  }
  .gap-text a {
    font-weight: 600;
    min-height: 24px;
    color: var(--gold-bright);
    text-underline-offset: 4px;
  }
  .caption {
    color: var(--muted);
    font-size: var(--font-caption);
    margin: 0;
  }
  .side-copy {
    margin: 0;
    padding: 12px 16px 14px;
    color: var(--muted);
    font-size: var(--font-ui);
  }
</style>
