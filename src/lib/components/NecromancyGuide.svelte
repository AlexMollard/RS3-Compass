<script lang="ts">
  // The Necromancy page guide (spec: docs/superpowers/specs/2026-11-16-necromancy-guide-design.md, Goals and Page).
  // Lazy-loaded by SkillPage: it pulls in the generated Necromancy data, which stays out of the main chunk.
  import { QUESTS, skillByName, type Profile } from "../../data";
  import {
    DISTURBANCES,
    DUNGEONEERING_WEAPONS,
    NECRO_IMPORT,
    PROGRESS_TARGETS,
    RITUAL_QUESTS,
    RITUAL_SITE,
    SOUL_GATES,
    progressKey,
    type Target,
  } from "../../necromancyGuide";
  import { NECRO_RITUALS, NECRO_UPGRADES } from "../../necromancyImported";
  import type { Ritual, RitualItem, UpgradeStep } from "../../necromancyTypes";
  import {
    gearPath,
    killNext,
    ritualsFor,
    soulStatus,
    showsMainNote,
    storyProgress,
    tier95,
    type GearLine,
    type GearPath,
    type Req,
    type RobeLine,
  } from "../../necromancyView";
  import { wikiHref } from "../../wiki";
  import { getCompass } from "../compassContext";
  import { MAX_SOULS } from "../profileStore";
  import Button from "./Button.svelte";
  import CheckedSources from "./CheckedSources.svelte";
  import ChoiceStrip from "./ChoiceStrip.svelte";
  import GameArt from "./GameArt.svelte";
  import GameText from "./GameText.svelte";
  import GameWindow from "./GameWindow.svelte";
  import StatusChip from "./StatusChip.svelte";
  import TrainingMap from "./TrainingMap.svelte";

  let { profile }: { profile: Profile } = $props();
  const compass = getCompass();
  const necromancy = skillByName("Necromancy");
  const FREE_CAP = necromancy?.freeToPlayCap ?? 20;

  const TONE = { met: "ok", below: "bad", unknown: "warn", check: "neutral" } as const;
  const SUFFIX = { met: "met", below: "not met", unknown: "unknown", check: "check in game" } as const;
  const STATE = {
    done: { tone: "ok", label: "Done" },
    next: { tone: "info", label: "Next" },
    locked: { tone: "neutral", label: "Locked" },
    unknown: { tone: "warn", label: "Unknown" },
  } as const;
  const LINE_PAGE: Record<UpgradeStep["line"], string> = {
    weapon: "Death Skull equipment",
    deathwarden: "Deathwarden robe armour",
    deathdealer: "Deathdealer robe armour",
  };
  /** Each Dungeoneering weapon set's Wiki page (also the first source of its entry). */
  const DUNGEONEERING_PAGE = { Gravite: "Gravite weaponry", Chaotic: "Chaotic equipment", Ruinous: "Ruinous weapons" };
  // shortcut: training locations are display strings; most are Wiki titles, and these two (checked 2026-11-17) aren't.
  // Move a `wiki` field onto locations if more of them stop matching a page.
  const LOCATION_PAGE: Record<string, string> = {
    "Stronghold of Security ankou": "Stronghold of Security",
    "Slayer Tower abyssal demons": "Slayer Tower",
  };
  const NOT_RECORDED = "none";
  const questsById = new Map(QUESTS.map((q) => [q.id, q]));
  const questByName = new Map(QUESTS.map((q) => [q.name, q]));
  const ritualByName = new Map(NECRO_RITUALS.map((r) => [r.name, r]));

  const free = $derived(profile.mode === "f2p");
  const regular = $derived(showsMainNote(profile));
  const bosses = $derived(tier95(profile));
  const story = $derived(storyProgress(profile));
  const souls = $derived(soulStatus(profile));
  const soulGate = $derived(SOUL_GATES.find((g) => g.souls === souls?.next?.souls));
  const weapon = $derived(gearPath(profile, "weapon"));
  const robe = $derived(gearPath(profile, "robe"));
  const kill = $derived(killNext(profile));
  const rituals = $derived(ritualsFor(profile));
  const groups = $derived(byName(rituals.now));
  // The next upgrade's ensoul ritual when it's locked but isn't the next unlock, so its marker still shows.
  const upgradeLater = $derived(
    rituals.forNextUpgrade &&
      rituals.next?.id !== rituals.forNextUpgrade &&
      !rituals.now.some((r) => r.id === rituals.forNextUpgrade)
      ? NECRO_RITUALS.find((r) => r.id === rituals.forNextUpgrade)
      : undefined,
  );

  const count = (n: number) => n.toLocaleString("en-GB");
  const seconds = (ticks: number) => `${Math.round(ticks * 6) / 10} s`;
  /** A gear tier's Wiki page: its image file names the item ("Death_guard_(tier_20).png"). */
  const tierPage = (step: UpgradeStep) =>
    step.image ? step.image.replace(/\.(png|gif)$/, "").replaceAll("_", " ") : LINE_PAGE[step.line];
  /** A ghostly ink's Wiki file (each checked on the Wiki on 2026-11-16; the import gives inks no image). */
  const inkFile = (ink: string) => `${ink}.png`;
  const stepTarget = (step: UpgradeStep) => PROGRESS_TARGETS[progressKey(step.line, step.tier)];

  function byName(list: Ritual[]): Ritual[][] {
    const groups = new Map<string, Ritual[]>();
    for (const r of list) groups.set(r.name, [...(groups.get(r.name) ?? []), r]);
    return [...groups.values()];
  }

  // Pictures for the Kill-next progress row: what its target names, matched by name against the data that made it.
  const progressArt = $derived.by((): Target[] => {
    const target = kill.progress?.target;
    if (!target) return [];
    const quest = questByName.get(target);
    if (quest) return [{ name: quest.name, wiki: quest.wiki, image: quest.icon, detail: "" }];
    const ritual = ritualByName.get(target);
    if (ritual) return [{ name: ritual.name, wiki: ritual.name, image: ritual.image, detail: "" }];
    if (weapon.next) {
      const step = stepTarget(weapon.next.step);
      if (step?.task === target) return step.targets;
      if (step?.drop?.from.wiki === target) return [step.drop.from];
    }
    const boss = weapon.endgame?.target;
    if (boss?.wiki === target) return [{ name: boss.boss, wiki: boss.wiki, image: boss.image, detail: "" }];
    return [];
  });
  // The progress row cites the storyline quest it names, else the step or boss it comes from.
  const progressSource = $derived(
    story.find((r) => questsById.get(r.quest.quest)?.name === kill.progress?.target)?.quest ??
      (weapon.next ? stepTarget(weapon.next.step) : weapon.endgame?.target),
  );
  // The Kili task the progress row names, for what it needs beyond the step's own chips.
  const progressTask = $derived.by(() => {
    const step = weapon.next && stepTarget(weapon.next.step);
    return step && step.task === kill.progress?.target ? step : undefined;
  });
  // The next weapon step's unmet or unknown chips that the progress row doesn't already show (an unknown quest).
  const weaponBlockers = $derived(
    weapon.next?.reqs.filter(
      (r) =>
        (r.status === "below" || r.status === "unknown") &&
        !kill.progress?.reqs.some((p) => p.label === r.label),
    ) ?? [],
  );

  // Souls: a whole number from 0, or blank for not recorded. The field follows the recorded value and the character.
  // A text field, not type="number": a number field reports unparsable input ("3,500" in some browsers) as blank,
  // which would clear the recorded souls.
  let soulsInput = $state("");
  let soulsMessage = $state("");
  const recordedSouls = $derived(profile.necromancy?.souls);
  const profileId = $derived(profile.id);
  $effect(() => {
    void profileId;
    soulsInput = recordedSouls?.toString() ?? "";
  });
  $effect(() => {
    void profileId;
    soulsMessage = "";
  });
  function saveSouls(event: SubmitEvent) {
    event.preventDefault();
    const raw = soulsInput.trim();
    if (raw === "") {
      compass.setNecromancy({ souls: undefined });
      soulsMessage = "Souls cleared: not recorded.";
      return;
    }
    const digits = raw.replace(/[\s,]/g, "");
    const n = /^\d+$/.test(digits) ? Number(digits) : NaN;
    if (!Number.isInteger(n) || n > MAX_SOULS) {
      soulsMessage = `Enter a whole number from 0 to ${count(MAX_SOULS)}, or leave it blank.`;
      return;
    }
    compass.setNecromancy({ souls: n });
    soulsMessage = `${count(n)} souls saved for ${profile.name}.`;
  }

  const tierChoices = (path: GearPath) => [
    { value: NOT_RECORDED, label: "Not recorded", description: "Not recorded: assume from my levels" },
    ...path.steps.map((s) => ({
      value: String(s.tier),
      label: `T${s.tier}`,
      image: s.image,
      description: `Tier ${s.tier}`,
    })),
  ];
  const tierValue = (path: GearPath) => (path.assumed ? NOT_RECORDED : String(path.current));
  function pickTier(line: GearLine, value: string) {
    const tier = value === NOT_RECORDED ? undefined : Number(value);
    compass.setNecromancy(line === "weapon" ? { weaponTier: tier } : { robeTier: tier });
  }
  function pickRobeLine(value: string) {
    compass.setNecromancy({ robeLine: value as RobeLine });
  }
