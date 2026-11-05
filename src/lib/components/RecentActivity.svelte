<script lang="ts">
  import type { PlayerEvent, PlayerImportStatus } from "../playerTypes";
  import {
    activityWikiLookup,
    type ActivityWikiArticle,
  } from "../activityWiki";
  import {
    activityCategory,
    activityReference,
    activitySubject,
    activitySkillReferences,
  } from "../activityPresentation";
  import GameText from "./GameText.svelte";
  import Button from "./Button.svelte";

  let {
    events,
    fetchedAt,
    status,
    active = false,
    playerName,
  }: {
    events?: PlayerEvent[];
    fetchedAt?: number;
    status?: PlayerImportStatus;
    active?: boolean;
    playerName: string;
  } = $props();
  let articles = $state<Map<string, ActivityWikiArticle>>(new Map());
  let showAll = $state(false);
  let resolving = $state(false);
  const date = (value: string | number) => new Date(value).toLocaleString();
  let subjects = $derived((events ?? []).map(activitySubject));
  let rows = $derived(
    (events ?? []).map((event, index) => ({
      event,
      references: subjects[index]
        ? [
            activityReference(
              subjects[index]!,
              articles.get(subjects[index]!.name),
            ),
          ]
        : activitySkillReferences(event),
    })),
  );
  $effect(() => {
    if (!active) {
      resolving = false;
      return;
    }
    const names = subjects
      .filter((subject) => subject && !subject.reference)
      .map((subject) => subject!.name);
    const request = new AbortController();
    articles = new Map();
    showAll = false;
    resolving = names.length > 0;
    if (names.length)
      void activityWikiLookup.lookup(names, request.signal).then((found) => {
        if (request.signal.aborted) return;
        articles = found;
        resolving = false;
      });
    return () => request.abort();
  });
</script>

<section
  class="activity"
  aria-label="Recent Adventurer's Log events"
  aria-busy={resolving}
>
  <div class="activity-heading">
    <h3>Recent activity</h3>
    <a
      href={"https://secure.runescape.com/m=adventurers-log/api/v1/playerEvents/" +
        encodeURIComponent(playerName)}
      target="_blank"
      rel="noopener noreferrer">Jagex source ↗</a
    >
  </div>
  {#if resolving}<p class="activity-source" role="status">
      Resolving Wiki artwork…
    </p>{/if}
  {#if fetchedAt != null}
    <p class="activity-source">
      {status === "available" ? "Fetched" : "Last available snapshot"}
      {date(fetchedAt)}
      {#if status !== "available"}<span class="stale">
          · Latest refresh unavailable</span
        >{/if}
    </p>
    {#if rows.length}
      <ul class="activity-events">
        {#each rows.slice(0, showAll ? 20 : 5) as row}
          <li>
            <div class="activity-meta">
              <span title={row.event.type}
                >{activityCategory(row.event.type)}</span
              >
              <time datetime={row.event.date}>{date(row.event.date)}</time>
            </div>
            <p class="activity-title">
              <GameText
                text={row.event.text}
                references={row.references}
                catalogue={false}
              />
            </p>
            <details>
              <summary>Jagex details</summary>
              {#if row.event.details && row.event.details !== row.event.text}
                <p>
                  <GameText
                    text={row.event.details}
                    references={row.references}
                    catalogue={false}
                  />
                </p>
              {/if}
              <small>Event type: <code>{row.event.type}</code></small>
            </details>
          </li>
        {/each}
      </ul>
      {#if rows.length > 5}<Button
          variant="quiet"
          aria-expanded={showAll}
          onclick={() => (showAll = !showAll)}
        >
          {showAll ? "Show fewer events" : `Show all ${rows.length} events`}
        </Button>{/if}
    {:else}<p>No public events were returned.</p>{/if}
  {:else if !status}<p class="activity-source">
      Refresh this player to load public activity.
    </p>{/if}
  {#if status && status !== "available"}
    <p class="activity-source">
      {status === "not-member"
        ? "This event log requires active membership; Jagex reports this account is not a member."
        : status === "private-or-unavailable"
          ? "Jagex did not expose an event log for this player."
          : "The event service could not be reached. Any last available snapshot is kept."}
    </p>
  {/if}
  <p class="activity-source">
    Reported activity is not current inventory. Jagex and Compass can each cache
    responses for up to 10 minutes.
  </p>
  <details class="activity-help">
    <summary>Event settings</summary>
    <p>
      Active members can enable event types in Settings → Gameplay → Chat &amp;
      Social → RuneMetrics Event Log. Changes are not retroactive; kills and
      level-ups can be batched. Compass planning mode does not change account
      membership.
    </p>
  </details>
</section>

<style>
  .activity {
    border-top: 1px solid var(--line);
    margin-top: 14px;
    padding-top: 14px;
    overflow-wrap: anywhere;
  }
  .activity-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 8px;
  }
  .activity h3 {
    font-size: 1rem;
    margin: 0;
  }
  .activity-heading a,
  .activity-source,
  .activity-meta,
  .activity small {
    font-size: var(--font-caption);
    color: var(--muted);
  }
  .activity-events {
    list-style: none;
    padding: 0;
    margin: 12px 0;
    display: grid;
    gap: 10px;
  }
  .activity-events > li {
    border-top: 1px solid var(--line);
    padding-top: 10px;
    min-width: 0;
  }
  .activity-meta {
    display: flex;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 4px 12px;
  }
  .activity-meta > span {
    color: var(--gold-bright);
  }
  .activity-title {
    font-weight: 600;
  }
  .activity p {
    margin: 6px 0;
  }
  .activity details > summary {
    cursor: pointer;
    min-height: 44px;
    padding: 10px 0;
  }
  .activity code {
    overflow-wrap: anywhere;
  }
  .activity .stale {
    color: var(--gold-bright);
  }
  .activity-help {
    margin-top: 6px;
  }
</style>
