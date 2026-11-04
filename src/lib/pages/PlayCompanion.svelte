<script lang="ts">
  import { goto } from "$app/navigation";
  import {
    QUESTS,
    SKILLS,
    nextQuest,
    skillNeedsMembership,
    stageLocations,
    taskTitle,
    toggleItem,
    trainingStage,
  } from "../../data";
  import { getCompass } from "../compassContext";
  import { questPath, skillPath } from "../navigation";
  import ActivityHeader from "../components/ActivityHeader.svelte";
  import Button from "../components/Button.svelte";
  import GameText from "../components/GameText.svelte";
  import ItemList from "../components/ItemList.svelte";
  import PageHeading from "../components/PageHeading.svelte";
  import SectionHeading from "../components/SectionHeading.svelte";
  import WikiAction from "../components/WikiAction.svelte";
  import QuestLevels from "../components/QuestLevels.svelte";
  import QuestCombat from "../components/QuestCombat.svelte";
  import QuestStart from "../components/QuestStart.svelte";
  import LocationGallery from "../components/LocationGallery.svelte";
  const controller = getCompass();
  const saved = controller.state;
  const compact = controller.compact;
  let profile = $derived(
    $saved.profiles.find((p) => p.id === $saved.activeId) ?? $saved.profiles[0],
  );
  let task = $derived(profile.activeTask);
  let skill = $derived(
    task.startsWith("train-")
      ? SKILLS.find((s) => s.name === task.slice(6))
      : undefined,
  );
  let quest = $derived(QUESTS.find((q) => q.id === task));
  let locked = $derived(
    (!!quest?.members && profile.mode === "f2p") ||
      (!!skill &&
        (skillNeedsMembership(skill, profile) ||
          !trainingStage(skill, profile))),
  );
  let done = $derived(
    skill
      ? profile.completedTasks.includes(task)
      : profile.completedQuests.includes(task),
  );
  let stage = $derived(skill ? trainingStage(skill, profile) : undefined);
  let places = $derived(stage ? stageLocations(stage, profile.mode) : []);
  let packing = $derived(quest?.supplies ?? stage?.supplies ?? []);
  let packedItems = $derived(
    packing.filter((item) => profile.packed.includes(task + "::" + item)),
  );
  let next = $derived(nextQuest(profile));
  function start(id: string) {
    controller.updateProfile((p) => ({ ...p, activeTask: id }));
  }
  function openSkill(name: string) {
    if (SKILLS.some((s) => s.name === name)) void goto(skillPath(name));
    else controller.notify("No skill guide is available for " + name + ".");
  }
  function switchMembers() {
    controller.updateProfile((p) => ({ ...p, mode: "members" }));
  }
  function complete() {
    controller.updateProfile((p) =>
      skill
        ? { ...p, completedTasks: toggleItem(p.completedTasks, task) }
        : { ...p, completedQuests: toggleItem(p.completedQuests, task) },
    );
  }
</script>

