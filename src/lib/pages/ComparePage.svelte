<script lang="ts">
  import { onMount, untrack } from "svelte";
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import { accountBadge, type Profile } from "../../data";
  import { getCompass } from "../compassContext";
  import { fetchPlayer } from "../playerClient";
  import {
    questDifference,
    togglePick,
    type ComparedPlayer,
  } from "../groupProgress";
  import { publicProfileId } from "../playerName";
  import { relativeTime } from "../relativeTime";
  import {
    isSnapshotStale,
    isSyncBusy,
    snapshotFetchedAt,
  } from "../sourceStatus";
  import { startVisibleRefresh } from "../visibleRefresh";
  import { wikiHref } from "../../wiki";
  import PageHeading from "../components/PageHeading.svelte";
  import GameArt from "../components/GameArt.svelte";
  import GameWindow from "../components/GameWindow.svelte";
  import HeadToHead from "../components/HeadToHead.svelte";
  import SourceBanner from "../components/SourceBanner.svelte";
  import StatusChip from "../components/StatusChip.svelte";
  import SkillComparison from "../components/SkillComparison.svelte";
  import { playerColour } from "../playerColours";
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
  const param = (key: string) => page.url.searchParams.get(key);
  const pick = (id: string | null, taken: (string | undefined)[] = []) =>
    candidates.find((p) => p.id === id && !taken.includes(p.id));
  // The first two slots always fill when they can; the third is optional (?c=).
  let a = $derived(
    pick(param("a")) ?? candidates.find((p) => p.id !== param("b")),
  );
  let b = $derived(
    pick(param("b"), [a?.id]) ?? candidates.find((p) => p.id !== a?.id),
  );
  let c = $derived(pick(param("c"), [a?.id, b?.id]));
  let compared = $derived([a, b, c].filter((p): p is Profile => !!p));
  let players = $derived<ComparedPlayer[]>(
    compared.map((profile) => ({ member: { name: profile.name }, profile })),
  );
  let quests = $derived(questDifference(compared));
  let questColumns = $derived(
    compared.flatMap((profile, i) => {
      const titles = quests?.[i];
      return titles ? [{ profile, titles }] : [];
    }),
  );
  let withoutQuests = $derived(
    quests ? compared.filter((_, i) => !quests![i]).map((p) => p.name) : [],
  );
  let syncKey = $derived(JSON.stringify(compared.map((p) => p.id)));

  /** Adds or removes a player on the roster; the URL keeps the picked order. */
  function toggle(id: string) {
    const next = togglePick(
      compared.map((p) => p.id),
      id,
    );
    const query = new URLSearchParams({ a: next[0] ?? "", b: next[1] ?? "" });
    if (next[2]) query.set("c", next[2]);
    void goto(`/compare?${query}`, { replace: true, reset: false });
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
      // The newcomer takes the first empty slot, else replaces the third player.
      if (!compared.some((p) => p.id === id)) toggle(id);
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
    if (document.visibilityState !== "hidden" && compared.length)
      void controller.refreshPlayers(
        compared.map((p) => p.id),
        { staleOnly, scope: staleOnly ? "compare-view" : undefined },
      );
  }
  onMount(() => {
    mounted = true;
    const stop = startVisibleRefresh(() => refresh());
    return () => {
      cancelLookup();
      stop();
    };
  });
  $effect(() => {
    syncKey;
    if (mounted) untrack(() => refresh());
    return () => controller.cancelRefreshScope("compare-view");
  });
  /** Each saved public player once, with their compare slot when picked. */
  let roster = $derived(
    candidates.map((p) => ({
      profile: p,
      slot: compared.findIndex((q) => q.id === p.id),
    })),
  );
</script>

