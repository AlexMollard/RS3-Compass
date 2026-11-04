<script lang="ts">
  import { onMount, tick } from "svelte";
  import { ChevronRight, X } from "@lucide/svelte";
  import { getCompass } from "../compassContext";
  import Button from "./Button.svelte";
  import IconButton from "./IconButton.svelte";
  import GameArt from "./GameArt.svelte";

  let {
    onDismiss,
    onLookup,
  }: {
    onDismiss: () => void;
    onLookup: (name?: string, refresh?: boolean) => void;
  } = $props();
  const controller = getCompass();
  const saved = controller.state;
  const storageError = controller.storageError;
  let players = $derived($saved.profiles);
  let removing = $state<string | null>(null);
  let dialog: HTMLDialogElement;
  onMount(() => {
    dialog.showModal();
    return () => dialog.close();
  });
  function select(id: string) {
    controller.selectProfile(id);
    onDismiss();
  }
  async function remove(id: string) {
    controller.removePlayer(id);
    removing = null;
    await tick();
    dialog
      .querySelector<HTMLButtonElement>(".player-open, .player-manager-add")
      ?.focus();
  }
</script>

<dialog
  class="app-dialog player-manager"
  bind:this={dialog}
  aria-labelledby="players-title"
  oncancel={(event) => {
    event.preventDefault();
    onDismiss();
  }}
>
  <div class="dialog-heading">
    <h2 id="players-title">Saved players</h2>
    <IconButton framed={false} label="Close player manager" onclick={onDismiss}
      ><X size={20} /></IconButton
    >
  </div>
  <p>
    Players and their Compass progress are stored on this device. Refreshing
    reads public game data; it keeps your notes and packing checks.
  </p>
  <div class="player-list">
    {#each players as player (player.id)}
      <section
        class="player-row"
        class:is-active={player.id === $saved.activeId}
        aria-label={player.name}
      >
        <button
          type="button"
          class="player-open"
          aria-label={"Open " + player.name}
          aria-current={player.id === $saved.activeId ? "true" : undefined}
          onclick={() => select(player.id)}
        >
          <GameArt
            file={player.kind === "Group Ironman"
              ? "Group_Ironman_badge.png"
              : "Ironman_badge.png"}
            size={28}
          />
          <span
            ><strong
              >{player.name}{#if player.id === $saved.activeId}<small>
                  · Selected</small
                >{/if}</strong
            ><small
              >{player.mode === "f2p" ? "F2P" : "Members"} · {Object.keys(
                player.levels,
              ).length} recorded skills</small
            ></span
          ><ChevronRight size={17} />
        </button>
        <p class="player-updated">
          {player.source !== "hiscores"
            ? "Fictional sample profile"
            : player.hiscoresFetchedAt
              ? "Data fetched: " +
                new Date(player.hiscoresFetchedAt).toLocaleString()
              : "Not refreshed yet"}
        </p>
        {#if removing === player.id}
          <p class="removal-warning" role="alert">
            Remove {player.name} and their locally saved Compass progress? This cannot
            be undone and does not affect RuneScape.
          </p>
          <div class="player-actions">
            <Button
              className="remove-confirm"
              onclick={() => void remove(player.id)}
              >Remove from this device</Button
            ><Button onclick={() => (removing = null)}>Keep player</Button>
          </div>
        {:else}
          <div class="player-actions">
            {#if player.source === "hiscores"}
              <Button
                variant="quiet"
                onclick={() => onLookup(player.name, true)}
                >Refresh &amp; open</Button
              >
            {/if}
            <Button
              variant="quiet"
              aria-label={"Remove " + player.name + " from this device"}
              onclick={() => (removing = player.id)}>Remove</Button
            >
          </div>
        {/if}
      </section>
    {:else}
      <p class="empty-state">
        No saved players yet. Look up a player to get started.
      </p>
    {/each}
  </div>
  {#if $storageError}<div class="notice" role="alert">
      <div>
        <strong>Changes could not be saved.</strong>
        <p>
          Export your progress before closing this tab. A removed player may
          return after reloading if the browser cannot save the removal.
        </p>
        <Button onclick={controller.exportProgress}>Export progress</Button>
      </div>
    </div>{/if}
  <div class="detail-actions">
    <Button
      className="player-manager-add"
      variant="primary"
      onclick={() => onLookup()}>Look up another player</Button
    ><Button onclick={onDismiss}>Done</Button>
  </div>
</dialog>

<style>
  .player-list {
    display: grid;
    gap: 12px;
    margin: 18px 0;
  }
  .player-row {
    min-width: 0;
    padding: 10px;
    border: 1px solid var(--line);
    border-radius: 5px;
  }
  .player-row.is-active {
    border-color: var(--gold);
  }
  .player-open {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 10px;
    text-align: left;
    padding: 4px;
  }
  .player-open > span {
    flex: 1;
    min-width: 0;
  }
  .player-open small {
    display: block;
    color: var(--muted);
    font-size: var(--font-caption);
  }
  .player-open strong small {
    display: inline;
    color: var(--gold-bright);
  }
  .player-updated {
    color: var(--muted);
    font-size: var(--font-caption);
    padding: 4px;
  }
  .player-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 8px;
  }
  .removal-warning {
    color: #e8b3a8;
    padding: 8px 4px;
  }
  .player-manager :global(.remove-confirm) {
    color: #f1c1b7;
    border-color: #ad6d60;
    background: #5b302b;
  }
</style>
