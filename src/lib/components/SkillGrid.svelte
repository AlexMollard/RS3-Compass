<script module lang="ts">
  // Row-major order from the RuneScape Skills interface:
  // https://runescape.wiki/images/Skill_screen.png
  const gameOrder = [
    "Attack",
    "Constitution",
    "Mining",
    "Strength",
    "Agility",
    "Smithing",
    "Defence",
    "Herblore",
    "Fishing",
    "Ranged",
    "Thieving",
    "Cooking",
    "Prayer",
    "Crafting",
    "Firemaking",
    "Magic",
    "Fletching",
    "Woodcutting",
    "Runecrafting",
    "Slayer",
    "Farming",
    "Construction",
    "Hunter",
    "Summoning",
    "Dungeoneering",
    "Divination",
    "Invention",
    "Archaeology",
    "Necromancy",
  ];
  const gamePosition = new Map(gameOrder.map((name, index) => [name, index]));
</script>

<script lang="ts">
  import type { Profile, SkillRecord } from "../../data";
  import { skillPath } from "../navigation";
  import GameArt from "./GameArt.svelte";
  let {
    skills,
    levels,
    selected,
    compact = false,
    label = "Skill guides",
  }: {
    skills: SkillRecord[];
    levels: Profile["levels"];
    selected?: string;
    compact?: boolean;
    label?: string;
  } = $props();
  const visibleSkills = $derived(
    compact
      ? skills.toSorted(
          (a, b) =>
            (gamePosition.get(a.name) ?? gameOrder.length) -
            (gamePosition.get(b.name) ?? gameOrder.length),
        )
      : skills,
  );
  function description(skill: SkillRecord) {
    const level = levels[skill.name];
    const access =
      skill.freeToPlayCap === 0
        ? "Members"
        : skill.freeToPlayCap !== undefined
          ? "F2P trial to " + skill.freeToPlayCap
          : "Free-to-play";
    return (
      (level === undefined ? "Level unrecorded" : "Recorded level " + level) +
      " · " +
      skill.category +
      " · " +
      access
    );
  }
</script>

<nav class="skill-grid" class:compact aria-label={label}>
  {#each visibleSkills as skill (skill.name)}
    <a
      class="skill-tile"
      class:selected={selected === skill.name}
      href={skillPath(skill.name)}
      aria-label={"Open training for " + skill.name + "; " + description(skill)}
      aria-current={selected === skill.name ? "page" : undefined}
      title={description(skill)}
    >
      <GameArt file={skill.icon} size={compact ? 28 : 22} />
      <span class="skill-name">{skill.name}</span>
      <strong
        class="skill-level"
        class:unrecorded={levels[skill.name] === undefined}
        title={levels[skill.name] === undefined ? "Not recorded" : undefined}
        >{levels[skill.name] ?? "?"}</strong
      >
    </a>
  {:else}<p class="empty-state">No skills match.</p>{/each}
</nav>

<style>
  .skill-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 165px), 1fr));
    padding: 9px;
    gap: 2px;
  }
  .skill-tile {
    display: grid;
    grid-template-columns: 22px minmax(0, 1fr) 22px;
    gap: 7px;
    align-items: center;
    min-width: 0;
    min-height: 44px;
    padding: 10px 6px;
    border: 1px solid transparent;
    border-bottom-color: var(--line);
    color: var(--text);
    text-decoration: none;
    transition:
      border-color 120ms,
      background-color 120ms;
  }
  .skill-tile:hover {
    background: var(--panel-raised);
    border-color: var(--gold);
  }
  .skill-tile:focus-visible {
    outline: 2px solid var(--gold);
    outline-offset: 2px;
  }
  .skill-tile.selected {
    border-color: var(--gold);
    background: color-mix(in srgb, var(--gold) 8%, transparent);
  }
  .skill-name {
    font-size: var(--font-caption);
    color: var(--muted);
  }
  .skill-level {
    color: var(--gold);
    font:
      18px Georgia,
      serif;
    text-align: right;
  }
  .skill-level.unrecorded {
    color: var(--muted);
    font-weight: 500;
  }
  .compact {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 6px;
    padding: 0;
  }
  .compact .skill-tile {
    grid-template-columns: minmax(0, 1fr) auto;
    min-height: 64px;
    padding: 7px 5px;
    gap: 3px 4px;
    border: 1px solid var(--line);
    border-radius: 3px;
  }
  .compact .skill-tile.selected,
  .compact .skill-tile:hover {
    border-color: var(--gold);
  }
  .compact .skill-tile :global(.game-art) {
    grid-column: 1;
    grid-row: 1;
    justify-self: center;
  }
  .compact .skill-level {
    grid-column: 2;
    grid-row: 1;
    font-size: 1.15rem;
  }
  .compact .skill-name {
    grid-column: 1 / -1;
    grid-row: 2;
    font-size: 0.775rem;
    line-height: 1.3;
    overflow-wrap: anywhere;
    color: var(--text);
    text-align: center;
  }
  .empty-state {
    grid-column: 1 / -1;
  }
</style>
