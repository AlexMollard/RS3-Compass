# Necromancy guide: design

Date: 2026-11-16 · Status: draft for Alex's approval
This is the first of the combat-style overhauls. Each style gets its own page layout, as Slayer did. Melee, Ranged and Magic follow later, each with its own design.

## Why

Alex wants each combat style rebuilt like the Slayer guide, because a style has progress that levels don't capture: unlocks, gear upgrades and the monsters worth fighting. When he opens Necromancy, the page should answer three things:

- **what gear to wear**;
- **what to kill next**, both for XP and for progress;
- **the ritual stuff**.

Everything is checked against the RuneScape Wiki as of 16/11/2026.

## Current state (verified 2026-11-16)

- **Skill page.** The Necromancy skill page uses the generic layout:
  - level-range stages and methods (`src/skillsCombat.ts`, refreshed in the Slayer/combat project);
  - the gear table (`TrainingEquipment`);
  - the efficient "Slayer tasks from your master" card.
- **What's missing.** Nothing covers rituals, gear upgrades, storyline unlocks or souls.
- **Membership.** Members up to 120, with an F2P cap of 20. Only the tier 10 gear is free-to-play. (Wiki: Necromancy, Necromancy armour.)
- **Weapons.** The Death guard and Skull lantern upgrade from tier 10 to 90 at the soul forge.
  - Each tier needs Kili's task: Kili Row for T20, then Kili's Knowledge I–VII for T30–T90. T70 also needs The Spirit of War.
  - Each tier also needs ensouled bars, made by rituals, plus necrotic runes from T60.
  - Source: Template:Death Skull upgrades.
- **Robes.**
  - Deathwarden (tank) follows the same tiers.
  - Deathdealer (power) branches from T60 at T70, T80 and T90. It needs the power Kili tasks, which are boss kills, and hermodic plates from Hermod.
- **Tier 95.** First Necromancer's equipment from Rasial (Alpha vs Omega, Necromancy 95, 30,000 souls). Devourer's Guard from Amascut (Eclipse of the Heart).
- **Dungeoneering-token branches.** Gravite (55), Chaotic (80) and Ruinous (90).
- **Storyline.** Necromancy!, Rune Mythos (24), Vessel of the Harbinger (46), The Spirit of War (65, 3,000 souls), Tomes of the Warlock (75), Remains of the Necrolord (85), Alpha vs Omega (95). Kili Row (20) gives ensoul rituals and Kili's tasks. Requiem for a Dragon opens the Ungael ritual site.
- **Rituals.** All of them are in `Module:Necromancy/rituals/data`, a Lua table: rituals with level, tier, inputs, outputs, ticks and XP, plus glyphs and disturbances.
  - The Um site tiers unlock at 1, 60 and 90.
  - Glyph inks: basic, regular (20), greater (60) and powerful (90).
- **Training guide.** The Wiki's Necromancy training guide gives:
  - communion to 26;
  - quests at 26–27;
  - combat 27–90, upgrading every 10 levels: ghostly trolls, then ankou/ghouls, armoured zombies and bound skeletons, abyssal demons and savages;
  - powerful rituals as the fastest active method from 90.

  The Ironman guide is Ironman Mode/Strategies/Necromancy.
- **Gear data.** Gear and drops are in the Wiki's Bucket tables (`infobox_bonuses`, `dropsline`), which the gear importer already reads. The Necromancy weapons page's damage table is stale; use Bucket.

## Goals

The Necromancy skill page gets its own layout, top to bottom:

1. **Your progress.**
   - The storyline quests in order, each shown as done, next or locked, with what it unlocks and its requirements (Necromancy level, souls, other skills). Quest status comes from `completedQuests`, using the existing quest chips.
   - A souls line: the player's recorded souls, against the next soul gate (3,000 / 4,500 / 8,500 / 30,000 / 35,000, per the Wiki).
