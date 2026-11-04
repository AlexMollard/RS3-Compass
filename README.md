# RS3 Compass

A desktop-first, RuneScape-inspired progression companion for Solo and Group Ironman. This repository currently contains a **clickable design prototype**, not a complete gameplay guide or a migration of the original Ironbound application.

## Run locally

Requires Node.js 22.12+ (or another Node version supported by the installed Vite release).

```sh
npm ci
npm run dev
```

Open the URL printed by Vite, including the /RS3-Compass/ path.

To build and inspect the production bundle:

```sh
npm run build
npm run preview -- --port 4173 --strictPort
```

Open http://127.0.0.1:4173/RS3-Compass/.

Run `npm test` for the dependency-free training-range and location-catalogue regression checks. The command uses Node's built-in TypeScript stripping.

## Product direction

- Answer “What should I do next?” and provide clear guidance while playing.
- Connect quest-led unlocks, useful skill milestones, self-supplied equipment, combat/boss readiness, and long-term maxing/completion.
- Prepare quest levels and items, then send the player to the Wiki or in-game quest helper. Do not add per-quest walkthroughs.
- Use plain functional labels, not slogans or motivational copy.
- Support F2P and Members as settings on the same character. Switching access mode must never reset recorded progress.
- Keep Solo and Group Ironman advice self-sufficient. Another member’s recorded level does not confirm available equipment or supplies.
- Prioritise desktop use beside the game, using a compact progression queue, game-style framed panels, and a narrow Play Companion.
- Use React, TypeScript, and Vite. Host the eventual static release on GitHub Pages without a backend.

## What works in the prototype

- Progression, Play Companion, Quest Preparation, and Skills navigation, including browser back/forward and hash deep links.
- Two fictional sample profiles, Aster and Rowan, with separate local progress and F2P/Members settings.
- Five sample quests and three sample skills: Mining, Smithing, and Fishing.
- Manual quest completion and skill-level updates.
- Quest level/item preparation, session selection, packing checks, notes, manual completion recording, and compact mode.
- Search, quest completion filtering, training-range selection, and method/equipment/supply sections.
- Browser-local persistence in rs3-compass-design-v1, isolated from Ironbound data.
- Export of prototype profiles, explicitly labelled as a preview-only format.
- Shared game-reference rendering: item image and name link to the same Wiki article, without coloured link backgrounds.
- Whole quest-navigation cards open the corresponding preparation page inside Compass. Wiki links live in the selected quest heading and external-guide controls.
- Clicking a recorded skill opens a focused level editor for all eight sample levels, including skills without a guide. Save validates levels 1–120; Cancel and Escape discard changes.
- Skill lists, training ranges, active preparation, and global search use full-card navigation. Wiki actions stay independent wherever shown. The recommended quest title opens its Compass requirements.
- Search fields have a clear control that restores input focus; global search stays touch-accessible on phone screens. Packing-row whitespace toggles the native checkbox; linked item images/names remain independent Wiki actions.
- Starting a training session preserves the selected method per character and restores it after reload. Older profiles without an explicit choice use their recorded level; removed ranges fall back without losing progress.
- A redesigned starting page separates the next quest's preparation from the current session, shows the quest starter or relevant training locations, and keeps the full recorded-level sheet collapsible.
- Compact 13px body text and 12px captions replace the formerly tiny labels; actionable icons and phone hit areas are enlarged independently of typography.
- Quest preparation, the overview, and the companion share a quest-start card: the actual starter's portrait, NPC Wiki link, precise meeting point, and entry requirements. Training sessions keep location photographs. Narrow-screen quest, skill, and training-range pickers collapse without losing navigation.
- Mining ranges name concrete destinations. Members mode can add an explicitly labelled alternative without pretending that every member has quest or shortcut unlocks.
- A sticky save-failure warning remains available while using the companion on a phone, with progress export and recovery when browser storage becomes writable.

## Shared interface widgets

Pages compose the widgets in `src/ui.tsx` rather than recreating their markup and control behaviour:

- `PageHeading` and `ActivityHeader`: consistent page and game-activity headers.
- `GameWindow` and `SectionHeading`: framed panels and section labels.
- `QuestNavigationCard`: full-box internal navigation in both the progression queue and quest list.
- `NavigationCard`: a keyboard-operable whole-card action with independently clickable content references and a separate Wiki gutter.
- `SearchField`: consistent labelled search with clear-and-refocus behaviour.
- `ItemList`: the same Wiki-linked item rendering in readonly lists and interactive packing checklists.
- `Button`, `IconButton`, and `Tabs`: native controls with shared variants, accessible labels, and explicit form-submit behaviour.
- `WikiAction`: external Wiki controls with consistent URL, target, rel, and icon handling.
- `ResponsivePicker`: a native disclosure on narrow screens and an expanded selector on desktop.
- `LocationGallery` in `src/LocationGallery.tsx`: shared Wiki-linked location photos and access details, with a compact overview variant.
- `QuestStart` in `src/QuestStart.tsx`: quest-specific starter portraits and meeting points, shared across preparation and session surfaces. This is arrival/start information, not a quest walkthrough.

Pages and App own state, data, and callbacks. Widgets do not fetch data, change membership, or write local storage.

## Shared game references

Use `GameText` for authored content that mentions items, quests, skills, or locations. Register each named item and its aliases once in `src/GameText.tsx`; the widget handles case-insensitive, whole-word matching, compound names, imagery, and external links. Entries remain normal text, for example:

```tsx
<GameText text="Bring 2 iron bars and a redberry pie." />
```

`src/wiki.ts` centralises article and image URLs. Images are hotlinked from RuneScape Wiki, not downloaded or bundled. The browser follows the upstream cache headers; this is not an offline-image guarantee. A missing image must be corrected at its catalogue entry, not replaced with an unrelated placeholder.

Keep the widget out of buttons and checkbox labels. Navigation cards are internal controls; content references are external links. Packing checkboxes and item links are independent controls, so opening the Wiki cannot change a packing check.

Register locations once in `src/locations.ts`, then reference their keys from quest or training data. `stageLocations` chooses access-mode recommendations; the catalogue tests reject missing locations, ambiguous reference names, and members-only destinations in free-to-play routes. Members alternatives are recommendations, not proof that a character has unlocked a route.

Recommendations use a small, deterministic sample order to demonstrate interactions. They are not a complete personalised progression engine. Members skill notes demonstrate access-mode changes; they are not a members training catalogue.

## Outside this design pass

Full content migration, researched Members progression, comprehensive quest/skill coverage, real XP/time planning, equipment and supply-chain tools, local group comparisons, Ironbound backup import, and production deployment are **not implemented**. They remain part of the product planning work; this prototype must not be presented as feature parity with the original app.

The owner explicitly excluded the following from the first static release:

- Online shared boards and task claiming.
- Shared supply totals and published progress.
- Automatic public character lookup and group-stat refresh.

There are no RuneScape account credentials, server API calls, or shared database. Sample quest completion does not automatically grant XP, reward claims, cash, or items. Access settings describe intended availability, not verified membership.

## Design review paths

