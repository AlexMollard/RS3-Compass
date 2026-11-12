<script lang="ts">
  import { goto } from "$app/navigation";
  import {
    Award,
    BookOpen,
    CircleAlert,
    CircleCheck,
    EighthNotes,
    ExternalLink,
    Globe,
    Info,
    LockOpen,
    Map as MapIcon,
    MapPin,
    Package,
    User,
  } from "@lucide/svelte";
  import {
    QUESTS,
    progressionQuests,
    skillByName,
    toggleItem,
  } from "../../data";
  import { QUEST_COMBAT } from "../../combatData";
  import {
    QUEST_MUSIC,
    QUICK_GUIDES,
    REWARD_LINKS,
    REWARD_REFERENCES,
    SUPPLY_LINKS,
  } from "../../questsImported";
  import { wikiHref, wikiImage, wikiThumbnail } from "../../wiki";
  import { activeProfile, getCompass } from "../compassContext";
  import { INVENTORY_SIZE, inventorySlots, supplyReferences } from "../inventorySlots";
  import { questPath, skillPath } from "../navigation";
  import { packKey } from "../packing";
  import { questLine } from "../questLine";
  import { difficultyColor, earlierQuests } from "../questMap";
  import { questReadiness, questStartMessage } from "../questReadiness";
  import {
    experienceRewards,
    groupRewards,
    lampLabel,
    musicTrackName,
    rewardLineReferences,
    rewardSummary,
    rewardTileArt,
  } from "../questRewards";
  import { findPlayerQuest } from "../playerProgress";
  import { LOCATIONS } from "../../locations";
  import Button from "../components/Button.svelte";
  import GameArt from "../components/GameArt.svelte";
  import GameText from "../components/GameText.svelte";
  import GameWindow from "../components/GameWindow.svelte";
  import ItemList from "../components/ItemList.svelte";
  import QuestCombat from "../components/QuestCombat.svelte";
  import QuestBar from "../components/QuestBar.svelte";
  import QuestLevels from "../components/QuestLevels.svelte";
  import QuestLine from "../components/QuestLine.svelte";
  import QuestNavigationCard from "../components/QuestNavigationCard.svelte";
  import QuestPlayerStatus from "../components/QuestPlayerStatus.svelte";
  import SourceBanner from "../components/SourceBanner.svelte";
  import WorldMap from "../components/WorldMap.svelte";

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
  // Item and unlock tiles without a sprite: an icon for what the line links to.
  const REWARD_ICON = {
    place: MapPin,
    spell: BookOpen,
    music: EighthNotes,
    npc: User,
    title: Award,
    unlock: LockOpen,
    item: Package,
  };
  const GROUP_LABEL = {
    questPoints: "Quest points",
    experience: "Experience",
    items: "Items",
    unlocks: "Unlocks",
  };

  let profile = $derived(activeProfile($saved));
  let quest = $derived(QUESTS.find((q) => q.id === selectedId) ?? QUESTS[1]);
  let tab = $state<"prepare" | "rewards">("prepare");
  let tabs = $state<HTMLElement>();
  let locked = $derived(quest.members && profile.mode === "f2p");
  let complete = $derived(profile.completedQuests.includes(quest.id));
  let quickGuide = $derived(QUICK_GUIDES.has(quest.wiki.replaceAll(" ", "_")));
  let walkthrough = $derived(quickGuide ? quest.wiki + "/Quick_guide" : quest.wiki);
  let start = $derived(quest.start);
  // The hero falls back to a banner built from the quest's own icon and starting NPC.
  let artFailedFor = $state<string>();
  let hasArt = $derived(
    quest.artwork !== "Quest.png" && quest.artwork !== quest.icon && artFailedFor !== quest.id,
  );
  let startLocation = $derived(LOCATIONS[start.location]);
  // Jagex status: Hiscores players only; sample and hand-entered players have none.
  let jagex = $derived(
    profile.source === "hiscores" && profile.questProgress
      ? findPlayerQuest(profile, quest)
      : undefined,
  );

  let packedItems = $derived(
    quest.supplies.filter((item) => profile.packed.includes(packKey(quest.id, item))),
  );
  // Imported supply lines' Wiki links, with item sprites, by line text.
  let supplyLinks = $derived(supplyReferences(quest, SUPPLY_LINKS, REWARD_REFERENCES));
  let inventory = $derived(inventorySlots(quest, profile.packed, supplyLinks));
  let readiness = $derived(questReadiness(quest, profile));
  let combat = $derived(QUEST_COMBAT[quest.id]);
  let prerequisites = $derived(
    quest.questRequirements.map((id) => QUESTS.find((entry) => entry.id === id)!),
  );
  let prerequisitesDone = $derived(
    prerequisites.filter((q) => profile.completedQuests.includes(q.id)).length,
  );
  // The quest map's path view, when this quest is on the planning route and needs earlier quests.
  let allEarlier = $derived(earlierQuests(quest.id, QUESTS).size);
  let mapHref = $derived(
    allEarlier && progressionQuests(profile).some((q) => q.id === quest.id)
      ? `/quests?goal=${encodeURIComponent(quest.id)}&view=path`
      : undefined,
  );
  let summary = $derived(rewardSummary(quest.rewards));
  let groups = $derived(groupRewards(quest.rewards));
  // Imported reward lines' Wiki links, by line text (REWARD_LINKS is keyed by line index).
  let rewardLinks = $derived(
    new Map(
      Object.entries(REWARD_LINKS[quest.id] ?? {}).map(([index, links]) => [
        quest.rewards[Number(index)],
        links,
      ]),
    ),
  );
  let music = $derived(QUEST_MUSIC[quest.id] ?? []);
  let experience = $derived(experienceRewards(groups.experience));
  let fixedTotal = $derived([...experience.fixed.values()].reduce((sum, n) => sum + n, 0));
  let lampCount = $derived(experience.lamps.reduce((sum, lamp) => sum + lamp.count, 0));
  // Experience lines that are neither fixed XP nor a lamp (rare wording) still show as text.
  let otherXpLines = $derived(
    groups.experience.filter(
      (entry) =>
        !experience.lamps.some((lamp) => lamp.text === entry) &&
        !experienceRewards([entry]).fixed.size,
    ),
  );
  let line = $derived(questLine(quest, QUESTS));
  let levelsShort = $derived(readiness.levels.total - readiness.levels.met - readiness.levels.unknown);
  let status = $derived(
    questStartMessage({
      complete,
      membersOnly: locked,
      levelsShort,
      earlierLeft: prerequisites.length - prerequisitesDone,
      packed: packedItems.length,
      supplies: quest.supplies.length,
    }),
  );
  const skillIcon = (name: string) =>
    skillByName(name)?.icon ?? "Skills_icon.png";

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
      packed: toggleItem(p.packed, packKey(quest.id, item)),
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
  <!-- Desktop shows this bar in the app top bar; phones keep it in the page. -->
  <div class="quest-bar-phone"><QuestBar {profile} {selectedId} /></div>

  <section class="quest-hero" aria-labelledby="quest-title">
    <a
      class="quest-hero-art"
      href={wikiHref(quest.wiki)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={quest.name + " on RuneScape Wiki"}
      style:--tint={difficultyColor(quest.difficulty)}
      >{#if hasArt}<img
          src={wikiThumbnail(quest.artwork)}
          alt=""
          width="300"
          height="300"
          decoding="async"
          onerror={() => (artFailedFor = quest.id)}
        />{:else}<span class="art-placeholder"
          >{#if quest.icon !== "Quest.png"}<img
              class="art-icon"
              src={wikiImage(quest.icon)}
              alt=""
              width="56"
              height="56"
            />{/if}{#if start.image && start.image !== quest.icon}<img
              class="art-npc"
              src={wikiImage(start.image)}
              alt=""
              width="96"
              height="96"
            />{/if}<small>{start.npc ? "Starts with " + start.npc : quest.name}</small></span
        >{/if}</a
    >
    <div class="quest-hero-copy">
      <span class="eyebrow"
        >{quest.members ? "Members" : "Free-to-play"} · {kindLabel[quest.kind ?? "quest"]}{quest.availability
          ? quest.availability === "seasonal"
            ? " · Seasonal"
            : quest.availability === "removed"
              ? " · Removed"
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
      {#if mapHref}<a class="map-path-link" href={mapHref}
          ><MapIcon size={16} aria-hidden="true" />See the quests before {quest.name} on the quest map ›</a
        >{/if}
    </div>
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
    <aside class="quest-start-card" aria-label={"Start " + quest.name}>
      <WorldMap point={start.map} label={start.npc} />
      <div class="start-who">
        <a
          class="start-portrait"
          href={wikiHref(start.npcWiki)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={start.npc + " on RuneScape Wiki"}
          ><GameArt file={start.image} alt="" size={44} /></a
        >
        <div class="start-text">
          <small>Start · speak to</small>
          <a href={wikiHref(start.npcWiki)} target="_blank" rel="noopener noreferrer"
            ><strong>{start.npc}</strong></a
          >
          <span
            ><a href={wikiHref(startLocation.wiki)} target="_blank" rel="noopener noreferrer"
              >{startLocation.name}</a
            > · {start.meetingPoint}</span
          >
          {#if start.access}<span class="start-access">{start.access}</span>{/if}
        </div>
      </div>
    </aside>
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
                <ItemList
                  items={quest.supplies}
                  checked={packedItems}
                  onToggle={toggleSupply}
                  references={supplyLinks}
                />
                <div class="pack-summary">
                  <p class="pack-stats">
                    <span><strong>{Math.min(inventory.slots.length, INVENTORY_SIZE)}</strong> of {INVENTORY_SIZE} slots</span>
                    <span><strong>{packedItems.length}</strong> of {quest.supplies.length} packed</span>
                  </p>
                  <p class="cap">
                    {#if inventory.overflow}Needs {inventory.slots.length} slots, {inventory.overflow}
                      more than one inventory holds, so plan extra trips.{/if} Stackable items share a slot.
                    Packing checks are manual; they do not read your bank or inventory.
                  </p>
                </div>
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
          {:else}
            <div class="pack-empty">
              <div class="inv inv-empty" aria-hidden="true">
                {#each { length: INVENTORY_SIZE } as _}<span class="slot empty"></span>{/each}
              </div>
              <div class="pack-empty-text">
                <strong>Nothing to pack</strong>
                <p class="cap">The Wiki lists no items for this quest, so you can set off with an empty inventory.</p>
              </div>
            </div>
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
                {#if mapHref}<a class="map-path-link" href={mapHref}
                    ><MapIcon size={16} aria-hidden="true" />Show all {allEarlier} earlier quests on the map ›</a
                  >{/if}
              </li>{/if}
            <li>
              {#if !combat}{@render check("info")}<span>Combat</span><strong>Not recorded</strong
                >{:else if !readiness.danger}{@render check("met")}<span>Combat</span><strong
                  class="ok">None</strong
                >{:else}{@render check("warn")}<a href="#quest-danger">Combat</a><strong class="warn"
                  >{readiness.danger}</strong
                >{/if}
            </li>
            <li>
              {#if !jagex}{@render check("info")}<span>Jagex status</span><strong
                  >{profile.source === "hiscores" && profile.questProgress
                    ? "No match"
                    : "Not recorded"}</strong
                >{:else if jagex.status === "COMPLETED"}{@render check("met")}<span
                  >Jagex status</span
                ><strong class="ok">Completed</strong>{:else}{@render check(
                  jagex.eligible ? "met" : "warn",
                )}<span>Jagex status</span><strong class:ok={jagex.eligible} class:warn={!jagex.eligible}
                  >{jagex.status === "STARTED" ? "Started" : "Not started"} · {jagex.eligible
                    ? "can start"
                    : "requirements not met"}</strong
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
      <!-- Linked lines carry the sprite or kind icon on the tile, so the sentence links without art. -->
      {#snippet rewardTile(line: string, group: "unlocks" | "items")}
        {@const links = rewardLinks.get(line)}
        {@const art = rewardTileArt(line, group, links, REWARD_REFERENCES)}
        <li>
          <span class="reward-icon"
            >{#if "image" in art}<GameArt file={art.image} size={24} />{:else}{@const Icon =
                REWARD_ICON[art.icon]}<Icon size={18} aria-hidden="true" />{/if}</span
          >{#if links}<GameText
              text={line}
              references={rewardLineReferences(links, REWARD_REFERENCES)}
              images={false}
            />{:else}<GameText text={line} />{/if}
        </li>
      {/snippet}
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
            <ul class="reward-tiles line-tiles">
              {#each groups.items as line}{@render rewardTile(line, "items")}{/each}
            </ul>
          </section>{/if}
        {#if groups.unlocks.length || music.length}<section class="tool-window" aria-labelledby="r-unlocks">
            <header class="window-title">
              <h2 id="r-unlocks">Unlocks</h2>
              {#if groups.unlocks.length}<span>{groups.unlocks.length}</span>{/if}
            </header>
            {#if groups.unlocks.length}<ul class="reward-tiles line-tiles">
                {#each groups.unlocks as line}{@render rewardTile(line, "unlocks")}{/each}
              </ul>{/if}
            {#if music.length}<p class="music-row">
                <span class="music-label"><EighthNotes size={14} aria-hidden="true" />Music</span>
                <span
                  >{#each music as track, index (track)}{#if index}{", "}{/if}<a
                      class="wiki-ref"
                      href={wikiHref(track)}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={musicTrackName(track) + " on RuneScape Wiki"}>{musicTrackName(track)}</a
                    >{/each}</span
                >
              </p>{/if}
          </section>{/if}
      </div>

      <section class="tool-window" aria-labelledby="r-xp">
        <header class="window-title">
          <h2 id="r-xp">Experience</h2>
          {#if experience.fixed.size || lampCount}<span
              >{[
                experience.fixed.size
                  ? `${fixedTotal.toLocaleString("en")} XP in ${experience.fixed.size} ${experience.fixed.size === 1 ? "skill" : "skills"}`
                  : "",
                lampCount ? `${lampCount} ${lampCount === 1 ? "lamp" : "lamps"}` : "",
              ]
                .filter(Boolean)
                .join(" · ")}</span
            >{/if}
        </header>
        {#if groups.experience.length}
          {#if experience.fixed.size}<h3 class="xp-heading">Given on completion</h3>
            <ul class="reward-tiles xp-tiles">
              {#each [...experience.fixed] as [skill, amount] (skill)}<li>
                  <GameArt file={skillIcon(skill)} size={24} /><span
                    ><strong>{skill}</strong><small>{amount.toLocaleString("en")} XP</small></span
                  >
                </li>{/each}
            </ul>{/if}
          {#if experience.lamps.length}<h3 class="xp-heading">
              XP lamps · you choose when to use them
            </h3>
            <ul class="reward-tiles xp-tiles lamp-tiles">
              {#each experience.lamps as lamp, index (index)}{@const label = lampLabel(lamp)}<li>
                  <span class="lamp-icon"
                    ><GameArt file="Antique_lamp.png" size={24} />{#if lamp.skill}<span
                        class="lamp-skill"><GameArt file={skillIcon(lamp.skill)} size={14} /></span
                      >{/if}</span
                  ><span
                    ><strong>{label.title}</strong
                    >{#if label.detail}<small>{label.detail}</small>{/if}{#if lamp.options && label.detail !== lamp.text}<small
                        class="lamp-options">{lamp.options}</small
                      >{/if}</span
                  >
                </li>{/each}
            </ul>{/if}
          {#if otherXpLines.length}<ul class="reward-list">
              {#each otherXpLines as entry}<li><GameText text={entry} /></li>{/each}
            </ul>{/if}
          <p class="cap card-note">
            Compass doesn't add reward XP for you; update levels after claiming lamps.
          </p>
        {:else}
          <p class="cap card-note">This quest gives no skill experience or lamps.</p>
        {/if}
      </section>

      <p class="cap">Rewards checked against the RuneScape Wiki, November 2026.</p>
    {/if}
  </div>

  <!-- Outside the tabs, so the storyline shows on Prepare and All rewards alike. -->
  {#if line}<QuestLine
      name={line.name}
      quests={line.quests}
      current={quest}
      completed={profile.completedQuests}
    />{/if}

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
  /* Layout switches on the page's own width (sidebar or not), not the window's. */
  .quest-page {
    container: quest / inline-size;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
  .cap {
    margin: 0;
    font-size: var(--font-caption);
    color: var(--muted);
  }

  /* The quest bar sits in the app top bar on desktop. */
  .quest-bar-phone {
    display: none;
  }

  /* Hero: a full-width band under the top bar. */
  /* Art and title on top, reward chips beneath both, start card beside them. */
  .quest-hero {
    display: grid;
    grid-template-columns: 300px minmax(0, 1fr) minmax(280px, 380px);
    grid-template-areas:
      "art copy start"
      "chips chips start";
    align-items: start;
    gap: 16px 24px;
    position: relative;
    isolation: isolate;
    margin: -28px -32px 0;
    padding: 28px 32px;
  }
  /* Like the action bar, the band runs to the workspace edges past the capped column. */
  .quest-hero::before {
    content: "";
    position: absolute;
    inset: 0 -100vmax;
    z-index: -1;
    background: linear-gradient(var(--panel), var(--bg));
    border-bottom: 1px solid var(--line);
  }
  .quest-hero-art {
    grid-area: art;
    position: relative;
    height: 200px;
    overflow: hidden;
    background: #0d161c;
    border-radius: 2px;
  }
  .quest-hero-art > img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  /* No Wiki artwork: the quest's icon and starting NPC on a banner tinted by difficulty. */
  .art-placeholder {
    position: absolute;
    inset: 0;
    display: grid;
    grid-template-columns: auto auto;
    grid-template-rows: 1fr auto;
    place-content: center;
    align-items: end;
    gap: 6px 18px;
    padding: 18px;
    background:
      radial-gradient(circle at 30% 35%, color-mix(in srgb, var(--tint) 30%, transparent), transparent 65%),
      linear-gradient(160deg, color-mix(in srgb, var(--tint) 14%, #13202a), #0b1217);
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--tint) 30%, transparent);
  }
  .art-placeholder .art-icon {
    align-self: center;
    filter: drop-shadow(0 2px 6px #000a);
  }
  .art-placeholder .art-npc {
    object-fit: contain;
    filter: drop-shadow(0 4px 10px #000c);
  }
  .art-placeholder small {
    grid-column: 1 / -1;
    justify-self: center;
    color: var(--muted);
    font-size: 12px;
    letter-spacing: 0.5px;
  }
  .quest-hero-copy {
    grid-area: copy;
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
  .map-path-link {
    display: inline-flex;
    align-items: center;
    align-self: flex-start;
    gap: 8px;
    min-height: 32px;
    color: var(--gold-bright);
    font-weight: 600;
    text-decoration: none;
  }
  .map-path-link:hover {
    color: var(--heading);
    text-decoration: underline;
  }
  .reward-chips {
    grid-area: chips;
    display: flex;
    flex-wrap: wrap;
    align-content: flex-start;
    min-width: 0;
    gap: 10px;
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
    /* Chips keep their full text and wrap onto a new row rather than truncate. */
    flex: 0 0 auto;
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
    max-width: 200px;
  }
  .reward-more {
    flex: none;
    font-weight: 400;
    color: var(--gold-bright);
  }
  /* Start card: a short map over the NPC, sized to the hero copy, never taller. */
  .quest-start-card {
    grid-area: start;
    min-width: 0;
    display: flex;
    flex-direction: column;
    background: var(--panel);
    border: 1px solid var(--line);
    border-radius: 2px;
    overflow: hidden;
  }
  .quest-start-card :global(.world-map) {
    grid-column: auto;
    border: 0;
    border-radius: 0;
  }
  .quest-start-card :global(.world-map-canvas) {
    height: 180px;
  }
  .quest-start-card :global(.leaflet-control-attribution) {
    font-size: 10px;
  }
  .start-who {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 10px 12px;
    border-top: 1px solid var(--line);
  }
  .start-portrait {
    flex: none;
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
  }
  .start-portrait :global(img) {
    width: 44px;
    height: 44px;
    object-fit: contain;
  }
  .start-text {
    display: flex;
    flex-direction: column;
    min-width: 0;
    font-size: var(--font-caption);
    line-height: 18px;
    color: var(--muted);
  }
  .start-text small {
    font-size: 10px;
    letter-spacing: 1px;
    text-transform: uppercase;
  }
  .start-text strong {
    font-size: var(--font-ui);
    color: var(--heading);
  }
  .start-text a {
    color: inherit;
    text-decoration: underline;
    text-decoration-color: var(--gold);
    text-underline-offset: 3px;
  }
  .start-access {
    color: var(--gold-bright);
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
    container: pack / inline-size;
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
  /* The card matches the column beside it: the list fills the left, the backpack the right. */
  .pack-body {
    flex: 1;
    display: flex;
    flex-wrap: wrap;
    align-items: stretch;
    gap: 22px;
    padding: 16px;
  }
  .pack-list {
    flex: 1 1 220px;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .pack-list :global(.pack-row:first-child) {
    padding-top: 0;
  }
  .pack-summary {
    margin-top: auto;
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding-top: 14px;
    border-top: 1px solid var(--line);
  }
  .pack-stats {
    display: flex;
    flex-wrap: wrap;
    gap: 6px 24px;
    margin: 0;
    color: var(--muted);
  }
  .pack-stats strong {
    font-size: 20px;
    color: var(--heading);
  }
  /* No items: a faded empty inventory beside the message, centred in the card. */
  .pack-empty {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 28px;
    padding: 24px;
  }
  .inv-empty {
    opacity: 0.55;
  }
  .pack-empty-text {
    display: flex;
    flex-direction: column;
    gap: 6px;
    max-width: 280px;
  }
  .pack-empty-text strong {
    font:
      600 18px/1.2 "Cinzel",
      Georgia,
      serif;
    color: var(--heading);
  }
  .inv {
    flex: 0 0 clamp(176px, 30cqi, 248px);
    align-self: flex-start;
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
  /* Same columns as the Prepare grid above, so the card edges line up. */
  .detail-grid {
    display: grid;
    grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
    gap: 20px;
    align-items: start;
  }
  .detail-grid > :only-child {
    grid-column: 1 / -1;
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
  .xp-heading {
    margin: 0;
    padding: 14px 16px 0;
    font: 600 10px/14px "DM Sans", sans-serif;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: var(--muted);
  }
  .xp-heading + .reward-tiles {
    padding-top: 8px;
  }
  .lamp-tiles li {
    align-items: flex-start;
  }
  .lamp-icon {
    position: relative;
    flex: none;
  }
  .lamp-skill {
    position: absolute;
    right: -4px;
    bottom: -4px;
    display: grid;
    place-items: center;
    width: 18px;
    height: 18px;
    background: var(--panel-raised);
    border: 1px solid var(--line);
    border-radius: 50%;
  }
  .lamp-options {
    margin-top: 2px;
    line-height: 16px;
  }
  .line-tiles li {
    align-items: flex-start;
  }
  .reward-icon {
    flex: none;
    display: grid;
    place-items: center;
    width: 24px;
    height: 24px;
    color: var(--gold);
  }
  .music-row {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 4px 10px;
    margin: 0;
    padding: 14px 16px;
  }
  .line-tiles + .music-row {
    padding-top: 0;
  }
  .music-label {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font: 600 10px/14px "DM Sans", sans-serif;
    letter-spacing: 1px;
    text-transform: uppercase;
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
    /* auto: on short pages the bar drops to sit on the footer. */
    margin: auto -32px 0;
    padding: 12px 32px;
  }
  /* The background runs past the capped page column to the workspace edges;
     .workspace clips it at the sidebar. */
  .quest-actionbar::before {
    content: "";
    position: absolute;
    inset: 0 -100vmax;
    z-index: -1;
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

  /* Art, title and start card side by side need about 1080px. */
  @container quest (max-width: 1080px) {
    .quest-hero {
      grid-template-columns: 260px minmax(0, 1fr);
      grid-template-areas:
        "art copy"
        "chips chips"
        "start start";
    }
    .reward-chips {
      flex-wrap: wrap;
    }
    /* Full-width start card: map and NPC side by side rather than a long strip. */
    .quest-start-card {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    }
    .start-who {
      border-top: 0;
      border-left: 1px solid var(--line);
    }
  }
  @container quest (max-width: 860px) {
    .reward-cards {
      grid-template-columns: minmax(0, 1fr) !important;
    }
  }
  @container quest (max-width: 600px) {
    .quest-hero {
      grid-template-columns: minmax(0, 1fr);
      grid-template-areas: "art" "copy" "chips" "start";
    }
    .quest-start-card {
      display: flex;
    }
    .start-who {
      border-left: 0;
      border-top: 1px solid var(--line);
    }
  }
  @container quest (max-width: 720px) {
    .prepare-grid,
    .detail-grid {
      grid-template-columns: minmax(0, 1fr);
      grid-template-rows: none;
    }
    .pack-card,
    .before-card,
    .wiki-card {
      grid-column: auto;
      grid-row: auto;
    }
  }
  @media (max-width: 760px) {
    .quest-bar-phone {
      display: flex;
    }
    .quest-hero {
      grid-template-columns: minmax(0, 1fr);
      grid-template-areas: "art" "copy" "chips" "start";
      margin: 0;
      padding: 0 0 16px;
      gap: 14px;
      background: none;
      border: 0;
    }
    .quest-hero-art {
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
    .pack-list {
      flex: none;
    }
    .inv {
      flex: none;
      order: 2;
      width: min(100%, 240px);
      box-sizing: border-box;
    }
    .pack-empty {
      flex-direction: column;
      text-align: center;
    }
    .pack-empty .inv {
      width: 140px;
    }
    .quest-actionbar::before,
    .quest-hero::before {
      display: none;
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
    .actionbar-status {
      flex: none;
    }
    .quest-actionbar :global(.btn) {
      min-height: 48px;
      justify-content: center;
    }
  }
</style>