2. **Gear path.**
   - The weapon line (Death guard and Skull lantern) and the robe line (Deathwarden, with Deathdealer branching at T70) as tier ladders. The current tier is marked.
   - The next step lists its wear level, Kili task, upgrade materials (ensouled bars and runes) and quests, each shown as met, unmet or unknown.
   - Tier 95 appears as the end of the path: Rasial's set and Devourer's Guard, with their boss and requirements.
3. **Kill next.** One card with two rows:
   - **For XP:** the best monster for the player's Necromancy level, from the refreshed training stages, with where and why.
   - **For progress:** the target that moves the next gear step or unlock forward. Examples: a Kili task's bosses, Hermod for hermodic plates, Rasial at 95, or "run ensoul rituals" when the next step needs bars rather than a kill.
4. **Rituals.**
   - Rituals the player can run now, and the next one they'll unlock. Each shows level, tier, inputs → outputs, XP and duration.
   - The site tier (1/60/90) and the glyph inks it needs.
   - One line on disturbances and soul attraction.
   - A "for your next upgrade" marker on the ensoul ritual that makes the bars the next gear step needs.
5. **The training methods** (the existing focused list and the efficient Slayer card) stay below.

## Settled with Alex

- **Approach A (Alex chose it):** import the facts, hand-write the judgement, the same pattern as Slayer.
- **Recorded progress (Alex chose A, falling back to B).**
  - The player records their current weapon tier, robe tier and robe line (Deathwarden or Deathdealer), and their souls. Everything is optional and stored per character.
  - When nothing is recorded, the page infers the expected tier from Necromancy and Defence levels: the highest tier whose wear level the player meets, capped by the upgrades their quests allow. It labels the result "assumed from your levels".
  - Souls with no recorded value show as unknown, never as 0.
- **Kill next shows both** an XP target and a progress target.

## Calls I made (Alex can overrule)

- **Robes.** The main robe line is Deathwarden. Deathdealer appears as a branch from T70, with its boss-kill tasks spelled out. The player's recorded robe line picks which one is "next".
- **Dungeoneering-token weapons** (Gravite, Chaotic, Ruinous) appear as a side note on the weapon path ("alternative: buy with Dungeoneering tokens"), not as main steps. Costs are cited, and anything the Wiki contradicts is marked unverified.
- **Ironman framing.** Judgement is written for an Ironman, matching Slayer. A regular-account note appears only where the advice differs (e.g. buying bars).
- **F2P profiles** see the page capped at 20: tier 10 gear, Necromancy!, and lesser communion and lesser necroplasm. Members-only rituals, quests and tiers are hidden, not shown as locked.
- **Not tracked.** Talents and the full soul-talent tree are listed only as the soul gates above. Glyph and light placement, ritual profit and XP/hour calculators are left out.
- **How you record things.**
  - The Gear path window has a tier picker for weapons and one for robes, plus a robe-line picker. These use ChoiceStrip, with T10–T90 plus "not recorded".
  - The Progress window has a numeric souls field with a save button. It accepts a whole number from 0 up, or blank for "not recorded".
  - Everything saves straight away, per character, through the profile store.
- **Tiers are tracked separately.** The weapon tier and the robe tier are separate numbers. Upgrade materials are imported per line and per tier:
  - the weapon line, per weapon, from Template:Death Skull upgrades;
  - the robe line, per slot, from the Deathwarden and Deathdealer pages.

  Worked examples 1 and 2 quote weapon materials.
- **What can be checked.**
  - Levels and quests show as met or unmet.
  - Souls show as met or unmet when recorded, and unknown otherwise.
  - Kili tasks and materials are always "check in game": they're never met and never unmet. There is no per-requirement ticking.
- **The assumed tier when nothing is recorded** is the highest tier whose wear level the player meets, capped at T60 until The Spirit of War is done. Kili tasks are not considered, because they aren't visible. The page labels it "assumed from your levels".
- **One progress target per gear step.** The target is the first open item, in this order:
  1. an unmet quest ("Complete The Spirit of War");
  2. the Kili task, naming its targets;
  3. the boss drop it needs (hermodic plates from Hermod);
  4. the materials, as "run <ensoul ritual>".

  Once the T90 weapon is done, the target becomes the tier 95 boss the player qualifies for next.
