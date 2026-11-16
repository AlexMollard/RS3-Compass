# Slayer and Combat Guides Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Combat skill pages get refreshed focused routes, plus an efficient "Slayer tasks from your master" route. The Slayer page tells the player their master, and for any task gives a Do/Skip/Block verdict with its reason, the fastest method and what they're missing. It also has a block list per master. All of it is checked against the Wiki as of 2026-11-16.

**Architecture:**
- An importer that's run by hand (`scripts/import-slayer.mjs`) reads each master's task table and requirements from the Wiki, and writes `src/slayerImported.ts`.
- Hand-written judgement goes in `src/slayerGuide.ts`.
- Pure helpers pick the master and the efficient route from the profile: `src/lib/combatLevel.ts` and `src/slayerMasters.ts`.
- `SlayerGuide.svelte` renders on the Slayer skill page.
- The combat skill data in `src/skillsCombat.ts` is rewritten per style, members-first.

**Tech Stack:** Svelte 5 / SvelteKit, TypeScript, Node test runner, RuneScape Wiki API via `scripts/wikiApi.mjs`.

**Spec:** `docs/superpowers/specs/2026-11-16-slayer-combat-guides-design.md`

## Global Constraints

- **Freshness:** facts and judgements are checked against the RuneScape Wiki as of **2026-11-16**. Every hand-written entry carries `checked: "2026-11-16"` and at least one `https://runescape.wiki/w/` source, and a test enforces it.
- **Account type:** verdicts are written for Ironmen. An optional `mainNote` is shown only when `profile.kind === "Regular account"`.
- **Generated data:**
  - `src/slayerImported.ts` is generated, so it is never hand-edited.
  - The importer fails loudly and never writes guesses.
  - The generated data stays out of the main entry chunk (check the `vite build` output).
- **Masters:**
  - Use every RS3 master on the Wiki's Slayer Masters table.
  - "Your master" is the highest-requirement master whose requirements are met.
  - The Raptor and Mandrith are alternatives only.
  - F2P masters are Turael and Jacquelyn (up to Slayer 5). Vannaka is members-only.
- **Coverage:**
  - Verdicts cover every task of Vannaka, Chaeldar, Sumona, Duradel/Lapalok, Kuradal, Morvran and Laniakea, plus the F2P masters.
  - Other tasks show their imported facts with "No verdict yet". They are never hidden and never given an invented verdict.
- **Saved profiles:** existing saves stay valid. The only new profile field is the optional `slayerTask?: { master: string; task: string }`.
- **Files and commits:**
  - CRLF line endings, UTF-8 without BOM, and edits only through the Edit/Write tools.
  - Use plain, separate git commands, because the worktree guard refuses compound ones.
  - Commit subjects are imperative, with no prefixes and no attribution.

## Review Focus

1. **Unrecorded Combat or Slayer levels:** no master is claimed. The page says "Record your Slayer level" (or combat skills). It never defaults to Turael as if that were the answer. Owned by Task 2.
2. **A saved `slayerTask` that no longer exists** (the master was renamed or the task removed after a re-import): it falls back to no selection without throwing, and the saved value is kept until the player picks a new task. Owned by Task 4.
3. **The F2P profile:** no members master, task or efficient route appears anywhere. Owned by Tasks 2, 4 and 5.
4. **A task that needs a quest the player hasn't recorded:** it shows as unmet or unknown, never as met. Owned by Task 4.
5. **A combat skill at a level below every efficient-route threshold:** it shows only focused options, with no empty "Efficient" group. Owned by Task 5.

---

### Task 1: Slayer importer

**Files:**
- Create: `scripts/slayerWikitext.mjs`, `scripts/import-slayer.mjs`, `src/slayerImported.ts` (generated), `src/slayerTypes.ts`
- Test: `tests/slayer-import.test.mjs`, `tests/slayer-catalogue.test.mjs`

**Interfaces:**
- Produces in `src/slayerTypes.ts`:
  - `SlayerMaster = { id: string; name: string; wiki: string; image?: string; members: boolean; combat: number; slayer: number; quests: string[]; location?: string }`
  - `SlayerTask = { id: string; master: string; name: string; wiki: string; amount: [number, number]; slayer: number; requirements: { levels: { skill: SkillName; level: number }[]; quests: string[]; text: string[] }; weight: number; members: boolean }`
- Produces in `src/slayerImported.ts`: `SLAYER_MASTERS: SlayerMaster[]` and `SLAYER_TASKS: SlayerTask[]`. `quests` holds quest IDs from `QUESTS` where the name matches; anything unmatched stays in `requirements.text`.

- [ ] **Step 1: Find the real data source.**
  - Check whether Module:Slayer Tasks by Master reads a Bucket table (`action=bucket`). If not, parse the rendered `action=parse` HTML of `Slayer assignment/<Master>`.
  - Masters and their requirements come from `Template:Slayer masters/table`.
  - Record the choice in the report.
