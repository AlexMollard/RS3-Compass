# Slayer and combat guides: design

Date: 2026-11-16 · Status: draft for Alex's approval
Project 2a of the members pass. 2b, efficient routes for the other skills, and 3, the membership pass over quests and bosses, come later with their own designs.

## Why

Alex plays members on every account now. The combat skill pages say "kill X monster", and in his words "there are more optimal methods and better monsters to kill including doing slayer tasks and what slayer tasks are the best". He wants each skill to say "if you wanna train this skill do this but if you want the most efficient manner that allows skill crossover do this". For Slayer tasks he wants to know whether to do, skip or block a task, how to do it fastest, and what he needs first: "all of them". Many online guides are out of date, so everything has to be checked against the RuneScape Wiki as of 16/11/2026.

## Current state (verified in code, 2026-11-16)

- `SkillRecord.stages[]` has the shape `{from, to, title, members?, options: TrainingOption[]}` (src/data.ts). The recommendation is the player's saved pick, or else `options[0]` after the F2P filter.
- Combat skills come from `combatSkill(...)` in src/skillsCombat.ts:~767. It produces a flat list of monsters (chickens, cows, trolls, ankou, dragons, gargoyles, …) with the F2P options first. Members get the same list, plus a few options at the end.
- The Slayer skill (src/skillsCombat.ts:~1385) has one option per master, each with a one-line `method`. There is no task data.
- The Wiki renders each master's task table with `{{Slayer Tasks by Master|<Master>}}` (Module:Slayer Tasks by Master). The table has monster, amount min/max, combat level, Slayer XP, unlock requirements and weighting.
- The gear section (project 1) already follows the selected method and its `gear.minTier`.

## Goals

1. **Combat skills.** This covers Attack, Strength, Defence, Ranged, Magic, Necromancy and Constitution.
   - Every level range gets a refreshed **focused** route, checked against the current Wiki. When the profile is members, the members methods come first.
   - From the level where Slayer training makes sense, the range also gets an **efficient** route: "Do Slayer tasks from <master>". It names the skills it feeds (all the combat skills, Slayer and Prayer, plus the drops that feed Herblore, Summoning and so on) and links to the Slayer guide.
2. **Slayer guide** (on the Slayer skill page):
   - **Your master.** The best master for the player's Combat and Slayer levels and requirements, and when to move to the next one.
   - **Your task.** A picker over that master's tasks. The chosen task is remembered per character. It shows one card:
     - **Verdict:** Do, Skip or Block, with a one-line reason covering XP rate, the drops that matter for an Ironman, and which other skills it feeds.
     - **Fastest way:** which monster variant and where (map pin through the existing training map), the combat style, whether it's AoE, and key gear or prayer notes.
     - **You need:** the Slayer level, quests and unlocks, shown met, unmet or unknown like the existing requirement chips.
   - **Block list** per master: the tasks to block first, then the ones to skip if you have points, each with its reason.
3. The task facts (lists, amounts, XP, requirements, weights) come from a Wiki import that can be re-run. Verdicts, fastest methods, block lists and routes are hand-written. Each carries `checked: "2026-11-16"` and its Wiki sources.

## Non-goals

- Efficient routes for non-combat skills: that's project 2b.
- The membership pass on quests and bosses: that's project 3.
- Reading the current Slayer task from the player's account. Jagex publishes no such data, so the player picks it.
- Slayer point maths, task streak planning, Slayer reward shop guides, XP/hour calculators and DPS.
- Boss tasks, and special assignments such as Kuradal's Fight Cave challenge or Laniakea's vile blooms. These are listed as notes only.

## Anti-goals (failure even if it works)

- A verdict, method or route presented as fact without its reason, checked date and Wiki source.
- Recommending a task approach the player can't do (a missing quest or unlock) without saying so.
- Advice copied from outdated guides. Each method is checked on its current Wiki page.
- Dropping F2P behaviour: F2P profiles still get full F2P combat routes, and no Slayer-master route beyond the F2P masters.

## Worked examples (acceptance checks)

