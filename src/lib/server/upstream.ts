export const UPSTREAM_TIMEOUT_MS = 8000;

/** Request options for a Jagex source, with a fresh timeout signal per call. */
export function upstreamInit(accept: string, userAgent: string): RequestInit {
  return {
    signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    headers: { accept, "user-agent": userAgent },
  };
}
