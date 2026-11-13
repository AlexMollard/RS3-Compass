<script lang="ts">
  import { onMount, untrack } from "svelte";
  import type { Snippet } from "svelte";
  import { page } from "$app/state";
  import { goto } from "$app/navigation";
  import {
    ArrowDownToLine,
    ArrowUpRight,
    Check,
    ChevronsUpDown,
    CircleHelp,
    Compass,
    ExternalLink,
    Info,
    RefreshCw,
    Search,
    TriangleAlert,
    X,
  } from "@lucide/svelte";
  import {
    QUESTS,
    SAMPLE_PROFILES,
    accountBadge,
    SKILLS,
    progressionQuests,
    type Profile,
  } from "../data";
  import { wikiHref } from "../wiki";
  import { getCompass, setPlayerActions } from "./compassContext";
  import { fetchPlayer } from "./playerClient";
  import { publicProfileId } from "./playerName";
  import { readRememberedPlayer } from "./rememberedPlayer";
  import {
    NAV_GROUPS,
    PHONE_TABS,
    questPath,
    routeFor,
    skillPath,
    type RouteId,
  } from "./navigation";
  import GameArt from "./components/GameArt.svelte";
  import PlayerPortrait from "./components/PlayerPortrait.svelte";
  import SearchField from "./components/SearchField.svelte";
  import Button from "./components/Button.svelte";
  import SourceBanner from "./components/SourceBanner.svelte";
  import FirstVisit from "./components/FirstVisit.svelte";
  import QuestBar from "./components/QuestBar.svelte";
  import BossBar from "./components/BossBar.svelte";
  import { profileSourceNotice } from "./sourceStatus";
  import { startVisibleRefresh } from "./visibleRefresh";
  import IconButton from "./components/IconButton.svelte";
  import "./shell.css";

  let { children }: { children: Snippet } = $props();
  const controller = getCompass();
  const saved = controller.state,
    storageError = controller.storageError,
    ready = controller.ready,
    compact = controller.compact,
    notice = controller.notice,
    sync = controller.syncState;
  const TITLES: Record<RouteId, string> = {
    home: "Your route",
    quests: "Quests",
    skills: "Skills",
    bossing: "Bossing",
    players: "Players",
    groups: "Group Ironman",
    compare: "Compare players",
    activity: "Activity",
    levels: "Update levels",
  };
  let profile = $derived($saved.profiles.find((p) => p.id === $saved.activeId));
  let route = $derived(routeFor(page.url.pathname));
  let peopleRoute = $derived(["players", "groups", "activity"].includes(route));  let showFirstVisit = $derived(
    $ready &&
      !page.error &&
      (($saved.welcomed === false && !$storageError) ||
        (!profile && !peopleRoute)),
  );
  // The quest bar belongs to a single quest; the quests home keeps the plain search.
  let questBar = $derived(
    route === "quests" && !!page.params.id && !page.error && !showFirstVisit && !!profile,
  );
  let bossBar = $derived(
    route === "bossing" && !!page.params.id && !page.error && !showFirstVisit && !!profile,
  );
  let samples = $derived(
    $saved.profiles.filter((p) => SAMPLE_PROFILES.some((s) => s.id === p.id)),
  );
  let questCount = $derived.by(() => {
    if (!profile) return "";
    const quests = progressionQuests(profile);
    const done = quests.filter((q) =>
      profile!.completedQuests.includes(q.id),
    ).length;
    return `${done} / ${quests.length}`;
  });
  let search = $state(""),
    lookupName = $state(""),
    lookupError = $state(""),
    lookupLoading = $state(false),
    shortcut = $state("Ctrl K");
  let query = $derived(search.toLowerCase());
  let questMatches = $derived(
    QUESTS.filter((q) => q.name.toLowerCase().includes(query)),
  );
  let skillMatches = $derived(
    SKILLS.filter((s) => s.name.toLowerCase().includes(query)),
  );
  let lookupKind = $state<Profile["kind"]>("Regular account");
  let lookupMode = $state<Profile["mode"]>("f2p");
  let searchDialog: HTMLDialogElement,
    aboutDialog: HTMLDialogElement,
    lookupDialog: HTMLDialogElement;
  let request: AbortController | undefined;
  let rememberedStarted = false;
  let main: HTMLElement, topbar: HTMLElement;
  setPlayerActions({ lookup: (name) => openLookup(name ?? "") });
  let selectedView = $derived(
    !page.error && ["home", "quests", "skills"].includes(route),
  );
  let sourceNotice = $derived(
    $ready && selectedView && !showFirstVisit && profile
      ? profileSourceNotice(
          profile,
          $sync[profile.id],
          route as "home" | "quests" | "skills",
        )
      : null,
  );
  let syncSelection = $derived(
    $ready && selectedView && profile?.source === "hiscores" ? profile.id : "",
  );
  $effect(() => {
    const id = syncSelection;
    if (
      id &&
      typeof document !== "undefined" &&
      document.visibilityState !== "hidden"
    )
      untrack(
        () =>
          void controller.refreshPlayers([id], {
            staleOnly: true,
            scope: "shell",
          }),
      );
    return () => controller.cancelRefreshScope("shell");
  });
  function abortLookup() {
    request?.abort();
    request = undefined;
    lookupLoading = false;
  }
  function openLookup(
    name = profile?.source === "hiscores"
      ? profile.name
      : readRememberedPlayer(),
  ) {
    abortLookup();
    lookupName = name;
    lookupKind =
      profile?.kind === "Group Ironman" ? "Group Ironman" : "Regular account";
    lookupMode = profile?.mode ?? "f2p";
    lookupError = "";
    if (!lookupDialog.open) lookupDialog.showModal();
  }
  function closeLookup() {
    abortLookup();
    lookupDialog.close();
  }
  function openSearch() {
    if (!searchDialog.open) searchDialog.showModal();
    searchDialog.querySelector<HTMLInputElement>("input")?.focus();
  }
  async function lookup(name: string) {
    abortLookup();
    const current = new AbortController();
    request = current;
    lookupLoading = true;
    lookupError = "";
    const kind = lookupKind,
      mode = lookupMode;
    try {
      const player = await fetchPlayer(name, current.signal);
      if (current.signal.aborted || request !== current) return;
      controller.addPlayer(player, kind, mode);
      request = undefined;
      lookupLoading = false;
      lookupDialog.close();
      controller.notify(
        "Public player snapshot loaded. Existing checks are kept.",
      );
    } catch (error) {
      if (current.signal.aborted || request !== current) return;
      request = undefined;
      lookupLoading = false;
      lookupError =
        error instanceof Error
          ? error.message
          : "Player lookup is unavailable. Try again later.";
    }
  }
  function navigate(href: string) {
    compact.set(false);
    void goto(href);
  }
  function firstVisitLookup(name: string, mode: Profile["mode"]) {
    openLookup(name);
    lookupKind = "Regular account";
    lookupMode = mode;
    void lookup(name);
  }
  onMount(() => {
    shortcut = /Mac|iPhone|iPad/.test(navigator.platform) ? "⌘ K" : "Ctrl K";
    const unready = ready.subscribe((isReady) => {
      if (!isReady || rememberedStarted) return;
      rememberedStarted = true;
      const name = readRememberedPlayer();
      if (!name) return;
      let id: string;
      try {
        id = publicProfileId(name);
      } catch {
        return;
      }
      const existing = $saved.profiles.find(
        (p) => p.id === id && p.source === "hiscores",
      );
      if (existing) controller.selectProfile(existing.id);
      if (!existing) {
        openLookup(name);
        void lookup(name);
      }
    });
    const refreshSelected = () => {
      if (
        $ready &&
        selectedView &&
        document.visibilityState !== "hidden" &&
        profile?.source === "hiscores"
      )
        void controller.refreshPlayers([profile.id], {
          staleOnly: true,
          scope: "shell",
        });
    };
    const stopRefresh = startVisibleRefresh(refreshSelected);
    const keydown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (!document.querySelector("dialog[open]") || searchDialog.open)
          openSearch();
      }
    };
    window.addEventListener("keydown", keydown);
    const headerSize = new ResizeObserver(() => {
      document.documentElement.style.setProperty(
        "--topbar-height",
        topbar.getBoundingClientRect().height + "px",
      );
    });
    headerSize.observe(topbar);
    return () => {
      unready();
      abortLookup();
      window.removeEventListener("keydown", keydown);
      headerSize.disconnect();
      stopRefresh();
      document.documentElement.style.removeProperty("--topbar-height");
    };
  });
