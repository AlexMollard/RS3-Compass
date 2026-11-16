<script lang="ts">
  import { goto } from "$app/navigation";
  import { SKILLS, skillByName } from "../../data";
  import { getCompass } from "../compassContext";
  import {
    publishedIn,
    shortLabels,
    skillStandings,
    sortSkills,
    widestGaps,
    type ComparedPlayer,
    type SkillSort,
  } from "../groupProgress";
  import { playerColour } from "../playerColours";
  import { skillPath } from "../navigation";
  import { wikiHref } from "../../wiki";
  import GameWindow from "./GameWindow.svelte";
  import GameArt from "./GameArt.svelte";
  import { ArrowDownWideNarrow, ArrowUpNarrowWide } from "@lucide/svelte";

  let {
    players,
    id,
    highestLabel,
    sourceNote,
  }: {
    players: ComparedPlayer[];
    /** Unique per page, for the toolbar's control ids. */
    id: string;
    /** How gold reads here, e.g. "Highest published in the group". */
    highestLabel: string;
    sourceNote: string;
  } = $props();

  const controller = getCompass();
  const compactFormat = new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  });
  const fullFormat = new Intl.NumberFormat("en");
  const compact = (n: number) => compactFormat.format(n).toLowerCase();

  const ALL = SKILLS.map((s) => s.name);
  const CATEGORIES = [...new Set(SKILLS.map((s) => s.category))];

  let sort = $state<SkillSort>("game");
  let reversed = $state(false);
  let category = $state("");
  let gapsOnly = $state(false);

  /** Players with published levels, who can lead or trail. */
  let ranked = $derived(
    players.flatMap((p, index) =>
      p.profile?.hiscoresLevels ? [{ name: p.member.name, index }] : [],
    ),
  );
  // A sort for a player who has since left the comparison falls back to game order.
  let activeSort = $derived<SkillSort>(
    sort.includes(":") &&
      !ranked.some((p) => sort.endsWith(`:${p.index}`))
      ? "game"
      : sort,
  );
  // A gap here means a level difference; same-level XP spreads don't count.
  let withGap = $derived(
    new Set(
      widestGaps(players, ALL)
        .filter((g) => g.levelGap > 0)
        .map((g) => g.skill),
    ),
  );
  let skills = $derived.by(() => {
    const ordered = sortSkills(players, ALL, activeSort);
    if (reversed) ordered.reverse();
    return ordered
      .map((name) => skillByName(name)!)
      .filter(
        (s) =>
          (!category || s.category === category) &&
          (!gapsOnly || withGap.has(s.name)),
      );
  });
  let directionLabel = $derived(
    activeSort === "game"
      ? reversed
        ? "Reversed"
        : "In order"
      : reversed
        ? "Smallest first"
        : "Largest first",
  );
  let labels = $derived(shortLabels(players.map((p) => p.member.name)));

  /** Per player XP and its share of the top XP; the XP spread when every listed player publishes XP. */
  function xpView(skill: string) {
    const published = publishedIn(players, skill);
    const xps = published.flatMap((p) => (p?.xp === undefined ? [] : [p.xp]));
    const top = Math.max(0, ...xps);
    const known = published.filter((p) => p);
    const gap =
      known.length >= 2 && known.every((p) => p!.xp !== undefined)
        ? top - Math.min(...xps)
        : undefined;
    return {
      gap,
      players: published.map((p) =>
        p?.xp === undefined
          ? undefined
          : { xp: p.xp, share: top ? (p.xp / top) * 100 : 0 },
      ),
    };
  }
</script>

<GameWindow
  title="Skill comparison"
  icon="Mining.png"
  trailing={"Gold marks the " + highestLabel.toLowerCase()}
