<script lang="ts">
  import { groupRewards } from "../questRewards";
  import GameWindow from "./GameWindow.svelte";
  import GameArt from "./GameArt.svelte";
  import GameText from "./GameText.svelte";

  let { rewards }: { rewards: readonly string[] } = $props();
  let groups = $derived(groupRewards(rewards));
  let sections = $derived(
    [
      { title: "Quest points", icon: "Quest.png", lines: groups.questPoints },
      { title: "Experience", icon: "Antique_lamp.png", lines: groups.experience },
      { title: "Unlocks", icon: "Quest_map_icon.png", lines: groups.unlocks },
      { title: "Items", icon: "Coins_1000.png", lines: groups.items },
    ].filter((section) => section.lines.length),
  );
</script>

<GameWindow title="Rewards" icon="Quest.png">
  <div class="reward-groups">
    {#each sections as section (section.title)}
      <section class="reward-group" aria-label={section.title}>
        <h3><GameArt file={section.icon} size={20} />{section.title}</h3>
        <ul>
          {#each section.lines as line}<li><GameText text={line} /></li>{/each}
        </ul>
      </section>
    {:else}
      <p class="cap">No rewards are recorded for this quest.</p>
    {/each}
  </div>
  <p class="cap rewards-note">
    Compass doesn't add reward XP for you; update levels after claiming lamps.
  </p>
</GameWindow>

<style>
  .reward-groups {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 220px), 1fr));
    gap: 14px 24px;
    padding: 14px 16px;
  }
  .reward-group h3 {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0 0 6px;
    font-size: var(--font-ui);
    font-weight: 600;
    color: var(--gold-bright);
  }
  .reward-group ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .cap {
    margin: 0;
    font-size: var(--font-caption);
    color: var(--muted);
  }
  .rewards-note {
    padding: 0 16px 16px;
  }
</style>