<div class="compare-page page-enter">
  <PageHeading
    title="Compare players"
    subtitle="Two or three public players, side by side: levels, gaps and quests."
  />
  {#if candidates.length >= 2}
    <div class="roster" role="group" aria-labelledby="roster-label">
      <span id="roster-label" class="roster-label">Players</span>
      <ul>
        {#each roster as { profile, slot } (profile.id)}
          {@const picked = slot !== -1}
          {@const locked = picked && compared.length <= 2}
          <li>
            <button
              type="button"
              class="roster-chip"
              class:picked
              style:--player={picked ? playerColour(slot) : undefined}
              aria-pressed={picked}
              aria-disabled={locked}
              title={locked
                ? "Two players are always compared; pick another to swap"
                : picked
                  ? "Remove from the comparison"
                  : compared.length >= 3
                    ? "Replace the third player"
                    : "Add to the comparison"}
              onclick={() => toggle(profile.id)}
            >
              <GameArt file={accountBadge(profile.kind)} size={24} />
              <span class="roster-name">{profile.name}</span>
              {#if picked}<span class="slot" aria-label={"slot " + (slot + 1)}
                  >{slot + 1}</span
                >{/if}
            </button>
          </li>
        {/each}
      </ul>
      <span class="roster-hint">Pick two or three</span>
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
    {#snippet freshness(profile: Profile)}
      {@const state = $sync[profile.id]}
      {#if isSyncBusy(state)}<StatusChip
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
          label={"Checked " + relativeTime(snapshotFetchedAt(profile) ?? 0)}
        />{/if}
    {/snippet}
    <HeadToHead profiles={compared} status={freshness} />
    <SkillComparison
      {players}
      id="compare"
      highestLabel={compared.length > 2
        ? "Highest published level"
        : "Higher published level"}
      sourceNote="Each player's last check is shown under their name in Head to head."
    />
    <GameWindow title="Quest differences" icon="Quest.png">
      {#if quests}
        <div class="quest-columns">
          {#each questColumns as column (column.profile.id)}
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
                  {compared.length > 2
                    ? "Nothing the other players haven't also completed."
                    : "Nothing the other player hasn't also completed."}
                </p>{/if}
            </section>
          {/each}
        </div>
        {#if withoutQuests.length}<p class="side-copy">
            {withoutQuests.join(", ")}
            {withoutQuests.length === 1 ? "has" : "have"} no public quest data, so
            {withoutQuests.length === 1 ? "they are" : "they are all"} left out of
            quest differences.
          </p>{/if}
      {:else}
        <p class="side-copy">
          Quest differences need public quest data from at least two players. A
          private Adventurer's Log hides it.
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
  /* One row: every saved player once; picked chips carry their slot colour. */
  .roster {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 10px 16px;
  }
  .roster ul {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .roster-label,
  .roster-hint {
    color: var(--muted);
    font-size: var(--font-caption);
    font-weight: 600;
  }
  .roster-label {
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
  .roster-hint {
    font-weight: 400;
  }
  .roster-chip {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 40px;
    padding: 4px 12px 4px 8px;
    color: var(--muted);
    font: inherit;
    font-size: var(--font-ui);
    background: var(--well);
    border: 1px solid #33434d;
    border-left: 4px solid #33434d;
    border-radius: 4px;
    cursor: pointer;
  }
  .roster-chip:hover {
    color: var(--text);
    border-color: #8fa3b1;
  }
  .roster-chip.picked {
    color: var(--text);
    background: var(--panel-raised);
    border-color: #4b5e6a;
    border-left-color: var(--player);
  }
  .roster-chip[aria-disabled="true"] {
    cursor: default;
  }
  .slot {
    display: grid;
    place-items: center;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    color: var(--text);
    font-size: 0.6875rem;
    font-weight: 700;
    border: 2px solid var(--player);
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
  .caption {
    color: var(--muted);
    font-size: var(--font-caption);
    margin: 0;
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
  @media (max-width: 760px) {
    .lookup-form {
      grid-template-columns: 1fr;
      padding: 16px;
    }
  }
</style>
