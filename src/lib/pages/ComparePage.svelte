<script lang="ts">
  import { onMount, untrack } from "svelte";
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import { SKILLS, accountBadge, type Profile } from "../../data";
  import { getCompass } from "../compassContext";
  import { fetchPlayer } from "../playerClient";
  import {
    headToHead,
    questDifference,
    type ComparedPlayer,
  } from "../groupProgress";
  import { publicProfileId } from "../playerName";
  import { relativeTime } from "../relativeTime";
  import { isSnapshotStale, snapshotFetchedAt } from "../sourceStatus";
  import { wikiHref } from "../../wiki";
  import PageHeading from "../components/PageHeading.svelte";
  import ChoiceStrip from "../components/ChoiceStrip.svelte";
  import GameWindow from "../components/GameWindow.svelte";
  import GameStat from "../components/GameStat.svelte";
  import PlayerPortrait from "../components/PlayerPortrait.svelte";
  import SourceBanner from "../components/SourceBanner.svelte";
  import StatusChip from "../components/StatusChip.svelte";
  import SkillComparison from "../components/SkillComparison.svelte";
  import SkillGaps from "../components/SkillGaps.svelte";
  import Button from "../components/Button.svelte";

  const QUEST_LIST_LIMIT = 10;
  const controller = getCompass();
  const saved = controller.state;
  const sync = controller.syncState;
  let name = $state("");
  let lookupError = $state("");
  let loading = $state(false);
  let mounted = $state(false);
  let request: AbortController | undefined;

  // Only public players have published levels to compare.
  let candidates = $derived(
    $saved.profiles.filter((p) => p.source === "hiscores"),
  );
  const pick = (id: string | null, other?: string) =>
    candidates.find((p) => p.id === id && p.id !== other);
  let a = $derived(
    pick(page.url.searchParams.get("a")) ??
      candidates.find((p) => p.id !== page.url.searchParams.get("b")),
  );
  let b = $derived(
    pick(page.url.searchParams.get("b"), a?.id) ??
      candidates.find((p) => p.id !== a?.id),
  );
  let pair = $derived(
    [a, b].filter((p): p is Profile => !!p),
  );
  let players = $derived<ComparedPlayer[]>(
    pair.map((profile) => ({ member: { name: profile.name }, profile })),
  );
  let score = $derived(
    headToHead(
      a,
      b,
      SKILLS.map((s) => s.name),
    ),
  );
  let quests = $derived(questDifference(a, b));
  let syncKey = $derived(JSON.stringify(pair.map((p) => p.id)));

  function choose(side: "a" | "b", id: string) {
    const next = { a: a?.id ?? "", b: b?.id ?? "" };
    const other = side === "a" ? "b" : "a";
    if (next[other] === id) next[other] = next[side];
    next[side] = id;
    void goto(
      `/compare?a=${encodeURIComponent(next.a)}&b=${encodeURIComponent(next.b)}`,
      { replace: true, reset: false },
    );
  }
  function cancelLookup() {
    request?.abort();
    request = undefined;
    loading = false;
  }
  async function add(event: SubmitEvent) {
    event.preventDefault();
    cancelLookup();
    const current = new AbortController();
    request = current;
    loading = true;
    lookupError = "";
    try {
      const player = await fetchPlayer(name, current.signal);
      if (current.signal.aborted || request !== current) return;
      const mode =
        $saved.profiles.find((p) => p.id === $saved.activeId)?.mode ?? "f2p";
      controller.addPlayer(player, "Regular account", mode, { select: false });
      const id = publicProfileId(player.name);
      name = "";
      // The newcomer replaces the second player unless it is already the first.
      if (a && a.id !== id) choose("b", id);
      else choose("a", id);
    } catch (error) {
      if (!current.signal.aborted && request === current)
        lookupError =
          error instanceof Error ? error.message : "Player lookup is unavailable.";
    } finally {
      if (request === current) {
        request = undefined;
        loading = false;
      }
    }
  }
  function refresh(staleOnly = true) {
    if (document.visibilityState !== "hidden" && pair.length)
      void controller.refreshPlayers(
        pair.map((p) => p.id),
        { staleOnly, scope: staleOnly ? "compare-view" : undefined },
      );
  }
  onMount(() => {
    mounted = true;
    const timer = window.setInterval(() => refresh(), 60_000);
    const visible = () => refresh();
    document.addEventListener("visibilitychange", visible);
    return () => {
      cancelLookup();
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", visible);
    };
  });
  $effect(() => {
    syncKey;
    if (mounted) untrack(() => refresh());
    return () => controller.cancelRefreshScope("compare-view");
  });
  const number = (value: number | undefined) =>
    value === undefined ? "?" : value.toLocaleString();
  const ahead = (p: Profile) => (p === a ? score.aAhead : score.bAhead);
  // Both strips list everyone; picking the other side's player swaps the two.
  let choices = $derived(
    candidates.map((p) => ({
      value: p.id,
      label: p.name,
      image: accountBadge(p.kind),
    })),
  );
