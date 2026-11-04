<script lang="ts">
  import { onMount, tick } from "svelte";
  import type { Snippet } from "svelte";
  import { page } from "$app/state";
  import { goto } from "$app/navigation";
  import {
    ArrowDownToLine,
    ArrowUpRight,
    ChevronRight,
    CircleHelp,
    Compass,
    Info,
    Menu,
    Search,
    X,
  } from "@lucide/svelte";
  import { QUESTS, SKILLS, type Profile } from "../data";
  import { getCompass } from "./compassContext";
  import { fetchPlayer } from "./playerClient";
  import { normalizePlayerName } from "./playerName";
  import { readRememberedPlayer } from "./rememberedPlayer";
  import GameArt from "./components/GameArt.svelte";
  import NavigationCard from "./components/NavigationCard.svelte";
  import SearchField from "./components/SearchField.svelte";
  import Button from "./components/Button.svelte";
  import IconButton from "./components/IconButton.svelte";
  import PlayerManager from "./components/PlayerManager.svelte";
  import "./shell.css";

  let { children }: { children: Snippet } = $props();
  const controller = getCompass();
  const saved = controller.state,
    storageError = controller.storageError,
    ready = controller.ready,
    compact = controller.compact,
    notice = controller.notice;
  let profile = $derived($saved.profiles.find((p) => p.id === $saved.activeId));
  let route = $derived(
    page.url.pathname.startsWith("/quests")
      ? "quests"
      : page.url.pathname.startsWith("/skills")
        ? "skills"
        : page.url.pathname.startsWith("/play")
          ? "play"
          : "journey",
  );
  const navigation = [
    {
      id: "journey",
      label: "Progression",
      image: "Quest_map_icon.png",
      href: "/",
    },
    {
      id: "quests",
      label: "Quests",
      image: "Quest.png",
      href: "/quests",
    },
    {
      id: "skills",
      label: "Skills",
      image: "Skills_icon.png",
      href: "/skills",
    },
  ];
  let mobileNav = $state(false),
    search = $state(""),
    lookupName = $state(""),
    lookupError = $state(""),
    lookupLoading = $state(false),
    shortcut = $state("Ctrl K");
  let lookupKind = $state<Profile["kind"]>("Solo Ironman");
  let managingPlayers = $state(false);
  let searchDialog: HTMLDialogElement,
    aboutDialog: HTMLDialogElement,
    lookupDialog: HTMLDialogElement;
  let request: AbortController | undefined;
  let rememberedStarted = false;
  let main: HTMLElement, topbar: HTMLElement;
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
    lookupKind = profile?.kind ?? "Solo Ironman";
    lookupError = "";
    if (!lookupDialog.open) lookupDialog.showModal();
  }
  function closeLookup() {
    abortLookup();
    lookupDialog.close();
  }
  function openPlayerManager() {
    abortLookup();
    if (lookupDialog.open) lookupDialog.close();
    managingPlayers = true;
  }
  async function lookupFromManager(name?: string, refresh = false) {
    managingPlayers = false;
    await tick();
    openLookup(name);
    if (refresh) void lookup(name!);
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
      mode = profile?.mode ?? "f2p";
    try {
      const player = await fetchPlayer(name, current.signal);
      if (current.signal.aborted || request !== current) return;
      controller.addPlayer(player, kind, mode);
      request = undefined;
      lookupLoading = false;
      lookupDialog.close();
      controller.notify(
        player.quests.status === "available"
          ? "Levels and public quest completion imported. Manual checks are kept."
          : "Levels imported. Jagex quest data was unavailable; existing checks are kept.",
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
  function select(id: string) {
    abortLookup();
    if (lookupDialog.open) lookupDialog.close();
    controller.selectProfile(id);
    controller.notify(
      "Switched character. Each profile keeps its own progress.",
    );
  }
  function navigate(href: string) {
    mobileNav = false;
    compact.set(false);
    void goto(href);
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
        id = "rs3:" + normalizePlayerName(name).toLowerCase();
      } catch {
        return;
      }
      const existing = $saved.profiles.find(
        (p) => p.id === id && p.source === "hiscores",
      );
      if (existing) controller.selectProfile(existing.id);
      if (!existing || !existing.questImportStatus) {
        openLookup(name);
        void lookup(name);
      }
    });
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") mobileNav = false;
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
      document.documentElement.style.removeProperty("--topbar-height");
    };
  });
