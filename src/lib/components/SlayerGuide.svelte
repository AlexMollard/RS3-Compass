<script lang="ts">
  import {
    Ban,
    Check,
    CircleQuestionMark,
    Dices,
    Hash,
    MapPin,
    Radius,
    SkipForward,
    Star,
  } from "@lucide/svelte";
  import { skillByName, type Profile } from "../../data";
  import { SLAYER_BLOCKS } from "../../slayerGuide";
  import {
    SLAYER_HELMET_IMAGE,
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
    skillIcon,
    slayerTaskCard,
    taskNamed,
    type RequirementChip,
    type VerdictGroup,
  } from "../../slayerTaskView";
  import { wikiHref } from "../../wiki";
  import { getCompass } from "../compassContext";
  import CheckedSources from "./CheckedSources.svelte";
  import ChoiceStrip from "./ChoiceStrip.svelte";
  import FallbackArt from "./FallbackArt.svelte";
  import GameArt from "./GameArt.svelte";
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
  const VERDICT_ICON = {
    prefer: Star,
    do: Check,
    skip: SkipForward,
    block: Ban,
    none: CircleQuestionMark,
  } satisfies Record<VerdictGroup, typeof Star>;
  // The skill icon for each combat style; "any" gets none.
  const STYLE_SKILL = {
    melee: "Attack",
    ranged: "Ranged",
    magic: "Magic",
    necromancy: "Necromancy",
  } as const;
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

