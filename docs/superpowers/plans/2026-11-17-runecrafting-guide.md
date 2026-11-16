# Runecrafting Guide Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the Runecrafting skill page its own members/Ironman layout: Your kit, Craft now, Rune stockpile, Unlock next, then the refreshed level-range methods.

**Architecture:** Hand-written, Wiki-cited facts in `src/runecraftingGuide.ts`; pure, tested rules in `src/runecraftingPlan.ts`; an optional `runecrafting` profile field; a lazy-loaded `RunecraftingGuide.svelte` mounted from `SkillPage.svelte` the way `SlayerGuide` is.

**Tech Stack:** Svelte 5, SvelteKit, TypeScript, `node --test` (tests are `.mjs` importing `.ts` via `--experimental-strip-types`).

**Spec:** `docs/superpowers/specs/2026-11-17-runecrafting-guide-design.md` · Mockup: https://claude.ai/artifact/PfZBZbzcZNugp5PhZ7ndkK

## Global Constraints

- Every fact entry carries `checked: "2026-11-17"` and at least one `https://runescape.wiki/w/...` source; a test enforces this.
- Missing data is "unknown", never 0. An unrecorded kit item counts as not owned, with a prompt to record it.
- No profit advice on Ironman profiles. Ironman = `kind` is `"Solo Ironman"` or `"Group Ironman"`.
- Status is never colour alone: icon plus word (met / unmet / unknown / check in game).
- Runecrafting data stays out of the main entry chunk (only imported by the lazy component and tests).
- At 390px wide everything stacks with no horizontal page overflow (the stockpile table scrolls in its own box).
- CRLF line endings, UTF-8 without BOM; edit with Edit/Write only.
- Commit messages: plain imperative subject, no prefixes, no attribution.

## Review Focus

- **Have ≥ want on a stock row** → shows "Target reached", 0 essence, 0 trips; never negative. Test in Task 2.
- **Kit with Expansive plus other pouches ticked** → planner uses whichever single option holds more, never adds Expansive to the others. Test in Task 2.
- **Quest import unavailable** (`questImportStatus` set and not `"available"`) → quest requirements show "unknown", not unmet; the XP pick doesn't hide methods gated by an unknown quest but marks them. Test in Task 2.
- **Old saves without `runecrafting`, and malformed `runecrafting` values** (negative counts, unknown pouch ids, unknown rune) → old saves load; malformed ones are rejected by validation. Test in Task 3.
- **Level not recorded** → Craft now and stockpile ask the player to record their level instead of assuming 1. Test in Task 2.

---

### Task 1: Runecrafting facts

**Files:**
- Create: `src/runecraftingGuide.ts`
- Test: `tests/runecrafting-guide.test.mjs`

**Interfaces:**
- Produces:
  ```ts
  export type Dated = { checked: string; sources: string[] };
  export type EssenceKind = "pure" | "impure";
  export type Altar = Dated & { rune: string; wiki: string; image: string; level: number; members: boolean; essence: EssenceKind; quests: string[]; accessNote?: string; checkInGame?: boolean; multipliers: number[] };
  export type PouchId = "small" | "medium" | "large" | "giant" | "massive" | "expansive";
  export type Pouch = Dated & { id: PouchId; name: string; image: string; level: number; capacity: number; how: string; otherRequirements: string[] };
  export type FamiliarId = "parasite" | "lurker" | "titan";
  export type Familiar = Dated & { id: FamiliarId; name: string; image: string; summoning: number; capacity: number; how: string };
  export type SavvyStep = { level: number; bonus: number };
  export type XpMethod = Dated & { id: string; label: string; wiki: string; image: string; from: number; to: number; needsEssence: boolean; altar?: string; quests: string[]; rate: [number, number]; provisional: boolean; where: string };
  export type EssenceSource = Dated & { id: string; label: string; wiki: string; kind: EssenceKind; rank: number; quests: string[]; levels: { skill: string; level: number }[]; note: string };
  export const RC_CHECKED = "2026-11-17";
  export const ALTARS: Altar[]; export const POUCHES: Pouch[]; export const FAMILIARS: Familiar[];
  export const SAVVY: SavvyStep[]; export const SAVVY_SOURCE: Dated;
  export const XP_METHODS: XpMethod[]; export const ESSENCE_SOURCES: EssenceSource[];
  export const INFINITY_OUTFIT_CAPACITY = 12; export const BACKPACK_SLOTS = 28;
  ```
  `quests` hold quest ids from `src/questsImported.ts`.

