<script lang="ts">
  import { goto } from "$app/navigation";
  import { QUESTS } from "../../data";
  import { getCompass } from "../../lib/compassContext";
  import { questPath } from "../../lib/navigation";
  import PlayCompanion from "../../lib/pages/PlayCompanion.svelte";
  const controller = getCompass();
  const saved = controller.state;
  const ready = controller.ready;
  let profile = $derived(
    $saved.profiles.find((player) => player.id === $saved.activeId),
  );
  let quest = $derived(
    QUESTS.find((record) => record.id === profile?.activeTask),
  );
  $effect(() => {
    if ($ready && quest) void goto(questPath(quest.id), { replaceState: true });
  });
</script>

{#if $ready && profile && !quest}<PlayCompanion />{/if}