</script>

<div
  class:nav-open={mobileNav}
  class:is-compact={$compact &&
    !!profile &&
    (route === "play" || route === "quests")}
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
  {#if mobileNav}<button
      class="nav-scrim"
      aria-label="Close navigation"
      onclick={() => (mobileNav = false)}
    ></button>{/if}
  <aside class="sidebar">
    <a class="brand" href="/" aria-label="RS3 Compass home"
      ><span class="brand-mark"><Compass size={29} strokeWidth={1.4} /></span
      ><span><strong>RS3 COMPASS</strong><small>IRONMAN PLANNER</small></span
      ></a
    >
    <div class="sidebar-rule"></div>
    <span class="nav-heading">WORKSPACE</span>
    <nav aria-label="Main navigation">
      {#each navigation as item}
        <button
          class:active={route === item.id}
          class="nav-item"
          aria-current={route === item.id ? "page" : undefined}
          onclick={() => navigate(item.href)}
          ><GameArt file={item.image} size={24} /><span>{item.label}</span
          >{#if route === item.id}<span class="nav-active-dot"
            ></span>{/if}</button
        >
      {/each}
    </nav>
    <div class="sidebar-bottom">
      <div class="save-status">
        <span class:warning={$storageError} class="status-dot"
        ></span>{$storageError
          ? "Not saved · export your preview"
          : $ready
            ? "Preview saved on this device"
            : "Loading local progress"}
      </div>
      <button class="nav-item subtle" onclick={() => aboutDialog.showModal()}
        ><CircleHelp size={18} /> About this prototype</button
      ><span class="version-label">DESIGN PREVIEW · 01</span>
    </div>
  </aside>
  <div class="workspace">
    <header class="topbar" bind:this={topbar}>
      <div class="breadcrumb">
        <IconButton
          framed={false}
          className="mobile-menu"
          label="Open navigation"
          aria-expanded={mobileNav}
          onclick={() => (mobileNav = !mobileNav)}
          ><Menu size={21} /></IconButton
        ><Compass size={15} /><span>Workspace</span><ChevronRight
          size={13}
        /><strong
          >{route === "play"
            ? "Training companion"
            : navigation.find((item) => item.id === route)?.label}</strong
        >
      </div>
      <div class="topbar-tools">
        <button
          class="search-trigger"
          aria-label="Search quests and skills"
          title="Search quests and skills"
          onclick={openSearch}
          ><Search size={17} /><span>Search guides</span><kbd>{shortcut}</kbd
          ></button
        >
        {#if profile}
          <div
            class="access-toggle"
            role="group"
            aria-label="Character membership planning"
          >
            <button
              class:selected={profile.mode === "f2p"}
              aria-pressed={profile.mode === "f2p"}
              onclick={() =>
                controller.updateProfile((p) => ({ ...p, mode: "f2p" }))}
              >F2P</button
            ><button
              class:selected={profile.mode === "members"}
              aria-pressed={profile.mode === "members"}
              onclick={() =>
                controller.updateProfile((p) => ({ ...p, mode: "members" }))}
              >Members</button
            >
          </div>
          <label class="character-select"
            ><GameArt
              file={profile.kind === "Group Ironman"
                ? "Group_Ironman_badge.png"
                : "Ironman_badge.png"}
              size={28}
            /><span class="character-details"
              ><small
                >{profile.source === "hiscores"
                  ? "Public data"
                  : "Sample / manual"} · {profile.kind}</small
              ><span class="character-name" aria-hidden="true"
                >{profile.name} <span>▾</span></span
              ><select
                aria-label="Select character"
                value={profile.id}
                onchange={(event) => select(event.currentTarget.value)}
                >{#each $saved.profiles as p}<option value={p.id}
                    >{p.name} ({p.source === "hiscores"
                      ? "Public data"
                      : "Sample / manual"})</option
                  >{/each}</select
              ></span
            ></label
          >
        {/if}
        <button class="lookup-trigger" onclick={openPlayerManager}
          >Manage players</button
        >
      </div>
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
      {#if $ready && route !== "skills" && profile?.source === "hiscores" && profile.questImportStatus && profile.questImportStatus !== "available"}<div
          class="notice quest-import-notice"
          role="status"
        >
          <div>
            <strong>Quest data unavailable</strong>
            <p>
              {profile.questImportStatus === "private-or-unavailable"
                ? "Jagex did not expose quest status for this player. Existing checks are kept; you can mark completion manually."
                : "The quest service could not be reached. Existing checks are kept."}
            </p>
          </div>
          <Button variant="quiet" onclick={() => openLookup(profile?.name)}
            >Retry lookup</Button
          >
        </div>{/if}
      {#if $ready && profile}
        {@render children()}
      {:else if $ready}
        <section class="panel empty-player-state">
          <h1>No saved players</h1>
          <p>
            Look up your RuneScape player to start planning. Removed profiles
            stay removed on this device.
          </p>
          <Button variant="primary" onclick={() => openLookup("")}
            >Look up a player</Button
          >
        </section>
      {/if}
      <footer class="workspace-footer">
        <span><span class="status-dot"></span> Local progress</span><span
          >Unofficial RuneScape fan project · Artwork © Jagex</span
        ><button onclick={() => aboutDialog.showModal()}
          >About <ArrowUpRight size={12} /></button
        >
      </footer>
    </main>
  </div>
  {#if $notice}<div class="toast" role="status">
      <Info size={17} />{$notice}
    </div>{/if}
  <dialog
    class="app-dialog"
    bind:this={searchDialog}
    aria-labelledby="search-title"
  >
    <div class="dialog-heading">
      <h2 id="search-title">Search quests and skills</h2>
      <IconButton
        framed={false}
        label="Close search"
        onclick={() => searchDialog.close()}><X size={20} /></IconButton
      >
    </div>
    <SearchField
      className="large"
      label="Search quests and skills"
      placeholder="Search quests and skills…"
      value={search}
      onChange={(value) => (search = value)}
    />
    <div class="search-results">
      {#each QUESTS.filter((q) => q.name
          .toLowerCase()
          .includes(search.toLowerCase())) as q}<NavigationCard
          title={q.name}
          label={"Open preparation for " + q.name}
          image={q.icon}
          detail={q.members ? "Members quest" : "Free-to-play quest"}
          wiki={q.wiki}
          onOpen={() => {
            searchDialog.close();
            navigate("/quests/" + encodeURIComponent(q.id));
          }}
        />{/each}
      {#each SKILLS.filter((s) => s.name
          .toLowerCase()
          .includes(search.toLowerCase())) as s}<NavigationCard
          title={s.name}
          label={"Open training for " + s.name}
          image={s.icon}
          detail={s.freeToPlayCap === 0
            ? "Members skill"
            : s.freeToPlayCap
              ? `F2P trial to ${s.freeToPlayCap}`
              : s.category}
          wiki={s.wiki}
          onOpen={() => {
            searchDialog.close();
            navigate("/skills/" + encodeURIComponent(s.name));
          }}
        />{/each}
      {#if ![...QUESTS.map((q) => q.name), ...SKILLS.map((s) => s.name)].some( (n) => n
            .toLowerCase()
            .includes(search.toLowerCase()) )}<p class="empty-state">
          No guides match that search.
        </p>{/if}
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
      Plan quest preparation and training for all 29 skills. The quest catalogue
      currently contains five quests; skill pages provide starting methods, not
      complete optimal routes. Use the Wiki or in-game quest helper for quest
      walkthroughs.
    </p>
    <h3>Your data</h3>
    <p>
      Hiscores supplies public levels. RuneMetrics supplies quest completion
      when available; private or unavailable quest data never clears existing
      checks. Membership and Ironman kind are your planning choices. Sample
      profiles are fictional.
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
      Import public Hiscores levels and available RuneMetrics quest completion.
      Private or unavailable quest data will not erase your manual checks.
      Membership and Ironman type remain planning settings.
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
        >Kind for new profiles<select
          bind:value={lookupKind}
          disabled={lookupLoading}
          ><option>Solo Ironman</option><option>Group Ironman</option></select
        ></label
      >
      <p>
        Access: {(profile?.mode ?? "f2p") === "f2p" ? "F2P" : "Members"} (change using
        the header after import).
      </p>
      <p>
        Public data may be cached for up to five minutes. Refreshing keeps your
        existing planning settings, packing checks and notes.
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
  {#if managingPlayers}<PlayerManager
      onDismiss={() => (managingPlayers = false)}
      onLookup={(name, refresh) => void lookupFromManager(name, refresh)}
    />{/if}
</div>