>
  <div class="comparisons">
    <div class="comparison-toolbar" role="group" aria-label="Sort and filter skills">
      <div class="field">
        <label for={id + "-sort"}>Sort</label>
        <div class="joined">
        <select id={id + "-sort"} bind:value={() => activeSort, (v) => (sort = v)}>
          <option value="game">Game order</option>
          <option value="gap">Widest XP gap</option>
          <option value="level-gap">Widest level gap</option>
          {#if ranked.length}
            <optgroup label="Where a player trails">
              {#each ranked as p (p.index)}
                <option value={`trails:${p.index}`}>{p.name} trails</option>
              {/each}
            </optgroup>
            <optgroup label="Where a player leads">
              {#each ranked as p (p.index)}
                <option value={`leads:${p.index}`}>{p.name} leads</option>
              {/each}
            </optgroup>
          {/if}
        </select>
        <button
          type="button"
          class="direction"
          aria-pressed={reversed}
          aria-label={"Reverse order, now " + directionLabel.toLowerCase()}
          title={directionLabel}
          onclick={() => (reversed = !reversed)}
        >
          {#if reversed}<ArrowUpNarrowWide size={18} aria-hidden="true" />{:else}<ArrowDownWideNarrow
              size={18}
              aria-hidden="true"
            />{/if}
        </button>
        </div>
      </div>
      <div class="field">
        <label for={id + "-category"}>Show</label>
        <select id={id + "-category"} bind:value={category}>
          <option value="">All skills</option>
          {#each CATEGORIES as c (c)}<option value={c}>{c}</option>{/each}
        </select>
      </div>
      <label class="check"
        ><input type="checkbox" bind:checked={gapsOnly} />Level gaps only</label
      >
      <p class="count" aria-live="polite">
        <strong>{skills.length}</strong> of {ALL.length} skills
      </p>
    </div>
    <p class="caption hint">Each level opens that skill's guide as that player.</p>
    {#if !skills.length}<p class="caption empty">
        No skills match these filters.
      </p>{/if}
    <div class="skill-comparisons">
      {#each skills as skill (skill.name)}
        {@const standings = skillStandings(players, skill.name)}
        {@const xp = xpView(skill.name)}
        <section
          class="comparison-card"
          aria-label={skill.name + " comparison"}
        >
          <div class="skill-head">
            <a
              class="skill-title"
              href={wikiHref(skill.wiki)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <GameArt file={skill.icon} size={22} />
              <span>{skill.name}</span><span
                class="wiki-arrow"
                aria-hidden="true">↗</span
              >
            </a>
            {#if xp.gap}<span
                class="xp-gap"
                title={fullFormat.format(xp.gap) + " XP between highest and lowest"}
                >{compact(xp.gap)} gap</span
              >{/if}
          </div>
          <div
            class="member-levels"
            style:--cols={Math.min(players.length, 4)}
          >
            {#each players as player, index (player.member.name)}
              {@const { level, top, behind } = standings[index]}
              {@const mine = xp.players[index]}
              {#if level !== undefined}
                <button
                  class="lv"
                  class:top
                  style:--player={playerColour(index)}
                  title={mine
                    ? `${player.member.name}: ${fullFormat.format(mine.xp)} XP`
                    : undefined}
                  aria-label={`${player.member.name}: ${skill.name} ${level}${mine ? `, ${fullFormat.format(mine.xp)} XP` : ""}. ${top ? highestLabel + ". " : behind ? behind + " behind the leader. " : ""}Open training as this player`}
                  onclick={() => {
                    controller.selectProfile(player.profile!.id);
                    void goto(skillPath(skill.name));
                  }}
                >
                  <!-- Every box keeps all four lines, blank when empty, so cards line up. -->
                  <strong>{level}</strong><span class="xp" aria-hidden="true"
                    >{mine ? compact(mine.xp) : " "}</span
                  ><small aria-hidden="true">{labels[index]}</small><em
                    class="behind"
                    aria-hidden="true">{behind ? `−${behind}` : " "}</em
                  >{#if mine}<span class="xp-bar" aria-hidden="true"
                      ><span style:width="{mine.share}%"></span></span
                    >{/if}
                </button>
              {:else}
                <div
                  class="lv unk"
                  role="img"
                  aria-label={player.member.name +
                    ": " +
                    skill.name +
                    " unrecorded"}
                >
                  <strong>?</strong><span class="xp" aria-hidden="true"
                    >{" "}</span
                  ><small aria-hidden="true">{labels[index]}</small><em
                    class="behind"
                    aria-hidden="true">{" "}</em
                  >
                </div>
              {/if}
            {/each}
          </div>
        </section>
      {/each}
    </div>
    <details class="comparison-help">
      <summary>About these levels</summary>
      <p>
        Published Hiscores levels only; manual Compass edits are excluded. Gold
        marks the highest published level, shared on a tie, not item ownership
        or every required unlock. A minus figure is how many levels that player
        is behind the leader. The figure under each level is that player's XP
        in the skill (hover for the exact number), and the bar along the bottom
        fills to their share of the highest XP. Each character still needs
        their own use levels and quest requirements. {sourceNote}
      </p>
    </details>
  </div>
</GameWindow>

<style>
  .comparisons {
    padding: 12px 16px 16px;
  }
  /* One row: inline labels, the direction button joined to its sort, count at the end. */
  .comparison-toolbar {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 10px 20px;
    padding: 10px 12px;
    margin-bottom: 8px;
    background: var(--well);
    border: 1px solid #2f3e48;
    border-radius: 4px;
  }
  .field {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }
  .field label {
    color: var(--muted);
    font-size: var(--font-caption);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
  .field select {
    height: 36px;
    min-width: 0;
    font-size: var(--font-ui);
  }
  .joined {
    display: flex;
    min-width: 0;
  }
  .joined select {
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
  }
  .direction {
    display: grid;
    place-items: center;
    width: 36px;
    height: 36px;
    flex: none;
    color: var(--text);
    background: var(--panel-raised);
    border: 1px solid #4b5e6a;
    border-left: 0;
    border-radius: 0 4px 4px 0;
    cursor: pointer;
  }
  .direction:hover,
  .direction:focus-visible {
    color: var(--gold-bright);
    border-color: var(--gold);
  }
  .direction[aria-pressed="true"] {
    color: var(--gold-bright);
  }
  .check {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 36px;
    color: var(--text);
    font-size: var(--font-ui);
    cursor: pointer;
    white-space: nowrap;
  }
  .count {
    margin: 0 0 0 auto;
    color: var(--muted);
    font-size: var(--font-caption);
    white-space: nowrap;
  }
  .count strong {
    color: var(--text);
  }
  .hint {
    margin-bottom: 14px;
  }
  .empty {
    padding: 16px 0;
  }
  .caption {
    color: var(--muted);
    font-size: var(--font-caption);
    margin: 0;
  }
  .skill-comparisons {
    display: grid;
    /* At most six per row; fewer when a card would drop below the width that
       fits "Dungeoneering ↗ 16.5k gap" whole (min() keeps one card on phones). */
    grid-template-columns: repeat(
      auto-fill,
      minmax(max(min(100%, 220px), calc((100% - 5 * 8px) / 6)), 1fr)
    );
    gap: 8px;
  }
  .comparison-card {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 8px;
    min-width: 0;
    background: var(--well);
    border: 1px solid #2f3e48;
    border-radius: 3px;
  }
  /* One line, so every card in a row starts its boxes at the same height. */
  .skill-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    min-width: 0;
  }
  .skill-title > :global(*) {
    flex: none;
  }
  /* Some skill icons are taller than wide (Necromancy); a fixed box keeps headers level. */
  .skill-title > :global(img) {
    width: 22px;
    height: 22px;
    object-fit: contain;
  }
  .skill-title > span:first-of-type {
    flex: 0 1 auto;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .xp-gap {
    flex: none;
    color: var(--muted);
    font-size: 0.6875rem;
    font-variant-numeric: tabular-nums;
  }
  .skill-title {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
    font-size: 0.8125rem;
    font-weight: 600;
    color: var(--text);
    text-decoration: none;
  }
  .skill-title:hover {
    color: var(--gold-bright);
  }
  .wiki-arrow {
    font-weight: 400;
    color: var(--muted);
  }
  .member-levels {
    display: grid;
    grid-template-columns: repeat(var(--cols, 3), minmax(0, 1fr));
    gap: 4px;
  }
  .lv {
    position: relative;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 44px;
    min-width: 0;
    padding: 2px 2px 6px;
    color: var(--text);
    background: #0b1318;
    border: 1px solid #33434d;
    border-radius: 3px;
    line-height: 1.1;
    text-align: center;
  }
  .lv strong {
    font-size: 0.9375rem;
    font-weight: 600;
  }
  .lv small {
    font-size: 0.625rem;
    font-weight: 500;
    color: var(--muted);
    letter-spacing: 0.5px;
  }
  .lv .xp {
    font-size: 0.6875rem;
    color: var(--text);
    font-variant-numeric: tabular-nums;
  }
  .xp-bar {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: 3px;
    background: #1d2a33;
  }
  .xp-bar span {
    display: block;
    height: 100%;
    background: var(--player);
  }
  .lv .behind {
    font-size: 0.6875rem;
    font-style: normal;
    font-weight: 600;
    color: #e0a36b;
  }
  button.lv:hover {
    border-color: #8fa3b1;
  }
  .lv.top {
    color: #f0e2c2;
    border-color: var(--gold);
    background: #2a2418;
  }
  .lv.unk {
    color: var(--muted);
    border-style: dashed;
  }
  .comparison-help {
    margin-top: 16px;
    color: var(--muted);
    font-size: var(--font-ui);
  }
  .comparison-help summary {
    cursor: pointer;
    min-height: 32px;
  }
  .comparison-help p {
    max-width: 90ch;
    margin: 8px 0 0;
  }
  @media (max-width: 760px) {
    .comparisons {
      padding: 12px;
    }
  }
</style>