</script>

{#snippet portrait(p: Profile, size: number)}
  {#if p.source === "hiscores"}<PlayerPortrait
      name={p.name}
      {size}
    />{:else}<span
      class="player-badge"
      style:width={size + "px"}
      style:height={size + "px"}
      ><GameArt
        file={accountBadge(p.kind)}
        size={size - 12}
      /></span
    >{/if}
{/snippet}

{#snippet highlighted(text: string)}
  {@const at = query ? text.toLowerCase().indexOf(query) : -1}
  {#if at < 0}{text}{:else}{text.slice(0, at)}<mark
      >{text.slice(at, at + query.length)}</mark
    >{text.slice(at + query.length)}{/if}
{/snippet}

<div
  class:is-compact={$compact && !!profile && route === "skills"}
  class="app-shell"
>
  <a
    href="#main-content"
    class="skip-link"
    onclick={(event) => {
      event.preventDefault();
      main.focus();
    }}>Skip to content</a
  >
  <aside class="sidebar">
    <a class="brand" href="/" aria-label="RS3 Compass home"
      ><span class="brand-mark"><Compass size={26} strokeWidth={1.5} /></span
      ><span><strong>RS3 COMPASS</strong><small>QUEST PLANNER</small></span
      ></a
    >
    {#if showFirstVisit}{:else if profile}
      <div class="rail-player tool-window">
        <div class="rail-player-row">
          {@render portrait(profile, 44)}<span class="rail-player-text"
            ><strong>{profile.name}</strong><small
              >{profile.kind} · {profile.source === "hiscores"
                ? "Public data"
                : "Sample"}</small
            ></span
          ><a
            class="rail-switch"
            href="/players"
            aria-label="Switch player"
            title="Switch player"><ChevronsUpDown size={18} /></a
          >
        </div>
        <div
          class="access-segments"
          role="group"
          aria-label="Planning view"
        >
          <button
            aria-pressed={profile.mode === "f2p"}
            onclick={() =>
              controller.updateProfile((p) => ({ ...p, mode: "f2p" }))}
            >F2P</button
          ><button
            aria-pressed={profile.mode === "members"}
            onclick={() =>
              controller.updateProfile((p) => ({ ...p, mode: "members" }))}
            >Members</button
          >
        </div>
        <a
          class="btn btn-secondary update-levels"
          href="/levels"
          aria-current={route === "levels" ? "page" : undefined}
          onclick={() => compact.set(false)}
          ><RefreshCw size={15} />Update levels</a
        >
      </div>
    {:else if $ready}
      <Button className="rail-lookup" onclick={() => openLookup("")}
        >Look up a player</Button
      >
    {/if}
    <nav class="rail-nav" aria-label="Main navigation">
      {#each NAV_GROUPS as group}
        <span class="rail-eyebrow">{group.label}</span>
        {#each group.items as item}
          <a
            class="nav-item"
            href={item.href}
            aria-current={!page.error && !showFirstVisit && route === item.id
              ? "page"
              : undefined}
            onclick={() => compact.set(false)}
            ><GameArt file={item.image} size={22} /><span>{item.label}</span
            >{#if item.id === "quests" && questCount && !showFirstVisit}<span class="nav-count"
                >{questCount}</span
              >{:else if item.id === "players" && $ready}<span
                class="nav-count">{$saved.profiles.length}</span
              >{/if}</a
          >
        {/each}
      {/each}
    </nav>
    <div class="sidebar-bottom">
      <span class="save-status" class:warning={$storageError}
        >{#if $storageError}<TriangleAlert size={16} />{:else}<Check
            size={16}
          />{/if}{$storageError
          ? "Not saved · export your preview"
          : $ready
            ? "Saved on this device"
            : "Loading local progress"}</span
      >
      <button class="rail-link" onclick={controller.exportProgress}
        >Export progress</button
      >
      <button class="rail-link" onclick={() => aboutDialog.showModal()}
        ><CircleHelp size={14} /> About Compass</button
      >
    </div>
  </aside>
  <div class="workspace">
    <header class="topbar" bind:this={topbar}>
      <a class="topbar-mark" href="/" aria-label="RS3 Compass home"
        ><span class="brand-mark"><Compass size={20} strokeWidth={1.5} /></span
        ></a
      >
      <span class="topbar-title"
        >{page.error
          ? page.status === 404
            ? "Page not found"
            : "Something went wrong"
          : showFirstVisit
            ? "Welcome"
            : TITLES[route]}</span
      >
      {#if questBar && profile}<div class="topbar-quest">
          <QuestBar {profile} selectedId={page.params.id ?? ""} />
        </div>{:else if bossBar && profile}<div class="topbar-quest">
          <BossBar {profile} selectedId={page.params.id ?? ""} />
        </div>{/if}
      <button
        class="search-trigger"
        class:has-quest-bar={questBar || bossBar}
        aria-label="Search quests and skills"
        title="Search quests and skills"
        onclick={openSearch}
        ><Search size={17} /><span>Search quests and skills</span><kbd
          >{shortcut}</kbd
        ></button
      >
      {#if profile && !showFirstVisit}
        <div class="player-chip">
          <a
            class="player-chip-link"
            href="/players"
            aria-label={`${profile.name}. Switch player`}
            >{@render portrait(profile, 28)}<span class="player-chip-name"
              >{profile.name}</span
            ></a
          ><button
            class="player-chip-mode"
            role="switch"
            aria-checked={profile.mode === "members"}
            aria-label="Members planning view"
            onclick={() =>
              controller.updateProfile((p) => ({
                ...p,
                mode: p.mode === "f2p" ? "members" : "f2p",
              }))}>{profile.mode === "f2p" ? "F2P" : "Members"}</button
          >
        </div>
      {/if}
    </header>
    <main id="main-content" class="main-content" bind:this={main} tabindex="-1">
      {#if $storageError}<div class="notice storage-alert" role="alert">
          <div>
            <strong>Your latest changes are not saved.</strong>
            <p>Export your progress before closing this tab.</p>
          </div>
          <Button onclick={controller.exportProgress}
            ><ArrowDownToLine size={16} /> Export progress</Button
          >
        </div>{/if}
      {#if sourceNotice}<SourceBanner
          notice={sourceNotice}
          onRetry={() => {
            if (profile) void controller.refreshPlayers([profile.id]);
          }}
        />{/if}
      {#if showFirstVisit}
        <FirstVisit
          {samples}
          canEnterByHand={!!profile}
          onLookup={firstVisitLookup}
          onSample={(id) => {
            controller.selectProfile(id);
            navigate("/");
          }}
          onManual={() => controller.welcome()}
        />
      {:else if $ready && (profile || peopleRoute || page.error)}
        {@render children()}
      {/if}
      <footer class="workspace-footer">
        <span><span class="status-dot"></span> Local progress</span><span
          >Unofficial RuneScape fan project · Artwork © Jagex</span
        ><button onclick={() => aboutDialog.showModal()}
          >About <ArrowUpRight size={12} /></button
        >
      </footer>
    </main>
    <nav class="phone-tabs" aria-label="Sections">
      {#each PHONE_TABS as tab}
        <a
          href={tab.href}
          aria-current={!page.error &&
          !showFirstVisit &&
          tab.matches.includes(route)
            ? "page"
            : undefined}
          onclick={() => compact.set(false)}
          ><GameArt file={tab.image} size={22} />{tab.label}</a
        >
      {/each}
    </nav>
  </div>
  {#if $notice}<div class="toast" role="status">
      <Info size={17} />{$notice}
    </div>{/if}
  <dialog
    class="app-dialog search-dialog"
    bind:this={searchDialog}
    aria-labelledby="search-title"
  >
    <h2 id="search-title" class="sr-only">Search quests and skills</h2>
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      class="search-dialog-bar"
      onkeydown={(event) => {
        if (
          event.key !== "Enter" ||
          event.isComposing ||
          !(event.target instanceof HTMLInputElement)
        )
          return;
        const href = questMatches[0]
          ? questPath(questMatches[0].id)
          : skillMatches[0]
            ? skillPath(skillMatches[0].name)
            : null;
        if (!href) return;
        event.preventDefault();
        searchDialog.close();
        navigate(href);
      }}
    >
      <SearchField
        className="search-dialog-field"
        label="Search quests and skills"
        placeholder="Search quests and skills…"
        value={search}
        onChange={(value) => (search = value)}
      /><kbd class="search-esc">Esc</kbd><IconButton
        framed={false}
        className="search-close"
        label="Close search"
        onclick={() => searchDialog.close()}><X size={20} /></IconButton
      >
    </div>
    <div class="search-results">
      {#if questMatches.length}<span class="rail-eyebrow">Quests</span>{/if}
      {#each questMatches as q (q.id)}
        <div class="search-row">
          <button
            class="search-result"
            aria-label={"Open preparation for " + q.name}
            onclick={() => {
              searchDialog.close();
              navigate("/quests/" + encodeURIComponent(q.id));
            }}
            ><GameArt file={q.icon} size={32} /><span
              ><strong>{@render highlighted(q.name)}</strong><small
                >{q.members ? "Members" : "Free-to-play"}
                {q.kind ?? "quest"} · {q.difficulty}</small
              ></span
            ></button
          ><a
            class="search-wiki"
            href={wikiHref(q.wiki)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={q.name + " on RuneScape Wiki"}
            title={q.name + " on RuneScape Wiki (opens a new tab)"}
            ><ExternalLink size={16} /></a
          >
        </div>
      {/each}
      {#if skillMatches.length}<span class="rail-eyebrow">Skills</span>{/if}
      {#each skillMatches as s (s.name)}
        <div class="search-row">
          <button
            class="search-result"
            aria-label={"Open training for " + s.name}
            onclick={() => {
              searchDialog.close();
              navigate("/skills/" + encodeURIComponent(s.name));
            }}
            ><GameArt file={s.icon} size={32} /><span
              ><strong>{@render highlighted(s.name)}</strong><small
                >{s.category} · {profile?.levels[s.name] != null
                  ? "level " + profile.levels[s.name]
                  : "not recorded"}</small
              ></span
            ></button
          ><a
            class="search-wiki"
            href={wikiHref(s.wiki)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={s.name + " on RuneScape Wiki"}
            title={s.name + " on RuneScape Wiki (opens a new tab)"}
            ><ExternalLink size={16} /></a
          >
        </div>
      {/each}
      {#if !questMatches.length && !skillMatches.length}<p
          class="search-empty"
        >
          No guides match that search.
        </p>{/if}
    </div>
    <div class="search-foot">
      <span><kbd>Enter</kbd> open in Compass</span><span
        ><kbd>Esc</kbd> close</span
      ><span class="search-count"
        >{questMatches.length + skillMatches.length} results</span
      >
    </div>
  </dialog>
  <dialog
    class="app-dialog about-dialog"
    bind:this={aboutDialog}
    aria-labelledby="about-title"
  >
    <div class="dialog-heading">
      <div>
        <span class="eyebrow">RS3 COMPASS</span>
        <h2 id="about-title">About Compass</h2>
      </div>
      <IconButton
        framed={false}
        label="Close prototype notes"
        onclick={() => aboutDialog.close()}><X size={20} /></IconButton
      >
    </div>
    <p>
      Plan preparation for all current free-to-play quests, miniquests and
      sagas, plus training for all 29 skills. Seasonal content and the tutorial
      are labelled. Members coverage is still selective. Use the Wiki or in-game
      quest helper for walkthroughs.
    </p>
    <h3>Your data</h3>
    <p>
      Hiscores supplies public levels and statistics. Jagex's Adventurer's Log
      supplies available quest status and recent events; unavailable data never
      clears existing checks. Regular and Ironman accounts are detected from the
      Ironman Hiscores on each refresh; membership and Group Ironman are
      planning choices. Sample profiles are fictional.
    </p>
    <p>
      Progress stays in this browser. A functional cookie remembers the selected
      player name for later visits; no Jagex login is used. Saved-player
      management can switch, refresh or remove local profiles.
    </p>
    <Button onclick={controller.exportProgress}
      ><ArrowDownToLine size={16} /> Export progress</Button
    >
    <h3>Artwork and scope</h3>
    <p>
      RuneScape artwork belongs to Jagex and loads from RuneScape Wiki. No
      artwork is bundled. Shared boards, task claiming and shared supplies are
      not included; exports are not compatible with the original Ironbound
      guide.
    </p>
    <div class="credit-links">
      <a href="https://runescape.wiki/" target="_blank" rel="noreferrer"
        >RuneScape Wiki ↗</a
      ><a
        href="https://ironbound-rs3-alex.alexmollard93.chatgpt.site/guide/"
        target="_blank"
        rel="noreferrer">Original guide ↗</a
      >
    </div>
  </dialog>
  <dialog
    class="app-dialog lookup-dialog"
    bind:this={lookupDialog}
    aria-labelledby="lookup-title"
    oncancel={(event) => {
      event.preventDefault();
      closeLookup();
    }}
  >
    <div class="dialog-heading">
      <h2 id="lookup-title">Look up a player</h2>
      <IconButton
        framed={false}
        label="Close player lookup"
        onclick={closeLookup}><X size={20} /></IconButton
      >
    </div>
    <p>
      Import public Hiscores and available Adventurer's Log quest and event
      data. Unavailable data will not erase your manual checks or last
      successful snapshot. The Ironman Hiscores show whether a player is an
      Ironman; Group Ironman membership can't be detected, so choose it here.
    </p>
    <form
      onsubmit={(event) => {
        event.preventDefault();
        void lookup(lookupName);
      }}
    >
      <label class="lookup-field"
        >Player name<input
          required
          maxlength="12"
          autocomplete="off"
          bind:value={lookupName}
          disabled={lookupLoading}
        /></label
      >
      <label class="lookup-field"
        >Account type<select bind:value={lookupKind} disabled={lookupLoading}
          ><option value="Regular account"
            >Detect regular or Ironman from Hiscores</option
          ><option value="Group Ironman">Group Ironman</option></select
        ></label
      >
      <p>
        Access: {lookupMode === "f2p" ? "F2P" : "Members"} (change it
        with the F2P/Members switch or on Players after import).
      </p>
      <p>
        Public data is cached for up to ten minutes; Jagex caching can add
        delay. Refreshing keeps your planning settings, packing checks and
        notes.
      </p>
      {#if lookupError}<p role="alert">{lookupError}</p>{/if}
      {#if lookupLoading}<p role="status">Looking up player…</p>{/if}
      <div class="detail-actions">
        <Button type="submit" variant="primary" disabled={lookupLoading}
          >Import player</Button
        ><Button onclick={closeLookup}>Cancel</Button>
      </div>
    </form>
  </dialog>
</div>
