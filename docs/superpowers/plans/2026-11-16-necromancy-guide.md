# Necromancy Guide Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the Necromancy skill page its own guide covering storyline progress and souls, the gear upgrade path, what to kill next, and rituals. It is driven by Wiki-imported facts and hand-written judgement.

**Architecture:**
- A hand-run Wiki importer writes `src/necromancyImported.ts`: rituals and glyphs, plus weapon and robe upgrade tiers.
- `src/necromancyGuide.ts` holds the judgement: storyline, soul gates, and kill-next rules.
- `src/necromancyView.ts` holds pure helpers that turn a profile into what the page shows.
- `NecromancyGuide.svelte` is lazy-loaded on the Necromancy skill page, the way SlayerGuide is.
- The profile gains optional recorded progress (tiers, robe line, souls).

**Tech Stack:** SvelteKit, Svelte 5, TypeScript, Node test runner (`npm test`), svelte-check (`npm run check`), Vite build (`npm run build`).

**Spec:** docs/superpowers/specs/2026-11-16-necromancy-guide-design.md

## Global Constraints

- Every hand-written entry carries `checked: "2026-11-16"` and at least one `https://runescape.wiki/w/` source. A test enforces this.
- Facts come from the current RuneScape Wiki only, never third-party guides. Weapon stats come from Bucket, not the stale Necromancy weapons table.
- Generated files are never hand-edited. Importers run by hand, fail loudly on unknown input, and use a generic User-Agent.
- Necromancy data stays out of the main entry chunk; the guide is loaded with a dynamic `import()`.
- Unrecorded tier or souls is "unknown" or "assumed from your levels", never 0 and never met.
- F2P: Necromancy is capped at 20 and only tier 10 gear is free. Members-only content is hidden, not shown as locked.
- Verdicts are framed for Ironmen. A regular-account note appears only where the advice differs.
- Files are CRLF, UTF-8 without a BOM. Edit them with the Edit and Write tools only.
- At 390px wide everything stacks, with no horizontal overflow.
- Commits use a plain imperative subject, with no prefixes and no attribution.

## Review Focus

1. **A partly recorded profile**, e.g. the weapon tier is recorded but the robe tier isn't. Each line resolves on its own: the weapon uses the recorded value and the robe is assumed. This is pinned in Task 4.
2. **Souls of 0 vs unrecorded.** A recorded 0 shows the 3,000 gate as unmet. A blank value shows it as unknown. Pinned in Task 4.
3. **A stale or invalid saved `necromancy` shape**, e.g. `weaponTier: 35`, a negative number of souls, or an unknown robe line. Validation rejects it. Pinned in Task 2.
4. **The top of the ladders.** A recorded weapon T90 has no T100 step. Progress points to the next tier 95 boss the player qualifies for, else to the quest that unlocks it. Pinned in Task 4.
5. **F2P above the cap**, e.g. Necromancy 40 on an F2P profile. The page caps at 20 and tier 10, and the progress row stays hidden. Pinned in Task 4.

---

### Task 1: Necromancy importer

**Files:**
- Create:
  - `scripts/necromancyWikitext.mjs` (pure parsers)
  - `scripts/import-necromancy.mjs`
  - `src/necromancyTypes.ts`
  - `src/necromancyImported.ts` (generated)
- Test:
  - `tests/necromancy-import.test.mjs` (parsers, on fixed snippets)
  - `tests/necromancy-catalogue.test.mjs` (the generated data)

**Interfaces:**
- Reuses: `parseLuaTable` from `scripts/slayerWikitext.mjs` and `createWikiApi` from `scripts/wikiApi.mjs`. Mirror `scripts/import-slayer.mjs` for its structure and fail-loud style.
- Produces, in `src/necromancyTypes.ts`:
  - `Ritual = { id: string; name: string; level: number; tier: 1 | 2 | 3; inputs: { item: string; qty: number }[]; outputs: { item: string; qty: number }[]; xp: number; ticks: number; members: boolean }`
  - `Glyph = { id: string; name: string; level: number; tier: 1 | 2 | 3; alteration: boolean; ink: string }`
  - `UpgradeStep = { line: "weapon" | "deathwarden" | "deathdealer"; tier: number; wear: { skill: SkillName; level: number }[]; task?: string; quests: string[]; materials: { item: string; qty: number; per: "weapon" | "slot" | "set" }[]; members: boolean }`
