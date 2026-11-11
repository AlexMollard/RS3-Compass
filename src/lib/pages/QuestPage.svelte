<script lang="ts">
  import { goto } from "$app/navigation";
  import {
    BookOpen,
    ChevronLeft,
    ChevronRight,
    CircleAlert,
    CircleCheck,
    ExternalLink,
    Globe,
    Info,
  } from "@lucide/svelte";
  import { QUESTS, SKILLS, toggleItem } from "../../data";
  import { QUEST_COMBAT } from "../../combatData";
  import { QUICK_GUIDES } from "../../questsImported";
  import { wikiHref, wikiImage } from "../../wiki";
  import { getCompass } from "../compassContext";
  import { INVENTORY_SIZE, inventorySlots } from "../inventorySlots";
  import { questPath, skillPath } from "../navigation";
  import { questLine } from "../questLine";
  import { questReadiness } from "../questReadiness";
  import { experienceTotals, groupRewards, rewardSummary } from "../questRewards";
  import Button from "../components/Button.svelte";
  import GameArt from "../components/GameArt.svelte";
  import GameText from "../components/GameText.svelte";
  import GameWindow from "../components/GameWindow.svelte";
  import ItemList from "../components/ItemList.svelte";
  import QuestCombat from "../components/QuestCombat.svelte";
  import QuestFinder from "../components/QuestFinder.svelte";
  import QuestLevels from "../components/QuestLevels.svelte";
  import QuestLine from "../components/QuestLine.svelte";
  import QuestNavigationCard from "../components/QuestNavigationCard.svelte";
  import QuestPlayerStatus from "../components/QuestPlayerStatus.svelte";
  import QuestStart from "../components/QuestStart.svelte";
  import SourceBanner from "../components/SourceBanner.svelte";

  let { selectedId = "" }: { selectedId?: string } = $props();
  const controller = getCompass();
  const saved = controller.state;
  const kindLabel = { quest: "Quest", miniquest: "Miniquest", saga: "Saga" };
  const GROUP_ICON = {
    questPoints: "Quest.png",
    experience: "Antique_lamp.png",
    items: "Coins_1000.png",
    unlocks: "Quest_map_icon.png",
  };
  const GROUP_LABEL = {
    questPoints: "Quest points",
    experience: "Experience",
    items: "Items",
    unlocks: "Unlocks",
  };

  let profile = $derived(
    $saved.profiles.find((p) => p.id === $saved.activeId) ?? $saved.profiles[0],
  );
  let quest = $derived(QUESTS.find((q) => q.id === selectedId) ?? QUESTS[1]);
  let tab = $state<"prepare" | "rewards">("prepare");
  let tabs = $state<HTMLElement>();
  let locked = $derived(quest.members && profile.mode === "f2p");
  let complete = $derived(profile.completedQuests.includes(quest.id));
  let quickGuide = $derived(QUICK_GUIDES.has(quest.wiki.replaceAll(" ", "_")));
  let walkthrough = $derived(quickGuide ? quest.wiki + "/Quick_guide" : quest.wiki);

  // Previous and next follow the same route as the quest log.
  let route = $derived(QUESTS.filter((q) => profile.mode === "members" || !q.members));
  let at = $derived(route.findIndex((q) => q.id === quest.id));
  let previous = $derived(at > 0 ? route[at - 1] : undefined);
  let next = $derived(at >= 0 ? route[at + 1] : undefined);

  let packedItems = $derived(
    quest.supplies.filter((item) => profile.packed.includes(quest.id + "::" + item)),
  );
  let inventory = $derived(inventorySlots(quest, profile.packed));
  let readiness = $derived(questReadiness(quest, profile));
  let combat = $derived(QUEST_COMBAT[quest.id]);
  let prerequisites = $derived(
    quest.questRequirements.map((id) => QUESTS.find((entry) => entry.id === id)!),
  );
  let prerequisitesDone = $derived(
    prerequisites.filter((q) => profile.completedQuests.includes(q.id)).length,
  );
  let summary = $derived(rewardSummary(quest.rewards));
  let groups = $derived(groupRewards(quest.rewards));
  let experience = $derived(experienceTotals(groups.experience));
  let lampLines = $derived(
    experience.xp.size
      ? groups.experience.filter((line) => /\blamps?\b/i.test(line))
      : groups.experience,
  );
  let line = $derived(questLine(quest, QUESTS));
  let levelsShort = $derived(readiness.levels.total - readiness.levels.met - readiness.levels.unknown);
  let status = $derived(
    complete
      ? "Marked complete in Compass."
      : locked
        ? "Members quest. Switch to Members planning to play it."
        : levelsShort > 0
          ? `${levelsShort} level ${levelsShort === 1 ? "check is" : "checks are"} below target.`
          : packedItems.length < quest.supplies.length
            ? `${packedItems.length} of ${quest.supplies.length} items packed.`
            : "Ready to start. Follow the walkthrough on the Wiki.",
  );
  const skillIcon = (name: string) =>
    SKILLS.find((s) => s.name === name)?.icon ?? "Skills_icon.png";

  $effect(() => {
    const id = quest.id;
    controller.updateProfile((p) => (p.activeTask === id ? p : { ...p, activeTask: id }));
  });
  function open(id: string) {
    void goto(questPath(id));
  }
  function toggleSupply(item: string) {
    controller.updateProfile((p) => ({
      ...p,
      packed: toggleItem(p.packed, quest.id + "::" + item),
    }));
  }
  function showRewards() {
    tab = "rewards";
    tabs?.scrollIntoView({ block: "start", behavior: "smooth" });
  }
