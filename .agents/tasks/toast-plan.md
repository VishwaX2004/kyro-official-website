# Toast Notifications & Loading States Implementation Plan

**Objective:** Add toast notifications for every important user-facing event and add loading states across the entire Kyro-Web Next.js e-commerce site.

**Status:** Pending  
**react-hot-toast:** ^2.4.1 (already installed)  
**Toaster:** Already mounted in `app/layout.tsx` at position top-right with brand styling

---

## Key Design Decisions

1. **Toast Patterns:**
   - Success toasts: auto-dismiss after 3-4s (default Toaster duration: 4000ms)
   - Error toasts: persist 6s (pass `duration: 6000` to error calls)
   - Loading toasts: use `toast.loading()` → `toast.dismiss(toastId)` + `toast.success()/error()` on completion
   - All error toasts should use API response message when available, fallback to generic message

2. **Loading States:**
   - Use `useState(false)` for loading flags
   - Disable affected buttons/forms during loading
   - Show spinner or "Loading..." text in buttons
   - For page-level loading (shop, orders, account), show skeleton or dim state

3. **Shared Utilities:**
   - Create `lib/toast-helpers.ts` with reusable functions for common patterns
   - No separate fetch wrapper needed; inline toast calls keep code readable and context-aware

4. **Message Format:**
   - Short, user-friendly messages (e.g., "Added to cart", "Signed in", "Profile saved")
   - Avoid jargon; match the brand voice of the site

---

## Implementation Plan

### Phase 1: Utilities

- [ ] 1. Create `lib/toast-helpers.ts` with reusable toast pattern functions.
      Define `showLoadingToast(message)`, `replaceWithSuccess(toastId, message)`, `replaceWithError(toastId, message)`.
      Files: `lib/toast-helpers.ts`
      Verify: File exists and exports functions without errors.

### Phase 2: Authentication Pages & Header

- [ ] 2. Update `app/(auth)/login/page.tsx` login and register submission handlers.
      Add `toast.loading("Signing in...")` before fetch, then `toast.dismiss()` + `toast.success()` or `toast.error()` on response.
      Keep existing success/error message state for inline display; add toasts alongside.
      Files: `app/(auth)/login/page.tsx`
      Verify: Run the app, attempt login/register, confirm toasts appear with correct messages.

- [ ] 3. Update `app/components/StoreHeader.tsx` logout button.
      Add `toast.success("Signed out. See you next time.")` on successful logout.
      Files: `app/components/StoreHeader.tsx`
      Verify: Click logout, confirm success toast appears.

### Phase 3: Cart & Shopping

- [ ] 4. Update `app/(store)/shop/AddToCartButton.tsx` to add loading state and improved toast messaging.
      Add `[isAdding, setIsAdding] = useState(false)` state.
      Show "Adding..." text while loading.
      Keep existing `toast.success()` and `toast.error()` calls; ensure messages are short and clear.
      Files: `app/(store)/shop/AddToCartButton.tsx`
      Verify: Click add to cart button multiple times, confirm loading state and toasts work.

- [ ] 5. Update `app/(store)/cart/page.tsx` cart actions: remove item, clear cart, place order.
      Add `[removingId, setRemovingId]` for remove action (already exists, keep as-is).
      Add `[loading, setLoading]` for checkout submission.
      Update `removeItem()`: add `toast.success()` after successful removal (already present).
      Update `clearCart()`: add `toast.success()` (already present).
      Update `placeOrder()`: add loading state to button, loading toast on submit, success toast with order ID, error toast with message from API.
      Use pattern: `toastId = toast.loading("Processing order...")` → on response `toast.dismiss(toastId)` → `toast.success()` or `toast.error()`.
      Files: `app/(store)/cart/page.tsx`
      Verify: Run cart page, test remove, clear, and checkout flows; confirm toasts and loading states.

### Phase 4: Product Details & Actions