</script>

{#snippet chipRow(reqs: Req[])}
  {#if reqs.length}
    <ul class="chips">
      {#each reqs as req, i (i)}
        <li>
          <StatusChip tone={TONE[req.status]} label={`${req.label} · ${SUFFIX[req.status]}`} />
        </li>
      {/each}
    </ul>
  {:else}
    <p class="cap">No requirements.</p>
  {/if}
{/snippet}

{#snippet wikiLink(page: string, text: string)}
  <a href={wikiHref(page)} target="_blank" rel="noopener noreferrer"
    >{text}<span class="sr-only"> (opens a new tab)</span></a
  >
{/snippet}

{#snippet itemPill(item: RitualItem)}
  <a class="pill" href={wikiHref(item.item)} target="_blank" rel="noopener noreferrer">
    {#if item.image}<GameArt file={item.image} size={24} />{/if}
    <span>{count(item.qty)} × {item.item}</span><span class="sr-only"> (opens a new tab)</span>
  </a>
{/snippet}

{#snippet icons(list: { name: string; page: string; image?: string; qty?: number }[])}
  {#if list.some((i) => i.image)}
    <ul class="icons">
      {#each list as entry (entry.name)}
        {#if entry.image}
          <li>
            <a
              href={wikiHref(entry.page)}
              target="_blank"
              rel="noopener noreferrer"
              title={entry.qty ? `${count(entry.qty)} × ${entry.name}` : entry.name}
              ><GameArt file={entry.image} size={32} alt={entry.name} />{#if entry.qty}<small
                  >{count(entry.qty)}</small
                >{/if}<span class="sr-only"> (opens a new tab)</span></a
            >
          </li>
        {/if}
      {/each}
    </ul>
  {/if}
{/snippet}

{#snippet targets(list: Target[])}
  <ul class="targets">
    {#each list as t (t.name)}
      <li>
        {#if t.image}<GameArt file={t.image} size={40} />{/if}
        <span class="target-copy">
          <b>{@render wikiLink(t.wiki, t.name)}</b>
          {#if t.detail}<span class="cap"><GameText text={t.detail} /></span>{/if}
        </span>
      </li>
    {/each}
  </ul>
{/snippet}

{#snippet ritualCard(recipes: Ritual[])}
  {@const r = recipes[0]}
  {@const marked = recipes.find((x) => x.id === rituals.forNextUpgrade)}
  {@const rest = recipes.filter((x) => x !== marked)}
  <article class="ritual" class:upgrade={!!marked}>
    <header>
      {#if r.image}<GameArt file={r.image} size={36} />{/if}
      <span class="target-copy">
        <b>{@render wikiLink(r.name, r.name)}</b>
        <span class="cap"
          >Level {r.level} · tier {r.tier} · {count(r.xp)} XP · {seconds(r.ticks)}{r.members
            ? " · members"
            : ""}</span
        >
      </span>
      {#if marked}<StatusChip tone="info" label="For your next upgrade" />{/if}
    </header>
    {#snippet recipe(x: Ritual)}
      <li class="recipe">
        {#each x.inputs as item (item.item)}{@render itemPill(item)}{/each}
        <span class="arrow" aria-hidden="true">→</span><span class="sr-only">makes</span>
        {#each x.outputs as item (item.item)}{@render itemPill(item)}{/each}
      </li>
    {/snippet}
    {#if marked || rest.length <= 2}
      <ul class="recipes">
        {#if marked}{@render recipe(marked)}{/if}
        {#if rest.length <= 2}{#each rest as x (x.id)}{@render recipe(x)}{/each}{/if}
      </ul>
    {/if}
    {#if rest.length > 2}
      <details class="more">
        <summary>{marked ? `${rest.length} other recipes` : `${rest.length} recipes`}</summary>
        <ul class="recipes">
          {#each rest as x (x.id)}{@render recipe(x)}{/each}
        </ul>
      </details>
    {/if}
  </article>
{/snippet}

{#snippet nextStep(line: GearLine, path: GearPath)}
  {#if path.next}
    {@const step = path.next.step}
    {@const target = stepTarget(step)}
    <section class="next-step" id={`necro-next-${line}`} aria-label={`Next ${line} step`}>
      <header>
        {#if step.image}<GameArt file={step.image} size={40} />{/if}
        <span class="target-copy">
          <span class="label">Next step</span>
          <b>{@render wikiLink(tierPage(step), `Tier ${step.tier} ${step.line === "weapon" ? "weapons" : step.line === "deathdealer" ? "Deathdealer robes" : "Deathwarden robes"}`)}</b>
        </span>
      </header>
      {@render icons(
        step.materials.map((m) => ({ name: m.item, page: m.item, image: m.image, qty: m.qty })),
      )}
      {@render chipRow(path.next.reqs)}
      {#if target}
        <h4>{@render wikiLink(target.task, target.task)}</h4>
        {@render targets(target.targets)}
        {#if target.requires}<p class="cap"><b>Also needs:</b> <GameText text={target.requires} /></p>{/if}
        {#if target.drop}
          {@const drop = target.drop}
          <p class="drop">
            {#if drop.image}<GameArt file={drop.image} size={32} />{/if}
            <span
              >{count(drop.qty)} × {@render wikiLink(drop.item, drop.item)} from {@render wikiLink(
                drop.from.wiki,
                drop.from.name,
              )} ({drop.rate})</span
            >
          </p>
        {/if}
        {#if target.note}<p class="cap"><GameText text={target.note} /></p>{/if}
        {#if regular && target.mainNote}
          <p class="main-note"><b>On a regular account:</b> <GameText text={target.mainNote} /></p>
        {/if}
        <p class="cap"><CheckedSources checked={target.checked} sources={target.sources} /></p>
      {/if}
    </section>
  {/if}
{/snippet}

{#snippet ladder(line: GearLine, path: GearPath)}
  <ol class="ladder" aria-label={line === "weapon" ? "Weapon tiers" : "Robe tiers"}>
    {#each path.steps as step (`${step.line}-${step.tier}`)}
      <li class:current={step.tier === path.current} class:reached={step.tier < path.current}>
        <a
          href={wikiHref(tierPage(step))}
          target="_blank"
          rel="noopener noreferrer"
          title={tierPage(step)}
          aria-current={step.tier === path.current ? "step" : undefined}
        >
          {#if step.image}<GameArt file={step.image} size={32} alt={tierPage(step)} />{/if}
          <span>T{step.tier}</span><span class="sr-only"> (opens a new tab)</span>
        </a>
      </li>
    {/each}
    {#if path.endgame}
      {@const end = path.endgame}
      <li class="destination">
        <a href="#necro-tier-95" title="Tier 95: the end of the path">
          {#if end.target.image}<GameArt file={end.target.image} size={32} alt="" />{/if}
          <span>T95</span><span class="sr-only">: the tier 95 bosses, below</span>
        </a>
      </li>
    {/if}
  </ol>
  <p class="cap">
    Current: tier {path.current}{path.assumed ? ", assumed from your levels" : ", recorded"}.
  </p>
{/snippet}

<div class="necro-guide">
  {#if free}
    <p class="prompt" role="note">
      Free-to-play Necromancy training stops at level {FREE_CAP}. This guide shows what you can do up to there.
    </p>
  {/if}

  <GameWindow title="Your progress" icon={necromancy?.icon} trailing={free ? "F2P" : "Members"}>
    <div class="body">
      <h4>Storyline</h4>
      <ol class="story">
        {#each story as row (row.quest.quest)}
          {@const quest = questsById.get(row.quest.quest)}
          <li class="story-row state-{row.state}">
            <div class="story-head">
              {#if quest}<GameArt file={quest.icon} size={32} />{/if}
              <b
                >{@render wikiLink(
                  quest?.wiki ?? row.quest.quest,
                  quest?.name ?? row.quest.quest,
                )}</b
              >
              <StatusChip tone={STATE[row.state].tone} label={STATE[row.state].label} />
              {#if row.quest.optional}<span class="cap">Optional</span>{/if}
            </div>
            <p class="cap">
              <GameText
                text={row.quest.unlocks + (!free && row.quest.membersNote ? ` ${row.quest.membersNote}` : "")}
              />
            </p>
            {#if row.state !== "done"}{@render chipRow(row.reqs)}{/if}
            {#if regular && row.quest.mainNote}
              <p class="main-note"><b>On a regular account:</b> <GameText text={row.quest.mainNote} /></p>
            {/if}
            <p class="cap"><CheckedSources checked={row.quest.checked} sources={row.quest.sources} /></p>
          </li>
        {/each}
      </ol>

      {#if souls}
        <h4>Souls</h4>
        <div class="souls">
          <a href={wikiHref("Well of Souls")} target="_blank" rel="noopener noreferrer"
            ><GameArt file="Soul.png" size={32} alt="Souls" /><span class="sr-only">
              (Well of Souls, opens a new tab)</span
            ></a
          >
          <p>
            {souls.souls === undefined ? "Souls not recorded" : `${count(souls.souls)} souls recorded`} in the
            {@render wikiLink("Well of Souls", "Well of Souls")}{#if souls.next}. {souls.next.status === "met"
                ? "Gate"
                : "Next gate"}: {count(souls.next.souls)}.{:else}.{/if}
          </p>
        </div>
        {#if souls.next}
          <StatusChip
            tone={TONE[souls.next.status]}
            label={`${count(souls.next.souls)} souls · ${SUFFIX[souls.next.status]}`}
          />
          <p class="cap"><GameText text={souls.next.unlocks} /></p>
          {#if soulGate}<p class="cap"><CheckedSources checked={soulGate.checked} sources={soulGate.sources} /></p>{/if}
        {:else}
          <p class="cap">Every soul gate is behind you.</p>
        {/if}
        <form class="souls-form" onsubmit={saveSouls}>
          <label
            >Souls in the Well of Souls<input
              type="text"
              inputmode="numeric"
              autocomplete="off"
              placeholder="Not recorded"
              value={soulsInput}
              oninput={(e) => (soulsInput = e.currentTarget.value)}
            /></label
          ><Button type="submit">Save souls</Button>
        </form>
        <p class="cap" role="status">
          {soulsMessage || "Jagex doesn't publish souls. Leave it blank if you don't know."}
        </p>
      {/if}
    </div>
  </GameWindow>

  <GameWindow
    title="Gear path"
    icon={weapon.steps.find((s) => s.tier === weapon.current)?.image}
    trailing={`Weapon T${weapon.current}${weapon.assumed ? " (assumed)" : ""} · Robes T${robe.current}${robe.assumed ? " (assumed)" : ""}`}
  >
    <div class="body">
      <h4>Weapons: {@render wikiLink(LINE_PAGE.weapon, "death guard and skull lantern")}</h4>
      {@render ladder("weapon", weapon)}
      <ChoiceStrip
        label="Your weapon tier"
        name="necro-weapon-tier"
        value={tierValue(weapon)}
        choices={tierChoices(weapon)}
        onChange={(v) => pickTier("weapon", v)}
      />
      {@render nextStep("weapon", weapon)}

      {#if !free}
        <section class="side-note" aria-label="Dungeoneering weapons">
          <h4>Alternative: buy with Dungeoneering tokens</h4>
          <ul class="targets">
            {#each DUNGEONEERING_WEAPONS as w (w.name)}
              <li>
                {#if w.purchases[0]?.image}<GameArt file={w.purchases[0].image} size={36} />{/if}
                <span class="target-copy">
                  <b
                    >{@render wikiLink(DUNGEONEERING_PAGE[w.name], w.name)}: Necromancy {w.level}, Dungeoneering {w.dungeoneering}</b
                  >
                  <span class="cap"
                    >{#each w.purchases as p, i (p.items.join())}{i ? "; " : ""}{#each p.items as item, j (item)}{j
                          ? " and "
                          : ""}{@render wikiLink(item, item)}{/each}{" "}{count(p.tokens)} tokens{p.plus ? ` plus ${p.plus}` : ""}{/each}.
                    <GameText text={w.note} /></span
                  >
                  {#if w.unverified}<span class="cap warn">Unverified: {w.unverified}</span>{/if}
                  <span class="cap"><CheckedSources checked={w.checked} sources={w.sources} /></span>
                </span>
              </li>
            {/each}
          </ul>
        </section>
      {/if}

      <h4>
        Robes: {#if robe.robeLine === "deathdealer"}{@render wikiLink(
            LINE_PAGE.deathdealer,
            "Deathdealer",
          )}{:else}{@render wikiLink(LINE_PAGE.deathwarden, "Deathwarden")}{/if}
      </h4>
      {#if !free}
        <p class="cap">
          {@render wikiLink(LINE_PAGE.deathdealer, "Deathdealer")} robes branch from tier 60
          {@render wikiLink(LINE_PAGE.deathwarden, "Deathwarden")} at tier 70. Pick your line and the ladder follows it.
        </p>
      {/if}
      {@render ladder("robe", robe)}
      {#if !free}
        <ChoiceStrip
          label="Your robe line"
          name="necro-robe-line"
          value={robe.robeLine}
          choices={[
            { value: "deathwarden", label: "Deathwarden", image: robe.steps[0]?.image },
            {
              value: "deathdealer",
              label: "Deathdealer",
              image: NECRO_UPGRADES.find((s) => s.line === "deathdealer")?.image,
              description: "Deathdealer: branches from tier 60 Deathwarden robes",
            },
          ]}
          onChange={pickRobeLine}
        />
      {/if}
      <ChoiceStrip
        label="Your robe tier"
        name="necro-robe-tier"
        value={tierValue(robe)}
        choices={tierChoices(robe)}
        onChange={(v) => pickTier("robe", v)}
      />
      {@render nextStep("robe", robe)}
      {#if bosses.length}
        <section class="next-step endgame" id="necro-tier-95" aria-label="Tier 95">
          <span class="label">Tier 95: the end of the path</span>
          {#each bosses as end (end.boss)}
            <article class="boss">
              <header>
                {#if end.target.image}<GameArt file={end.target.image} size={56} />{/if}
                <span class="target-copy">
                  <b>{@render wikiLink(end.target.wiki, end.boss)}</b>
                  <span class="cap"
                    >Drops tier 95 {end.target.lines.includes("robe") ? "weapons and robes" : "weapons"}</span
                  >
                </span>
              </header>
              <ul class="targets">
                {#each end.target.drops as d (d.item)}
                  <li>
                    {#if d.image}<GameArt file={d.image} size={32} />{/if}
                    <span class="target-copy"
                      ><b>{@render wikiLink(d.item, d.item)}</b><span class="cap">{d.rate}</span></span
                    >
                  </li>
                {/each}
              </ul>
              {@render chipRow(end.reqs)}
              <p class="cap"><GameText text={end.target.note} /></p>
              <p class="cap"><CheckedSources checked={end.target.checked} sources={end.target.sources} /></p>
            </article>
          {/each}
        </section>
      {/if}
      <p class="cap">
        Tiers, wear levels and upgrade materials: <CheckedSources
          checked={NECRO_IMPORT.checked}
          sources={NECRO_IMPORT.sources}
        />
      </p>
    </div>
  </GameWindow>

  <GameWindow title="Kill next" icon={kill.xp?.option.image} trailing={kill.xp ? `Levels ${kill.xp.range}` : undefined}>
    <div class="body">
      {#if kill.xp}
        {@const xp = kill.xp}
        <section class="kill-row" aria-label="For XP">
          <span class="label">For XP</span>
          <div class="kill-head">
            <GameArt file={xp.option.image} size={48} />
            <span class="target-copy">
              <b>{@render wikiLink(xp.option.wiki, xp.option.title)}</b>
              <span class="cap"
                >{#each xp.option.locations as place, i (place)}{i ? ", " : ""}{@render wikiLink(
                    LOCATION_PAGE[place] ?? place,
                    place,
                  )}{/each}</span
              >
            </span>
          </div>
          <p><GameText text={xp.target.note} /></p>
          {#if regular && xp.target.mainNote}
            <p class="main-note"><b>On a regular account:</b> <GameText text={xp.target.mainNote} /></p>
          {/if}
          {#if xp.alt}
            <div class="kill-head">
              <GameArt file={xp.alt.image} size={36} />
              <span class="target-copy">
                <span class="label">AFK alternative</span>
                <b>{@render wikiLink(xp.alt.wiki, xp.alt.title)}</b>
              </span>
            </div>
          {/if}
          {#if xp.option.sites.length}
            <div class="map"><TrainingMap method={xp.option} {profile} /></div>
          {/if}
          <p class="cap"><CheckedSources checked={xp.target.checked} sources={xp.target.sources} /></p>
        </section>
      {/if}

      {#if kill.progress}
        {@const progress = kill.progress}
        <section class="kill-row" aria-label="For progress">
          <span class="label">For progress</span>
          <p class="progress-text">
            <b>{#if progress.target}{@render wikiLink(progress.target, progress.text)}{:else}{progress.text}{/if}</b>
          </p>
          {#if progressArt.length}{@render targets(progressArt)}{/if}
          {@render chipRow(progress.reqs)}
          {#if progressTask?.requires}
            <p class="cap"><b>Also needs:</b> <GameText text={progressTask.requires} /></p>
          {/if}
          {#if weapon.next && weaponBlockers.length}
            <p class="cap">
              <a href="#necro-next-weapon">The tier {weapon.next.step.tier} weapon step</a> also needs:
            </p>
            {@render chipRow(weaponBlockers)}
          {/if}
          {#if progressSource}
            <p class="cap"><CheckedSources checked={progressSource.checked} sources={progressSource.sources} /></p>
          {/if}
        </section>
      {/if}
    </div>
  </GameWindow>

  <GameWindow title="Rituals" icon={groups[0]?.[0]?.image} trailing={`${groups.length} ready`}>
    <div class="body">
      <p>
        Your {@render wikiLink("Ritual site", "ritual site")}: tier {rituals.siteTier} (opens at Necromancy {RITUAL_SITE
          .levels[rituals.siteTier]}).
        <span class="cap"><CheckedSources checked={RITUAL_SITE.checked} sources={RITUAL_SITE.sources} /></span>
      </p>
      {#if rituals.inks.length}
        <h4>Glyph inks you need</h4>
        <ul class="recipe">
          {#each rituals.inks as ink (ink)}
            <li>
              <a class="pill" href={wikiHref(ink)} target="_blank" rel="noopener noreferrer"
                ><GameArt file={inkFile(ink)} size={24} /><span>{ink}</span><span class="sr-only">
                  (opens a new tab)</span
                ></a
              >
            </li>
          {/each}
        </ul>
      {/if}

      <h4>Run now</h4>
      {#if groups.length}
        <div class="rituals">
          {#each groups as recipes (recipes[0].name)}{@render ritualCard(recipes)}{/each}
        </div>
      {:else}
        <p class="cap">
          No rituals yet{#if rituals.next}: the first opens at Necromancy {rituals.next.level}{/if}.
        </p>
      {/if}

      {#snippet lockedRitual(heading: string, ritual: Ritual)}
        {@const gate = RITUAL_QUESTS[ritual.name]}
        <h4>{heading}</h4>
        {@render ritualCard([ritual])}
        <p class="cap">
          Needs Necromancy {ritual.level}{#if gate}{" "}and {@render wikiLink(
              questsById.get(gate.quest)?.wiki ?? gate.quest,
              questsById.get(gate.quest)?.name ?? gate.quest,
            )}.
            <CheckedSources checked={gate.checked} sources={gate.sources} />{:else}.{/if}
        </p>
      {/snippet}
      {#if rituals.next}{@render lockedRitual("Next to unlock", rituals.next)}{/if}
      {#if upgradeLater}{@render lockedRitual("Later, for your next upgrade", upgradeLater)}{/if}

      <p class="cap disturbances">
        <GameText text={DISTURBANCES.note} />
        <CheckedSources checked={DISTURBANCES.checked} sources={DISTURBANCES.sources} />
      </p>
      <p class="cap">
        Rituals, recipes, XP and glyph inks: <CheckedSources
          checked={NECRO_IMPORT.checked}
          sources={NECRO_IMPORT.sources}
        />
      </p>
    </div>
  </GameWindow>
</div>

<style>
  .necro-guide {
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
  .label,
  h4 {
    font-size: var(--font-caption);
    font-weight: 700;
    letter-spacing: 1.55px;
    text-transform: uppercase;
    color: var(--muted);
  }
  h4 {
    margin: 6px 0 0;
  }
  h4 :global(a) {
    letter-spacing: normal;
    text-transform: none;
  }
  .body a {
    color: var(--gold-bright);
    text-decoration: underline;
    text-underline-offset: 3px;
  }
  .prompt {
    margin: 0;
    padding: 8px 10px;
    border: 1px solid var(--warn);
    border-radius: 3px;
    background: var(--well);
  }
  .warn {
    color: var(--warn);
  }
  .main-note {
    padding: 8px 10px;
    border-left: 3px solid var(--gold);
  }
  .chips,
  .icons,
  .targets,
  .story,
  .ladder,
  .recipes,
  .recipe {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .chips :global(.status-chip) {
    white-space: normal;
  }

  /* Storyline */
  .story {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .story-row {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 10px 12px;
    min-width: 0;
    border: 1px solid #33434d;
    border-radius: 3px;
    background: var(--well);
  }
  .story-row.state-next {
    border-color: var(--gold);
  }
  .story-row.state-done {
    opacity: 0.85;
  }
  .story-head,
  .kill-head,
  .souls,
  .drop,
  .next-step header,
  .ritual header {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 10px;
    min-width: 0;
  }
  .souls-form {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: 8px;
  }
  .souls-form label {
    display: grid;
    gap: 4px;
    min-width: 0;
  }
  .souls-form input {
    width: 100%;
    max-width: 200px;
    min-height: 44px;
  }

  /* Gear ladders */
  .ladder {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .ladder a {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    min-width: 48px;
    min-height: 44px;
    padding: 4px;
    border: 1px solid #33434d;
    border-radius: 3px;
    background: var(--well);
    color: var(--muted);
    text-decoration: none;
    font-size: var(--font-caption);
  }
  .ladder .reached a {
    color: var(--text);
  }
  .ladder .destination a {
    border-style: dashed;
    border-color: var(--gold);
    color: var(--gold);
  }
  .ladder .current a {
    border-color: var(--gold-bright);
    color: var(--gold-bright);
    box-shadow: 0 0 0 1px #c5a46b80;
    font-weight: 700;
  }
  .next-step,
  .side-note,
  .kill-row,
  .ritual {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 12px;
    min-width: 0;
    border: 1px solid #33434d;
    border-radius: 3px;
    background: var(--well);
  }
  .boss {
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 0;
  }
  .boss + .boss {
    padding-top: 10px;
    border-top: 1px solid #33434d;
  }
  .boss header {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 10px;
    min-width: 0;
  }
  .next-step:target {
    border-color: var(--gold-bright);
  }
  .icons {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .icons a {
    position: relative;
    display: inline-flex;
    padding: 4px;
    border: 1px solid #33434d;
    border-radius: 3px;
    background: #0b1318;
  }
  .icons small {
    position: absolute;
    right: 2px;
    bottom: 0;
    font-size: 11px;
    font-weight: 700;
    color: var(--gold-bright);
    text-shadow: 0 0 2px #000;
  }
  .targets {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .targets li {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    min-width: 0;
  }
  .target-copy {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
    flex: 1 1 0;
    overflow-wrap: anywhere;
  }
  .map {
    min-width: 0;
  }

  /* Rituals */
  .rituals {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .ritual.upgrade {
    border-color: var(--gold-bright);
  }
  .recipes {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .recipe {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    min-width: 0;
  }
  .pill {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    max-width: 100%;
    padding: 2px 8px 2px 4px;
    border: 1px solid #33434d;
    border-radius: 3px;
    background: #0b1318;
    font-size: var(--font-caption);
    overflow-wrap: anywhere;
  }
  .arrow {
    color: var(--gold);
  }
  .more > summary {
    min-height: 44px;
    display: flex;
    align-items: center;
    cursor: pointer;
    font-size: var(--font-caption);
  }
</style>
