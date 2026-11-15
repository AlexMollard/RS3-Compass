# Gear recommendations: design

Date: 2026-11-16 · Status: draft for Alex's approval
Project 1 of 3. Project 2 covers the training guides and Slayer, and project 3 covers the membership pass over quests and bosses. Both follow later with their own designs.

## Why

Alex is now a member on every account. In his words, the equipment section on each skill page is "pretty awful ui/ux, and half the time the recommended is wrong". It is "always way behind", so he has to check the Wiki anyway. When he opens it he wants three answers:

- the best gear he can currently wear;
- where to get it;
- what he should at least be wearing.

He then asked for both "best i can have and the easier to get alternative".

## Current state (verified in code, 2026-11-16)

- `src/trainingEquipment.ts` `selectEquipment` / `resolveTrainingEquipment` are rendered by `src/lib/components/TrainingEquipment.svelte`. The component is used only from `TrainingMethods.svelte` on skill pages.
- The data in `src/equipmentCombat.ts` (1195 lines) and `src/equipmentSkilling.ts` (750 lines) is all hand-written. No import script exists for it.
- Why the recommendation is wrong:
  - The "target kit" is capped at the **bottom** of the selected level range (`planningLevel = stage.from`). In the 50–80 range, a 79 player is shown level-50 (rune) gear.
  - Items are bucketed by slot with a single `from` number. Weapon and armour checks are not judged per item against the player's real wear levels.
  - When a required level hasn't been recorded, the pick falls back to the lowest-tier item, which is bronze.
  - The melee 2h swords don't carry `twoHanded`, so an off hand can still be suggested next to one.
  - The catalogue stops at older tiers for several styles, so the best item it knows about is behind the game.
- Layout: a doll plus a list, followed by three collapsibles ("Current-level alternatives", "Other upgrades", "Optional equipment").

## Goals

1. For every gear slot on a skill page, show three answers on one row:
   - **Best you can have**: the strongest item whose wear requirements your recorded levels meet, whatever its source.
   - **Easier to get**: the strongest item you meet the levels for whose source is easier, when it's a different item from Best. For an Ironman that means smithing, crafting, a shop, a common drop or a reward. For a main account, anything tradeable on the Grand Exchange counts as easy.
   - **Wear at least**: the minimum sensible item for the selected training method or activity.
2. Each pick shows where to get it, using Ironman routes on Ironman profiles. It also lists any missing requirement for that route (skill levels, quests, unlocks), shown as a gap the way it is today.
3. Gear facts come from a Wiki import that can be re-run, so the catalogue stops falling behind. Facts covered: item name, slot, combat style, tier, wear requirements, members, two-handed, tradeable and image.
4. The same three-column layout also applies to skilling tools (pickaxe, hatchet, and so on), because the component is shared.
5. Every hand-written judgement carries a "checked on" date and its Wiki source. All facts and judgements are checked against the Wiki as of 16/11/2026, not older guides.

## Non-goals

- The training guides, efficient routes and Slayer task advice. Those are project 2.
- The membership review of quests and bosses. That is project 3.
- Per-boss or per-content best-in-slot builds, perk and invention setups, ability bars or DPS maths.
- Telling which items the player owns. Nothing public exposes inventory or bank, and picks never imply ownership.
- Cosmetic, holiday and discontinued items.

## Anti-goals (failure even if it works)

- Recommending gear the player can't wear at their recorded levels as "Best you can have".
- Falling back to bronze when a level is unrecorded. Show "Record your Defence level" instead.
- Presenting Wiki-scraped judgement as fact, or shipping data that hasn't been checked against the current Wiki.
- Fetching from the Wiki while someone browses. All data lives in the app.

## Worked examples (acceptance checks)

1. **Melee member, Attack 85 / Defence 82, Ironman, Attack 80–cap range.**
   - Weapon: Best is the strongest 2h melee weapon needing 85 Attack or less, e.g. a level-80 boss drop. Easier is the best smithable 2h at or below 85 Attack, i.e. bane (80). Wear at least is whatever the method's minimum is.
   - Body: the same pattern, judged on Defence 82, not the 80 at the bottom of the range.
2. **F2P profile, Ranged 45.**
   - Members items are hidden.
   - Best and Easier are the same item, so it is shown once.
   - Easier never shows a members-only drop.
3. **Edge case: Defence unrecorded.**
   - Armour rows say "Record your Defence level" and give a link to update levels. They don't show bronze.
   - The weapon row still works off Attack.

## Approaches considered

- **A. Hand-write everything (as now).** Simple, but it falls behind again after every game update.
- **B. Import facts from the Wiki, hand-write the judgement. (Chosen by Alex.)** Re-running the import refreshes the facts. Upfront work goes into parsing the Wiki's markup.
- **C. Live Wiki fetch while browsing.** Rejected: it breaks the existing rule that data lives in the app, and it's slow and fragile.

