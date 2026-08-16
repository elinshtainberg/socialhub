// Simple in-memory cache with TTL. Shared across the browser session.
// Queries return the cached value immediately; callers can still revalidate in background.

const store = new Map<string, { data: unknown; ts: number }>();
const TTL_MS = 30_000; // 30 seconds

export function cacheGet<T>(key: string): T | null {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > TTL_MS) { store.delete(key); return null; }
  return entry.data as T;
}

export function cacheSet(key: string, data: unknown) {
  store.set(key, { data, ts: Date.now() });
}

export function cacheInvalidate(prefix: string) {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key);
  }
}

/** Fetch with cache: returns cached immediately, always revalidates in background */
export async function cachedFetch<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  const cached = cacheGet<T>(key);
  if (cached !== null) {
    // Revalidate in background (fire-and-forget)
    fetcher().then(fresh => cacheSet(key, fresh)).catch(() => {});
    return cached;
  }
  const result = await fetcher();
  cacheSet(key, result);
  return result;
}
