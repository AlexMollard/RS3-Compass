# Bossing pages — design

Date: 2026-11-13 · Status: draft for Alex's approval
Mockups: the "Bossing" row (BO1–BO4) on the mockup canvas, https://claude.ai/artifact/EFjKwHgzXaEj2WA4xR2n9Y

## Why

Alex wants Compass to answer the bossing questions it answers for quests:

- which boss to do next, and when you're ready for it;
- how to prepare for it and how the fight works;
- what it drops, what that's worth, and which drops you still need;
- why it's worth doing at all.

These are his words: "a guide and collection log for each boss and in what order you should do them and at what point it's recommended to try them and also I wanna see all the F2P ones". He then asked for three more things:

- preparation plus key mechanics;
- the loot table as a big feature, with a clear "why do this boss";
- an ironman section saying "do this before this boss".

## Goals

1. **Bossing home (`/bossing`)**: a recommended ladder from first boss to endgame, checked against the active profile. It has an F2P view, plus a summary of collection log progress.
2. **Boss page (`/bossing/<id>`)**: one per combat boss, with:
   - a "why fight it" section;
   - a readiness check;
   - a **Loot & collection log** tab, which opens by default;
   - a **Guide** tab: mechanics, setup, what to bring, ironman notes;
   - an **Achievements** tab.
3. **Collection log**: per-profile ticks for each boss's unique drops. You tick by hand, and drops already in the RuneMetrics activity log tick themselves.
4. **F2P**: when the profile's mode is F2P, only the F2P bosses appear and drop tables show their F2P version. This mirrors how quests behave.
5. **Ironman**: on Solo Ironman and Group Ironman profiles, boss pages show an Ironman card and the home shows an Ironman shortlist.

## Non-goals

- Kill-count tracking. Jagex publishes no per-boss kill counts. "Log a kill" in the mockup is out of scope; the hero shows "Wiki strategy ↗" only.
- Skilling, minigame, quest and Dungeoneering bosses. Version 1 covers the Wiki Bosses page's **Combat bosses** table (56 today). The other sections can follow later.
- Hand-written guides for every boss in version 1 (see "Guide content").
- Drop-rate calculators, kill-time estimates, DPS or rotation advice.
- GP per hour as a promise. GP per hour is shown as "per hour at N kills" with N stated, never as a claim.

## Anti-goals (failures even if it works)

- Guide text that is wrong or out of date and presented as fact. Every hand-written guide carries a "checked <month year>" stamp and a Wiki strategy link.
- A collection log that ticks things the player didn't get. Auto-ticks only come from an exact item-name match in the player's own activity log.
- Hammering the Wiki or the price API from every page view.

## Approaches considered

- **A. Fully imported.** Everything scraped, with the strategy text pulled from Wiki strategy pages. It's always current, but the mechanics would be scraped prose and read badly.
- **B. Imported facts plus a hand-written guide file. (Chosen by Alex.)**
- **C. Live Wiki fetch per page.** Slow, puts load on the Wiki, can't sort the ladder without the data, and breaks the quest pattern. Rejected.

## Data (approach B)

### 1. Imported: `scripts/import-bosses.mjs` → `src/bossesImported.ts`

This is a generated file, the same pattern as `import-quests.mjs` / `questsImported.ts`. The script is run by hand and needs network access.

**Source A — the Wiki "Bosses" page, Combat bosses table.** Each row has:
- image
- name
- level
- tier: `Free` / `Low` / `Mid` / `High`, read from the `| X tier` cell
- team: e.g. "Solo or group (1-3)"
- requirements: a list made of `{{QuestIcon|…}}`, `{{Skillreq|Skill|N}}`, "Access to X" and free text
- signature drops (`{{plink|…}}`)
- release date

**Source B — each boss page.** For every boss, the script reads:
- **Infobox Monster:** `members`, `lifepoints`, `weakness`, `aggressive`.
- **`DropsLine` drop tables**, grouped by `DropsTableHead|version=…` (for example Normal, Normal F2P, Hard Mode). Each row stores `{name, quantity, rarity, note?}`.
- **Achievement names** from the `{{Achievement|…}}` templates.
- **Whether there is a strategy page** (`{{HasStrategy}}`) → link to `<Boss>/Strategies`.

