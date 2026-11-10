<script lang="ts">
  import { goto } from "$app/navigation";
  import { nextQuest, QUESTS, toggleItem } from "../../data";
  import { wikiHref, wikiImage } from "../../wiki";
  import { getCompass } from "../compassContext";
  import { INVENTORY_SIZE, inventorySlots } from "../inventorySlots";
  import { questPath, skillPath } from "../navigation";
  import { questReadiness } from "../questReadiness";
  import Button from "../components/Button.svelte";
  import GameArt from "../components/GameArt.svelte";
  import GameText from "../components/GameText.svelte";
  import GameWindow from "../components/GameWindow.svelte";
  import ItemList from "../components/ItemList.svelte";
  import QuestNavigationCard from "../components/QuestNavigationCard.svelte";
  import ReadinessTiles from "../components/ReadinessTiles.svelte";
  import ResponsivePicker from "../components/ResponsivePicker.svelte";
  import SearchField from "../components/SearchField.svelte";
  import SourceBanner from "../components/SourceBanner.svelte";
  import WikiAction from "../components/WikiAction.svelte";
  import QuestLevels from "../components/QuestLevels.svelte";
  import QuestCombat from "../components/QuestCombat.svelte";
  import QuestStart from "../components/QuestStart.svelte";
  import ActivityNotes from "../components/ActivityNotes.svelte";
  import QuestPlayerStatus from "../components/QuestPlayerStatus.svelte";
  import QuestRewards from "../components/QuestRewards.svelte";
  import ChoiceStrip from "../components/ChoiceStrip.svelte";
  import { BookOpen, ExternalLink, Globe } from "@lucide/svelte";
  import { QUICK_GUIDES } from "../../questsImported";
  import { rewardHighlights } from "../questRewards";
  import { SKILLS } from "../../data";
  let { selectedId = "" }: { selectedId?: string } = $props();
  const controller = getCompass();
  const saved = controller.state;
  const compact = controller.compact;
  const kindLabel = { quest: "Quest", miniquest: "Miniquest", saga: "Saga" };
  let profile = $derived(
    $saved.profiles.find((p) => p.id === $saved.activeId) ?? $saved.profiles[0],
  );
  let query = $state("");
  let hideCompleted = $state(false);
  let access = $state<"all" | "free" | "members">("all");
  let activity = $state<"all" | "quests" | "mini">("all");
  let quest = $derived(QUESTS.find((q) => q.id === selectedId) ?? QUESTS[1]);
  let locked = $derived(quest.members && profile.mode === "f2p");
  let complete = $derived(profile.completedQuests.includes(quest.id));
  let packedItems = $derived(
    quest.supplies.filter((item) =>
      profile.packed.includes(quest.id + "::" + item),
    ),
  );
  let inventory = $derived(inventorySlots(quest, profile.packed));
  let readiness = $derived(questReadiness(quest, profile));
  let next = $derived(nextQuest(profile));
  let highlights = $derived(rewardHighlights(quest.rewards));
  const skillIcon = (name: string) =>
    SKILLS.find((s) => s.name === name)?.icon ?? "Skills_icon.png";
  let catalogueCounts = $derived.by(() => {
    let total = 0;
    let completed = 0;
    for (const entry of QUESTS) {
      if (entry.members && profile.mode !== "members") continue;
      total++;
      if (profile.completedQuests.includes(entry.id)) completed++;
    }
    return { total, completed };
  });
  let prerequisites = $derived(
    quest.questRequirements.map((id) =>
      QUESTS.find((entry) => entry.id === id)!,
    ),
  );
  $effect(() => {
    const id = quest.id;
    controller.updateProfile((p) =>
      p.activeTask === id ? p : { ...p, activeTask: id },
    );
  });
  let visible = $derived(
    QUESTS.filter(
      (q) =>
        (profile.mode === "members" || !q.members || q.id === quest.id) &&
        (access === "all" || q.members === (access === "members")) &&
        (activity === "all" ||
          (activity === "mini") === (q.kind === "miniquest" || q.kind === "saga")) &&
        q.name.toLowerCase().includes(query.toLowerCase()) &&
        (!hideCompleted || !profile.completedQuests.includes(q.id)),
    ),
  );
  function openSkill(name: string) {
    void goto(skillPath(name));
  }
  function toggleSupply(item: string) {
    controller.updateProfile((p) => ({
      ...p,
      packed: toggleItem(p.packed, quest.id + "::" + item),
    }));
  }
