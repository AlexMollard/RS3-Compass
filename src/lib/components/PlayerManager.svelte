<script lang="ts">
  import { getCompass, getPlayerActions } from "../compassContext";
  import { progressionQuests, SKILLS } from "../../data";
  import { isSnapshotStale } from "../sourceStatus";
  import { relativeTime } from "../relativeTime";
  import PlayerPortrait from "./PlayerPortrait.svelte";
  import StatusChip from "./StatusChip.svelte";
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
  let newName = $state("");
  let removing = $state<string | null>(null);
  let expanded = $state<Record<string, boolean>>({});
  let counts = $derived({
    all: $saved.profiles.length,
    public: $saved.profiles.filter((p) => p.source === "hiscores").length,
    sample: $saved.profiles.filter((p) => p.source !== "hiscores").length,
  });
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
  const scopes = [
    ["all", "All"],
    ["public", "Public"],
    ["sample", "Sample"],
  ] as const;
  const date = (value: number) => new Date(value).toLocaleString();
  const number = (value?: number) => (value == null ? "?" : value.toLocaleString());
  function activities(profile: (typeof players)[number]) {
    const quests = progressionQuests(profile);
    const done = quests.filter((q) => profile.completedQuests.includes(q.id));
    return `${done.length} / ${quests.length}`;
  }
</script>

