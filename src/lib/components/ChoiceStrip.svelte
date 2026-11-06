<script lang="ts">
  import GameArt from "./GameArt.svelte";
  let {
    label,
    name,
    value,
    choices,
    onChange,
    variant = "chips",
  }: {
    label: string;
    /** "joined" is one bar of equal cells sharing a border; it scrolls inside itself when narrow. */
    variant?: "chips" | "joined";
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

<fieldset class="choice-fieldset" class:joined={variant === "joined"}>
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
  .joined legend {
    font-weight: 600;
    font-size: inherit;
    margin-bottom: 10px;
  }
  .joined .choice-strip {
    flex-wrap: nowrap;
    gap: 0;
    overflow-x: auto;
    overscroll-behavior-x: contain;
    border: 1px solid #33434d;
    border-radius: 4px;
    background: var(--well);
  }
  .joined .choice-option {
    /* Equal cells; a long label ("100–110") keeps its width instead of clipping. */
    flex: 1 0 0;
    min-width: max-content;
    min-height: 44px;
    justify-content: center;
    padding: 0 8px;
    border: 0;
    border-right: 1px solid #33434d;
    border-radius: 0;
    font-size: var(--font-caption);
    font-weight: 600;
    white-space: nowrap;
    text-align: center;
  }
  .joined .choice-option:last-child {
    border-right: 0;
  }
  .joined .choice-option:hover {
    background: #17242e;
  }
  .joined .choice-option.selected {
    color: #f0e2c2;
    background: var(--panel-raised);
    box-shadow: inset 0 -2px 0 var(--gold);
  }
  .joined .choice-option:has(input:focus-visible) {
    outline-color: var(--gold-bright);
    outline-offset: -3px;
  }
  small {
    display: block;
    font-size: 0.8rem;
    color: var(--muted);
    margin-top: 0.15rem;
  }
</style>