## Design

### Imported facts: `scripts/import-equipment.mjs` → `src/equipmentImported.ts`

- Follows the existing importer pattern: `scripts/wikiApi.mjs` helpers, run by hand with network access, writing a generated file that isn't edited by hand. Parsing goes in a small `scripts/equipmentWikitext.mjs` with unit tests on fixtures, like `questWikitext.mjs` / `bossWikitext.mjs`.
- Input: the Wiki's equipment tier tables for each style and slot (melee, ranged, magic and necromancy weapons and armour), plus the skilling tool tables. Pulling the item *lists* from the Wiki is what keeps the catalogue current: a new item shows up when the import is re-run. A hand-written exclusion list drops cosmetic, holiday and discontinued items. Augmented versions are treated as the base item. Degradable items are included, with a note.
- Fields per item, read from the item's infobox and bonuses template:
  - name and Wiki page
  - image
  - slot
  - style (melee, ranged, magic, necromancy, or none for tools)
  - tier
  - wear requirements (skill and level, including more than one skill)
  - members
  - two-handed
  - tradeable
- The script prints a review line per item and fails loudly on a missing page or missing requirements. It never writes guesses.

### Hand-written judgement: equipment lines

The hand-written layer replaces most of today's per-item metadata in `equipmentCombat.ts` / `equipmentSkilling.ts`.

- A **line** is a ladder of imported items for one style, slot and setup, with an acquisition route per item. Weapons have two setups, each its own row (Alex's choice):
  - **2h**: one weapon row.
  - **Dual-wield**: a main-hand row and an off-hand row.
- Armour lines are **power armour** for training (my call), so its extra Strength, Ranged or Magic requirement counts as a wear requirement. Tank and hybrid armour are left out of training picks.
- Any quest, achievement or unlock needed to *wear* an item is written into its line as a wear requirement, because the infobox doesn't hold these reliably. "Best you can have" checks them (my call).
- Each route carries:
  - its kind: smith, craft, shop, common drop, rare drop, reward or quest;
  - an Ironman note;
  - its requirements (skills, quests, unlocks), carried over from today's `EquipmentAcquisition`.
- Each skill-page method declares its style and its **wear at least** item per slot.
- Each line and each method minimum has `checked: "2026-11-16"` and Wiki source links.
- **Wear at least** is a judgement, and the page labels it that way ("our pick", with a one-line reason and a Wiki link). Skilling methods where a minimum doesn't mean anything have none (my call).
- Ironman vs main uses the profile's `kind`. Solo Ironman and Group Ironman are both Ironman, and trading inside a group doesn't make an item easy (my call). Regular accounts count tradeable items as easy (Grand Exchange).
- **Boss pages:** `src/lib/bossPage.ts` reads the old combat equipment data today. It moves to the new selection, with the boss's recommended tier as its "wear at least" (my call).

### Selection (rewrite of `selectEquipment`)

- **Best** for each slot: the highest-tier item in the line whose every wear requirement (skill levels plus any recorded quest or unlock) is met by the player's recorded data. It respects the members toggle. The 2h row and the dual-wield rows are shown side by side, never mixed in one row.
- **Easier**: the same filter, limited to easy route kinds (or tradeable for mains). It is hidden when it's the same item as Best.
- If a required level is unrecorded, there is no pick, only the prompt to record it.
- **Wear at least** comes from the method. It is flagged when the player can't yet wear it.
- **Above your levels:** the next item above Best in each line, shown as the goal with its missing levels. This replaces today's "target kit" and "Other upgrades", and supersedes the 2026-11-05 rule that the target kit follows the selected range.
- Defence, Constitution and Slayer keep the style picker (melee, ranged, magic, necromancy).

### Layout (`TrainingEquipment.svelte`)

- One table of slots: **Slot · Best you can have · Easier to get · Wear at least**. Each cell shows the item art, a Wiki-linked name and a one-line source plus gaps. It replaces the doll and all three collapsibles.
- Optional and conditional items, such as Slayer finishers and protection, sit in a short flat list under the table, not behind a collapsible.
- On phone widths each slot becomes a stacked card with the three picks labelled.

## Constraints

- Svelte 5 and SvelteKit, using the existing shared widgets (item references link art and name to the same Wiki page, no coloured link backgrounds).
- Existing saved profiles stay valid. Nothing changes in saved data.
- CRLF line endings, UTF-8 without BOM.
- `tests/training-equipment.test.mjs` is rewritten around the worked examples above. It also gets the importer parser tests.

## Left to the builder

- The exact Wiki templates and fields to parse, verified against real pages.
- How ties within a tier are ordered (e.g. two tier-80 2h weapons).
- Visual details within the existing design system.
