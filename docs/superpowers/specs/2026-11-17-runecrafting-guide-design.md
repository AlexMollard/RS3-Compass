# Runecrafting guide: design

Date: 2026-11-17 · Status: approved by Alex 2026-11-17 · Mockup: https://claude.ai/artifact/PfZBZbzcZNugp5PhZ7ndkK

The Runecrafting skill page gets its own layout, as Slayer did and Necromancy will. It is written for members, and mostly for Ironmen.

## Why

Alex plays members on all accounts, mostly Ironman. The current page is the generic level-range layout. It still plans around the Runespan and blood pools, and its access note and training link are written for free-to-play. When Alex opens Runecrafting, the page should answer three things:

- **what to craft now**, for XP and for the runes he needs;
- **what to unlock next**: pouches, altars, bonus levels and multiple-rune thresholds;
- **how to build a back stock** of a chosen rune, and how much essence that takes.

Everything is checked against the RuneScape Wiki as of 17/11/2026.

## Current state (verified 2026-11-17)

- **Skill page.** `src/skillsSupport.ts:1376` defines Runecrafting with five stages: Runespan 1–20, body runes 20–33, middle Runespan 33–66, upper Runespan 66–77, "blood pools or free alternatives" 77–110. `trainingWiki` points at the free-to-play guide. `membersNote` says "Free players can train to 110".
- **Max level** is 110 (raised 3 March 2025), with virtual levels to 120. (Wiki: Runecrafting, 2025 Runecrafting update.)
- **Members route** (Wiki: Pay-to-play Runecrafting training):
  - Abyss runecrafting is the default route from 1 to 105.
  - Necrotic runes (after Rune Mythos) are an alternative from 1.
  - The Soul altar is the AFK option from 90.
  - The runic attuner is the fastest at 105+, around 1M XP/hr base. It is a rare drop from The Gate of Elidinis and needs 80 Runecrafting.
  - The Wiki marks its 105+ and necrotic rates as provisional.
