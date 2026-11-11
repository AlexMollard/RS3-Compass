<script lang="ts">
  import { onMount, untrack } from "svelte";
  import { SKILLS } from "../../data";
  import { getCompass } from "../compassContext";
  import { fetchGroup } from "../groupClient";
  import type { GroupLookup, GroupSize } from "../groupTypes";
  import { groupPlayers, groupSkillSummary } from "../groupProgress";
  import { publicProfileId } from "../playerName";
  import { relativeTime } from "../relativeTime";
  import {
    isSnapshotStale,
    rateLimitNotice,
    snapshotFetchedAt,
  } from "../sourceStatus";
  import SkillComparison from "../components/SkillComparison.svelte";
  import SkillGaps from "../components/SkillGaps.svelte";
  import { RefreshCw } from "@lucide/svelte";
  import PageHeading from "../components/PageHeading.svelte";
  import ChoiceStrip from "../components/ChoiceStrip.svelte";
  import GameWindow from "../components/GameWindow.svelte";
  import GameArt from "../components/GameArt.svelte";
  import GameStat from "../components/GameStat.svelte";
  import PlayerPortrait from "../components/PlayerPortrait.svelte";
  import SourceBanner from "../components/SourceBanner.svelte";
  import StatusChip from "../components/StatusChip.svelte";
  import { wikiHref } from "../../wiki";
  import Button from "../components/Button.svelte";

  const controller = getCompass();
  const saved = controller.state;
  const sync = controller.syncState;
  let name = $state("");
  let size = $state<GroupSize>(2);
  let competitive = $state(false);
  let selectedId = $state("");
  let lookupError = $state("");
  let loading = $state(false);
  let adding = $state(false);
  let refreshing = $state(false);
  let messages = $state<Record<number, string>>({});
  let failures = $state<Record<number, string>>({});
  let removing = $state<number | null>(null);
  let mounted = $state(false);
  let request: AbortController | undefined;
  const attempted = new Map<number, number>();
  let groups = $derived($saved.groups ?? []);
  let group = $derived(
    groups.find((g) => String(g.id) === selectedId) ?? groups[0],
  );
  let members = $derived(group ? groupPlayers(group, $saved.profiles) : []);
  let ids = $derived(members.flatMap((m) => (m.profile ? [m.profile.id] : [])));
  let syncKey = $derived(JSON.stringify([group?.id, ids]));
  let memberIds = $derived(
    group?.members.map((m) => publicProfileId(m.name)) ?? [],
  );
  let memberBusy = $derived(
    memberIds.some(
      (id) =>
        $sync[id]?.state === "queued" || $sync[id]?.state === "refreshing",
    ),
  );
  // Skills where a member is among the leaders; unknown without published levels.
  let highestCounts = $derived(
    members.map((m) =>
      m.profile?.hiscoresLevels
        ? SKILLS.filter((s) =>
            groupSkillSummary(members, s.name).leaders.includes(m.member.name),
          ).length
        : undefined,
    ),
  );
  const number = (value: number) => value.toLocaleString();
  const date = (value: number) => new Date(value).toLocaleString();
  const sourceUrl = (g: GroupLookup) =>
    `https://rs.runescape.com/hiscores/group-ironman/${g.isCompetitive ? "competitive" : "regular"}/${g.size}/${encodeURIComponent(g.name)}`;
  function cancelLookup() {
    request?.abort();
    request = undefined;
    loading = false;
    refreshing = false;
  }
  async function add(event: SubmitEvent) {
    event.preventDefault();
    cancelLookup();
    const current = new AbortController();
    request = current;
    loading = true;
    lookupError = "";
    try {
      const found = await fetchGroup(
        { name, size, isCompetitive: competitive },
        current.signal,
      );
      if (current.signal.aborted || request !== current) return;
      controller.saveGroup(found);
      selectedId = String(found.id);
      adding = false;
      request = undefined;
      loading = false;
      void controller.importGroupMembers(found.id);
    } catch (error) {
      if (!current.signal.aborted && request === current)
        lookupError =
          error instanceof Error
            ? error.message
            : "Group lookup is unavailable.";
    } finally {
      if (request === current) {
        request = undefined;
        loading = false;
      }
    }
  }
  async function refresh(staleOnly = true) {
    if (!group || document.visibilityState === "hidden") return;
    void controller.refreshPlayers(ids, {
      staleOnly,
      scope: staleOnly ? "group-view" : undefined,
    });
    const target = group;
    if (Date.now() - target.fetchedAt < 600_000) {
      if (!staleOnly)
        messages[target.id] =
          "Using the cached group snapshot. Player requests also respect their cache.";
      return;
    }
    if (request || Date.now() - (attempted.get(target.id) ?? 0) < 60_000)
      return;
    const current = new AbortController();
    request = current;
    attempted.set(target.id, Date.now());
    refreshing = true;
    try {
      const found = await fetchGroup(
        {
          name: target.name,
          size: target.size,
          isCompetitive: target.isCompetitive,
        },
        current.signal,
      );
      if (
        current.signal.aborted ||
        request !== current ||
        !$saved.groups?.some((g) => g.id === target.id)
      )
        return;
      if (found.id !== target.id)
        throw new Error(
          "This name now identifies a different group. Add it separately to keep the old snapshot distinct.",
        );
      controller.saveGroup(found);
      failures[target.id] = "";
      messages[target.id] = "Group snapshot loaded.";
    } catch (error) {
      if (!current.signal.aborted && request === current)
        failures[target.id] =
          (error instanceof Error
            ? error.message
            : "Group service unavailable.") + " The previous roster is kept.";
    } finally {
      if (request === current) {
        request = undefined;
        refreshing = false;
      }
    }
  }
  function retry() {
    if (!group) return;
    attempted.delete(group.id);
    void refresh(false);
  }
  onMount(() => {
    mounted = true;
    const timer = window.setInterval(() => void refresh(), 60_000);
    const visible = () => void refresh();
    document.addEventListener("visibilitychange", visible);
    return () => {
      cancelLookup();
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", visible);
    };
  });
  $effect(() => {
    syncKey;
    if (mounted) untrack(() => void refresh());
    return () => controller.cancelRefreshScope("group-view");
  });
