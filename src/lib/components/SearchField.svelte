<script lang="ts">
  import { Search } from "@lucide/svelte";
  import IconButton from "./IconButton.svelte";
  let {
    value,
    onChange,
    label,
    placeholder,
    className = "",
  }: {
    value: string;
    onChange: (value: string) => void;
    label: string;
    placeholder: string;
    className?: string;
  } = $props();
  let input: HTMLInputElement;
</script>

<div class="search-field {className}">
  <Search size={16} aria-hidden="true" /><input
    bind:this={input}
    aria-label={label}
    {placeholder}
    {value}
    oninput={(event) => onChange(event.currentTarget.value)}
  />{#if value}<IconButton
      framed={false}
      label={"Clear " + label.toLowerCase()}
      onclick={() => {
        onChange("");
        input.focus();
      }}><span aria-hidden="true">×</span></IconButton
    >{/if}
</div>
