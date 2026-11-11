<script lang="ts">
  import { page } from "$app/state";
  import QuestPage from "../../../lib/pages/QuestPage.svelte";
  import QuestsHome from "../../../lib/pages/QuestsHome.svelte";
</script>

{#if page.params.id}<QuestPage selectedId={page.params.id} />{:else}<QuestsHome />{/if}
