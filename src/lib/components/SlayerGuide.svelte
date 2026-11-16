<script lang="ts">
  import { skillByName, type Profile } from "../../data";
  import { SLAYER_BLOCKS } from "../../slayerGuide";
  import {
    SLAYER_TASK_EXTRAS,
    gearStyleFor,
    slayerGearMethod,
  } from "../../slayerGear";
  import { canUseMaster, masterFor, mastersFor } from "../../slayerMasters";
  import {
    ALTERNATIVE_TRADEOFFS,
    groupedTasks,
    masterGaps,
    masterRequirements,
    slayerTaskCard,
    type RequirementChip,
    type VerdictGroup,
  } from "../../slayerTaskView";
  import { wikiHref } from "../../wiki";
  import { getCompass } from "../compassContext";
  import ChoiceStrip from "./ChoiceStrip.svelte";
  import GameText from "./GameText.svelte";
  import GameWindow from "./GameWindow.svelte";
  import StatusChip from "./StatusChip.svelte";
  import TrainingEquipment from "./TrainingEquipment.svelte";
  import TrainingMap from "./TrainingMap.svelte";
  import WikiAction from "./WikiAction.svelte";

  let { profile }: { profile: Profile } = $props();
  const compass = getCompass();
  const slayer = skillByName("Slayer");

  const GROUP_LABEL: Record<VerdictGroup, string> = {
    prefer: "Prefer",
    do: "Do",
    skip: "Skip",
    block: "Block",
    none: "No verdict yet",
  };
  const TONE = { met: "ok", below: "bad", unknown: "warn" } as const;
  const SUFFIX = { met: "met", below: "not met", unknown: "unknown" } as const;

  const choice = $derived(masterFor(profile));
  const masters = $derived(mastersFor(profile));
  // The master being read: the one the player picked a task from, else their own master, else the first they can use.
  let looking = $state<{ profile: string; master: string }>();
  const viewed = $derived(
    masters.find(
      (m) =>
        m.id ===
        (looking?.profile === profile.id
          ? looking.master
          : (profile.slayerTask?.master ?? choice.master?.id)),
    ) ??
      choice.master ??
      masters[0],
  );
  const saved = $derived(
    viewed && profile.slayerTask?.master === viewed.id
      ? profile.slayerTask.task
      : "",
  );
  const groups = $derived(viewed ? groupedTasks(profile, viewed.id) : []);
  const card = $derived(
    viewed && saved ? slayerTaskCard(profile, viewed, saved) : undefined,
  );
  const lists = $derived(viewed ? SLAYER_BLOCKS[viewed.id] : undefined);
  const gearMethod = $derived(
    viewed && card
      ? slayerGearMethod(viewed, card.task, card.verdict?.fastest.site)
      : undefined,
  );
  const nextMissing = $derived(
    choice.next ? masterGaps(profile, choice.next) : [],
  );
  // Reading a master that isn't the player's own: what they still lack for it.
  const viewedGaps = $derived(
    viewed && viewed.id !== choice.master?.id ? masterGaps(profile, viewed) : [],
  );
  const extras = $derived(card ? (SLAYER_TASK_EXTRAS[card.task.name] ?? []) : []);

  function pickMaster(id: string) {
    looking = { profile: profile.id, master: id };
  }
  function pickTask(event: Event) {
    const id = (event.currentTarget as HTMLSelectElement).value;
    if (viewed && id) compass.setSlayerTask({ master: viewed.id, task: id });
  }
</script>

