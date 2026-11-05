<script lang="ts">
  import { getCompass, getPlayerActions } from "../compassContext";
  import GameArt from "./GameArt.svelte";
  import Button from "./Button.svelte";
  import SearchField from "./SearchField.svelte";
  import ChoiceStrip from "./ChoiceStrip.svelte";
  import PlayerStatistics from "./PlayerStatistics.svelte";
  import RecentActivity from "./RecentActivity.svelte";

  const controller = getCompass();
  const actions = getPlayerActions();
  const saved = controller.state;
  const sync = controller.syncState;
  let search = $state("");
  let scope = $state("all");
  let removing = $state<string | null>(null);
  let expanded = $state<Record<string, boolean>>({});
  let players = $derived(
    $saved.profiles
      .filter(
        (p) =>
          p.name
            .toLocaleLowerCase()
            .includes(search.trim().toLocaleLowerCase()) &&
          (scope === "all" ||
            (scope === "public"
              ? p.source === "hiscores"
              : p.source !== "hiscores")),
      )
      .toSorted(
        (a, b) =>
          Number(b.id === $saved.activeId) - Number(a.id === $saved.activeId) ||
          a.name.localeCompare(b.name),
      ),
  );
  const date = (value: number) => new Date(value).toLocaleString();
</script>

<div class="player-tools">
  <SearchField
    value={search}
    onChange={(value) => (search = value)}
    label="Find a saved player"
    placeholder="Find a player…"
  />
  <ChoiceStrip
    label="Show players"
    name="player-scope"
    value={scope}
    choices={[
      { value: "all", label: "All" },
      { value: "public", label: "Public players" },
      { value: "sample", label: "Sample / manual" },
    ]}
    onChange={(value) => (scope = value)}
  />
