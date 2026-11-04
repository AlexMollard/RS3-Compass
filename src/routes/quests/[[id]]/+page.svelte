<script lang="ts">
  import { page } from "$app/state";
  import QuestPage from "../../../lib/pages/QuestPage.svelte";
</script>

<QuestPage selectedId={page.params.id ?? ""} />
