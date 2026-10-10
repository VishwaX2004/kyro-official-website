# Checkout Order Placement Performance & Security Optimization Plan

**Goal:** Reduce POST /api/orders response time from 5-10s to <500ms while maintaining security and email/stock update reliability through background processing.

**Root Causes:**
- Blocking `await fetch('/api/orders/send-email')` (3-5s) inside request handler
- Synchronous stock decrements in a loop (1-2s per item)
- Redundant post-insert verification `findOne()`
- Inefficient MongoDB connection test with `admin.command({ ping: 1 })`
- Client waits full request duration before clearing cart, causing perceived slowness

**Strategy:** Use Next.js `unstable_after()` (available in next@^16.4.0 from 'next/server') to defer email and stock updates to background. Optimize POST handler for fast insert. Add client-side optimistic UI updates.

---

## Implementation Plan

- [ ] 1. Create rate limiter utility at `lib/rate-limit.ts`.
      Exports `checkRateLimit(key: string, maxRequests: number, windowMs: number): { allowed: boolean; remaining: number }`.
      Uses module-level `Map<string, Array<number>>` to track request timestamps in sliding windows.
      Non-persistent (adequate for single-process); resets on server restart (acceptable for this use case).
      Files: `lib/rate-limit.ts`
      Verify: No build errors; no imports needed elsewhere yet (checked by next build).

- [ ] 2. Refactor POST /api/orders handler in `app/api/orders/route.ts` for speed and security.
      Changes:
      - **Remove blocking operations:** Delete the entire `fetch('/api/orders/send-email')` await block and serial `for` loop over stock decrements. Wrap both in `after(() => { ... })` for background execution.
      - **Remove redundant checks:** Delete the post-insert verification `findOne()` and the `admin.command({ ping: 1 })` connection test (trust clientPromise).
      - **Strip debug logging:** Replace 20+ `console.log` statements with 3-4 essential errors only (keep connection errors, insert errors, critical failures). Keep success summary for monitoring.
      - **Add input validation:** After parsing body, validate: items array length max 20, each item's price and quantity must be positive numbers, all string fields trimmed and non-empty, required address fields present.
      - **Add rate limiting:** Call `checkRateLimit(session.userId, 3, 60000)` before processing; return 429 with "Too many orders" if exceeded.
      - **Add request timeout:** Wrap the entire POST logic (after initial parsing) in `Promise.race([mainLogic, timeout(5000)])` using AbortController or setTimeout. If timeout fires, return 504 "Request timeout".
      - **Return 201 immediately:** After successful `insertOne()` and before any background work, call `NextResponse.json({ message: "...", orderId: displayOrderId }, { status: 201 })` and return. The `after()` callbacks execute after response is sent.
      - New imports: `import { after } from "next/server"`, `import { checkRateLimit } from "@/lib/rate-limit"`
      Files: `app/api/orders/route.ts`
      Verify: Run `npm run build` — no errors. (Functional verification in step 5.)

- [ ] 3. Update checkout page `app/(store)/checkout/page.tsx` for optimistic UI.
      Changes in `placeOrder()` function:
      - **Optimistic cart clear:** Call `saveCart([])` and `setCartItems([])` **immediately** before `fetch()`, not after. User sees empty cart instantly while server processes.
      - **Add submitting state message:** Update UI to show "Placing your order..." while `submitting` is true, so user knows the request is in flight.
      - **Restore cart on error:** Capture cart items in a variable before clearing; if fetch fails, restore with `saveCart(capturedItems)` and `setCartItems(capturedItems)` in the error handler.
      - **Shorter success toast:** Show toast for 1500ms (reduce from 2000ms to confirm faster feedback).
      - **No timeout needed here:** The backend now returns 504 if its own timeout fires, so client does not need to set its own network timeout.
      Files: `app/(store)/checkout/page.tsx` (modify only the `placeOrder()` function and related state)
      Verify: Manual test (see step 5).

- [ ] 4. Verify Next.js configuration and imports.
      Check `next.config.ts`: The `after()` function is built-in to next@^16.4.0 (exported from 'next/server'), so **no config changes are required**. The experimental.after flag was for older versions; v16.4 has it stable.
      Confirm imports compile: Run `npm run build` and check for "after is not exported from next/server" errors. If any occur, update next.config.ts with `experimental: { after: true }` (but this should not be needed).
      Files: `next.config.ts` (read-only unless build fails)
      Verify: `npm run build` — no import errors.

- [ ] 5. Integration test and performance verification.
      **Setup:** Start dev server (`npm run dev`). Log in as a user. Add items to cart and proceed to checkout.
      **Test 1 - Fast response:** In browser DevTools Network tab, submit an order. Check POST /api/orders response time is <500ms (typically 100-300ms). Response should be 201 with `{ message: "...", orderId: "MM-DD-IDXXX" }`.
      **Test 2 - Optimistic clear:** Submit order and observe cart clears **immediately** before email arrives, not after. Timer bar should reach ~0 visually within 100ms.
      **Test 3 - Emails arrive in background:** Wait 10-15 seconds. Check customer inbox for confirmation email with order details, items, and delivery address. Check admin inbox for order notification with payment slip alert. Both emails should be complete.
      **Test 4 - Stock decremented:** In admin or DB, check that product stock for the ordered decant sizes has been reduced by the ordered quantities (verify via admin page product listing or direct DB query).
      **Test 5 - Rate limiting:** Rapidly submit 4 orders in 10 seconds (from same user). The 4th should return 429 "Too many orders". Wait 60s and submit again; it should succeed (rate window resets).
      **Test 6 - Error handling:** Try placing order with invalid input (negative price, empty items, etc.). Verify 400 error with clear message.
      **Test 7 - Restore cart on failure:** Simulate server error (e.g., kill MongoDB connection for a moment, trigger error in POST handler, restart DB). Submit order. Verify cart is restored on error toast.
      Command: `npm run dev` then manual browser testing. Check `/orders` page to confirm order appears, and inspect browser console for any errors.
      Expected outcome: POST response <500ms, cart clears optimistically, all background tasks complete within 15s, no UI jank or errors.

