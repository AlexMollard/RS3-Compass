# Gear Recommendations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every skill page and boss page shows the gear for each slot in three columns: best you can have, easier to get, and wear at least. Item facts come from a Wiki import that can be re-run.

**Architecture:**
- A by-hand importer (`scripts/import-equipment.mjs`) reads the Wiki's equipment overview pages and each item's `Infobox Item`, `Infobox Bonuses` and `Infobox Recipe`. It writes `src/equipmentImported.ts`.
- Hand-written judgement sits in `src/equipmentCuration.ts`: exclusions, drop routes and wear-only quests, each with a checked date.
- A pure selector (`src/gearSelection.ts`) turns the imported items, the curation, the profile and the method's minimum tier into rows.
- `TrainingEquipment.svelte` and `bossPage.ts` render those rows.

**Tech Stack:** Svelte 5 / SvelteKit, TypeScript, Node test runner (`node --experimental-strip-types --test`), RuneScape Wiki MediaWiki API through `scripts/wikiApi.mjs`.

**Spec:** `docs/superpowers/specs/2026-11-16-gear-recommendations-design.md`

## Global Constraints

- All facts and judgements are checked against the RuneScape Wiki as of **2026-11-16**. Every curated entry carries `checked: "2026-11-16"` and at least one Wiki source.
- The app never fetches from the Wiki while someone browses. Only the importer goes online, and it is run by hand.
- `src/equipmentImported.ts` is generated: never edit it by hand. Corrections go in `src/equipmentCuration.ts`.
- Saved profiles are unchanged: no new storage fields, no migration.
- Line endings are CRLF and files are UTF-8 without BOM. Create and change files with the Edit and Write tools only.
- Commit messages: imperative subject, no prefixes, no attribution. Author and committer are `Alex Mollard <47443168+AlexMollard@users.noreply.github.com>` (already the repo config).
- Ironman = `profile.kind` is `"Solo Ironman"` or `"Group Ironman"`. Trading inside a group does not make an item easy.
- Wiki fields are verified on 2026-11-16 and are quoted here:
  - `{{Infobox Bonuses |requirements = {{sc|attack|90}} |class = melee |slot = 2h |tier = 90 |type = halberd}}`. For armour, `type` is `power`, `tank` or `hybrid`.
  - `{{Infobox Item |members = Yes |tradeable = Yes |image1 = [[File:X.png]]}}`. Fields may be numbered per version; version 1 is used.
  - `{{Infobox Recipe |skill1 = Smithing |skill1lvl = 50}}`.
  - The overview pages list items through `{{Eqinforow|ge=<name>}}` / `{{Eqinforow|<name>}}` rows and `{{Armour tile|title=...}}`.

## Review Focus

1. **An item page with several infobox versions** (new/used/broken, or augmented variants) must give one item, using version 1's values. A degraded or broken name must not show up as a second item. Owned by Task 1 (`parseItem uses version 1`).
2. **An item whose `requirements` holds two skills** (e.g. `{{sc|attack|80}}{{sc|strength|80}}`) must only count as wearable when both are met. Owned by Task 1 (parser) and Task 3 (`best needs every wear requirement`).
3. **A profile with no levels recorded at all** (a fresh first visit) must show a "Record your <Skill> level" prompt on every row and no item. It must never throw or show bronze. Owned by Task 3.
4. **A slot where the player meets nothing**, e.g. Necromancy 1 when the lowest item is tier 10: Best is empty and shows "Next" as the lowest item with its missing levels. It is not reported as unrecorded. Owned by Task 3.
5. **The boss-page tier text above every item in a line**, e.g. "tier 99": it picks the highest item at or below the stated tier, and never an empty kit when items exist. Owned by Task 5.

---

### Task 1: Wiki equipment parser

**Files:**
- Create: `scripts/equipmentWikitext.mjs`
- Test: `tests/equipment-import.test.mjs`

