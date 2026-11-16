<script lang="ts">
  import { Plus, X } from "@lucide/svelte";
  import { untrack } from "svelte";
  import type { Profile } from "../../data";
  import {
    ALTARS,
    FAMILIARS,
    INFINITY_OUTFIT_CAPACITY,
    POUCHES,
    RC_CHECKED,
    SAVVY_SOURCE,
    XP_METHODS,
    type EssenceKind,
  } from "../../runecraftingGuide";
  import {
    altarAccess,
    craftNow,
    defaultXpRule,
    essencePerTrip,
    isIronman,
    planStock,
    runesPerEssence,
    unlockNext,
    type EssenceSourceView,
    type Req,
    type ReqState,
    type UnlockStep,
  } from "../../runecraftingPlan";
  import type { Prices } from "../bossLoot";
  import { getCompass } from "../compassContext";
  import { fetchPrices } from "../priceClient";
  import Button from "./Button.svelte";
  import CheckedSources from "./CheckedSources.svelte";
  import ChoiceStrip from "./ChoiceStrip.svelte";
  import GameArt from "./GameArt.svelte";
  import GameWindow from "./GameWindow.svelte";
  import StatusChip from "./StatusChip.svelte";
  import WikiAction from "./WikiAction.svelte";

  // "guide" is the centre column (Craft now, Rune stockpile, Unlock next); "kit" is the aside (Your kit).
  let { profile, part = "guide" }: { profile: Profile; part?: "guide" | "kit" } = $props();
  const compass = getCompass();

  type Kit = NonNullable<Profile["runecrafting"]>;
  const MAX_STOCK_ROWS = 30;
  const MAX_RUNES = 100_000_000;
  const TONE = { met: "ok", unmet: "bad", unknown: "warn", check: "info" } as const;
  const WORD: Record<ReqState, string> = { met: "met", unmet: "unmet", unknown: "unknown", check: "check in game" };
  const TRACK: Record<UnlockStep["track"], string> = {
    savvy: "Savvy Runecrafting",
    pouch: "Pouch",
    altar: "Altar",
    multiplier: "Multiple runes",
    familiar: "Familiar",
    milestone: "Milestone",
  };
  const count = new Intl.NumberFormat("en-GB");
  const short = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });
  const xp = (n: number) => short.format(n).toLowerCase();
  const unique = (list: string[]) => [...new Set(list)];

  // Passed straight to the planner: the saved kit must stay assignable to RunecraftingKit.
  const kit = $derived(profile.runecrafting ?? {});
  const level = $derived(profile.levels.Runecrafting);
  const ironman = $derived(isIronman(profile.kind));
  const rule = $derived(kit.xpRule ?? defaultXpRule(profile.kind));
  const perTrip = $derived(essencePerTrip(kit, level, profile.levels.Summoning));
  const craft = $derived(craftNow(profile, kit, level));
  const picks = $derived("needsLevel" in craft ? undefined : craft);
  // Saved rows keep their index so edits hit the right row; runes with no altar are skipped.
  const rows = $derived(
    (kit.stock ?? []).flatMap((target, index) => {
      const altar = ALTARS.find((a) => a.rune === target.rune);
      if (!altar) return [];
      return [{ index, target, altar, plan: level === undefined ? undefined : planStock(profile, kit, level, target) }];
    }),
  );
  const addable = $derived(ALTARS.filter((a) => !(kit.stock ?? []).some((t) => t.rune === a.rune)));
  let picked = $state("");
  const toAdd = $derived(addable.some((a) => a.rune === picked) ? picked : (addable[0]?.rune ?? ""));
  const steps = $derived(level === undefined ? [] : unlockNext(profile, kit, level));
  const kitUnrecorded = $derived(!kit.pouches?.length && !kit.familiar);

  // For profit (Regular account only): runes the player can craft now, by GE price × runes per essence.
  const profitAltars = $derived(
    part !== "guide" || ironman || level === undefined
      ? []
      : ALTARS.filter((a) => altarAccess(profile, a).every((r) => r.state !== "unmet")),
  );
  // shortcut: a failed price fetch isn't retried until the craftable rune set changes or the page reloads; add a
  // retry button if users hit rate limits.
  let priced = $state<{ key: string; done: boolean; prices?: Prices }>({ key: "", done: false });
  $effect(() => {
    const names = profitAltars.map((a) => `${a.rune} rune`);
    const key = names.join("|");
    if (!key || untrack(() => priced.key) === key) return;
    priced = { key, done: false };
    void fetchPrices(names).then((prices) => {
      if (priced.key === key) priced = { key, done: true, prices };
    });
  });
  const profit = $derived(
    level === undefined
      ? []
      : profitAltars
          .flatMap((altar) => {
            const price = priced.prices?.[`${altar.rune} rune`];
            const per = runesPerEssence(altar, level);
            return price === undefined ? [] : [{ altar, per, value: price * per }];
          })
          .sort((a, b) => b.value - a.value)
          .slice(0, 5),
  );

  const craftSources = $derived(
    unique([
      ...(picks?.xp?.method.sources ?? XP_METHODS[0].sources),
      ...(picks?.stock?.altar.sources ?? []),
      ...(picks?.xp?.sources ?? []).flatMap((s) => s.source.sources),
    ]),
  );
  const stockSources = $derived(unique([...rows.flatMap((r) => r.altar.sources), ...POUCHES[0].sources]));
  const unlockSources = $derived(unique([...steps.map((s) => s.wiki), ...SAVVY_SOURCE.sources]));
  const kitSources = $derived(
    unique([...POUCHES.flatMap((p) => p.sources), ...FAMILIARS.flatMap((f) => f.sources)]),
  );

  function saveKit(change: (kit: Kit) => Kit) {
    compass.updateProfile((p) => ({ ...p, runecrafting: change(p.runecrafting ?? {}) }));
  }
  function setRule(value: string) {
    const xpRule = value === "fastest" ? "fastest" : "save-essence";
    saveKit((k) => ({ ...k, xpRule }));
  }
  function togglePouch(id: (typeof POUCHES)[number]["id"]) {
    saveKit((k) => {
      const owned = k.pouches ?? [];
      const has = owned.includes(id);
      // Rebuilt in POUCHES order so the saved list stays unique.
      return { ...k, pouches: POUCHES.map((p) => p.id).filter((p) => (p === id ? !has : owned.includes(p))) };
    });
  }
  function setFamiliar(value: string) {
    const familiar = FAMILIARS.find((f) => f.id === value)?.id;
    saveKit((k) => ({ ...k, familiar }));
  }
  function setStock(index: number, field: "have" | "want", input: HTMLInputElement) {
    const typed = Math.trunc(Number(input.value));
    const n = Number.isFinite(typed) ? Math.min(MAX_RUNES, Math.max(0, typed)) : 0;
    input.value = String(n);
    saveKit((k) => ({
      ...k,
      stock: (k.stock ?? []).map((row, i) => (i === index ? { ...row, [field]: n } : row)),
    }));
  }
  function removeStock(index: number) {
    saveKit((k) => ({ ...k, stock: (k.stock ?? []).filter((_, i) => i !== index) }));
  }
  function addStock() {
    const rune = toAdd;
    saveKit((k) => {
      const stock = k.stock ?? [];
      if (!rune || stock.length >= MAX_STOCK_ROWS || stock.some((t) => t.rune === rune)) return k;
      return { ...k, stock: [...stock, { rune, have: 0, want: 0 }] };
    });
  }