<div class="player-tools">
  <SearchField
    className="player-search"
    value={search}
    onChange={(value) => (search = value)}
    label="Find a saved player"
    placeholder="Find a player"
  />
  <div class="seg" role="group" aria-label="Show players">
    {#each scopes as [value, label] (value)}<button
        type="button"
        aria-pressed={scope === value}
        onclick={() => (scope = value)}>{label} {counts[value]}</button
      >{/each}
  </div>
  <details class="how-refresh">
    <summary>How refresh works</summary>
    <p class="sync-policy">
      Public snapshots refresh while this view is visible, when their cache
      expires. Jagex and Compass caching can each add delay. Notes, packing and
      planning settings stay on this device; refreshes do not switch your
      character.
    </p>
  </details>
</div>
<div class="player-list">
  {#each players as player (player.id)}
    {@const status = $sync[player.id]}
    {@const busy = status?.state === "queued" || status?.state === "refreshing"}
    {@const isPublic = player.source === "hiscores"}
    {@const selected = player.id === $saved.activeId}
    {@const fetched = player.publicFetchedAt ?? player.hiscoresFetchedAt}
    {@const stale = isSnapshotStale(player, status)}
    <section
      class="player-card game-surface"
      class:selected
      aria-label={player.name}
    >
      <div class="player-heading">
        <PlayerPortrait name={player.name} size={64} />
        <div>
          <h2>{player.name}</h2>
          <p>
            {player.kind} · {isPublic
              ? "public player"
              : "sample, entered by hand"}
          </p>
        </div>
        {#if selected}<StatusChip tone="ok" label="Selected" />{/if}
      </div>
      <div class="stats">
        {#if isPublic}
          <span class="stat"
            ><span>Total level</span><b
              >{number(player.statistics?.overall.level)}</b
            ></span
          >
          <span class="stat"
            ><span>Quest points</span><b
              >{number(player.questProgress?.questPoints)}</b
            ></span
          >
        {:else}
          <span class="stat"
            ><span>Recorded</span><b
              >{Object.keys(player.levels).length} / {SKILLS.length}</b
            ></span
          >
          <span class="stat"
            ><span>Activities</span><b>{activities(player)}</b></span
          >
        {/if}
        <span class="stat"
          ><span>Planning</span><b>{player.mode === "f2p" ? "F2P" : "Members"}</b
          ></span
        >
      </div>
      <div class="chips">
        {#if isPublic}
          {#if fetched != null}
            {#if stale}<StatusChip
                tone="warn"
                label={"Hiscores from " + relativeTime(fetched)}
              />{:else}<StatusChip
                tone="ok"
                label={"Updated " + relativeTime(fetched)}
              />{/if}
          {:else}<StatusChip label="No public snapshot" />{/if}
          {#if player.questImportStatus === "private-or-unavailable"}<StatusChip
              label="Quests private"
            />{/if}
        {:else}<StatusChip label="No public data · sample player" />{/if}
      </div>
      {#if player.hiscoresImportStatus && player.hiscoresImportStatus !== "available"}<p
          class="note"
        >
          {player.hiscoresImportStatus === "unranked-or-unavailable"
            ? "No main Hiscores entry; available quests and activity are kept."
            : "Latest Hiscores refresh unavailable; previous public levels are kept."}
        </p>{/if}
      {#if status}<p
          class="note sync-status"
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
        {#if !selected}<Button
            variant="primary"
            onclick={() => controller.selectProfile(player.id)}
            >Use {player.name}</Button
          >{/if}
        {#if isPublic}<Button
            disabled={busy}
            onclick={() => void controller.refreshPlayers([player.id])}
            >{busy ? "Refreshing…" : "Refresh"}</Button
          >{/if}
        <a
          class="btn btn-quiet"
          href={"/activity?player=" + encodeURIComponent(player.id)}
          >Activity</a
        >
        {#if removing !== player.id}<Button
            variant="quiet"
            className="danger"
            aria-label={"Remove " + player.name + " from this device"}
            onclick={() => (removing = player.id)}>Remove</Button
          >{/if}
      </div>
      {#if removing === player.id}<div class="removal">
          <p role="alert">
            Remove {player.name} and their local notes, packing and plans? This cannot
            be undone. Export anything you want to keep first.
          </p>
          <div class="actions">
            <Button
              className="danger"
              onclick={() => {
                controller.removePlayer(player.id);
                removing = null;
              }}>Remove from this device</Button
            ><Button onclick={() => (removing = null)}>Keep player</Button>
          </div>
        </div>{/if}
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
        <p class="note">
          Planning settings do not verify account type, membership or group
          membership.
        </p>
      </details>
      {#if isPublic}<details
          class="settings snapshot"
          ontoggle={(event) => (expanded[player.id] = event.currentTarget.open)}
        >
          <summary>Public statistics and recent activity</summary>
          <PlayerStatistics profile={player} activities />
          {#if player.questImportStatus && player.questImportStatus !== "available"}<p
              class="note"
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
    </div>{/each}
  <form
    class="add-card"
    aria-labelledby="add-player"
    onsubmit={(event) => {
      event.preventDefault();
      actions.lookup(newName.trim());
      newName = "";
    }}
  >
    <h2 id="add-player">Add a player</h2>
    <p>Look up a public RuneScape name. No login, no API key.</p>
    <label for="add-player-name">RuneScape name</label>
    <div class="add-row">
      <input
        id="add-player-name"
        bind:value={newName}
        autocomplete="off"
        placeholder="e.g. your display name"
      />
      <Button type="submit" variant="primary">Look up</Button>
    </div>
    <p class="note">
      Reads Hiscores, quests and recent activity. Your bank and inventory stay
      private.
    </p>
  </form>
</div>

<style>
  .player-tools {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px;
    margin-bottom: 22px;
  }
  .player-tools :global(.player-search) {
    flex: 1 1 260px;
    max-width: 420px;
  }
  .seg {
    display: inline-flex;
    border: 1px solid var(--edge);
    border-radius: 4px;
    overflow: hidden;
  }
  .seg button {
    min-height: 40px;
    padding: 0 14px;
    border: 0;
    background: transparent;
    color: var(--muted);
    font-size: var(--font-ui);
    font-weight: 600;
    cursor: pointer;
  }
  .seg button[aria-pressed="true"] {
    background: var(--gold);
    color: #1b241e;
  }
  .how-refresh {
    margin-left: auto;
  }
  .how-refresh summary {
    cursor: pointer;
    min-height: 40px;
    display: flex;
    align-items: center;
    color: var(--muted);
    font-size: var(--font-caption);
  }
  .sync-policy {
    max-width: 380px;
    margin: 6px 0 0;
    color: var(--muted);
    font-size: var(--font-caption);
  }
  .player-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 320px), 1fr));
    gap: 18px;
    align-items: stretch;
  }
  .player-card {
    display: flex;
    flex-direction: column;
    min-width: 0;
    padding: 16px;
    gap: 12px;
  }
  .player-card.selected {
    border-color: var(--gold);
    box-shadow:
      0 0 0 1px #c5a46b80,
      inset 0 1px 0 #ffffff0d;
  }
  .player-heading {
    display: flex;
    align-items: center;
    gap: 14px;
  }
  .player-heading > div {
    flex-grow: 1;
    min-width: 0;
  }
  h2 {
    margin: 0;
    font: 600 20px "Cinzel", Georgia, serif;
    color: #f0e6cf;
    overflow-wrap: anywhere;
  }
  .player-heading p {
    margin: 2px 0 0;
    color: var(--muted);
    font-size: var(--font-caption);
  }
  .stats {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 6px;
  }
  .stat {
    display: flex;
    flex-direction: column;
    padding: 8px 10px;
    border: 1px solid #33434d;
    border-radius: 3px;
    background: var(--well);
    min-width: 0;
  }
  .stat span {
    color: var(--muted);
    font-size: var(--font-caption);
  }
  .stat b {
    font: 600 18px "Cinzel", Georgia, serif;
    color: #f0e6cf;
    white-space: nowrap;
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .note {
    margin: 0;
    color: var(--muted);
    font-size: var(--font-caption);
    overflow-wrap: anywhere;
  }
  .note small {
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
    margin-top: auto;
  }
  .actions :global(.btn),
  .add-row :global(.btn) {
    min-height: 40px;
  }
  .actions > :global(.danger:last-child:not(:only-child)) {
    margin-left: auto;
  }
  :global(.btn.danger) {
    color: var(--bad);
  }
  :global(.btn.danger:hover) {
    color: var(--bad);
    border-color: var(--bad);
  }
  .removal {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .removal p {
    margin: 0;
    font-size: var(--font-caption);
  }
  .settings {
    border-top: 1px solid var(--line);
    padding-top: 8px;
  }
  summary {
    cursor: pointer;
    min-height: 36px;
    color: var(--muted);
    font-size: var(--font-caption);
  }
  .add-card {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 18px;
    border: 1px dashed var(--edge);
    border-radius: 3px;
    background: #131f28;
  }
  .add-card h2 {
    font-size: 18px;
    color: #e9e6dc;
  }
  .add-card p {
    margin: 0;
    color: var(--muted);
  }
  .add-card p.note {
    font-size: var(--font-caption);
  }
  .add-card label {
    color: var(--muted);
    font-size: var(--font-caption);
  }
  .add-row {
    display: flex;
    gap: 8px;
  }
  .add-row input {
    flex-grow: 1;
    min-width: 0;
    height: 40px;
    box-sizing: border-box;
    border: 1px solid var(--edge);
    background: #0d161c;
    color: var(--text);
    border-radius: 4px;
    padding: 0 12px;
    font: inherit;
  }
  @media (max-width: 760px) {
    .player-list {
      grid-template-columns: 1fr;
    }
    .stat b {
      font-size: 15px;
    }
    .player-tools :global(.player-search) {
      flex-basis: 100%;
      max-width: none;
    }
    .how-refresh {
      margin-left: 0;
      flex-basis: 100%;
    }
    .actions :global(.btn),
    .seg button,
    .add-row :global(.btn),
    .add-row input {
      min-height: 44px;
      height: auto;
    }
  }
</style>
