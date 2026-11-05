<script lang="ts">
  import GameArt from "./GameArt.svelte";
  let {
    label,
    name,
    value,
    choices,
    onChange,
  }: {
    label: string;
    name: string;
    value: string;
    choices: {
      value: string;
      label: string;
      image?: string;
      description?: string;
      detail?: string;
    }[];
    onChange: (value: string) => void;
  } = $props();
</script>

<fieldset class="choice-fieldset">
  <legend>{label}</legend>
  <div class="choice-strip">
    {#each choices as choice (choice.value)}
      <label
        class="choice-option"
        class:selected={value === choice.value}
        title={choice.description}
      >
        <input
          type="radio"
          {name}
          value={choice.value}
          checked={value === choice.value}
          aria-label={choice.description ?? choice.label}
          onchange={() => {
            if (value !== choice.value) onChange(choice.value);
          }}
        />
        {#if choice.image}<GameArt file={choice.image} size={28} />{/if}
        <span
          >{choice.label}{#if choice.detail}<small>{choice.detail}</small
            >{/if}</span
        >
      </label>
    {/each}
  </div>
</fieldset>

<style>
  .choice-fieldset {
    min-width: 0;
    border: 0;
    padding: 0;
    margin: 0 0 1rem;
  }
  legend {
    font-size: 0.875rem;
    margin-bottom: 0.5rem;
  }
  .choice-strip {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }
  .choice-option {
    position: relative;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    min-height: 44px;
    padding: 0.4rem 0.65rem;
    border: 1px solid var(--line);
    border-radius: 4px;
    color: var(--muted);
    cursor: pointer;
  }
  .choice-option:hover {
    border-color: var(--muted);
    color: var(--text);
  }
  .choice-option.selected {
    border-color: var(--gold);
    color: var(--text);
    background: var(--panel);
  }
  .choice-option:has(input:focus-visible) {
    outline: 2px solid var(--gold);
    outline-offset: 2px;
  }
  input {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    cursor: pointer;
  }
  .choice-option :global(.game-art) {
    width: 28px;
    height: 32px;
  }
  small {
    display: block;
    font-size: 0.8rem;
    color: var(--muted);
    margin-top: 0.15rem;
  }
</style>
