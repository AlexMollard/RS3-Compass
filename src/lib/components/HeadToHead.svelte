<script lang="ts">
  import type { Snippet } from "svelte";
  import { SKILL_GAME_ORDER } from "../../skillNames";
  import type { Profile } from "../../data";
  import { leadSplit, statStandings } from "../groupProgress";
  import { playerColour } from "../playerColours";
  import GameWindow from "./GameWindow.svelte";
  import PlayerPortrait from "./PlayerPortrait.svelte";

  let {
    profiles,
    status,
  }: {
    profiles: Profile[];
    /** Each player's freshness chip, drawn under their name. */
    status: Snippet<[Profile]>;
  } = $props();

  const fullFormat = new Intl.NumberFormat("en");
  const compactFormat = new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  });
  const full = (n: number) => fullFormat.format(n);
  const compact = (n: number) => compactFormat.format(n).toLowerCase();
  const completed = (p: Profile) =>
    p.questProgress?.records.filter((r) => r.status === "COMPLETED").length;

  /** One row per stat; `gap` words the distance behind the best value. */
  const STATS: {
    label: string;
    value: (p: Profile) => number | undefined;
    show?: (n: number) => string;
    /** A shorter form for narrow screens; the full value stays in the title and for screen readers. */
    brief?: (n: number) => string;
    gap?: (n: number) => string;
    lowerIsBetter?: boolean;
  }[] = [
    { label: "Total level", value: (p) => p.statistics?.overall.level },
    {
      label: "Total XP",
      value: (p) => p.statistics?.overall.xp,
      brief: compact,
      gap: (n) => "−" + compact(n),
    },
    { label: "Quest points", value: (p) => p.questProgress?.questPoints },
    { label: "Quests completed", value: completed },
    {
      label: "Overall rank",
      value: (p) => p.statistics?.overall.rank,
      gap: (n) => full(n) + " places lower",
      lowerIsBetter: true,
    },
  ];

  let rows = $derived(
    STATS.map((stat) => {
      const values = profiles.map(stat.value);
      const standings = statStandings(values, stat.lowerIsBetter);
      return {
        label: stat.label,
        cells: values.map((value, i) => {
          const s = standings[i];
          return {
            value,
            text: value === undefined ? "Not recorded" : (stat.show ?? full)(value),
            brief: value === undefined || !stat.brief ? undefined : stat.brief(value),
            best: s.best,
            note: s.best
              ? s.tied
                ? "Tied"
                : "Leads"
              : s.behind === undefined
                ? ""
                : (stat.gap ?? ((n: number) => "−" + full(n)))(s.behind),
          };
        }),
      };
    }),
  );

  let ranked = $derived(profiles.filter((p) => p.hiscoresLevels).length);
  let leads = $derived(leadSplit(profiles, SKILL_GAME_ORDER));
  let segments = $derived([
    ...profiles.flatMap((p, i) =>
      leads.sole[i] === undefined
        ? []
        : [
            {
              label: `${p.name} alone`,
              summary: `${p.name} leads alone in`,
              skills: leads.sole[i]!,
              colour: playerColour(i),
            },
          ],
    ),
    {
      label: "Tied at the top",
      summary: "Tied at the top in",
      skills: leads.tied,
      colour: "#4b5f6d",
    },
  ]);
  let counted = $derived(segments.reduce((sum, s) => sum + s.skills.length, 0));
  /** The segment being hovered, focused or tapped; its skills are listed under the bar. */
  let active = $state<string | undefined>();
  let shown = $derived(segments.find((s) => s.label === active));
  const pick = (label: string) => (active = active === label ? undefined : label);
</script>