- Produces, in `src/necromancyImported.ts`: `NECRO_RITUALS: Ritual[]`, `NECRO_GLYPHS: Glyph[]`, `NECRO_UPGRADES: UpgradeStep[]`.

**Sources** (verified 2026-11-16):
- Rituals and glyphs: `Module:Necromancy/rituals/data`.
- Weapon materials: `Template:Death Skull upgrades`.
- Robe materials: the Deathwarden robe armour and Deathdealer robe armour pages, or their templates. Find the structured source and say which one you used.
- Kili task per tier: T20 is Kili Row, then Kili's Knowledge I–VII for T30–T90. T70+ also needs The Spirit of War.
- Membership:
  - Tier 10 is free and everything above is members.
  - Rituals above level 20 are members.
  - A ritual's own members flag is also respected.

- [ ] **Step 1: Write failing parser tests** on fixed wikitext/Lua snippets copied into the test, with a source comment:
  - `parseRituals(lua)` returns lesser communion at level 5, tier 1, 200 XP.
  - `parseRituals` returns greater necroplasm with input 200 lesser necroplasm, output 100 greater necroplasm, 1,480 XP.
  - `parseUpgrades(template)` returns weapon T70 with 4 ensouled bars and 50 bone runes, per weapon.
  - A ritual row with an unknown field shape throws.
- [ ] **Step 2: Run** `node --experimental-strip-types --test tests/necromancy-import.test.mjs`. Expected: FAIL.
- [ ] **Step 3: Implement the parsers, then the importer.**
  - Run `node --experimental-strip-types scripts/import-necromancy.mjs` to generate the data file.
  - The file header says what generated it and on which date.
  - The importer prints a review line per ritual and per step.
- [ ] **Step 4: Write catalogue tests on the generated data:**
  - Weapon steps exist for T10–T90 with ascending tiers.
  - T70 lists The Spirit of War.
  - Only T10 is free.
  - Every ritual has XP > 0 and ticks > 0.
  - There are no members rituals at level ≤ 20 unless the Wiki flags them.
  - Deathdealer starts at T70.
- [ ] **Step 5: Run** `npm test` and `npm run check`. Expected: green.
- [ ] **Step 6: Commit** "Import Necromancy rituals and upgrade tiers from the Wiki".

### Task 2: Recorded progress on the profile

**Files:**
- Modify:
  - `src/data.ts`: add `necromancy?` to `Profile`
  - `src/lib/profileStore.ts`: validation and setter
  - `src/lib/compassContext.ts`: controller type
- Test: `tests/player-profiles.test.mjs`. Also add `necromancy` to the profile field lists in `tests/player-sync.test.mjs` and `tests/player-platform.test.mjs`, the way `slayerTask` was added.

**Interfaces:**
- Produces:
  - `Profile.necromancy?: { weaponTier?: number; robeTier?: number; robeLine?: "deathwarden" | "deathdealer"; souls?: number }`
  - Controller `setNecromancy(patch: Partial<NonNullable<Profile["necromancy"]>> | undefined): void`. It merges the patch, and a key set to `undefined` clears that value.

- [ ] **Step 1: Write the failing tests:**
  - A save with `necromancy: { weaponTier: 60, souls: 3200 }` loads.
  - An old save without the field loads.
  - Each of these is rejected:
    - `weaponTier: 35`: tiers must be one of 10, 20, …, 90;
    - `souls: -1`;
    - `souls: 1.5`;
    - `robeLine: "chaotic"`.
- [ ] **Step 2: Run them.** Expected: FAIL.
- [ ] **Step 3: Implement** the validation in `validProfile`, following the `slayerTask` pattern, plus the setter.
- [ ] **Step 4: Run** `npm test` and `npm run check`. Expected: green.
- [ ] **Step 5: Commit** "Record Necromancy tiers and souls per character".

### Task 3: Necromancy judgement data

**Files:**
- Create: `src/necromancyGuide.ts`
- Test: `tests/necromancy-guide.test.mjs`

