<script lang="ts">
  import type { Profile } from "../../data";
  import GameText from "./GameText.svelte";
  let {
    profile,
    skill,
    activities = false,
  }: {
    profile: Profile;
    skill?: string;
    activities?: boolean;
  } = $props();
  let stats = $derived(
    skill ? profile.statistics?.skills[skill] : profile.statistics?.overall,
  );
  const number = (value?: number) =>
    value == null ? "Unavailable" : value.toLocaleString();
  const date = (value: number) => new Date(value).toLocaleString();
</script>

{#if profile.source === "hiscores"}
  <section
    class="player-statistics"
    aria-label={skill ? `${skill} Hiscores` : "Account snapshot"}
  >
    <dl class="statistics-grid">
      {#if skill}
        <div>
          <dt>Hiscores XP</dt>
          <dd>{number(stats?.xp)}</dd>
        </div>
        <div>
          <dt title="Main RS3 Hiscores, including all account types">
            RS3 rank
          </dt>
          <dd>
            {stats
              ? stats.rank == null
                ? "Unranked"
                : number(stats.rank)
              : "Unavailable"}
          </dd>
        </div>
      {:else}
        <div>
          <dt>Total level</dt>
          <dd>{number(profile.statistics?.overall.level)}</dd>
        </div>
        <div>
          <dt>Total XP</dt>
          <dd>{number(profile.statistics?.overall.xp)}</dd>
        </div>
        <div
          class:stale={profile.questProgress &&
            profile.questImportStatus !== "available"}
        >
          <dt>
            Quest points{#if profile.questProgress && profile.questImportStatus !== "available"}
              · last available{/if}
          </dt>
          <dd>
            {#if profile.questProgress}{number(
                profile.questProgress.questPoints,
              )}
              <span>/ {number(profile.questProgress.maxQuestPoints)}</span
              >{:else}Unavailable{/if}
          </dd>
        </div>
        <div>
          <dt title="Main RS3 Hiscores, including all account types">
            RS3 overall rank
          </dt>
          <dd>
            {profile.statistics
              ? profile.statistics.overall.rank == null
                ? "Unranked"
                : number(profile.statistics.overall.rank)
              : "Unavailable"}
          </dd>
        </div>
      {/if}
    </dl>
    {#if profile.statistics}
      <p class="statistics-source">
        {!skill &&
        profile.questProgress?.fetchedAt === profile.statistics.fetchedAt &&
        profile.questImportStatus === "available"
          ? "Public snapshot"
          : "Main RS3 Hiscores"} · {profile.hiscoresImportStatus &&
        profile.hiscoresImportStatus !== "available"
          ? "last available"
          : "fetched"}
        {date(profile.statistics.fetchedAt)}
      </p>
    {:else if profile.hiscoresImportStatus === "unranked-or-unavailable" || profile.hiscoresImportStatus === "service-unavailable"}
      <p class="statistics-source">
        Hiscores data unavailable · {profile.hiscoresImportStatus ===
        "unranked-or-unavailable"
          ? "Jagex has no main Hiscores entry. Available quests and activity are separate."
          : "The Hiscores refresh is unavailable; other public sources may still be loaded."}
      </p>
    {:else}
      <p class="statistics-source">
        Refresh in Players to load public XP and ranks.
      </p>
    {/if}
    {#if !skill && profile.questProgress && (profile.questProgress.fetchedAt !== profile.statistics?.fetchedAt || profile.questImportStatus !== "available")}
      <p class="statistics-source">
        Quest points fetched {date(
          profile.questProgress.fetchedAt,
        )}{profile.questImportStatus !== "available"
          ? " · latest quest refresh unavailable"
          : ""}
      </p>
    {/if}
    {#if activities && profile.statistics}
      <details class="hiscore-activities">
        <summary>Hiscores activity scores</summary>
        {#if profile.statistics.activities.length}
          <div class="activity-score-table">
            <table>
              <thead
                ><tr
                  ><th scope="col">Activity</th><th scope="col">Score</th><th
                    scope="col">RS3 rank</th
                  ></tr
                ></thead
              >
              <tbody
                >{#each profile.statistics.activities as activity}
                  <tr
                    ><th scope="row"><GameText text={activity.name} /></th>
                    <td>{number(activity.score)}</td><td
                      >{activity.rank == null
                        ? "Unranked"
                        : number(activity.rank)}</td
                    ></tr
                  >
                {/each}</tbody
              >
            </table>
          </div>
          <p class="statistics-source">
            Source scores can include historical activities and other modes.
            Ranks cover all account types.
          </p>
        {:else}<p class="statistics-source">
            No activity scores were returned.
          </p>{/if}
      </details>
    {/if}
  </section>
{/if}

<style>
  .player-statistics {
    min-width: 0;
    overflow-wrap: anywhere;
  }
  .statistics-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px 16px;
    margin: 0 0 10px;
  }
  .statistics-grid > div {
    min-width: 0;
  }
  .statistics-grid dt,
  .statistics-source {
    color: var(--muted);
    font-size: var(--font-caption);
  }
  .statistics-grid dd {
    margin: 2px 0 0;
    font-size: 1.05rem;
    font-weight: 600;
    color: var(--gold-bright);
    font-variant-numeric: tabular-nums;
  }
  .statistics-grid dd > span {
    color: var(--muted);
    font-size: var(--font-caption);
    font-weight: 400;
  }
  .statistics-grid .stale dt {
    color: var(--gold-bright);
  }
  .statistics-source {
    margin: 5px 0;
  }
  .hiscore-activities {
    margin-top: 10px;
  }
  .hiscore-activities > summary {
    cursor: pointer;
    min-height: 44px;
    padding: 10px 0;
  }
  .activity-score-table {
    overflow-x: auto;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--font-caption);
  }
  th,
  td {
    border-bottom: 1px solid var(--line);
    padding: 8px 6px;
  }
  th {
    font-weight: 500;
    text-align: left;
  }
  td,
  thead th:not(:first-child) {
    text-align: right;
    font-variant-numeric: tabular-nums;
  }
</style>
