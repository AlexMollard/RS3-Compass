<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLButtonAttributes } from "svelte/elements";
  let {
    label,
    framed = true,
    type = "button",
    className = "",
    class: extraClass = "",
    children,
    ...rest
  }: HTMLButtonAttributes & {
    label: string;
    framed?: boolean;
    className?: string;
    children?: Snippet;
  } = $props();
</script>

<button
  {...rest}
  {type}
  class="{framed ? 'reference-action' : 'icon-button'} {className} {extraClass}"
  aria-label={label}>{@render children?.()}</button
>
