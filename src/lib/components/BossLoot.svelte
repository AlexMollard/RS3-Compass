<script lang="ts">
  import { Package } from "@lucide/svelte";
  import { bossUniques } from "../../bosses";
  import type { BossRecord } from "../../bossTypes";
  import type { Profile } from "../../data";
  import { wikiHref } from "../../wiki";
  import type { LootRow, Prices } from "../bossLoot";
  import { firstRarity } from "../bossPage";
  import { isAutoCollected, isCollected, logKey } from "../collectionLog";
  import ChoiceStrip from "./ChoiceStrip.svelte";
  import FallbackArt from "./FallbackArt.svelte";
  import GameWindow from "./GameWindow.svelte";

  let {
    boss,
    profile,
    version,
    onVersion,
    rows,
    summary,
    prices,
    priceState,
    onToggle,
  }: {
    boss: BossRecord;
    profile: Profile;
    version: string | undefined;
    onVersion: (version: string) => void;
    rows: LootRow[];
    summary: { average: number; unpriced: number; top: LootRow[] };
    prices: Prices | undefined;
    priceState: "loading" | "failed" | "ready";
    onToggle: (key: string) => void;
  } = $props();

  const SHOWN = 16;
  const KILLS_PER_HOUR = 40;
  const grouped = new Intl.NumberFormat("en");
  const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });
  const gp = (n: number) => (n >= 10_000 ? compact.format(n).toLowerCase() : grouped.format(Math.round(n)));

  let versions = $derived(Object.keys(boss.drops));
  let tiles = $derived(
    bossUniques(boss).map((item) => ({
      item,
      key: logKey(boss.id, item),
      rarity: firstRarity(boss, item) ?? "—",
      price: prices?.[item],
    })),
  );
  let got = $derived(tiles.filter((t) => isCollected(profile, t.key)).length);
  let auto = $derived(tiles.filter((t) => isAutoCollected(profile, t.key)).length);
  // "Show all" belongs to one boss and version; another boss starts collapsed.
  let allFor = $state<string>();
  let showAll = $derived(allFor === `${boss.id}|${version}`);
  let shown = $derived(showAll ? rows : rows.slice(0, SHOWN));
  let maxPerKill = $derived(Math.max(0, ...rows.map((r) => r.perKill ?? 0)));
  let averageKnown = $derived(priceState === "ready" && rows.length > 0);
  // While loading, and for untradeables, a price reads "—".
  const priceText = (row: LootRow) => (row.price !== undefined ? gp(row.price) : "—");
</script>