</script>

{#snippet check(state: "met" | "warn" | "info")}
  {#if state === "met"}<CircleCheck class="check-met" size={18} aria-hidden="true" />{:else if state === "warn"}<CircleAlert
      class="check-warn"
      size={18}
      aria-hidden="true"
    />{:else}<Info class="check-info" size={18} aria-hidden="true" />{/if}
{/snippet}

<div class="quest-page page-enter">
  <div class="quest-bar">
    <QuestFinder quests={QUESTS} {profile} current={quest} onOpen={open} />
    {#if previous || next}<nav class="quest-step" aria-label="Previous and next quest">
        {#if previous}<a
            href={questPath(previous.id)}
            class="step-link"
            aria-label={"Previous quest: " + previous.name}
            title={previous.name}
            ><ChevronLeft size={16} aria-hidden="true" /><GameArt
              file={previous.icon}
              size={22}
            /><span class="step-text"
              ><small>Previous</small><span>{previous.name}</span></span
            ></a
          >{/if}{#if next}<a
            href={questPath(next.id)}
            class="step-link step-next"
            aria-label={"Next quest: " + next.name}
            title={next.name}
            ><span class="step-text"><small>Next</small><span>{next.name}</span></span
            ><GameArt file={next.icon} size={22} /><ChevronRight
              size={16}
              aria-hidden="true"
            /></a
          >{/if}
      </nav>{/if}
  </div>

  <section class="quest-hero" aria-labelledby="quest-title">
    <a
      class="quest-hero-art"
      href={wikiHref(quest.wiki)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={quest.name + " on RuneScape Wiki"}
      ><GameArt file={quest.artwork} size={300} thumbnail /></a
    >
    <div class="quest-hero-copy">
      <span class="eyebrow"
        >{quest.members ? "Members" : "Free-to-play"} · {kindLabel[quest.kind ?? "quest"]}{quest.availability
          ? quest.availability === "seasonal"
            ? " · Seasonal"
            : " · Tutorial"
          : ""}</span
      >
      <h1 id="quest-title">{quest.name}</h1>
      <div class="quest-meta">
        <span class="difficulty difficulty-{quest.difficulty.toLowerCase()}"
          >{quest.difficulty}</span
        >
        {#if quest.length !== "None" && quest.length !== "Unknown"}<span>{quest.length}</span>{/if}
        {#if combat}<span>{readiness.danger ? "Combat required" : "No combat"}</span>{/if}
        {#if complete}<span class="meta-done"><CircleCheck size={14} aria-hidden="true" />Completed</span>{/if}
        {#if quest.completionMembers && profile.mode === "f2p"}<span>Members to finish</span>{/if}
      </div>
      <p class="quest-why"><GameText text={quest.why} /></p>
      {#if summary.length}<button
          type="button"
          class="reward-chips"
          aria-label="Rewards summary; show all rewards"
          onclick={showRewards}
          >{#each summary as chip (chip.group)}<span class="reward-chip"
              ><GameArt
                file={chip.skill ? skillIcon(chip.skill) : GROUP_ICON[chip.group]}
                size={26}
              /><span class="reward-chip-text"
                ><small>{GROUP_LABEL[chip.group]}</small><span
                  ><span class="reward-chip-line">{chip.text}</span>{#if chip.more}<span
                      class="reward-more">+{chip.more} more</span
                    >{/if}</span
                ></span
              ></span
            >{/each}</button
        >{/if}
    </div>
    <div class="quest-start-window">
      <GameWindow title="Start here">
        <QuestStart {quest} />
      </GameWindow>
    </div>
  </section>

  {#if locked}<SourceBanner
      notice={{
        tone: "info",
        title: "Membership required",
        message:
          "You can prepare items now. This quest requires membership to play; your progress is kept when switching planning modes.",
        retry: false,
      }}
    />{/if}

  <div class="quest-tabs" role="tablist" aria-label="Quest sections" bind:this={tabs}>
    <button
      type="button"
      role="tab"
      id="quest-tab-prepare"
      aria-controls="quest-panel"
      aria-selected={tab === "prepare"}
      onclick={() => (tab = "prepare")}
      >Prepare{#if quest.supplies.length}<span
          >{packedItems.length} / {quest.supplies.length} packed</span
        >{/if}</button
    ><button
      type="button"
      role="tab"
      id="quest-tab-rewards"
      aria-controls="quest-panel"
      aria-selected={tab === "rewards"}
      onclick={() => (tab = "rewards")}
      >All rewards<span>{quest.rewards.length}</span></button
    ><a
      class="tab-wiki"
      href={wikiHref(quest.wiki)}
      target="_blank"
      rel="noopener noreferrer">Wiki page <ExternalLink size={13} /></a
    >
  </div>

  <div
    id="quest-panel"
    class="quest-panel"
    role="tabpanel"
    aria-labelledby={tab === "prepare" ? "quest-tab-prepare" : "quest-tab-rewards"}
  >
    {#if tab === "prepare"}
      <div class="prepare-grid">
        <section class="tool-window pack-card" aria-labelledby="pack-title">
          <header class="window-title">
            <h2 id="pack-title">Gather these items</h2>
            {#if quest.supplies.length}<span
                class:pack-short={packedItems.length < quest.supplies.length}
                >{packedItems.length} of {quest.supplies.length} packed</span
              >{/if}
          </header>
          {#if quest.supplies.length}
            <div class="pack-body">
              <div class="pack-list">
                <ItemList items={quest.supplies} checked={packedItems} onToggle={toggleSupply} />
              </div>
              <div
                class="inv"
                role="img"
                aria-label={`Inventory preview: ${inventory.slots.length} slots needed of 28, ${packedItems.length} packed`}
              >
                {#each inventory.slots.slice(0, INVENTORY_SIZE) as slot (slot.id)}
                  {@const art = slot.art}
                  <span class="slot" class:full={slot.packed} title={slot.title}
                    >{#if slot.count}<span class="slot-count">{slot.count.toLocaleString("en")}</span
                      >{/if}{#if art}<img
                        src={art.imageUrl ?? wikiImage(art.image!)}
                        alt=""
                        loading="lazy"
                        decoding="async"
                      />{:else}<span class="slot-label">{slot.line}</span>{/if}</span
                  >
                {/each}
                {#each { length: inventory.empty } as _}<span class="slot empty"></span>{/each}
              </div>
            </div>
            <p class="cap pack-note">
              {#if inventory.overflow}Needs {inventory.slots.length} slots, {inventory.overflow}
                more than one inventory holds, so plan extra trips.{/if} Packing checks are
              manual; they do not read your bank or inventory.
            </p>
          {:else}
            <p class="cap pack-note">Nothing to pack for this quest.</p>
          {/if}
        </section>

        <section class="tool-window before-card" aria-labelledby="before-title">
          <header class="window-title"><h2 id="before-title">Before you go</h2></header>
          <ul class="checks">
            <li>
              {#if !readiness.levels.total}{@render check("met")}<span>Skill levels</span><strong
                  class="ok">None needed</strong
                >{:else}{@render check(
                  levelsShort > 0 ? "warn" : readiness.levels.unknown ? "info" : "met",
                )}<a href="#quest-levels">Skill levels</a><strong
                  class:ok={readiness.levels.met === readiness.levels.total}
                  class:warn={levelsShort > 0}
                  >{readiness.levels.met} of {readiness.levels.total} met{readiness.levels.unknown
                    ? ` · ${readiness.levels.unknown} not recorded`
                    : ""}</strong
                >{/if}
            </li>
            <li>
              {#if !prerequisites.length}{@render check("met")}<span>Earlier quests</span><strong
                  class="ok">None needed</strong
                >{:else}{@render check(
                  prerequisitesDone === prerequisites.length ? "met" : "warn",
                )}<span>Earlier quests</span><strong
                  class:ok={prerequisitesDone === prerequisites.length}
                  class:warn={prerequisitesDone < prerequisites.length}
                  >{prerequisitesDone} of {prerequisites.length} complete</strong
                >{/if}
            </li>
            {#if prerequisites.length}<li class="check-quests">
                {#each prerequisites as prerequisite (prerequisite.id)}<QuestNavigationCard
                    quest={prerequisite}
                    completed={profile.completedQuests.includes(prerequisite.id)}
                    onOpen={open}
                  />{/each}
              </li>{/if}
            <li>
              {#if !combat}{@render check("info")}<span>Combat</span><strong>Not recorded</strong
                >{:else if !readiness.danger}{@render check("met")}<span>Combat</span><strong
                  class="ok">None</strong
                >{:else}{@render check("warn")}<a href="#quest-danger">Combat</a><strong class="warn"
                  >{readiness.danger}</strong
                >{/if}
            </li>
          </ul>
          {#if quest.preparationNotes?.length}<ul class="plain-list before-notes">
              {#each quest.preparationNotes as note}<li><GameText text={note} /></li>{/each}
            </ul>{/if}
          <div class="before-status"><QuestPlayerStatus {profile} {quest} /></div>
        </section>

        <section class="tool-window wiki-card" aria-labelledby="wiki-title">
          <header class="window-title"><h2 id="wiki-title">On the RuneScape Wiki</h2></header>
          {#if quickGuide}<a
              class="wiki-link"
              href={wikiHref(quest.wiki + "/Quick_guide")}
              target="_blank"
              rel="noopener noreferrer"
              ><BookOpen size={18} aria-hidden="true" /><span
                ><strong>Quick guide</strong><small>Short step-by-step walkthrough</small></span
              ><ExternalLink size={14} aria-hidden="true" /></a
            >{/if}<a
            class="wiki-link"
            href={wikiHref(quest.wiki)}
            target="_blank"
            rel="noopener noreferrer"
            ><Globe size={18} aria-hidden="true" /><span
              ><strong>Quest page</strong><small>Full details, requirements and history</small></span
            ><ExternalLink size={14} aria-hidden="true" /></a
          >
        </section>
      </div>

      {#if quest.requirements.length || readiness.danger}
        <div class="detail-grid">
          {#if quest.requirements.length}<div id="quest-levels">
              <GameWindow title="Level checks">
                <QuestLevels {profile} {quest} onSkill={(name) => void goto(skillPath(name))} />
              </GameWindow>
            </div>{/if}
          {#if readiness.danger}<div id="quest-danger"><QuestCombat {quest} /></div>{/if}
        </div>
      {/if}
    {:else}
      <div class="reward-cards">
        {#if groups.questPoints.length}<section class="tool-window" aria-labelledby="r-qp">
            <header class="window-title"><h2 id="r-qp">Quest points</h2></header>
            <div class="qp-body">
              <GameArt file="Quest.png" size={32} />
              {#each groups.questPoints as line}<p><GameText text={line} /></p>{/each}
            </div>
            <p class="cap card-note">Added to your quest point total when the quest is complete.</p>
          </section>{/if}
        {#if groups.items.length}<section class="tool-window wide" aria-labelledby="r-items">
            <header class="window-title">
              <h2 id="r-items">Items</h2>
              <span>{groups.items.length}</span>
            </header>
            <ul class="reward-tiles">
              {#each groups.items as line}<li><GameText text={line} /></li>{/each}
            </ul>
          </section>{/if}
        {#if groups.unlocks.length}<section class="tool-window" aria-labelledby="r-unlocks">
            <header class="window-title">
              <h2 id="r-unlocks">Unlocks</h2>
              <span>{groups.unlocks.length}</span>
            </header>
            <ul class="reward-list">
              {#each groups.unlocks as line}<li><GameText text={line} /></li>{/each}
            </ul>
          </section>{/if}
      </div>

      <section class="tool-window" aria-labelledby="r-xp">
        <header class="window-title">
          <h2 id="r-xp">Experience</h2>
          {#if experience.xp.size}<span
              >{experience.xp.size}
              {experience.xp.size === 1 ? "skill" : "skills"} · {[...experience.xp.values()]
                .reduce((sum, n) => sum + n, 0)
                .toLocaleString("en")} XP</span
            >{/if}
        </header>
        {#if groups.experience.length}
          {#if experience.xp.size}<ul class="reward-tiles xp-tiles">
              {#each [...experience.xp] as [skill, amount] (skill)}<li>
                  <GameArt file={skillIcon(skill)} size={24} /><span
                    ><strong>{skill}</strong><small>{amount.toLocaleString("en")} XP</small></span
                  >
                </li>{/each}
            </ul>{/if}
          {#if lampLines.length}<ul class="reward-list">
              {#each lampLines as entry}<li><GameText text={entry} /></li>{/each}
            </ul>{/if}
          <p class="cap card-note">
            Compass doesn't add reward XP for you; update levels after claiming lamps.
          </p>
        {:else}
          <p class="cap card-note">This quest gives no skill experience or lamps.</p>
        {/if}
      </section>

      {#if line}<QuestLine
          name={line.name}
          quests={line.quests}
          current={quest}
          completed={profile.completedQuests}
        />{/if}
      <p class="cap">Rewards checked against the RuneScape Wiki, November 2026.</p>
    {/if}
  </div>

  <div class="quest-actionbar">
    <span class="actionbar-status">{status}</span>
    <a
      class="btn btn-primary"
      href={wikiHref(walkthrough)}
      target="_blank"
      rel="noopener noreferrer"
      >{quickGuide ? "Open quick guide" : "Wiki walkthrough"}<ExternalLink size={15} /></a
    >
    <Button
      variant={complete ? "success" : "secondary"}
      aria-pressed={complete}
      onclick={() =>
        controller.updateProfile((p) => ({
          ...p,
          completedQuests: toggleItem(p.completedQuests, quest.id),
        }))}>{complete ? "Undo completion" : "Mark complete"}</Button
    >
  </div>
</div>

<style>
  .quest-page {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
  .cap {
    margin: 0;
    font-size: var(--font-caption);
    color: var(--muted);
  }

  /* Quest bar: search on the left, previous and next on the right. */
  .quest-bar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px;
  }
  .quest-step {
    display: flex;
    flex: 0 1 360px;
    min-width: 0;
    margin-left: auto;
    border: 1px solid var(--line);
    border-radius: 4px;
    overflow: hidden;
  }
  .step-link {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1 1 0;
    min-width: 0;
    min-height: var(--control-size);
    padding: 0 12px 0 8px;
    color: var(--text);
    text-decoration: none;
  }
  .step-link:hover {
    background: var(--panel);
  }
  .step-link :global(svg) {
    flex: none;
    color: var(--muted);
  }
  .step-next {
    justify-content: flex-end;
    padding: 0 8px 0 12px;
    text-align: right;
  }
  .step-link + .step-link {
    border-left: 1px solid var(--line);
  }
  .step-text {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .step-next .step-text {
    align-items: flex-end;
  }
  .step-text small {
    font-size: 9px;
    line-height: 11px;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: var(--muted);
  }
  .step-text span {
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    line-height: 16px;
    font-weight: 600;
  }

  /* Hero */
  .quest-hero {
    display: flex;
    flex-wrap: wrap;
    gap: 24px;
    padding: 24px;
    background: linear-gradient(var(--panel), var(--bg));
    border: 1px solid var(--line);
    border-radius: 2px;
  }
  .quest-hero-art {
    position: relative;
    flex: 0 0 240px;
    height: 160px;
    overflow: hidden;
    background: #0d161c;
    border-radius: 2px;
  }
  .quest-hero-art :global(img) {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .quest-hero-copy {
    flex: 999 1 360px;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .quest-hero-copy h1 {
    margin: 0;
    font:
      600 32px/36px "Cinzel",
      Georgia,
      serif;
    color: var(--heading);
  }
  .quest-meta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 14px;
    color: var(--muted);
  }
  .difficulty {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-weight: 600;
  }
  .difficulty::before {
    content: "";
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: currentColor;
  }
  .difficulty-novice {
    color: #8fc79a;
  }
  .difficulty-intermediate {
    color: #86b4d6;
  }
  .difficulty-experienced {
    color: #d9c27a;
  }
  .difficulty-master {
    color: #e09a5f;
  }
  .difficulty-grandmaster {
    color: #e07a74;
  }
  .meta-done {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    color: var(--green);
  }
  .quest-why {
    margin: 0;
    max-width: 640px;
    font-size: 14px;
    line-height: 22px;
  }
  .reward-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 6px;
    padding: 0;
    background: none;
    border: 0;
    text-align: left;
    font: inherit;
    color: inherit;
    cursor: pointer;
  }
  .reward-chip {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
    max-width: 100%;
    padding: 8px 14px 8px 8px;
    background: var(--panel);
    border: 1px solid #34444f;
    border-radius: 2px;
    box-shadow: inset 0 0 0 2px #0c1c27;
  }
  .reward-chips:hover .reward-chip {
    border-color: var(--gold);
  }
  .reward-chip-text {
    display: flex;
    flex-direction: column;
    min-width: 0;
    color: var(--heading);
    font-weight: 600;
    line-height: 18px;
  }
  .reward-chip-text small {
    font-size: 10px;
    line-height: 14px;
    letter-spacing: 1px;
    text-transform: uppercase;
    font-weight: 400;
    color: var(--muted);
  }
  .reward-chip-text > span {
    display: flex;
    gap: 6px;
    min-width: 0;
  }
  .reward-chip-line {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 280px;
  }
  .reward-more {
    flex: none;
    font-weight: 400;
    color: var(--gold-bright);
  }
  .quest-start-window {
    flex: 1 1 280px;
    max-width: 360px;
    min-width: 0;
  }
  .quest-start-window :global(.quest-start) {
    grid-template-columns: 56px minmax(0, 1fr);
    gap: 12px;
    border: 0;
    background: none;
  }
  .quest-start-window :global(.quest-start-portrait) {
    min-height: 56px;
  }
  .quest-start-window :global(.quest-start-portrait img) {
    width: 56px;
    height: 56px;
  }

  /* Tabs */
  .quest-tabs {
    display: flex;
    flex-wrap: wrap;
    align-items: stretch;
    gap: 4px;
    border-bottom: 1px solid var(--line);
    scroll-margin-top: calc(var(--topbar-height, 72px) + 12px);
  }
  .quest-tabs > button,
  .tab-wiki {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-height: 44px;
    padding: 0 18px;
    background: none;
    border: 0;
    border-bottom: 2px solid transparent;
    color: var(--muted);
    font: 600 var(--font-ui) / 1 "DM Sans", sans-serif;
    text-decoration: none;
    cursor: pointer;
  }
  .quest-tabs > button span {
    font-weight: 400;
    color: var(--muted);
  }
  .quest-tabs > button[aria-selected="true"] {
    color: var(--gold-bright);
    border-bottom-color: var(--gold);
  }
  .quest-tabs > button:hover,
  .tab-wiki:hover {
    color: var(--gold-bright);
  }
  .tab-wiki {
    margin-left: auto;
  }
  .quest-panel {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  /* Prepare */
  .prepare-grid {
    display: grid;
    grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
    grid-template-rows: auto 1fr;
    gap: 20px;
  }
  .pack-card {
    grid-column: 1;
    grid-row: 1 / span 2;
    display: flex;
    flex-direction: column;
  }
  .before-card {
    grid-column: 2;
    grid-row: 1;
  }
  .wiki-card {
    grid-column: 2;
    grid-row: 2;
    align-self: start;
  }
  .pack-short {
    color: var(--warn);
  }
  .pack-body {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    gap: 22px;
    padding: 16px;
  }
  .pack-list {
    flex: 1 1 220px;
    min-width: 0;
  }
  .pack-list :global(.pack-row:first-child) {
    padding-top: 0;
  }
  .pack-note {
    margin-top: auto;
    padding: 0 16px 16px;
  }
  .inv {
    flex: 0 0 176px;
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 5px;
    padding: 8px;
    background: #3b3226;
    border: 1px solid #5a4b37;
    border-radius: 3px;
    box-shadow: inset 0 0 0 2px #1d1810;
  }
  .slot {
    position: relative;
    aspect-ratio: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 0;
    overflow: hidden;
    background: #2a231a;
    border: 1px solid #4a3e2e;
    border-radius: 2px;
    box-shadow: inset 0 2px 3px #00000070;
    font-size: 9px;
    line-height: 1.1;
    color: #b9a888;
    text-align: center;
  }
  .slot.full {
    background: #2f281e;
    color: #e8dcc2;
  }
  .slot img {
    width: 70%;
    height: 70%;
    object-fit: contain;
  }
  .slot:not(.full):not(.empty) > :not(.slot-count) {
    opacity: 0.45;
  }
  /* In-game stack count: yellow, top-left, over the item. */
  .slot-count {
    position: absolute;
    top: 1px;
    left: 3px;
    font:
      700 11px/1 "DM Sans",
      sans-serif;
    color: #ffff00;
    text-shadow: 1px 1px 0 #000;
    pointer-events: none;
  }
  .slot-label {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3;
    line-clamp: 3;
    overflow: hidden;
    padding: 0 2px;
    overflow-wrap: anywhere;
  }
  .checks {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .checks > li {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 44px;
    padding: 4px 14px;
    border-bottom: 1px solid var(--line);
  }
  .checks > li > :is(span, a) {
    flex: 1;
  }
  .checks strong {
    text-align: right;
    font-weight: 600;
  }
  .checks .ok {
    color: var(--green);
  }
  .checks .warn {
    color: var(--warn);
  }
  .checks :global(.check-met) {
    flex: none;
    color: var(--green);
  }
  .checks :global(.check-warn) {
    flex: none;
    color: var(--warn);
  }
  .checks :global(.check-info) {
    flex: none;
    color: var(--blue);
  }
  .check-quests {
    flex-direction: column;
    align-items: stretch !important;
    gap: 2px !important;
  }
  .before-notes {
    margin: 0;
    padding: 12px 14px 0 32px;
  }
  .before-status {
    padding: 4px 14px 8px;
  }
  .wiki-link {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 52px;
    padding: 10px 14px;
    color: var(--text);
    text-decoration: none;
  }
  .wiki-link + .wiki-link {
    border-top: 1px solid var(--line);
  }
  .wiki-link > span {
    flex: 1;
    display: flex;
    flex-direction: column;
  }
  .wiki-link small {
    font-size: var(--font-caption);
    color: var(--muted);
  }
  .wiki-link :global(svg:first-child) {
    color: var(--gold-bright);
  }
  .wiki-link:hover strong {
    color: var(--gold-bright);
    text-decoration: underline;
  }
  .detail-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 340px), 1fr));
    gap: 20px;
    align-items: start;
  }
  .detail-grid > div {
    scroll-margin-top: calc(var(--topbar-height, 72px) + 12px);
  }

  /* Rewards */
  .reward-cards {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 2fr) minmax(0, 1.2fr);
    gap: 20px;
    align-items: stretch;
  }
  .reward-cards:has(> :nth-child(2):last-child) {
    grid-template-columns: minmax(0, 1fr) minmax(0, 2fr);
  }
  .reward-cards:has(> :only-child) {
    grid-template-columns: minmax(0, 1fr);
  }
  .qp-body {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px;
    font:
      600 20px/1.2 "Cinzel",
      Georgia,
      serif;
    color: var(--gold-bright);
  }
  .qp-body p {
    margin: 0;
  }
  .card-note {
    padding: 0 16px 14px;
  }
  .reward-tiles {
    list-style: none;
    margin: 0;
    padding: 14px 16px;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(200px, 100%), 1fr));
    gap: 8px;
  }
  .reward-tiles li {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
    padding: 8px 10px;
    background: var(--bg);
    border: 1px solid var(--line);
    border-radius: 2px;
  }
  .xp-tiles li > span {
    display: flex;
    flex-direction: column;
  }
  .xp-tiles small {
    font-size: var(--font-caption);
    color: var(--muted);
  }
  .reward-list {
    list-style: none;
    margin: 0;
    padding: 10px 16px 14px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  /* Sticky actions */
  .quest-actionbar {
    position: sticky;
    bottom: 0;
    z-index: 5;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px;
    margin: 0 -32px;
    padding: 12px 32px;
    background: #0d151bf2;
    border-top: 1px solid #34444f;
  }
  .actionbar-status {
    flex: 1 1 220px;
    color: var(--muted);
  }
  .quest-actionbar .btn-primary {
    gap: 8px;
  }

  @media (max-width: 1100px) {
    .reward-cards {
      grid-template-columns: minmax(0, 1fr) !important;
    }
  }
  @media (max-width: 900px) {
    .prepare-grid {
      grid-template-columns: minmax(0, 1fr);
      grid-template-rows: none;
    }
    .pack-card,
    .before-card,
    .wiki-card {
      grid-column: auto;
      grid-row: auto;
    }
    .quest-start-window {
      max-width: none;
    }
  }
  @media (max-width: 760px) {
    .quest-step {
      flex: 1 1 100%;
      margin-left: 0;
    }
    .quest-hero {
      padding: 0 0 16px;
      gap: 14px;
      background: none;
      border: 0;
    }
    .quest-hero-art {
      flex: 1 1 100%;
      height: 150px;
    }
    .quest-hero-copy h1 {
      font-size: 28px;
      line-height: 32px;
    }
    .reward-chip-line {
      max-width: 220px;
    }
    .quest-tabs > button,
    .tab-wiki {
      padding: 0 12px;
    }
    .pack-body {
      flex-direction: column;
      align-items: stretch;
    }
    .inv {
      flex: none;
      order: 2;
      width: min(100%, 240px);
      box-sizing: border-box;
    }
    .quest-actionbar {
      position: static;
      margin: 0;
      padding: 0;
      background: none;
      border: 0;
      flex-direction: column;
      align-items: stretch;
    }
    .quest-actionbar :global(.btn) {
      min-height: 48px;
      justify-content: center;
    }
  }
</style>