</script>

<div class="groups-page page-enter">
  <PageHeading
    title="Group Ironman"
    subtitle="Public rosters, progression and individual preparation gaps."
  >
    {#snippet trailing()}{#if groups.length}<Button
          onclick={() => {
            cancelLookup();
            lookupError = "";
            adding = !adding;
          }}>{adding ? "Close group search" : "Add another group"}</Button
        >{/if}{/snippet}
  </PageHeading>
  {#if !groups.length || adding}
    <GameWindow title="Find your group" icon="Group_Ironman_badge.png">
      <form class="group-form" onsubmit={(event) => void add(event)}>
        <label class="group-name"
          >Group name<input
            required
            maxlength="25"
            bind:value={name}
            disabled={loading}
            autocomplete="off"
          /></label
        >
        <ChoiceStrip
          label="Group size"
          name="group-size"
          value={String(size)}
          choices={[2, 3, 4, 5].map((n) => ({
            value: String(n),
            label: String(n) + " players",
          }))}
          onChange={(value) => {
            size = Number(value) as GroupSize;
            cancelLookup();
          }}
        />
        <ChoiceStrip
          label="Hiscores category"
          name="group-category"
          value={competitive ? "competitive" : "regular"}
          choices={[
            { value: "regular", label: "Regular" },
            { value: "competitive", label: "Competitive" },
          ]}
          onChange={(value) => {
            competitive = value === "competitive";
            cancelLookup();
          }}
        />
        <div class="actions">
          <Button type="submit" variant="primary" disabled={loading}
            >{loading ? "Loading group…" : "Add group and load players"}</Button
          >{#if loading}<Button onclick={cancelLookup}>Cancel</Button>{/if}
        </div>
        {#if lookupError}<div class="form-notice">
            <SourceBanner
              notice={{
                tone: "failed",
                title: "Group lookup failed",
                message: lookupError,
                retry: false,
              }}
            />
          </div>{/if}
      </form>
    </GameWindow>
  {/if}
  {#if group}
    {#if groups.length > 1}<div class="saved-group-picker">
        <ChoiceStrip
          label="Saved groups"
          name="saved-group"
          value={String(group.id)}
          choices={groups.map((g) => ({
            value: String(g.id),
            label: g.name,
            detail: `${g.size} players · ${g.isCompetitive ? "Competitive" : "Regular"}`,
          }))}
          onChange={(value) => {
            cancelLookup();
            selectedId = value;
            removing = null;
          }}
        />
      </div>{/if}
    <section
      class="group-banner tool-window"
      aria-label={group.name + " overview"}
    >
      <a
        class="enclave-art"
        href={wikiHref("Iron Enclave")}
        target="_blank"
        rel="noopener noreferrer"
      >
        <GameArt
          file="Iron_Enclave_camp.png"
          size={360}
          alt="The camp at the Iron Enclave, the Group Ironman hub"
        />
        <span>Iron Enclave ↗</span>
      </a>
      <div class="banner-body">
        <span class="helm">
          <GameArt
            file={group.isCompetitive
              ? "Competitive_Group_Ironman_helm.png"
              : "Group_Ironman_helm.png"}
            size={56}
          />
        </span>
        <div class="banner-title">
          <span class="eyebrow"
            >Group Ironman · {group.isCompetitive ? "Competitive" : "Regular"} · {group.size}
            players{group.founder ? " · Founder group" : ""}</span
          >
          <h2>{group.name}</h2>
        </div>
        <div class="banner-actions">
          <StatusChip
            tone={Date.now() - group.fetchedAt > 86_400_000 ? "warn" : "ok"}
            label={"Roster checked " + relativeTime(group.fetchedAt)}
          />
          <Button
            disabled={refreshing || memberBusy}
            onclick={() => void refresh(false)}
          >
            <RefreshCw size={16} aria-hidden="true" />{refreshing || memberBusy
              ? "Refreshing…"
              : "Refresh"}
          </Button>
          {#if members.some((m) => !m.profile)}
            <Button
              disabled={memberBusy}
              onclick={() => void controller.importGroupMembers(group!.id)}
              >Load missing players</Button
            >
          {/if}
          <a class="btn btn-quiet" href={"/activity?group=" + group.id}
            >Group activity</a
          >
        </div>
      </div>
      <div class="totals">
        <GameStat
          label="Group total level"
          value={number(group.totalLevel)}
        />
        <GameStat label="Group XP" value={number(group.totalXp)} />
        <GameStat
          label="Group rank"
          value={group.rank == null ? "Not reported" : number(group.rank)}
        />
      </div>
      <div class="group-source source">
        <span>Group snapshot · {date(group.fetchedAt)}</span>
        <a href={sourceUrl(group)} target="_blank" rel="noopener noreferrer"
          >Official Hiscores ↗</a
        >
      </div>
    </section>
    {#if failures[group.id]}<SourceBanner
        notice={{
          tone: "stale",
          title: "Group service unavailable",
          message: failures[group.id],
          retry: true,
        }}
        onRetry={retry}
      />{/if}
    {#if messages[group.id]}<p class="source" role="status">
        {messages[group.id]}
      </p>{/if}
    <div
      class="roster-grid"
      role="list"
      aria-label="Members, {members.filter((m) => m.profile)
        .length} of {members.length} loaded"
    >
      {#each members as member, index (member.member.name)}
        {@const id = publicProfileId(member.member.name)}
        {@const memberSync = $sync[id]}
        {@const profile = member.profile}
        {@const active = profile?.id === $saved.activeId}
        {@const stale = profile ? isSnapshotStale(profile, memberSync) : false}
        <article
          class="member-card game-surface"
          class:selected={active}
          role="listitem"
          aria-label={member.member.name}
        >
          <div class="member-heading">
            <PlayerPortrait name={member.member.name} size={72} />
            <div>
              <a
                class="member-name"
                href={"/activity?player=" + encodeURIComponent(id)}
                >{member.member.name}</a
              >
              <div class="member-chip">
                {#if memberSync?.state === "error"}<StatusChip
                    tone="warn"
                    label="Refresh failed"
                  />
                {:else if memberSync?.state === "queued" || memberSync?.state === "refreshing"}<StatusChip
                    tone="info"
                    label={memberSync.state === "queued"
                      ? "Queued for refresh"
                      : "Loading public data…"}
                  />
                {:else if !profile}<StatusChip
                    tone="neutral"
                    label="Not loaded"
                  />
                {:else if stale}<StatusChip
                    tone="warn"
                    label="Showing last saved data"
                  />
                {:else if !profile.hiscoresLevels}<StatusChip
                    tone="neutral"
                    label="No published levels"
                  />
                {:else if active}<StatusChip tone="ok" label="Planning as" />
                {:else}<StatusChip tone="neutral" label="Group member" />{/if}
              </div>
            </div>
          </div>
          <dl class="member-stats">
            <div class="stat">
              <dt>Total</dt>
              <dd>{profile?.statistics?.overall.level ?? "?"}</dd>
            </div>
            <div class="stat">
              <dt>Quest pts</dt>
              <dd>{profile?.questProgress?.questPoints ?? "?"}</dd>
            </div>
            <div class="stat">
              <dt>Highest</dt>
              <dd>{highestCounts[index] ?? "?"}</dd>
            </div>
          </dl>
          {#if memberSync?.state === "error"}<SourceBanner
              notice={memberSync.rateLimited
                ? rateLimitNotice(memberSync.nextRefreshAt)
                : {
                    tone: "failed",
                    title: "Refresh failed",
                    message: memberSync.message ?? "",
                    retry: false,
                  }}
            />
          {:else if !profile}<p class="source">
              Player not loaded. Use Load missing players above.
            </p>{/if}
          {#if profile}
            <details class="source source-times">
              <summary
                >Public lookup · {snapshotFetchedAt(profile) != null
                  ? date(snapshotFetchedAt(profile)!)
                  : "Not fetched"}</summary
              >
              <p>
                Hiscores: {profile.hiscoresFetchedAt != null
                  ? date(profile.hiscoresFetchedAt)
                  : "Unrecorded"}<br />Quests: {profile.questProgress
                  ? date(profile.questProgress.fetchedAt)
                  : "Unrecorded"}
              </p>
            </details>
            <div class="member-actions">
              <Button
                disabled={active}
                onclick={() => controller.selectProfile(profile.id)}
                >{active ? "Selected" : "Use player"}</Button
              >
              <a href={"/activity?player=" + encodeURIComponent(id)}
                >Activity →</a
              >
            </div>
          {/if}
        </article>
      {/each}
    </div>
    <div class="two">
      <SkillComparison
        players={members}
        id="group"
        highestLabel="Highest published in the group"
        sourceNote="Individual source times are shown under each member."
      />
      <aside class="side-panels">
        <SkillGaps players={members} />
        <GameWindow title="Latest from the group">
          <p class="side-copy">
            Recent levels and quest completions for each member are on the
            Activity page.
          </p>
          <a class="side-link" href={"/activity?group=" + group.id}
            >Open the group feed</a
          >
        </GameWindow>
      </aside>
    </div>
    <div class="remove-group">
      {#if removing === group.id}<p role="alert">
          Remove this cached group? Individual players and their local plans
          will stay.
        </p>
        <div class="actions">
          <Button
            onclick={() => {
              const id = group!.id;
              cancelLookup();
              controller.removeGroup(id);
              selectedId = "";
              removing = null;
            }}>Remove group</Button
          ><Button onclick={() => (removing = null)}>Keep group</Button>
        </div>{:else}<Button
          variant="quiet"
          onclick={() => (removing = group!.id)}>Remove cached group</Button
        >{/if}
    </div>
  {:else}<p class="empty-state">
      Add a group to compare its members and follow their public activity. Group
      snapshots and preparation plans stay on this device.
    </p>{/if}
  <p class="source">
    Group lookup does not expose shared storage or private inventories. This is
    a public-data dashboard, not a shared editable board or cloud backup.
  </p>
</div>

<style>
  .groups-page {
    display: grid;
    gap: 20px;
    min-width: 0;
  }
  .groups-page :global(.btn) {
    min-height: 44px;
  }
  .groups-page a {
    color: var(--gold-bright);
    text-underline-offset: 4px;
  }
  .groups-page a.btn {
    text-decoration: none;
  }
  .group-form {
    display: grid;
    grid-template-columns: minmax(180px, 1fr) auto;
    gap: 12px 24px;
    padding: 20px;
  }
  .group-name {
    display: grid;
    gap: 8px;
    align-content: start;
  }
  .group-name input {
    min-height: 44px;
    width: 100%;
    padding: 8px 12px;
    color: var(--text);
    background: var(--panel);
    border: 1px solid var(--line);
    border-radius: 3px;
  }
  .group-form .actions,
  .form-notice {
    grid-column: 1 / -1;
  }
  .form-notice :global(.source-banner) {
    margin-top: 0;
  }
  .group-banner {
    overflow: hidden;
    padding-bottom: 20px;
  }
  .enclave-art {
    display: block;
    position: relative;
    height: 150px;
    overflow: hidden;
  }
  .enclave-art :global(img) {
    position: absolute;
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 180ms ease;
  }
  .enclave-art::after {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(#17242e00 30%, var(--panel));
    pointer-events: none;
  }
  .enclave-art:hover :global(img) {
    transform: scale(1.025);
  }
  .enclave-art span {
    position: absolute;
    top: 10px;
    right: 14px;
    z-index: 1;
    padding: 4px 10px;
    color: #fff;
    background: #071018c8;
    border-radius: 3px;
    font-size: var(--font-caption);
  }
  .banner-body {
    position: relative;
    z-index: 1;
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    align-items: flex-end;
    padding: 0 22px;
    margin-top: -36px;
  }
  .helm {
    display: inline-flex;
    flex: none;
    align-items: center;
    justify-content: center;
    width: 72px;
    height: 72px;
    background: var(--panel);
    border: 1px solid var(--gold);
    border-radius: 3px;
  }
  .banner-title {
    flex: 1 1 260px;
    min-width: 0;
  }
  .eyebrow {
    color: var(--muted);
    font-size: var(--font-caption);
    font-weight: 700;
    letter-spacing: 1.55px;
    text-transform: uppercase;
  }
  .banner-title h2 {
    margin: 0;
    font-family: "Cinzel", serif;
    font-size: 2rem;
    line-height: 1.2;
    color: var(--heading);
    overflow-wrap: anywhere;
  }
  .banner-actions,
  .actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px;
  }
  .totals {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
    margin: 20px 22px 14px;
  }
  .group-source {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 20px;
    padding: 0 22px;
  }
  .roster-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr));
    gap: 18px;
  }
  .member-card {
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 14px;
    min-width: 0;
  }
  .member-card.selected {
    border-color: var(--gold);
  }
  .member-heading {
    display: flex;
    gap: 14px;
    align-items: center;
  }
  .member-heading > div {
    min-width: 0;
  }
  .member-name {
    font-family: "Cinzel", serif;
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--heading);
    overflow-wrap: anywhere;
  }
  .member-chip {
    margin-top: 6px;
  }
  .member-stats {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 6px;
    margin: 0;
  }
  .stat {
    display: flex;
    flex-direction: column;
    padding: 8px 10px;
    border: 1px solid #33434d;
    border-radius: 3px;
    background: var(--well);
  }
  .stat dt {
    color: var(--muted);
    font-size: var(--font-caption);
  }
  .stat dd {
    margin: 0;
    font-family: "Cinzel", serif;
    font-size: 1.125rem;
    color: var(--heading);
  }
  .source-times {
    margin-top: auto;
  }
  .source-times summary {
    cursor: pointer;
    min-height: 32px;
  }
  .source-times p {
    margin: 8px 0;
  }
  .member-actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }
  .source {
    color: var(--muted);
    font-size: var(--font-ui);
    margin: 0;
  }
  .two {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 300px;
    gap: 24px;
    align-items: start;
  }
  .side-panels {
    display: flex;
    flex-direction: column;
    gap: 20px;
    min-width: 0;
  }
  .side-copy {
    margin: 0;
    padding: 12px 16px 14px;
    color: var(--muted);
    font-size: var(--font-ui);
  }
  .side-link {
    display: block;
    padding: 0 16px 16px;
    font-weight: 600;
  }
  .remove-group {
    padding-top: 4px;
  }
  @media (max-width: 980px) {
    .two {
      grid-template-columns: minmax(0, 1fr);
    }
  }
  @media (max-width: 760px) {
    .group-form {
      grid-template-columns: 1fr;
      padding: 16px;
    }
    .banner-body {
      padding: 0 16px;
    }
    .banner-title h2 {
      font-size: 1.5rem;
    }
    .totals {
      grid-template-columns: 1fr 1fr;
      margin: 16px 16px 12px;
    }
    .totals > :global(.game-stat:nth-child(2)) {
      grid-column: 1 / -1;
      order: 3;
    }
    .group-source {
      padding: 0 16px;
    }
    .member-card {
      padding: 12px;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .enclave-art :global(img) {
      transition: none;
    }
  }
</style>