**Which drop-table version shows** *(my call)*:
- An F2P profile defaults to the first version whose name contains "F2P", and falls back to the first version.
- A members profile defaults to the first version without "F2P" in its name.
- The toggle lists every version, and a boss with one version shows no toggle.

**F2P** is true when the boss is in `Category:Free-to-play bosses` *or* its infobox says `members = No`. Names are matched case-insensitively: the table says "Giant Mole", the page and category say "Giant mole".

**Item images** use the existing sprite resolution from `import-quests.mjs`, including its redirect resolution. They are shared, not copied.

**The collection log list.** *(My call.)* This is a heuristic followed by a human review; it doesn't have to be reproducible without one. Each boss's uniques are:
- the table's signature drops (`{{plink}}` and `{{plinkp}}` names);
- plus any `DropsLine` whose rarity parses as a fraction below 1/100, or reads "Rare" or "Very rare".

These are excluded:
- Coins;
- items whose name ends in rune, seed, logs, ore, bar, bones, essence, hide or dragonhide, root or stone spirit;
- anything noted.

The script prints the derived list per boss for review. Corrections go in `bossGuides.ts` `uniques.add` and `uniques.remove`, so they survive re-imports.

**Exported types:**

```ts
type BossTier = "Free" | "Low" | "Mid" | "High";
interface BossRecord {
  id: string;            // slug, e.g. "giant-mole"
  name: string; wiki: string; image?: string;
  level: number; tier: BossTier; team: string;
  members: boolean;
  lifepoints?: number; weakness?: string;
  requirements: BossRequirement[];   // { kind: "quest", quest: id } | { kind: "skill", skill, level } | { kind: "text", text }
  drops: Record<string /* version */, BossDrop[]>;  // BossDrop { item, quantity, rarity, note? }
  uniques: string[];     // collection log items
  achievements: string[];
  strategyPage?: string;
  releaseDate?: string;
}
```

Quest requirements are matched to existing quest ids, using the same name matching as quest prerequisites. If a requirement doesn't match, it stays as text.

### 2. Hand-written: `src/bossGuides.ts`

This file is checked in and reviewed like code. Each guided boss has:

```ts
interface BossGuide {
  why: string;                 // one sentence, shown first under "Why fight it"
  mechanics: { title: string; detail: string }[];   // 3–5
  setup: { style: "melee"|"ranged"|"magic"; minimum: string; comfortable: string }[];
  bring: string[];             // packing list
  getThere: string;
  ironman?: { before: string[]; gives: string[]; next?: string /* boss id */ };
  uniques?: { add?: string[]; remove?: string[] };
  checked: string;             // "2026-11"
}
```

- **Version 1 guide set:** the four Free-tier bosses (Giant Mole, King Black Dragon, Chaos Elemental, and Ivar, King of Bones), plus the first eight Low-tier bosses on the ladder. The plan names the eight from the first import's output and fixes them by name.
- **Other bosses** show every imported section. In place of the guide sections they show "Guide coming — Wiki strategy ↗".
- **Recommended setup gear icons** come from `equipmentCombat.ts`, matched to the style and the stated tier. The text is hand-written.

### 3. Live prices: `/api/prices`

