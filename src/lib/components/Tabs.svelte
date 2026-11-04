<script lang="ts">
  let {
    items,
    value,
    onChange,
    label,
    variant = "window",
  }: {
    items: readonly { value: string; label: string }[];
    value: string;
    onChange: (value: string) => void;
    label: string;
    variant?: "window" | "detail";
  } = $props();
</script>

<div
  class={variant === "detail" ? "detail-tabs" : "window-tabs"}
  role="group"
  aria-label={label}
>
  {#each items as item (item.value)}<button
      type="button"
      class:selected={item.value === value}
      aria-pressed={item.value === value}
      onclick={() => onChange(item.value)}>{item.label}</button
    >{/each}
</div>
