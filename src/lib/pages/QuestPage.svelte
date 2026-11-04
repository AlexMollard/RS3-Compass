<script lang="ts">
  import { goto } from "$app/navigation";
  import { QUESTS, toggleItem } from "../../data";
  import { getCompass } from "../compassContext";
  import { questPath, skillPath } from "../navigation";
  import ActivityHeader from "../components/ActivityHeader.svelte";
  import Button from "../components/Button.svelte";
  import GameText from "../components/GameText.svelte";
  import ItemList from "../components/ItemList.svelte";
  import PageHeading from "../components/PageHeading.svelte";
  import QuestNavigationCard from "../components/QuestNavigationCard.svelte";
  import ResponsivePicker from "../components/ResponsivePicker.svelte";
  import SectionHeading from "../components/SectionHeading.svelte";
  import SearchField from "../components/SearchField.svelte";
  import WikiAction from "../components/WikiAction.svelte";
  import QuestLevels from "../components/QuestLevels.svelte";
  import QuestCombat from "../components/QuestCombat.svelte";
  import QuestStart from "../components/QuestStart.svelte";
  import ActivityNotes from "../components/ActivityNotes.svelte";
  let { selectedId = "" }: { selectedId?: string } = $props();
  const controller = getCompass();
  const saved = controller.state;
  const compact = controller.compact;
  let profile = $derived(
    $saved.profiles.find((p) => p.id === $saved.activeId) ?? $saved.profiles[0],
  );
  let query = $state("");
  let hideCompleted = $state(false);
  let quest = $derived(QUESTS.find((q) => q.id === selectedId) ?? QUESTS[1]);
  let locked = $derived(quest.members && profile.mode === "f2p");
  let complete = $derived(profile.completedQuests.includes(quest.id));
  let packedItems = $derived(
    quest.supplies.filter((item) =>
      profile.packed.includes(quest.id + "::" + item),
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
  <PageHeading
    title="Quest workspace"
    subtitle="Check requirements and prepare for a quest."
    >{#snippet trailing()}<div class="quest-workspace-controls">
        <span class="badge badge-gold"
          >{profile.completedQuests.length} / {QUESTS.length} guide quests</span
        >
        <Button
          variant="quiet"
          aria-pressed={$compact}
          onclick={() => compact.update((value) => !value)}
        >
          {$compact ? "Expand workspace" : "Compact quest"}
        </Button>
      </div>{/snippet}</PageHeading
  >
  <div class="journal-layout">
    <ResponsivePicker label="Quest" selection={quest.name}>
      <aside class="panel journal-list" aria-label="Sample quests">
        <SearchField
          label="Search sample quests"
          placeholder="Find a quest…"
          value={query}
          onChange={(v) => (query = v)}
        />
        <label class="small-checkbox"
          ><input type="checkbox" bind:checked={hideCompleted} /> Hide completed</label
        >
        <p class="list-kicker">
          {profile.mode === "members"
            ? "FREE & MEMBERS QUESTS"
            : "FREE WORLD QUESTS"}
        </p>
        {#each visible as q (q.id)}<QuestNavigationCard
            quest={q}
            completed={profile.completedQuests.includes(q.id)}
            selected={quest.id === q.id}
            onOpen={(id) => void goto(questPath(id))}
          />{:else}<div class="empty-state">
            No matching quests. Change your search or show completed quests.
          </div>{/each}
        <p class="sample-note">Sample quests, not the full catalogue.</p>
      </aside>
    </ResponsivePicker>
    <article class="panel quest-detail">
      <ActivityHeader
        title={quest.name}
        wiki={quest.wiki}
        image={quest.icon}
        artwork={quest.artwork}
        eyebrow={quest.members ? "MEMBERS" : "FREE-TO-PLAY"}
      />
      <div class="detail-body">
        <div class="quest-facts">
          <span>{quest.difficulty}</span><span>{quest.length}</span><span
            class:text-green={complete}
            >{complete ? "Completed" : "Not recorded complete"}</span
          >
        </div>
        <section class="prep-reason">
          <h3>Purpose</h3>
          <p><GameText text={quest.why} /></p>
        </section>
        {#if locked}<div class="notice">
            <div>
              <strong>Membership required</strong>
              <p>
                You can prepare items now. This quest requires membership to
                play; your progress is kept when switching planning modes.
              </p>
            </div>
          </div>{/if}
        <div class="quest-preparation-grid">
          <div class="quest-preparation-main">
            <section
              class="detail-section quest-preparation-section"
              aria-label="Level checks"
            >
              <SectionHeading title="Level checks" /><QuestLevels
                {profile}
                {quest}
                onSkill={openSkill}
              />
            </section>
            <section
              class="detail-section quest-preparation-section quest-preparation-items"
            >
              <SectionHeading title="Gather these items">
                {#snippet aside()}
                  <span class="badge"
                    >{packedItems.length}/{quest.supplies.length} packed</span
                  >
                {/snippet}
              </SectionHeading>
              <ItemList
                items={quest.supplies}
                checked={packedItems}
                onToggle={toggleSupply}
              />
              <p class="sample-note">
                Packing checks are manual; they do not read your bank or
                inventory.
              </p>
            </section>
            <QuestCombat {quest} />
          </div>
          <aside
            class="quest-preparation-aside"
            aria-label="Quest start and rewards"
          >
            <section class="detail-section quest-preparation-section">
              <SectionHeading title="Where to start" /><QuestStart {quest} />
            </section>
            <section class="detail-section quest-preparation-section">
              <SectionHeading title="What you gain" />
              <ul class="plain-list reward-list">
                {#each quest.rewards as reward}<li>
                    ✓ <GameText text={reward} />
                  </li>{/each}
              </ul>
              <small class="muted"
                >Record reward levels after claiming them.</small
              >
            </section>
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
          </aside>
        </div>
        <div class="detail-actions">
          <Button
            variant={complete ? "success" : "secondary"}
            aria-pressed={complete}
            onclick={() =>
              controller.updateProfile((p) => ({
                ...p,
                completedQuests: toggleItem(p.completedQuests, quest.id),
              }))}
            >{complete ? "Undo completion" : "Mark quest complete"}</Button
          ><WikiAction page={quest.wiki} label="Wiki walkthrough" />
        </div>
        <p class="sample-note">
          Sample guide. Check the current Wiki and in-game journal.
        </p>
      </div>
    </article>
  </div>
</div>

<style>
  .quest-workspace-controls {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 10px;
  }
  .quest-detail {
    container: quest-detail / inline-size;
  }
  .quest-preparation-grid {
    display: grid;
    gap: 24px;
    margin-top: 24px;
  }
  .quest-preparation-main,
  .quest-preparation-aside {
    display: grid;
    align-content: start;
    gap: 24px;
    min-width: 0;
  }
  .quest-preparation-section {
    min-width: 0;
    margin-top: 0;
  }
  .quest-preparation-main :global(.quest-combat) {
    margin-top: 0;
  }
  .quest-preparation-items :global(.section-heading) {
    flex-wrap: wrap;
  }
  @container quest-detail (min-width: 740px) {
    .quest-preparation-grid {
      grid-template-columns: minmax(0, 1.15fr) minmax(260px, 0.85fr);
      gap: 24px;
    }
    .quest-preparation-main :global(.quest-enemies) {
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 180px), 1fr));
    }
  }
  @container quest-detail (min-width: 1100px) {
    .quest-preparation-aside :global(.world-map-canvas) {
      height: 320px;
    }
  }
</style>