<div class="play-page page-enter">
  <div class="play-page-top">
    <Button variant="link" onclick={() => void goto("/")}
      >← Back to my journey</Button
    ><Button
      className="compact-switch"
      aria-pressed={$compact}
      onclick={() => compact.update((v) => !v)}
      >{$compact ? "Expand workspace" : "Compact companion"}</Button
    >
  </div>
  <PageHeading
    title="Play companion"
    subtitle={quest
      ? "Check requirements and pack items, use the Wiki or in-game helper, then mark completion here."
      : "Follow your selected method, then update your recorded level."}
    >{#snippet trailing()}<span class="badge badge-green"
        ><span class="status-dot"></span> {profile.name} · local progress</span
      >{/snippet}</PageHeading
  >
  <div class="play-layout">
    <article class="panel active-session">
      <ActivityHeader
        title={taskTitle(task)}
        wiki={quest?.wiki || skill?.wiki || "Ironman_Mode/Strategies"}
        image={quest?.icon || skill?.icon || "Quest_icon.png"}
        artwork={quest?.artwork || skill?.artwork}
        eyebrow={stage
          ? `LEVELS ${stage.from}–${stage.to}`
          : skill
            ? "TRAINING"
            : "QUEST"}
      />
      <div class="detail-body">
        {#if locked}<div class="notice">
            <div>
              <strong>This session needs membership</strong>
              <p>
                Your notes and progress are safe. Switch to Members or choose an
                accessible {skill ? "training method" : "quest"}.
              </p>
              <Button onclick={switchMembers}>Switch to Members</Button
              >{#if skill}<Button
                  variant="link"
                  onclick={() => void goto(skillPath(skill!.name))}
                  >Review skill guide →</Button
                >{:else if next}<p>
                  Available quest: <GameText text={next.name} />
                </p>
                <Button variant="link" onclick={() => start(next!.id)}
                  >Open preparation →</Button
                >{/if}{#if done}<Button variant="quiet" onclick={complete}
                  >Recorded complete · undo</Button
                >{/if}
            </div>
          </div>
        {:else}<div class="session-context">
            <p><GameText text={quest?.why || skill?.payoff || ""} /></p>
          </div>
          {#if quest}<section class="detail-section">
              <SectionHeading title="Check requirements"
                >{#snippet aside()}<span class="muted"
                    >Required vs self-supply</span
                  >{/snippet}</SectionHeading
              ><QuestLevels {profile} {quest} onSkill={openSkill} />
            </section>{/if}{/if}
        {#if quest}<QuestCombat {quest} />{/if}
        {#if !locked || quest}<section class="panel packing-card">
            <SectionHeading
              title={quest ? "Gather these items" : "Before you go"}
              >{#snippet aside()}{#if packing.length}<span class="badge"
                    >{packedItems.length}/{packing.length}</span
                  >{/if}{/snippet}</SectionHeading
            >
            {#if packing.length}<p class="muted">
                Check items as you pack them.
              </p>
              <div class="packing-progress">
                <span
                  style:width={(packing.length
                    ? (packedItems.length / packing.length) * 100
                    : 0) + "%"}
                ></span>
              </div>{/if}
            <ItemList
              items={packing}
              checked={packedItems}
              onToggle={(item) =>
                controller.updateProfile((p) => ({
                  ...p,
                  packed: toggleItem(p.packed, task + "::" + item),
                }))}
            />
            {#if packing.length}<p class="sample-note">
                Checks are manual; they do not read your bank or inventory.
              </p>{/if}
          </section>{/if}
        {#if quest || (!locked && places.length > 0)}<section
            class="detail-section"
          >
            <SectionHeading
              title={skill ? "Where to train" : "Where to start"}
            />{#if quest}<QuestStart {quest} />{:else}<LocationGallery
                locations={places}
                {profile}
              />{/if}
          </section>{/if}
        {#if !locked}
          {#if quest}<section class="detail-section">
              <h3>Start the quest</h3>
              <p class="intro-copy">
                Pack the items listed here, then use the Wiki guide or in-game
                quest helper. Mark the quest complete here once you finish it
                in-game.
              </p>
              <WikiAction
                page={quest.wiki}
                label="Open Wiki quest guide"
                primary
              />
            </section>
          {:else}<section class="detail-section">
              <SectionHeading title="Your training method"
                >{#snippet aside()}<WikiAction
                    page={skill?.trainingWiki ||
                      skill?.wiki ||
                      "Ironman_Mode/Strategies"}
                    label="Skill reference"
                  />{/snippet}</SectionHeading
              >
              <ol class="session-steps">
                {#each [stage?.method || "Choose a quest or skill session to get started.", "Allow for gathering, travel and banking; update your level when finished."] as instruction, index}<li
                  >
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <p><GameText text={instruction} /></p>
                  </li>{/each}
              </ol>
            </section>{/if}
          <div class="session-warning">
            <p>
              Confirm current requirements and combat risks in your game journal
              or the Wiki.
            </p>
          </div>
          <div class="detail-actions">
            <Button
              variant={done ? "success" : quest ? "secondary" : "primary"}
              aria-pressed={done}
              onclick={complete}
              >{done
                ? "Recorded complete · undo"
                : quest
                  ? "Mark quest complete"
                  : "Mark session complete"}</Button
            ><Button
              variant="quiet"
              onclick={() =>
                quest
                  ? void goto(questPath(quest.id))
                  : skill && void goto(skillPath(skill.name))}
              >{skill ? "Update my level" : "Review quest preparation"} →</Button
            >
          </div>
          {#if done}<div class="completion-message" role="status">
              <div>
                <strong>Completion recorded</strong>
                <p>
                  Completion does not automatically add XP, rewards, or
                  supplies.
                </p>
                {#if next && next.id !== task}<p>
                    Next sample quest: <GameText text={next.name} />
                  </p>
                  <Button variant="link" onclick={() => start(next!.id)}
                    >Prepare next quest →</Button
                  >{/if}
              </div>
            </div>{/if}
        {/if}
      </div>
    </article>
    <aside class="play-rail">
      <section class="panel notes-card">
        <SectionHeading title="Session notes" /><label
          class="sr-only"
          for="session-notes">Session notes</label
        ><textarea
          id="session-notes"
          placeholder="Where you stopped, what to gather next…"
          value={profile.notes[task] || ""}
          maxlength="4000"
          oninput={(e) => {
            const value = e.currentTarget.value;
            const id = task;
            controller.updateProfile((p) => ({
              ...p,
              notes: { ...p.notes, [id]: value },
            }));
          }}></textarea><span class="note-count"
          >{(profile.notes[task] || "").length}/4,000</span
        >
      </section>
    </aside>
  </div>
</div>
