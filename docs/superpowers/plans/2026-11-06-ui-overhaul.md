# RS3 Compass UI Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the RS3 Compass interface to match the owner-approved design board while keeping every existing behaviour, saved key and data rule intact.

**Architecture:** Restyle in place. Keep the existing pages, components, controller and routes, and replace their markup and CSS with the board's look (bevelled grain frames, gold-trimmed title bars, Cinzel headings, gold primary buttons). Pull the decision logic each new screen needs into small pure TypeScript helpers with node tests. Ship one task per commit so each screen can be checked on its own.

**Tech Stack:** SvelteKit 3, Svelte 5 runes, TypeScript, custom CSS in `src/styles.css` (Tailwind is imported but effectively unused, so don't start using it now), `@lucide/svelte` icons, Leaflet maps, `node --test` logic tests.

**Spec:** the approved design board https://claude.ai/artifact/VtKrQFKJQ95PiteGJZkSeA at version `1793933302-2a5c`. It has 15 artboards in `project/*.dc.html`. Read a board with the Artifact tool's `read` action and `path: "project/<Name>.dc.html"`. The approved tokens are in `project/ds/rs3compass/tokens.json`, and the design system is https://claude.ai/artifact/FomRxDMTRaKrNvP6Cbam5T. The product rules are in the Axiom note `Agents/Memory/Projects/unmapped/RS3 Compass preparation-first product contract.md`, which you read with `node "C:/Users/alex.mollard/Axiom/src/memory.mjs" read --path …`.

| Board | Route or surface | Owner today |
|---|---|---|
| Main | flow map (reference only) | — |
| Home | `/` | `src/lib/pages/Journey.svelte` |
| Quest | `/quests/[[id]]` | `src/lib/pages/QuestPage.svelte` |
| Skill | `/skills/[[name]]` | `src/lib/pages/SkillPage.svelte` |
| Players | `/players` | `src/lib/pages/PlayersPage.svelte` + `PlayerManager.svelte` |
| Group | `/groups` | `src/lib/pages/GroupsPage.svelte` |
| Activity | `/activity` | `src/lib/pages/ActivityPage.svelte` |
| FirstVisit | shown by the shell before the first choice | `AppShell.svelte` empty state |
| Search | Ctrl/⌘ K dialog | `AppShell.svelte` |
| Levels | new route `/levels` | `LevelEditor.svelte` dialog |
| Errors | source banners and the new `+error.svelte` | ad hoc `<p>` copy in many files |
| HomePhone, QuestPhone, SkillPhone, SkillPhonePicker | layouts under 760px | same pages |

## Global Constraints

- Keep the storage key `rs3-compass-design-v1` (`src/lib/profileStore.ts:19`) and the cookie `rs3_compass_player` (`src/lib/rememberedPlayer.ts:3`). Don't migrate saved data. The only schema change allowed is the optional `welcomed` field in Task 9.
- Packing keys stay `questId + "::" + supplyLine` and `train-<Skill>::<item>`. Notes use the activity ID. Never change supply text.
- An unknown level renders as `?`, never `0`, and it never counts as met.
- F2P/Members is a planning view only. Copy must not imply real membership.
- Artwork comes from RuneScape Wiki hotlinks through the existing `GameArt` and `wiki.ts`. Don't download anything into the repo, and never show a placeholder box where the app has real art.
- Preparation hands off to the Wiki or the in-game helper. No walkthroughs.
- Out of scope: sign-in, cloud sync, shared boards and task claiming.
- Use fictional players only in any fixture or screenshot.
- Tokens, added to `:root` in `src/styles.css`:
  - existing names stay: `--bg #101920`, `--panel #17242e`, `--panel-raised #1b2b37`, `--line #2b3a43`, `--text #dce1e3`, `--muted #a9bcc9`, `--gold #c5a46b`, `--gold-bright #e5c892`, `--green #8eb7a3`, `--blue #9cbacc`
  - new: `--edge #5f7584`, `--frame-line #40515b`, `--title-top #273e50`, `--title-bottom #1b3040`, `--title-line #67716a`, `--heading #f0e6cf`, `--warn #e8a462`, `--bad #f0948a`, `--well #0f1a21`, `--rail #0d151b`
  - fonts stay as they are: Cinzel for headings and window titles, DM Sans for the body
- Spacing:
  - Desktop content gets 28px/32px padding with a 1260px maximum width.
  - Hit targets are at least 40px on desktop and 44px on phone.
  - Focus is `outline: 2px solid var(--gold-bright)`.
- Breakpoints:
  - Phone layout below 760px: bottom tab bar, one-row header, no rail.
  - Rail collapses to the phone layout at 760px.
  - Three-column quest layout from 1200px.
- Base text stays `--font-ui` (0.8125rem). Raise sizes only where the board specifies them: page titles, window titles, readiness values, phone body 15px, and inputs at least 16px on phone.
- **Stale rule** (no time threshold is invented): a public snapshot is stale when its sync state is `"error"`, or when any import status (`hiscoresImportStatus`, `questImportStatus`, `eventImportStatus`) is set and is not `"available"` while earlier data for that source is still kept. Otherwise it is fresh and shows "Updated <relative publicFetchedAt>".
- Files are CRLF with no BOM (`.gitattributes` has `* text=auto eol=crlf`). Edit only with Edit/Write.
- Commits:
  - Plain imperative subject with no prefixes, and no attribution.
  - Author and committer are `Alex Mollard <47443168+AlexMollard@users.noreply.github.com>`.
  - Commit only. Alex decides when to push.

## Review Focus

1. **A saved profile with no levels and no quest data** (a fresh sample or a public player whose sources failed). Expect every surface to show `?` or "unknown" and never crash or show 0. Task 3 tests `questReadiness` with an empty `levels`, and Task 9 tests `levelChanges` from blank.
2. **Supply lines with no item reference or quantity** (free text such as "Food, if you want it"). Expect the inventory grid to show a labelled slot, and expect packing to still toggle the exact line key. Tested in Task 4 (`inventorySlots` with free text).
3. **The membership toggle flipping while a members-only method or quest is open.** Expect choices to be kept, a lock notice, and no data erased. Covered by the existing training-stage tests. Task 5 re-runs them and adds the "Change skill" panel case to the manual check.
4. **A saved state from before this change, without `welcomed`.** Expect it to go straight to Home with no First visit. Tested in Task 9.
5. **Very long names** (12-character RSNs, "Dungeoneering", long quest names) at 390px. Expect ellipsis or wrapping and no horizontal page scroll. Every task's manual check includes 390px width with `document.documentElement.scrollWidth <= innerWidth`.

---

### Task 1: Tokens, frames and status primitives

**Files:**
- Modify: `src/styles.css` (`:root` at :4-26; `.btn*` at :508-560; `.tool-window` and `.window-title`; `.notice`)
- Modify: `src/lib/components/GameWindow.svelte`, `src/lib/components/Button.svelte`
- Create: `src/lib/components/SourceBanner.svelte`, `src/lib/components/StatusChip.svelte`, `src/lib/sourceStatus.ts`
- Test: `tests/source-status.test.mjs`

**Interfaces:**
- Produces:
  - `type SourceTone = "stale" | "failed" | "notFound" | "slowed" | "private" | "info"`
  - `interface SourceNotice { tone: SourceTone; title: string; message: string; retry: boolean }`
  - `profileSourceNotice(profile: Profile, sync: { state: string; message?: string; nextRefreshAt?: number } | undefined, view: "home" | "quests" | "skills"): SourceNotice | null` in `src/lib/sourceStatus.ts`. `"home"` is the route id Task 2 introduces. Until Task 2 lands, AppShell passes `"home"` where it computes `"journey"` today.
  - `isSnapshotStale(profile: Profile, sync?: { state: string }): boolean` implements the Stale rule from Global Constraints.
  - `<SourceBanner notice={SourceNotice} onRetry?={() => void} />`
  - `<StatusChip tone="ok" | "warn" | "bad" | "info" | "neutral" label={string} />`
  - `GameWindow` gains `variant?: "window" | "plain"` (default "window"). All other props are unchanged.

- [ ] **Step 1: Write the failing test** in `tests/source-status.test.mjs`, covering the three banners `AppShell.svelte:388-444` renders today, with the same precedence:
  - `profileSourceNotice({source:"hiscores", ...}, {state:"error", message:"x"}, "journey")` returns `tone:"failed"`, `title:"The latest public-data refresh failed"`, `retry:true`.
  - With sync idle and `hiscoresImportStatus:"unranked-or-unavailable"`, it returns `tone:"private"` with the message starting "Jagex has no main Hiscores entry".
  - With `questImportStatus:"private-or-unavailable"` on view `"quests"`, it returns `tone:"private"` and `retry:true`. On view `"skills"` the same profile returns `null`.
  - A sample profile returns `null`.
  - `isSnapshotStale`:
    - `{source:"hiscores", hiscoresImportStatus:"available"}` with sync idle is `false`.
    - The same profile with sync `"error"` is `true`.
    - `{source:"hiscores", questImportStatus:"private-or-unavailable", questProgress:{…}}` is `true`.
    - A sample is `false`.
- [ ] **Step 2: Run** `node --experimental-strip-types --test tests/source-status.test.mjs`. Expected: FAIL, module not found.
- [ ] **Step 3: Implement `profileSourceNotice`.** Move the copy verbatim from `AppShell.svelte:388-444`.
- [ ] **Step 4: Run the test.** Expected: PASS.
- [ ] **Step 5: Add tokens and restyle.**
  - Add the tokens from Global Constraints.
  - `.tool-window` becomes the board's `.frame`: grain gradients, `1px var(--frame-line)` border, radius 3px, inset bevel shadows.
  - `.window-title` becomes `.win-t`: a 44px gradient from `--title-top` to `--title-bottom`, bottom border `--title-line`, `h2` in Cinzel 18px `#e9e6dc`.
  - `.btn-primary` becomes the gold gradient (`#d2b981` to `#b89b65`, text `#1b241e`).
  - `SourceBanner` uses the Errors board: icon plus coloured title plus message plus an optional "Try again" button. Never colour alone. Tone colours: stale = `--warn`, failed and notFound = `--bad`, slowed and info = `--blue`, private = `--edge`.
- [ ] **Step 6: Wire it up.** Replace `AppShell.svelte:388-444` with `{#if notice}<SourceBanner {notice} onRetry={…refreshPlayers([profile.id])} />{/if}`.
- [ ] **Step 7: Verify.**
  - Run `npm test` and `npm run build`. Expected: all tests pass, 0 Svelte errors and 0 warnings.
  - `npm run dev`: every existing window shows the new frame, and a forced sync error (DevTools: block `/api/player`) shows the failed banner.
- [ ] **Step 8: Commit** "Add design tokens, game frames and shared source banners".

### Task 2: App shell (rail, top bar, phone tab bar, search)

**Files:**
- Modify: `src/lib/AppShell.svelte`, `src/lib/shell.css`, `src/styles.css` (`.sidebar*` :165-306, `.topbar*` :306-420, responsive :1436-1770)
- Modify: `src/lib/navigation.ts`
- Test: `tests/navigation.test.mjs`

**Interfaces:**
- Produces:
  - `type RouteId = "home" | "quests" | "skills" | "players" | "groups" | "activity" | "levels"`
  - `routeFor(pathname: string): RouteId` in `src/lib/navigation.ts`
  - `NAV_GROUPS: { label: "Plan" | "People"; items: { id: RouteId; label: string; href: string; image: string }[] }[]`
  - `PHONE_TABS: { id: RouteId; label: "Home" | "Quests" | "Skills" | "People"; href: string; image: string; matches: RouteId[] }[]`, where People matches players, groups and activity
  - `image` keeps today's Wiki files (`Quest_map_icon.png`, `Quest.png`, `Skills_icon.png`, `Ironman_badge.png`, `Group_Ironman_badge.png`; People uses `Ironman_badge.png`) and renders through `GameArt`. The board's line icons were placeholders, and the contract asks for recognizable game art.
  - AppShell's `selectedView`, `is-compact` and quest-notice conditions switch from `"journey"` to `"home"`.
- Consumes: `GameArt`, `Button`, `SourceBanner` (Task 1)

- [ ] **Step 1: Write failing tests:**
  - `routeFor("/")` returns `"home"`.
  - `routeFor("/quests/cooks-assistant")` returns `"quests"`.
  - `routeFor("/levels")` returns `"levels"`.
  - `routeFor("/groups")` returns `"groups"`.
  - The `PHONE_TABS` entry with label `"People"` has `matches` that include `"activity"`.
  - The `NAV_GROUPS` labels are exactly `["Plan","People"]`, and the Plan items are Home, Quests and Skills in that order.
- [ ] **Step 2: Run** `node --experimental-strip-types --test tests/navigation.test.mjs`. Expected: FAIL.
- [ ] **Step 3: Implement** them in `navigation.ts`. Replace the nested ternary in `AppShell.svelte:38-50` and the `navigation` array at :51-88. Rename the "Progression" label to "Home".
- [ ] **Step 4: Run the test.** Expected: PASS.
- [ ] **Step 5: Rebuild the rail** to the Home board:
  - logo (keep the `Compass` icon mark, Cinzel "RS3 COMPASS" over "IRONMAN PLANNER")
  - a player card in a frame: `PlayerPortrait`, name, "kind · Public data/Sample", and a switch link to `/players`
  - a full-width F2P/Members segmented control, moved out of the top bar (keep `aria-pressed` and `controller.updateProfile`)
  - eyebrow-grouped nav from `NAV_GROUPS` with `aria-current="page"`, and counts: Quests shows `complete / total` from `progressionQuests`, Players shows the profile count
  - a footer with the save status ("Saved on this device", or the storage-error text) and an "Export progress" link
  - The About dialog stays, reached from the footer.
- [ ] **Step 6: Rebuild the top bar.**
  - Search field trigger ("Search quests and skills" plus a `kbd` shortcut) and an "Update levels" button linking to `/levels` (the route arrives in Task 9; until then link to `/` and open `LevelEditor` as today).
  - Remove the breadcrumb and the character `<select>`. Switching moves to the rail and `/players`. Keep the `--topbar-height` ResizeObserver.
- [ ] **Step 7: Build the phone layout** (under 760px):
  - Hide the rail and the mobile menu button.
  - One-row header: compass mark, page title, search icon button, and a player chip linking to `/players` that shows "F2P" or "Members".
  - Fixed bottom `nav` from `PHONE_TABS`: 60px tall, gold top inset on the current tab, `padding-bottom: env(safe-area-inset-bottom)`.
  - Add `padding-bottom` to `main` so the content clears the tab bar.
- [ ] **Step 8: Restyle the search dialog** to the Search board: a framed dialog, a large field, results grouped under "Quests" and "Skills" eyebrows, and an empty-state line. Keep the existing filtering and keyboard behaviour.
- [ ] **Step 9: Verify.**
  - `npm test` and `npm run build` pass.
  - At 1600px the rail matches the Home board.
  - At 390px the tab bar shows, nothing scrolls horizontally, and Ctrl K opens search.
  - Switching F2P/Members keeps the page, notes and packing.
  - Removing every profile on `/players` still leaves the shell usable.
- [ ] **Step 10: Commit** "Rebuild the app shell with grouped rail, search bar and phone tabs".

### Task 3: Home ("Your route")

**Files:**
- Modify: `src/lib/pages/Journey.svelte`, `src/Journey.css`
- Create: `src/lib/questReadiness.ts`
- Test: `tests/quest-readiness.test.mjs`

**Interfaces:**
- Produces:
  - `interface QuestReadiness { levels: { met: number; total: number; unknown: number }; pack: { packed: number; total: number }; danger: string | null }`
  - `questReadiness(quest: QuestRecord, profile: Profile): QuestReadiness` in `src/lib/questReadiness.ts`
  - `closeToUnlocking(quests: QuestRecord[], profile: Profile, within = 5, limit = 4): { quest: QuestRecord; skill: string; have: number; need: number }[]`, in the same file. It considers only incomplete quests and only non-recommended requirements where the level is known and `need - within <= have < need`. Sort by gap ascending, then by quest order. Unknown levels are never included.
  - Rules:
    - Count only non-`recommended` requirements.
    - A level counts as met when `profile.levels[skill] >= level`. A missing level counts as `unknown`, never met.
    - `pack` counts `profile.packed` entries equal to `quest.id + "::" + line`.
    - `danger` comes from `QUEST_COMBAT[quest.id]` (`src/combatData.ts`), using `required` and `hazards`. It is the name of the enemy with the highest numeric `level`. A string level (such as "varies") ranks below every number, and ties keep list order. With no entry or no enemies it is `null`.
- Consumes: `progressionQuests`, `nextQuest`, `SKILLS` (data.ts); `SkillGrid` with `compact` (in-game order); `RecentActivity`; `WorldMap`.

- [ ] **Step 1: Write failing tests.** Use a quest with requirements `[{skill:"Crafting",level:10},{skill:"Mining",level:5,recommended:true}]` and `supplies:["20 × Ball of wool"]`:
  - With `levels:{}` the result is `levels:{met:0,total:1,unknown:1}`.
  - With `levels:{Crafting:12}` the result is `met:1, unknown:0`.
  - With `packed:["q::20 × Ball of wool"]` the result is `pack:{packed:1,total:1}`.
  - A quest with no combat entry gives `danger:null`.
  - `closeToUnlocking`:
    - A quest needing Crafting 10 with `levels:{Crafting:8}` returns `[{skill:"Crafting",have:8,need:10,…}]`.
    - With `levels:{Crafting:4}` it returns `[]` (gap 6 > 5).
    - With `levels:{}` it returns `[]`.
    - A completed quest is excluded.
  - For a real quest that has a `QUEST_COMBAT` entry, `danger` equals the name of the enemy with the highest numeric level (read the entry in the test; don't hardcode a guess).
- [ ] **Step 2: Run** `node --experimental-strip-types --test tests/quest-readiness.test.mjs`. Expected: FAIL.
- [ ] **Step 3: Implement `questReadiness` and `closeToUnlocking`.**
- [ ] **Step 4: Run the test.** Expected: PASS.
- [ ] **Step 5: Rebuild `Journey.svelte`** to the approved Home board (Alex's version):
  - Page heading "Your route", plus a gold trim rule.
  - A two-column `.two` grid (2fr/1fr, one column under 900px).
  - **Next quest window:**
    - Left column: Wiki `artwork` above a 170px `WorldMap` of `next.start.map`.
    - Right column: the eyebrow ("Free-to-play · Miniquest" from `members` and `kind`), a Cinzel title, `why`, and three readiness tiles from `questReadiness`. The Levels tile shows "None" when `total` is 0, "n / m", or "? unknown". The Pack tile shows "packed / total". The Danger tile shows the name or "None".
    - Then "Speak to `npc`, `location`", a gold "Prepare quest" linking to `questPath`, and a `WikiAction`.
  - **Right side:** "Route" timeline with the previous done quest, the next quest and the following two, plus "See all N" linking to `/quests`. Below it, "Recent activity" (`RecentActivity`, or its empty state).
  - **Full width:** "Skills" window with `SkillGrid compact` (all 29, `?` for unknown) and `PlayerStatistics` for public players. Tiles link to `skillPath` (existing behaviour).
  - **"Close to unlocking"** window from `closeToUnlocking(progressionQuests(profile), profile)`. Each row: skill icon, "Skill have / need", the quest name linking to `questPath`. Empty text: "Nothing within 5 levels yet."
  - Keep the "Regular route complete" empty branch.
  - The board replaces the full "Browse activities" queue on Home with the Route timeline. The full list stays on `/quests`, and "See all N" links there.
- [ ] **Step 6: Verify.**
  - `npm test` and `npm run build` pass.
  - At 1600px and 390px Home matches the Home and HomePhone boards, and the Aster sample shows the Levels tile without crashing.
  - A public profile shows real portrait and art.
- [ ] **Step 7: Commit** "Redesign Home as the route view with quest readiness".

### Task 4: Quest workspace

**Files:**
- Modify: `src/lib/pages/QuestPage.svelte`, `src/styles.css` (`.journal-layout`, `.quest-preparation-grid`), `src/QuestLevels.css`, `src/QuestCombat.css`
- Create: `src/lib/inventorySlots.ts`
- Test: `tests/inventory-slots.test.mjs`

**Interfaces:**
- Consumes: `questReadiness` (Task 3), `ItemList`'s item-reference lookup (read `ItemList.svelte` for the resolver it uses), `QuestStart`, `QuestLevels`, `QuestCombat`, `ActivityNotes`, `SourceBanner`.
- Produces:
  - `interface InventorySlot { line: string; key: string; packed: boolean }`
  - `inventorySlots(quest: QuestRecord, packed: string[]): { slots: InventorySlot[]; empty: number }`
  - One slot per supply line, `key = quest.id + "::" + line`, `empty = max(0, 28 - slots.length)`.
  - shortcut: one slot per supply line, because the catalogue has no stack or quantity data. Split slots by quantity once supplies gain structured counts.

- [ ] **Step 1: Write failing tests:**
  - Two supply lines give 2 slots and `empty: 26`, with keys `"q::<line>"`.
  - A line present in `packed` has `packed: true`.
  - Free text "Food, if you want it" still produces a slot.
  - 30 lines give `empty: 0`.
- [ ] **Step 2: Run** `node --experimental-strip-types --test tests/inventory-slots.test.mjs`. Expected: FAIL.
- [ ] **Step 3: Implement `inventorySlots`.**
- [ ] **Step 4: Run the test.** Expected: PASS.
- [ ] **Step 5: Rebuild the layout** to the Quest board.
  - Columns from 1200px: quest log 236px | centre | 300px aside. Under 1200px the aside drops below the centre. Under 760px use the QuestPhone order: hero art, the jump strip (Levels / Pack / Danger / Start as anchor links), pack, start, danger, levels, actions.
  - **Quest log:** keep `ResponsivePicker` and `SearchField`, and restyle `QuestNavigationCard` as compact log rows with the done/next marker.
  - **Centre:**
    - Header: art, eyebrow, Cinzel title, `why`, and a readiness strip from `questReadiness`.
    - "Pack your inventory" window: the supply checklist (existing toggle and keys) beside a 4×7 inventory grid from `inventorySlots`. Slots use the brown inventory palette from the board (`.inv` `#3b3226`, `.slot` `#2a231a`). Show the item art through the same reference `ItemList` uses, and dim unpacked slots.
    - "Level checks", "Combat and danger", notes, and actions: gold "Mark quest complete" plus `WikiAction` "Wiki walkthrough".
  - **Aside:** "Start here" (`QuestStart` with map) and "Rewards" (existing `rewards`).
  - Keep the membership lock `.notice` as a `SourceBanner`-styled `info` notice.
- [ ] **Step 6: Verify.**
  - `npm test` and `npm run build` pass.
  - Sheep Shearer and Cook's Assistant: toggling packing updates the grid and survives reload.
  - Compact mode still works.
  - 390px matches QuestPhone with no overflow.
- [ ] **Step 7: Commit** "Redesign the quest workspace with an inventory pack view".

### Task 5: Skill guide and phone "Change skill"

**Files:**
- Modify: `src/lib/pages/SkillPage.svelte`, `src/lib/components/ChoiceStrip.svelte`, `src/lib/components/SkillGrid.svelte`, `src/lib/components/TrainingEquipment.svelte`, `src/lib/components/TrainingMethods.svelte`, `src/lib/components/ResponsivePicker.svelte`
- Test: existing `tests/training-stage.test.mjs`, `tests/training-equipment.test.mjs`, `tests/skill-catalogue.test.mjs`

**Interfaces:**
- `ChoiceStrip` gains `variant?: "chips" | "joined"` (default "chips"). "joined" is the approved single bar: a shared 1px `#33434d` border, equal flex cells, 44px tall, the selected cell gold with an inset bottom bar, native radios kept.
- `ResponsivePicker` gains `mode?: "dropdown" | "panel"`. "panel" renders the SkillPhonePicker pattern under 1001px:
  - a trigger button (current icon, name, "Change skill" with chevron, `aria-expanded`)
  - a sheet under the header with a filter field, a 3-column grid and a dim backdrop
  - Escape, a backdrop click or choosing a skill closes it, and focus returns to the trigger.
- Everything else consumes the existing props.

- [ ] **Step 1: Run** `npm test` to record the baseline. Expected: all pass. These tests guard range and method persistence, which this task must not change.
- [ ] **Step 2: Restyle the desktop page** to the approved Skill board:
  - The sticky in-game grid picker stays (`SkillGrid compact`, sticky offset `--topbar-height`).
  - Header: icon, category eyebrow, Cinzel name and purpose line.
  - Progress card: "current → target" in Cinzel with a gold progress bar and "Update level". Keep the existing inline single-skill form behind that link as a disclosure.
  - "Training range" `ChoiceStrip variant="joined"`.
  - "Method" as selectable framed cards (`TrainingMethods`, selected card gold with a "Selected" chip).
  - "Target kit": `TrainingEquipment` as equipment slots, each with Use/Make requirement rows (`lvl` badge green when met, warn outline plus "▲ n below" when not, `?` when unknown).
  - Aside: "Before you go" (packing), "Where to train" (`TrainingMap`), notes, and gold "Mark session complete".
- [ ] **Step 3: Use `ResponsivePicker mode="panel"`** on SkillPage so phones get the "Change skill" sheet. QuestPage keeps `"dropdown"`.
- [ ] **Step 4: Verify.**
  - `npm test` (same pass count as the baseline) and `npm run build` pass.
  - Mining: choose range 20–29 and a method, reload, and both persist.
  - Toggling F2P with a members method selected shows the lock and restores the method on toggling back.
  - 390px: open Change skill, filter "dung", choose Dungeoneering, and the panel closes with focus on the trigger.
  - Tabbing through the panel never leaves it while it is open.
- [ ] **Step 5: Commit** "Redesign the skill guide with joined ranges, kit slots and a phone skill sheet".

### Task 6: Players

**Files:**
- Modify: `src/lib/pages/PlayersPage.svelte`, `src/lib/components/PlayerManager.svelte`
- Test: existing `tests/player-management.test.mjs`

**Interfaces:**
- Consumes: `StatusChip`, `PlayerPortrait`, `GameStat`, `getPlayerActions().lookup` (compassContext.ts:55), `controller.refreshPlayers`, `controller.exportProgress`.

- [ ] **Step 1: Restyle** to the Players board:
  - Header: "Players", subtitle, quiet "Export progress", and "Refresh public players".
  - Filter row: a find field and a segmented All / Public / Sample control with counts (client-side filter only), plus a "How refresh works" `<details>` holding the current `.sync-policy` copy.
  - Card grid (`minmax(320px,1fr)`), each card with:
    - portrait, Cinzel name, kind and source line
    - three stats: public players show Total level and Quest points (`?` when absent); samples show Recorded `n / 29` and Activities
    - Planning F2P/Members
    - `StatusChip`s: "Updated n min ago" (ok, when `!isSnapshotStale`), "Hiscores from <relative time>" (warn, when `isSnapshotStale`), "Quests private", "No public data · sample player"
    - actions: gold "Use <name>" or "Selected" chip, quiet "Activity", danger "Remove" with the existing confirmation
  - A last dashed "Add a player" card with an inline name field that calls `lookup(name)`.
- [ ] **Step 2: Verify.**
  - `npm test` and `npm run build` pass.
  - Add a fictional public lookup through the dev server.
  - Remove a sample, reload, and it stays removed.
  - The filter counts are right.
  - 390px is one column.
- [ ] **Step 3: Commit** "Redesign Players as status cards with an inline lookup".

### Task 7: Group Ironman

**Files:**
- Modify: `src/lib/pages/GroupsPage.svelte`
- Test: existing `tests/group-progress.test.mjs`, `tests/group-data.test.mjs`

**Interfaces:**
- Consumes: `groupPlayers` and `groupSkillSummary(players, skill) => { highest, known, leaders }` from `src/lib/groupProgress.ts`.
- Produces: `widestGaps(players: readonly GroupPlayer[], skills: readonly string[], limit = 5): { skill: string; highest: number; lowest: number; gap: number; leaders: string[]; trailing: string[] }[]` in `src/lib/groupProgress.ts`.
  - Use only published `hiscoresLevels`, and skip skills with fewer than 2 known members.
  - Sort by gap descending, then by in-game order. Exclude gaps of 0.

- [ ] **Step 0: Test `widestGaps` first** in `tests/group-progress.test.mjs`:
  - Members at Mining 40/12/unknown give `{skill:"Mining",highest:40,lowest:12,gap:28}`.
  - A skill with only one known member is absent.
  - Equal levels are absent.
  - Run it and see it FAIL, implement, then see it PASS.
- [ ] **Step 1: Restyle** to the approved Group board:
  - Header with the group name, mode and size.
  - Roster portrait cards with "Highest" counts (`?` when unknown).
  - "Skill comparison" as Alex's card grid (`repeat(auto-fill,minmax(170px,1fr))`): each card has the skill icon and name over a 3-column grid of member level buttons (44px tall, gold for the highest, `?` for unrecorded, each linking to that member's skill guide as today).
  - Side panels: "Widest gaps" from `widestGaps` (skill, "leader highest · trailing lowest", gap) and "Latest from the group" (the existing feed slice).
  - Keep "Find your group", the saved-group picker, lookup errors and the remove confirmation, restyled with `SourceBanner` for errors.
- [ ] **Step 2: Verify.**
  - `npm test` and `npm run build` pass.
  - A controlled 5-member fixture works.
  - 390px is one column with no overflow.
  - The level buttons open the right player and skill.
- [ ] **Step 3: Commit** "Redesign Group Ironman with comparison cards and roster panels".

### Task 8: Activity

**Files:**
- Modify: `src/lib/pages/ActivityPage.svelte`, `src/lib/components/ActivityFeed.svelte`
- Test: existing `tests/activity-feed.test.mjs`, `tests/activity-references.test.mjs`

- [ ] **Step 1: Restyle** to the Activity board:
  - Two columns: a framed feed of dated event rows (art, player, event, relative time) and a "Who's included" panel listing each player with a `StatusChip` for their source state.
  - The Tobin pattern explains why a player has no events: "needs membership and a public Event Log".
  - Per-player failures become `SourceBanner` rows.
  - Keep the group `ChoiceStrip` scope, refresh and empty state.
- [ ] **Step 2: Verify.**
  - `npm test` and `npm run build` pass.
  - The feed sorts newest first.
  - A blocked `/api/player` shows a failure banner while the old events stay.
- [ ] **Step 3: Commit** "Redesign the activity feed with an inclusion panel".

### Task 9: First visit, the Levels page and not found

**Files:**
- Modify: `src/lib/profileStore.ts` (SavedState and `initialize` at :225-240), `src/lib/AppShell.svelte`
- Create: `src/routes/levels/+page.svelte`, `src/lib/pages/LevelsPage.svelte`, `src/lib/components/FirstVisit.svelte`, `src/routes/+error.svelte`, `src/lib/levelChanges.ts`
- Delete: `src/lib/components/LevelEditor.svelte` once nothing imports it (Journey, and the Task 2 interim link)
- Test: `tests/level-changes.test.mjs`, `tests/player-profiles.test.mjs` (add cases)

**Interfaces:**
- Produces:
  - `levelChanges(before: Record<string, number>, after: Record<string, number | "">): { skill: string; from: number | null; to: number | null }[]` in `src/lib/levelChanges.ts`, in in-game order.
  - Blank (`""`) means unknown and removes the key. It never writes 0.
  - Values are clamped to each skill's cap from `SKILLS`, and invalid input is ignored.
  - `SavedState.welcomed?: boolean`. A fresh controller has `welcomed: false`, and a loaded save without the field is treated as `true`.
  - `controller.welcome(): void` sets it to `true`. `selectProfile` and `addPlayer` also set it to `true`.
- Decision (my call; tell Alex at handoff): a brand-new device still seeds the fictional samples, as today, but shows First visit until the player looks someone up, picks a sample or enters levels by hand. Existing saves never see it.

- [ ] **Step 1: Write failing tests:**
  - `levelChanges({Crafting:5},{Crafting:6,Firemaking:9})` returns `[{skill:"Crafting",from:5,to:6},{skill:"Firemaking",from:null,to:9}]`.
  - `levelChanges({Mining:12},{Mining:""})` returns `[{skill:"Mining",from:12,to:null}]`.
  - `levelChanges({}, {Attack:"0"})` returns `[]` (invalid).
  - In `player-profiles.test.mjs`: a fresh controller starts with `welcomed:false`; after `initialize()` with a stored save that lacks `welcomed`, it is `true`; and `selectProfile("aster")` sets it to `true`.
- [ ] **Step 2: Run** `node --experimental-strip-types --test tests/level-changes.test.mjs tests/player-profiles.test.mjs`. Expected: the new cases FAIL.
- [ ] **Step 3: Implement** `levelChanges` and the `welcomed` flag. Persist it inside the existing key without bumping `version`.
- [ ] **Step 4: Run the tests.** Expected: PASS.
- [ ] **Step 5: Build `FirstVisit.svelte`** to the FirstVisit board:
  - "Who are you planning for?"
  - Look-up card: name, a "Plan as" F2P/Members segment, and gold "Look up and start" calling the shell's `lookup`.
  - Sample card: Aster and Rowan rows from `SAMPLE_PROFILES`, calling `selectProfile`.
  - "Or enter your levels by hand" linking to `/levels` and calling `welcome()`.
  - AppShell renders it in place of the page while `!welcomed`, and also replaces the "No saved players" panel with it.
- [ ] **Step 6: Build `/levels`** to the Levels board:
  - All 29 rows in in-game order, each with a numeric input with placeholder `?`, a "Recorded" / "Unknown" / "Was n" note, and a gold outline on changed rows.
  - The info notice that group comparisons use only published Hiscores.
  - A sticky save bar ("n changes", Cancel, gold "Save levels") that writes through `controller.updateProfile`.
  - Point the top-bar "Update levels" and Home's links at `/levels`. Remove `LevelEditor`.
- [ ] **Step 7: Build `+error.svelte`** to the Errors board's not-found panel: the tilted dim compass, "This page isn't on the map", copy, "Back to Home", and "Search quests and skills". For a 404 status show that copy; for any other status show "Something went wrong" with the same actions.
- [ ] **Step 8: Verify.**
  - `npm test` and `npm run build` pass.
  - With localStorage cleared, First visit shows; picking Aster lands on Home; reload stays on Home.
  - A copied pre-change save goes straight to Home.
  - `/levels`: blank Mining, save, and Home shows Mining `?`, never 0.
  - `/nope` shows the not-found page inside the shell.
- [ ] **Step 9: Commit** "Add first-visit choice, a full levels page and a not-found page".

### Task 10: Shared status copy everywhere

**Files:**
- Modify: `src/lib/components/PlayerManager.svelte` (:109, :287-297), `src/lib/components/PlayerStatistics.svelte` (:97-109), `src/lib/components/QuestPlayerStatus.svelte` (:28-35), `src/lib/components/ActivityFeed.svelte` (:152-153), `src/lib/pages/GroupsPage.svelte` (:103, :156, :238), `src/lib/components/WorldMap.svelte` (:171-175)
- Test: `tests/source-status.test.mjs` (extend)

**Interfaces:**
- Consumes: `SourceBanner` and `StatusChip` (Task 1).
- Produces: `rateLimitNotice(nextRefreshAt?: number): SourceNotice` and `mapTilesNotice(): SourceNotice` in `src/lib/sourceStatus.ts`.

- [ ] **Step 1: Write failing tests:**
  - `rateLimitNotice(Date.now()+60000)` returns `tone:"slowed"`, `retry:false`, and a message containing "about a minute".
  - `mapTilesNotice()` returns `tone:"info"` with the message "The marker is still correct."
- [ ] **Step 2: Run** them. Expected: FAIL. **Step 3: Implement** them. **Step 4: Run** them. Expected: PASS.
- [ ] **Step 5: Replace each ad hoc status `<p>`** listed above with `SourceBanner` (full-width states) or `StatusChip` (inline states). Keep each message's facts. Change wording only where the Errors board gives the copy.
- [ ] **Step 6: Final verification:**
  - `npm test` (all, including the 121 existing tests) and `npm run build` pass with 0 errors and 0 warnings.
  - `pwsh ~/agent-core/tools/verify-change.ps1 -Run 'npm test'` passes: CRLF, no BOM and no line-ending churn. Also run `git ls-files --eol` on the changed files and expect `i/crlf` or `w/crlf`, with no `mixed`.
  - At 1600, 1000 and 390px, every route has no body overflow.
  - Exact pre-QA localStorage and cookie values are restored afterwards.
- [ ] **Step 7: Commit** "Use shared source banners for every stale and failed state".
