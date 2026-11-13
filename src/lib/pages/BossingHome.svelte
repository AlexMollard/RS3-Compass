<script lang="ts">
  import { untrack } from "svelte";
  import { CircleAlert, CircleCheck, Info } from "@lucide/svelte";
  import { BOSS_GUIDES } from "../../bossGuides";
  import { BOSSES, bossById, bossUniques } from "../../bosses";
  import type { BossRecord, BossTier } from "../../bossTypes";
  import { lootRows, lootSummary, type Prices } from "../bossLoot";
  import {
    TIER_STATS,
    bossStatus,
    defaultDropVersion,
    meetsTier,
    nextBoss,
    stageOf,
    visibleBosses,
  } from "../bossLadder";
  import {
    bossLogProgress,
    isAutoCollected,
    isCollected,
    logKey,
    toggleCollected,
  } from "../collectionLog";
  import { activeProfile, getCompass } from "../compassContext";
  import { bossPath, questPath } from "../navigation";
  import { fetchPrices } from "../priceClient";
  import BossRow from "../components/BossRow.svelte";
  import ChoiceStrip from "../components/ChoiceStrip.svelte";
  import FallbackArt from "../components/FallbackArt.svelte";
  import GameWindow from "../components/GameWindow.svelte";
  import PageHeading from "../components/PageHeading.svelte";

  const compass = getCompass();
  const saved = compass.state;
  const TIERS: BossTier[] = ["Free", "Low", "Mid", "High"];

  let profile = $derived(activeProfile($saved));
  let f2p = $derived(profile.mode === "f2p");
  let iron = $derived(profile.kind === "Solo Ironman" || profile.kind === "Group Ironman");
  let visible = $derived(visibleBosses(profile, BOSSES));
  let rank = $derived(new Map(visible.map((b, i) => [b.id, i + 1])));
  let status = $derived(new Map(visible.map((b) => [b.id, bossStatus(profile, b)])));
  let progress = $derived(new Map(visible.map((b) => [b.id, bossLogProgress(profile, b, bossUniques)])));

  let view = $state("ladder");
  let readyOnly = $state(false);
  let soloOnly = $state(false);
  let f2pOnly = $state(false);
  let missingOnly = $state(false);
  // Tiles ticked while "Missing only" is on stay put (and keep focus) until the toggle or view changes.
  let kept = $state<string[]>([]);

  let rows = $derived(
    visible.filter(
      (b) =>
        (!readyOnly || status.get(b.id)?.kind === "ready") &&
        (!soloOnly || b.team.startsWith("Solo")) &&
        (f2p || !f2pOnly || !b.members),
    ),
  );
  let stages = $derived(
    TIERS.map((tier) => ({ tier, bosses: rows.filter((b) => b.tier === tier) })).filter(
      (s) => s.bosses.length,
    ),
  );

  // Pets are only known where a guide's "why" says so; unguided bosses get no pet claim.
  const hasPet = (boss: BossRecord) => /\bpets?\b/i.test(BOSS_GUIDES[boss.id]?.why ?? "");
  const shorten = (name: string) => (name.length > 24 ? name.slice(0, 23).trimEnd() + "…" : name);
  function whyTags(boss: BossRecord): string[] {
    const tags: string[] = [];
    if (hasPet(boss)) tags.push("Pet");
    const signature = bossUniques(boss)[0];
    if (signature) tags.push(shorten(signature));
    return tags;
  }

  let next = $derived(nextBoss(profile, BOSSES, new Set(profile.collected ?? []), bossUniques));
  let nextStatus = $derived(next ? bossStatus(profile, next) : undefined);
  let nextGuide = $derived(next ? BOSS_GUIDES[next.id] : undefined);
  let nextLog = $derived(next ? bossLogProgress(profile, next, bossUniques) : undefined);
  let nextVersion = $derived(next ? defaultDropVersion(next, profile.mode) : undefined);
  let recorded = $derived(Object.keys(profile.levels).length > 0);
  let nextLevelsOk = $derived(!!next && recorded && meetsTier(profile.levels, next.tier));
  let nextRequirement = $derived.by(() => {
    if (!next || !nextStatus) return undefined;
    if (nextStatus.kind === "quest" || nextStatus.kind === "skill" || nextStatus.kind === "members")
      return { ok: false, text: nextStatus.text, quest: nextStatus.quest };
    const text = next.requirements.find((r) => r.kind === "text");
    if (text?.kind === "text") return { ok: false, text: text.text };
    return { ok: true, text: next.requirements.length ? "Met" : "None" };
  });

  // Average loot for the next boss only: undefined while loading, null when prices failed.
  let average = $state<
    { key: string; value: number | null; unrated: number } | undefined
  >();
  $effect(() => {
    if (!next || !nextVersion) return;
    const key = `${next.id}|${nextVersion}`;
    const drops = next.drops[nextVersion] ?? [];
    const names = [...new Set(drops.map((d) => d.item).filter((item) => item !== "Coins"))];
    if (untrack(() => average?.key) === key) return;
    average = undefined;
    const finish = (prices: Prices | undefined, failed: boolean) => {
      if (untrack(() => `${next?.id}|${nextVersion}`) !== key) return;
      const summary = lootSummary(lootRows(drops, prices));
      average = { key, value: failed ? null : summary.average, unrated: summary.unrated };
    };
    // Coins need no price; a coins-only table still has an average.
    if (!names.length) finish(undefined, false);
    else void fetchPrices(names).then((prices) => finish(prices, prices === undefined));
  });
  let averageText = $derived.by(() => {
    if (!next || !nextVersion) return "No drop table";
    if (!average || average.key !== `${next.id}|${nextVersion}`) return "—";
    if (average.value === null) return "Prices unavailable";
    return `${average.unrated > 0 ? "at least " : ""}~${new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 })
      .format(average.value)
      .toLowerCase()} / kill`;
  });

  let logBosses = $derived(
    visible
      .map((boss) => ({
        boss,
        items: bossUniques(boss).map((item) => ({ item, key: logKey(boss.id, item) })),
      }))
      .filter((entry) => entry.items.length),
  );
  let logTotal = $derived(logBosses.reduce((n, e) => n + e.items.length, 0));
  let logGot = $derived(
    logBosses.reduce((n, e) => n + e.items.filter((i) => isCollected(profile, i.key)).length, 0),
  );
  let shownLog = $derived(
    missingOnly
      ? logBosses
          .map((e) => ({
            ...e,
            items: e.items.filter((i) => !isCollected(profile, i.key) || kept.includes(i.key)),
          }))
          .filter((e) => e.items.length)
      : logBosses,
  );
  let recent = $derived(
    (profile.collected ?? [])
      .slice(-3)
      .reverse()
      .flatMap((key) => {
        const [, id, ...rest] = key.split(":");
        const boss = bossById(id);
        return boss && rest.length ? [{ key, boss, item: rest.join(":") }] : [];
      }),
  );
  let ironList = $derived(visible.filter((b) => BOSS_GUIDES[b.id]?.ironman).slice(0, 4));

  function toggle(key: string) {
    if (missingOnly && !kept.includes(key)) kept = [...kept, key];
    compass.updateProfile((p) => toggleCollected(p, key));
  }
