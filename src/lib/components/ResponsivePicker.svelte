<script lang="ts">
  import { onMount, type Snippet } from "svelte";
  import { ChevronDown } from "@lucide/svelte";
  let {
    label,
    selection,
    children,
  }: { label: string; selection: string; children: Snippet } = $props();
  let wide = $state(false);
  let expanded = $state(false);
  $effect(() => {
    selection;
    expanded = false;
  });
  onMount(() => {
    const query = window.matchMedia("(min-width: 1001px)");
    const update = () => {
      wide = query.matches;
    };
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  });
</script>

<details
  class="guide-picker"
  open={wide || expanded}
  ontoggle={(event) => {
    if (!wide) expanded = event.currentTarget.open;
  }}
>
  <summary aria-label={"Choose " + label.toLowerCase() + ": " + selection}
    ><span>{label}</span><strong>{selection}</strong><ChevronDown
      size={18}
      aria-hidden="true"
    /></summary
  >{@render children()}
</details>