{#snippet newTab()}<span aria-hidden="true">↗</span><span class="sr-only">
    (opens a new tab)</span
  >{/snippet}

{#snippet chipRow(chips: RequirementChip[])}
  {#if chips.length}
    <ul class="chips">
      {#each chips as chip (chip.label)}
        <li>
          {#if chip.wiki}<a
              class="chip-link"
              href={wikiHref(chip.wiki)}
              target="_blank"
              rel="noopener noreferrer"
              ><StatusChip
                tone={TONE[chip.status]}
                image={chip.icon}
                label={`${chip.label} · ${SUFFIX[chip.status]}`}
              /><span class="sr-only"> (opens a new tab)</span></a
            >{:else}<StatusChip
              tone={TONE[chip.status]}
              image={chip.icon}
              label={`${chip.label} · ${SUFFIX[chip.status]}`}
            />{/if}
        </li>
      {/each}
    </ul>
  {:else}
    <p class="cap">No requirements.</p>
  {/if}
{/snippet}

{#snippet verdictBadge(group: VerdictGroup)}
  {@const Icon = VERDICT_ICON[group]}
  <span class="verdict v-{group}"
    ><Icon size={15} aria-hidden="true" />{GROUP_LABEL[group]}</span
  >
{/snippet}

{#snippet listHeading(group: VerdictGroup, text: string)}
  {@const Icon = VERDICT_ICON[group]}
  <h4 class="list-heading v-{group}"><Icon size={15} aria-hidden="true" />{text}</h4>
{/snippet}

{#snippet entries(
  masterId: string,
  list: { task: string; reason: string }[],
  empty: string,
  ordered = false,
)}
  {#if list.length}
    <svelte:element this={ordered ? "ol" : "ul"} class="entries art-entries">
      {#each list as entry (entry.task)}
        {@const task = taskNamed(masterId, entry.task)}
        <li>
          <FallbackArt file={task?.image} size={40} thumbnail className="entry-art" />
          <div class="entry-copy">
            <b
              >{#if task}<a
                  href={wikiHref(task.wiki)}
                  target="_blank"
                  rel="noopener noreferrer">{entry.task}{@render newTab()}</a
                >{:else}{entry.task}{/if}</b
            ><span>{entry.reason}</span>
          </div>
        </li>
      {/each}
    </svelte:element>
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
            <FallbackArt file={choice.master.image} size={64} className="chathead" />
            <div class="master-copy">
              <a
                class="name"
                href={wikiHref(choice.master.wiki)}
                target="_blank"
                rel="noopener noreferrer"
                >{choice.master.name} {@render newTab()}</a
              >
              {#if choice.master.location}
                <span class="cap place"
                  ><MapPin size={14} aria-hidden="true" />{choice.master.location}</span
                >
              {/if}
            </div>
          </div>
          {@render chipRow(masterRequirements(profile, choice.master))}
        {:else if !choice.unrecorded}
          <p class="cap">No Slayer master is available for your levels yet.</p>
        {/if}
        {#if choice.next}
          <p class="next">
            <span class="label">Next</span>
            <FallbackArt file={choice.next.image} size={32} className="chathead" />
            <span
              ><a
                href={wikiHref(choice.next.wiki)}
                target="_blank"
                rel="noopener noreferrer">{choice.next.name}{@render newTab()}</a
              >{#if nextMissing.length}, once you have:{:else}: you meet every requirement we can check.{/if}</span
            >
          </p>
          {#if nextMissing.length}{@render chipRow(nextMissing)}{/if}
        {/if}
        {#if choice.alternatives.length}
          <h4>Wilderness alternatives</h4>
          <p class="cap">Open to you, but never the default.</p>
          <ul class="entries art-entries">
            {#each choice.alternatives as alt (alt.id)}
              <li>
                <FallbackArt file={alt.image} size={40} className="entry-art chathead" />
                <div class="entry-copy">
                  <b
                    ><a
                      href={wikiHref(alt.wiki)}
                      target="_blank"
                      rel="noopener noreferrer">{alt.name}{@render newTab()}</a
                    ></b
                  >
                  {@render chipRow(masterRequirements(profile, alt))}
                  <span>{ALTERNATIVE_TRADEOFFS[alt.id] ?? ""}</span>
                </div>
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
            image: m.image,
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
              <FallbackArt file={task.image} size={72} thumbnail className="monster" />
              <h3>
                <a
                  href={wikiHref(task.wiki)}
                  target="_blank"
                  rel="noopener noreferrer">{task.name} {@render newTab()}</a
                >
              </h3>
              {@render verdictBadge(verdict?.verdict ?? "none")}
            </header>
            {#if verdict}
              <p><GameText text={verdict.reason} /></p>
              {#if verdict.feeds.length}
                <div class="feeds">
                  <span class="label">Feeds</span>
                  <ul class="tags">
                    {#each verdict.feeds as skill (skill)}
                      <li>
                        <a class="tag" href={"/skills/" + encodeURIComponent(skill)}
                          ><GameArt file={skillIcon(skill)} size={18} />{skill}</a
                        >
                      </li>
                    {/each}
                  </ul>
                  <span class="cap">as well as Slayer and combat.</span>
                </div>
              {/if}
              {#if card.showMainNote && verdict.mainNote}
                <p class="main-note"><b>On a regular account:</b> <GameText text={verdict.mainNote} /></p>
              {/if}
              <h4>Fastest way</h4>
              <ul class="tags">
                <li class="tag"><MapPin size={16} aria-hidden="true" />{verdict.fastest.where}</li>
                <li class="tag">
                  {#if verdict.fastest.style === "any"}Any combat style works{:else}<GameArt
                      file={skillIcon(STYLE_SKILL[verdict.fastest.style])}
                      size={18}
                    />Use {verdict.fastest.style}{/if}
                </li>
                {#if verdict.fastest.aoe}
                  <li class="tag"><Radius size={16} aria-hidden="true" />Area attacks</li>
                {/if}
              </ul>
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
            <ul class="tags">
              <li class="tag"><Hash size={16} aria-hidden="true" />Amount {task.amount[0]}–{task.amount[1]}</li>
              <li class="tag"><Dices size={16} aria-hidden="true" />Weighting {task.weight ?? "unknown"}</li>
              {#if task.members}<li class="tag"><GameArt file="P2P_icon.png" size={16} />Members only</li>{/if}
            </ul>

            {#if extras.length}
              <h4>Bring for this task</h4>
              <ul class="entries art-entries">
                {#each extras as extra (extra.item)}
                  <li>
                    <GameArt file={extra.image} size={36} className="entry-art" />
                    <div class="entry-copy">
                      <b
                        ><a
                          href={wikiHref(extra.item)}
                          target="_blank"
                          rel="noopener noreferrer">{extra.item}{@render newTab()}</a
                        ></b
                      ><span
                        >{extra.why}
                        {#if extra.helmet}
                          <span class="helmet"
                            ><GameArt file={SLAYER_HELMET_IMAGE} size={16} />A
                            <a
                              href={wikiHref("Slayer helmet")}
                              target="_blank"
                              rel="noopener noreferrer">Slayer helmet{@render newTab()}</a
                            > covers it.</span
                          >
                        {/if}
                        <a
                          href={wikiHref(extra.source)}
                          target="_blank"
                          rel="noopener noreferrer"
                          >Wiki<span class="sr-only"
                            >: {extra.source} on RuneScape Wiki (opens a new tab)</span
                          ></a
                        ></span
                      >
                    </div>
                  </li>
                {/each}
              </ul>
            {/if}

            <p class="cap links">
              <WikiAction page={task.wiki} label="Task on the Wiki" />
              {#if verdict}
                ·
                <CheckedSources
                  checked={verdict.checked}
                  sources={verdict.sources}
                />
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
          {@render listHeading("prefer", "Prefer, best first")}
          <p class="cap">You have up to 8 prefer slots; spend them in this order.</p>
          {@render entries(viewed.id, lists.prefer, "Nothing here is worth a prefer slot.", true)}
          {@render listHeading("block", "Block first")}
          {@render entries(viewed.id, lists.block, "This master assigns nothing worth a block.")}
          {@render listHeading("skip", "Skip if you have points")}
          {@render entries(viewed.id, lists.skip, "This master assigns nothing worth a skip.")}
          <p class="cap">
            <CheckedSources checked={lists.checked} sources={lists.sources} />
          </p>
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
    align-items: center;
    gap: 12px;
    min-width: 0;
  }
  .master-copy {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }
  .place,
  .tag,
  .list-heading,
  .helmet {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  /* Chatheads and monster art are tall or wide; keep each in a square box. */
  .body :global(:is(.chathead, .monster, .entry-art)) {
    aspect-ratio: 1 / 1;
    object-fit: contain;
  }
  .body :global(.chathead) {
    border: 1px solid var(--frame-line);
    border-radius: 4px;
    background: var(--panel-raised);
  }
  .next {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 8px;
  }
  .chip-link {
    text-decoration: none !important;
  }
  .chip-link:hover :global(.status-chip) {
    background: var(--panel-raised);
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
  .picker {
    font-weight: 600;
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
    gap: 8px 12px;
  }
  .card header h3 {
    flex: 1 1 140px;
    min-width: 0;
  }
  .card :global(.monster) {
    padding: 4px;
    border: 1px solid #33434d;
    border-radius: 4px;
    background: var(--panel);
  }
  .verdict {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 2px 10px;
    border: 1px solid currentColor;
    border-radius: 4px;
    font-weight: 700;
  }
  .list-heading.v-prefer,
  .list-heading.v-block,
  .list-heading.v-skip {
    margin-top: 10px;
  }
  .feeds {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 8px;
  }
  .tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .tag {
    min-height: 28px;
    padding: 2px 9px;
    border: 1px solid #33434d;
    border-radius: 4px;
    background: var(--panel);
    font-size: var(--font-caption);
    font-weight: 600;
    overflow-wrap: anywhere;
  }
  .body a.tag {
    color: var(--text);
    text-decoration: none;
  }
  .body a.tag:hover {
    border-color: var(--gold);
  }
  .tag :global(svg) {
    flex: none;
    color: var(--muted);
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
  .entries {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin: 0;
    padding-left: 0;
    list-style: none;
  }
  ol.entries {
    counter-reset: rank;
  }
  ol.entries li::before {
    counter-increment: rank;
    content: counter(rank);
    flex: none;
    width: 1.6em;
    padding-top: 10px;
    color: var(--gold-bright);
    font-weight: 700;
    text-align: right;
  }
  .entries li {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
    overflow-wrap: anywhere;
  }
  .entries li > span,
  .entry-copy > span {
    color: var(--muted);
    font-size: var(--font-caption);
    line-height: 1.5;
  }
  .art-entries li {
    flex-direction: row;
    align-items: flex-start;
    gap: 10px;
  }
  .entry-copy {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  }
  .art-entries :global(.entry-art) {
    border: 1px solid #33434d;
    border-radius: 4px;
    background: var(--panel);
  }
  .links {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }
</style>
