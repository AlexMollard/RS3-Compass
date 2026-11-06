<div align="center">
  <img src="static/compass.svg" alt="" width="80">

# RS3 Compass

**RuneScape 3 quest preparation and skill planning for Ironman accounts.**

[Open the app](https://rs3-compass.mollard.deno.net/) · [Browse quests](https://rs3-compass.mollard.deno.net/quests) · [Explore skills](https://rs3-compass.mollard.deno.net/skills)

</div>

![The Knight's Sword workspace, showing level checks, linked supplies and its quest-start map](docs/images/quest-preparation.webp)

_Quest preparation with fictional sample-player data. Game artwork and maps: Jagex / RuneScape Wiki._

## What you can plan

| Workspace                                                        | What it does                                                                                                                                                                                                                     |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Quests**                                                       | Check levels, gather supplies, review combat risks and find the starting NPC on a map. Packing, notes and completion share one page.                                                                                             |
| **Skills**                                                       | Browse all 29 skills in an in-game-style grid, with one consistent left-hand header icon. Compare level ranges, training methods, creature/resource locations and Ironman benefits.                                              |
| **Equipment**                                                    | Compare a training range's target kit with current-level alternatives. Use requirements and self-supply requirements stay separate: being able to equip mithril does not mean you can smith it.                                  |
| **[Players](https://rs3-compass.mollard.deno.net/players)**      | Open Players from the workspace navigation to find, switch, refresh and remove saved players. Each character keeps separate planning settings, notes, packing and quest completion.                                              |
| **[Group Ironman](https://rs3-compass.mollard.deno.net/groups)** | View official rosters in portrait cards, compare published levels in an icon-led skill grid and open a member's training guide. RuneScape artwork and textured panels frame the workspace; manual edits stay out of comparisons. |
| **[Activity](https://rs3-compass.mollard.deno.net/activity)**    | Read individual or combined-group feeds, newest first. Filter by player and event type, follow Wiki references and see availability separately for each player.                                                                  |

Switch between **F2P and Members** planning. The catalogue includes all 54 F2P quests and 9 miniquests/sagas, checked against November 2026 sources; Members quest coverage is selective. Seasonal quests and the tutorial remain available outside the regular progression route.

Compass prepares you to start an activity; it does **not** replace quest walkthroughs, the in-game journal or the [RuneScape Wiki](https://runescape.wiki/). Named items, skills, quests and locations link to their references, with Wiki artwork throughout the app.

## Public player data

Lookups use the official [RuneScape Platform APIs](https://developer.runescape.com/platform/), without a Jagex login or API key:

- **Hiscores:** recorded levels, XP, overall and skill ranks, and activity scores. Ranks are from the main RS3 Hiscores, not Ironman-only rankings.
- **Quest progress:** completed and started quests, reported eligibility, and authoritative quest-point totals. Eligibility is not a packing check.
- **Recent activity:** up to 20 published events, with linked references where a subject can be identified. Availability depends on active membership and the in-game RuneMetrics Event Log settings.

These sources are independent: a player without a main Hiscores entry can still import public quests or activity. Missing levels, XP and ranks remain unknown, not zero. A teammate's quest completion never completes your own quests.

The Members planning toggle does not change an account's actual membership. Public data does not reveal your bank, inventory or owned equipment.

<details>
<summary>Group Ironman data source</summary>

`GET /api/group?name=ironmanies&size=3&competitive=true` retrieves a public group snapshot from the official RuneScape group Hiscores.

Group Hiscores are separate from the Platform APIs. Compass validates the exact name, size and category against the official listing's structured data, then reads member identities from the official roster. Successful lookups are cached for 10 minutes and matching requests are coalesced. If Jagex changes the source format, lookup reports unavailable rather than inventing a roster or zero progress.

</details>

<details>
<summary>Refresh timing and unavailable data</summary>

Public snapshots refresh when their cache expires while the relevant workspace is visible. Refresh a player without switching characters, or refresh all saved players from Players. Matching requests are coalesced, with at most two player requests running at once; background tabs pause the queue and leaving a view withdraws its queued automatic work.

Successful player lookups are cached for 10 minutes. Refresh does not bypass that cache. Temporary source failures retry sooner with a cooldown; rate-limit responses are respected. Jagex also caches data, so delays can stack; quest progress may update after logout, a world hop or periodic synchronization.

If a source becomes unavailable, Compass keeps its last successful snapshot and original timestamp. A failed overall refresh shows an error without erasing data or changing source privacy settings. Removing a player cancels pending work; late responses cannot recreate the removed profile.

Artwork and map tiles use browser caching. Additional activity references are resolved only for displayed feed entries, using bounded, cached Wiki requests with at most 50 subjects per batch.

</details>

## Your data stays in this browser

Notes, packing, planning settings and saved group references are **local, not cloud-synced**. Export progress to back them up. A functional cookie remembers the explicitly selected player name; background refreshes do not change it. Public lookup responses are server-cached. Removing a saved profile does not change its RuneScape account; removing a cached group keeps its individual player journals.

Changing domains, browsers or devices does not carry your local workspace across. Export progress before moving or clearing site data. Wiki images, map tiles and activity-reference queries contact the RuneScape Wiki directly.

Group support is a public-data dashboard, not shared storage or a collaborative board. There is no sign-in, cross-device synchronization, task claiming or visibility into private inventories.

## Run locally

**Stack:** SvelteKit 3 · Svelte 5 · TypeScript · Tailwind CSS 4 · Leaflet · Deno Deploy with the Node adapter.

Requires **Node 22.12+ or 24 LTS**.

```sh
npm ci
npm run dev
```

Vite prints the local URL. To verify changes:

```sh
npm test
npm run build
```

The production build includes Svelte checks. Deno serves `build/index.js`; the stable deployment is **[rs3-compass.mollard.deno.net](https://rs3-compass.mollard.deno.net/)**. The player lookup requires a server and cannot run on GitHub Pages alone.

## Credits

Initial research drew on the [Ironbound guide](https://ironbound-rs3-alex.alexmollard93.chatgpt.site/guide/). Game artwork and map tiles come from the [RuneScape Wiki](https://runescape.wiki/) and belong to Jagex. Interface icons use [Lucide](https://lucide.dev/) (ISC).

RS3 Compass is an unofficial fan project, not affiliated with or endorsed by Jagex.
