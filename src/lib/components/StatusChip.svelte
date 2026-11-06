<script lang="ts">
  import { Check, CircleAlert, Info, Minus, TriangleAlert } from "@lucide/svelte";
  let {
    tone = "neutral",
    label,
  }: {
    tone?: "ok" | "warn" | "bad" | "info" | "neutral";
    label: string;
  } = $props();
  const icons = {
    ok: Check,
    warn: TriangleAlert,
    bad: CircleAlert,
    info: Info,
    neutral: Minus,
  };
  const Icon = $derived(icons[tone]);
</script>

<span class="status-chip status-{tone}"><Icon size={14} aria-hidden="true" />{label}</span>

<style>
  .status-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 24px;
    padding: 2px 9px;
    border: 1px solid currentColor;
    border-radius: 4px;
    background: var(--well);
    font-size: var(--font-caption);
    font-weight: 600;
    line-height: 1.3;
    white-space: nowrap;
  }
  .status-ok {
    color: var(--green);
  }
  .status-warn {
    color: var(--warn);
  }
  .status-bad {
    color: var(--bad);
  }
  .status-info {
    color: var(--blue);
  }
  .status-neutral {
    color: var(--muted);
  }
</style>
