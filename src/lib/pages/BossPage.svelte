<script lang="ts">
  import { untrack } from "svelte";
  import { page } from "$app/state";
  import { CircleAlert, CircleCheck, ExternalLink, Info } from "@lucide/svelte";
  import { BOSS_GUIDES } from "../../bossGuides";
  import { BOSSES, bossById, bossUniques } from "../../bosses";
  import { QUESTS } from "../../data";
  import { wikiHref } from "../../wiki";
  import { TIER_STATS, bossStatus, defaultDropVersion, meetsTier, visibleBosses } from "../bossLadder";
  import { lootRows, lootSummary, type Prices } from "../bossLoot";
  import { guidePet } from "../bossPage";
  import { bossLogProgress, toggleCollected } from "../collectionLog";
  import { activeProfile, getCompass } from "../compassContext";
  import { bossPath, questPath } from "../navigation";
  import { fetchPrices } from "../priceClient";
  import BossBar from "../components/BossBar.svelte";
  import BossGuide from "../components/BossGuide.svelte";
  import BossLoot from "../components/BossLoot.svelte";
  import FallbackArt from "../components/FallbackArt.svelte";
  import StatusChip from "../components/StatusChip.svelte";

  let { selectedId }: { selectedId: string } = $props();
  const compass = getCompass();
  const saved = compass.state;
  const TONES = {
    ready: "ok",
    quest: "warn",
    skill: "warn",
    levels: "info",
    members: "neutral",
    unknown: "neutral",
  } as const;
  const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });

  let profile = $derived(activeProfile($saved));
  // The route 404s an unknown id, so this always finds the boss.
  let boss = $derived(bossById(selectedId)!);
  let guide = $derived(BOSS_GUIDES[boss.id]);
  let tab = $derived.by(() => {
    const t = page.url.searchParams.get("tab");
    return t === "guide" || t === "achievements" ? t : "loot";
  });
  let visible = $derived(visibleBosses(profile, BOSSES));
  let at = $derived(visible.findIndex((b) => b.id === boss.id));
  let nextOnLadder = $derived(at >= 0 ? visible[at + 1] : undefined);
  let status = $derived(bossStatus(profile, boss));
  let log = $derived(bossLogProgress(profile, boss, bossUniques));
  let recorded = $derived(Object.keys(profile.levels).length > 0);
  let levelsOk = $derived(recorded && meetsTier(profile.levels, boss.tier));
  let strategyHref = $derived(wikiHref(boss.strategyPage ?? boss.wiki));
  let pet = $derived(guide ? guidePet(guide.why) : undefined);
  const questName = (id: string) => QUESTS.find((q) => q.id === id)?.name ?? id;

  // The drop-table version: the player's pick for this boss, else the default for their mode.
  let picked = $state<{ id: string; version: string }>();
  let version = $derived(
    picked?.id === boss.id && boss.drops[picked.version]
      ? picked.version
      : defaultDropVersion(boss, profile.mode),
  );
  let drops = $derived(version ? (boss.drops[version] ?? []) : []);
  let priceKey = $derived(`${boss.id}|${version}`);

  // One request per boss and visible version; a late answer for another boss or version is dropped.
  let priced = $state<{ key: string; prices: Prices | undefined; failed: boolean }>();
  $effect(() => {
    const key = priceKey;
    const names = [
      ...new Set([...drops.map((d) => d.item), ...bossUniques(boss)].filter((item) => item !== "Coins")),
    ];
    if (untrack(() => priced?.key) === key) return;
    priced = undefined;
    const finish = (prices: Prices | undefined, failed: boolean) => {
      if (untrack(() => priceKey) !== key) return;
      priced = { key, prices, failed };
    };
    if (!names.length) finish(undefined, false);
    else void fetchPrices(names).then((prices) => finish(prices, prices === undefined));
  });
  let current = $derived(priced?.key === priceKey ? priced : undefined);
  let priceState = $derived<"loading" | "failed" | "ready">(
    !current ? "loading" : current.failed ? "failed" : "ready",
  );
  let rows = $derived(lootRows(drops, current?.prices));
  let summary = $derived(lootSummary(rows));

  function toggle(key: string) {
    compass.updateProfile((p) => toggleCollected(p, key));
  }
