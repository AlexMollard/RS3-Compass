<script lang="ts">
  let {
    label,
    value,
    detail,
  }: { label: string; value: string | number; detail?: string } = $props();
</script>

<dl class="game-stat game-surface">
  <dt>{label}</dt>
  <dd>
    {value}{#if detail}<span class="detail">{detail}</span>{/if}
  </dd>
</dl>

<style>
  .game-stat {
    margin: 0;
    padding: 12px 16px;
    min-width: 0;
  }
  dt {
    color: var(--muted);
    font-size: var(--font-ui);
  }
  dd {
    margin: 3px 0 0;
    color: var(--gold-bright);
    font-size: 1.25rem;
    font-weight: 600;
    overflow-wrap: anywhere;
  }
  .detail {
    display: block;
    color: var(--muted);
    font-size: var(--font-ui);
    font-weight: 400;
    margin-top: 4px;
  }
</style>