- [ ] **Step 1: Write the failing test** — `tests/runecrafting-guide.test.mjs`:
  - `every entry is dated and sourced`: for each entry of ALTARS, POUCHES, FAMILIARS, XP_METHODS, ESSENCE_SOURCES and SAVVY_SOURCE: `checked === "2026-11-17"`, `sources.length > 0`, each source matches `/^https:\/\/runescape\.wiki\/w\/\S+$/`.
  - `quest ids exist`: every id in any `quests` array is a `QUESTS` id (`src/data.ts`).
  - `spec values`: altar levels — Air 1, Mind 1, Water 5, Earth 9, Fire 14, Body 20, Cosmic 27, Chaos 35, Astral 40, Nature 44, Law 54, Death 65, Blood 77, Soul 90, Time 100; Spirit 1, Bone 20, Flesh 40, Miasma 60 with `essence === "impure"`. Pouches: small 1/3, medium 25/6, large 50/9, giant 75/12, massive 90/18, expansive 105/70. Familiars: parasite 54/7, lurker 62/12, titan 93/20. SAVVY: 25→75, 35→150, 60→200, 70→250, 95→275, 105→300.
  - `altar quests`: cosmic `["lost-city"]`, chaos `["what-lies-below"]`, astral `["lunar-diplomacy"]`, death `["mournings-end-part-ii"]`, blood `["legacy-of-seergaze"]`, soul `["phite-club"]`, all four necrotic `["rune-mythos"]`; Time has `checkInGame: true`.
  - `multipliers ascend`: each altar's `multipliers` is strictly ascending; Astral includes 82, Nature includes 91, Blood's first is 154, Soul's first is 179.
  - `xp methods cover 1–110 for both rules`: for every level 1..110 there is at least one method with `needsEssence === false` and at least one with `needsEssence === true` whose `from <= level < to` (last range `to` = 111).

- [ ] **Step 2: Run it to verify it fails**
  Run: `node --experimental-strip-types --test tests/runecrafting-guide.test.mjs`
  Expected: FAIL, cannot find module `src/runecraftingGuide.ts`.