{#snippet chipRow(chips: RequirementChip[])}
  {#if chips.length}
    <ul class="chips">
      {#each chips as chip (chip.label)}
        <li>
          <StatusChip
            tone={TONE[chip.status]}
            label={`${chip.label} · ${SUFFIX[chip.status]}`}
          />
        </li>
      {/each}
    </ul>
  {:else}
    <p class="cap">No requirements.</p>
  {/if}
{/snippet}

{#snippet entries(list: { task: string; reason: string }[], empty: string)}
  {#if list.length}
    <ul class="entries">
      {#each list as entry (entry.task)}
        <li><b>{entry.task}</b><span>{entry.reason}</span></li>
      {/each}
    </ul>
  {:else}
    <p class="cap">{empty}</p>
  {/if}
{/snippet}

{#if viewed}
  <div class="slayer-guide">
    <GameWindow title="Your Slayer master" trailing={profile.mode === "members" ? "Members" : "F2P"}>
      <div class="body">
        {#if choice.unrecorded}
          <p class="prompt" role="status">
            <a href="/levels">Record your {choice.unrecorded.join(", ")} level</a>
            to see your real master.{#if choice.master}
              Until then this is the best master your recorded levels allow.{/if}
          </p>
        {/if}
        {#if choice.master}
          <div class="master">
            <a
              class="name"
              href={wikiHref(choice.master.wiki)}
              target="_blank"
              rel="noopener noreferrer">{choice.master.name} ↗</a
            >
            <span class="cap">{choice.master.location ?? ""}</span>
          </div>
          {@render chipRow(masterRequirements(profile, choice.master))}
        {:else if !choice.unrecorded}
          <p class="cap">No Slayer master is available for your levels yet.</p>
        {/if}
        {#if choice.next}
          <p class="next">
            <span class="label">Next</span>
            <a
              href={wikiHref(choice.next.wiki)}
              target="_blank"
              rel="noopener noreferrer">{choice.next.name}</a
            >{#if nextMissing.length}, once you have:{:else}: you meet every requirement we can check.{/if}
          </p>
          {#if nextMissing.length}{@render chipRow(nextMissing)}{/if}
        {/if}
        {#if choice.alternatives.length}
          <h4>Wilderness alternatives</h4>
          <p class="cap">Open to you, but never the default.</p>
          <ul class="entries">
            {#each choice.alternatives as alt (alt.id)}
              <li>
                <b
                  ><a
                    href={wikiHref(alt.wiki)}
                    target="_blank"
                    rel="noopener noreferrer">{alt.name}</a
                  ></b
                >
                {@render chipRow(masterRequirements(profile, alt))}
                <span>{ALTERNATIVE_TRADEOFFS[alt.id] ?? ""}</span>
              </li>
            {/each}
          </ul>
        {/if}
        <ChoiceStrip
          label="Master to read"
          name="slayer-master"
          value={viewed.id}
          choices={masters.map((m) => ({
            value: m.id,
            label: m.name,
            detail: canUseMaster(profile, m) ? undefined : "locked",
            description:
              m.name +
              (m.location ? " · " + m.location : "") +
              (canUseMaster(profile, m) ? "" : " (locked: requirements not met)"),
          }))}
          onChange={pickMaster}
        />
      </div>
    </GameWindow>

    <GameWindow title="Your task" trailing={viewed.name}>
      <div class="body">
        {#if viewedGaps.length}
          <div class="prompt" role="status">
            <p>
              You don't meet {viewed.name}'s requirements yet, so this isn't
              your master. You still need:
            </p>
            {@render chipRow(viewedGaps)}
          </div>
        {/if}
        <label class="picker"
          >Task from {viewed.name}
          <select value={saved} onchange={pickTask}>
            <option value="" disabled>Choose your current task</option>
            {#each groups as { group, tasks } (group)}
              <optgroup label={GROUP_LABEL[group]}>
                {#each tasks as task (task.id)}
                  <option value={task.id}>{task.name}</option>
                {/each}
              </optgroup>
            {/each}
          </select>
        </label>
        <p class="cap">
          Jagex doesn't publish your current task, so pick it. Compass keeps it
          for this character.
        </p>

        {#if card}
          {@const { task, verdict } = card}
          <article class="card" aria-label={task.name}>
            <header>
              <h3>{task.name}</h3>
              <span class="verdict v-{verdict?.verdict ?? 'none'}"
                >{GROUP_LABEL[verdict?.verdict ?? "none"]}</span
              >
            </header>
            {#if verdict}
              <p><GameText text={verdict.reason} /></p>
              {#if verdict.feeds.length}
                <p class="cap">Feeds {verdict.feeds.join(", ")} as well as Slayer and combat.</p>
              {/if}
              {#if card.showMainNote && verdict.mainNote}
                <p class="main-note"><b>On a regular account:</b> <GameText text={verdict.mainNote} /></p>
              {/if}
              <h4>Fastest way</h4>
              <p>
                {verdict.fastest.where}. {verdict.fastest.style === "any"
                  ? "Any combat style works"
                  : "Use " + verdict.fastest.style}{verdict.fastest.aoe
                  ? ", with area attacks"
                  : ""}.
              </p>
              <p class="cap"><GameText text={verdict.fastest.notes} /></p>
              {#if gearMethod?.sites.length}
                <div class="map"><TrainingMap method={gearMethod} {profile} /></div>
              {/if}
            {:else}
              <p><b>No verdict yet.</b> Compass hasn't rated this task, so there's no recommendation to show.</p>
            {/if}

            <h4>You need</h4>
            {@render chipRow(card.requirements)}

            <h4>Task facts</h4>
            <ul class="facts">
              <li>Amount {task.amount[0]}–{task.amount[1]}</li>
              <li>Weighting {task.weight}</li>
              {#if task.members}<li>Members only</li>{/if}
            </ul>

            {#if extras.length}
              <h4>Bring for this task</h4>
              <ul class="entries">
                {#each extras as extra (extra.item)}
                  <li>
                    <b
                      ><a
                        href={wikiHref(extra.item)}
                        target="_blank"
                        rel="noopener noreferrer">{extra.item}</a
                      ></b
                    ><span
                      >{extra.why}{extra.helmet
                        ? " A Slayer helmet covers it."
                        : ""}
                      <a
                        href={wikiHref(extra.source)}
                        target="_blank"
                        rel="noopener noreferrer">Wiki</a
                      ></span
                    >
                  </li>
                {/each}
              </ul>
            {/if}

            <p class="cap links">
              <WikiAction page={task.wiki} label="Task on the Wiki" />
              {#if verdict}
                · Checked {verdict.checked} ·
                {#each verdict.sources as source, i (source)}{i ? " · " : ""}<a
                    href={source}
                    target="_blank"
                    rel="noopener noreferrer">source {i + 1}</a
                  >{/each}
              {/if}
            </p>
          </article>

          {#if verdict && gearMethod && slayer}
            {#key card.task.id}
              <TrainingEquipment
                skill={slayer}
                method={gearMethod}
                {profile}
                defaultStyle={gearStyleFor(verdict.fastest.style)}
                omitExtras={extras.map((extra) => extra.item)}
              />
            {/key}
          {/if}
        {:else}
          <p class="cap">Pick a task to see the verdict, how to do it fastest and what you need.</p>
        {/if}
      </div>
    </GameWindow>

    <GameWindow title="Block, skip and prefer" trailing={viewed.name}>
      <div class="body">
        {#if lists}
          <h4>Prefer, best first</h4>
          <p class="cap">You have up to 8 prefer slots; spend them in this order.</p>
          {#if lists.prefer.length}
            <ol class="entries">
              {#each lists.prefer as entry (entry.task)}
                <li><b>{entry.task}</b><span>{entry.reason}</span></li>
              {/each}
            </ol>
          {:else}
            <p class="cap">Nothing here is worth a prefer slot.</p>
          {/if}
          <h4>Block first</h4>
          {@render entries(lists.block, "This master assigns nothing worth a block.")}
          <h4>Skip if you have points</h4>
          {@render entries(lists.skip, "This master assigns nothing worth a skip.")}
          <p class="cap">Checked {lists.checked}.</p>
        {:else}
          <p class="cap">No block, skip or prefer list for {viewed.name} yet.</p>
        {/if}
      </div>
    </GameWindow>
  </div>
{/if}

<style>
  .slayer-guide {
    display: flex;
    flex-direction: column;
    gap: 20px;
    min-width: 0;
  }
  .body {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 14px 16px;
    min-width: 0;
  }
  .cap {
    margin: 0;
    font-size: var(--font-caption);
    line-height: 1.5;
    color: var(--muted);
  }
  .body p {
    margin: 0;
    overflow-wrap: anywhere;
  }
  .body :global(.choice-fieldset) {
    margin: 0;
  }
  .master {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 4px 12px;
  }
  .name {
    font:
      600 20px/28px "Cinzel",
      Georgia,
      serif;
    color: var(--heading);
  }
  .label,
  h4 {
    font-size: var(--font-caption);
    font-weight: 700;
    letter-spacing: 1.55px;
    text-transform: uppercase;
    color: var(--muted);
  }
  h3,
  h4 {
    margin: 0;
  }
  h4 {
    margin-top: 6px;
  }
  .body a {
    color: var(--gold-bright);
    text-decoration: underline;
    text-underline-offset: 3px;
  }
  .prompt {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 8px 10px;
    border: 1px solid var(--warn);
    border-radius: 3px;
    background: var(--well);
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .chips :global(.status-chip) {
    white-space: normal;
  }
  .picker {
    display: grid;
    gap: 6px;
  }
  .picker select {
    width: 100%;
    min-width: 0;
    min-height: 44px;
  }
  .card {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 14px;
    min-width: 0;
    border: 1px solid #33434d;
    border-radius: 3px;
    background: var(--well);
  }
  .card header {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  .verdict {
    padding: 2px 10px;
    border: 1px solid currentColor;
    border-radius: 4px;
    font-weight: 700;
  }
  .v-prefer,
  .v-do {
    color: var(--green);
  }
  .v-skip {
    color: var(--warn);
  }
  .v-block {
    color: var(--bad);
  }
  .v-none {
    color: var(--muted);
  }
  .main-note {
    padding: 8px 10px;
    border-left: 3px solid var(--gold);
  }
  .map {
    min-width: 0;
  }
  .facts {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 16px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .entries {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin: 0;
    padding-left: 0;
    list-style: none;
  }
  ol.entries {
    padding-left: 22px;
    list-style: decimal;
  }
  .entries li {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
    overflow-wrap: anywhere;
  }
  .entries li > span {
    color: var(--muted);
    font-size: var(--font-caption);
    line-height: 1.5;
  }
  .links {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }
</style>
