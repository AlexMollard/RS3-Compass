<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLButtonAttributes } from "svelte/elements";
  let {
    variant = "secondary",
    type = "button",
    className = "",
    class: extraClass = "",
    children,
    ...rest
  }: HTMLButtonAttributes & {
    variant?: "primary" | "secondary" | "quiet" | "success" | "link";
    className?: string;
    children?: Snippet;
  } = $props();
</script>

<button
  {...rest}
  {type}
  class="{variant === 'link'
    ? 'text-link'
    : 'btn btn-' + variant} {className} {extraClass}"
  >{@render children?.()}</button
>