- [ ] **Step 2: Write failing parser tests** using trimmed real fixtures:
  - Laniakea's table gives "Abyssal demons" with amount [180, 300], slayer 85, a "Morytania access" text requirement and weight 10.
  - A quest-gated task maps its quest to a QUESTS ID.
  - The masters table gives Kuradal with combat 110 and slayer 75, and Morvran with slayer 85 and Plague's End.
  - A row with a missing weight is rejected, not defaulted.
- [ ] **Step 3: Run** `node --experimental-strip-types --test tests/slayer-import.test.mjs`. Expected: FAIL.
- [ ] **Step 4: Implement the parser and the importer.** Follow `scripts/import-equipment.mjs`: `createWikiApi`, a generated-file header, CRLF output, review lines, and a non-zero exit on invalid rows.
- [ ] **Step 5: Run the importer.** It must exit 0.
- [ ] **Step 6: Write the catalogue test:**
  - Every master on the Wiki table is present.
  - Turael and Jacquelyn are not members; Vannaka is members.
  - Every task's master exists, and every quest ID exists in QUESTS.
  - There are no duplicate task IDs per master.
- [ ] **Step 7: Run** `npm test` and `npm run check`. Expected: green.
- [ ] **Step 8: Commit** "Import Slayer masters and tasks from the Wiki".

### Task 2: Combat level and master selection

**Files:**
- Create: `src/lib/combatLevel.ts`, `src/slayerMasters.ts`
- Test: `tests/slayer-masters.test.mjs`

**Interfaces:**
- Consumes: `SLAYER_MASTERS` and `levelStatus` (`src/lib/levelStatus.ts`).
- Produces:
  - `combatLevel(levels: Record<string, number>): number | undefined`. It returns undefined when any input skill is unrecorded. The formula comes from the current Wiki Combat level page, and its URL goes in a comment.
  - `masterFor(profile: Profile): { master?: SlayerMaster; next?: SlayerMaster; alternatives: SlayerMaster[]; unrecorded?: SkillName[] }`

- [ ] **Step 1: Write failing tests:**
  - `combatLevel` matches 2-3 Wiki worked values (cite them).
  - Members, combat 110, Slayer 80: the master is Kuradal and next is Morvran.
  - The same profile with combat 120, Slayer 90 and Plague's End done gives Laniakea.
  - F2P, Slayer 3: Turael or Jacquelyn, and never a members master.
  - Slayer unrecorded: `master` is undefined and `unrecorded` includes Slayer (Review Focus 1).
  - The Raptor and Mandrith appear only in `alternatives`.
- [ ] **Step 2: Run** `node --experimental-strip-types --test tests/slayer-masters.test.mjs`. Expected: FAIL.
- [ ] **Step 3: Implement.** A master is usable when its combat and Slayer requirements are met and its quests are in `completedQuests`. Choose the usable master with the highest Slayer requirement, breaking ties by combat requirement. `next` is the lowest master above that one.
- [ ] **Step 4: Run** the same command. Expected: PASS.
- [ ] **Step 5: Commit** "Pick the Slayer master from the player's levels".

### Task 3: Slayer judgement data

**Files:**
- Create: `src/slayerGuide.ts`
- Test: `tests/slayer-guide.test.mjs`

**Interfaces:**
- Produces:
  - `TaskVerdict = { verdict: "prefer" | "do" | "skip" | "block"; reason: string; feeds: SkillName[]; mainNote?: string; fastest: { where: string; site?: TrainingSite; style: "melee" | "ranged" | "magic" | "necromancy" | "any"; aoe: boolean; notes: string }; checked: string; sources: string[] }`
  - `SLAYER_VERDICTS: Record<string /* task name */, TaskVerdict>`
  - `SLAYER_BLOCKS: Record<string /* master id */, { block: { task: string; reason: string }[]; skip: { task: string; reason: string }[]; checked: string; sources: string[] }>`
  - `TrainingSite` is the existing map-pin type in `src/data.ts`; use real Wiki tile coordinates the way the existing combat locations do.

- [ ] **Step 1: Write the tests:**
  - Every task of the covered masters (Global Constraints) has a verdict.
  - Every verdict and block list has `checked === "2026-11-16"`, a Wiki source, and a non-empty reason.
  - Every block or skip task exists in that master's imported tasks.
  - Print the coverage count for uncovered masters.
- [ ] **Step 2: Run them.** Expected: FAIL.
- [ ] **Step 3: Research and write the verdicts and block lists.**
  - Use each task's current Wiki page and the Wiki's Slayer training and task guides. The verdicts are judged for an Ironman: XP rate, drops that feed other skills (charms, herbs, hides, alchables) and uniques.
  - Write a `mainNote` only where a regular account should act differently.
  - Never copy from outdated third-party guides.
- [ ] **Step 4: Run** `npm test` and `npm run check`. Expected: green.
- [ ] **Step 5: Commit** "Write Slayer task verdicts and block lists".

### Task 4: The Slayer page guide

**Files:**
- Create: `src/lib/components/SlayerGuide.svelte`
- Modify:
  - `src/data.ts`: add `slayerTask?` to `Profile`.
  - `src/lib/profileStore.ts`: validate `slayerTask`, and add a setter.
  - `src/lib/pages/SkillPage.svelte`: render `SlayerGuide` when `skill.name === "Slayer"`.