</script>

{#snippet chips(reqs: Req[])}
  {#if reqs.length}
    <ul class="chips">
      {#each reqs as req, i (i)}
        <li><StatusChip tone={TONE[req.state]} label={`${req.text} · ${WORD[req.state]}`} /></li>
      {/each}
    </ul>
  {/if}
{/snippet}

{#snippet sourceList(kind: EssenceKind, sources: EssenceSourceView[])}
  <ol class="sources">
    {#each sources as { source, reqs } (source.id)}
      <li>
        <a href={source.wiki} target="_blank" rel="noopener noreferrer"
          >{source.label}<span class="sr-only"> (opens a new tab)</span></a
        >
        <span class="cap">{source.note}</span>
        {@render chips(reqs)}
      </li>
    {:else}
      <li class="cap">No {kind} essence source is listed.</li>
    {/each}
  </ol>
{/snippet}

{#if part === "kit"}
  <div id="rc-kit" class="rc-kit">
    <GameWindow title="Your kit" trailing={`${kit.pouches?.length ?? 0} of ${POUCHES.length} pouches`}>
      <div class="body">
        <p class="cap">Tick what you have. Anything not ticked counts as not owned.</p>
        <h4>Essence pouches</h4>
        <ul class="kit-list">
          {#each POUCHES as pouch (pouch.id)}
            {@const owned = kit.pouches?.includes(pouch.id) ?? false}
            <li>
              <label class="check">
                <input type="checkbox" checked={owned} onchange={() => togglePouch(pouch.id)} />
                <GameArt file={pouch.image} size={28} />
                <span class="grow">{pouch.name} <span class="cap">· {pouch.capacity} essence</span></span>
              </label>
              {#if level === undefined || level < pouch.level}
                {@render chips([
                  {
                    text: owned ? `Needs level ${pouch.level} to use` : `Runecrafting ${pouch.level}`,
                    state: level === undefined ? "unknown" : "unmet",
                  },
                ])}
              {/if}
              {#if !owned}
                <p class="cap how">{pouch.how}</p>
                {#if pouch.otherRequirements.length}
                  {@render chips(pouch.otherRequirements.map((text) => ({ text, state: "check" as const })))}
                {/if}
              {/if}
            </li>
          {/each}
        </ul>
        <ChoiceStrip
          label="Abyssal familiar"
          name="rc-familiar"
          value={kit.familiar ?? "none"}
          choices={[
            { value: "none", label: "None", detail: "+0" },
            ...FAMILIARS.map((f) => ({
              value: f.id,
              label: f.name.replace("Abyssal ", ""),
              image: f.image,
              detail: `+${f.capacity}`,
              description: `${f.name}, carries ${f.capacity} essence`,
            })),
          ]}
          onChange={setFamiliar}
        />
        {@render chips(
          FAMILIARS.filter((f) => (profile.levels.Summoning ?? 0) < f.summoning).map((f) => ({
            text: `${f.name}: Summoning ${f.summoning}`,
            state: profile.levels.Summoning === undefined ? ("unknown" as const) : ("unmet" as const),
          })),
        )}
        {#if !kit.familiar}<p class="cap">{FAMILIARS[0].how}</p>{/if}
        <h4>Other</h4>
        <label class="check">
          <input
            type="checkbox"
            checked={kit.infinityOutfit ?? false}
            onchange={() => saveKit((k) => ({ ...k, infinityOutfit: !k.infinityOutfit }))}
          />
          <span class="grow">Infinity ethereal outfit <span class="cap">· +{INFINITY_OUTFIT_CAPACITY} essence</span></span>
        </label>
        {#if !kit.infinityOutfit}<WikiAction page="Infinity ethereal outfit" label="How to get it" />{/if}
        <label class="check">
          <input
            type="checkbox"
            checked={kit.attuner ?? false}
            onchange={() => saveKit((k) => ({ ...k, attuner: !k.attuner }))}
          />
          <span class="grow">Runic attuner <span class="cap">· rare drop from The Gate of Elidinis</span></span>
        </label>
        {#if !kit.attuner}<WikiAction page="Runic attuner" label="How to get it" />{/if}
        <p class="cap"><CheckedSources checked={RC_CHECKED} sources={kitSources} /></p>
      </div>
    </GameWindow>
  </div>
{:else}
  <div class="rc-guide">
    <GameWindow title="Craft now" trailing="For your level, quests and kit">
      <div class="body">
        {#if !picks}
          <p class="prompt" role="status">
            <a href="/levels">Record your Runecrafting level</a> to see what to craft now, your stock numbers and what to
            unlock next.
          </p>
        {:else}
          <ChoiceStrip
            label="XP pick"
            name="rc-xp-rule"
            value={rule}
            choices={[
              { value: "save-essence", label: "Save essence", detail: "No-essence methods first" },
              { value: "fastest", label: "Fastest", detail: "Uses essence you gather" },
            ]}
            onChange={setRule}
          />
          <div class="picks">
            <article class="card" aria-labelledby="rc-for-xp">
              <h4 id="rc-for-xp">For XP</h4>
              {#if picks.xp}
                {@const { method, reqs, sources } = picks.xp}
                <div class="pick">
                  <GameArt file={method.image} size={48} className="pick-art" />
                  <div class="pick-copy">
                    <p class="big">
                      <a href={method.wiki} target="_blank" rel="noopener noreferrer"
                        >{method.label}<span class="sr-only"> (opens a new tab)</span></a
                      >
                    </p>
                    <p class="cap">
                      <!-- A provisional rate can span several Wiki bands, so only its low end is shown. -->
                      {method.provisional
                        ? `from ${xp(method.rate[0])}`
                        : `${xp(method.rate[0])}–${xp(method.rate[1])}`} XP/hr base{#if method.provisional}{" "}<span
                          class="estimate">estimate</span
                        >{/if} · {method.needsEssence ? "uses essence" : "uses no essence"}
                    </p>
                    <p class="cap">{method.where}</p>
                  </div>
                </div>
                {@render chips(reqs)}
                {#if sources.length}
                  <h4>Best ways to get {sources[0].source.kind} essence</h4>
                  {@render sourceList(sources[0].source.kind, sources)}
                {/if}
                <p class="cap"><CheckedSources checked={method.checked} sources={method.sources} /></p>
              {:else}
                <p class="cap">No XP method fits your level, quests and kit yet.</p>
              {/if}
            </article>

            <article class="card" aria-labelledby="rc-for-stock">
              <h4 id="rc-for-stock">For your stock</h4>
              {#if picks.stock}
                {@const { altar, remaining, perEssence, essence } = picks.stock}
                <div class="pick">
                  <GameArt file={altar.image} size={48} className="pick-art" />
                  <div class="pick-copy">
                    <p class="big">
                      <a href={altar.wiki} target="_blank" rel="noopener noreferrer"
                        >{altar.rune} runes<span class="sr-only"> (opens a new tab)</span></a
                      > · {count.format(remaining)} short
                    </p>
                    <p class="cap">
                      Furthest from its target · {perEssence} per essence at {level} · {count.format(essence)}
                      {altar.essence} essence
                    </p>
                  </div>
                </div>
              {:else if !rows.length}
                <p class="cap">Add a rune to the stockpile to get a pick here.</p>
              {:else}
                <p class="cap">No rune on your list is short of its target at an altar you can reach.</p>
              {/if}
              {#each picks.skippedLocked as skipped, i (i)}
                <p class="cap">{skipped.altar.rune} runes skipped, altar locked:</p>
                {@render chips(skipped.locked)}
              {/each}
            </article>
          </div>

          {#if !ironman}
            <article class="card" aria-labelledby="rc-for-profit">
              <h4 id="rc-for-profit">For profit</h4>
              {#if !priced.done}
                <p class="cap" role="status">Loading prices…</p>
              {:else if !priced.prices}
                <p class="cap" role="status">Prices unavailable</p>
              {:else if !profit.length}
                <p class="cap">No GE price for the runes you can craft now.</p>
              {:else}
                <ol class="profit">
                  {#each profit as row (row.altar.rune)}
                    <li>
                      <GameArt file={row.altar.image} size={24} />
                      <span class="grow">{row.altar.rune} runes <span class="cap">· {row.per} per essence</span></span>
                      <span class="num">{count.format(Math.round(row.value))} gp</span>
                    </li>
                  {/each}
                </ol>
                <p class="cap">GE value per essence, from live Grand Exchange prices.</p>
              {/if}
            </article>
          {/if}
        {/if}
        <p class="cap"><CheckedSources checked={RC_CHECKED} sources={craftSources} /></p>
      </div>
    </GameWindow>

    <GameWindow title="Rune stockpile" trailing={`${perTrip} essence a trip, from the kit you can use`}>
      <div class="body">
        {#if kitUnrecorded}
          <p class="prompt" role="status">
            <a href="#rc-kit">Tick your pouches and familiar</a> for an accurate count.
          </p>
        {/if}
        {#if rows.length}
          <div class="table-scroll">
            <table>
              <thead>
                <tr>
                  <th scope="col">Rune</th>
                  <th scope="col">Have</th>
                  <th scope="col">Want</th>
                  {#if level !== undefined}
                    <th scope="col">Per essence</th>
                    <th scope="col">Essence</th>
                    <th scope="col">Trips</th>
                  {/if}
                  <th scope="col"><span class="sr-only">Remove</span></th>
                </tr>
              </thead>
              <tbody>
                {#each rows as { index, target, altar, plan } (index)}
                  <tr>
                    <td>
                      <span class="rune">
                        <GameArt file={altar.image} size={28} />
                        <a href={altar.wiki} target="_blank" rel="noopener noreferrer"
                          >{altar.rune}<span class="sr-only"> rune (opens a new tab)</span></a
                        >
                      </span>
                    </td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        max={MAX_RUNES}
                        step="1"
                        aria-label={`${altar.rune} runes you have`}
                        value={target.have}
                        onchange={(e) => setStock(index, "have", e.currentTarget)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        max={MAX_RUNES}
                        step="1"
                        aria-label={`${altar.rune} runes you want`}
                        value={target.want}
                        onchange={(e) => setStock(index, "want", e.currentTarget)}
                      />
                    </td>
                    {#if plan}
                      {#if plan.locked.length}
                        <td colspan="3">
                          <p class="cap">{altar.rune} altar locked:</p>
                          {@render chips(plan.locked)}
                        </td>
                      {:else if plan.remaining === 0}
                        <td class="num">{plan.perEssence}</td>
                        <td colspan="2"><StatusChip tone="ok" label="At target" /></td>
                      {:else}
                        <td class="num">{plan.perEssence}</td>
                        <td class="num">{count.format(plan.essence)} <span class="cap">{altar.essence}</span></td>
                        <td class="num strong">{count.format(plan.trips)}</td>
                      {/if}
                    {/if}
                    <td>
                      <Button
                        variant="quiet"
                        className="remove"
                        aria-label={`Remove ${altar.rune} runes`}
                        onclick={() => removeStock(index)}><X size={16} aria-hidden="true" /></Button
                      >
                    </td>
                  </tr>
                  {#if plan && !plan.locked.length && plan.remaining > 0}
                    <tr class="sources-row">
                      <td colspan="7">
                        <details>
                          <summary>Where to get {altar.essence} essence</summary>
                          {@render sourceList(altar.essence, plan.sources)}
                        </details>
                      </td>
                    </tr>
                  {/if}
                {/each}
              </tbody>
            </table>
          </div>
        {:else}
          <p class="cap">No runes yet. Add the runes you want a back stock of.</p>
        {/if}
        <div class="add">
          <label class="picker"
            >Rune to add
            <select value={toAdd} disabled={!addable.length} onchange={(e) => (picked = e.currentTarget.value)}>
              {#each addable as altar (altar.rune)}
                <option value={altar.rune}>{altar.rune}</option>
              {/each}
            </select>
          </label>
          <Button onclick={addStock} disabled={!toAdd || (kit.stock?.length ?? 0) >= MAX_STOCK_ROWS}
            ><Plus size={16} aria-hidden="true" />Add a rune</Button
          >
        </div>
        {#if (kit.stock?.length ?? 0) >= MAX_STOCK_ROWS}
          <p class="cap">The list holds up to {MAX_STOCK_ROWS} runes.</p>
        {/if}
        <p class="cap">
          Have is what you type. Compass can't see your bank. Boosts like the cape and potions aren't counted.
        </p>
        <p class="cap"><CheckedSources checked={RC_CHECKED} sources={stockSources} /></p>
      </div>
    </GameWindow>

    {#if level !== undefined}
      <GameWindow title="Unlock next" trailing="Next step on each track">
        <div class="body">
          {#if steps.length}
            <ul class="steps">
              {#each steps as step, i (i)}
                <li class="card step">
                  <GameArt file={step.image} size={36} className="pick-art" />
                  <div class="pick-copy">
                    <h4>{TRACK[step.track]}</h4>
                    <p class="big">
                      <a href={step.wiki} target="_blank" rel="noopener noreferrer"
                        >{step.name}<span class="sr-only"> (opens a new tab)</span></a
                      >
                    </p>
                    <p class="cap">{step.how}</p>
                    {@render chips(step.reqs)}
                  </div>
                </li>
              {/each}
            </ul>
          {:else}
            <p class="cap">Nothing left to unlock on these tracks.</p>
          {/if}
          <p class="cap"><CheckedSources checked={RC_CHECKED} sources={unlockSources} /></p>
        </div>
      </GameWindow>
    {/if}
  </div>
{/if}

<style>
  .rc-guide,
  .rc-kit {
    display: flex;
    flex-direction: column;
    gap: 20px;
    min-width: 0;
  }
  .body {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 14px 16px;
    min-width: 0;
  }
  .body p {
    margin: 0;
    overflow-wrap: anywhere;
  }
  .body :global(.choice-fieldset) {
    margin: 0;
  }
  .cap {
    margin: 0;
    font-size: var(--font-caption);
    line-height: 1.5;
    color: var(--muted);
  }
  h4,
  th {
    margin: 0;
    font-size: var(--font-caption);
    font-weight: 700;
    letter-spacing: 1.55px;
    text-transform: uppercase;
    color: var(--muted);
  }
  .body a {
    color: var(--gold-bright);
    text-decoration: underline;
    text-underline-offset: 3px;
  }
  .big {
    font-weight: 600;
    font-size: 16px;
    color: var(--heading);
  }
  .num {
    font-variant-numeric: tabular-nums;
  }
  .strong {
    font-weight: 600;
    color: var(--heading);
  }
  .grow {
    flex: 1 1 auto;
    min-width: 0;
  }
  .estimate {
    padding: 0 6px;
    border: 1px solid var(--warn);
    border-radius: 4px;
    color: var(--warn);
    font-weight: 600;
  }
  .prompt {
    padding: 8px 10px;
    border: 1px solid var(--warn);
    border-radius: 3px;
    background: var(--well);
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .chips :global(.status-chip) {
    white-space: normal;
  }
  .picks {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr));
    gap: 12px;
  }
  .card {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 12px;
    min-width: 0;
    border: 1px solid var(--line);
    border-radius: 4px;
    background: var(--well);
  }
  .pick {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    min-width: 0;
  }
  .pick-copy {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }
  .body :global(.pick-art) {
    flex: none;
    aspect-ratio: 1 / 1;
    object-fit: contain;
    border: 1px solid var(--line);
    border-radius: 3px;
    background: var(--panel);
  }
  .sources,
  .profit,
  .steps,
  .kit-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin: 0;
    padding-left: 18px;
  }
  .sources li {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .steps,
  .kit-list {
    padding: 0;
    list-style: none;
  }
  .step {
    flex-direction: row;
    align-items: flex-start;
    gap: 12px;
  }
  .profit li {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .table-scroll {
    overflow-x: auto;
    overscroll-behavior-x: contain;
  }
  table {
    width: 100%;
    min-width: 560px;
    border-collapse: collapse;
  }
  th {
    letter-spacing: 1px;
    text-align: left;
    padding: 6px 8px;
    border-bottom: 1px solid var(--line);
  }
  td {
    padding: 8px;
    border-bottom: 1px solid var(--line);
    vertical-align: top;
  }
  tr:has(+ .sources-row) td {
    border-bottom: 0;
  }
  .sources-row td {
    padding-top: 0;
  }
  details > summary {
    min-height: 32px;
    cursor: pointer;
    font-size: var(--font-caption);
    color: var(--text);
  }
  .rune {
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }
  td input {
    width: 104px;
    min-height: 36px;
  }
  td :global(.remove) {
    min-height: 36px;
    padding: 0 8px;
  }
  .add {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: 10px;
  }
  .picker {
    display: grid;
    gap: 6px;
    font-weight: 600;
  }
  .picker select {
    min-width: 140px;
    min-height: 44px;
  }
  .check {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 40px;
  }
  .check input {
    flex: none;
    width: 18px;
    height: 18px;
    accent-color: var(--gold);
  }
  .kit-list li {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .how {
    padding-left: 28px;
  }
</style>
