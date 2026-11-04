<div align="center">
  <img src="static/compass.svg" alt="RS3 Compass" width="88">

  # RS3 Compass

  **RuneScape 3 quest preparation and skill planning.**

  [Open RS3 Compass](https://rs3-compass.mollard.deno.net/) · [RuneScape Wiki](https://runescape.wiki/)

  <a href="https://runescape.wiki/w/Iron_bar"><img src="https://runescape.wiki/images/Iron_bar.png?0292b" alt="Iron bar" width="40"></a>
  &nbsp;&nbsp;
  <a href="https://runescape.wiki/w/Redberry_pie"><img src="https://runescape.wiki/images/Redberry_pie.png?19b0c" alt="Redberry pie" width="40"></a>
  &nbsp;&nbsp;
  <a href="https://runescape.wiki/w/Coins"><img src="https://runescape.wiki/images/Coins_1000.png?1a0ce" alt="Coins" width="40"></a>
</div>

## Your preparation journal

- **Quests:** Prepare for all 54 F2P quests and 9 miniquests/sagas, checked against November 2026 sources. Requirements, linked item artwork, packing, notes, combat risks, NPC start maps and completion tracking share one workspace.
- **Skills:** Explore starter and early-to-mid training guides for all 29 skills, with destinations and preparation references.
- **Players:** Look up and cache public player data, keep separate local plans, or explore with removable fictional sample players. Public quest completion may be unavailable when RuneMetrics data is private or inaccessible.

Compass is a preparation companion, not a walkthrough or an exhaustive guide to the game. Check the in-game journal and linked Wiki articles for current details.

Seasonal quests and the tutorial stay in the catalogue, outside the regular progression route. Benedict's World Tour has a free section but needs membership to finish; members quest coverage is otherwise selective.

## Run locally

SvelteKit 3 · Svelte 5 · TypeScript · Tailwind CSS 4 · Leaflet · Deno with the Node adapter

Requires Node 22.12+ or 24 LTS.

```sh
npm ci
npm run dev
npm run build
npm test
```

## Your data

Progress stays in this browser, **not in the cloud**. Changing domains or clearing site data starts a separate local workspace; export anything you want to keep. Public lookups need no Jagex login. A cookie remembers your player name; artwork and map tiles load from the Wiki.

## Credits

Initial discovery drew on the [Ironbound guide](https://ironbound-rs3-alex.alexmollard93.chatgpt.site/guide/). Game images are linked from the [RuneScape Wiki](https://runescape.wiki/); RuneScape and its artwork belong to Jagex. This unofficial fan project is not affiliated with or endorsed by Jagex. Interface icons use [Lucide](https://lucide.dev/) (ISC).