</script>

{#snippet bossList(list: BossRecord[])}
  <ol class="boss-list">
    {#each list as boss (boss.id)}
      <BossRow
        {boss}
        rank={rank.get(boss.id) ?? 0}
        status={status.get(boss.id)!}
        got={progress.get(boss.id)?.got ?? 0}
        total={progress.get(boss.id)?.total ?? 0}
        tags={whyTags(boss)}
      />
    {/each}
  </ol>
{/snippet}

<div class="bossing-home page-enter">
  <header class="bossing-head">
    <PageHeading
      title="Bossing"
      subtitle={f2p
        ? `The ${visible.length} bosses you can fight on a free account, easiest first. Drop tables show the F2P version.`
        : "A ladder from your first boss to endgame, checked against your levels and quests. Tick drops in each boss's collection log."}
    />
    <ChoiceStrip
      variant="joined"
      label="View"
      name="bossing-view"
      value={view}
      choices={[
        { value: "ladder", label: "Ladder" },
        { value: "all", label: "All bosses" },
        { value: "log", label: "Collection log" },
      ]}
      onChange={(v) => {
        view = v;
        kept = [];
      }}
    />
  </header>

  {#if view !== "log"}<div class="filters" role="group" aria-label="Filters">
      <button type="button" class="chip" aria-pressed={readyOnly} onclick={() => (readyOnly = !readyOnly)}
        >Ready now</button
      >
      <button type="button" class="chip" aria-pressed={soloOnly} onclick={() => (soloOnly = !soloOnly)}
        >Solo</button
      >
      {#if !f2p}<button type="button" class="chip" aria-pressed={f2pOnly} onclick={() => (f2pOnly = !f2pOnly)}
          >F2P only</button
        >{/if}
      <span class="order">Order: tier, then level</span>
    </div>{/if}

  {#if next && nextStatus && view !== "log"}<section class="next-card tool-window" aria-labelledby="next-boss">
      <a class="next-art" href={bossPath(next.id)} tabindex="-1" aria-hidden="true"><FallbackArt file={next.image} size={140} className="boss-art" /></a>
      <div class="next-main">
        <span class="eyebrow">Your next boss</span>
        <h2 id="next-boss"><a href={bossPath(next.id)}>{next.name}</a></h2>
        <div class="next-tags">
          <span class="tag tier">{next.tier} tier</span>
          {#if !next.members}<span class="tag tier">F2P</span>{/if}
          <span class="tag">Level {next.level}</span>
          <span class="tag">{next.team}</span>
        </div>
        {#if nextGuide}<p>{nextGuide.why}</p>{/if}
        <div class="next-actions">
          {#if nextGuide}<a class="btn btn-primary" href="{bossPath(next.id)}?tab=guide">Open guide</a>{/if}
          <a class="btn btn-secondary" href={bossPath(next.id)}>Loot &amp; collection log</a>
        </div>
      </div>
      <dl class="next-checks">
        <div class:ok={nextLevelsOk}>
          <dt>
            {#if nextLevelsOk}<CircleCheck size={18} aria-hidden="true" />{:else}<CircleAlert
                size={18}
                aria-hidden="true"
              />{/if}Combat levels
          </dt>
          <dd>
            {recorded ? (nextLevelsOk ? "Ready" : `Around ${TIER_STATS[next.tier]}`) : "Levels not recorded"}
          </dd>
        </div>
        {#if nextRequirement}<div class:ok={nextRequirement.ok}>
            <dt>
              {#if nextRequirement.ok}<CircleCheck size={18} aria-hidden="true" />{:else}<CircleAlert
                  size={18}
                  aria-hidden="true"
                />{/if}Requirements
            </dt>
            <dd>
              {#if nextRequirement.quest}<a href={questPath(nextRequirement.quest)}>{nextRequirement.text}</a
                >{:else}{nextRequirement.text}{/if}
            </dd>
          </div>{/if}
        <div class="warn">
          <dt><Info size={18} aria-hidden="true" />Bring</dt>
          <dd>{nextGuide ? nextGuide.bring.join(", ") : "Guide coming"}</dd>
        </div>
        <div class="info">
          <dt><Info size={18} aria-hidden="true" />Average loot</dt>
          <dd class="gold">{averageText}</dd>
        </div>
        {#if nextLog}<div class="info">
            <dt><Info size={18} aria-hidden="true" />Collection log</dt>
            <dd>{nextLog.got} of {nextLog.total}</dd>
          </div>{/if}
      </dl>
    </section>{/if}

  <div class="bossing-body">
    {#if view === "log"}<GameWindow title="Collection log" trailing="{logGot} of {logTotal} uniques">
        <div class="log-tools">
          <label class="missing-toggle"
            ><input type="checkbox" bind:checked={missingOnly} onchange={() => (kept = [])} />Missing only</label
          >
        </div>
        {#if shownLog.length}<div class="log-groups">
            {#each shownLog as entry (entry.boss.id)}<section class="log-group" aria-label={entry.boss.name}>
                <h3>
                  <a href={bossPath(entry.boss.id)}>{entry.boss.name}</a>
                  <small
                    >{progress.get(entry.boss.id)?.got ?? 0} / {progress.get(entry.boss.id)?.total ?? 0}</small
                  >
                </h3>
                <ul class="log-grid">
                  {#each entry.items as tile (tile.key)}<li>
                      <label class="log-tile" class:got={isCollected(profile, tile.key)}
                        ><input
                          type="checkbox"
                          checked={isCollected(profile, tile.key)}
                          onchange={() => toggle(tile.key)}
                        /><span
                          >{tile.item}{#if isAutoCollected(profile, tile.key)}<small>auto from activity</small
                            >{/if}</span
                        ></label
                      >
                    </li>{/each}
                </ul>
              </section>{/each}
          </div>{:else if missingOnly}<p class="empty">Every unique is ticked.</p>{/if}
      </GameWindow>{:else}<GameWindow title={view === "all" ? "All bosses" : "Boss ladder"} trailing="{rows.length} bosses">
        {#if !rows.length}<p class="empty">No bosses match these filters.</p>{:else if view === "all"}{@render bossList(
            rows,
          )}{:else if f2p}<div class="stage-head">
            <h3>Free-to-play bosses</h3>
            <span>{visible.length} bosses · from the Wiki's members flag</span>
          </div>
          {@render bossList(rows)}{:else}{#each stages as stage (stage.tier)}<div class="stage-head">
              <h3>{stageOf(stage.tier)}</h3>
              <span>{stage.tier} tier: around {TIER_STATS[stage.tier]} combat stats.</span>
            </div>
            {@render bossList(stage.bosses)}{/each}{/if}
      </GameWindow>{/if}

    <aside class="bossing-side">
      <GameWindow title="Collection log" trailing="{logGot} of {logTotal} uniques">
        <div class="log-summary">
          <span class="bar"><span style:width="{logTotal ? (logGot / logTotal) * 100 : 0}%"></span></span>
          {#if recent.length}<span class="rail-eyebrow">Recent</span>
            <ul class="recent">
              {#each recent as r (r.key)}<li>
                  <strong>{r.item}</strong>
                  <small
                    ><a href={bossPath(r.boss.id)}>{r.boss.name}</a> · {isAutoCollected(profile, r.key)
                      ? "auto from activity"
                      : "Ticked by you"}</small
                  >
                </li>{/each}
            </ul>{:else}<p class="empty">
              Nothing ticked yet. Tick drops in a boss's collection log, or let your activity log tick them.
            </p>{/if}
        </div>
      </GameWindow>

      {#if iron && ironList.length}<GameWindow title="Ironman">
          <p class="rail-copy">Bosses that feed your account first:</p>
          <ul class="iron-list">
            {#each ironList as boss (boss.id)}<li>
                <a href="{bossPath(boss.id)}?tab=guide">{boss.name}</a>
                <small>{BOSS_GUIDES[boss.id].ironman!.gives.slice(0, 2).join(", ")}</small>
              </li>{/each}
          </ul>
        </GameWindow>{/if}

      <GameWindow title="How the ladder works">
        <p class="rail-copy">
          Bosses are ordered by the Wiki's PvM tier, then boss level. Each is checked against your levels and
          the quests you've completed. Drops are ticked by hand, or automatically when your activity log shows
          one.
        </p>
      </GameWindow>
    </aside>
  </div>
</div>

<style>
  .bossing-home {
    display: flex;
    flex-direction: column;
    gap: 18px;
    container-type: inline-size;
  }
  .bossing-head {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    justify-content: space-between;
    gap: 12px 24px;
  }
  .bossing-head :global(.utility-heading) {
    flex: 1 1 360px;
    margin: 0;
  }
  .bossing-head :global(.choice-fieldset) {
    margin: 0;
  }
  .filters {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }
  .chip {
    min-height: 34px;
    padding: 0 12px;
    background: var(--panel);
    border: 1px solid var(--edge);
    border-radius: 4px;
    color: var(--text);
    font: inherit;
    font-weight: 600;
    cursor: pointer;
  }
  .chip:hover {
    border-color: var(--gold);
    color: var(--gold-bright);
  }
  .chip[aria-pressed="true"] {
    border-color: var(--gold-bright);
    background: #22323d;
    color: var(--gold-bright);
  }
  .order {
    margin-left: auto;
    font-size: 12px;
    color: var(--muted);
  }
  .next-card {
    display: grid;
    grid-template-columns: 160px minmax(0, 1fr) 260px;
    gap: 20px;
    padding: 16px;
    background: linear-gradient(90deg, #1f3140, var(--panel));
  }
  .next-art {
    display: grid;
    place-items: center;
    height: 140px;
  }
  .next-card :global(.boss-art) {
    width: 140px;
    height: 140px;
  }
  .next-main {
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 0;
  }
  .eyebrow,
  .rail-eyebrow {
    font-size: 12px;
    line-height: 17px;
    font-weight: 700;
    letter-spacing: 1.55px;
    text-transform: uppercase;
    color: var(--muted);
  }
  .next-main .eyebrow {
    color: var(--green);
  }
  .next-main h2 {
    margin: 0;
    font: 600 24px/30px Cinzel, Georgia, serif;
  }
  .next-main h2 a {
    color: var(--heading);
    text-decoration: none;
  }
  .next-main h2 a:hover {
    color: var(--gold-bright);
  }
  .next-main p {
    margin: 0;
    max-width: 560px;
  }
  .next-tags {
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
  .next-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: auto;
  }
  .next-checks {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin: 0;
    padding-left: 16px;
    border-left: 1px solid var(--line);
  }
  .next-checks > div {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 30px;
  }
  .next-checks dt {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
    color: var(--text);
  }
  .next-checks dt :global(svg) {
    flex: 0 0 18px;
    color: var(--warn);
  }
  .next-checks .ok dt :global(svg) {
    color: var(--green);
  }
  .next-checks .info dt :global(svg) {
    color: var(--blue);
  }
  .next-checks dd {
    margin: 0;
    font-weight: 600;
    text-align: right;
    color: var(--text);
  }
  .next-checks .warn dd {
    color: var(--warn);
  }
  .next-checks dd.gold {
    color: var(--gold-bright);
  }
  .bossing-body {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 300px;
    align-items: start;
    gap: 20px;
  }
  .stage-head {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 4px 12px;
    padding: 14px 14px 8px;
    background: #1a2832;
    border-bottom: 1px solid var(--line);
  }
  .stage-head h3 {
    margin: 0;
    font: 600 15px/20px Cinzel, Georgia, serif;
    color: #ddd2b8;
  }
  .stage-head span {
    font-size: 12px;
    color: var(--muted);
  }
  .boss-list {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .bossing-side {
    display: flex;
    flex-direction: column;
    gap: 20px;
    min-width: 0;
  }
  .log-summary {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 12px 14px 14px;
  }
  .bar {
    display: block;
    height: 6px;
    background: var(--well);
    border: 1px solid var(--line);
    border-radius: 3px;
    overflow: hidden;
  }
  .bar span {
    display: block;
    height: 100%;
    background: var(--green);
  }
  .rail-eyebrow {
    margin-top: 4px;
  }
  .recent,
  .iron-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .iron-list {
    padding: 0 14px 14px;
  }
  .recent li,
  .iron-list li {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .recent small,
  .iron-list small {
    font-size: 12px;
    line-height: 16px;
    color: var(--muted);
  }
  .rail-copy {
    margin: 0;
    padding: 12px 14px;
    font-size: 13px;
    line-height: 19px;
    color: var(--muted);
  }
  .empty {
    margin: 0;
    padding: 10px 14px;
    font-size: 12px;
    color: var(--muted);
  }
  .log-tools {
    display: flex;
    justify-content: flex-end;
    padding: 10px 14px;
    border-bottom: 1px solid var(--line);
  }
  .missing-toggle {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-height: 34px;
    cursor: pointer;
  }
  .log-groups {
    display: flex;
    flex-direction: column;
  }
  .log-group {
    padding: 12px 14px;
    border-bottom: 1px solid var(--line);
  }
  .log-group h3 {
    display: flex;
    align-items: baseline;
    gap: 10px;
    margin: 0 0 8px;
    font: 600 15px/20px Cinzel, Georgia, serif;
  }
  .log-group h3 a {
    color: #ddd2b8;
    text-decoration: none;
  }
  .log-group h3 a:hover {
    color: var(--gold-bright);
  }
  .log-group h3 small {
    font: 12px/16px "DM Sans", system-ui, sans-serif;
    color: var(--muted);
  }
  .log-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 6px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .log-tile {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 44px;
    height: 100%;
    padding: 6px 10px;
    background: var(--well);
    border: 1px solid var(--line);
    border-radius: 3px;
    font-size: 13px;
    cursor: pointer;
  }
  .log-tile.got {
    border-color: #4c6b5c;
    background: #182a24;
  }
  .log-tile span {
    display: flex;
    flex-direction: column;
    min-width: 0;
    overflow-wrap: anywhere;
  }
  .log-tile small {
    font-size: 11px;
    color: var(--green);
  }
  @container (max-width: 900px) {
    .bossing-body {
      grid-template-columns: minmax(0, 1fr);
    }
    .order {
      margin-left: 0;
    }
    .next-card {
      grid-template-columns: 96px minmax(0, 1fr);
    }
    .next-art {
      height: 96px;
    }
    .next-card :global(.boss-art) {
      width: 96px;
      height: 96px;
    }
    .next-checks {
      grid-column: 1 / -1;
      padding: 12px 0 0;
      border-left: 0;
      border-top: 1px solid var(--line);
    }
  }
  @container (max-width: 520px) {
    .log-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
</style>