1. Open Progression and prepare the recommended quest. Confirm the view contains level/item preparation and a handoff to the Wiki, not quest walkthrough steps.
2. Check packing items and add a note; reload and confirm the session survives.
3. Switch F2P → Members → F2P. Confirm prior progress remains and a members session becomes access-gated rather than disappearing.
4. Change a sample skill level, switch characters, and switch back. Confirm profile isolation.
5. Click anywhere on a quest-navigation card to open its Compass preparation page. Item icons and names should open the correct Wiki article without toggling packing checks.
6. Open compact mode and resize the browser beside the game. Also inspect the narrow-screen navigation.
7. Enter a long session note rapidly, then reload. Confirm every character survives and no React update-depth error appears.
8. Click a recorded level, edit it, and cancel with Escape. Reopen, save a valid value, and reload. Check that invalid levels cannot be saved and the other character is unchanged.
9. Select a lower training range, start the session, and reload. The companion must keep that method rather than silently choosing the recorded-level range.
10. Click card padding and names in skill/search lists; they should navigate inside Compass. Click their explicit Wiki action instead; it should open a new tab without navigating the card.
11. On the starting page, prepare the next quest, resume the current session, switch activity tabs, and expand the recorded-level sheet. All eight recorded levels remain editable.
12. At phone width, open the quest, skill, and range disclosures with the keyboard. Select a range and confirm the summary updates and collapses; widen the window and confirm selectors expand.
13. Select Mining levels 20–30, switch F2P → Members → F2P, and inspect the location cards. The shared Lumbridge mine remains available; coal trucks appear only as a Members alternative with the optional shortcut explained.
14. Check each sample quest's “Where to start” card and start packing. The companion must retain the same NPC, portrait, and meeting point, not substitute a later quest destination. Portrait/name links open the NPC Wiki; the location link opens the place article. Check Dragon Slayer's 33-quest-point entry and Tree Gnome Village's first-visit maze access.

The shared-widget and interaction passes were exercised in the production preview across all four pages at phone, tablet, and desktop widths. Checks covered full-card mouse/keyboard navigation, touch-accessible search, Wiki popups, exact-skill editor focus and cancellation, native level bounds, character isolation, selected-method handoff and reload, membership gating, packing/note persistence, rapid native typing, and browser-storage exhaustion/recovery. `npm test` retains training-range precedence, boundary, removed-range, and profile-isolation regressions. Persistence updates its error indicator only when the write outcome changes; successful keystroke saves do not enqueue redundant renders.

## Hosting status

The production base path is /RS3-Compass/ and routing uses URL hashes, avoiding GitHub Pages deep-link 404s. The build creates dist/ with .nojekyll and the Compass favicon; game imagery is loaded from the Wiki. Publication has not been configured or performed. No automatic GitHub Actions workflows are included; eventual publishing must be deliberate and manual under the account policy.

## Content and artwork

Sample gameplay content was adapted from the existing [Ironbound guide](https://ironbound-rs3-alex.alexmollard93.chatgpt.site/guide/) during design discovery. It has not been independently audited against every current game rule. Consult the current in-game journal and RuneScape Wiki before playing.

RuneScape and its artwork belong to Jagex. This is an unofficial fan project, not affiliated with or endorsed by Jagex. Game imagery loads directly from RuneScape Wiki.

- [Quest icon source](https://runescape.wiki/w/Quests)
- Skill icons and item images link to their associated Wiki articles through the shared reference widget.
- Location photographs and access details use the articles linked directly from each card in `src/locations.ts`.
- Quest starts are verified against [Cook's Assistant](https://runescape.wiki/w/Cook%27s_Assistant), [The Knight's Sword](https://runescape.wiki/w/The_Knight%27s_Sword), [Dragon Slayer](https://runescape.wiki/w/Dragon_Slayer), [Waterfall Quest](https://runescape.wiki/w/Waterfall_Quest), and [Tree Gnome Village](https://runescape.wiki/w/Tree_Gnome_Village). Starter portraits are the chatheads from their linked NPC articles, with filenames recorded in `src/data.ts`.
- Mining recommendations: [Ironman Mining guide](https://runescape.wiki/w/Ironman_Mode/Guide/Mining), [coal truck mine](https://runescape.wiki/w/Coal_truck_mine), [luminite rocks](https://runescape.wiki/w/Luminite_rock), and [Rimmington mine](https://runescape.wiki/w/Rimmington_mine). These are researched sample ranges, not an exhaustive optimal Members route.
- Other destination references: [free-to-play Fishing training](https://runescape.wiki/w/Free-to-play_Fishing_training) and [Artisans' Workshop](https://runescape.wiki/w/Artisans%27_Workshop).
- Cinzel and DM Sans are requested from Google Fonts; system fonts are the fallback if unavailable.
- Interface icons: lucide-react (ISC).
