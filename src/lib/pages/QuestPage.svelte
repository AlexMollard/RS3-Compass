<script lang="ts">
  import { goto } from "$app/navigation";
  import { QUESTS, SKILLS, toggleItem } from "../../data";
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
  let { selectedId = "" }: { selectedId?: string } = $props();
  const controller = getCompass();
  const saved = controller.state;
  let profile = $derived(
    $saved.profiles.find((p) => p.id === $saved.activeId) ?? $saved.profiles[0],
  );
  let query = $state("");
  let hideCompleted = $state(false);
  let quest = $derived(QUESTS.find((q) => q.id === selectedId) ?? QUESTS[1]);
  let locked = $derived(quest.members && profile.mode === "f2p");
  let complete = $derived(profile.completedQuests.includes(quest.id));
  let visible = $derived(
    QUESTS.filter(
      (q) =>
        (profile.mode === "members" || !q.members || q.id === quest.id) &&
        q.name.toLowerCase().includes(query.toLowerCase()) &&
        (!hideCompleted || !profile.completedQuests.includes(q.id)),
    ),
  );
  function openSkill(name: string) {
    if (SKILLS.some((s) => s.name === name)) void goto(skillPath(name));
    else
      controller.notify(
        name +
          " is not one of the three skill details included in this design preview.",
      );
  }
  function start(id: string) {
    controller.updateProfile((p) => ({ ...p, activeTask: id }));
    void goto("/play");
  }
</script>

<div class="quest-page page-enter">
  <PageHeading
    title="Quest preparation"
    subtitle="Check requirements and prepare for a quest."
    >{#snippet trailing()}<span class="badge badge-gold"
        >{profile.completedQuests.length} / {QUESTS.length} sample quests</span
      >{/snippet}</PageHeading
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
                Switch to Members to plan this activity. Your progress is kept.
              </p>
            </div>
          </div>{/if}
        <section class="detail-section">
          <SectionHeading title="Level checks" /><QuestLevels
            {profile}
            {quest}
            onSkill={openSkill}
          />
        </section>
        <QuestCombat {quest} />
        <div class="detail-actions">
          <Button
            variant="primary"
            disabled={locked}
            onclick={() => start(quest.id)}>Start packing →</Button
          >
        </div>
        <section class="detail-section">
          <SectionHeading title="Where to start" /><QuestStart {quest} />
        </section>
        <div class="quest-columns">
          <section class="detail-section">
            <h3>Gather these items</h3>
            <ItemList items={quest.supplies} />
          </section>
          <section class="detail-section">
            <h3>What you gain</h3>
            <ul class="plain-list reward-list">
              {#each quest.rewards as reward}<li>
                  ✓ <GameText text={reward} />
                </li>{/each}
            </ul>
            <small class="muted"
              >Record reward levels after claiming them.</small
            >
          </section>
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
