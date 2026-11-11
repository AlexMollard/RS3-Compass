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
  import { mergeActivity, type ActivitySource } from "../activityFeed";
  import { Activity } from "@lucide/svelte";
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
    playerId,
    onPlayerChange,
    framed = false,
  }: {
    sources: ActivitySource[];
    active?: boolean;
    showFilters?: boolean;
    initialLimit?: number;
    playerId?: string;
    onPlayerChange?: (id: string) => void;
    /** Page mode: the feed sits in a window and per-player status lives in a separate panel. */
    framed?: boolean;
  } = $props();
  // Re-stamped whenever a refresh brings new sources, so ages do not freeze at mount.
  let now = $derived.by(() => {
    void sources;
    return Date.now();
  });
  const instance = $props.id();
  let player = $state("all");
  let category = $state("all");
  let showAll = $state(false);
  let articles = $state<Map<string, ActivityWikiArticle>>(new Map());
  let resolving = $state(false);
  let chosenPlayer = $derived(playerId ?? player);
  let selectedPlayer = $derived(
    sources.some((source) => source.playerId === chosenPlayer)
      ? chosenPlayer
      : "all",
  );
  let scopedSources = $derived(
    selectedPlayer === "all"
      ? sources
      : sources.filter((source) => source.playerId === selectedPlayer),
  );
  let rows = $derived(mergeActivity(scopedSources));
  let categories = $derived(
    [...new Set(rows.map((row) => row.category))].sort(),
  );
  let selectedCategory = $derived(
    categories.includes(category) ? category : "all",
  );
  let filtered = $derived(
    selectedCategory === "all"
      ? rows
      : rows.filter((row) => row.category === selectedCategory),
  );
  let visible = $derived(
    filtered.slice(0, showAll ? undefined : Math.max(1, initialLimit)),
  );
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
  {#if showFilters && sources.length > 1}
    <ChoiceStrip
      label="Player"
      name={instance + "-player"}
      value={selectedPlayer}
      choices={[
        { value: "all", label: "All players" },
        ...sources.map((source) => ({
          value: source.playerId,
          label: source.name,
        })),
      ]}
      onChange={(value) => {
        if (onPlayerChange) onPlayerChange(value);
        else player = value;
        category = "all";
        showAll = false;
      }}
    />
  {/if}
  {#if showFilters && categories.length > 1}
    <ChoiceStrip
      label="Category"
      name={instance + "-category"}
      value={selectedCategory}
      choices={[
        { value: "all", label: "All categories" },
        ...categories.map((value) => ({ value, label: value })),
      ]}
      onChange={(value) => {
        category = value;
        showAll = false;
      }}
    />
  {/if}
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
  {#if resolving}<p class="source" role="status">
      Resolving Wiki artwork…
    </p>{/if}
  {#if visible.length}
    <ul class="events">
      {#each visible as row (row.key)}
        {@const subject = activitySubject(row.event)}
        {@const references = subject
          ? [activityReference(subject, articles.get(subject.name))]
          : activitySkillReferences(row.event)}
        {@const reference = references?.find((r) => r.imageUrl || r.image)}
        {@const art = reference
          ? (reference.imageUrl ?? wikiImage(reference.image!))
          : undefined}
        {@const when = Date.parse(row.event.date)}
        <li>
          <span class="art" aria-hidden="true"
            >{#if art}<img src={art} alt="" loading="lazy" decoding="async" />{:else}<Activity
                size={20}
              />{/if}</span
          >
          <div class="ev-main">
            <p class="title">
              <strong>{row.playerName}</strong>
              <GameText text={row.event.text} {references} catalogue={false} />
            </p>
            <div class="meta">
              <span>{row.category}</span>
              <time datetime={row.event.date} title={date(row.event.date)}
                >{Number.isNaN(when)
                  ? date(row.event.date)
                  : relativeTime(when, now)}</time
              >
            </div>
            <details>
              <summary>Jagex details</summary>
              {#if row.event.details && row.event.details !== row.event.text}<p>
                  <GameText
                    text={row.event.details}
                    {references}
                    catalogue={false}
                  />
                </p>{/if}
              <small>Event type: <code>{row.event.type}</code></small>
            </details>
          </div>
        </li>
      {/each}
    </ul>
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
    Reported activity is not current inventory. Jagex and Compass can each cache
    responses for up to 10 minutes. Only the latest 20 events per player are
    returned.
  </p>
  <details class="help">
    <summary>Event settings</summary>
    <p>
      Active members can enable event types in Settings → Gameplay → Chat &amp;
      Social → RuneMetrics Event Log. Changes are not retroactive; kills and
      level-ups can be batched. Compass planning mode does not change account
      membership.
    </p>
  </details>
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
    margin: 12px 0;
    display: grid;
    gap: 0;
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
