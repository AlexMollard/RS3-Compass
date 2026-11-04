<script lang="ts">
  import { onMount, untrack } from "svelte";
  import { ExternalLink, X } from "@lucide/svelte";
  import type { Profile } from "../../data";
  import { RS3_SKILL_NAMES } from "../../skillNames";
  import { SKILLS } from "../../data";
  import { wikiHref, wikiImage } from "../../wiki";
  import Button from "./Button.svelte";
  import IconButton from "./IconButton.svelte";

  let {
    profile,
    initialSkill,
    onSave,
    onDismiss,
  }: {
    profile: Profile;
    initialSkill: string;
    onSave: (levels: Profile["levels"]) => void;
    onDismiss: () => void;
  } = $props();
  let dialog: HTMLDialogElement;
  let levels = $state<Record<string, string>>(
    untrack(() =>
      Object.fromEntries(
        RS3_SKILL_NAMES.map((name) => [
          name,
          profile.levels[name]?.toString() ?? "",
        ]),
      ),
    ),
  );
  onMount(() => {
    dialog.showModal();
    const input = Array.from(
      dialog.querySelectorAll<HTMLInputElement>("input"),
    ).find((input) => input.dataset.skill === initialSkill);
    input?.focus();
    input?.select();
    return () => dialog.close();
  });
  function dismiss() {
    dialog.close();
    onDismiss();
  }
  function save(event: SubmitEvent) {
    event.preventDefault();
    const result = Object.fromEntries(
      Object.entries(levels)
        .filter(([, value]) => value.trim() !== "")
        .map(([name, value]) => [name, Number(value)]),
    );
    if (
      Object.values(result).some(
        (value) => !Number.isInteger(value) || value < 1 || value > 120,
      )
    )
      return;
    onSave(result);
    dismiss();
  }
</script>

<dialog
  class="app-dialog level-editor"
  bind:this={dialog}
  aria-labelledby="level-editor-title"
  oncancel={(event) => {
    event.preventDefault();
    dismiss();
  }}
>
  <div class="dialog-heading">
    <div>
      <h2 id="level-editor-title">Edit recorded levels</h2>
      <p>{profile.name} · manual entries</p>
    </div>
    <IconButton framed={false} label="Cancel level changes" onclick={dismiss}
      ><X size={20} /></IconButton
    >
  </div>
  <p>
    Enter your current in-game levels; leave unknown levels blank. This does not
    award XP or complete quests.
  </p>
  <form onsubmit={save}>
    <div class="level-editor-fields">
      {#each RS3_SKILL_NAMES as name (name)}
        {@const icon = SKILLS.find((skill) => skill.name === name)?.icon}
        <div class="level-editor-row">
          <label for={"recorded-level-" + name}
            >{#if icon}<img
                src={wikiImage(icon)}
                alt=""
                loading="lazy"
                decoding="async"
              />{/if}{name}</label
          >
          <input
            id={"recorded-level-" + name}
            data-skill={name}
            aria-label={name + " recorded level"}
            type="number"
            min="1"
            max="120"
            step="1"
            required={profile.levels[name] != null}
            value={levels[name]}
            oninput={(event) => (levels[name] = event.currentTarget.value)}
          />
          <a
            href={wikiHref(name)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={name + " on RuneScape Wiki"}
            title={name + " on RuneScape Wiki (opens a new tab)"}
            ><ExternalLink size={16} /></a
          >
        </div>
      {/each}
    </div>
    <div class="detail-actions">
      <Button variant="primary" type="submit">Save levels</Button><Button
        onclick={dismiss}>Cancel</Button
      >
    </div>
  </form>
</dialog>
