<script lang="ts">
  import {
    activityWikiLookup,
    type ActivityWikiArticle,
  } from "../activityWiki";
  import {
    activityReference,
    activitySkillReferences,
    activitySubject,
  } from "../activityPresentation";
  import {
    FILTER_GROUPS,
    filterGroup,
    groupActivity,
    isHighlight,
    levelUp,
    mergeActivity,
    type ActivityRow,
    type ActivitySource,
  } from "../activityFeed";
  import { Activity, Star } from "@lucide/svelte";
  import { wikiImage } from "../../wiki";
  import { relativeTime } from "../relativeTime";
  import GameText from "./GameText.svelte";
  import GameWindow from "./GameWindow.svelte";
  import ChoiceStrip from "./ChoiceStrip.svelte";
  import Button from "./Button.svelte";
  import SourceBanner from "./SourceBanner.svelte";

  let {
    sources,
    active = false,
    showFilters = false,
    initialLimit = 20,
    playerId = "all",
    framed = false,
  }: {
    sources: ActivitySource[];
    active?: boolean;
    /** Shows the category chips; the page owns the player filter. */
    showFilters?: boolean;
    initialLimit?: number;
    playerId?: string;
    /** Page mode: the feed sits in a window and per-player status lives in a separate panel. */
    framed?: boolean;
  } = $props();
  // Re-stamped whenever a refresh brings new sources, so ages do not freeze at mount.
  let now = $derived.by(() => {
    void sources;
    return Date.now();
  });
  const instance = $props.id();
  let category = $state("all");
  let showAll = $state(false);
  let articles = $state<Map<string, ActivityWikiArticle>>(new Map());
  let resolving = $state(false);
  let selectedPlayer = $derived(
    sources.some((source) => source.playerId === playerId) ? playerId : "all",
  );
  let scopedSources = $derived(
    selectedPlayer === "all"
      ? sources
      : sources.filter((source) => source.playerId === selectedPlayer),
  );
  let allRows = $derived(mergeActivity(sources));
  let rows = $derived(
    selectedPlayer === "all"
      ? allRows
      : allRows.filter((row) => row.playerId === selectedPlayer),
  );
  const tally = (list: readonly ActivityRow[], pick: (row: ActivityRow) => string) => {
    const counts = new Map<string, number>();
    for (const row of list) counts.set(pick(row), (counts.get(pick(row)) ?? 0) + 1);
    return counts;
  };
  let categoryCounts = $derived(tally(rows, (row) => filterGroup(row.category)));
  let categories = $derived(FILTER_GROUPS.filter((g) => categoryCounts.has(g)));
  const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;
  let selectedCategory = $derived(
    categories.includes(category) ? category : "all",
  );
  let filtered = $derived(
    selectedCategory === "all"
      ? rows
      : rows.filter((row) => filterGroup(row.category) === selectedCategory),
  );
  let visible = $derived(
    filtered.slice(0, showAll ? undefined : Math.max(1, initialLimit)),
  );
  let days = $derived(groupActivity(visible, now));
  const date = (value: string | number) => {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime())
      ? String(value)
      : parsed.toLocaleString();
  };
  $effect(() => {
    const names = active
      ? [
          ...new Set(
            visible
              .map((row) => activitySubject(row.event))
              .filter((subject) => subject && !subject.reference)
              .map((subject) => subject!.name),
          ),
        ]
      : [];
    const request = new AbortController();
    articles = new Map();
    resolving = names.length > 0;
    if (names.length) {
      void activityWikiLookup.lookup(names, request.signal).then((found) => {
        if (request.signal.aborted) return;
        articles = found;
        resolving = false;
      });
    }
    return () => request.abort();
  });
</script>

