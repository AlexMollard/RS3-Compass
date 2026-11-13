<script lang="ts">
  import { page } from "$app/state";
  import BossPage from "../../../lib/pages/BossPage.svelte";
  import BossingHome from "../../../lib/pages/BossingHome.svelte";
</script>

{#if page.params.id}<BossPage selectedId={page.params.id} />{:else}<BossingHome />{/if}
