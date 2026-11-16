<script lang="ts">
  import { goto } from "$app/navigation";
  import { SKILLS, skillByName } from "../../data";
  import { getCompass } from "../compassContext";
  import {
    publishedIn,
    shortLabels,
    skillStandings,
    sortSkills,
    type ComparedPlayer,
    type SkillSort,
  } from "../groupProgress";
  import { playerColour } from "../playerColours";
  import { skillPath } from "../navigation";
  import { wikiHref } from "../../wiki";
  import GameWindow from "./GameWindow.svelte";
  import GameArt from "./GameArt.svelte";
  import ChoiceStrip from "./ChoiceStrip.svelte";

  let {
    players,
    id,
    highestLabel,
    sourceNote,
  }: {
    players: ComparedPlayer[];
    /** Unique per page, for the skill filter's radio name. */
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

  let sort = $state<SkillSort>("game");
  let sortChoices = $derived([
    { value: "game", label: "Game order" },
    { value: "gap", label: "Widest gap" },
    ...players.flatMap((p, i) =>
      p.profile?.hiscoresLevels
        ? [{ value: `trails:${i}`, label: `${p.member.name} trails` }]
        : [],
    ),
  ]);
  // A sort for a player who has since left the comparison falls back to game order.
  let activeSort = $derived<SkillSort>(
    sortChoices.some((c) => c.value === sort) ? sort : "game",
  );
  let skills = $derived(
    sortSkills(
      players,
      SKILLS.map((s) => s.name),
      activeSort,
    ).map((name) => skillByName(name)!),
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
    <div class="comparison-toolbar">
      <ChoiceStrip
        label="Sort skills"
        name={id + "-sort"}
        value={activeSort}
        choices={sortChoices}
        onChange={(value) => (sort = value as SkillSort)}
      />
      <p class="caption">Each level opens that skill's guide as that player.</p>
    </div>
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
  .comparison-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: end;
    flex-wrap: wrap;
    gap: 8px 16px;
    margin-bottom: 14px;
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