</div>
<div class="player-list">
  {#each players as player (player.id)}
    {@const status = $sync[player.id]}
    {@const busy = status?.state === "queued" || status?.state === "refreshing"}
    <section
      class="player-card"
      class:selected={player.id === $saved.activeId}
      aria-label={player.name}
    >
      <div class="player-heading">
        <GameArt
          file={player.kind === "Group Ironman"
            ? "Group_Ironman_badge.png"
            : "Ironman_badge.png"}
          size={36}
        />
        <div>
          <h2>
            <a href="/" onclick={() => controller.selectProfile(player.id)}
              >{player.name}</a
            >
          </h2>
          <p>
            {player.id === $saved.activeId
              ? "Selected character · "
              : ""}{player.source === "hiscores"
              ? "Public player"
              : "Fictional sample / manual"}
          </p>
        </div>
      </div>
      <div class="player-facts">
        <span>{Object.keys(player.levels).length} recorded skills</span>
        {#if player.questProgress}<span
            >{player.questProgress.questPoints} / {player.questProgress
              .maxQuestPoints} quest points</span
          >{/if}
        <span>{player.mode === "f2p" ? "F2P" : "Members"} planning</span>
      </div>
      <p class="source">
        {(player.publicFetchedAt ?? player.hiscoresFetchedAt) != null
          ? "Public lookup · " +
            date((player.publicFetchedAt ?? player.hiscoresFetchedAt)!)
          : "No public snapshot"}
        {#if player.hiscoresImportStatus && player.hiscoresImportStatus !== "available"}<small
            >{player.hiscoresImportStatus === "unranked-or-unavailable"
              ? "No main Hiscores entry; available quests and activity are kept."
              : "Latest Hiscores refresh unavailable; previous public levels are kept."}</small
          >{/if}
      </p>
      {#if status}<p
          class="sync-status"
          class:error={status.state === "error"}
          role="status"
        >
          {status.state === "queued"
            ? "Queued for refresh…"
            : status.state === "refreshing"
              ? "Refreshing public data…"
              : (status.message ?? "Snapshot loaded.")}
          {#if status.nextRefreshAt && !busy}<small
              >Next request after {date(status.nextRefreshAt)}</small
            >{/if}
        </p>{/if}
      <div class="actions">
        <Button
          variant={player.id === $saved.activeId ? "quiet" : "secondary"}
          aria-pressed={player.id === $saved.activeId}
          onclick={() => controller.selectProfile(player.id)}
          >{player.id === $saved.activeId ? "Selected" : "Use player"}</Button
        >
        {#if player.source === "hiscores"}<Button
            disabled={busy}
            onclick={() => void controller.refreshPlayers([player.id])}
            >{busy ? "Refreshing…" : "Refresh"}</Button
          >{/if}
        <a
          class="activity-link"
          href={"/activity?player=" + encodeURIComponent(player.id)}
          >Activity →</a
        >
      </div>
      <details class="settings">
        <summary>Planning settings</summary>
        <ChoiceStrip
          label={"Planning type for " + player.name}
          name={"kind-" + player.id}
          value={player.kind}
          choices={[
            {
              value: "Solo Ironman",
              label: "Solo Ironman",
              image: "Ironman_badge.png",
            },
            {
              value: "Group Ironman",
              label: "Group Ironman",
              image: "Group_Ironman_badge.png",
            },
          ]}
          onChange={(value) =>
            controller.updatePlayer(player.id, {
              kind: value as "Solo Ironman" | "Group Ironman",
              mode: player.mode,
            })}
        />
        <ChoiceStrip
          label={"Access planning for " + player.name}
          name={"mode-" + player.id}
          value={player.mode}
          choices={[
            { value: "f2p", label: "F2P" },
            { value: "members", label: "Members" },
          ]}
          onChange={(value) =>
            controller.updatePlayer(player.id, {
              kind: player.kind,
              mode: value as "f2p" | "members",
            })}
        />
        <p class="source">
          Planning settings do not verify account type, membership or group
          membership.
        </p>
      </details>
      {#if player.source === "hiscores"}<details
          class="snapshot"
          ontoggle={(event) => (expanded[player.id] = event.currentTarget.open)}
        >
          <summary>Public statistics and recent activity</summary>
          <PlayerStatistics profile={player} activities />
          {#if player.questImportStatus && player.questImportStatus !== "available"}<p
              class="source"
            >
              Latest quest data is unavailable. Existing Compass checks and any
              previous snapshot are kept.
            </p>{/if}
          <RecentActivity
            playerName={player.name}
            events={player.eventLog?.events}
            fetchedAt={player.eventLog?.fetchedAt}
            status={player.eventImportStatus}
            active={expanded[player.id] ?? false}
          />
        </details>{/if}
      <div class="removal">
        {#if removing === player.id}<p role="alert">
            Remove {player.name} and their local notes, packing and plans? This cannot
            be undone. Export anything you want to keep first.
          </p>
          <div class="actions">
            <Button
              onclick={() => {
                controller.removePlayer(player.id);
                removing = null;
              }}>Remove from this device</Button
            ><Button onclick={() => (removing = null)}>Keep player</Button>
          </div>
        {:else}<Button
            variant="quiet"
            aria-label={"Remove " + player.name + " from this device"}
            onclick={() => (removing = player.id)}>Remove</Button
          >{/if}
      </div>
    </section>
  {:else}<div class="empty-state">
      <h2>
        {search || scope !== "all" ? "No matching players" : "No saved players"}
      </h2>
      <p>
        {search || scope !== "all"
          ? "Change the search or filter."
          : "Look up a public player to start a separate preparation journal."}
      </p>
      <Button onclick={() => actions.lookup()}>Add a player</Button>
    </div>{/each}
</div>

<style>
  .player-tools {
    display: grid;
    grid-template-columns: minmax(180px, 1fr) auto;
    align-items: center;
    gap: 20px;
    margin-bottom: 20px;
  }
  .player-list {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 360px), 1fr));
    gap: 18px;
    align-items: start;
  }
  .player-card {
    min-width: 0;
    padding: 20px;
    border: 1px solid var(--line);
    background: var(--panel);
    border-radius: 4px;
  }
  .player-card.selected {
    border-color: var(--gold);
  }
  .player-heading {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  h2 {
    margin: 0;
    font-size: 1.2rem;
  }
  h2 a {
    color: var(--text);
    text-decoration: underline;
    text-underline-offset: 4px;
  }
  .player-heading p {
    margin: 4px 0 0;
    color: var(--muted);
    font-size: var(--font-caption);
  }
  .player-facts {
    display: flex;
    flex-wrap: wrap;
    gap: 6px 16px;
    margin: 16px 0 8px;
    font-size: var(--font-caption);
  }
  .source,
  .sync-status {
    color: var(--muted);
    font-size: var(--font-caption);
    overflow-wrap: anywhere;
  }
  .sync-status small,
  .source small {
    display: block;
    margin-top: 4px;
  }
  .sync-status.error {
    color: var(--gold-bright);
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    margin: 14px 0;
  }
  .activity-link {
    margin-left: auto;
    color: var(--gold-bright);
    text-underline-offset: 3px;
  }
  details {
    border-top: 1px solid var(--line);
    padding-top: 12px;
    margin-top: 12px;
  }
  summary {
    cursor: pointer;
    min-height: 36px;
  }
  .removal {
    border-top: 1px solid var(--line);
    margin-top: 12px;
    padding-top: 8px;
  }
  .removal p {
    font-size: var(--font-caption);
  }
  @media (max-width: 700px) {
    .player-tools {
      grid-template-columns: 1fr;
      gap: 12px;
    }
    .player-card {
      padding: 16px;
    }
  }
</style>