**Interfaces:**
- Produces:
  - `parseListPage(wikitext: string): string[]`. It returns the item names from `Eqinforow` rows and from item links inside `Armour tile` sections, de-duplicated, in page order.
  - `parseItem(name: string, wikitext: string): ImportedItem | undefined`. It returns `undefined` when the page has no `Infobox Bonuses`.
  - `parseRequirements(text: string): { skill: SkillName; level: number }[]`. Skill names are capitalised to match `src/skillNames.ts`.
  - `ImportedItem`, defined in Task 2's `src/equipmentTypes.ts`:
    `{ name, wiki, image?, slot: "2h"|"mh"|"oh"|"head"|"body"|"legs"|"hands"|"feet"|"ammo"|..., class: "melee"|"ranged"|"magic"|"necromancy"|"none", tier: number, armourType?: "power"|"tank"|"hybrid", wear: {skill, level}[], members: boolean, tradeable: boolean, recipe?: {skill, level} }`

- [ ] **Step 1: Write failing tests** with inline wikitext fixtures copied from the real pages (Noxious scythe, Rune platebody, Elder rune platebody + 5, plus a cut-down Melee armour excerpt):
  - `parseItem("Noxious scythe", …)` deep-equals:
    - `slot: "2h"`, `class: "melee"`, `tier: 90`
    - `wear: [{skill:"Attack", level:90}]`
    - `members: true`, `tradeable: true`, `recipe: {skill:"Crafting", level:90}`
    - `image: "Noxious_scythe.png"`
  - `parseItem("Rune platebody", …).armourType === "tank"` and `.members === false`.
  - `parseRequirements("{{sc|attack|80}}{{sc|strength|80}}")` returns two entries.
  - `parseListPage(meleeArmourExcerpt)` includes `"Bronze platebody"` and excludes the rows' `dontaddtototal` flag text.
  - `parseItem("Plain item", "{{Infobox Item|name=Plain}}") === undefined`.
- [ ] **Step 2: Run** `node --experimental-strip-types --test tests/equipment-import.test.mjs`. Expected: FAIL (module missing).
- [ ] **Step 3: Implement** in `scripts/equipmentWikitext.mjs`, following the template-field reading style of `scripts/bossWikitext.mjs`. Use version-1 values: `field1` if present, else the unnumbered field.
- [ ] **Step 4: Run the same command.** Expected: PASS.
- [ ] **Step 5: Commit** "Parse Wiki equipment infoboxes".

### Task 2: Importer, types and curation

**Files:**
- Create: `scripts/import-equipment.mjs`, `src/equipmentImported.ts` (generated), `src/equipmentCuration.ts`
- Modify: `src/equipmentTypes.ts` (add `ImportedItem`, `GearRoute`, `GearCuration`)
- Test: `tests/equipment-catalogue.test.mjs`

