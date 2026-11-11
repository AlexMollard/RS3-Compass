<script lang="ts">
  import { goto } from "$app/navigation";
  import { ChevronLeft, Info } from "@lucide/svelte";
  import { skillByName } from "../../data";
  import { SKILL_GAME_ORDER } from "../../skillNames";
  import { activeProfile, getCompass } from "../compassContext";
  import { applyLevelChanges, levelChanges, parseLevel } from "../levelChanges";
  import GameArt from "../components/GameArt.svelte";
  import GameWindow from "../components/GameWindow.svelte";

  const controller = getCompass();
  const saved = controller.state;
  let profile = $derived(activeProfile($saved));
  // Edits belong to one player; switching players drops them.
  let draft = $state<{ id: string; values: Record<string, string> }>({
    id: "",
    values: {},
  });
  let edits = $derived(draft.id === profile.id ? draft.values : {});
  let changes = $derived(levelChanges(profile.levels, edits));
  let changed = $derived(new Map(changes.map((c) => [c.skill, c])));
  let recorded = $derived(
    SKILL_GAME_ORDER.filter((name) => profile.levels[name] !== undefined)
      .length,
  );
  const skills = SKILL_GAME_ORDER.map((name) => skillByName(name)!);

  function edit(name: string, value: string) {
    if (draft.id !== profile.id) draft = { id: profile.id, values: {} };
    draft.values[name] = value;
  }
  function invalid(name: string, cap: number) {
    const value = edits[name];
    return value !== undefined && parseLevel(value, cap) === null;
  }
  let anyInvalid = $derived(
    skills.some((skill) => invalid(skill.name, skill.maxLevel)),
  );
  function note(name: string, cap: number) {
    if (invalid(name, cap)) return `Enter a level from 1 to ${cap}`;
    const change = changed.get(name);
    if (change) return change.from === null ? "Was unknown" : `Was ${change.from}`;
    return profile.levels[name] === undefined ? "Unknown" : "Recorded";
  }
  function describe(change: (typeof changes)[number]) {
    if (change.from === null) return `${change.skill} added at ${change.to}`;
    if (change.to === null) return `${change.skill} now unknown`;
    return `${change.skill} ${change.from} → ${change.to}`;
  }
  function leave() {
    draft = { id: "", values: {} };
    void goto("/");
  }
  function save() {
    if (!changes.length || anyInvalid) return;
    const saving = changes;
    controller.updateProfile((p) => ({
      ...p,
      levels: applyLevelChanges(p.levels, saving),
    }));
    controller.notify(
      `Saved ${saving.length} level ${saving.length === 1 ? "change" : "changes"} for ${profile.name}.`,
    );
    leave();
  }
</script>

<form
  class="levels-page page-enter"
  onsubmit={(event) => {
    event.preventDefault();
    save();
  }}
>
  <div class="levels-head">
    <a class="btn btn-quiet" href="/"
      ><ChevronLeft size={16} aria-hidden="true" />Back</a
    >
    <span class="cap"
      >{profile.name} · {profile.kind} · {profile.source === "hiscores"
        ? "public player"
        : "sample"}</span
    >
  </div>
  <div>
    <h1>Update recorded levels</h1>
    <p class="levels-intro">
      Levels you type here plan {profile.name}'s guides. Leave a skill blank if
      you don't know it; blank means unknown, never zero.
    </p>
  </div>
  <div class="levels-info">
    <Info size={16} aria-hidden="true" /><span
      >Public players also have published Hiscores levels. Group comparisons
      use only those, never what's typed here.</span
    >
  </div>

  <GameWindow
    title="Skills"
    trailing={`In-game order · ${recorded} of ${skills.length} recorded`}
  >
    <div class="levels-grid">
      {#each skills as skill (skill.name)}
        <div
          class="level-row"
          class:changed={changed.has(skill.name)}
          class:invalid={invalid(skill.name, skill.maxLevel)}
        >
          <GameArt file={skill.icon} size={32} />
          <label for={"level-" + skill.name}
            >{skill.name}<br /><span class="cap"
              >{note(skill.name, skill.maxLevel)}</span
            ></label
          >
          <input
            id={"level-" + skill.name}
            class="level-input"
            inputmode="numeric"
            autocomplete="off"
            maxlength="3"
            placeholder="?"
            aria-invalid={invalid(skill.name, skill.maxLevel) || undefined}
            value={edits[skill.name] ?? profile.levels[skill.name] ?? ""}
            oninput={(event) => edit(skill.name, event.currentTarget.value)}
          />
        </div>
      {/each}
    </div>
  </GameWindow>

  <div class="levels-bar">
    <span class="levels-summary" role="status"
      ><b
        >{changes.length
          ? `${changes.length} ${changes.length === 1 ? "change" : "changes"}`
          : "No changes"}</b
      >
      {#if changes.length}<span class="cap"
          >{changes.map(describe).join(" · ")}</span
        >{/if}</span
    >
    <button type="button" class="btn btn-quiet" onclick={leave}>Cancel</button>
    <button type="submit" class="btn btn-primary" disabled={!changes.length || anyInvalid}
      >Save levels</button
    >
  </div>
</form>

<style>
  .levels-page {
    display: flex;
    flex-direction: column;
    gap: 20px;
    padding-top: 4px;
  }
  .cap {
    font-size: var(--font-caption);
    color: var(--muted);
  }
  .levels-head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px;
  }
  h1 {
    margin: 0;
    font:
      600 28px "Cinzel",
      Georgia,
      serif;
    letter-spacing: 0.3px;
    color: #ddd2b8;
  }
  .levels-intro {
    margin: 4px 0 0;
    max-width: 680px;
    color: #c9d4da;
  }
  .levels-info {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 14px;
    border: 1px solid var(--blue);
    border-radius: 3px;
    color: var(--blue);
  }
  .levels-info :global(svg) {
    flex: none;
  }
  .levels-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 300px), 1fr));
    gap: 8px;
    padding: 16px;
  }
  .level-row {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 56px;
    padding: 6px 10px;
    background: var(--well);
    border: 1px solid #2f3e48;
    border-radius: 3px;
  }
  .level-row.changed {
    border-color: var(--gold);
    background: #1d211b;
  }
  .level-row.invalid {
    border-color: var(--bad);
  }
  .level-row.invalid .cap {
    color: var(--bad);
  }
  .level-row label {
    flex-grow: 1;
    font-weight: 500;
  }
  .level-input {
    width: 64px;
    height: var(--control-size);
    border: 1px solid var(--edge);
    border-radius: 4px;
    background: #0b1318;
    color: var(--text);
    text-align: center;
    font-size: 16px;
    font-weight: 600;
  }
  .level-input::placeholder {
    color: var(--muted);
  }
  .levels-bar {
    position: sticky;
    bottom: 0;
    z-index: 5;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px;
    padding: 14px 16px;
    background: #0d151bf2;
    border-top: 1px solid #c5a46b80;
  }
  .levels-summary {
    flex-grow: 1;
  }
  .levels-bar .btn-primary:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
  @media (max-width: 760px) {
    .levels-bar {
      bottom: calc(60px + env(safe-area-inset-bottom));
      padding: 12px;
    }
  }
</style>
