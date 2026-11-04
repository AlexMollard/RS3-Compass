<script lang="ts">
  import { goto } from "$app/navigation";
  import {
    SKILLS,
    availableStages,
    skillNeedsMembership,
    trainingStage,
    stageLocations,
  } from "../../data";
  import { getCompass } from "../compassContext";
  import { skillPath } from "../navigation";
  import ActivityHeader from "../components/ActivityHeader.svelte";
  import Button from "../components/Button.svelte";
  import GameArt from "../components/GameArt.svelte";
  import GameText from "../components/GameText.svelte";
  import ItemList from "../components/ItemList.svelte";
  import NavigationCard from "../components/NavigationCard.svelte";
  import PageHeading from "../components/PageHeading.svelte";
  import ResponsivePicker from "../components/ResponsivePicker.svelte";
  import SearchField from "../components/SearchField.svelte";
  import SectionHeading from "../components/SectionHeading.svelte";
  import Tabs from "../components/Tabs.svelte";
  import WikiAction from "../components/WikiAction.svelte";
  import LocationGallery from "../components/LocationGallery.svelte";
  let { selectedSkill = "" }: { selectedSkill?: string } = $props();
  const controller = getCompass();
  const saved = controller.state;
  const saveError = controller.storageError;
  let profile = $derived(
    $saved.profiles.find((p) => p.id === $saved.activeId) ?? $saved.profiles[0],
  );
  let skill = $derived(
    SKILLS.find((s) => s.name === selectedSkill) ?? SKILLS[0],
  );
  let search = $state("");
  let tab = $state("method");
  let band = $state<number | null>(null);
  let target = $state(20);
  let level = $state("");
  let message = $state("");
  let identity = $state("");
  $effect(() => {
    const key = profile.id + "::" + skill.name;
    if (key !== identity) {
      identity = key;
      band = null;
      target = skill.goal;
      level = profile.levels[skill.name]?.toString() ?? "";
      message = "";
      tab = "method";
    }
  });
  let current = $derived(profile.levels[skill.name]);
  $effect(() => {
    level = current?.toString() ?? "";
  });
  let stages = $derived(availableStages(skill, profile.mode));
  let needsMembership = $derived(skillNeedsMembership(skill, profile));
  let stage = $derived(
    needsMembership
      ? undefined
      : (stages.find((s) => s.from === band) ?? trainingStage(skill, profile)),
  );
  let targetOptions = $derived.by(() => {
    const cap = profile.mode === "f2p" ? skill.freeToPlayCap : undefined;
    return [
      ...new Set([
        skill.goal,
        20,
        30,
        50,
        99,
        ...(cap && cap > 0 ? [cap] : []),
      ]),
    ]
      .filter((value) => cap === undefined || value <= cap)
      .sort((a, b) => a - b);
  });
  $effect(() => {
    if (targetOptions.length && !targetOptions.includes(target))
      target = targetOptions[0];
  });
  let filtered = $derived(
    SKILLS.filter((s) => s.name.toLowerCase().includes(search.toLowerCase())),
  );
  let ratio = $derived(
    current == null ? 0 : Math.min(100, Math.round((current / target) * 100)),
  );
  function saveLevel(event: SubmitEvent) {
    event.preventDefault();
    const n = Number(level);
    if (!Number.isInteger(n) || n < 1 || n > 120) {
      message = "Enter a whole level from 1 to 120.";
      return;
    }
    controller.updateProfile((p) => ({
      ...p,
      levels: { ...p.levels, [skill.name]: n },
    }));
    message = $saveError
      ? "Level changed in this tab, but the browser could not save it."
      : skill.name + " level saved on this device.";
  }
  function start() {
    if (!stage || needsMembership) return;
    controller.updateProfile((p) => ({
      ...p,
      activeTask: "train-" + skill.name,
      trainingRanges: { ...p.trainingRanges, [skill.name]: stage!.from },
    }));
    void goto("/play");
  }
  function switchMembers() {
    controller.updateProfile((p) => ({ ...p, mode: "members" }));
  }
</script>

