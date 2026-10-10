// Module-level state: Map<key, number[]> to track request timestamps in sliding window
const requestLog = new Map<string, number[]>();

/**
 * Check if a request should be rate-limited using a sliding window approach.
 * @param key - Unique identifier (e.g., userId)
 * @param maxRequests - Maximum requests allowed in the window
 * @param windowMs - Time window in milliseconds
 * @returns Object with allowed status and remaining requests
 */
export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; remaining: number } {
  const now = Date.now();

  // Initialize or retrieve timestamps for this key
  if (!requestLog.has(key)) {
    requestLog.set(key, []);
  }
  const timestamps = requestLog.get(key)!;

  // Remove timestamps outside the window (sliding window cleanup)
  const windowStart = now - windowMs;
  const validTimestamps = timestamps.filter((ts) => ts > windowStart);
  requestLog.set(key, validTimestamps);

  // Check if this request is allowed
  const allowed = validTimestamps.length < maxRequests;
  if (allowed) {
    validTimestamps.push(now);
  }

  const remaining = Math.max(0, maxRequests - validTimestamps.length);
  return { allowed, remaining };
}
