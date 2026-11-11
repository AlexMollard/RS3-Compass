/**
 * Calls `refresh` every `ms` and whenever the tab's visibility changes; returns the teardown.
 * `refresh` is always called with no arguments, never with the event.
 */
export function startVisibleRefresh(
  refresh: () => void,
  ms = 60_000,
): () => void {
  const run = () => refresh();
  const timer = setInterval(run, ms);
  document.addEventListener("visibilitychange", run);
  return () => {
    clearInterval(timer);
    document.removeEventListener("visibilitychange", run);
  };
}