**Interfaces:**
- Consumes: the `QUESTS` ids from `src/data.ts`, and the training option ids in `src/skillsCombat.ts`'s Necromancy stages.
- Produces:
  - `NECRO_STORY: { quest: string /* QUESTS id */; level: number; souls?: number; unlocks: string; members: boolean; checked: string; sources: string[] }[]`, in storyline order.
    - Cover Necromancy!, Kili Row, Rune Mythos, Vessel of the Harbinger, The Spirit of War, Tomes of the Warlock, Requiem for a Dragon (Ungael site), Remains of the Necrolord and Alpha vs Omega.
    - Verify every quest name and requirement on its Wiki page.
  - `SOUL_GATES: { souls: number; unlocks: string; checked: string; sources: string[] }[]`: 3,000, 4,500, 8,500, 30,000 and 35,000, per the Wiki training guide. Verify each.
  - `XP_TARGETS: { from: number; to: number; optionId: string; members: boolean; checked: string; sources: string[] }[]`. Each entry maps a Necromancy level range to an existing training option id.
  - `PROGRESS_TARGETS`: per upgrade step, the Kili task's named targets, any boss drop (Hermod / hermodic plate for Deathdealer T70 and T90), and the tier 95 bosses. Each boss carries its requirements:
    - Rasial: Alpha vs Omega.
    - Amascut: Eclipse of the Heart. Verify that quest's requirements on the Wiki.
  - `DUNGEONEERING_WEAPONS`: the side note. Gravite (55), Chaotic (80), Ruinous (90), with token costs. Any cost the Wiki contradicts is marked unverified.

- [ ] **Step 1: Write the tests:**
  - Every entry has `checked === "2026-11-16"`, a Wiki source and non-empty text.
  - Every quest id exists in `QUESTS`.
  - Every `optionId` exists in the Necromancy stages.
  - `XP_TARGETS` covers 1–120 for members and 1–20 for F2P, with no gaps.
  - Soul gates are ascending.
- [ ] **Step 2: Run them.** Expected: FAIL.
- [ ] **Step 3: Research and write the data** from the Wiki: Necromancy training, the Ironman Necromancy strategy page, each quest page, Kili's Knowledge, Hermod, Rasial and Amascut.
- [ ] **Step 4: Run** `npm test` and `npm run check`. Expected: green.
- [ ] **Step 5: Commit** "Write the Necromancy storyline, soul gates and kill-next targets".

### Task 4: Necromancy view helpers

**Files:**
- Create: `src/necromancyView.ts`
- Test: `tests/necromancy-view.test.mjs`

**Interfaces:**
- Consumes: Tasks 1–3, `levelStatus`, and the existing quest-status helper used by the requirement chips (grep `QuestPlayerStatus` / bossLadder).
- Produces:
  - `type Req = { label: string; status: "met" | "below" | "unknown" | "check" }`. Here `"check"` means "check in game", used for Kili tasks and materials.
  - `storyProgress(profile)`: `{ quest, state: "done" | "next" | "locked", reqs: Req[] }[]`, F2P-filtered.
  - `soulStatus(profile)`: `{ souls?: number; next?: { souls: number; unlocks: string; status: "met" | "below" | "unknown" } } | undefined`. Returns undefined for F2P.
  - `gearPath(profile, line: "weapon" | "robe")`:
    - Returns `{ current: number; assumed: boolean; robeLine: "deathwarden" | "deathdealer"; next?: { step: UpgradeStep; reqs: Req[] }; endgame?: { boss: string; reqs: Req[] } }`.
    - The assumed tier is the highest tier whose wear level is met, capped at T60 until The Spirit of War is done and capped at T10 for F2P.
    - Robe line defaults to Deathwarden when it isn't recorded.
  - `killNext(profile)`:
    - Returns `{ xp?: { option: TrainingOption; range: string }; progress?: { text: string; target?: string; reqs: Req[] } }`.
    - Progress picks the first open item in this order:
      1. an unmet quest;
      2. the Kili task with its targets;
      3. a boss drop;
      4. the materials, as "run <ensoul ritual>".
    - There is no progress row for F2P.
  - `ritualsFor(profile)`:
    - Returns `{ now: Ritual[]; next?: Ritual; siteTier: 1 | 2 | 3; inks: string[]; forNextUpgrade?: string /* ritual id */ }`.
    - F2P sees only free rituals at level ≤ 20.