- [ ] 6. Update `app/(store)/product/[id]/ProductActions.tsx` client component for add-to-cart and size selection.
      Examine file (not fully read yet) to identify add-to-cart handler.
      Add loading state to submission button.
      Add loading toast before fetch, success/error toasts on response.
      Keep all messages short and friendly.
      Files: `app/(store)/product/[id]/ProductActions.tsx`
      Verify: Navigate to a product detail page, test add to cart from this page, confirm toasts and loading state.

### Phase 5: Account Management

- [ ] 7. Update `app/(store)/account/page.tsx` profile and password update forms.
      Profile form: Add `[isSaving, setIsSaving] = useState(false)` (already exists as `savingProfile`).
      Password form: `[isChanging, setIsChanging] = useState(false)` (already exists as `changingPassword`).
      Update handlers to use loading toast + success/error toast pattern.
      Modify `updateProfile()`: use `toast.loading("Saving profile...")` at start, `toast.dismiss()` + `toast.success()` or `toast.error()` on response.
      Modify `updatePassword()`: use `toast.loading("Updating password...")` at start, `toast.dismiss()` + `toast.success()` or `toast.error()` on response.
      Files: `app/(store)/account/page.tsx`
      Verify: Load account page, test profile save and password change; confirm toasts appear and loading states work.

### Phase 6: Contact Form

- [ ] 8. Update `app/(store)/contact/ContactForm.tsx` form submission.
      Add `toast.loading("Sending message...")` before fetch.
      On success, already shows success screen; add `toast.success()` call.
      On error, already shows `toast.error()`; ensure message is from API response or generic fallback.
      Files: `app/(store)/contact/ContactForm.tsx`
      Verify: Navigate to contact page, fill and submit form, confirm toasts appear.

### Phase 7: Shop Filters & Search

- [ ] 9. Update `app/(store)/shop/ShopFilters.tsx` to show loading state during filter transitions.
      Already has `isPending` from `useTransition()`.
      Add visual feedback: dim the filter panel during pending state (already has `.sf-pending` class with opacity).
      No toasts needed for filters (silent operations); loading state is visual only.
      Files: `app/(store)/shop/ShopFilters.tsx`
      Verify: Apply filters on shop page, confirm pending dimming effect works and transitions are smooth.

### Phase 8: Shop Page Loading State

- [ ] 10. Update `app/(store)/shop/page.tsx` to add a loading skeleton or state indicator.
      This is a server component with async data fetch; add a Suspense boundary + loading skeleton for product grid.
      Create `app/(store)/shop/ProductGridSkeleton.tsx` with grid skeleton UI.
      Wrap `<div className="kyro-product-grid">` with `<Suspense fallback={<ProductGridSkeleton />}>`.
      Files: `app/(store)/shop/page.tsx`, `app/(store)/shop/ProductGridSkeleton.tsx`
      Verify: Load shop page, confirm skeleton briefly appears during data fetch (may be very fast in dev), then products render.

### Phase 9: Orders & Admin

- [ ] 11. Update `app/(store)/orders/page.tsx` to add loading state for initial page load.
      Read this file to understand structure (not yet examined).
      Add loading spinner or skeleton while orders are being fetched.
      Add toast on successful load (optional, silent is OK) and toast on fetch error.
      Files: `app/(store)/orders/page.tsx`
      Verify: Navigate to orders page, confirm loading state works and orders display or error toast shows.

- [ ] 12. Update `app/admin/page.tsx` to add toast notifications for CRUD operations.
      Add `toast.loading("Saving...")` before save fetch, `toast.dismiss()` + `toast.success()` or `toast.error()` on response.
      Add `toast.loading("Loading...")` before data fetch, `toast.dismiss()` on completion.
      Add `toast.success()` or `toast.error()` on delete operation (already has `setNotice()`; add toast calls alongside).
      Keep existing `setNotice()` for inline display; add toasts for toast notifications.
      Files: `app/admin/page.tsx`
      Verify: Open admin page, add/edit/delete products/users/orders, confirm toasts appear and loading states work.

### Phase 10: API Routes (Optional Enhancements)

