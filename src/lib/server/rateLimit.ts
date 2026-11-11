const WINDOW_MS = 60_000;
const MAX_CLIENTS = 1024;
export const CLIENT_LOOKUPS_PER_MINUTE = 6;
// The in-flight caps clear within seconds, unlike the one-minute budgets.
export const IN_FLIGHT_RETRY_SECONDS = 5;

/** Whole seconds until an entry recorded at `oldest` leaves the one-minute window. */
export function retryAfterSeconds(oldest: number, now: number): number {
  return Math.max(1, Math.ceil((oldest + WINDOW_MS - now) / 1000));
}

/**
 * A per-client share of the shared upstream budget, so one caller cannot use
 * the whole minute for everyone. `take` records a lookup and returns the
 * Retry-After seconds when the client is over its share. The least recently
 * seen clients are dropped once more than MAX_CLIENTS are tracked.
 */
export function createClientLimiter(limit = CLIENT_LOOKUPS_PER_MINUTE) {
  const clients = new Map<string, number[]>();
  return function take(client: string, time: number): number | undefined {
    const times = (clients.get(client) ?? []).filter(
      (t) => time - t < WINDOW_MS,
    );
    clients.delete(client);
    clients.set(client, times);
    if (times.length >= limit) return retryAfterSeconds(times[0], time);
    times.push(time);
    while (clients.size > MAX_CLIENTS)
      clients.delete(clients.keys().next().value!);
    return undefined;
  };
}