- [ ] **Step 1: Write failing tests, covering the spec's worked examples and the Review Focus:**
  - **Example 1:** members, Necromancy 64, Defence 60, Kili Row and Rune Mythos done, nothing recorded.
    - The weapon is assumed T60.
    - Its next step is T70, with The Spirit of War "below", Kili's Knowledge V "check", and 4 ensouled bars and 50 bone runes listed as "check".
    - Story "next" is The Spirit of War, with souls "unknown".
    - `killNext().xp` is armoured zombies, and progress is "Complete The Spirit of War".
    - `ritualsFor().forNextUpgrade` is the ensoul material ritual.
  - **Example 2:** the same player with weapon T50 recorded and 3,200 souls.
    - The next weapon step is T60: 3 ensouled bars and 25 bone runes.
    - The soul gate of 3,000 is "met".
  - **Example 3:** F2P, Necromancy 15.
    - The story shows Necromancy! only.
    - The weapon is assumed T10, with no next step.
    - `soulStatus` is undefined, and there's no progress row.
    - Rituals are free ones only.
  - **Review Focus 1:** weapon tier recorded, robe tier not. The robe line is still assumed.
  - **Review Focus 2:** souls 0 gives "below"; souls unrecorded gives "unknown".
  - **Review Focus 4:** weapon T90 recorded. There's no next step, and the endgame points to Rasial with Alpha vs Omega "below".
  - **Review Focus 5:** F2P at Necromancy 40 is still capped at T10, with free rituals up to level 20 only.
- [ ] **Step 2: Run them.** Expected: FAIL.
- [ ] **Step 3: Implement** the helpers as pure functions, with no Svelte imports.
- [ ] **Step 4: Run** `npm test` and `npm run check`. Expected: green.
- [ ] **Step 5: Commit** "Work out Necromancy progress, gear path, kill-next and rituals from the profile".

### Task 5: The Necromancy page guide

**Files:**
- Create: `src/lib/components/NecromancyGuide.svelte`
- Modify: `src/lib/pages/SkillPage.svelte`. Lazy-load the guide when `skill.name === "Necromancy"`, mirroring the Slayer `{#await import(...)}` block with its pending and catch states. The level-range methods stay below.

**Interfaces:** consumes the Task 4 helpers and the Task 2 setter.

- [ ] **Step 1: Build the component.** Reuse GameWindow, ChoiceStrip, the requirement chips, CheckedSources, TrainingMap and the Wiki links. Mirror the SlayerGuide styling. Top to bottom:
  - **Your progress:** the story list with states, plus the souls line with its number field and save button.
  - **Gear path:**
    - weapon and robe ladders with the current tier marked, and an "assumed from your levels" label when inferred;
    - tier pickers and the robe-line picker;
    - the next step with its requirement chips, the tier 95 endgame, and the Dungeoneering side note.
  - **Kill next:** an XP row (with a map pin through TrainingMap for the option's site) and a progress row.
  - **Rituals:** what you can run now (level, tier, inputs → outputs, XP, duration), the next unlock, the site tier and inks, a one-line note on disturbances, and the "for your next upgrade" marker.
  - Every judgement block shows its checked date and sources.
- [ ] **Step 2: Run** `npm test`, `npm run check` and `npm run build`. Expected: green.
- [ ] **Step 3: Confirm the bundle split.** Grep the build chunks for a ritual-only string, e.g. "Powerful necroplasm". It must appear only in a chunk reached by the dynamic import, not in the entry chunks or `nodes/0`.
- [ ] **Step 4: Commit** "Add the Necromancy guide to the Necromancy page".

### Task 6: Verify in the app

- [ ] **Step 1:** Run `npm run build`, then start the `preview` launch config.
- [ ] **Step 2:** Save localStorage exactly, e.g. to sessionStorage.
  - Fixture profiles must be valid: `notes: {}`, `activeTask: ""`, plus `completedQuests`, `packed` and `completedTasks` arrays.
- [ ] **Step 3: Check worked examples 1–3 and Review Focus 1–5 with fixture profiles.**
  - Check recording a tier and souls, and that they persist after a reload.
  - Check at 390px wide.
  - Check that the rest of the Necromancy page still works.
- [ ] **Step 4:** Restore storage byte-identical, confirm it after a reload, then stop the preview.
