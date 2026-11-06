<script lang="ts">
  import { page } from "$app/state";
  let notFound = $derived(page.status === 404);
</script>

<svelte:head
  ><title
    >{notFound ? "Page not found" : "Something went wrong"} · RS3 Compass</title
  ></svelte:head
>

<section class="tool-window not-found page-enter" aria-labelledby="error-title">
  <svg class="not-found-mark" viewBox="0 0 48 48" aria-hidden="true"
    ><circle
      cx="24"
      cy="24"
      r="21"
      fill="#142530"
      stroke="#5f7584"
      stroke-width="2"
    ></circle><path d="m31 12-3 16-11 8 3-16Z" fill="#6c5f45"></path><path
      d="m31 12-7 12-7 12 3-16Z"
      fill="#8f8061"
    ></path><circle cx="24" cy="24" r="3" fill="#142530"></circle></svg
  >
  {#if notFound}
    <span class="not-found-eyebrow">Page not found</span>
    <h1 id="error-title">This page isn't on the map</h1>
    <p>
      The link may be old, or the quest or skill name may be spelled
      differently.
    </p>
  {:else}
    <span class="not-found-eyebrow">Error {page.status}</span>
    <h1 id="error-title">Something went wrong</h1>
    <p>
      Compass couldn't open this page. Your notes, packing and plans are
      untouched.
    </p>
  {/if}
  <div class="not-found-actions">
    <a class="btn btn-primary" href="/">Back to Home</a><a
      class="btn btn-secondary"
      href="/quests">Browse quests</a
    >
  </div>
</section>

<style>
  .not-found {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 14px;
    margin-top: 20px;
    padding: 48px 24px;
    text-align: center;
  }
  .not-found-mark {
    width: 64px;
    height: 64px;
    transform: rotate(-35deg);
  }
  .not-found-eyebrow {
    font-size: var(--font-caption);
    font-weight: 700;
    letter-spacing: 1.55px;
    text-transform: uppercase;
    color: var(--muted);
  }
  h1 {
    margin: 0;
    font:
      600 28px "Cinzel",
      Georgia,
      serif;
    letter-spacing: 0.3px;
    color: var(--heading);
  }
  p {
    margin: 0;
    max-width: 460px;
    color: #c9d4da;
  }
  .not-found-actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 10px;
  }
</style>
