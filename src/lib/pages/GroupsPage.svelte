<script lang="ts">
  import { onMount, untrack } from "svelte";
  import { goto } from "$app/navigation";
  import { SKILLS } from "../../data";
  import { getCompass } from "../compassContext";
  import { fetchGroup } from "../groupClient";
  import type { GroupLookup, GroupSize } from "../groupTypes";
  import { groupPlayers, groupSkillSummary } from "../groupProgress";
  import { normalizePlayerName } from "../playerName";
  import PageHeading from "../components/PageHeading.svelte";
  import ChoiceStrip from "../components/ChoiceStrip.svelte";
  import GameWindow from "../components/GameWindow.svelte";
  import GameArt from "../components/GameArt.svelte";
  import GameStat from "../components/GameStat.svelte";
  import PlayerPortrait from "../components/PlayerPortrait.svelte";
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
  let removing = $state<number | null>(null);
  let comparison = $state("prep");
  let mounted = $state(false);
  let request: AbortController | undefined;
  const attempted = new Map<number, number>();
  const prepSkills = new Set([
    "Mining",
    "Smithing",
    "Crafting",
    "Fletching",
    "Herblore",
    "Cooking",
    "Fishing",
    "Runecrafting",
  ]);
  let groups = $derived($saved.groups ?? []);
  let group = $derived(
    groups.find((g) => String(g.id) === selectedId) ?? groups[0],
  );
  let members = $derived(group ? groupPlayers(group, $saved.profiles) : []);
  let ids = $derived(members.flatMap((m) => (m.profile ? [m.profile.id] : [])));
  let syncKey = $derived(JSON.stringify([group?.id, ids]));
  let memberIds = $derived(
    group?.members.map(
      (m) => "rs3:" + normalizePlayerName(m.name).toLowerCase(),
    ) ?? [],
  );
  let memberBusy = $derived(
    memberIds.some(
      (id) =>
        $sync[id]?.state === "queued" || $sync[id]?.state === "refreshing",
    ),
  );
  let skills = $derived(
    comparison === "all"
      ? SKILLS
      : SKILLS.filter((s) => prepSkills.has(s.name)),
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
      messages[target.id] = "Group snapshot loaded.";
    } catch (error) {
      if (!current.signal.aborted && request === current)
        messages[target.id] =
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
        {#if lookupError}<p role="alert">{lookupError}</p>{/if}
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
      class="group-banner game-surface"
      aria-label={group.name + " overview"}
    >
      <div class="group-summary">
        <div class="identity">
          <GameArt
            file={group.isCompetitive
              ? "Competitive_Group_Ironman_helm.png"
              : "Group_Ironman_helm.png"}
            size={40}
          />
          <div>
            <h2>{group.name}</h2>
            <p>
              {group.isCompetitive ? "Competitive" : "Regular"} · {group.size} players{group.founder
                ? " · Founder group"
                : ""}
            </p>
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
      </div>
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
    </section>
    <div class="group-toolbar">
      <div class="actions">
        <Button
          disabled={refreshing || memberBusy}
          onclick={() => void refresh(false)}
        >
          {refreshing || memberBusy ? "Refreshing…" : "Refresh group & players"}
        </Button>
        {#if members.some((m) => !m.profile)}
          <Button
            disabled={memberBusy}
            onclick={() => void controller.importGroupMembers(group!.id)}
            >Load missing players</Button
          >
        {/if}
      </div>
      <a class="feed-link game-surface" href={"/activity?group=" + group.id}>
        <GameArt file="Group_Ironman_badge.png" size={24} />
        Group activity <span aria-hidden="true">→</span>
      </a>
    </div>
    {#if messages[group.id]}<p class="source" role="status">
        {messages[group.id]}
      </p>{/if}
    <GameWindow
      title="Members"
      icon="Group_Ironman_badge.png"
      trailing={`${members.filter((m) => m.profile).length}/${members.length} loaded`}
    >
      <div
        class="roster-grid"
        style:--roster-columns={Math.min(members.length, 3)}
      >
        {#each members as member (member.member.name)}
          {@const id =
            "rs3:" + normalizePlayerName(member.member.name).toLowerCase()}
          {@const memberSync = $sync[id]}
          {@const profile = member.profile}
          <section
            class="member-card game-surface"
            class:selected={profile?.id === $saved.activeId}
            aria-label={member.member.name}
          >
            <div class="member-heading">
              <PlayerPortrait name={member.member.name} />
              <div>
                <a
                  class="member-name"
                  href={"/activity?player=" + encodeURIComponent(id)}
                  >{member.member.name}</a
                >
                <p class="source">
                  {profile?.id === $saved.activeId
                    ? "Selected character"
                    : "Group member"}
                </p>
              </div>
            </div>
            <div class="member-stats">
              <GameStat
                label="Total level"
                value={profile?.statistics?.overall.level ?? "Unrecorded"}
                detail={profile?.statistics &&
                (profile.hiscoresImportStatus !== "available" ||
                  memberSync?.state === "error")
                  ? "Last available"
                  : undefined}
              />
              <GameStat
                label="Quest points"
                value={profile?.questProgress
                  ? `${profile.questProgress.questPoints} / ${profile.questProgress.maxQuestPoints}`
                  : "Unavailable"}
                detail={profile?.questProgress &&
                (profile.questImportStatus !== "available" ||
                  memberSync?.state === "error")
                  ? "Last available"
                  : undefined}
              />
            </div>
            {#if memberSync?.state === "error"}<p
                class="member-status"
                role="status"
              >
                {memberSync.message}
              </p>
            {:else if memberSync?.state === "queued" || memberSync?.state === "refreshing"}<p
                class="source"
                role="status"
              >
                {memberSync.state === "queued"
                  ? "Queued for refresh"
                  : "Loading public data…"}
              </p>
            {:else if !profile}<p class="source">
                Player not loaded. Use Load missing players above.
              </p>{/if}
            {#if profile}
              <details class="source source-times">
                <summary
                  >Public lookup · {(profile.publicFetchedAt ??
                    profile.hiscoresFetchedAt) != null
                    ? date(
                        (profile.publicFetchedAt ?? profile.hiscoresFetchedAt)!,
                      )
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
                  disabled={profile.id === $saved.activeId}
                  onclick={() => controller.selectProfile(profile.id)}
                  >{profile.id === $saved.activeId
                    ? "Selected"
                    : "Use player"}</Button
                >
                <a href={"/activity?player=" + encodeURIComponent(id)}
                  >Activity →</a
                >
              </div>
            {/if}
          </section>
        {/each}
      </div>
    </GameWindow>
    <GameWindow title="Skill comparison" icon="Mining.png">
      <div class="comparisons">
        <div class="comparison-toolbar">
          <ChoiceStrip
            label="Compare skills"
            name="group-skills"
            value={comparison}
            choices={[
              { value: "prep", label: "Gathering and crafting" },
              { value: "all", label: "All 29 skills" },
            ]}
            onChange={(value) => (comparison = value)}
          />
          <p class="comparison-key">
            <span aria-hidden="true"></span> Highest published level
          </p>
        </div>
        <div class="skill-comparisons">
          {#each skills as skill (skill.name)}
            {@const summary = groupSkillSummary(members, skill.name)}
            <section
              class="comparison-card game-surface"
              aria-label={skill.name + " comparison"}
            >
              <a
                class="skill-title"
                href={wikiHref(skill.wiki)}
                target="_blank"
                rel="noopener noreferrer"
              >
                <GameArt file={skill.icon} size={28} />
                <span>{skill.name}</span><span
                  class="wiki-arrow"
                  aria-hidden="true">↗</span
                >
              </a>
              <div class="member-levels">
                {#each members as member}
                  {@const level = member.profile?.hiscoresLevels?.[skill.name]}
                  {@const highest =
                    level !== undefined && level === summary.highest}
                  {#if level !== undefined}
                    <button
                      class="level-link"
                      class:highest
                      aria-label={`${member.member.name}: ${skill.name} ${level}. ${highest ? "Highest published in the group. " : ""}Open training as this player`}
                      onclick={() => {
                        controller.selectProfile(member.profile!.id);
                        void goto("/skills/" + encodeURIComponent(skill.name));
                      }}
                    >
                      <span>{member.member.name}</span><strong>{level}</strong>
                    </button>
                  {:else}
                    <div
                      class="unknown-level"
                      aria-label={member.member.name +
                        ": " +
                        skill.name +
                        " unrecorded"}
                    >
                      <span>{member.member.name}</span><strong>—</strong>
                    </div>
                  {/if}
                {/each}
              </div>
            </section>
          {/each}
        </div>
        <details class="comparison-help source">
          <summary>About these levels</summary>
          <p>
            Published Hiscores levels only; manual Compass edits are excluded.
            Gold marks the highest published level, not item ownership or every
            required unlock. Each character still needs their own use levels and
            quest requirements. Individual source times are shown under each
            member.
          </p>
        </details>
      </div>
    </GameWindow>
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
  .group-form > p {
    grid-column: 1 / -1;
  }
  .group-banner {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(240px, 30%);
    overflow: hidden;
  }
  .group-summary {
    padding: 24px;
    min-width: 0;
  }
  .identity {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  .identity h2 {
    font-family: "Cinzel", serif;
    font-size: 1.35rem;
    color: var(--gold-bright);
    margin: 0;
    overflow-wrap: anywhere;
  }
  .identity p {
    margin: 4px 0 0;
    color: var(--muted);
  }
  .totals {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
    margin: 20px 0 14px;
  }
  .group-source {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 20px;
  }
  .groups-page a {
    color: var(--gold-bright);
    text-underline-offset: 4px;
  }
  .enclave-art {
    display: block;
    position: relative;
    min-height: 220px;
    overflow: hidden;
    border-left: 1px solid var(--line);
  }
  .enclave-art :global(img) {
    position: absolute;
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 180ms ease;
  }
  .enclave-art:hover :global(img) {
    transform: scale(1.025);
  }
  .enclave-art span {
    position: absolute;
    bottom: 0;
    inset-inline: 0;
    padding: 28px 16px 12px;
    color: #fff;
    background: linear-gradient(transparent, #071018e8);
    text-decoration: underline;
    text-underline-offset: 4px;
  }
  .group-toolbar,
  .actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px;
  }
  .group-toolbar {
    justify-content: space-between;
    gap: 12px;
  }
  .feed-link {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 10px 16px;
    min-height: 44px;
    text-decoration: none;
  }
  .feed-link:hover {
    border-color: var(--gold);
  }
  .feed-link span {
    margin-left: 24px;
  }
  .roster-grid {
    display: grid;
    grid-template-columns: repeat(var(--roster-columns), minmax(0, 1fr));
    gap: 12px;
    padding: 16px;
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
    gap: 12px;
    align-items: center;
  }
  .member-heading > div {
    min-width: 0;
  }
  .member-name {
    font-size: 1rem;
    font-weight: 600;
    overflow-wrap: anywhere;
  }
  .member-heading p {
    margin: 2px 0 0;
  }
  .member-stats {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
  }
  .source-times {
    margin-top: auto;
  }
  .source-times summary,
  .comparison-help summary {
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
  .member-status {
    margin: 0;
    color: var(--gold-bright);
  }
  .source {
    color: var(--muted);
    font-size: var(--font-ui);
    margin: 0;
  }
  .comparisons {
    padding: 16px;
  }
  .comparison-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: end;
    flex-wrap: wrap;
    gap: 16px;
    margin-bottom: 16px;
  }
  .comparison-key {
    color: var(--muted);
    display: flex;
    gap: 8px;
    align-items: center;
    margin: 0 0 10px;
  }
  .comparison-key span {
    display: block;
    width: 10px;
    height: 10px;
    background: var(--gold);
    border: 1px solid var(--gold-bright);
  }
  .skill-comparisons {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 270px), 1fr));
    gap: 12px;
  }
  .comparison-card {
    padding: 14px;
    min-width: 0;
  }
  .skill-title {
    display: flex;
    align-items: center;
    gap: 10px;
    width: fit-content;
    font-size: 0.9375rem;
    font-weight: 600;
    margin-bottom: 12px;
  }
  .wiki-arrow {
    font-weight: 400;
    color: var(--muted);
  }
  .member-levels {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 110px), 1fr));
    gap: 8px;
  }
  .level-link,
  .unknown-level {
    min-height: 56px;
    min-width: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 8px 10px;
    color: var(--text);
    background: #0c172060;
    border: 1px solid var(--line);
    text-align: left;
  }
  .level-link span,
  .unknown-level span {
    overflow-wrap: anywhere;
    font-size: var(--font-ui);
  }
  .level-link strong,
  .unknown-level strong {
    font-size: 1.125rem;
    font-weight: 500;
  }
  .level-link:hover {
    background: var(--panel-raised);
    border-color: var(--gold);
  }
  .level-link.highest {
    color: var(--gold-bright);
    border-top-color: var(--gold);
    background: linear-gradient(135deg, #c5a46b12, #0c172060);
  }
  .unknown-level {
    color: var(--muted);
  }
  .comparison-help {
    margin-top: 18px;
  }
  .comparison-help p {
    max-width: 90ch;
    margin: 8px 0 0;
  }
  .remove-group {
    padding-top: 4px;
  }
  @media (max-width: 1100px) {
    .roster-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  @media (max-width: 950px) {
    .group-banner {
      grid-template-columns: minmax(0, 1fr);
    }
    .enclave-art {
      min-height: 160px;
      border-left: 0;
      border-top: 1px solid var(--line);
    }
    .enclave-art :global(img) {
      object-position: center 42%;
    }
  }
  @media (max-width: 600px) {
    .roster-grid {
      grid-template-columns: minmax(0, 1fr);
    }
    .group-form {
      grid-template-columns: 1fr;
      padding: 16px;
    }
    .group-summary {
      padding: 16px;
    }
    .totals {
      grid-template-columns: 1fr 1fr;
    }
    .totals > :global(.game-stat:nth-child(2)) {
      grid-column: 1 / -1;
      order: 3;
    }
    .roster-grid,
    .comparisons {
      padding: 12px;
    }
    .member-card {
      padding: 12px;
    }
    .feed-link {
      width: 100%;
      justify-content: flex-start;
    }
    .feed-link span {
      margin-left: auto;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .enclave-art :global(img) {
      transition: none;
    }
  }
</style>