<GameWindow title="Head to head" trailing="Gold marks the leader">
  <div class="h2h" style:--players={profiles.length}>
    <div class="grid" role="table" aria-label="Totals compared">
      <div class="row head" role="row">
        <!-- The label column's header keeps its grid cell; only its text is hidden. -->
        <span role="columnheader"><span class="sr-only">Stat</span></span>
        {#each profiles as profile, i (profile.id)}
          <div class="player" role="columnheader" style:--player={playerColour(i)}>
            <div class="identity">
              <PlayerPortrait name={profile.name} size={40} />
              <div class="who">
                <a
                  class="name"
                  href={"/activity?player=" + encodeURIComponent(profile.id)}
                  >{profile.name}</a
                >
                <span class="kind">{profile.kind}</span>
              </div>
            </div>
            <div class="status">{@render status(profile)}</div>
          </div>
        {/each}
      </div>
      {#each rows as row (row.label)}
        <div class="row" role="row">
          <span class="label" role="rowheader">{row.label}</span>
          {#each row.cells as cell, i (i)}
            <span class="cell" role="cell" class:best={cell.best}>
              <strong class:unknown={cell.value === undefined} title={cell.brief ? cell.text : undefined}
                >{#if cell.brief}<span class="long">{cell.text}</span><span class="brief" aria-hidden="true"
                    >{cell.brief}</span
                  >{:else}{cell.text}{/if}</strong
              >
              {#if cell.note}<span class="note">{cell.note}</span>{/if}
            </span>
          {/each}
        </div>
      {/each}
    </div>
    {#if ranked >= 2 && counted}
      <div class="leads">
        <div class="leads-head">
          <h3>Who leads each skill</h3>
          <span class="caption">By level, over the {counted} skills every player publishes</span>
        </div>
        <!-- Pointer-only shortcut; the legend buttons below give keyboard and screen-reader access. -->
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <div
          class="bar"
          class:focused={shown}
          role="img"
          aria-label={segments.map((s) => `${s.label} ${s.skills.length}`).join(", ")}
          onpointerleave={(e) => e.pointerType === "mouse" && (active = undefined)}
        >
          {#each segments as s (s.label)}{#if s.skills.length}<!-- svelte-ignore a11y_no_static_element_interactions --><span
                class:on={active === s.label}
                style:flex-grow={s.skills.length}
                style:background={s.colour}
                onpointerenter={(e) => e.pointerType === "mouse" && (active = s.label)}
                onclick={() => pick(s.label)}
              ></span>{/if}{/each}
        </div>
        <ul class="legend">
          {#each segments as s (s.label)}
            <li>
              <button
                type="button"
                class:on={active === s.label}
                class:dim={shown && active !== s.label}
                aria-pressed={active === s.label}
                disabled={!s.skills.length}
                onpointerenter={(e) => e.pointerType === "mouse" && (active = s.label)}
                onpointerleave={(e) => e.pointerType === "mouse" && (active = undefined)}
                onclick={() => pick(s.label)}
              >
                <span class="dot" style:background={s.colour} aria-hidden="true"></span>{s.label}
                <strong>{s.skills.length}</strong>
              </button>
            </li>
          {/each}
        </ul>
        <p class="detail" aria-live="polite">
          {#if shown}
            <span class="dot" style:background={shown.colour} aria-hidden="true"></span>
            <span><strong>{shown.summary} {shown.skills.length}:</strong> {shown.skills.join(", ")}</span>
          {:else}
            <span class="hint">Hover or tap a segment to see its skills</span>
          {/if}
        </p>
      </div>
    {/if}
  </div>
</GameWindow>

<style>
  .h2h {
    container-type: inline-size;
    display: flex;
    flex-direction: column;
    gap: 18px;
    padding: 14px 20px 20px;
  }
  .brief {
    display: none;
  }
  .grid {
    display: flex;
    flex-direction: column;
  }
  .row {
    display: grid;
    grid-template-columns: minmax(96px, 170px) repeat(var(--players), minmax(0, 1fr));
    column-gap: 12px;
    align-items: center;
    padding: 8px 0;
    border-top: 1px solid var(--line);
  }
  .row.head {
    align-items: stretch;
    padding-top: 0;
    border-top: 0;
  }
  .player {
    container-type: inline-size;
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 0;
    padding: 10px 12px;
    background: var(--panel-raised);
    border: 1px solid #34444f;
    border-top: 3px solid var(--player);
    border-radius: 3px;
  }
  .identity {
    display: flex;
    gap: 12px;
    align-items: center;
    min-width: 0;
  }
  .identity > :global(:first-child) {
    flex: none;
  }
  /* A narrow column puts the portrait above the name so the name keeps its width. */
  @container (max-width: 210px) {
    .identity {
      flex-direction: column;
      align-items: start;
      gap: 6px;
    }
  }
  .status {
    display: flex;
    min-width: 0;
    max-width: 100%;
  }
  /* A narrow column wraps the chip's words rather than spilling out of the box. */
  .status :global(.status-chip) {
    white-space: normal;
  }
  .who {
    display: flex;
    flex-direction: column;
    align-items: start;
    gap: 2px;
    min-width: 0;
  }
  /* Names are at most 12 characters: they wrap at spaces rather than lose letters. */
  .name {
    max-width: 100%;
    overflow-wrap: break-word;
    font-family: "Cinzel", serif;
    font-size: 1rem;
    font-weight: 600;
    color: var(--heading);
    text-underline-offset: 4px;
  }
  .kind,
  .caption {
    color: var(--muted);
    font-size: var(--font-caption);
  }
  .label {
    color: var(--muted);
  }
  .cell {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    column-gap: 10px;
    min-width: 0;
    padding-left: 12px;
  }
  .cell strong {
    font-size: 1rem;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    color: var(--text);
  }
  .cell strong.unknown {
    font-size: var(--font-ui);
    font-weight: 400;
    color: var(--muted);
  }
  .note {
    color: var(--muted);
    font-size: var(--font-caption);
    font-variant-numeric: tabular-nums;
  }
  .cell.best strong,
  .cell.best .note {
    color: var(--gold-bright);
  }
  .leads {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .leads-head {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: baseline;
    gap: 4px 12px;
  }
  .leads h3 {
    margin: 0;
    font-size: var(--font-ui);
    font-weight: 600;
    color: var(--heading);
  }
  .bar {
    display: flex;
    gap: 2px;
    height: 14px;
  }
  .bar span {
    flex-basis: 0;
    border-radius: 2px;
    cursor: pointer;
    transition: opacity 120ms;
  }
  .bar.focused span:not(.on) {
    opacity: 0.35;
  }
  .bar span.on {
    box-shadow: 0 0 0 1px var(--gold-bright);
  }
  .legend {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 8px;
    margin: 0 -8px;
    padding: 0;
    list-style: none;
  }
  .legend button {
    display: flex;
    align-items: center;
    gap: 6px;
    min-height: 32px;
    padding: 0 8px;
    color: var(--text);
    background: none;
    border: 1px solid transparent;
    border-radius: 3px;
    font: inherit;
    cursor: pointer;
    transition: opacity 120ms;
  }
  .legend button:hover:not(:disabled),
  .legend button.on {
    background: var(--panel-raised);
    border-color: #34444f;
  }
  .legend button.dim {
    opacity: 0.55;
  }
  .legend button:disabled {
    cursor: default;
    color: var(--muted);
  }
  .dot {
    flex: none;
    width: 10px;
    height: 10px;
    border-radius: 2px;
  }
  /* Room for two lines so the panel doesn't jump as segments change. */
  .detail {
    display: flex;
    gap: 8px;
    align-items: baseline;
    min-height: 2lh;
    margin: 0;
    font-size: var(--font-caption);
  }
  .detail strong {
    font-weight: 600;
    color: var(--heading);
  }
  .hint {
    color: var(--muted);
  }
  @media (max-width: 760px) {
    .h2h {
      padding: 12px;
    }
  }
  /* Narrow panels: each label above its values, slim player headers, short XP. */
  @container (max-width: 560px) {
    .row {
      grid-template-columns: repeat(var(--players), minmax(0, 1fr));
      column-gap: 6px;
      row-gap: 2px;
    }
    .label {
      grid-column: 1 / -1;
      font-size: var(--font-caption);
    }
    .row.head > :first-child,
    .identity > :global(:first-child),
    .kind {
      display: none;
    }
    .player {
      gap: 6px;
      padding: 8px;
    }
    .name {
      font-size: 0.75rem;
    }
    .cell {
      padding-left: 0;
    }
    .cell strong {
      font-size: var(--font-ui);
    }
    .long {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip: rect(0 0 0 0);
      white-space: nowrap;
    }
    .brief {
      display: inline;
    }
  }
</style>