</script>

{#snippet check(state: "met" | "warn" | "info")}
  {#if state === "met"}<CircleCheck class="check-met" size={18} aria-hidden="true" />{:else if state === "warn"}<CircleAlert
      class="check-warn"
      size={18}
      aria-hidden="true"
    />{:else}<Info class="check-info" size={18} aria-hidden="true" />{/if}
{/snippet}

<div class="boss-page page-enter">
  <!-- Desktop shows this bar in the app top bar; phones keep it in the page. -->
  <div class="boss-bar-phone"><BossBar {profile} {selectedId} /></div>

  <section class="boss-hero" aria-labelledby="boss-title">
    <a
      class="boss-hero-art"
      href={wikiHref(boss.wiki)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={boss.name + " on RuneScape Wiki"}><FallbackArt file={boss.image} size={220} className="hero-art" /></a
    >
    <div class="boss-hero-copy">
      <a class="crumb" href="/bossing"
        >‹ Boss ladder{at >= 0 ? ` · step ${at + 1} of ${visible.length}` : ""}</a
      >
      <h1 id="boss-title">{boss.name}</h1>
      <div class="tags">
        <span class="tag tier">{boss.tier} tier</span>
        {#if !boss.members}<span class="tag tier">F2P</span>{/if}
        <span class="tag">Level {boss.level}</span>
        {#if boss.lifepoints}<span class="tag">{boss.lifepoints.toLocaleString("en")} life points</span>{/if}
        {#if boss.weakness}<span class="tag">Weakness: {boss.weakness.toLowerCase()}</span>{/if}
        <span class="tag">{boss.team}</span>
      </div>
      <h2 class="why-title">Why fight it</h2>
      <ul class="why">
        {#if guide}<li>{guide.why}</li>{/if}
        {#if priceState === "ready" && rows.length}<li>
            <strong>~{compact.format(summary.average).toLowerCase()} average loot per kill</strong> at today's
            GE prices
          </li>{/if}
        {#if pet}<li>
            Pet: <a href={wikiHref(pet)} target="_blank" rel="noopener noreferrer">{pet}</a>
          </li>{/if}
        {#if boss.achievements.length}<li>
            {boss.achievements.length}
            {boss.achievements.length === 1 ? "achievement" : "achievements"}
          </li>{/if}
      </ul>
    </div>
    <aside class="ready-card" aria-labelledby="ready-title">
      <span class="eyebrow" id="ready-title">Ready to fight?</span>
      <div class="ready-status">
        {#if status.kind === "quest" && status.quest}<a href={questPath(status.quest)}
            ><StatusChip tone={TONES[status.kind]} label={status.text} /></a
          >{:else}<StatusChip tone={TONES[status.kind]} label={status.text} />{/if}
      </div>
      <ul class="checks">
        <li>
          {@render check(!recorded ? "info" : levelsOk ? "met" : "warn")}<span>Recommended stats</span><strong
            >{recorded ? `${TIER_STATS[boss.tier]}+ combat stats` : "Levels not recorded"}</strong
          >
        </li>
        <li class="reqs">
          {@render check(
            boss.requirements.some(
              (r) =>
                (r.kind === "quest" && !profile.completedQuests.includes(r.quest)) ||
                (r.kind === "skill" && recorded && (profile.levels[r.skill] ?? 1) < r.level),
            )
              ? "warn"
              : boss.requirements.some((r) => r.kind === "text")
                ? "info"
                : "met",
          )}<span>Requirements</span>
          {#if !boss.requirements.length}<strong>None</strong>{:else}<ul class="req-list">
              {#each boss.requirements as req, i (i)}<li>
                  {#if req.kind === "quest"}<a href={questPath(req.quest)}>{questName(req.quest)}</a
                    >{profile.completedQuests.includes(req.quest) ? " ✓" : ""}{:else if req.kind === "skill"}{req.level}
                    {req.skill}{:else}{req.text}{/if}
                </li>{/each}
            </ul>{/if}
        </li>
        <li>
          {@render check(guide ? "warn" : "info")}<span>Bring</span><strong
            >{guide ? guide.bring.join(", ") : "Guide coming"}</strong
          >
        </li>
        {#if guide}<li class="get-there">
            {@render check("info")}<span>Get there</span><small>{guide.getThere}</small>
          </li>{/if}
      </ul>
      <a class="btn btn-primary strategy" href={strategyHref} target="_blank" rel="noopener noreferrer"
        >Wiki strategy ↗</a
      >
    </aside>
  </section>

  <nav class="boss-tabs" aria-label="Boss sections">
    <a href={bossPath(boss.id)} data-sveltekit-noscroll aria-current={tab === "loot" ? "page" : undefined}
      >Loot &amp; collection log<span>{log.got} / {log.total}</span></a
    ><a
      href="{bossPath(boss.id)}?tab=guide"
      data-sveltekit-noscroll
      aria-current={tab === "guide" ? "page" : undefined}>Guide</a
    ><a
      href="{bossPath(boss.id)}?tab=achievements"
      data-sveltekit-noscroll
      aria-current={tab === "achievements" ? "page" : undefined}
      >Achievements<span>{boss.achievements.length}</span></a
    ><a class="tab-wiki" href={wikiHref(boss.wiki)} target="_blank" rel="noopener noreferrer"
      >Wiki page <ExternalLink size={13} aria-hidden="true" /></a
    >
  </nav>

  {#if tab === "loot"}<BossLoot
      {boss}
      {profile}
      {version}
      onVersion={(v) => (picked = { id: boss.id, version: v })}
      {rows}
      {summary}
      prices={current?.prices}
      {priceState}
      onToggle={toggle}
    />{:else if tab === "guide"}<BossGuide {boss} {profile} {guide} {strategyHref} next={nextOnLadder} />{:else}<section
      class="tool-window"
      aria-labelledby="achievements-title"
    >
      <header class="window-title">
        <h2 id="achievements-title">Achievements</h2>
        <span>{boss.achievements.length}</span>
      </header>
      {#if boss.achievements.length}<ul class="achievements">
          {#each boss.achievements as name (name)}<li>
              <a href={wikiHref(name)} target="_blank" rel="noopener noreferrer">{name}</a>
            </li>{/each}
        </ul>{:else}<p class="note">The Wiki lists no achievements for this boss.</p>{/if}
      <p class="note">Jagex doesn't expose achievement progress, so these link to the Wiki.</p>
    </section>{/if}
</div>

<style>
  /* Layout switches on the page's own width (sidebar or not), not the window's. */
  .boss-page {
    container: boss / inline-size;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
  .boss-bar-phone {
    display: none;
  }
  .boss-hero {
    display: grid;
    grid-template-columns: 240px minmax(0, 1fr) minmax(280px, 340px);
    align-items: start;
    gap: 16px 24px;
    position: relative;
    isolation: isolate;
    margin: -28px -32px 0;
    padding: 28px 32px;
  }
  .boss-hero::before {
    content: "";
    position: absolute;
    inset: 0 -100vmax;
    z-index: -1;
    background: linear-gradient(var(--panel), var(--bg));
    border-bottom: 1px solid var(--line);
  }
  .boss-hero-art {
    display: grid;
    place-items: center;
    height: 220px;
    background: #0d161c;
    border-radius: 2px;
  }
  .boss-hero-art :global(.hero-art) {
    width: 100%;
    height: 100%;
    max-width: 220px;
    max-height: 220px;
  }
  .boss-hero-copy {
    display: flex;
    flex-direction: column;
    gap: 10px;
    min-width: 0;
  }
  .crumb {
    align-self: flex-start;
    color: var(--gold-bright);
    font-size: var(--font-caption);
    font-weight: 600;
    text-decoration: none;
  }
  .crumb:hover {
    text-decoration: underline;
  }
  h1 {
    margin: 0;
    font: 600 32px/36px "Cinzel", Georgia, serif;
    color: var(--heading);
  }
  .tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .tag {
    display: inline-block;
    padding: 0 7px;
    border: 1px solid var(--frame-line);
    border-radius: 3px;
    color: var(--muted);
    font-size: 11px;
    line-height: 18px;
    font-weight: 600;
    letter-spacing: 0.3px;
  }
  .tag.tier {
    color: var(--blue);
  }
  .why-title {
    margin: 4px 0 0;
    font: 600 15px/20px "Cinzel", Georgia, serif;
    color: var(--heading);
  }
  .why {
    display: flex;
    flex-direction: column;
    gap: 6px;
    max-width: 640px;
    margin: 0;
    padding-left: 18px;
    line-height: 21px;
  }
  .why strong {
    color: var(--gold-bright);
  }
  .why a {
    color: var(--gold-bright);
  }
  .ready-card {
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 0;
    padding: 14px;
    background: var(--panel);
    border: 1px solid var(--line);
    border-radius: 2px;
  }
  .eyebrow {
    font-size: 12px;
    line-height: 17px;
    font-weight: 700;
    letter-spacing: 1.55px;
    text-transform: uppercase;
    color: var(--muted);
  }
  .ready-status a {
    text-decoration: none;
  }
  .ready-status a:hover :global(.status-chip) {
    text-decoration: underline;
  }
  .checks {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .checks > li {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px 12px;
    min-height: 40px;
    padding: 4px 0;
    border-bottom: 1px solid var(--line);
  }
  .checks > li > span {
    flex: 1;
  }
  .checks strong {
    font-weight: 600;
    text-align: right;
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
  .req-list,
  .checks small {
    flex: 1 1 100%;
    margin: 0;
    padding: 0 0 4px 30px;
    list-style: none;
    font-size: var(--font-caption);
    color: var(--muted);
  }
  .req-list a {
    color: var(--gold-bright);
  }
  .strategy {
    align-self: flex-start;
    margin-top: 4px;
  }
  .boss-tabs {
    display: flex;
    flex-wrap: wrap;
    align-items: stretch;
    gap: 4px;
    border-bottom: 1px solid var(--line);
  }
  .boss-tabs > a {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-height: 44px;
    padding: 0 18px;
    border-bottom: 2px solid transparent;
    color: var(--muted);
    font: 600 var(--font-ui) / 1 "DM Sans", sans-serif;
    text-decoration: none;
  }
  .boss-tabs > a span {
    font-weight: 400;
    color: var(--muted);
  }
  .boss-tabs > a[aria-current="page"] {
    color: var(--gold-bright);
    border-bottom-color: var(--gold);
  }
  .boss-tabs > a:hover {
    color: var(--gold-bright);
  }
  .boss-tabs .tab-wiki {
    margin-left: auto;
  }
  .achievements {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(240px, 100%), 1fr));
    gap: 6px 20px;
    margin: 0;
    padding: 14px 16px;
    list-style: none;
  }
  .achievements a {
    color: var(--text);
  }
  .achievements a:hover {
    color: var(--gold-bright);
  }
  .note {
    margin: 0;
    padding: 0 16px 14px;
    font-size: var(--font-caption);
    color: var(--muted);
  }
  .window-title + .note {
    padding-top: 14px;
  }
  @container boss (max-width: 1080px) {
    .boss-hero {
      grid-template-columns: 200px minmax(0, 1fr);
    }
    .ready-card {
      grid-column: 1 / -1;
    }
  }
  @container boss (max-width: 600px) {
    .boss-hero {
      grid-template-columns: minmax(0, 1fr);
    }
  }
  @media (max-width: 760px) {
    .boss-bar-phone {
      display: flex;
    }
    .boss-hero {
      grid-template-columns: minmax(0, 1fr);
      margin: 0;
      padding: 0 0 16px;
      gap: 14px;
    }
    .boss-hero::before {
      display: none;
    }
    .boss-hero-art {
      height: 150px;
    }
    h1 {
      font-size: 28px;
      line-height: 32px;
    }
    .boss-tabs > a {
      padding: 0 12px;
    }
  }
</style>