- **What it is:** a server route that proxies `https://api.weirdgloop.org/exchange/history/rs/latest?name=A|B|…`. This was checked on 2026-11-13: it returns `{ name: { id, price, volume, timestamp } }`.
- **Caching:** an in-memory cache keyed by item name. `lib/lru.ts` is entry-count only, so each entry stores `{ price, fetchedAt }` and is refetched after one hour.
- **Lookup keys:** the drop's Wiki item name, with " (noted)" stripped from the quantity, not from the name. A name the API doesn't return counts as unpriced ("—"), exactly like an untradeable item. *(My call.)* An unpriced item is left out of the average, and the average says "N drops unpriced" when N > 0. It reuses the per-client rate limit (`server/rateLimit.ts`) and `server/upstream.ts` for the request.
- **Batching:** the client asks for one boss page's item names in a single request.
- **Fallback:** when the API fails, the drop table shows no prices with the note "Prices unavailable", and the rest of the page renders.
- **Coins** are priced at 1, and untradeables show "—".
- **Averages:**
  - *Average per kill* = Σ price × mean quantity × rarity probability. A quantity range uses its midpoint; "Always" counts as 1; "a/b" counts as a÷b.
  - Under the average, the page lists the **three biggest contributors**. That makes a skew visible, like Numbing root on Giant Mole, which accounts for most of its ~66k.

## Ladder order and readiness

- **Order:** tier (Free → Low → Mid → High), then boss level within a tier.
- **Stage headings** come from the tier:
  - Start here (Free)
  - Early members (Low)
  - Mid-game (Mid)
  - Endgame (High)
- **Status** for the active profile, first match wins:
  1. **Members only:** the profile is F2P and the boss is members. Hidden in F2P mode.
  2. **After \<quest\>:** a quest requirement isn't complete. Show the first such quest, linked to its quest page.
  3. **Needs N \<Skill\>:** a skill requirement isn't met.
  4. **Ready now:** no unmet hard requirement and the profile meets the tier's recommended stats.
  5. **Around N combat stats:** otherwise. N is the tier's recommended level.
- **Recommended stats per tier** (shortcut constants, editable in one place):
  - Free 60
  - Low 75
  - Mid 85
  - High 95

  *(My call.)* "Meets the tier" uses raw skill levels, not combat level: the profile's **best style** must reach N, and so must **Constitution** and **Defence**. Best style means the highest of `min(Attack, Strength)`, `Ranged`, `Magic` and `Necromancy`. Prayer and Summoning don't count. A boss's guide `setup.minimum` text doesn't change status.
- **"Your next boss"** is the first boss on the ladder that is Ready now and whose collection log isn't complete. If there isn't one, it's the first boss that isn't ready.
- **Missing levels:** if the profile has no levels recorded, the status reads "Levels not recorded", the same as on quest pages.

## Collection log storage

- **Storage:** new optional fields `Profile.collected?: string[]` and `Profile.collectedAuto?: string[]`, with keys `boss:<bossId>:<item name>`. In `validProfile` (`profileStore.ts`) they use the optional-field shape already used for `statistics`: `p.collected === undefined || string array`. Old saves load with neither field, which reads as empty.
- **Ticking by hand:** toggling a tile writes the key.
- **Auto-ticks:** `activityPresentation.ts` already parses `I found …` events, `rs_plog_item_drop` and `rs_plog_item_found`. When an event's item name exactly matches a boss's unique, ignoring case:
  - the match is persisted to `collected` and `collectedAuto` when the event log is synced (see the write-back below), not derived on render;
  - the tile reads `isAutoCollected`: it shows as collected, labelled "auto from activity";
  - the subject is the item name from `activitySubject`, which strips "a/an/some" and the trailing full stop. It's compared to the unique's name ignoring case only, with no other normalisation.

  The activity log only holds recent events, so an auto-tick would vanish when its event rolls off. *(My call.)* The write-back runs in the profile store wherever a fresh event log is saved for a profile, so it doesn't depend on which page is open. Each new match is added to both `collected` and `collectedAuto`. From then on it's an ordinary tick labelled "auto from activity", and **the player can untick it**. Unticking removes the key from `collected` only. `collectedAuto` remembers every match already seen, so a match that's already in it is never re-added, even while its event is still in the log. That keeps a wrong match (for example a shared item name) correctable, which satisfies the anti-goal.
- **Duplicate item names:** an item that's a unique for several bosses (for example a shared pet item) counts for each boss whose log lists it. That's acceptable for version 1.
- **Collection log view** on `/bossing`: every boss's uniques in one grid with ticks, filterable to "missing only".

