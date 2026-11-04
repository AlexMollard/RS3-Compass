# RS3 Compass

A RuneScape 3 preparation companion: choose an activity, prepare its levels and supplies, then use the Wiki or in-game quest helper. An unofficial fan project with an evolving content catalogue, not a quest walkthrough or an exhaustive optimal route to every skill cape.

## Stack and local development

SvelteKit 3, Svelte 5, TypeScript, Tailwind CSS 4 and Leaflet. The production build uses SvelteKit's Node adapter and runs on Deno's Node compatibility layer. React, hash routing and the GitHub Pages base path have been removed.

Use a Node version supported by Vite 8 (22.12+ or 24 LTS):

```sh
npm ci
npm run dev

# Validate the production build and domain behaviour
npm run build
npm test
```

Open the root URL printed by the server. `npm run preview -- --port 4173 --strictPort` inspects the built application; it is not the deployed Deno runtime.

## What works

- Activity-first homepage with visible quest browsing and all 29 skill tiles. A skill tile opens its Compass guide; level editing is a separate explicit action.
- Five quest preparations: Cook's Assistant, The Knight's Sword, Dragon Slayer, Waterfall Quest and Tree Gnome Village. Required levels are distinguished from optional self-supply targets. Item lists, quest starters, access requirements and combat risks prepare the player without replacing a walkthrough.
- Interactive Wiki-tile maps mark the actual quest start, with recentering and a separate external map link. NPC portraits and location artwork come from the Wiki.
- All 29 skills have starter/training methods, preparation references and concrete destinations. Coverage is early-to-mid progression, not an exhaustive or continuously optimal 1–120 route.
- F2P and Members are per-profile planning settings, not verified membership. Trial caps and members-only methods are gated without deleting recorded levels or selected sessions.
- Play Companion retains selected training ranges, packing checks, notes, completion and compact mode. Empty preparation lists have an explicit empty state rather than a 0/0 checklist.
- Public player lookup imports recorded levels and, when available, RuneMetrics completed quests matching this catalogue. Real profiles do not inherit fictional sample notes, packing checks or completions.
- Refresh preserves manual completion, packing, notes and planning settings. Private, empty or unavailable RuneMetrics responses are reported as unavailable, never as proof of zero completed quests.
- Saved-player management supports switching, explicit refresh and confirmed removal from this device. Removing a local profile does not change the RuneScape account or other profiles.
- Two explicitly fictional sample profiles remain for exploring the interface. Manual level entry accepts 1–120; unknown levels remain unknown, not zero. Cancel and Escape discard unsaved edits.
- Global search, whole-card internal navigation, responsive selectors and independent Wiki links share reusable controls.

## Persistence, requests and privacy

Progress stays in browser local storage under `rs3-compass-design-v1`. Existing profiles, notes, checks and selected methods survive the Svelte cutover. Export retains the preview JSON format; it is not an automatic backup or an Ironbound import format. Invalid saved formats are not silently overwritten. A save-failure warning offers export when browser storage cannot be written.

The host-only `rs3_compass_player` cookie remembers the selected public player name for 180 days, with Path=/ and SameSite=Lax (Secure on HTTPS). It contains no game credentials or progress. Returning to an existing cached profile does not automatically re-fetch it; use Refresh for new data. Older real profiles receive a one-time quest-import upgrade. A remembered name without a saved profile can restore public data, not deleted local notes or checks. Selecting a sample profile clears the remembered real name. Clearing site data removes local progress and preferences.

The same-origin GET `/api/player?name=NAME&schema=2` endpoint calls only Jagex's fixed official Hiscores and RuneMetrics quest endpoints. No RuneScape login, password, private access token or shared progress database is used. Responses contain public player data only; upstream cookies are not forwarded.

Each server instance coalesces lookups for the same normalized name, caches successful data for five minutes (up to 128 players), briefly caches missing players, limits concurrent requests and lookup misses, and times out upstream requests without retry loops. These are per-instance limits, not a distributed quota guarantee. Public HTTP cache lifetimes use the remaining cache TTL; browser errors are not cached. Levels can load successfully while quest data is unavailable. RuneMetrics API availability is outside this project's control.