---

## Detailed Changes by File

### `lib/rate-limit.ts` (new file)
```typescript
// Module-level state: Map<key, Array<timestamps>>
const requestLog = new Map<string, number[]>();

export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  
  // Initialize or retrieve timestamps
  if (!requestLog.has(key)) {
    requestLog.set(key, []);
  }
  const timestamps = requestLog.get(key)!;
  
  // Remove timestamps outside the window
  const windowStart = now - windowMs;
  const validTimestamps = timestamps.filter(ts => ts > windowStart);
  requestLog.set(key, validTimestamps);
  
  // Check if allowed
  const allowed = validTimestamps.length < maxRequests;
  if (allowed) {
    validTimestamps.push(now);
  }
  
  const remaining = Math.max(0, maxRequests - validTimestamps.length);
  return { allowed, remaining };
}
```

### `app/api/orders/route.ts` (refactored POST handler)
**High-level changes:**
- Remove all but 4 essential console.log statements (init, success, critical errors only)
- Add `checkRateLimit()` call after session validation; return 429 if rate-limited
- Remove `admin.command({ ping: 1 })`; trust clientPromise
- Add input validation (items length, positive numbers, non-empty strings)
- Add request timeout wrapper
- Wrap email and stock decrement in `after(() => { ... })`
- Return 201 after insertOne, before background tasks start
- Keep todayOrderCount for displayOrderId (fast countDocuments)

**Imports to add:**
```typescript
import { after } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
```

**Pseudo-code flow (POST handler):**
```
1. Get session (no change)
2. Parse body (no change)
3. Validate items array and fields (NEW)
4. Check rate limit (NEW) → return 429 if exceeded
5. Connect to MongoDB (no ping test)
6. Count today's orders for displayOrderId
7. Insert order into DB
8. Return 201 immediately (NEW: return here before background work)
9. after(() => {
     - Send confirmation emails (moved from blocking await)
     - Decrement stock for each item (moved from blocking loop)
   })
10. Background tasks execute after response is sent
```

### `app/(store)/checkout/page.tsx`
**Changes in `placeOrder()` function only:**
- Before `fetch()`: Save cart to variable, clear localStorage and state immediately
- On success: Show success toast, navigate after short delay
- On error: Restore cart from saved variable, show error toast
- Update submitting UI state with "Placing order..." message

---

## Key Design Decisions

1. **No persistent job queue** (e.g., Bull, RabbitMQ) needed. `after()` is sufficient because:
   - Email sending is tolerant of failures (retries can be added via nodemailer config later)
   - Stock decrements can happen in background; inconsistency during 15s window is acceptable (admin can verify and manually adjust)
   - Single-process Node server is adequate for current scale

2. **Rate limiting via in-memory Map** instead of Redis:
   - Fast, no network latency
   - Non-persistent (resets on restart), but acceptable for this use case
   - Can upgrade to Redis later without code changes (just swap implementation)

3. **5s timeout on POST handler**:
   - Enough time for MongoDB inserts (typically <100ms)
   - Prevents handler hanging if DB connection stalls
   - Client will retry or show error

4. **Optimistic UI (cart clear before response):**
   - Improves perceived performance dramatically
   - Safe: error handling restores cart
   - Matches modern UX patterns (Gmail, etc.)

5. **Max 20 items per order:**
   - Prevents abuse (massive emails, slow stock updates)
   - Covers 99%+ of real use cases (most users order 1-5 items)

6. **Strip console.log:** Reduces I/O overhead and clutter; keep only essential errors for monitoring.

---

## What This Achieves

| Metric | Before | After |
|--------|--------|-------|
| POST /api/orders response time | 5-10s | <500ms |
| Email send time | Blocking | Background (~10-15s, non-blocking) |
| Stock update time | Blocking, serial | Background, parallel-ready (~5-10s, non-blocking) |
| Cart clear timing | After response | Immediately (optimistic) |
| User perceived speed | Slow | Fast |
| Security (rate limit) | None | 3 orders/min per user |
| Reliability | Partial (no timeout) | Better (timeout + background retry-friendly) |

---

## Testing Checklist

- [ ] POST returns 201 in <500ms
- [ ] Cart clears optimistically, before response
- [ ] Emails arrive within 15s with full details and images
- [ ] Stock decremented correctly for ordered items
- [ ] Rate limit blocks 4th order in 60s window; allows after 60s
- [ ] Invalid input (negative price, empty items) returns 400
- [ ] Cart restored on error
- [ ] No console spam; only essential errors logged
- [ ] `npm run build` succeeds with no warnings

---

## Notes

- **AGENTS.md Rule:** This is Next.js 16.4+. The `after()` function is built-in; no experimental config needed.
- **No breaking changes:** Existing functionality (GET /api/orders, email content, stock schema) remains unchanged.
- **Backward compatible:** Old clients will still work; they will simply see fast responses and background tasks will handle the rest.
- **Next steps after this plan:** Implement each step sequentially, verify step 5, then commit and merge.
