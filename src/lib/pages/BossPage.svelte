<script lang="ts">
  import { bossById } from "../../bosses.ts";
  import PageHeading from "../components/PageHeading.svelte";

  let { selectedId }: { selectedId: string } = $props();
  let boss = $derived(bossById(selectedId));
</script>

<div class="page-enter">
  <PageHeading title={boss?.name ?? "Bossing"} />
</div>
