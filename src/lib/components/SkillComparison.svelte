<script lang="ts">
  import { goto } from "$app/navigation";
  import { SKILLS } from "../../data";
  import { getCompass } from "../compassContext";
  import { groupSkillSummary, type ComparedPlayer } from "../groupProgress";
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
  const prepSkills = new Set([
    "Mining",
    "Smithing",
    "Crafting",
    "Fletching",
    "Herblore",
    "Cooking",
    "Fishing",
    "Runecrafting",
  ]);
  let comparison = $state("prep");
  let skills = $derived(
    comparison === "all"
      ? SKILLS
      : SKILLS.filter((s) => prepSkills.has(s.name)),
  );
  const shortName = (value: string) => value.slice(0, 4).toUpperCase();
</script>

<GameWindow
  title="Skill comparison"
  icon="Mining.png"
  trailing={"Gold marks the " + highestLabel.toLowerCase()}
>
  <div class="comparisons">
    <div class="comparison-toolbar">
      <ChoiceStrip
        label="Compare skills"
        name={id + "-skills"}
        value={comparison}
        choices={[
          { value: "prep", label: "Gathering and crafting" },
          { value: "all", label: "All 29 skills" },
        ]}
        onChange={(value) => (comparison = value)}
      />
      <p class="caption">Each level opens that skill's guide as that player.</p>
    </div>
    <div class="skill-comparisons">
      {#each skills as skill (skill.name)}
        {@const summary = groupSkillSummary(players, skill.name)}
        <section
          class="comparison-card"
          aria-label={skill.name + " comparison"}
        >
          <a
            class="skill-title"
            href={wikiHref(skill.wiki)}
            target="_blank"
            rel="noopener noreferrer"
          >
            <GameArt file={skill.icon} size={22} />
            <span>{skill.name}</span><span class="wiki-arrow" aria-hidden="true"
              >↗</span
            >
          </a>
          <div
            class="member-levels"
            style:--cols={Math.min(players.length, 4)}
          >
            {#each players as player (player.member.name)}
              {@const level = player.profile?.hiscoresLevels?.[skill.name]}
              {@const highest =
                level !== undefined && level === summary.highest}
              {#if level !== undefined}
                <button
                  class="lv"
                  class:top={highest}
                  aria-label={`${player.member.name}: ${skill.name} ${level}. ${highest ? highestLabel + ". " : ""}Open training as this player`}
                  onclick={() => {
                    controller.selectProfile(player.profile!.id);
                    void goto(skillPath(skill.name));
                  }}
                >
                  <strong>{level}</strong><small aria-hidden="true"
                    >{shortName(player.member.name)}</small
                  >
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
                  <strong>?</strong><small aria-hidden="true"
                    >{shortName(player.member.name)}</small
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
        marks the highest published level, not item ownership or every required
        unlock. Each character still needs their own use levels and quest
        requirements. {sourceNote}
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
    grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
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
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 44px;
    min-width: 0;
    padding: 2px;
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