- **Ironman route** (Wiki: Ironman Mode/Strategies/Runecrafting): Runespan 1–77, Abyss blood runes 77–90 (also gives magical thread), soul runes 90–99. Essence comes from the Rune Memories chest, Abyssal savage noted drops, and Slayer/PvM drops. This page's rates predate the September 2025 change.
- **Savvy Runecrafting** (29 Sep 2025) replaced the Abyss XP bonus with a permanent bonus at every altar except necromancy altars: +75% at 25, +150% at 35, +200% at 60, +250% at 70, +275% at 95, +300% at 105.
- **Altars.** Air 1, Mind 1, Water 5, Earth 9, Fire 14, Body 20, Cosmic 27, Chaos 35, Astral 40, Nature 44, Law 54, Death 65, Blood 77, Soul 90, Time 100. Necrotic: Spirit 1, Bone 20, Flesh 40, Miasma 60 (impure essence).
- **Altar quests.** Enter the Abyss (Runecrafting 5) for the Abyss and a small pouch; Lost City (cosmic), What Lies Below (chaos tunnel), Lunar Diplomacy (astral), Mourning's End Part II (death), Legacy of Seergaze (blood), 'Phite Club (soul), Rune Mythos (necrotic runes), Rune Memories (essence chest). The Time altar's access requirement needs confirming.
- **Pouches.** Small 1 (3), Medium 25 (6), Large 50 (9), Giant 75 (12), Massive 90 (18, 1,000 Runespan points), Expansive 105 (70; 95 Divination; a long craft; holds one essence type; can't be carried with other pouches since 17 March 2025). Pouches other than Expansive degrade unless the player has the Pouch Protector relic.
- **Capacity boosts.** Abyssal parasite (Summoning 54, 7), lurker (62, 12), titan (93, 20); infinity ethereal outfit (+12).
- **Prices.** The site already fetches live GE prices (`src/lib/priceClient.ts`). Profiles know whether an account is an Ironman.
- **Nothing dated 2026** changes core Runecrafting. The latest change found is Dungeoneering necrotic runes multicraft (26 May 2026).

## Goals

The Runecrafting skill page gets its own layout, top to bottom:

1. **Your kit.** The page asks what the player has, stored per character:
   - which pouches they own (Small to Expansive);
   - which abyssal familiar they can use (none, parasite, lurker, titan);
   - whether they have the infinity ethereal outfit;
   - whether they have the runic attuner.

   Each unticked item the player's levels allow says how an Ironman gets it.
2. **Craft now.** Two picks for the player's level, altar access and kit:
   - **For XP:** the best method they can do now, with its rate and where. A two-way choice above it picks the rule, stored per character:
     - **Save essence** (default for Ironman): methods that need no essence first, such as the Runespan up to 77, then the Abyss and Soul altar.
     - **Fastest** (default for regular accounts): the fastest method they can reach, such as the Abyss from early levels. It says how much essence an hour it uses.
     - **When the pick needs essence**, it lists the best ways for an Ironman to get that essence, best first, gated by the player's levels and quests. Examples: the Rune Memories essence chest, noted drops from abyssal savages, mining it, Slayer/PvM drops, and impure essence for necrotic runes. The same ranked list appears on stockpile rows.
   - **For your stock:** the rune from their stock list that is furthest from its target and that they can craft, with runes per essence at their level.
   - Non-Ironman profiles get a third line: **For profit**, ranked by live GE prices.
3. **Unlock next.** One list, with the next step on each track:
   - the next Savvy Runecrafting bonus;
   - the next pouch they don't own;
   - the next altar they can't reach, and the quest or level that opens it;
   - the next multiple-rune threshold for each rune on their stock list;
   - the big milestones: Soul altar 90, Massive pouch 90, Time altar 100, Expansive pouch 105.

   Each step shows the level or quest it needs, as met or unmet.
4. **Rune stockpile.** The player adds runes they want a back stock of. For each one they enter what they have and what they want. The page shows:
   - runes per essence at their level;
   - the essence needed, and which kind (pure, or impure for necrotic runes);
   - trips needed, from their recorded kit;
   - where an Ironman gets that essence;
   - if the altar is locked, the quest or level that opens it instead.
5. **The training methods** stay below, with the stages rewritten to the current members route.

## Worked examples (acceptance checks)

1. **Ironman, Runecrafting 82, Lunar Diplomacy and Legacy of Seergaze done, 'Phite Club not done. Kit: Small to Giant pouches, abyssal lurker.**
   - Craft now, for XP, on Save essence (the Ironman default): the high Runespan, which uses no essence. Switched to Fastest: Abyss blood runes (77+), with its pure essence an hour and the best Ironman ways to get pure essence.
   - Unlock next: Savvy +275% at 95; Massive pouch at 90; Soul altar needs 'Phite Club (unmet) and 90 (unmet).
   - Stockpile: blood runes, have 4,200, want 20,000. It shows runes per essence at 82, the pure essence needed, and the trips at the free backpack slots + 30 in pouches + 12 in the lurker per trip.
2. **Same player adds soul runes to the stockpile.**
   - The row shows "Soul altar locked: 'Phite Club and Runecrafting 90". It shows no trip count.
   - Craft now, for your stock, skips soul runes and picks the next rune they can craft.
3. **Edge case: a player with nothing recorded in their kit, and no stock list.**
   - The planner counts no pouches and no familiar, and says "Tick your pouches and familiar for an accurate count".
   - Craft now shows only the XP pick, and asks them to add a rune to the stockpile.

## Settled with Alex

- **Approach A:** one hand-written data file plus a lazy-loaded guide component, like Slayer.
- **Ironman first.** Judgement is written for an Ironman. Profit appears only on non-Ironman profiles, from live GE prices.
- **XP pick is the player's choice:** Save essence or Fastest.
- **Ask about the kit.** The page asks which pouches, familiar and outfit the player has, rather than assuming from levels.
- **Page sections:** Craft now (XP and stock), Unlock next, Rune stockpile.

## Calls I made (Alex can overrule)

- **An unrecorded kit counts as not owned**, with a prompt to record it. Assuming owned would overstate what an Ironman carries.
- **No time estimates.** Trips and essence only. Trip time depends too much on the route and teleports.
- **Stock list shape.** Any number of runes, each with have and want. Have is typed by the player, because Compass can't see the bank.
- **Members only.** The guide hides itself on F2P profiles. The existing generic page stays for them.
- **Rates are shown as the Wiki's ranges**, marked "provisional" where the Wiki says so. "Fastest" compares the low end of each range.
- **Ironman** means the profile kind is Solo Ironman or Group Ironman (`ACCOUNT_KINDS` in `src/data.ts`). Only Regular account sees the profit line.
- **Quest state** comes from `completedQuests`. A quest that isn't in it shows as unmet, unless the profile's quest import is unavailable, when it shows as "unknown". The Time altar's requirement shows as "check in game" until it's confirmed.
- **Runes per essence** comes from each altar's Wiki step table: one rune, plus one more at each listed level. Boosts (cape, potions) aren't counted. Savvy changes XP only, not rune count.
- **Essence per trip** is the free backpack slots (28 minus the pouches carried), plus pouch capacity, plus the familiar, plus 12 for the infinity outfit. The Expansive pouch can't be carried with other pouches, so the planner uses whichever is larger: the Expansive alone, or the other pouches together.
- **"Furthest from its target"** means the most essence still needed.
- **Kit values** are fixed ids: small, medium, large, giant, massive, expansive. A pouch above the player's level can still be ticked, and is shown as "needs level N to use". The Pouch Protector relic isn't tracked.
- **Sources show on the page.** Each section ends with the existing `CheckedSources` line: Wiki links and the checked date.
- **Essence sources** are a hand-ranked list per essence type (pure, impure), best Ironman source first, checked against the Wiki's Ironman Runecrafting strategy. Each source carries its requirement, such as Rune Memories for the essence chest. The page shows the ones the player meets first, then the ones they're close to with what they still need.
- **Every requirement the page names** (a pouch, a familiar, a quest, essence) says how an Ironman gets it, not just that it's needed.

## Non-goals

- Combination runes, Armadyl runes and Ourania.
- Imbuing eternal weapons and the 110 crafts.
- Time-per-trip, route or teleport planning.
- Reading the bank or kit from the account.
- An importer script for altar data.

## Anti-goals

- Telling the player to craft at an altar they can't reach without saying why.
- Treating an unrecorded kit item as owned, or an unrecorded rune count as 0 with no prompt.
- Profit advice on an Ironman profile.
- A rate or threshold shown without its checked date and Wiki source.

## Approaches

- **A (chosen):** a hand-written `src/runecraftingGuide.ts` with altars, multiplier thresholds, pouches, Savvy levels, altar quests and essence sources, each with a Wiki source and checked date. A `RunecraftingGuide.svelte` lazy-loads on the Runecrafting page, the way SlayerGuide does. It's small, readable, and the data has barely changed since September 2025.
- **B:** the same component, with altar and multiplier data imported from the Wiki by a script. It stays current automatically, but an importer for about 20 rows costs more than it saves.
- **C:** keep the generic layout and refresh the stages only. It can't show unlocks, stock or essence.

## Design

### Data: `src/runecraftingGuide.ts`

- Altars: rune, level, members, essence type, access quests, multiplier thresholds.
- Pouches and capacity boosts: level, capacity, other requirements, Ironman source.
- Savvy levels and bonuses.
- XP methods by level range, with Wiki rate ranges and a provisional flag.
- Essence sources for Ironmen.
- Every entry carries `checked: "2026-11-17"` and Wiki sources; a test enforces this.

### Logic

Pure functions, unit-tested: runes per essence at a level, essence per trip from a kit, essence and trips for a stock row, the Craft now picks, and the Unlock next list.

### Profile

`runecrafting?: { xpRule?: "save-essence" | "fastest"; pouches?: string[]; familiar?: "parasite" | "lurker" | "titan"; infinityOutfit?: boolean; attuner?: boolean; stock?: { rune: string; have: number; want: number }[] }` is optional. Old saves stay valid, and validation rejects bad shapes.

### Page

- `RunecraftingGuide.svelte` lazy-loads on the Runecrafting skill page for members profiles.
- It reuses GameWindow, ChoiceStrip, ItemList-style checks, requirement chips and the price client.
- The generic stages in `src/skillsSupport.ts` are rewritten to the current members route, and the members note and training link are fixed.

## Constraints

- Svelte 5 and SvelteKit, using the existing components.
- CRLF line endings, UTF-8 without BOM.
- Runecrafting data stays out of the main entry chunk.
- At 390px wide, everything stacks with no horizontal overflow.

## Left to the builder

- Each rune's full multiplier thresholds, from its altar page on the Wiki.
- Confirming the Time altar's access requirement.
- Visual details within the design system.
