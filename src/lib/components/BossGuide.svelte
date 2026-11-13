<script lang="ts">
  import { Info, Package } from "@lucide/svelte";
  import type { BossGuide } from "../../bossGuides";
  import { bossById } from "../../bosses";
  import type { BossRecord } from "../../bossTypes";
  import { toggleItem, type Profile } from "../../data";
  import { wikiHref } from "../../wiki";
  import { checkedLabel, setupGear } from "../bossPage";
  import { getCompass } from "../compassContext";
  import { bossPath } from "../navigation";
  import { packKey } from "../packing";
  import ChoiceStrip from "./ChoiceStrip.svelte";
  import FallbackArt from "./FallbackArt.svelte";
  import GameWindow from "./GameWindow.svelte";
  import ItemList from "./ItemList.svelte";

  let {
    boss,
    profile,
    guide,
    strategyHref,
    next,
  }: {
    boss: BossRecord;
    profile: Profile;
    guide: BossGuide | undefined;
    strategyHref: string;
    /** The next boss on the player's ladder. */
    next: BossRecord | undefined;
  } = $props();
  const compass = getCompass();
  const STYLE_LABEL = { melee: "Melee", ranged: "Ranged", magic: "Magic" } as const;

  let iron = $derived(profile.kind === "Solo Ironman" || profile.kind === "Group Ironman");
  let task = $derived("boss-" + boss.id);
  let packed = $derived(guide?.bring.filter((line) => profile.packed.includes(packKey(task, line))) ?? []);
  // The chosen style belongs to one boss; another boss opens on its first style.
  let picked = $state<{ id: string; style: string }>();
  let setup = $derived(
    guide?.setup.find((s) => picked?.id === boss.id && s.style === picked.style) ?? guide?.setup[0],
  );
  let members = $derived(profile.mode === "members");
  let ironNext = $derived(guide?.ironman?.next ? bossById(guide.ironman.next) : undefined);

  function togglePacked(line: string) {
    const key = packKey(task, line);
    compass.updateProfile((p) => ({ ...p, packed: toggleItem(p.packed, key) }));
  }
</script>