- **F2P** shows four things:
  - the storyline with Necromancy! only;
  - the gear path to T10;
  - the free rituals up to level 20;
  - the Kill-next XP row capped at 20.

  The souls line, the progress row, members tiers and the Slayer card are hidden.
- **One gear table only.** The guide's gear path shows the ladders and the next step. It doesn't render a second gear table. The existing best / easier / wear-at-least table stays in the training methods below, following the method picked there.

## Worked examples (acceptance checks)

1. **Members, Necromancy 64, Defence 60, Kili Row and Rune Mythos done, nothing recorded.**
   - Gear path says "assumed T60 from your levels". The next step is T70, which needs Kili's Knowledge V, The Spirit of War (unmet), 4 ensouled bars and 50 bone runes per weapon.
   - Progress shows The Spirit of War as next, with 3,000 souls unknown.
   - Kill next: XP is armoured zombies (60–70). Progress is "Complete The Spirit of War". The ensoul material ritual (60) is marked "for your next upgrade".
2. **Same player, recorded weapon T50 and 3,200 souls.**
   - Gear path shows T50 → T60: Kili's Knowledge IV, 3 ensouled bars and 25 bone runes.
   - The souls line shows 3,000 met.
3. **Edge case: F2P, Necromancy 15.**
   - Progress shows only Necromancy!. Gear stops at tier 10. Rituals show only the free ones at their levels.
   - There is no Kill-next progress row beyond the F2P cap, and no Slayer card.
   - The page says training stops at 20 for free-to-play.

## Non-goals

- Melee, Ranged and Magic pages (later designs).
- Reading gear, souls or talents from the account (Jagex doesn't publish them).
- Ritual profit, XP/hour or DPS maths, and glyph placement planning.
- Quests and bosses outside the Necromancy storyline.

## Anti-goals

- A tier, ritual or target shown as fact without its checked date and Wiki source.
- Telling the player to do something they can't (an unmet quest, souls or task) without saying so.
- Treating an unrecorded tier or souls value as 0, or as met.
- Copying stale numbers: weapon stats come from Bucket, not the stale weapons table.

## Design

### Imported facts: `scripts/import-necromancy.mjs` → `src/necromancyImported.ts`

- Rituals and glyphs come from `Module:Necromancy/rituals/data` (Lua, parsed like the Slayer modules).
- Weapon and robe tiers come from the Wiki's Bucket and templates. That covers wear levels, upgrade materials per tier (Template:Death Skull upgrades and the Deathwarden robes pages) and drop sources.
- The importer runs by hand, fails loudly on unknown input, writes a generated file that's never hand-edited, and stays out of the main entry chunk.

### Hand-written judgement: `src/necromancyGuide.ts`

- The storyline order and what each quest unlocks.
- The soul gates.
- The Kill-next rules: XP targets per level range, reusing the refreshed training options, plus progress targets per gear step or unlock.
- Every entry carries `checked: "2026-11-16"` and Wiki sources, and a test enforces this.

### Profile

`necromancy?: { weaponTier?: number; robeTier?: number; robeLine?: "deathwarden" | "deathdealer"; souls?: number }` is optional. Old saves stay valid, and validation rejects bad shapes.

### Page

- `NecromancyGuide.svelte` is lazy-loaded on the Necromancy skill page, the way SlayerGuide is.
- It reuses the requirement chips, ChoiceStrip, GameWindow, TrainingMap, TrainingEquipment and CheckedSources.
- The generic level-range strip stays below the guide. Unlike Slayer, Necromancy's level methods don't contradict the guide.

## Constraints

- Svelte 5 and SvelteKit, using the existing components.
- CRLF line endings, UTF-8 without BOM.
- Necromancy data stays out of the main entry chunk.
- At 390px wide, everything stacks with no horizontal overflow.

## Left to the builder

- The exact Bucket queries and the Deathwarden materials source.
- Visual details within the design system.