<div class="skill-page page-enter">
  <PageHeading
    title="Skills"
    subtitle="Methods, equipment, and supplies for the selected skill."
    >{#snippet trailing()}<span class="badge badge-gold"
        ><GameArt file={skill.icon} size={16} />
        {profile.mode === "members" ? "Members view" : "F2P view"}</span
      >{/snippet}</PageHeading
  >
  <div class="journal-layout skill-layout">
    <ResponsivePicker label="Skill" selection={skill.name}
      ><aside class="panel journal-list">
        <SearchField
          label="Search skills"
          placeholder="Find a skill…"
          value={search}
          onChange={(v) => (search = v)}
        />
        <p class="list-kicker">SKILL GUIDES</p>
        {#each filtered as s (s.name)}<NavigationCard
            title={s.name}
            label={"Open training for " + s.name}
            image={s.icon}
            detail={s.category +
              (s.freeToPlayCap === 0
                ? " · Members"
                : s.freeToPlayCap !== undefined
                  ? " · F2P trial to " + s.freeToPlayCap
                  : "")}
            value={profile.levels[s.name] ?? "—"}
            selected={s.name === skill.name}
            wiki={s.wiki}
            onOpen={() => void goto(skillPath(s.name))}
          />{:else}<p class="empty-state">No skills match.</p>{/each}
      </aside></ResponsivePicker
    >
    <article class="panel skill-detail">
      <ActivityHeader
        title={skill.name}
        wiki={skill.wiki}
        image={skill.icon}
        artwork={skill.artwork}
        eyebrow={skill.category.toUpperCase()}
        >{#snippet meta()}<p>
            <GameText text={skill.description} />
          </p>{/snippet}</ActivityHeader
      >
      <div class="detail-body">
        <section class="skill-progress-card">
          <div class="skill-progress-top">
            <div>
              <span class="eyebrow">YOUR RECORDED LEVEL</span>
              <div class="big-level">
                {current ?? "—"}
                {#if targetOptions.length}<span>→ {target}</span>{/if}
              </div>
            </div>
            {#if targetOptions.length}<label class="target-selector"
                >Session target<select
                  aria-label="Training target"
                  bind:value={target}
                  >{#each targetOptions as n}<option value={n}>Level {n}</option
                    >{/each}</select
                ></label
              >{/if}
          </div>
          {#if targetOptions.length}<div class="progress-track">
              <span style:width={ratio + "%"}></span>
            </div>
            <div class="progress-caption">
              <span
                >{current == null
                  ? "Record your level to personalise the guide"
                  : current >= target
                    ? "Recorded level target reached"
                    : target - current + " levels to your target"}</span
              ><span>Level progress, not XP progress</span>
            </div>{/if}
          <form class="level-form" onsubmit={saveLevel}>
            <label
              >Update recorded level<input
                aria-label={skill.name + " level"}
                type="number"
                min="1"
                max="120"
                step="1"
                required
                value={level}
                oninput={(e) => (level = e.currentTarget.value)}
              /></label
            ><Button type="submit">Save level</Button>
          </form>
          <p class="form-message" role="status">
            <GameText
              text={message || "Manual entry · update your recorded level"}
            />
          </p>
        </section>
        <div class="why-card">
          <div>
            <span class="eyebrow">WHAT THIS TRAINING UNLOCKS</span>
            <p><GameText text={skill.payoff} /></p>
          </div>
        </div>
        {#if stage}
          <section class="detail-section">
            <SectionHeading title="Choose a training range"
              >{#snippet aside()}<span class="muted">Training methods</span
                >{/snippet}</SectionHeading
            ><ResponsivePicker
              label="Range"
              selection={"Levels " + stage.from + "–" + stage.to}
              ><div class="range-selector">
                {#each stages as s (s.from)}<NavigationCard
                    title={"Levels " + s.from + "–" + s.to}
                    label={"Select levels " + s.from + " to " + s.to}
                    detail={s.title}
                    selected={stage === s}
                    onOpen={() => (band = s.from)}
                  />{/each}
              </div></ResponsivePicker
            >
          </section>
          <Tabs
            variant="detail"
            label="Training guide sections"
            value={tab}
            onChange={(v) => (tab = v)}
            items={[
              { value: "method", label: "Method" },
              { value: "equipment", label: "Gear & tools" },
              { value: "supplies", label: "Supplies" },
            ]}
          />
          <section class="training-method">
            {#if tab === "method"}<span class="eyebrow"
                >LEVEL {stage.from}–{stage.to}</span
              >
              <h3><GameText text={stage.title} /></h3>
              <LocationGallery
                locations={stageLocations(stage, profile.mode)}
                {profile}
              />
              <p><GameText text={stage.method} /></p>
              <div class="method-note">
                Compare full sessions, including travel and banking. No measured
                XP/hour estimates.
              </div>{:else if tab === "equipment"}<span class="eyebrow"
                >TOOLS</span
              >
              <h3>Equipment to prepare</h3>
              <p>Use the best equipment you own and can use.</p>
              <ItemList items={stage.supplies} />{:else}<span class="eyebrow"
                >TRAINING SESSION</span
              >
              <h3>Gather before you go</h3>
              <ItemList items={stage.supplies} />
              <p>Check off items and save notes in Play Companion.</p>{/if}
          </section>
          {#if profile.mode === "members"}<div class="notice">
              <GameArt file={skill.icon} size={20} />
              <div>
                <strong>Members content preview</strong>
                <p><GameText text={skill.membersNote} /></p>
              </div>
            </div>{/if}
          <div class="detail-actions">
            <Button variant="primary" onclick={start}>Start packing →</Button
            ><WikiAction
              page={skill.trainingWiki ?? skill.wiki}
              label="Skill reference"
            />
          </div>
        {:else}
          <div class="notice">
            <div>
              <strong>Membership needed for this training</strong>
              <p>
                {skill.freeToPlayCap === 0
                  ? "This skill cannot be trained in free-to-play."
                  : "Your free-to-play trial has reached its limit, or no free-to-play method is available."}
                Your recorded progress remains safe.
              </p>
              <Button onclick={switchMembers}>Switch to Members</Button
              ><WikiAction
                page={skill.trainingWiki ?? skill.wiki}
                label="Skill reference"
              />
            </div>
          </div>
        {/if}
      </div>
    </article>
  </div>
</div>

<style>
  @media (min-width: 1001px) {
    :global(.skill-layout .journal-list) {
      max-height: calc(100dvh - 170px);
      overflow-y: auto;
    }
  }
  @media (max-width: 1000px) {
    :global(.skill-layout .journal-list) {
      max-height: 60dvh;
      overflow-y: auto;
    }
  }
</style>
