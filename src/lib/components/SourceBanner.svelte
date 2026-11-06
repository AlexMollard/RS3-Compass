<script lang="ts">
  import { Clock, Lock, Search, TriangleAlert, XCircle } from "@lucide/svelte";
  import type { Snippet } from "svelte";
  import type { SourceNotice } from "../sourceStatus";
  import Button from "./Button.svelte";
  let {
    notice,
    onRetry,
    children,
  }: { notice: SourceNotice; onRetry?: () => void; children?: Snippet } =
    $props();
  const icons = {
    stale: TriangleAlert,
    failed: XCircle,
    notFound: Search,
    slowed: Clock,
    private: Lock,
    info: Clock,
  };
  const Icon = $derived(icons[notice.tone]);
</script>

<div class="source-banner tone-{notice.tone}" role="status">
  <span class="source-icon"><Icon size={20} aria-hidden="true" /></span>
  <span class="source-text">
    <b>{notice.title}</b><br />{notice.message}
  </span>
  {@render children?.()}
  {#if notice.retry && onRetry}<Button onclick={onRetry}>Try again</Button>{/if}
</div>

<style>
  .source-banner {
    --tone: var(--edge);
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: flex-start;
    margin-top: 20px;
    padding: 14px 16px;
    border: 1px solid var(--tone);
    border-radius: 3px;
    background: var(--well);
    color: var(--text);
    font-size: var(--font-ui);
  }
  .tone-stale {
    --tone: var(--warn);
  }
  .tone-failed,
  .tone-notFound {
    --tone: var(--bad);
  }
  .tone-slowed,
  .tone-info {
    --tone: var(--blue);
  }
  .tone-private {
    --tone: var(--edge);
  }
  .source-icon {
    display: inline-flex;
    margin-top: 2px;
    color: var(--tone);
  }
  .tone-private .source-icon {
    color: var(--muted);
  }
  .source-text {
    flex: 1 1 300px;
  }
  .source-text b {
    color: var(--tone);
  }
  .tone-private .source-text b {
    color: var(--text);
  }
</style>
