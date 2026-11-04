<script lang="ts">
  import { page } from "$app/state";
  import SkillPage from "../../../lib/pages/SkillPage.svelte";
</script>

<SkillPage selectedSkill={page.params.name ?? ""} />
