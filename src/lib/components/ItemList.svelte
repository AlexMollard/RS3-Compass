<script lang="ts">
  import GameText from "./GameText.svelte";
  let {
    items,
    checked,
    onToggle,
  }: {
    items: readonly string[];
    checked?: readonly string[];
    onToggle?: (item: string) => void;
  } = $props();
  const id = $props.id();
</script>

{#if items.length === 0}<p class="muted">No items to prepare.</p>
{:else if onToggle}<div class="item-checklist">
    {#each items as item, index (item)}<div
        class="pack-row"
        class:checked={checked?.includes(item) ?? false}
      >
        <input
          type="checkbox"
          id={id + "-" + index}
          aria-label={item}
          checked={checked?.includes(item) ?? false}
          onchange={() => onToggle?.(item)}
        /><label
          class="pack-row-toggle"
          for={id + "-" + index}
          aria-hidden="true"
          title={"Toggle packed: " + item}
        ></label><span><GameText text={item} /></span>
      </div>{/each}
  </div>{:else}<ul class="plain-list">
    {#each items as item (item)}<li>
        <span class="tiny-diamond"></span><GameText text={item} />
      </li>{/each}
  </ul>{/if}