- [ ] 13. Review API routes to ensure consistent error responses with `message` field.
      Scan `app/api/auth/login/route.ts`, `app/api/auth/register/route.ts`, `app/api/auth/logout/route.ts`,
      `app/api/account/profile/route.ts`, `app/api/account/password/route.ts`, `app/api/orders/route.ts`,
      `app/api/products/route.ts`, `app/api/contact/route.ts`, and admin CRUD routes.
      Ensure all error responses include `message` field (already standard pattern in codebase).
      Files: All API route files (review only, minimal changes if needed)
      Verify: grep for error response patterns; confirm all errors return `{ message: "..." }`.

### Phase 11: Integration & Testing

- [ ] 14. Run full build and test suite to ensure no regressions.
      Execute `npm run build` to ensure all TypeScript compiles without errors.
      Execute test runner (likely `npm run test` or `npm run pr-check:quick`) to ensure existing tests still pass.
      Manually test each updated page: login, shop, cart, product detail, account, contact, orders, admin.
      Files: All updated files
      Verify: Build succeeds with no errors or warnings; tests pass; manual testing confirms toasts and loading states work correctly.

---

## File-by-File Changes Summary

| File | Change | Toasts | Loading State |
|------|--------|--------|---------------|
| `lib/toast-helpers.ts` | Create | Helper functions | N/A |
| `app/(auth)/login/page.tsx` | Update | Login/register success/error | Already has state |
| `app/components/StoreHeader.tsx` | Update | Logout success | N/A |
| `app/(store)/shop/AddToCartButton.tsx` | Update | Add-to-cart success/error | Add `isAdding` state |
| `app/(store)/cart/page.tsx` | Update | Remove, clear, order success/error | Already has state |
| `app/(store)/product/[id]/ProductActions.tsx` | Update | Add-to-cart success/error | Add loading state |
| `app/(store)/account/page.tsx` | Update | Profile save, password change success/error | Already has state |
| `app/(store)/contact/ContactForm.tsx` | Update | Send success/error | Already has `sending` state |
| `app/(store)/shop/ShopFilters.tsx` | Update | None | Already has `isPending` |
| `app/(store)/shop/page.tsx` | Update | None | Add Suspense + skeleton |
| `app/(store)/shop/ProductGridSkeleton.tsx` | Create | N/A | Skeleton UI |
| `app/(store)/orders/page.tsx` | Update | Load error (optional) | Add loading state |
| `app/admin/page.tsx` | Update | CRUD operations success/error | Already has `loading` state |

---

## Testing Checklist

- [ ] Login form: success and error toasts appear
- [ ] Register form: success and error toasts appear
- [ ] Logout: success toast appears
- [ ] Add to cart (shop page): loading state + success toast
- [ ] Add to cart (product detail): loading state + success toast
- [ ] Remove from cart: success toast
- [ ] Clear cart: success toast
- [ ] Checkout/place order: loading state + success toast with order ID + error toast on failure
- [ ] Update profile: loading state + success/error toast
- [ ] Change password: loading state + success/error toast
- [ ] Contact form: loading state + success/error toast
- [ ] Shop filters: pending dimming effect, smooth transitions
- [ ] Shop page: skeleton loads briefly during data fetch
- [ ] Orders page: loading state appears, error toast on fetch error
- [ ] Admin add product: loading state + success toast
- [ ] Admin edit product: loading state + success toast
- [ ] Admin delete product: success toast
- [ ] Admin CRUD for users/orders: loading state + success/error toasts
- [ ] Build passes: `npm run build` succeeds
- [ ] Tests pass: `npm run pr-check:quick` or test runner succeeds

---

## Notes

- **Toast Duration:** Error toasts use `duration: 6000` (6 seconds); success toasts use default 4 seconds from Toaster config.
- **Error Messages:** Always check API response for `message` field; fallback to generic "Something went wrong. Please try again." if missing.
- **Loading State:** Disable form/button during loading to prevent duplicate submissions.
- **Accessibility:** Toasts are already announced by screen readers via react-hot-toast; ensure loading state changes are communicated via aria-busy or similar if needed.
- **Styling:** Existing Toaster config (background #fffefa, gold success #aa8953, red error #9a3a2c) is already applied; no style changes needed.