## Pages and integration

- **Navigation:** add `bossing` to `NAV_GROUPS` under "Plan", after Skills, with the Wiki icon `Combat_icon.png` or similar. Add it to `PHONE_TABS` only if there's room; otherwise it stays in the menu.
- **Routes:**
  - `src/routes/bossing/[[id]]/+page.ts`, the same shape as the quests route.
  - An unknown id gives a 404.
  - `bossPath(id)` goes in `navigation.ts`.
- **Top bar on a boss page:**
  - a "Boss ladder" button, like "Quest map";
  - a boss finder (`QuestFinder`, generalised or copied with a narrower prop);
  - previous/next along the ladder, filtered to F2P bosses in F2P mode.
- **Quest pages:** when a quest is a boss's requirement, its "Unlocks" area lists "Unlocks the \<Boss\> fight" with a link. A quest's reward tile can link to the boss page.
- **Shared components** are reused, not rebuilt:
  - `GameWindow`
  - `GameArt`
  - `StatusChip`
  - `ChoiceStrip` (version and style toggles)
  - the packing checklist used by quests (`packKey` with task id `boss:<id>`)
- **Home dashboard:** a "Next boss" tile goes next to the next quest, as a link only. It's built in the same change only if it's trivial.

## Page contents (matching the mockups)

- **BO1 Bossing home:**
  - page heading;
  - a Ladder / All bosses / Collection log switch;
  - filter chips: Ready now, Solo, Has a pet, F2P only;
  - the "Your next boss" card;
  - the ladder grouped by stage. Each row shows rank, art, name, level and team, tier tag, F2P tag, status pill, why-tags and log progress;
  - a right rail: log summary, Ironman shortlist (iron profiles only) and "How the ladder works".
- **BO2 F2P:** the same page with only F2P bosses, plus a lead line saying how many there are.
- **BO3 Loot tab:**
  - the hero: art, tags, "Why fight it" list and the readiness aside;
  - a collection log grid;
  - the drop table with a version toggle, using the boss's own versions;
  - the average per kill, the per-hour figure and its top contributors;
  - a table sorted by value per kill, with Show all.
- **BO4 Guide tab:**
  - key mechanics (numbered, with the "checked" stamp);
  - recommended setup by style;
  - Bring with you (packing);
  - Get there;
  - the Ironman card (iron profiles only): Before this boss, What it gives you, Next for ironmen;
  - Leads to (next on the ladder).
- **Achievements tab:** the boss's achievement names, linked to the Wiki. There's no progress tracking, because Jagex exposes none we read.

**"Why fight it"** is assembled from:
1. the guide's `why` sentence;
2. the average loot per kill;
3. the pet, if a unique is a pet, plus the achievement count;
4. quest or area unlocks, from requirements in reverse and guide text.

**Mobile:** the layout follows the quest page breakpoints. The hero stacks, the drop table becomes card rows, and the log grid uses 3 columns, then 2.

## Constraints

- Svelte 5 runes, SvelteKit, adapter-node, deployed on Deno Deploy.
- No new dependencies.
- CRLF endings, files edited with Edit/Write only, plain commit messages.
- The Wiki and price API are called only from the importer, and the price API only through `/api/prices`, with caching.
- Every function with real logic has a test in `tests/`. That covers ladder order, status rules, average per kill, unique derivation, F2P filtering and activity matching.

## Left to the builder

- The exact Svelte component split.
- CSS details within the existing design tokens.
- How to present the import script's derived-uniques review output.
- The icon choice for the nav entry.
- Whether `QuestFinder` is generalised or a `BossFinder` is copied from it.

## Delivery order (suggested)

1. Importer and `bossesImported.ts`, with tests for parsing.
2. Ladder logic and status rules, then BO1/BO2.
3. Boss page: Loot tab, `/api/prices` and the collection log.
4. Guide tab, `bossGuides.ts` with the version 1 guide set, and the Ironman card.
5. Integration: nav, quest-page links, Achievements tab.
