<script lang="ts">
  import { onMount, untrack } from "svelte";
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import { SKILLS, accountBadge, type Profile } from "../../data";
  import { getCompass } from "../compassContext";
  import { fetchPlayer } from "../playerClient";
  import {
    leadCounts,
    questDifference,
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
  import ChoiceStrip from "../components/ChoiceStrip.svelte";
  import GameWindow from "../components/GameWindow.svelte";
  import GameStat from "../components/GameStat.svelte";
  import PlayerPortrait from "../components/PlayerPortrait.svelte";
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
  let leads = $derived(
    leadCounts(
      compared,
      SKILLS.map((s) => s.name),
    ),
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

  /** Picking a player already in another slot swaps the two; "" clears the optional third. */
  function choose(slot: number, id: string) {
    const next = [a?.id ?? "", b?.id ?? "", c?.id ?? ""];
    const other = id ? next.indexOf(id) : -1;
    if (other !== -1 && other !== slot) next[other] = next[slot];
    next[slot] = id;
    const query = new URLSearchParams({ a: next[0], b: next[1] });
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
      if (!compared.some((p) => p.id === id)) choose(!a ? 0 : !b ? 1 : 2, id);
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
  const number = (value: number | undefined) =>
    value === undefined ? "?" : value.toLocaleString();
  // The first two strips list everyone; picking a player shown elsewhere swaps them.
  let choices = $derived(
    candidates.map((p) => ({
      value: p.id,
      label: p.name,
      image: accountBadge(p.kind),
    })),
  );
  // The optional third strip offers only players not already compared.
  let thirdChoices = $derived([
    { value: "", label: "No third player" },
    ...choices.filter(
      (choice) => choice.value !== a?.id && choice.value !== b?.id,
    ),
  ]);
  const pickers = $derived([
    { label: "First player", value: a?.id ?? "", choices },
    { label: "Second player", value: b?.id ?? "", choices },
    ...(candidates.length >= 3
      ? [
          {
            label: "Third player (optional)",
            value: c?.id ?? "",
            choices: thirdChoices,
          },
        ]
      : []),
  ]);
</script>

<div class="compare-page page-enter">
  <PageHeading
    title="Compare players"
    subtitle="Two or three public players, side by side: levels, gaps and quests."
  />
  {#if candidates.length >= 2}
    <div class="pickers">
      {#each pickers as picker, slot (picker.label)}
        <ChoiceStrip
          label={picker.label}
          name={"compare-" + slot}
          value={picker.value}
          choices={picker.choices}
          onChange={(id) => choose(slot, id)}
        />
      {/each}
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
    <section
      class="versus"
      class:trio={compared.length > 2}
      aria-label={compared.map((p) => p.name).join(" compared with ")}
    >
      {#each compared as profile, index (profile.id)}
        {@const state = $sync[profile.id]}
        {@const lead = leads[index]}
        {#if index === 1 && compared.length === 2}<span
            class="vs"
            aria-hidden="true">VS</span
          >{/if}
        <article
          class="player-card game-surface"
          style:--player={playerColour(index)}
        >
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
              label="Skills leading"
              value={lead &&
              compared.some((p) => p !== profile && p.hiscoresLevels)
                ? lead.led
                : "?"}
              detail={lead?.shared ? ` · ${lead.shared} tied` : undefined}
            />
          </div>
        </article>
      {/each}
    </section>
    <SkillComparison
      {players}
      id="compare"
      highestLabel={compared.length > 2
        ? "Highest published level"
        : "Higher published level"}
      sourceNote="Each player's last check is shown on their card."
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
  .versus.trio {
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 260px), 1fr));
    align-items: stretch;
  }
  /* Three cards are narrower; a ten-digit Total XP gets its own row. */
  .trio .player-stats > :global(.game-stat:nth-child(2)) {
    grid-column: 1 / -1;
    order: 3;
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
    border-top: 3px solid var(--player);
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
    .versus {
      grid-template-columns: minmax(0, 1fr);
    }
    .vs {
      justify-self: center;
    }
  }
</style>