- Test: `tests/slayer-guide-view.test.mjs` (pure helpers), plus additions to `tests/player-profiles.test.mjs`

**Interfaces:**
- Consumes: `masterFor`, `SLAYER_TASKS`, `SLAYER_VERDICTS`, `SLAYER_BLOCKS`.
- Produces: `slayerTaskCard(profile, master, taskId)` in `src/slayerMasters.ts`. It returns `{ task: SlayerTask; verdict?: TaskVerdict; requirements: { label: string; status: "met" | "below" | "unknown" }[]; showMainNote: boolean } | undefined`. Quest requirements read `completedQuests`; an unrecorded or private status counts as unknown, never met.

- [ ] **Step 1: Write failing tests:**
  - A save with `slayerTask` still loads, and so does an old save without it.
  - An invalid `slayerTask` shape is rejected by validation.
  - `slayerTaskCard` for Abyssal demons from Kuradal returns its verdict and an 85 Slayer requirement status.
  - A stale saved task returns undefined without throwing (Review Focus 2).
  - The F2P filter hides members tasks (Review Focus 3).
  - `showMainNote` is only true for Regular accounts.
- [ ] **Step 2: Run them.** Expected: FAIL.
- [ ] **Step 3: Implement the helpers and the profile field.**
- [ ] **Step 4: Build the component**, using GameWindow, ChoiceStrip or the existing picker style, requirement chips, TrainingMap for `fastest.site`, and Wiki links. It shows, top to bottom:
  - "Your master" and "next", with what's missing;
  - the alternatives;
  - a task picker for that master's tasks, grouped by verdict;
  - the task card: the verdict badge, reason, feeds, fastest way, "You need" chips, and the `mainNote` when relevant. A task with no verdict shows "No verdict yet" and the imported facts;
  - the block list.

  Choosing a task saves `slayerTask` right away. Below 640px everything stacks with no overflow.
- [ ] **Step 5: Run** `npm test`, `npm run check` and `npm run build`. Expected: green, with the Slayer data not in the main entry chunk.
- [ ] **Step 6: Commit** "Add the Slayer guide to the Slayer page".

### Task 5: Combat focused and efficient routes

**Files:**
- Modify:
  - `src/data.ts`: `TrainingOption` gains `route?: "focused" | "efficient"` and `feeds?: SkillName[]`.
  - `src/skillsCombat.ts`: rewrite `combatSkill` stages per style (melee, Ranged, Magic, Defence, Constitution) and refresh Necromancy's stages.
  - `src/lib/components/TrainingMethods.svelte`
- Create: `efficientSlayerRoute(skill: SkillName, profile: Profile)` in `src/slayerMasters.ts`. It returns `{ master: SlayerMaster; feeds: SkillName[]; reason: string } | undefined`, and only for members profiles whose master is Vannaka or above.
- Test: `tests/skill-catalogue.test.mjs` (extend) and `tests/slayer-masters.test.mjs` (extend)

- [ ] **Step 1: Write failing tests:**
  - Every combat-skill option has `checked`/sources on its new fields where judgement is involved.
  - In members mode, members options come first in each stage; in F2P mode the F2P order is kept and no members option shows.
  - `efficientSlayerRoute("Attack", members, combat 110, Slayer 80)` returns Kuradal.
  - F2P returns undefined.
  - A low-level profile returns undefined (Review Focus 5).
  - Every option keeps a valid `gear.minTier` (project 1 rule) where it had one.
- [ ] **Step 2: Run them.** Expected: FAIL.
- [ ] **Step 3: Research and rewrite the focused routes per style.**
  - Use the current Wiki training guides for melee, Ranged, Magic, Necromancy and Constitution as of 2026-11-16.
  - Rank by the best XP for the effort an Ironman can do. Note AFK-friendliness.
  - Non-monster methods are allowed when the Wiki guide recommends them.
  - Keep the existing option IDs where the method stays the same, so saved `trainingMethods` stay valid. Removed IDs fall back as they do today.
- [ ] **Step 4: Update TrainingMethods.svelte.**
  - Show two labelled groups: "Train this skill" (focused) and "Efficient: trains more at once".
  - The efficient group holds the computed Slayer route card, with its master, feeds and reason, linking to `/skills/Slayer`.
  - Leave the group out when the route is undefined.
  - The gear section still follows the selected focused method.
- [ ] **Step 5: Run** `npm test`, `npm run check` and `npm run build`. Expected: green.
- [ ] **Step 6: Commit** "Refresh combat routes and add the Slayer efficient route".

### Task 6: Verify in the app

- [ ] **Step 1:** Run `npm run build`, then start the `preview` launch config.
- [ ] **Step 2:** Save the browser's localStorage exactly before changing anything.
- [ ] **Step 3:** Using fixture profiles, check worked examples 1-3, Review Focus 1-5, and 390px width:
  - members Ironman: combat 110, Slayer 80, Attack 85;
  - a Regular account;
  - F2P at Attack 30.
- [ ] **Step 4:** Restore the saved storage exactly, then stop the preview.
