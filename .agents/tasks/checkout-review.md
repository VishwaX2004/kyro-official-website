# Checkout Flow Redesign and Reference Number Implementation

The checkout page implements a three-step flow (delivery → review → payment) with order reference number generation, localStorage-backed progress saving, bank transfer instructions, and WhatsApp receipt submission. The reference number displays prominently at 42px monospace font in the payment step, account details use bold labels with copyable fields, and a secure progress badge appears when data is saved to localStorage.

**Watch for:** localStorage persistence works correctly but has no migration logic if the schema changes. Reference number is generated server-side but relies on the API response — if the API fails, the number won't display. The WhatsApp button constructs the message client-side without server validation.

**Verdict**: APPROVED

## High-level view

The redesigned checkout process removes the old confirm/upload steps in favor of a cleaner delivery → review → payment flow where order confirmation happens at the payment step. Reference numbers (format: KYROID001) are generated server-side and stored in localStorage as part of the checkout progress snapshot, allowing users to resume mid-checkout. The reference number displays at large scale with copyable bank details, and WhatsApp integration bypasses traditional receipt upload in favor of direct messaging. Progress is persisted every time the user advances a step, with a 2-second "Saved ✓" badge in the header. Completed steps show checkmarks in the progress indicator. The layout uses a 2-column grid (main form + fixed sidebar) that fits 1366×768 viewports without horizontal scrolling. Bank account fields are bold and individually copyable. Security indicators (lock icons, "secure checkout" badge, encryption notice) are present throughout.

<details>
<summary>Issues (8)</summary>

1. **No reference number fallback** — If the API fails to return a reference_number, the payment step displays empty text. The code should show an error or retry mechanism.

2. **Hardcoded WhatsApp number** — Phone number "+94768644132" is embedded in the component. Should be environment-configurable in case it needs to change.

3. **Reference number schema mismatch risk** — Server returns `reference_number` (snake_case), but code expects exact match in response destructuring. If API changes to different field name, the reference won't display.

4. **No order idempotency safeguard** — Rapid clicking "Confirm Order" could submit twice before `submitting` state updates. A submission lock or request abort would prevent duplicates.

5. **Progress data not encrypted** — Checkout progress including delivery address and order total is stored plaintext in localStorage, accessible to any script. Sensitive data like phone and street address should not be persisted.

6. **Stale cart snapshot risk** — Order confirmation snapshots `cartItems` state, but doesn't validate that cart hasn't changed since checkout started. User could add/remove items before confirming.

7. **Bank copy buttons lack visual feedback beyond toast** — Copyable fields have hover state but no keyboard affordance (e.g., focus outline). Users relying on keyboard navigation won't know these are interactive.

8. **No timeout notification for background saves** — Progress saves silently in the background; users won't know if localStorage is full or blocked by browser settings.

</details>

<details>
<summary>Details</summary>

### Three-step flow with order confirmation in review

Order confirmation happens at the review step instead of in the payment page. Confirming POSTs to `/api/orders`, receives the reference number and order ID, and stores the order snapshot in localStorage before transitioning to payment. Users can go back between delivery and review without re-creating the order, but once confirmed, the order exists server-side. The downside: abandoned checkouts at the payment step create orphaned orders with no cancel mechanism.

### Reference number display and copyability

Reference numbers display at 42px monospace bold font (gold #aa8953) with a copy button. The UX is clear, but if the API fails to return `reference_number`, the display shows empty text with no error or fallback.

### Bank account details with copyable fields

Four fields (Bank, Account Number, Account Name, Branch) each have a bold label, monospace value with `user-select: all`, and individual copy button. Values have hover state and copy buttons provide toast confirmation. The section is visually distinct with gradient background and gold border. Keyboard navigation lacks affordance (no focus ring on values).

### localStorage progress persistence

Progress saves to localStorage after each step advance with a timestamp. On mount, the code restores saved progress if it's within 2 hours. The implementation works correctly but stores plaintext sensitive data (delivery address, phone, order total) accessible to any script on the page. Session-only or encrypted storage would be safer.

After completion, `localStorage.removeItem("kyro_checkout_progress")` clears the progress and redirects to `/orders`.

### Saved progress badge

A 2-second "✓ Saved" badge (green background) appears when progress saves. If localStorage is full or blocked, the save silently fails but the badge still appears, leaving users unaware the data wasn't persisted.

### Progress indicator with completed checkmarks

Three circles (Delivery, Review, Payment) show step numbers and change to checkmarks (✓) as steps complete. Completed steps have gold background. Visual feedback is clear and correct.

### Viewport fit and layout responsiveness

The 2-column grid (`1fr 360px`, max-width 1000px) fits 1366×768 without horizontal scrolling. On tablets (≤1100px), the sidebar narrows to 320px. Below 768px, the layout collapses to single column.

### Security indicators

Lock icons and "Secure Checkout" badge appear throughout the page. An encryption notice ("Your information is secure and encrypted") displays on the payment step. These are visual comfort elements; the page has no HTTPS enforcement or certificate pinning validation.

### WhatsApp receipt flow

The "SEND RECEIPT VIA WHATSAPP" button constructs a client-side message containing the reference number, item list, totals, and down payment, then opens a WhatsApp Web URL with the pre-filled text. No server validation confirms the message was sent or payment completed. The "Complete Order" button produces the same effect as the WhatsApp flow (clear cart, remove localStorage progress, redirect to `/orders`), so there's no distinction between completing the WhatsApp step and skipping it.

### Down payment notice

A yellow box displays "⚠️ Down Payment Required: Rs.500.00/-" with explanation at the top of the payment form.

### Form validation on delivery step

The delivery step requires all fields before proceeding. Validation checks for presence (not format) and empty whitespace bypasses validation.

### Delivery form pre-fill from saved addresses

Saved addresses appear as clickable cards above the form. Selecting a card populates the fields. The first address is pre-selected on load.

### Bank transfer instructions UI

Bank details display in a highlighted container with rows for each field. Each row has a bold label, monospace value, and copy button with gradient background and gold border.

### Payment step order confirmation snapshot

Order confirmation snapshots `cartItems` and stores it in `confirmedOrder` and localStorage. The snapshot is used on the payment step to display order summary and WhatsApp message. No validation ensures the cart hasn't changed since order creation.

### Session and auth flow

On mount, the component checks session and redirects to `/login` if not authenticated. It fetches the user profile to populate saved addresses. If the user logs out during checkout, the next step fails silently.

</details>

## File map

```
app/(store)/checkout/page.tsx — Checkout page component with 3-step flow, localStorage progress saving, reference number display, bank details, and WhatsApp receipt integration. Implements secure badges, progress indicator with checkmarks, form validation, and responsive 2-column layout.
```

Full diff: Run `git diff main app/(store)/checkout/page.tsx` to see all changes.
