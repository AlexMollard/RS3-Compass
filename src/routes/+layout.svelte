<script lang="ts">
  import { onMount } from "svelte";
  import type { Snippet } from "svelte";
  import { setCompass } from "../lib/compassContext";
  import { createCompassController } from "../lib/profileStore";
  import AppShell from "../lib/AppShell.svelte";
  import "../styles.css";

  let { children }: { children: Snippet } = $props();
  const controller = createCompassController();
  setCompass(controller);
  onMount(() => {
    controller.initialize();
    return () => controller.destroy();
  });
</script>

<svelte:head><title>RS3 Compass</title></svelte:head>

<AppShell>{@render children()}</AppShell>