<div class="loot-grid">
  <GameWindow
    title="Collection log"
    trailing="{got} of {tiles.length}{auto ? ` · ${auto} ticked from your activity` : ''}"
  >
    {#if tiles.length}<ul class="log-grid">
        {#each tiles as tile (tile.key)}<li>
            <label class="log-tile" class:got={isCollected(profile, tile.key)}
              ><input
                type="checkbox"
                aria-label={tile.item}
                checked={isCollected(profile, tile.key)}
                onchange={() => onToggle(tile.key)}
              /><FallbackArt file="{tile.item}.png" size={36} icon={Package} className="tile-art" /><strong
                >{tile.item}</strong
              ><span class="tile-meta"
                >{tile.rarity}{#if tile.price !== undefined}{" · "}{gp(tile.price)}{/if}</span
              >{#if isAutoCollected(profile, tile.key)}<small>auto from activity</small>{/if}</label
            >
          </li>{/each}
      </ul>{:else}<p class="note">No collection log items are recorded for this boss.</p>{/if}
    <p class="note">
      Jagex doesn't publish drops, so tick them yourself. Drops in your RuneMetrics activity ("I found a…")
      tick themselves.
    </p>
  </GameWindow>

  <section class="tool-window" aria-labelledby="drop-table-title">
    <header class="window-title">
      <h2 id="drop-table-title">Drop table</h2>
      {#if versions.length > 1 && version}<div class="versions">
          <ChoiceStrip
            variant="joined"
            label="Version"
            name="boss-drop-version"
            value={version}
            choices={versions.map((v) => ({ value: v, label: v }))}
            onChange={onVersion}
          />
        </div>{/if}
    </header>
    {#if !rows.length}<p class="note">
        <a href={wikiHref(boss.wiki) + "#Drops"} target="_blank" rel="noopener noreferrer"
          >Drop table on the Wiki ↗</a
        >
      </p>{:else}
      <dl class="loot-stats">
        <div>
          <dt>Average per kill</dt>
          <dd class="gold">
            {averageKnown ? gp(summary.average) : "—"}
          </dd>
        </div>
        <div>
          <dt>Per hour at {KILLS_PER_HOUR} kills</dt>
          <dd>{averageKnown ? gp(summary.average * KILLS_PER_HOUR) : "—"}</dd>
        </div>
        <div class="top">
          <dt>Top contributors</dt>
          <dd>
            {#if averageKnown && summary.top.length}{#each summary.top as row, i (row.item + i)}{#if i}{", "}{/if}{row.item}
                <small>{gp(row.perKill ?? 0)}</small>{/each}{:else}—{/if}
          </dd>
        </div>
      </dl>
      {#if priceState === "failed"}<p class="note warn">Prices unavailable</p>{:else if priceState === "ready" && summary.unpriced > 0}<p
          class="note"
        >
          {summary.unpriced} {summary.unpriced === 1 ? "drop" : "drops"} unpriced
        </p>{/if}
      <table class="drop-table">
        <thead>
          <tr><th scope="col">Item</th><th scope="col">Qty</th><th scope="col">Rarity</th><th scope="col"
              >Price</th
            ><th scope="col">Value per kill</th></tr
          >
        </thead>
        <tbody>
          {#each shown as row, i (row.item + "|" + row.quantity + "|" + i)}<tr>
              <th scope="row"
                ><span class="item"
                  ><FallbackArt file="{row.item}.png" size={24} icon={Package} className="row-art" /><span
                    >{row.item}{#if isCollected(profile, logKey(boss.id, row.item))}<span class="have"
                        ><span aria-hidden="true"> ✓</span><span class="sr-only"> (in your collection log)</span></span
                      >{/if}{#if row.note}<small>{row.note}</small>{/if}</span
                  ></span
                ></th
              >
              <td data-label="Qty">{row.quantity}</td>
              <td data-label="Rarity">{row.rarity}</td>
              <td data-label="Price">{priceText(row)}</td>
              <td data-label="Per kill"
                >{#if row.perKill !== undefined}<span class="per-kill"
                    ><span class="bar" aria-hidden="true"
                      ><span style:width="{maxPerKill ? (row.perKill / maxPerKill) * 100 : 0}%"></span></span
                    >{gp(row.perKill)}</span
                  >{:else}—{/if}</td
              >
            </tr>{/each}
        </tbody>
      </table>
      {#if rows.length > SHOWN && !showAll}<button
          type="button"
          class="text-link show-all"
          onclick={() => (allFor = `${boss.id}|${version}`)}>Show all {rows.length} drops ›</button
        >{/if}
    {/if}
  </section>
</div>

<style>
  .loot-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.25fr);
    gap: 20px;
    align-items: start;
  }
  .note {
    margin: 0;
    padding: 10px 14px 14px;
    font-size: var(--font-caption);
    color: var(--muted);
  }
  .note.warn {
    color: var(--warn);
  }
  .note a {
    color: var(--gold-bright);
    font-weight: 600;
  }
  .log-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
    margin: 0;
    padding: 14px;
    list-style: none;
  }
  .log-tile {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    height: 100%;
    box-sizing: border-box;
    padding: 12px 8px 10px;
    background: var(--well);
    border: 1px solid var(--line);
    border-radius: 3px;
    text-align: center;
    cursor: pointer;
  }
  .log-tile:hover {
    border-color: var(--gold);
  }
  .log-tile:has(input:focus-visible) {
    outline: 2px solid var(--gold-bright);
    outline-offset: 2px;
  }
  .log-tile.got {
    border-color: #4c6b5c;
    background: #182a24;
  }
  .log-tile input {
    position: absolute;
    top: 6px;
    left: 6px;
    margin: 0;
    accent-color: var(--green);
  }
  .log-tile :global(.tile-art) {
    width: 36px;
    height: 36px;
  }
  .log-tile strong {
    font-size: 13px;
    line-height: 17px;
    overflow-wrap: anywhere;
  }
  .tile-meta {
    font-size: 12px;
    color: var(--muted);
  }
  .log-tile small {
    font-size: 11px;
    color: var(--green);
  }
  .window-title .versions {
    margin-left: auto;
    min-width: 0;
  }
  .versions :global(.choice-fieldset) {
    margin: 0;
  }
  .versions :global(legend) {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
  }
  .versions :global(.choice-option) {
    min-height: 32px;
  }
  .loot-stats {
    display: flex;
    flex-wrap: wrap;
    gap: 10px 28px;
    margin: 0;
    padding: 14px 14px 4px;
  }
  .loot-stats dt {
    font-size: 12px;
    line-height: 17px;
    font-weight: 700;
    letter-spacing: 1.55px;
    text-transform: uppercase;
    color: var(--muted);
  }
  .loot-stats dd {
    margin: 2px 0 0;
    font: 600 20px/26px Cinzel, Georgia, serif;
    color: var(--heading);
  }
  .loot-stats dd.gold {
    color: var(--gold-bright);
  }
  .loot-stats .top {
    flex: 1 1 220px;
  }
  .loot-stats .top dd {
    font: 600 13px/20px "DM Sans", sans-serif;
    color: var(--text);
  }
  .loot-stats small {
    font-weight: 400;
    color: var(--muted);
  }
  .drop-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
  }
  .drop-table thead th {
    padding: 8px 14px;
    border-bottom: 1px solid var(--line);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 1px;
    text-transform: uppercase;
    text-align: left;
    color: var(--muted);
  }
  .drop-table tbody th,
  .drop-table td {
    padding: 6px 14px;
    border-bottom: 1px solid var(--line);
    text-align: left;
    font-weight: 400;
    white-space: nowrap;
  }
  .drop-table tbody th {
    white-space: normal;
  }
  .item {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .item :global(.row-art) {
    width: 24px;
    height: 24px;
  }
  .item > span {
    display: flex;
    flex-direction: column;
  }
  .item small {
    font-size: 11px;
    color: var(--muted);
  }
  .have {
    color: var(--green);
  }
  .per-kill {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .bar {
    display: block;
    width: 64px;
    height: 6px;
    background: var(--well);
    border: 1px solid var(--line);
    border-radius: 3px;
    overflow: hidden;
  }
  .bar span {
    display: block;
    height: 100%;
    background: var(--gold);
  }
  .show-all {
    margin: 10px 14px 14px;
  }
  @container boss (max-width: 860px) {
    .loot-grid {
      grid-template-columns: minmax(0, 1fr);
    }
  }
  /* Narrow: each drop becomes a card row. */
  @media (max-width: 760px) {
    .loot-grid {
      grid-template-columns: minmax(0, 1fr);
    }
    .drop-table thead {
      display: none;
    }
    .drop-table tr {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 4px 12px;
      padding: 8px 14px;
      border-bottom: 1px solid var(--line);
    }
    .drop-table tbody th,
    .drop-table td {
      padding: 0;
      border: 0;
    }
    .drop-table tbody th {
      grid-column: 1 / -1;
    }
    .drop-table td::before {
      content: attr(data-label) " ";
      color: var(--muted);
    }
  }
  @media (max-width: 520px) {
    .log-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
</style>
