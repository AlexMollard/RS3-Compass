<script lang="ts">
  import { goto } from "$app/navigation";
  import {
    SKILLS,
    nextQuest,
    skillNeedsMembership,
    stageLocations,
    toggleItem,
    trainingStage,
  } from "../../data";
  import { getCompass } from "../compassContext";
  import { questPath, skillPath } from "../navigation";
  import ActivityHeader from "../components/ActivityHeader.svelte";
  import ActivityNotes from "../components/ActivityNotes.svelte";
  import Button from "../components/Button.svelte";
  import GameText from "../components/GameText.svelte";
  import ItemList from "../components/ItemList.svelte";
  import PageHeading from "../components/PageHeading.svelte";
  import SectionHeading from "../components/SectionHeading.svelte";
  import WikiAction from "../components/WikiAction.svelte";
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
  let stage = $derived(skill ? trainingStage(skill, profile) : undefined);
  let locked = $derived(
    !!skill && (skillNeedsMembership(skill, profile) || !stage),
  );
  let done = $derived(profile.completedTasks.includes(task));
  let places = $derived(stage ? stageLocations(stage, profile.mode) : []);
  let packing = $derived(stage?.supplies ?? []);
  let packedItems = $derived(
    packing.filter((item) => profile.packed.includes(task + "::" + item)),
  );
  let next = $derived(nextQuest(profile));
  function complete() {
    controller.updateProfile((p) => ({
      ...p,
      completedTasks: toggleItem(p.completedTasks, task),
    }));
  }
</script>

<div class="play-page page-enter">
  <div class="play-page-top">
    <Button variant="link" onclick={() => void goto("/")}
      >← Back to my journey</Button
    >
    <Button
      className="compact-switch"
      aria-pressed={$compact}
      onclick={() => compact.update((value) => !value)}
    >
      {$compact ? "Expand workspace" : "Compact companion"}
    </Button>
  </div>
  <PageHeading
    title="Training companion"
    subtitle="Pack for your selected method, then update your recorded level."
  >
    {#snippet trailing()}<span class="badge badge-green"
        ><span class="status-dot"></span> {profile.name} · local progress</span
      >{/snippet}
  </PageHeading>
  {#if skill}
    <div class="play-layout">
      <article class="panel active-session">
        <ActivityHeader
          title={skill.name}
          wiki={skill.wiki}
          image={skill.icon}
          artwork={skill.artwork}
          eyebrow={stage ? `LEVELS ${stage.from}–${stage.to}` : "TRAINING"}
        />
        <div class="detail-body">
          {#if locked}
            <div class="notice">
              <div>
                <strong>This session needs membership</strong>
                <p>
                  Your notes and progress are safe. Switch to Members or choose
                  an accessible training method.
                </p>
                <Button
                  onclick={() =>
                    controller.updateProfile((p) => ({
                      ...p,
                      mode: "members",
                    }))}>Switch to Members</Button
                >
                <Button
                  variant="link"
                  onclick={() => void goto(skillPath(skill!.name))}
                  >Review skill guide →</Button
                >
                {#if done}<Button variant="quiet" onclick={complete}
                    >Recorded complete · undo</Button
                  >{/if}
              </div>
            </div>
          {:else if stage}
            <div class="session-context">
              <p><GameText text={skill.payoff} /></p>
            </div>
            <section class="panel packing-card">
              <SectionHeading title="Before you go">
                {#snippet aside()}{#if packing.length}<span class="badge"
                      >{packedItems.length}/{packing.length}</span
                    >{/if}{/snippet}
              </SectionHeading>
              {#if packing.length}
                <p class="muted">Check items as you pack them.</p>
                <div class="packing-progress">
                  <span
                    style:width={(packedItems.length / packing.length) * 100 +
                      "%"}
                  ></span>
                </div>
              {/if}
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
            </section>
            {#if places.length}<section class="detail-section">
                <SectionHeading title="Where to train" /><LocationGallery
                  locations={places}
                  {profile}
                />
              </section>{/if}
            <section class="detail-section">
              <SectionHeading title="Your training method">
                {#snippet aside()}<WikiAction
                    page={skill.trainingWiki ?? skill.wiki}
                    label="Skill reference"
                  />{/snippet}
              </SectionHeading>
              <ol class="session-steps">
                {#each [stage.method, "Allow for gathering, travel and banking; update your level when finished."] as instruction, index}
                  <li>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <p><GameText text={instruction} /></p>
                  </li>
                {/each}
              </ol>
            </section>
            <div class="session-warning">
              <p>
                Confirm current requirements and combat risks in your game
                journal or the Wiki.
              </p>
            </div>
            <div class="detail-actions">
              <Button
                variant={done ? "success" : "primary"}
                aria-pressed={done}
                onclick={complete}
                >{done
                  ? "Recorded complete · undo"
                  : "Mark session complete"}</Button
              >
              <Button
                variant="quiet"
                onclick={() => void goto(skillPath(skill!.name))}
                >Update my level →</Button
              >
            </div>
            {#if done}<div class="completion-message" role="status">
                <div>
                  <strong>Completion recorded</strong>
                  <p>
                    Completion does not automatically add XP, rewards, or
                    supplies.
                  </p>
                  {#if next}<p>
                      Next guide quest: <GameText text={next.name} />
                    </p>
                    <Button
                      variant="link"
                      onclick={() => void goto(questPath(next!.id))}
                      >Open quest workspace →</Button
                    >{/if}
                </div>
              </div>{/if}
          {/if}
        </div>
      </article>
      <aside class="play-rail">
        <ActivityNotes
          value={profile.notes[task] || ""}
          onChange={(value) => {
            const id = task;
            controller.updateProfile((p) => ({
              ...p,
              notes: { ...p.notes, [id]: value },
            }));
          }}
        />
      </aside>
    </div>
  {:else}
    <section class="panel empty-state">
      <h2>No training session selected</h2>
      <p>Choose a skill and training method to start a session.</p>
      <Button variant="primary" onclick={() => void goto("/skills")}
        >Browse skills</Button
      >
    </section>
  {/if}
</div>