</script>

<div class="quest-page page-enter">
  <div class="quest-toolbar">
    <Button
      variant="quiet"
      aria-pressed={$compact}
      onclick={() => compact.update((value) => !value)}
    >
      {$compact ? "Expand workspace" : "Compact quest"}
    </Button>
  </div>
  <div class="journal-layout quest-layout">
    <ResponsivePicker label="Quest" selection={quest.name}>
      <aside class="tool-window quest-log" aria-label="Quest log">
        <header class="window-title">
          <h2>Quest log</h2>
          <span>{catalogueCounts.completed} / {catalogueCounts.total}</span>
        </header>
        <div class="journal-list">
          <SearchField
            label="Search quests and miniquests"
            placeholder="Find a quest…"
            value={query}
            onChange={(v) => (query = v)}
          />
          <div class="quest-filters">
            {#if profile.mode === "members"}<ChoiceStrip
                variant="joined"
                label="Access"
                name="quest-access"
                value={access}
                choices={[
                  { value: "all", label: "All" },
                  { value: "free", label: "Free" },
                  { value: "members", label: "Members", image: "P2P_icon.png" },
                ]}
                onChange={(v) => (access = v as typeof access)}
              />{/if}
            <ChoiceStrip
              variant="joined"
              label="Type"
              name="quest-type"
              value={activity}
              choices={[
                { value: "all", label: "All" },
                { value: "quests", label: "Quests" },
                { value: "mini", label: "Miniquests" },
              ]}
              onChange={(v) => (activity = v as typeof activity)}
            />
          </div>
          <label class="small-checkbox"
            ><input type="checkbox" bind:checked={hideCompleted} /> Hide completed</label
          >
          <p class="list-kicker">
            {visible.length}
            {visible.length === 1 ? "ACTIVITY" : "ACTIVITIES"} · ROUTE ORDER
          </p>
          {#each visible as q (q.id)}<QuestNavigationCard
              quest={q}
              completed={profile.completedQuests.includes(q.id)}
              selected={quest.id === q.id}
              next={next?.id === q.id}
              onOpen={(id) => void goto(questPath(id))}
            />{:else}<div class="empty-state">
              No matching quests. Change your search or show completed quests.
            </div>{/each}
          <p class="sample-note">
            Seasonal quests and tutorials are labelled separately.
          </p>
        </div>
      </aside>
    </ResponsivePicker>

    <div class="quest-centre">
      <section class="tool-window quest-hero" aria-labelledby="quest-title">
        <div class="quest-hero-main">
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
              >{quest.members ? "Members" : "Free-to-play"} · {kindLabel[
                quest.kind ?? "quest"
              ]}</span
            >
            <h1 id="quest-title">{quest.name}</h1>
            <p class="quest-why"><GameText text={quest.why} /></p>
            <div class="quest-guides" aria-label="Guides on the RuneScape Wiki">
              {#if QUICK_GUIDES.has(quest.wiki)}<a
                  class="guide-link guide-primary"
                  href={wikiHref(quest.wiki + "/Quick_guide")}
                  target="_blank"
                  rel="noopener noreferrer"
                  ><BookOpen size={15} />Quick guide<ExternalLink size={12} /></a
                >{/if}<a
                class="guide-link"
                href={wikiHref(quest.wiki)}
                target="_blank"
                rel="noopener noreferrer"
                ><Globe size={15} />Wiki page<ExternalLink
                  size={12}
                /></a
              >
            </div>
            <div class="quest-chips">
              <span class="badge">{quest.difficulty}</span>
              <span class="badge">{quest.length}</span>
              <span class="badge" class:badge-green={complete}
                >{complete ? "Compass: Completed" : "Not marked complete"}</span
              >
              {#if quest.availability}<span class="badge"
                  >{quest.availability === "seasonal"
                    ? "Seasonal"
                    : "Tutorial"}</span
                >{/if}
              {#if quest.completionMembers && profile.mode === "f2p"}<span
                  class="badge">Members to finish</span
                >{/if}
            </div>
            {#if highlights.length}<a
                class="reward-strip"
                href="#quest-rewards"
                aria-label="Rewards summary; jump to all rewards"
                ><span class="reward-strip-label">Rewards</span
                >{#each highlights as chip}<span class="reward-chip"
                    >{#if chip.kind === "quest-points"}<GameArt
                        file="Quest.png"
                        size={18}
                      />{chip.points}
                      {chip.points === 1 ? "quest point" : "quest points"}{:else if chip.kind === "skill-xp"}<GameArt
                        file={skillIcon(chip.skill)}
                        size={18}
                      />{chip.xp.toLocaleString("en")}
                      {chip.skill} XP{:else if chip.kind === "lamp"}<GameArt
                        file="Antique_lamp.png"
                        size={18}
                      />XP lamps{:else}<GameArt
                        file="Quest_map_icon.png"
                        size={18}
                      /><span class="reward-chip-text">{chip.text}</span>{/if}</span
                  >{/each}</a
              >{/if}
            <QuestPlayerStatus {profile} {quest} />
          </div>
        </div>
        <nav class="quest-jump" aria-label="Jump to">
          <ReadinessTiles
            {readiness}
            anchors={{
              levels: "#quest-levels",
              pack: "#quest-pack",
              danger: "#quest-danger",
              start: "#quest-start",
            }}
          />
        </nav>
      </section>

      {#if locked}<div class="quest-lock">
          <SourceBanner
            notice={{
              tone: "info",
              title: "Membership required",
              message:
                "You can prepare items now. This quest requires membership to play; your progress is kept when switching planning modes.",
              retry: false,
            }}
          />
        </div>{/if}

      <div id="quest-pack" class="quest-pack">
        <GameWindow
          title="Pack your inventory"
          className={packedItems.length < quest.supplies.length
            ? "pack-window pack-short"
            : "pack-window"}
          trailing={quest.supplies.length
            ? `${packedItems.length} of ${quest.supplies.length} packed`
            : undefined}
        >
          <div class="pack-body">
            {#if quest.supplies.length}
              <div class="pack-inventory">
                <div
                  class="inv"
                  role="img"
                  aria-label={`Inventory preview: ${inventory.slots.length} slots needed of 28, ${packedItems.length} packed`}
                >
                  {#each inventory.slots.slice(0, INVENTORY_SIZE) as slot (slot.id)}
                    {@const art = slot.art}
                    <span class="slot" class:full={slot.packed} title={slot.title}
                      >{#if slot.count}<span class="slot-count"
                          >{slot.count.toLocaleString("en")}</span
                        >{/if}{#if art}<img
                          src={art.imageUrl ?? wikiImage(art.image!)}
                          alt=""
                          loading="lazy"
                          decoding="async"
                        />{:else}<span class="slot-label">{slot.line}</span
                        >{/if}</span
                    >
                  {/each}
                  {#each { length: inventory.empty } as _}<span
                      class="slot empty"
                    ></span>{/each}
                </div>
                <span class="cap"
                  >{#if inventory.overflow}Needs {inventory.slots.length} slots, {inventory.overflow}
                    more than one inventory holds, so plan extra trips.{:else}{inventory.slots.length}
                    of 28 slots.{/if} Packing checks are manual; Compass can't see your
                  bank or inventory.</span
                >
              </div>
            {/if}
            <div class="pack-list">
              <ItemList
                items={quest.supplies}
                checked={packedItems}
                onToggle={toggleSupply}
              />
            </div>
          </div>
        </GameWindow>
      </div>

      <div id="quest-rewards" class="quest-rewards">
        <QuestRewards rewards={quest.rewards} />
      </div>

      <div class="quest-checks">
        <div id="quest-levels" class="quest-levels">
          <GameWindow title="Level checks">
            <QuestLevels {profile} {quest} onSkill={openSkill} />
          </GameWindow>
        </div>
        <div id="quest-danger" class="quest-danger">
          <QuestCombat {quest} />
        </div>
      </div>

      {#if prerequisites.length || quest.preparationNotes?.length}
        <div class="quest-before">
          <GameWindow title="Before you go">
            <div class="window-body">
              {#if prerequisites.length}
                <h3 class="window-subhead">Quest requirements</h3>
                {#each prerequisites as prerequisite (prerequisite.id)}
                  <QuestNavigationCard
                    quest={prerequisite}
                    completed={profile.completedQuests.includes(
                      prerequisite.id,
                    )}
                    onOpen={(id) => void goto(questPath(id))}
                  />
                {/each}
              {/if}
              {#if quest.preparationNotes?.length}
                <ul class="plain-list">
                  {#each quest.preparationNotes as note}<li>
                      <GameText text={note} />
                    </li>{/each}
                </ul>
              {/if}
            </div>
          </GameWindow>
        </div>
      {/if}

      <div class="quest-notes">
        <ActivityNotes
          value={profile.notes[quest.id] || ""}
          onChange={(value) => {
            const id = quest.id;
            controller.updateProfile((p) => ({
              ...p,
              notes: { ...p.notes, [id]: value },
            }));
          }}
        />
      </div>

      <div class="quest-actions">
        <Button
          variant={complete ? "success" : "primary"}
          aria-pressed={complete}
          onclick={() =>
            controller.updateProfile((p) => ({
              ...p,
              completedQuests: toggleItem(p.completedQuests, quest.id),
            }))}
          >{complete ? "Undo completion" : "Mark quest complete"}</Button
        ><WikiAction page={quest.wiki} label="Wiki walkthrough" />
        <span class="cap"
          >Checked against the RuneScape Wiki, November 2026. Use the Wiki or
          in-game helper for walkthrough steps.</span
        >
      </div>
    </div>

    <div class="quest-aside">
      <div id="quest-start" class="quest-start-window">
        <GameWindow title="Start here">
          <QuestStart {quest} />
        </GameWindow>
      </div>
    </div>
  </div>
</div>

<style>
  .quest-toolbar {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 12px;
  }
  .cap {
    font-size: var(--font-caption);
    color: var(--muted);
  }
  .quest-centre,
  .quest-aside {
    display: flex;
    flex-direction: column;
    gap: 20px;
    min-width: 0;
  }
  .quest-centre > *,
  .quest-aside > * {
    min-width: 0;
  }

  /* Quest log */
  .quest-log :global(.journal-list) {
    padding: 12px 6px 10px;
  }
  .quest-log :global(.journal-list > .search-field),
  .quest-log :global(.journal-list > .small-checkbox) {
    margin-left: 6px;
    margin-right: 6px;
  }
  .quest-log :global(.journal-row) {
    min-height: 48px;
    margin: 2px 0;
    padding: 6px 10px;
    border-radius: 3px;
  }
  .quest-guides {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin: 10px 0 4px;
  }
  .guide-link {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 34px;
    padding: 0 12px;
    border: 1px solid #4a5560;
    border-radius: 3px;
    background: #1a2329;
    color: var(--text, #e8e0cc);
    font-size: 0.8125rem;
    font-weight: 600;
    text-decoration: none;
  }
  .guide-link:hover,
  .guide-link:focus-visible {
    border-color: #c9a85a;
    color: #f2d891;
  }
  .guide-primary {
    border-color: #7a6233;
    background: #2a2416;
    color: #f2d891;
  }
  .quest-filters {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin: 12px 6px 0;
  }
  .quest-filters :global(legend) {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
  }
  .quest-log :global(.journal-row.selected) {
    background: var(--panel-raised);
    border-color: #c5a46b80;
  }
  .quest-log :global(.journal-row.selected strong) {
    color: #f0e2c2;
    font-weight: 600;
  }
  .quest-log :global(.journal-row small),
  .quest-log :global(.journal-row .reference-action) {
    display: none;
  }
  .quest-log :global(.journal-row strong) {
    line-height: 1.4;
  }
  .quest-log :global(.quest-next-mark) {
    flex: none;
    font-size: var(--font-caption);
    font-style: normal;
    color: var(--gold-bright);
  }

  /* Hero */
  .quest-hero-main {
    display: flex;
    flex-wrap: wrap;
  }
  .quest-hero-art {
    position: relative;
    flex: 0 0 clamp(200px, 38%, 380px);
    min-height: 240px;
    overflow: hidden;
    background: #0d161c;
  }
  .quest-hero-art :global(img) {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .quest-hero-copy {
    flex: 1 1 240px;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 20px 22px;
  }
  .quest-hero-copy h1 {
    margin: -4px 0 0;
    font:
      600 32px/36px "Cinzel",
      Georgia,
      serif;
    letter-spacing: 0.3px;
    color: var(--heading);
  }
  .quest-why {
    margin: 0;
    color: #c9d4da;
  }
  .quest-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .quest-jump {
    border-top: 1px solid #2f3e48;
  }
  .quest-lock :global(.source-banner) {
    margin-top: 0;
  }

  /* Pack */
  .quest-pack :global(.pack-short .window-title > span) {
    color: var(--warn);
  }
  .pack-body {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    gap: 22px;
    padding: 18px;
  }
  .pack-inventory {
    flex: 0 1 200px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .pack-list {
    flex: 1 1 200px;
    min-width: 0;
  }
  .pack-list :global(.pack-row:first-child) {
    padding-top: 0;
  }
  .inv {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 6px;
    padding: 10px;
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

  /* Checks */
  .quest-checks {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr));
    gap: 20px;
    align-items: start;
  }
  .window-body {
    padding: 16px;
  }
  .window-subhead {
    margin: 0 0 8px;
    font-size: var(--font-ui);
    font-weight: 500;
    color: var(--muted);
  }
  .quest-before :global(.plain-list:last-child) {
    margin-bottom: 0;
  }
  .quest-notes :global(.notes-card) {
    border-radius: 3px;
  }

  /* Actions */
  .quest-actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px;
    padding: 4px 0;
  }
  .quest-actions :global(.text-link) {
    min-height: var(--control-size);
    padding: 0 16px;
    border: 1px solid var(--edge);
    border-radius: 4px;
    background: #26394566;
    color: var(--text);
    font-weight: 600;
  }
  .quest-actions :global(.text-link:hover) {
    background: #2c424f;
    color: var(--text);
  }
  .quest-actions .cap {
    flex: 1 1 200px;
  }

  /* Aside */
  .quest-start-window :global(.quest-start) {
    grid-template-columns: 64px minmax(0, 1fr);
    gap: 12px;
    border: 0;
    background: none;
  }
  .quest-start-window :global(.quest-start-portrait) {
    min-height: 64px;
  }
  .quest-start-window :global(.quest-start-portrait img) {
    width: 64px;
    height: 64px;
  }
  .reward-strip {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    margin-top: 10px;
    color: var(--text);
    text-decoration: none;
  }
  .reward-strip-label {
    margin-right: 2px;
    font-size: var(--font-caption);
    font-weight: 700;
    letter-spacing: 1.2px;
    text-transform: uppercase;
    color: var(--muted);
  }
  .reward-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 30px;
    max-width: 100%;
    padding: 2px 10px 2px 6px;
    font-size: var(--font-caption);
    font-weight: 600;
    color: #f0e2c2;
    background: #2a2418;
    border: 1px solid #5a4b37;
    border-radius: 3px;
  }
  .reward-chip-text {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 260px;
  }
  .reward-strip:hover .reward-chip {
    border-color: var(--gold);
  }

  @media (min-width: 1001px) {
    .quest-page :global(.guide-picker) {
      position: sticky;
      top: calc(var(--topbar-height, 72px) + 16px);
      max-height: calc(100dvh - var(--topbar-height, 72px) - 32px);
      overflow-y: auto;
      overscroll-behavior: contain;
    }
  }
  @media (max-width: 1000px) {
    .quest-page :global(.journal-list) {
      max-height: 60dvh;
      overflow-y: auto;
      overscroll-behavior: contain;
    }
  }
  /* Phone: QuestPhone order. Wrappers dissolve so their windows interleave. */
  @media (max-width: 760px) {
    .quest-toolbar {
      display: none;
    }
    .quest-centre,
    .quest-aside,
    .quest-checks {
      display: contents;
    }
    .quest-hero {
      order: 1;
    }
    .quest-lock {
      order: 2;
    }
    .quest-pack {
      order: 3;
    }
    .quest-rewards {
      order: 3;
    }
    .quest-start-window {
      order: 4;
    }
    .quest-danger {
      order: 5;
    }
    .quest-levels {
      order: 6;
    }
    .quest-before {
      order: 7;
    }
    .quest-actions {
      order: 8;
      flex-direction: column;
      align-items: stretch;
    }
    .quest-actions .cap {
      flex: none;
    }
    .quest-actions :global(.btn),
    .quest-actions :global(.text-link) {
      min-height: 48px;
      justify-content: center;
    }
    .quest-notes {
      order: 9;
    }
    .quest-hero-art {
      flex: 1 1 100%;
      height: 150px;
      min-height: 0;
    }
    .quest-hero-copy {
      padding: 14px 16px 16px;
    }
    .quest-hero-copy h1 {
      font-size: 28px;
      line-height: 32px;
    }
    .quest-jump {
      border-top: 0;
    }
    .pack-body {
      flex-direction: column;
      align-items: stretch;
      gap: 12px;
      padding: 14px;
    }
    .pack-inventory,
    .pack-list {
      flex: none;
    }
    .pack-inventory {
      order: 2;
    }
    .inv {
      gap: 5px;
      padding: 8px;
    }
  }
</style>