- [ ] **Step 3: Fill `src/runecraftingGuide.ts` from the Wiki**
  Fetch each altar page (and the Runecrafting page's multiple-runes table) for the full multiplier lists; don't use the spec's double-rune levels alone. Sources to cite: Runecrafting, Pay-to-play Runecrafting training, Ironman Mode/Strategies/Runecrafting, Savvy runecrafting, Necrotic rune, Soul altar, Expansive pouch, Runic attuner, each altar page. XP methods (rates from Pay-to-play training, base XP/hr):
  - no-essence: Lower Runespan 1–33, Middle Runespan 33–66, Upper Runespan (skulls, blood pools) 66–111 — Ironman page rates.
  - essence: Abyss runecrafting split at the Wiki's bands (1–25 12k–25k, 25–35, 35–50 70k–118k, 50–75, 75–90 170k–254k, 90–95, 95–105 237k–449k provisional, 105–111 409k–655k provisional), each naming its rune and altar; Soul altar 90–111 (364k–407k, quest phite-club); Runic attuner 105–111 (~1M, provisional, requires the attuner in the kit); necrotic runes 1–111 (quest rune-mythos, provisional, impure).
  Fill the unknown bands from the same table. Essence sources: pure — Rune Memories essence chest (rune-memories), abyssal savage noted drops, mining pure essence (Mining 30), Slayer/PvM drops; impure — the Necromancy rituals source per the Necrotic rune page. Rank by the Ironman strategy page.

- [ ] **Step 4: Run it to verify it passes**
  Run: `node --experimental-strip-types --test tests/runecrafting-guide.test.mjs`
  Expected: PASS.

- [ ] **Step 5: Commit**
  ```bash
  git add src/runecraftingGuide.ts tests/runecrafting-guide.test.mjs
  git commit -m "Add Wiki-checked Runecrafting facts"
  ```

### Task 2: Runecrafting rules

**Files:**
- Create: `src/runecraftingPlan.ts`
- Test: `tests/runecrafting-plan.test.mjs`

**Interfaces:**
- Consumes: Task 1 exports; `Profile`, `AccountKind` from `src/data.ts`.
- Produces:
  ```ts
  export type XpRule = "save-essence" | "fastest";
  export type RunecraftingKit = { xpRule?: XpRule; pouches?: PouchId[]; familiar?: FamiliarId; infinityOutfit?: boolean; attuner?: boolean; stock?: StockTarget[] };
  export type StockTarget = { rune: string; have: number; want: number };
  export type ReqState = "met" | "unmet" | "unknown" | "check";
  export type Req = { text: string; state: ReqState };
  export function isIronman(kind: AccountKind): boolean;
  export function defaultXpRule(kind: AccountKind): XpRule;          // Ironman → "save-essence"
  export function questState(profile: Profile, questId: string): ReqState;
  export function altarAccess(profile: Profile, altar: Altar): Req[];  // level + quests (+ "check" when checkInGame)
  export function runesPerEssence(altar: Altar, level: number): number;
  export function essencePerTrip(kit: RunecraftingKit): number;
  export type StockPlan = { target: StockTarget; altar: Altar; remaining: number; perEssence: number; essence: number; trips: number; locked: Req[]; sources: EssenceSourceView[] };
  export type EssenceSourceView = { source: EssenceSource; reqs: Req[]; met: boolean };
  export function essenceSources(profile: Profile, kind: EssenceKind): EssenceSourceView[]; // met first, then rank
  export function planStock(profile: Profile, kit: RunecraftingKit, level: number, target: StockTarget): StockPlan;
  export type CraftNow = { xp?: { method: XpMethod; reqs: Req[]; sources: EssenceSourceView[] }; stock?: StockPlan; skippedLocked: StockPlan[] };
  export function craftNow(profile: Profile, kit: RunecraftingKit, level: number | undefined): CraftNow | { needsLevel: true };
  export type UnlockStep = { track: "savvy" | "pouch" | "altar" | "multiplier" | "familiar" | "milestone"; name: string; wiki: string; image: string; how: string; reqs: Req[] };
  export function unlockNext(profile: Profile, kit: RunecraftingKit, level: number): UnlockStep[];
  ```
- Rules the tests pin:
  - `questState`: in `completedQuests` → met; else `questImportStatus` defined and not `"available"` → unknown; else unmet.
  - `runesPerEssence` = 1 + count of multipliers ≤ level.
  - `essencePerTrip` = max(expansive-only option, other-pouches option), where an option is `(28 − pouches carried) + their capacity`; then + familiar capacity + 12 if `infinityOutfit`. No pouches → 28 + familiar + outfit.
  - `planStock`: remaining = max(0, want − have); essence = ceil(remaining / perEssence); trips = ceil(essence / essencePerTrip); a locked altar gives essence 0, trips 0 and its unmet reqs in `locked`.
  - `craftNow` XP: candidates are methods with `from ≤ level < to` whose quests aren't unmet and whose altar/attuner requirement is met (unknown quests stay in, marked). `save-essence` prefers `needsEssence === false`, then highest `rate[0]`; `fastest` takes highest `rate[0]`. `sources` filled only when the chosen method needs essence.
  - `craftNow` stock: among unlocked stock plans with essence > 0, the one with most essence; locked ones go to `skippedLocked`.
  - `unlockNext`: one step per track — next Savvy step above level; first pouch not in kit (with its level req); first altar by level whose access has any non-met req; per stock rune, its next multiplier above level; next familiar above the kit's (Summoning req, state from `profile.levels.Summoning`, unknown if unrecorded); milestones Soul altar 90, Massive pouch 90, Time altar 100, Expansive pouch 105 not already covered.

- [ ] **Step 1: Write the failing tests** — `tests/runecrafting-plan.test.mjs`, with a `profile(overrides)` helper building a members Solo Ironman profile:
  - `worked example 1`: level 82, quests lunar-diplomacy + legacy-of-seergaze, kit `{pouches: ["small","medium","large","giant"], familiar: "lurker"}`. `essencePerTrip(kit) === 66`; blood target 4,200→20,000 → `perEssence 1, essence 15800, trips 240`; astral 2,000→10,000 → `perEssence 2, essence 4000, trips 61`. `craftNow(..., 82)` with rule save-essence picks a method with `needsEssence === false`; with rule fastest picks the 75–90 Abyss method and `sources.length > 0`. `unlockNext` contains a savvy step requiring 95, a pouch step "Massive pouch" requiring 90, an altar step for Soul with reqs `'Phite Club` unmet and level 90 unmet.
  - `worked example 2`: add soul 300→5,000 to stock; its plan has `trips 0` and non-empty `locked`; `craftNow().stock.target.rune` is not Soul; `skippedLocked` contains Soul.
  - `worked example 3`: empty kit, no stock → `essencePerTrip({}) === 28`; `craftNow().stock === undefined`.
  - `target reached`: have 25,000 want 20,000 → remaining 0, essence 0, trips 0.
  - `expansive is not stacked`: kit with all six pouches → `essencePerTrip === 97` (27 + 70 beats 23 + 48 = 71).
  - `unknown quests`: `questImportStatus: "service-unavailable"`, no completed quests → `questState(p, "phite-club") === "unknown"`.
  - `level not recorded`: `craftNow(p, kit, undefined)` deep-equals `{ needsLevel: true }`.
  - `ironman`: `isIronman("Solo Ironman")`, `isIronman("Group Ironman")` true; `"Regular account"` false; `defaultXpRule("Regular account") === "fastest"`.

- [ ] **Step 2: Run them to verify they fail**
  Run: `node --experimental-strip-types --test tests/runecrafting-plan.test.mjs`
  Expected: FAIL, module not found.

- [ ] **Step 3: Implement `src/runecraftingPlan.ts`** to the signatures and rules above.

- [ ] **Step 4: Run them to verify they pass**
  Run: `node --experimental-strip-types --test tests/runecrafting-plan.test.mjs tests/runecrafting-guide.test.mjs`
  Expected: PASS.

- [ ] **Step 5: Commit**
  ```bash
  git add src/runecraftingPlan.ts tests/runecrafting-plan.test.mjs
  git commit -m "Add Runecrafting craft, stock and unlock rules"
  ```

### Task 3: Save the kit per character

**Files:**
- Modify: `src/data.ts:44-73` (Profile)
- Modify: `src/lib/profileStore.ts:~75` (validation, next to `slayerTask`)
- Test: `tests/player-profiles.test.mjs`

**Interfaces:**
- Consumes: `RunecraftingKit` (Task 2). To keep `data.ts` free of guide data, declare the field structurally in `data.ts`: `runecrafting?: { xpRule?: "save-essence" | "fastest"; pouches?: string[]; familiar?: "parasite" | "lurker" | "titan"; infinityOutfit?: boolean; attuner?: boolean; stock?: { rune: string; have: number; want: number }[] }`.
- Produces: `isRunecraftingKit(value: unknown): boolean` in `profileStore.ts`, used by profile validation.

- [ ] **Step 1: Write the failing tests** in `tests/player-profiles.test.mjs`:
  - a saved profile without `runecrafting` still loads;
  - a profile with `{ xpRule: "fastest", pouches: ["small","giant"], familiar: "lurker", infinityOutfit: true, stock: [{ rune: "Blood", have: 0, want: 20000 }] }` loads and round-trips;
  - each of these is rejected: `pouches: ["huge"]`, `familiar: "imp"`, `xpRule: "slow"`, `stock: [{ rune: "Blood", have: -1, want: 5 }]`, `stock: [{ rune: "", have: 0, want: 5 }]`, non-integer `want: 1.5`, more than 30 stock rows.
  Pouch ids, familiar ids and rune names are checked against fixed lists inside `profileStore.ts` (rune names must match `ALTARS` runes; keep a literal list there to avoid importing guide data into the main chunk, and add a test in `runecrafting-guide.test.mjs` that the two lists match).

- [ ] **Step 2: Run to verify they fail**
  Run: `node --experimental-strip-types --test tests/player-profiles.test.mjs`
  Expected: FAIL on the malformed cases (accepted today).

- [ ] **Step 3: Add the field and `isRunecraftingKit`**; counts are integers 0–100,000,000.

- [ ] **Step 4: Run to verify they pass**
  Run: `npm test`
  Expected: all PASS.

- [ ] **Step 5: Commit**
  ```bash
  git add src/data.ts src/lib/profileStore.ts tests/player-profiles.test.mjs tests/runecrafting-guide.test.mjs
  git commit -m "Save the Runecrafting kit and stock per character"
  ```

### Task 4: The Runecrafting guide on the skill page

**Files:**
- Create: `src/lib/components/RunecraftingGuide.svelte`
- Modify: `src/lib/pages/SkillPage.svelte` (mount next to the SlayerGuide `{#await import(...)}` block)

**Interfaces:**
- Consumes: Task 1 and 2 exports; `controller.updateProfile` from `getCompass()`; `fetchPrices(names)` from `src/lib/priceClient.ts`; existing `GameWindow`, `ChoiceStrip`, `GameArt`, `CheckedSources`, `WikiAction`, `Button`.
- Produces: `<RunecraftingGuide {profile} />`, mounted when `skill.name === "Runecrafting" && profile.mode === "members"`.

Layout follows the mockup and spec, top to bottom in the centre column: **Craft now** (ChoiceStrip Save essence / Fastest, default `defaultXpRule(profile.kind)`, saved to `runecrafting.xpRule`; For XP card with essence sources when needed; For your stock card with skipped locked runes; Regular account only: For profit line: the runes the player can craft now, ranked by GE price × runes per essence at their level, labelled "GE value per essence"; shows "Prices unavailable" when `fetchPrices` returns undefined), **Rune stockpile** (table: rune, have, want inputs saved on change, per essence, essence + kind, trips; locked rows show reqs; "Add a rune" picker from ALTARS; remove button per row; essence sources under each open row, collapsed in a `<details>`), **Unlock next**. Right column (aside on ≥1200px): **Your kit** (pouch checkboxes with "how to get it" under unticked ones and "needs level N" when above level; familiar ChoiceStrip none/parasite/lurker/titan; outfit and attuner checkboxes). Each section ends with `CheckedSources`. Unrecorded level → one prompt to record it in place of Craft now and the stockpile numbers.

- [ ] **Step 1: Build the component and mount it** (lazy `{#await import("../components/RunecraftingGuide.svelte")}` with the same loading and error copy pattern as Slayer: "Loading the Runecrafting guide…", "Couldn't load the Runecrafting guide — reload the page.").

- [ ] **Step 2: Type-check**
  Run: `npm run check`
  Expected: 0 errors.

- [ ] **Step 3: Confirm the chunk split**
  Run: `npx vite build` then `grep -l "phite-club" .svelte-kit/output/client/_app/immutable/entry/*.js`
  Expected: no match (guide data not in entry chunks).

- [ ] **Step 4: Commit**
  ```bash
  git add src/lib/components/RunecraftingGuide.svelte src/lib/pages/SkillPage.svelte
  git commit -m "Give Runecrafting its own guide layout"
  ```

### Task 5: Refresh the level-range methods

**Files:**
- Modify: `src/skillsSupport.ts:1376-1393` (Runecrafting record) and the option constants it uses (`span`, `spanMember`, `middle`, `blood` stay; add Abyss and Soul altar options)
- Test: `tests/skill-catalogue.test.mjs`

- [ ] **Step 1: Write the failing test**: the Runecrafting record has `trainingWiki === "Pay-to-play_Runecrafting_training"`; `membersNote` doesn't contain "Free players can train to 110"; members stages are 1–33, 33–66, 66–90, 90–105, 105–110 and each stage offers at least one option with no essence requirement (Runespan) and one Abyss/altar option; the 90+ stages include a Soul altar option requiring `'Phite Club`; the 105–110 stage includes the runic attuner.
- [ ] **Step 2: Run to verify it fails**
  Run: `node --experimental-strip-types --test tests/skill-catalogue.test.mjs`
  Expected: FAIL.
- [ ] **Step 3: Rewrite the stages** with `opt(...)`/`stage(...)`, keeping the free stages valid for F2P (Runespan and free altars to 110). Membership note: "Members unlock the Abyss, members altars and the full Runespan; free players can still train to 110 with the free altars and lower Runespan."
- [ ] **Step 4: Run all tests**
  Run: `npm test`
  Expected: PASS.
- [ ] **Step 5: Commit**
  ```bash
  git add src/skillsSupport.ts tests/skill-catalogue.test.mjs
  git commit -m "Refresh Runecrafting training ranges for members"
  ```

### Task 6: Verify in the browser

- [ ] **Step 1:** Start the dev server with `preview_start` (add a `.claude/launch.json` entry for `npm run dev`, port 5173, if none exists) and open `/skills/runecrafting`.
- [ ] **Step 2:** Set up the worked-example-1 profile (level 82, the two quests, Small–Giant, lurker, blood and astral stock) and check with `read_page`: Craft now shows the no-essence pick, switching to Fastest shows Abyss blood runes plus essence sources; stockpile shows 15,800 / 240 and 4,000 / 61; Unlock next shows Soul altar with 'Phite Club unmet.
- [ ] **Step 3:** Add soul runes → locked row, no trips. Untick every pouch and the familiar → 28 per trip and the "tick your pouches" prompt.
- [ ] **Step 4:** Switch the profile to Regular account → the profit line appears; switch to F2P → the guide is hidden and the generic page remains.
- [ ] **Step 5:** `resize_window` to mobile (375 wide): no horizontal page scroll; the stockpile table scrolls in its box. Reset to desktop. Check `read_console_messages` for errors. Take a screenshot as proof.
