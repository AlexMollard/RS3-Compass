<script lang="ts">
  import { ChevronRight, Search, Users } from "@lucide/svelte";
  import { accountBadge, type Profile } from "../../data";
  import GameArt from "./GameArt.svelte";

  let {
    samples,
    canEnterByHand,
    onLookup,
    onSample,
    onManual,
  }: {
    samples: Profile[];
    canEnterByHand: boolean;
    onLookup: (name: string, mode: Profile["mode"]) => void;
    onSample: (id: string) => void;
    onManual: () => void;
  } = $props();
  let name = $state(""),
    mode = $state<Profile["mode"]>("f2p");
</script>

<div class="first-visit page-enter">
  <svg class="first-visit-mark" viewBox="0 0 48 48" aria-hidden="true"
    ><circle
      cx="24"
      cy="24"
      r="21"
      fill="#142530"
      stroke="#c5a465"
      stroke-width="2"
    ></circle><path d="m31 12-3 16-11 8 3-16Z" fill="#d6b576"></path><path
      d="m31 12-7 12-7 12 3-16Z"
      fill="#f2dfba"
    ></path><circle cx="24" cy="24" r="3" fill="#142530"></circle></svg
  >
  <div class="first-visit-intro">
    <span class="first-visit-brand">RS3 COMPASS</span>
    <h1>Who are you planning for?</h1>
    <p>
      Compass gets your account ready for the next quest or training session,
      then hands you to the RuneScape Wiki.
    </p>
  </div>
  <div class="first-visit-trim"></div>

  <div class="first-visit-cards">
    <section class="tool-window first-visit-card" aria-labelledby="fv-lookup">
      <header class="window-title">
        <Search size={16} aria-hidden="true" /><h2 id="fv-lookup">
          Look up your character
        </h2>
      </header>
      <form
        class="first-visit-body"
        onsubmit={(event) => {
          event.preventDefault();
          if (name.trim()) onLookup(name.trim(), mode);
        }}
      >
        <label for="fv-name">RuneScape name</label>
        <input
          id="fv-name"
          class="first-visit-field"
          placeholder="Your display name"
          maxlength="12"
          autocomplete="off"
          required
          bind:value={name}
        />
        <div class="first-visit-plan">
          <span class="cap">Plan as</span>
          <div class="first-visit-seg" role="group" aria-label="Planning view">
            <button
              type="button"
              aria-pressed={mode === "f2p"}
              onclick={() => (mode = "f2p")}>F2P</button
            ><button
              type="button"
              aria-pressed={mode === "members"}
              onclick={() => (mode = "members")}>Members</button
            >
          </div>
        </div>
        <button type="submit" class="btn btn-primary first-visit-go"
          >Look up and start</button
        >
        <p class="cap">
          Reads public Hiscores, quests and recent activity. No login, and your
          bank stays private.
        </p>
      </form>
    </section>
    {#if samples.length || canEnterByHand}
      <section
        class="tool-window first-visit-card"
        aria-labelledby="fv-samples"
      >
        <header class="window-title">
          <Users size={16} aria-hidden="true" /><h2 id="fv-samples">
            {samples.length ? "Or try a sample player" : "Or plan by hand"}
          </h2>
        </header>
        <div class="first-visit-body">
          {#each samples as sample (sample.id)}
            <button
              type="button"
              class="first-visit-sample"
              onclick={() => onSample(sample.id)}
              ><span class="first-visit-badge"
                ><GameArt
                  file={accountBadge(sample.kind)}
                  size={36}
                /></span
              ><span class="first-visit-sample-text"
                ><b>{sample.name}</b><span class="cap"
                  >Fictional · {sample.mode === "f2p"
                    ? "free-to-play"
                    : "members"} planning · {Object.keys(sample.levels)
                    .length} levels recorded</span
                ></span
              ><ChevronRight size={16} aria-hidden="true" /></button
            >
          {/each}
          {#if samples.length}<p class="cap">
              Samples never mix into a real character's progress. Remove them
              any time.
            </p>{/if}
          {#if canEnterByHand}<a
              class="first-visit-manual"
              href="/levels"
              onclick={onManual}>Or enter your levels by hand</a
            >{/if}
        </div>
      </section>
    {/if}
  </div>

  <p class="cap first-visit-foot">
    Notes, packing and plans stay in this browser. Export them from Players to
    move devices.
  </p>
</div>

<style>
  .first-visit {
    width: min(880px, 100%);
    margin: 0 auto;
    padding: 24px 0 32px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 26px;
  }
  .first-visit-mark {
    width: 72px;
    height: 72px;
  }
  .first-visit-intro {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    text-align: center;
  }
  .first-visit-brand {
    font:
      600 16px "Cinzel",
      Georgia,
      serif;
    letter-spacing: 2px;
    color: #e1c895;
  }
  .first-visit-intro h1 {
    margin: 0;
    font:
      600 36px/42px "Cinzel",
      Georgia,
      serif;
    letter-spacing: 0.3px;
    color: var(--heading);
  }
  .first-visit-intro p {
    margin: 0;
    max-width: 560px;
    color: #c9d4da;
  }
  .first-visit-trim {
    height: 2px;
    width: 100%;
    max-width: 520px;
    background: linear-gradient(
      90deg,
      transparent,
      var(--gold) 20%,
      var(--gold-bright) 50%,
      var(--gold) 80%,
      transparent
    );
  }
  .first-visit-cards {
    width: 100%;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 320px), 1fr));
    gap: 20px;
  }
  .first-visit-card {
    display: flex;
    flex-direction: column;
  }
  .first-visit-card .window-title :global(svg) {
    color: var(--gold-bright);
  }
  .first-visit-body {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 18px;
  }
  .first-visit-body label {
    font-weight: 600;
  }
  .cap {
    font-size: var(--font-caption);
    color: var(--muted);
  }
  .first-visit-body .cap {
    margin: 0;
  }
  .first-visit-field {
    height: 44px;
    padding: 0 12px;
    border: 1px solid var(--edge);
    border-radius: 4px;
    background: #0d161c;
    color: var(--text);
    font: inherit;
  }
  .first-visit-plan {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px;
  }
  .first-visit-seg {
    display: inline-flex;
    border: 1px solid var(--edge);
    border-radius: 4px;
    overflow: hidden;
  }
  .first-visit-seg button {
    min-height: var(--control-size);
    padding: 0 16px;
    border: 0;
    background: transparent;
    color: var(--muted);
    font-weight: 600;
  }
  .first-visit-seg button[aria-pressed="true"] {
    background: var(--gold);
    color: #1b241e;
  }
  .first-visit-go {
    min-height: 44px;
    margin-top: 4px;
  }
  .first-visit-sample {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    border: 1px solid var(--edge);
    border-radius: 3px;
    background: var(--well);
    color: var(--text);
    text-align: left;
  }
  .first-visit-sample:hover {
    border-color: var(--gold);
  }
  .first-visit-badge {
    display: grid;
    place-items: center;
    width: 48px;
    height: 48px;
    flex: none;
    border: 1px solid #3a4a55;
    border-radius: 3px;
    background: #0d161c;
  }
  .first-visit-sample-text {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
  }
  .first-visit-manual {
    margin-top: auto;
    align-self: flex-start;
    min-height: var(--control-size);
    display: inline-flex;
    align-items: center;
    font-weight: 600;
    color: var(--text);
    text-decoration: underline;
  }
  .first-visit-manual:hover {
    color: var(--gold-bright);
  }
  .first-visit-foot {
    margin: 0;
    text-align: center;
  }
  @media (max-width: 760px) {
    .first-visit-field {
      font-size: 16px;
    }
    .first-visit-intro h1 {
      font-size: 28px;
      line-height: 34px;
    }
  }
</style>