<div class="feed" aria-busy={resolving}>
  {#if !framed}{#each scopedSources as source (source.playerId)}
    <div class="source">
      <strong>{source.name}</strong> ·
      <a
        href={"https://secure.runescape.com/m=adventurers-log/api/v1/playerEvents/" +
          encodeURIComponent(source.name)}
        target="_blank"
        rel="noopener noreferrer">Jagex source ↗</a
      >
      {#if source.fetchedAt != null}
        <span>
          · {source.status === "available"
            ? "Fetched"
            : "Last available snapshot"}
          {date(source.fetchedAt)}</span
        >
      {:else if !source.status}
        <span> · Refresh this player to load public activity.</span>
      {/if}
      {#if source.status && source.status !== "available"}
        <SourceBanner
          notice={{
            tone:
              source.status === "private-or-unavailable" ? "private" : "info",
            title: "Event log unavailable",
            message:
              source.status === "not-member"
                ? "This event log requires active membership; Jagex reports this account is not a member."
                : source.status === "private-or-unavailable"
                  ? "Jagex did not expose an event log for this player."
                  : "The event service could not be reached. Any last available snapshot is kept.",
            retry: false,
          }}
        />
      {:else if source.fetchedAt != null && !source.events?.length}
        <p>No public events were returned.</p>
      {/if}
    </div>
  {/each}{/if}
  {#if framed}
    <GameWindow title="Adventurer's Log" trailing={filtered.length + (filtered.length === 1 ? " event" : " events")}>
      <div class="feed-body">{@render body()}</div>
    </GameWindow>
  {:else}
    {@render body()}
  {/if}
</div>

{#snippet body()}
  {#if showFilters && categories.length > 1}<div class="categories">
      <ChoiceStrip
        label="Category"
        legend="hidden"
        name={instance + "-category"}
        value={selectedCategory}
        choices={[
          { value: "all", label: `All · ${rows.length}` },
          ...categories.map((value) => ({
            value,
            label: `${value} · ${categoryCounts.get(value)}`,
          })),
        ]}
        onChange={(value) => {
          category = value;
          showAll = false;
        }}
      />
    </div>{/if}
  {#if resolving}<p class="source" role="status">
      Resolving Wiki artwork…
    </p>{/if}
  {#if visible.length}
    {#each days as day (day.key)}
      <svelte:element this={framed ? "h3" : "h4"} class="day"
        >{day.label} <span>{plural(day.count, "event")}</span></svelte:element
      >
      <ul class="events">
        {#each day.items as item (item.key)}
          {#if item.kind === "levels"}
            {@const newest = item.rows[0]}
            {@const icon =
              item.skills.length === 1
                ? activitySkillReferences(newest.event)?.[0]?.image
                : undefined}
            <li>
              <span class="art batch" aria-hidden="true"
                >{#if icon}<img
                    src={wikiImage(icon)}
                    alt=""
                    loading="lazy"
                    decoding="async"
                  />{:else}+{item.rows.length}{/if}</span
              >
              <div class="ev-main">
                <p class="title">
                  <strong>{item.playerName}</strong>
                  gained {item.rows.length} levels
                  {#if item.highlight}{@render highlight()}{/if}
                </p>
                <ul class="levels">
                  {#each item.skills as run (run.skill)}
                    <li>
                      {run.skill}
                      {#if run.from != null && run.to != null && run.from !== run.to}{run.from}
                        → {run.to}{:else if run.to != null}{run.to}{:else if run.count > 1}×{run.count}{/if}
                    </li>
                  {/each}
                </ul>
                {@render meta(newest, newest.category)}
              </div>
            </li>
          {:else}
            {@const row = item.row}
            {@const subject = activitySubject(row.event)}
            {@const references = subject
              ? [activityReference(subject, articles.get(subject.name))]
              : activitySkillReferences(row.event)}
            {@const reference = references?.find((r) => r.imageUrl || r.image)}
            {@const art = reference
              ? (reference.imageUrl ?? wikiImage(reference.image!))
              : undefined}
            <li>
              <span class="art" aria-hidden="true"
                >{#if art}<img
                    src={art}
                    alt=""
                    loading="lazy"
                    decoding="async"
                  />{:else}<Activity size={20} />{/if}</span
              >
              <div class="ev-main">
                <p class="title">
                  <strong>{row.playerName}</strong>
                  <GameText
                    text={row.event.text}
                    {references}
                    catalogue={false}
                    images={!art}
                  />
                  {#if isHighlight(row.event)}{@render highlight()}{/if}
                </p>
                {@render meta(row)}
                {#if row.event.details && row.event.details !== row.event.text && !/^quest complete!?$/i.test(row.event.details.trim()) && !levelUp(row.event)?.level}
                  <details>
                    <summary>Details</summary>
                    <p>
                      <GameText
                        text={row.event.details}
                        {references}
                        catalogue={false}
                      />
                    </p>
                  </details>
                {/if}
              </div>
            </li>
          {/if}
        {/each}
      </ul>
    {/each}
    {#if filtered.length > Math.max(1, initialLimit)}
      <Button
        variant="quiet"
        aria-expanded={showAll}
        onclick={() => (showAll = !showAll)}
        >{showAll
          ? "Show fewer events"
          : `Show all ${filtered.length} events`}</Button
      >
    {/if}
  {:else if rows.length}
    <p>No events match this category.</p>
  {:else if framed}
    <p class="source">No public events yet for the players in scope.</p>
  {/if}
  <p class="source">
    Jagex returns each player's latest 20 events, and Jagex and Compass can each
    cache them for up to 10 minutes. The log shows what happened, not what a
    player holds now.
  </p>
  {#if !framed}<details class="help">
      <summary>Event settings</summary>
      <p>
        Active members can enable event types in Settings → Gameplay → Chat
        &amp; Social → RuneMetrics Event Log. Changes are not retroactive;
        kills and level-ups can be batched. Compass planning mode does not
        change account membership.
      </p>
    </details>{/if}
{/snippet}

{#snippet highlight()}<span class="highlight"
    ><Star size={12} aria-hidden="true" />Highlight</span
  >{/snippet}

{#snippet meta(row: ActivityRow, label?: string)}
  {@const when = Date.parse(row.event.date)}
  {@const level = levelUp(row.event)?.level}
  <div class="meta">
    <span>{label ?? (level ? `Level ${level}` : row.category)}</span>
    <time datetime={row.event.date} title={date(row.event.date)}
      >{Number.isNaN(when) ? date(row.event.date) : relativeTime(when, now)}</time
    >
  </div>
{/snippet}

<style>
  .feed {
    overflow-wrap: anywhere;
  }
  .source,
  .meta,
  small {
    font-size: var(--font-caption);
    color: var(--muted);
  }
  .source {
    margin: 8px 0;
  }
  .source p,
  .feed p {
    margin: 6px 0;
  }
  .events {
    list-style: none;
    padding: 0;
    margin: 0 0 8px;
    display: grid;
    gap: 0;
  }
  .day {
    display: flex;
    align-items: baseline;
    gap: 10px;
    margin: 16px 0 0;
    padding: 8px 0;
    font-family: inherit;
    font-size: 1rem;
    font-weight: 600;
    color: var(--text);
    border-bottom: 1px solid var(--line);
  }
  .day span {
    font-size: var(--font-caption);
    font-weight: 400;
    color: var(--muted);
  }
  .categories {
    padding-top: 12px;
  }
  .art.batch {
    font-size: var(--font-caption);
    font-weight: 700;
  }
  .levels {
    list-style: none;
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin: 6px 0;
    padding: 0;
  }
  .levels li {
    padding: 0 8px;
    border: 1px solid var(--line);
    border-radius: 4px;
    background: var(--panel-raised);
    font-size: var(--font-caption);
    line-height: 22px;
  }
  .highlight {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    margin-left: 6px;
    padding: 0 6px;
    border: 1px solid var(--gold);
    border-radius: 4px;
    font-size: var(--font-caption);
    line-height: 18px;
    font-weight: 600;
    color: var(--gold-bright);
    vertical-align: 1px;
  }
  .feed-body {
    padding: 4px 18px 16px;
  }
  .events > li {
    display: flex;
    gap: 14px;
    align-items: flex-start;
    border-top: 1px solid var(--line);
    padding-top: 12px;
    padding-bottom: 12px;
    min-width: 0;
  }
  .events > li:first-child {
    border-top: 0;
  }
  .art {
    display: inline-flex;
    flex: none;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    box-sizing: border-box;
    padding: 3px;
    background: var(--well);
    border: 1px solid var(--line);
    border-radius: 3px;
    color: var(--muted);
  }
  .art img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
  }
  .ev-main {
    flex: 1 1 0;
    min-width: 0;
  }
  .meta {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 12px;
  }
  .title strong {
    color: var(--gold-bright);
    margin-right: 4px;
  }
  .title {
    font-weight: 500;
    margin: 0;
  }
  details > summary {
    cursor: pointer;
    min-height: 44px;
    padding: 10px 0;
  }
  code {
    overflow-wrap: anywhere;
  }
  .help {
    margin-top: 6px;
  }
</style>