{#snippet gear(text: string)}
  {@const items = setup ? setupGear(setup.style, text, members) : []}
  {#if items.length}<ul class="gear" aria-label="Example gear">
      {#each items as item (item.name)}<li>
          <a
            href={wikiHref(item.wiki ?? item.name)}
            target="_blank"
            rel="noopener noreferrer"
            title={item.name}
            aria-label={item.name + " on RuneScape Wiki"}
            ><FallbackArt file={item.image} size={30} icon={Package} className="gear-art" /></a
          >
        </li>{/each}
    </ul>{/if}
{/snippet}

{#if !guide}<GameWindow title="Guide">
    <p class="coming">
      Guide coming — <a href={strategyHref} target="_blank" rel="noopener noreferrer">Wiki strategy ↗</a>
    </p>
  </GameWindow>{:else}
  <div class="guide-grid">
    <div class="guide-col">
      <section class="tool-window" aria-labelledby="mechanics-title">
        <header class="window-title">
          <h2 id="mechanics-title">Key mechanics</h2>
          <span>Written for Compass · checked {checkedLabel(guide.checked)}</span>
        </header>
        <ol class="mechanics">
          {#each guide.mechanics as step, i (step.title)}<li>
              <span class="step-number" aria-hidden="true">{i + 1}</span><span
                ><strong>{step.title}</strong><span>{step.detail}</span></span
              >
            </li>{/each}
        </ol>
        <a class="wiki-more" href={strategyHref} target="_blank" rel="noopener noreferrer"
          >Full strategy on the Wiki ↗</a
        >
      </section>

      {#if setup}<section class="tool-window" aria-labelledby="setup-title">
          <header class="window-title">
            <h2 id="setup-title">Recommended setup</h2>
            {#if guide.setup.length > 1}<div class="styles">
                <ChoiceStrip
                  variant="joined"
                  label="Combat style"
                  name="boss-setup-style"
                  value={setup.style}
                  choices={guide.setup.map((s) => ({ value: s.style, label: STYLE_LABEL[s.style] }))}
                  onChange={(style) => (picked = { id: boss.id, style })}
                />
              </div>{:else}<span>{STYLE_LABEL[setup.style]}</span>{/if}
          </header>
          <div class="setup">
            <div>
              <span class="eyebrow">Minimum</span>
              <p>{setup.minimum}</p>
              {@render gear(setup.minimum)}
            </div>
            <div>
              <span class="eyebrow">Comfortable</span>
              <p>{setup.comfortable}</p>
              {@render gear(setup.comfortable)}
            </div>
          </div>
          <p class="note">
            Gear icons are examples from the Skills page's equipment tables, at the tier each line states.
          </p>
        </section>{/if}
    </div>

    <div class="guide-col">
      <section class="tool-window" aria-labelledby="bring-title">
        <header class="window-title">
          <h2 id="bring-title">Bring with you</h2>
          <span>{packed.length} of {guide.bring.length} packed</span>
        </header>
        <div class="bring">
          <ItemList items={guide.bring} checked={packed} onToggle={togglePacked} />
        </div>
        <div class="get-there">
          <Info size={18} aria-hidden="true" /><span><strong>Get there</strong>{guide.getThere}</span>
        </div>
      </section>

      {#if iron && guide.ironman}<section class="tool-window iron" aria-labelledby="iron-title">
          <header class="window-title">
            <h2 id="iron-title">Ironman</h2>
            <span>your profile is an Ironman</span>
          </header>
          <div class="iron-body">
            <div>
              <span class="eyebrow">Before this boss</span>
              <ul>
                {#each guide.ironman.before as line (line)}<li>{line}</li>{/each}
              </ul>
            </div>
            <div>
              <span class="eyebrow">What it gives you</span>
              <ul>
                {#each guide.ironman.gives as line (line)}<li>{line}</li>{/each}
              </ul>
            </div>
            {#if ironNext}<p class="iron-next">
                Next for ironmen: <a href={bossPath(ironNext.id)}>{ironNext.name} ›</a>
              </p>{/if}
          </div>
        </section>{/if}

      <section class="tool-window" aria-labelledby="leads-title">
        <header class="window-title"><h2 id="leads-title">Leads to</h2></header>
        <p class="leads">
          {#if next}<a href={bossPath(next.id)}>{next.name} ›</a><span
              >Next on the ladder: {next.tier} tier, level {next.level}{next.members ? "" : ", F2P"}.</span
            >{:else}<span>This is the last boss on your ladder.</span>{/if}
        </p>
      </section>
    </div>
  </div>
{/if}

<style>
  .guide-grid {
    display: grid;
    grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
    gap: 20px;
    align-items: start;
  }
  .guide-col {
    display: flex;
    flex-direction: column;
    gap: 20px;
    min-width: 0;
  }
  .coming {
    margin: 0;
    padding: 16px;
  }
  .coming a,
  .wiki-more,
  .leads a,
  .iron-next a {
    color: var(--gold-bright);
    font-weight: 600;
  }
  .eyebrow {
    display: block;
    font-size: 12px;
    line-height: 17px;
    font-weight: 700;
    letter-spacing: 1.55px;
    text-transform: uppercase;
    color: var(--muted);
  }
  .mechanics {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin: 0;
    padding: 14px 16px;
    list-style: none;
  }
  .mechanics li {
    display: flex;
    gap: 12px;
  }
  .mechanics li > span:last-child {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }
  .step-number {
    display: grid;
    flex: none;
    place-items: center;
    width: 26px;
    height: 26px;
    border: 1px solid var(--gold);
    border-radius: 50%;
    color: var(--gold-bright);
    font-weight: 700;
  }
  .wiki-more {
    display: inline-block;
    margin: 0 16px 14px;
  }
  .window-title .styles {
    margin-left: auto;
    min-width: 0;
  }
  .styles :global(.choice-fieldset) {
    margin: 0;
  }
  .styles :global(legend) {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
  }
  .styles :global(.choice-option) {
    min-height: 32px;
  }
  .setup {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .setup > div {
    padding: 14px 16px;
  }
  .setup > div + div {
    border-left: 1px solid var(--line);
  }
  .setup p {
    margin: 4px 0 8px;
  }
  .gear {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .gear a {
    display: grid;
    place-items: center;
    width: 40px;
    height: 40px;
    background: var(--well);
    border: 1px solid var(--line);
    border-radius: 3px;
  }
  .gear a:hover {
    border-color: var(--gold);
  }
  .gear :global(.gear-art) {
    width: 30px;
    height: 30px;
  }
  .note {
    margin: 0;
    padding: 0 16px 14px;
    font-size: var(--font-caption);
    color: var(--muted);
  }
  .bring {
    padding: 12px 16px;
  }
  .get-there {
    display: flex;
    gap: 12px;
    padding: 12px 16px;
    border-top: 1px solid var(--line);
  }
  .get-there :global(svg) {
    flex: none;
    color: var(--blue);
  }
  .get-there span {
    display: flex;
    flex-direction: column;
  }
  .iron-body {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px 20px;
    padding: 14px 16px;
  }
  .iron-body ul {
    margin: 4px 0 0;
    padding-left: 18px;
  }
  .iron-next {
    grid-column: 1 / -1;
    margin: 0;
  }
  .leads {
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin: 0;
    padding: 14px 16px;
  }
  .leads span {
    color: var(--muted);
  }
  @container boss (max-width: 860px) {
    .guide-grid,
    .setup,
    .iron-body {
      grid-template-columns: minmax(0, 1fr);
    }
    .setup > div + div {
      border-left: 0;
      border-top: 1px solid var(--line);
    }
  }
</style>
