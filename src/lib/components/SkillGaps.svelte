<script lang="ts">
  import { SKILLS, skillByName } from "../../data";
  import {
    widestGaps,
    type ComparedPlayer,
    type SkillGap,
  } from "../groupProgress";
  import { skillPath } from "../navigation";
  import GameWindow from "./GameWindow.svelte";
  import GameArt from "./GameArt.svelte";
  import StatusChip from "./StatusChip.svelte";
  import Button from "./Button.svelte";

  let { players }: { players: ComparedPlayer[] } = $props();

  const SHOWN = 5;
  const compactFormat = new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  });
  const compact = (n: number) => compactFormat.format(n).toLowerCase();

  let gaps = $derived(
    widestGaps(
      players,
      SKILLS.map((s) => s.name),
    ),
  );
  let showAll = $state(false);
  let shown = $derived(showAll ? gaps : gaps.slice(0, SHOWN));
  let withoutLevels = $derived(
    players.filter((p) => !p.profile?.hiscoresLevels).map((p) => p.member.name),
  );

  /** Players marked on a 1-to-max level track; the top player by XP, or by level without it. */
  function standings(gap: SkillGap) {
    const max = skillByName(gap.skill)?.maxLevel ?? 99;
    const at = (level: number) =>
      Math.min(100, Math.max(0, ((level - 1) / (max - 1)) * 100));
    const score = (p: SkillGap["players"][number]) =>
      gap.xpGap === undefined ? p.level : p.xp!;
    const best = Math.max(...gap.players.map(score));
    const levels = gap.players.map((p) => p.level);
    return {
      from: at(Math.min(...levels)),
      to: at(Math.max(...levels)),
      players: gap.players.map((p) => ({
        ...p,
        at: at(p.level),
        top: score(p) === best,
      })),
    };
  }
</script>

<GameWindow title="Widest gaps">
  {#if gaps.length}
    <ul class="gap-list">
      {#each shown as gap (gap.skill)}
        {@const skill = skillByName(gap.skill)}
        {@const view = standings(gap)}
        <li>
          <div class="gap-head">
            {#if skill}<GameArt file={skill.icon} size={28} />{/if}
            <span class="gap-text"
              ><a href={skillPath(gap.skill)}>{gap.skill}</a><br /><span
                class="caption"
                >{gap.levelGap
                  ? `${gap.levelGap} ${gap.levelGap === 1 ? "level" : "levels"} apart`
                  : "Same level"}</span
              ></span
            >
            <StatusChip
              tone="warn"
              label={gap.xpGap === undefined
                ? `${gap.levelGap} lv`
                : `${compact(gap.xpGap)} XP`}
            />
          </div>
          <div class="track" aria-hidden="true">
            <span
              class="range"
              style:left="{view.from}%"
              style:width="{view.to - view.from}%"
            ></span>
            {#each view.players as p (p.name)}<span
                class="marker"
                class:top={p.top}
                style:left="{p.at}%"
              ></span>{/each}
          </div>
          <ul class="gap-players">
            {#each view.players as p (p.name)}
              <li class:top={p.top}>
                <span class="who" title={p.name}>{p.name}</span>
                <span class="value"
                  >{p.xp === undefined
                    ? p.level
                    : `${p.level} · ${compact(p.xp)} XP`}</span
                >
              </li>
            {/each}
          </ul>
        </li>
      {/each}
    </ul>
    {#if gaps.length > SHOWN}
      <div class="more">
        <Button
          variant="quiet"
          aria-expanded={showAll}
          onclick={() => (showAll = !showAll)}
          >{showAll ? "Show fewer gaps" : `Show all ${gaps.length} gaps`}</Button
        >
      </div>
    {/if}
  {:else}
    <p class="side-copy">
      No gaps to show yet. A skill needs published levels from at least two
      players whose level or XP differs.
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
  .gap-list > li {
    padding: 10px 0 12px;
    border-bottom: 1px solid #24323b;
  }
  .gap-list > li:last-child {
    border-bottom: 0;
  }
  .gap-head {
    display: flex;
    gap: 10px;
    align-items: center;
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
  .track {
    position: relative;
    height: 6px;
    margin: 10px 5px 8px;
    border-radius: 3px;
    background: var(--well);
  }
  .range {
    position: absolute;
    top: 0;
    bottom: 0;
    border-radius: 3px;
    background: color-mix(in srgb, var(--gold-bright) 35%, transparent);
  }
  .marker {
    position: absolute;
    top: 50%;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    transform: translate(-50%, -50%);
    background: var(--muted);
    border: 2px solid var(--panel);
  }
  .marker.top {
    background: var(--gold-bright);
  }
  .gap-players {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 2px;
    font-size: var(--font-caption);
    color: var(--muted);
  }
  .gap-players li {
    display: flex;
    justify-content: space-between;
    gap: 8px;
  }
  .gap-players li.top {
    color: var(--gold-bright);
  }
  .who {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .value {
    flex: none;
    font-variant-numeric: tabular-nums;
  }
  .more {
    padding: 0 16px 12px;
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
