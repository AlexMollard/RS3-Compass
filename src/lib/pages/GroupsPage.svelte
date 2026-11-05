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
  import GameText from "../components/GameText.svelte";
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
    <GameWindow title="Find your group">
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
    <div class="saved-group-picker">
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
    </div>
    <GameWindow title={group.name}>
      <div class="group-overview">
        <div class="identity">
          <GameArt file="Group_Ironman_badge.png" size={48} />
          <div>
            <h2>
              {group.isCompetitive ? "Competitive" : "Regular"} · {group.size}-player
              group
            </h2>
            <p>
              {group.founder ? "Founder group · " : ""}<a
                href={sourceUrl(group)}
                target="_blank"
                rel="noopener noreferrer">Official group Hiscores ↗</a
              >
            </p>
          </div>
        </div>
        <dl class="totals">
          <div>
            <dt>Group total level</dt>
            <dd>{number(group.totalLevel)}</dd>
          </div>
          <div>
            <dt>Group XP</dt>
            <dd>{number(group.totalXp)}</dd>
          </div>
          <div>
            <dt>Group rank</dt>
            <dd>{group.rank == null ? "Not reported" : number(group.rank)}</dd>
          </div>
        </dl>
        <p class="source">
          Group-reported snapshot · {date(group.fetchedAt)}. Individual player
          snapshots below can have different refresh times.
        </p>
        <div class="actions">
          <Button
            disabled={refreshing || memberBusy}
            onclick={() => void refresh(false)}
            >{refreshing || memberBusy
              ? "Refreshing…"
              : "Refresh saved data"}</Button
          ><Button
            disabled={memberBusy}
            onclick={() => void controller.importGroupMembers(group!.id)}
            >Load / refresh member players</Button
          ><a href={"/activity?group=" + group.id}>Group activity feeds →</a>
        </div>
        {#if messages[group.id]}<p class="source" role="status">
            {messages[group.id]}
          </p>{/if}
        <div class="table-scroll">
          <table class="roster">
            <caption
              >Public member snapshots · {members.filter((m) => m.profile)
                .length}/{members.length} loaded</caption
            ><thead
              ><tr
                ><th scope="col">Player</th><th scope="col">Total level</th><th
                  scope="col">Quest points</th
                ><th scope="col">Public lookup</th><th scope="col">Character</th
                ></tr
              ></thead
            ><tbody>
              {#each members as member (member.member.name)}
                {@const memberSync =
                  $sync[
                    "rs3:" +
                      normalizePlayerName(member.member.name).toLowerCase()
                  ]}
                <tr>
                  <th scope="row">{member.member.name}</th><td
                    >{member.profile?.statistics?.overall.level ??
                      "Unrecorded"}{#if member.profile?.statistics && (member.profile.hiscoresImportStatus !== "available" || memberSync?.state === "error")}<small
                        title={member.profile.hiscoresFetchedAt != null
                          ? date(member.profile.hiscoresFetchedAt)
                          : undefined}>Last available</small
                      >{/if}</td
                  ><td
                    >{#if member.profile?.questProgress}{member.profile
                        .questProgress.questPoints} / {member.profile
                        .questProgress.maxQuestPoints}
                      {#if member.profile.questImportStatus !== "available" || memberSync?.state === "error"}<small
                          title={"Quest snapshot from " +
                            date(member.profile.questProgress.fetchedAt)}
                          >Last available</small
                        >{/if}
                    {:else}Unavailable{/if}</td
                  >
                  <td
                    >{#if member.profile}{(member.profile.publicFetchedAt ??
                        member.profile.hiscoresFetchedAt) != null
                        ? date(
                            (member.profile.publicFetchedAt ??
                              member.profile.hiscoresFetchedAt)!,
                          )
                        : "Not fetched"}
                    {:else if memberSync?.state === "queued"}Queued
                    {:else if memberSync?.state === "refreshing"}Loading public
                      player…
                    {:else}Not loaded{/if}
                    {#if memberSync?.state === "error"}<small role="status"
                        >{memberSync.message}</small
                      >{/if}</td
                  >
                  <td
                    >{#if member.profile}<Button
                        variant="quiet"
                        onclick={() =>
                          controller.selectProfile(member.profile!.id)}
                        >{member.profile.id === $saved.activeId
                          ? "Selected"
                          : "Use player"}</Button
                      >{:else}<span class="source">Load member players</span
                      >{/if}</td
                  >
                </tr>{/each}
            </tbody>
          </table>
        </div>
      </div>
    </GameWindow>
    <GameWindow title="Skill comparison">
      <div class="comparisons">
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
        <p class="source">
          Published Hiscores levels only; manual Compass edits are excluded.
          Gold marks the highest published level, not item ownership or every
          required unlock. Each character still needs their own use levels and
          quest requirements.
        </p>
        <div class="table-scroll">
          <table class="skills">
            <thead
              ><tr
                ><th scope="col">Skill</th>{#each members as member}<th
                    scope="col"
                    >{member.member.name}<small
                      >{member.profile?.hiscoresLevels
                        ? member.profile.hiscoresImportStatus === "available" &&
                          $sync[member.profile.id]?.state !== "error"
                          ? "Hiscores"
                          : "Last available Hiscores"
                        : "Public levels unrecorded"}</small
                    ></th
                  >{/each}<th scope="col">Highest published</th></tr
              ></thead
            ><tbody>
              {#each skills as skill (skill.name)}{@const summary =
                  groupSkillSummary(members, skill.name)}<tr
                  ><th scope="row"><GameText text={skill.name} /></th
                  >{#each members as member}{@const level =
                      member.profile?.hiscoresLevels?.[skill.name]}<td
                      class:highest={level !== undefined &&
                        level === summary.highest}
                      >{#if level !== undefined}<button
                          class="level-link"
                          aria-label={`${member.member.name}: ${skill.name} ${level}. Open training as this player`}
                          onclick={() => {
                            controller.selectProfile(member.profile!.id);
                            void goto(
                              "/skills/" + encodeURIComponent(skill.name),
                            );
                          }}>{level}</button
                        >{:else}<span aria-label="Unrecorded">—</span>{/if}</td
                    >{/each}<td class="leaders"
                    >{summary.leaders.length
                      ? summary.leaders.join(", ")
                      : "No data"}</td
                  ></tr
                >{/each}
            </tbody>
          </table>
        </div>
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
  .group-form,
  .group-overview,
  .comparisons {
    padding: 20px;
    min-width: 0;
  }
  .group-form {
    display: grid;
    grid-template-columns: minmax(180px, 1fr) auto;
    gap: 12px 24px;
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
    grid-column: 1/-1;
  }
  .actions,
  .identity {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 10px 16px;
  }
  .actions {
    margin: 14px 0;
  }
  .actions a,
  .identity a {
    color: var(--gold-bright);
    text-underline-offset: 3px;
  }
  .identity h2 {
    font-size: 1.1rem;
    margin: 0;
  }
  .identity p {
    margin: 6px 0 0;
  }
  .totals {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 16px;
    padding: 18px 0;
    margin: 16px 0;
    border-block: 1px solid var(--line);
  }
  dt {
    font-size: var(--font-caption);
    color: var(--muted);
  }
  dd {
    margin: 6px 0 0;
    font-size: 1.4rem;
    color: var(--gold-bright);
    font-weight: 600;
    overflow-wrap: anywhere;
  }
  .source {
    color: var(--muted);
    font-size: var(--font-caption);
  }
  .table-scroll {
    overflow-x: auto;
    max-width: 100%;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    text-align: left;
    font-size: var(--font-caption);
  }
  caption {
    text-align: left;
    padding: 12px 0;
    color: var(--muted);
  }
  th,
  td {
    padding: 12px 10px;
    border-bottom: 1px solid var(--line);
    vertical-align: middle;
  }
  thead th {
    color: var(--muted);
    font-weight: 500;
  }
  tbody th {
    font-weight: 500;
  }
  th small {
    display: block;
    font-weight: 400;
    color: var(--muted);
  }
  td small {
    display: block;
    max-width: 24ch;
    margin-top: 4px;
    color: var(--gold-bright);
  }
  .roster {
    min-width: 650px;
  }
  .skills {
    min-width: 570px;
  }
  .skills th:first-child {
    min-width: 140px;
  }
  .highest {
    color: var(--gold-bright);
  }
  .leaders {
    max-width: 20ch;
    color: var(--muted);
  }
  .level-link {
    border: 0;
    background: none;
    color: inherit;
    font: inherit;
    text-decoration: underline;
    text-underline-offset: 3px;
    min-width: 44px;
    min-height: 44px;
    cursor: pointer;
  }
  @media (max-width: 700px) {
    .group-form {
      grid-template-columns: 1fr;
    }
    .group-form,
    .group-overview,
    .comparisons {
      padding: 14px;
    }
    .totals {
      grid-template-columns: 1fr 1fr;
    }
    .totals > div:nth-child(2) {
      grid-column: 1 / -1;
      order: 3;
    }
  }
</style>