Wiki images are remote links, not downloaded assets. Browser caching follows the Wiki's response headers; offline availability is not guaranteed. Artwork is lazy-loaded where appropriate. Maps load tiles only while visible and defer rapid selection changes. Navigation does not fetch Wiki article content. Google Fonts supplies Cinzel and DM Sans, with system fallbacks.

## Shared UI and content

Reusable Svelte widgets live in `src/lib/components/`; pages in `src/lib/pages/` compose them instead of hand-rolling references, cards, dialogs and maps. A per-layout controller owns browser-local state rather than sharing player state between server requests.

Use `GameText` for authored item, quest, skill and location references:

```svelte
<GameText text="Bring 2 iron bars and a redberry pie." />
```

Register item aliases once in `src/lib/gameText.ts` or the relevant skill catalogue's exported references. Item image and name open the same Wiki article, without a coloured background. External references remain separate from internal navigation and checkbox labels. Correct missing images at their catalogue entry; do not substitute unrelated art.

`src/data.ts`, `src/skillsCombat.ts`, `src/skillsArtisan.ts` and `src/skillsSupport.ts` define content. `src/locations.ts` composes destinations and access-mode choices. Membership advice does not prove a character has unlocked a quest, shortcut or area. `src/skillNames.ts` holds the canonical Hiscores skill order.

Use the original Ironbound quest order and training advice as a baseline, not an immutable specification. Prefer demonstrably better applicable alternatives, retaining access and unlock conditions. Check adopted requirements and methods against current November 2026 sources; do not present an unverified estimate as a measured rate.

## Deno hosting

`deno.json` defines npm installation, the production build and the dynamic `build/index.js` entrypoint for Deno Deploy. To run the actual production server after building:

```sh
deno run --allow-net --allow-env --allow-read --allow-sys build/index.js
```

Set HOST=127.0.0.1 and PORT=4173 for the loopback review address http://127.0.0.1:4173/. Otherwise use the address printed by the server.

No public Deno deployment, custom domain or GitHub Actions publishing has been configured. This dynamic lookup endpoint cannot run on GitHub Pages alone. Deployment must be deliberate; automatic GitHub workflow triggers are prohibited by the account policy.

## Verification

`npm run check` runs Svelte type and accessibility diagnostics. `npm run build` runs those checks and produces server/client bundles. `npm test` runs Node's built-in regression suite for training boundaries, catalogue/access rules, maps and combat, lookup parsing/caching/limits, profile isolation, quest imports, storage failures and player removal. `npm run format` applies the shared CRLF configuration.

Native browser review exercises the real Deno-hosted app, public/private quest responses, all 29 skill routes, membership gating, player refresh/removal, remembered-player restoration and saved preparation. Lookup review does not alter RuneScape accounts.

## Scope and sources

Not implemented: a full quest catalogue, exhaustive high-level training, XP/time planning, equipment supply-chain planning, online shared boards, task claiming, shared supply totals, published progress, a restorable cloud backup or Ironbound data import. The small deterministic quest order is not a complete personalized progression engine.

Initial discovery used the [Ironbound guide](https://ironbound-rs3-alex.alexmollard93.chatgpt.site/guide/). Check current preparation against the game journal and linked Wiki articles. Sources are attached directly to quest, skill, item, NPC and location references. Important contracts include the [Wiki API reference](https://runescape.wiki/w/Application_programming_interface#Quest), [F2P limits](https://runescape.wiki/w/Free-to-play), [SvelteKit configuration](https://svelte.dev/docs/kit/@sveltejs-kit-vite) and [Deno Deploy builds](https://docs.deno.com/deploy/reference/builds/).

RuneScape and its artwork belong to Jagex. RS3 Compass is not affiliated with or endorsed by Jagex. Game imagery links directly to RuneScape Wiki. Interface icons use @lucide/svelte (ISC).