1. **Members, Attack 85 / Slayer 80, combat 110.**
   - The Attack 80–cap range shows a focused method (a current high-XP melee method from the Wiki) and an efficient route, "Slayer tasks from Kuradal", feeding Slayer, Prayer and the combat skills.
   - The Slayer page says the master is Kuradal and the next is Morvran (85 Slayer, 120 combat, Plague's End).
2. **Picking "Abyssal demons" from Kuradal.**
   - The card shows a verdict with its reason, the fastest location (pinned on the map), the style, and requirements of 85 Slayer plus Morytania access, each marked met or unmet.
   - Reloading the page keeps the task selected.
3. **Edge case: F2P profile, Attack 30.**
   - No efficient Slayer route.
   - The Slayer page offers only the F2P masters (Turael and Jacquelyn, up to Slayer 5, as on the Wiki) and their F2P tasks.
   - Members-only tasks are hidden, not just shown as locked.

## Calls settled after review (my calls unless marked)

- **Account type (Alex's choice).** Verdicts, reasons and block lists are written for Ironmen. Where a regular account should act differently (e.g. a drop an Ironman keeps a task for), the entry carries an optional `mainNote`. That note is shown only on Regular-account profiles. There is no second verdict set.

- **Masters.** The masters are every RS3 master on the Wiki's Slayer Masters table. That includes Morvran (85 Slayer, 120 combat, Plague's End).
  - "Your master" is the highest-requirement master whose requirements the player meets. Higher masters give longer, better-paid tasks, which is the Wiki's own progression.
  - The Raptor and Mandrith (Wilderness) appear as alternatives, each with its trade-off. They are never the default.
  - So for example 1 (combat 110, Slayer 80), the master is Kuradal, and next is Morvran at 85 Slayer and 120 combat.
- **F2P masters** follow the Wiki: Turael and Jacquelyn only, up to Slayer 5. Vannaka is members-only. Example 3 is corrected to match.
- **Coverage.** Hand-written verdicts and methods cover every task from the masters a member actually trains with: Vannaka, Chaeldar, Sumona, Duradel/Lapalok, Kuradal, Morvran and Laniakea, plus the F2P masters' tasks.
  - Any other task still shows its imported facts (amount, XP, requirements, Wiki link) and says "No verdict yet". It is never hidden and never given an invented verdict.
  - A test reports the coverage.
- **Efficient Slayer option** comes from the player's own levels, not one fixed master per range.
  - The option shows "Slayer tasks from <your master>". It needs a combat-level calculation from the Wiki formula, which is added.
  - It appears only once the player can use a members master beyond the starter ones (Vannaka or above).
- **Focused method ranking.**
  - The best XP for the effort that an Ironman can actually do (no Grand Exchange inputs), with AFK-friendliness noted.
  - Non-monster methods count when the current Wiki training guide for that skill recommends them, e.g. combat dummies or Shattered Worlds.
  - Each combat style gets its own list where the Wiki guides differ; there is no single shared monster list.

## Approaches considered

- **A. Import the Slayer facts, hand-write the judgement. (Chosen by Alex.)** This is the same pattern as the gear importer.
- **B. Hand-write everything.** Task weights and requirements drift with game updates.
- **C. Fetch from the Wiki live.** Rejected: it breaks the rule that data lives in the app.

## Design

### Imported facts: `scripts/import-slayer.mjs` → `src/slayerImported.ts`

- Follows the existing importer pattern (scripts/wikiApi.mjs, run by hand, generated file, fails loudly).
- Source: each master's assignment table. Use the Wiki's structured data backend if the module reads one (check `action=bucket` and Module:Slayer Tasks by Master). Otherwise parse the rendered table from `action=parse`.
- Masters: every master the Wiki lists for RS3. That includes the members/F2P status and the master's own requirements (combat level, Slayer level, quests).
- Per task: monster or category name, Wiki page, amount min/max, Slayer XP range, Slayer level, unlock requirements (as text plus parsed skill levels and quest names where possible), weighting, members.

### Hand-written judgement: `src/slayerGuide.ts`

- **Per task, keyed by task name:**
  - verdict (`do`, `skip`, `block`, or `prefer` for tasks worth extending);
  - reason;
  - feeds (`SkillName[]`);
  - fastest method (location, a site with its map tile, style, AoE yes/no, notes);
  - `checked` and `sources`.
  The verdict can differ per master only where the Wiki gives a reason, for example a different assignment amount.
- **Per master:** a block order and a skip list, each with its reason.
- **Master progression:** derived from the imported master requirements.

### Combat routes

- `TrainingOption` gains `route?: "focused" | "efficient"` and `feeds?: SkillName[]`. With no `route`, an option counts as focused.
- `combatSkill(...)` is reworked so that each stage lists its focused options members-first when the profile is members. F2P keeps the F2P order.
- The efficient Slayer option per stage points at the right master for that range, and links to `/skills/Slayer`.
- The method list shows the two routes as labelled groups ("Train this skill" / "Efficient: trains more at once") rather than one flat strip.

### Profile

- An optional `slayerTask?: { master: string; task: string }` on `Profile`. Old saves stay valid, and nothing else is migrated.

## Constraints

- Svelte 5 and SvelteKit, using the existing widgets: ChoiceStrip, TrainingMap, the requirement chips, and Wiki-linked item and monster references.
- CRLF line endings, UTF-8 without BOM. Generated files are never hand-edited.
- The generated Slayer data stays out of the main entry chunk.
- Every hand-written entry carries `checked: "2026-11-16"` and at least one `https://runescape.wiki/w/` source. A test enforces this.

## Left to the builder

- The exact Wiki data source for the tables (Bucket or rendered HTML), verified against real pages.
- How the master recommendation breaks ties when two masters fit.
- Visual details within the existing design system.