**Interfaces:**
- Consumes: Task 1's parser functions.
- Produces:
  - `EQUIPMENT_IMPORTED: ImportedItem[]` (from `src/equipmentImported.ts`).
  - `GearRoute = { kind: "smith"|"craft"|"shop"|"common-drop"|"rare-drop"|"reward"|"quest"|"unknown"; note: string; levels?: {skill, level}[]; quests?: string[]; unlocks?: string[]; members?: boolean }`.
  - `EQUIPMENT_CURATION`:
    `{ exclude: string[]; routes: Record<string, GearRoute & { checked: string; sources: string[] }>; wearQuests: Record<string, { quests: string[]; checked: string; sources: string[] }>; checked: string }`
  - `routeFor(item: ImportedItem): GearRoute`. Lookup order:
    1. A curated route for the item.
    2. A route derived from `recipe` (Smithing → `smith`, Crafting/Fletching/Runecrafting/Necromancy rituals → `craft`, using the recipe's level).
    3. `{ kind: "unknown", note: "See the Wiki for how to get it." }`.
  - `EASY_KINDS = ["smith","craft","shop","common-drop","reward","quest"]`.

- [ ] **Step 1: Write the importer.**
  - Pages: `Melee weapons`, `Melee armour`, `Ranged weapons`, `Ranged armour`, `Magic weapons`, `Magic armour`, `Necromancy weapons`, `Necromancy armour`, plus the tool pages for the skills that have a tool guide today. Check `SKILLING_EQUIPMENT` keys for the list; e.g. `Pickaxe`, `Hatchet`.
  - For each page: list names → fetch item pages → `parseItem` → drop curated exclusions → `servedFiles` for images → write a sorted TS array with a header comment marking the file as generated.
  - Print one review line per item: name, class, slot, tier, wear, route kind.
  - Exit non-zero if a listed page is missing, or if a non-excluded item has no tier or no wear requirement.
- [ ] **Step 2: Seed `src/equipmentCuration.ts`.**
  - `exclude`: cosmetic, holiday and discontinued items found in the review output.
  - `routes`: every non-recipe item at tier 70+ in a combat class (boss drops), each marked `rare-drop` / `common-drop` / `reward` with a Wiki source. Carry over the reviewed acquisition notes that exist today in `src/equipmentCombat.ts` and `src/equipmentSkilling.ts`.
  - `wearQuests`: items that need a quest to equip.
  - Everything carries `checked: "2026-11-16"`.
- [ ] **Step 3: Run** `node --experimental-strip-types scripts/import-equipment.mjs`. Expected: it exits 0, writes `src/equipmentImported.ts`, and prints the review lines. Review them and fix the curation until no tier-70+ combat item has an `unknown` route.
- [ ] **Step 4: Write `tests/equipment-catalogue.test.mjs`:**
  - Every imported item has a tier from 1 to 120 and a valid wear skill.
  - No item name appears twice.
  - No excluded name is present.
  - Every curated route and wear quest has `checked === "2026-11-16"` and at least one `https://runescape.wiki/w/` source.
  - Every curated route's name exists in `EQUIPMENT_IMPORTED`.
  - Every tier-70+ combat item resolves to a non-`unknown` route.
  - Each of melee, ranged, magic and necromancy has a body item at tier 90 or higher. This catches the "behind" regression.
- [ ] **Step 5: Run** `npm test`. Expected: the new tests pass; the existing tests are still green.
- [ ] **Step 6: Commit** "Import equipment facts from the Wiki".

### Task 3: Gear selection

**Files:**
- Create: `src/gearSelection.ts`
- Test: `tests/gear-selection.test.mjs`

**Interfaces:**
- Consumes: `EQUIPMENT_IMPORTED`, `routeFor`, `EASY_KINDS`, `EQUIPMENT_CURATION.wearQuests`, `levelStatus` (`src/lib/levelStatus.ts`), `Profile`.
- Produces:
  - `GearClass = "melee"|"ranged"|"magic"|"necromancy"|"tool"`.
  - `GearPick = { item: ImportedItem; route: GearRoute; missing: {skill, level, recorded?}[]; missingQuests: string[] }`.
  - `GearRow = { row: "2h"|"main hand"|"off hand"|"head"|"body"|"legs"|"hands"|"feet"|"ammo"|"tool"; best?: GearPick; easier?: GearPick; atLeast?: GearPick & { reason: string }; next?: GearPick; unrecorded?: SkillName }`.
  - `selectGear(options: { class: GearClass; profile: Profile; minTier?: number; minReason?: string; maxTier?: number; items?: ImportedItem[]; toolSlot?: string }): GearRow[]`. Rows come in the order of the `row` union. `items` defaults to `EQUIPMENT_IMPORTED`; it is overridable for tests.

**Rules (from the spec, exact):**
- Candidates: the item's class matches, members items are only included when `profile.mode === "members"`, and `maxTier` is respected when given.
- **Wearable:** every `wear` entry has `levelStatus(...) === "met"`, and every wear quest is in `profile.completedQuests`. Wear quests are stored as quest IDs from `QUESTS` in `src/data.ts`; the Task 2 catalogue test asserts that every ID exists.
- If any candidate's wear skill is unrecorded and nothing in the row is wearable, set `unrecorded` and leave Best empty.
- **best:** the highest tier among wearable items. Tie-breaks:
  1. For armour, power before tank.
  2. Hybrid is never picked.
  3. Otherwise the order stays stable by name.
- **easier:** the same rule, limited to items where `EASY_KINDS.includes(route.kind)`. For a Regular account, `tradeable` also counts as easy. It is omitted when it is the same item as best.
- **atLeast:** the lowest-tier item with `tier >= minTier`, preferring easy routes. Its `missing` lists unmet wear levels.
- **next:** the lowest-tier item above best, with its missing levels.
- Weapon rows: `2h`, `main hand`, `off hand`. They are never merged.

- [ ] **Step 1: Write failing tests**, using `items:` fixtures built with a small `item()` helper:
  - `worked example 1`:
    - Setup: members Ironman, Attack 85 / Defence 82, items: bane 2h (80, smith), boss 2h (80, rare-drop), elder 2h (90, smith).
    - 2h best is the tier-80 boss item, or the first by name on a tie. Easier is the bane 2h. Next is the elder 2h.
    - Body is judged on Defence 82: an 85 body is not best.
  - `worked example 2 F2P hides members and dedupes easier`: F2P, Ranged 45. Best equals what easier would have been, so `easier === undefined`, and no members item is in any pick.
  - `worked example 3 unrecorded Defence`: armour rows have `unrecorded === "Defence"` and no best. The 2h row still has a best from Attack.
  - `best needs every wear requirement`: an item with Attack 80 + Strength 80, at Attack 85 / Strength 70, is not best.
  - `power beats tank at equal tier`, and `hybrid is never best`.
  - `regular account counts tradeable as easy`: a tradeable rare drop is easier for a Regular account, but not for a Group Ironman.
  - `wear quest blocks best` when the quest isn't in the profile's completed quests.
  - `nothing wearable shows next` (Review Focus 4).
  - `empty profile prompts` (Review Focus 3): there is no throw, and every row is unrecorded or has a next.
  - `atLeast prefers an easy route at minTier`.
- [ ] **Step 2: Run** `node --experimental-strip-types --test tests/gear-selection.test.mjs`. Expected: FAIL.
- [ ] **Step 3: Implement `selectGear`** in `src/gearSelection.ts`. Map Wiki slots to rows as follows: `2h`→`2h`, `mh`→`main hand`, `oh`→`off hand`, armour slots by name. Tools use a single `tool` row.
- [ ] **Step 4: Run the same command.** Expected: PASS.
- [ ] **Step 5: Commit** "Pick best, easier and minimum gear per slot".

### Task 4: Method minimums and the skill-page component

**Files:**
- Modify: `src/data.ts` (`TrainingOption` gets `gear?: { minTier: number; reason: string; checked: string }`), `src/skillsCombat.ts`, `src/skillsCore.ts`, `src/skillsArtisan.ts`, `src/skillsSupport.ts` (add `gear` to combat methods and to tool-using skilling methods)
- Rewrite: `src/lib/components/TrainingEquipment.svelte`
- Modify: `src/trainingEquipment.ts`:
  - Replace `selectEquipment` / `resolveTrainingEquipment` with `trainingGear(skill, method, profile, style): { rows: GearRow[]; extras: EquipmentRecommendation[] }`.
  - `extras` holds today's optional and conditional items (Slayer finishers, protection, earmuffs and so on), kept from the existing guides' `optional` / `condition` items.
- Test: `tests/training-equipment.test.mjs` (rewrite)

**Interfaces:**
- Consumes: `selectGear`.
- Produces: `trainingGear(...)`. Class mapping:
  - Attack, Strength → melee
  - Ranged → ranged
  - Magic → magic
  - Necromancy → necromancy
  - Defence, Constitution, Slayer → the chosen style
  - Skills with a tool guide → tool

- [ ] **Step 1: Rewrite the test file:**
  - Every combat-skill method has `gear` with `checked === "2026-11-16"` and a non-empty reason.
  - `trainingGear` for Attack at Attack 85 returns a `2h` row and `main hand` / `off hand` rows.
  - For Slayer, `extras` still includes `Rock hammer` on gargoyles.
  - For Defence with style Ranged, rows come from the ranged class.
  - Keep the existing item-reference checks (art names, `tokenizeGameText` links) and point them at the imported items.
- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Add the `gear` minimums.**
  - Use one judgement per method, with a reason that names the monster's threat. Check each against the method's monster Wiki page as of 2026-11-16.
  - Skilling methods with no meaningful minimum get none.
- [ ] **Step 4: Implement `trainingGear`.**
  - Rebuild `EQUIPMENT_ITEMS` from `EQUIPMENT_IMPORTED` plus the extras, so `src/lib/gameText.ts` links keep working.
  - Delete the item ladders in `src/equipmentCombat.ts` / `src/equipmentSkilling.ts` that are now imported. Keep the extras and `EQUIPMENT_MATERIALS`.
- [ ] **Step 5: Rewrite the component.**
  - One table: `Slot · Best you can have · Easier to get · Wear at least`. Each cell shows GameArt, a Wiki-linked name, a one-line route note and missing-level chips.
  - An `unrecorded` row shows "Record your <Skill> level" with a link to the existing level editor.
  - A "Next:" line goes under Best.
  - "Wear at least" carries an "our pick" label with the reason.
  - Extras appear as a flat list under the table.
  - Below 640px each row becomes a stacked card with labelled picks.
  - Remove the doll, the `<details>` collapsibles and the `WORN_LAYOUT` import if it becomes unused.
  - Keep the style `ChoiceStrip` for Defence, Constitution and Slayer.
- [ ] **Step 6: Run** `npm test` and `npm run check`. Expected: all pass, and svelte-check reports 0 errors and 0 warnings.
- [ ] **Step 7: Commit** "Show best, easier and minimum gear on skill pages".

### Task 5: Boss pages on the new selection

**Files:**
- Modify: `src/lib/bossPage.ts` (`setupGear`)
- Test: `tests/boss-page.test.mjs`

**Interfaces:**
- Consumes: `selectGear`.
- Produces: `setupGear(style, text, members): ImportedItem[]` keeps its signature apart from the return type. It takes each row's best pick from `selectGear({ class: style, profile: <a profile with every level 120 and the given mode>, maxTier: statedTier(text) })`. It drops the `off hand` / `main hand` rows when a `2h` exists.

- [ ] **Step 1: Add tests:**
  - "tier 99" returns a non-empty kit (Review Focus 5).
  - "tier 80" melee returns no item above tier 80.
  - When the text states no tier, it still returns `[]`.
  - F2P excludes members items.
- [ ] **Step 2: Run** `node --experimental-strip-types --test tests/boss-page.test.mjs`. Expected: FAIL.
- [ ] **Step 3: Implement**, then update `BossGuide.svelte` for any field renames.
- [ ] **Step 4: Run** `npm test`. Expected: PASS.
- [ ] **Step 5: Commit** "Use imported gear on boss pages".

### Task 6: Verify in the app

- [ ] **Step 1: Run** `npm run build`. Expected: it succeeds, with 0 svelte-check errors and warnings.
- [ ] **Step 2: Start the preview** (`.claude/launch.json`) and use a fixture profile (members Ironman, Attack 85 / Defence 82) to check:
  - Attack shows the 2h and dual-wield rows.
  - Defence unrecorded shows the prompt.
  - F2P hides members gear.
  - Gargoyles on Slayer list the rock hammer.
  - A boss page renders its kit.
  - At 390px wide, rows stack with no horizontal overflow.
- [ ] **Step 3: Restore** the browser's original profiles and save exactly, then close the preview.