</script>

<div class="compare-page page-enter">
  <PageHeading
    title="Compare players"
    subtitle="Any two public players, side by side: levels, gaps and quests."
  />
  {#if candidates.length >= 2}
    <div class="pickers">
      <ChoiceStrip
        label="First player"
        name="compare-a"
        value={a?.id ?? ""}
        {choices}
        onChange={(id) => choose("a", id)}
      />
      <ChoiceStrip
        label="Second player"
        name="compare-b"
        value={b?.id ?? ""}
        {choices}
        onChange={(id) => choose("b", id)}
      />
    </div>
  {/if}
  {#snippet lookupWindow()}<GameWindow
      title="Add a player to compare"
      icon="Friends_List_icon.png"
    >
    <form class="lookup-form" onsubmit={(event) => void add(event)}>
      <label class="lookup-name"
        >Player name<input
          required
          maxlength="12"
          autocomplete="off"
          bind:value={name}
          disabled={loading}
        /></label
      >
      <div class="actions">
        <Button type="submit" variant="primary" disabled={loading}
          >{loading ? "Looking up…" : "Look up and compare"}</Button
        >{#if loading}<Button onclick={cancelLookup}>Cancel</Button>{/if}
      </div>
      <p class="caption">
        Public Hiscores and Adventurer's Log only. The player is saved on this
        device and appears on Players; who you are planning as doesn't change.
      </p>
      {#if lookupError}<div class="form-notice">
          <SourceBanner
            notice={{
              tone: "failed",
              title: "Player lookup failed",
              message: lookupError,
              retry: false,
            }}
          />
        </div>{/if}
    </form>
  </GameWindow>{/snippet}
  <!-- With a pair on screen, the lookup moves below the results. -->
  {#if !(a && b)}{@render lookupWindow()}{/if}
  {#if a && b}
    <section class="versus" aria-label={a.name + " compared with " + b.name}>
      {#each [a, b] as profile, index (profile.id)}
        {@const state = $sync[profile.id]}
        {#if index === 1}<span class="vs" aria-hidden="true">VS</span>{/if}
        <article class="player-card game-surface">
          <div class="player-heading">
            <PlayerPortrait name={profile.name} size={72} />
            <div>
              <a
                class="player-name"
                href={"/activity?player=" + encodeURIComponent(profile.id)}
                >{profile.name}</a
              >
              <p class="caption">{profile.kind}</p>
              <div class="player-chip">
                {#if state?.state === "queued" || state?.state === "refreshing"}<StatusChip
                    tone="info"
                    label="Loading public data…"
                  />
                {:else if state?.state === "error"}<StatusChip
                    tone="warn"
                    label="Refresh failed"
                  />
                {:else if isSnapshotStale(profile, state)}<StatusChip
                    tone="warn"
                    label="Showing last saved data"
                  />
                {:else if !profile.hiscoresLevels}<StatusChip
                    tone="neutral"
                    label="No published levels"
                  />
                {:else}<StatusChip
                    tone="ok"
                    label={"Checked " +
                      relativeTime(
                        snapshotFetchedAt(profile) ?? 0,
                      )}
                  />{/if}
              </div>
            </div>
          </div>
          <div class="player-stats">
            <GameStat
              label="Total level"
              value={number(profile.statistics?.overall.level)}
            />
            <GameStat
              label="Total XP"
              value={number(profile.statistics?.overall.xp)}
            />
            <GameStat
              label="Quest points"
              value={number(profile.questProgress?.questPoints)}
            />
            <GameStat
              label="Skills ahead"
              value={profile.hiscoresLevels &&
              (index === 0 ? b : a)?.hiscoresLevels
                ? ahead(profile)
                : "?"}
              detail={score.level ? ` · ${score.level} tied` : undefined}
            />
          </div>
        </article>
      {/each}
    </section>
    <div class="two">
      <SkillComparison
        {players}
        id="compare"
        highestLabel="Higher published level"
        sourceNote="Each player's last check is shown on their card."
      />
      <aside class="side-panels">
        <SkillGaps {players} />
      </aside>
    </div>
    <GameWindow title="Quest differences" icon="Quest.png">
      {#if quests}
        <div class="quest-columns">
          {#each [{ profile: a, titles: quests.onlyA }, { profile: b, titles: quests.onlyB }] as column (column.profile.id)}
            <section aria-label={"Quests only " + column.profile.name + " has done"}>
              <h3>
                Only {column.profile.name}
                <span class="caption">{column.titles.length}</span>
              </h3>
              {#if column.titles.length}
                <ul>
                  {#each column.titles.slice(0, QUEST_LIST_LIMIT) as title (title)}
                    <li>
                      <a href={wikiHref(title)} target="_blank" rel="noopener noreferrer"
                        >{title} ↗</a
                      >
                    </li>
                  {/each}
                </ul>
                {#if column.titles.length > QUEST_LIST_LIMIT}<p class="caption">
                    and {column.titles.length - QUEST_LIST_LIMIT} more
                  </p>{/if}
              {:else}<p class="caption">
                  Nothing the other player hasn't also completed.
                </p>{/if}
            </section>
          {/each}
        </div>
      {:else}
        <p class="side-copy">
          Quest differences need public quest data from both players. A private
          Adventurer's Log hides it.
        </p>
      {/if}
    </GameWindow>
    {@render lookupWindow()}
  {:else}
    <p class="empty-state">
      {candidates.length === 1
        ? "Look up one more public player to compare with " +
          candidates[0].name +
          "."
        : "Look up two public players to compare them. Fictional sample players have no published levels, so they can't be compared."}
    </p>
  {/if}
</div>

<style>
  .compare-page {
    display: grid;
    gap: 20px;
    min-width: 0;
  }
  .compare-page :global(.btn) {
    min-height: 44px;
  }
  .pickers {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 320px), 1fr));
    gap: 12px 24px;
  }
  .lookup-form {
    display: grid;
    grid-template-columns: minmax(180px, 360px) auto;
    align-items: end;
    gap: 12px 16px;
    padding: 16px 20px;
  }
  .lookup-name {
    display: grid;
    gap: 8px;
  }
  .lookup-name input {
    min-height: 44px;
    width: 100%;
    padding: 8px 12px;
    color: var(--text);
    background: var(--panel);
    border: 1px solid var(--line);
    border-radius: 3px;
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }
  .lookup-form .caption,
  .form-notice {
    grid-column: 1 / -1;
  }
  .form-notice :global(.source-banner) {
    margin-top: 0;
  }
  .versus {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
    align-items: center;
    gap: 16px;
  }
  .vs {
    font-family: "Cinzel", serif;
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--gold-bright);
  }
  .player-card {
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding: 16px;
    min-width: 0;
    height: 100%;
  }
  .player-heading {
    display: flex;
    gap: 14px;
    align-items: center;
  }
  .player-heading > div {
    min-width: 0;
  }
  .player-name {
    font-family: "Cinzel", serif;
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--heading);
    overflow-wrap: anywhere;
    text-underline-offset: 4px;
  }
  .player-chip {
    margin-top: 6px;
  }
  .player-stats {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
  }
  .caption {
    color: var(--muted);
    font-size: var(--font-caption);
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
  .quest-columns {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr));
    gap: 16px 32px;
    padding: 14px 16px 16px;
  }
  .quest-columns h3 {
    display: flex;
    align-items: baseline;
    gap: 8px;
    margin: 0 0 8px;
    font-family: "Cinzel", serif;
    font-size: 1.05rem;
    color: var(--heading);
  }
  .quest-columns ul {
    list-style: none;
    margin: 0 0 6px;
    padding: 0;
  }
  .quest-columns li a {
    display: inline-flex;
    align-items: center;
    min-height: 32px;
    color: var(--gold-bright);
    text-underline-offset: 4px;
  }
  .side-copy {
    margin: 0;
    padding: 12px 16px 14px;
    color: var(--muted);
    font-size: var(--font-ui);
  }
  .empty-state {
    margin: 0;
    color: var(--muted);
  }
  @media (max-width: 980px) {
    .two {
      grid-template-columns: minmax(0, 1fr);
    }
  }
  @media (max-width: 760px) {
    .lookup-form {
      grid-template-columns: 1fr;
      padding: 16px;
    }
    .versus {
      grid-template-columns: minmax(0, 1fr);
    }
    .vs {
      justify-self: center;
    }
  }
</style>
