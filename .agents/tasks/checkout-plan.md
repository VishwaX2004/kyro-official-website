# Checkout Flow Implementation Plan

## Task Overview
Implement a complete multi-step checkout flow for the Kyro e-commerce platform with delivery address management, payment receipt upload, order confirmation, and email notifications to both customer and admin.

---

## Installation & Dependencies

- [ ] 1. Install nodemailer package.
      Add nodemailer and @types/nodemailer to dependencies.
      Files: package.json
      Verify: `npm list nodemailer` shows installation; `npm run build` succeeds without errors.

---

## Data Model & API Extensions

- [ ] 2. Extend user profile schema to support saved addresses.
      Modify `/app/api/account/profile/route.ts` to handle `saved_addresses` array in PATCH and GET responses.
      Addresses follow shape: `{ name, email, phone, street, city, postalCode, country }`.
      Files: app/api/account/profile/route.ts
      Verify: Manual test—POST to /api/account/profile with addresses in payload, GET returns addresses; no test suite needed.

- [ ] 3. Extend order POST schema to accept delivery address and payment receipt details.
      Modify `/app/api/orders/route.ts` POST to accept:
      - `delivery_address: { name, email, phone, street, city, postalCode, country }`
      - `payment_slip_url: string` (Supabase URL)
      - `payment_slip_filename: string`
      Set order status to "pending_payment_verification" instead of "pending".
      Files: app/api/orders/route.ts
      Verify: Build and start dev server; no runtime tests required.

- [ ] 4. Create email sending API endpoint.
      Create new route file `/app/api/orders/send-email/route.ts` that:
      - Accepts POST with full order data, customer email, and order ID
      - Uses nodemailer with Gmail SMTP (env vars: GMAIL_USER, GMAIL_PASSWORD)
      - Fetches product images server-side and embeds as inline CID attachments
      - Sends two emails:
        1. **Customer email** (to customer): HTML template with order details, items table with images, address, bank details, payment slip attachment
        2. **Admin notification** (to kyrofragrance@gmail.com): Same format, different recipient
      - Returns 200 on success or 500 on error
      Files: app/api/orders/send-email/route.ts
      Verify: Build succeeds; do not test email sending in this step (manual verification in integration step).

---

## Checkout Page Creation

- [ ] 5. Create checkout page with multi-step flow.
      Create new page file `/app/(store)/checkout/page.tsx` that:
      - **Redirect logic**: Client-side check—if not authenticated (session fails), redirect to /login
      - **Step 1 — Delivery Details**:
        - Load saved addresses from GET /api/account/profile
        - Display saved addresses as selectable cards with "Use this address" button
        - Show "Add new address" form with fields: full name, email, phone, street, city, postal code, country
        - Include "Save this address for future orders" checkbox
        - Submit button advances to Step 2
      - **Step 2 — Payment**:
        - Read-only textarea showing bank details (Bank: People's Bank | Account Name: Kyro Fragrances | Account Number: 212-1-002-3-0030826 | Branch: Kiribathgoda | IFSC/Swift: PSBKLKLX)
        - File upload input for payment receipt (images only)
        - Use MediaUpload pattern but customised for receipts—upload to Supabase under `receipts/` path
        - Show preview of uploaded receipt
        - Submit button advances to Step 3
      - **Step 3 — Order Review & Confirmation**:
        - Display all cart items: product image, name, size, quantity, unit price, subtotal
        - Show delivery address summary
        - Show payment receipt filename/preview
        - Show grand total
        - "Place Order" button POSTs to /api/orders with all collected data
        - On success: clear cart, show success toast, display order confirmation message
        - On error: show error toast and error message
      - Cart items read from localStorage on mount (using lib/cart.ts readCart())
      - CSS matches Kyro aesthetic: gold #aa8953, cream/ivory backgrounds, elegant cards, mobile-responsive
      Files: app/(store)/checkout/page.tsx
      Verify: `npm run dev` and navigate to /checkout; page loads, form steps render, no console errors.

---

## Cart Page Modification

- [ ] 6. Replace inline checkout form with "Proceed to Checkout" button.
      Modify `/app/(store)/cart/page.tsx`:
      - Remove the `checkout` state and inline form rendering
      - Replace "PLACE ORDER" button with "PROCEED TO CHECKOUT" button that navigates to /checkout
      - Keep all existing cart management UI (quantities, remove, clear) unchanged
      Files: app/(store)/cart/page.tsx
      Verify: `npm run dev`; cart page loads, checkout button navigates to /checkout without errors.

---

## Order API Integration

- [ ] 7. Integrate email sending into order creation.
      Modify `/app/api/orders/route.ts` POST handler to:
      - After order is successfully inserted into MongoDB, call POST /api/orders/send-email with:
        - Full order data (items, shipping, total, displayOrderId, etc.)
        - Customer email
        - Order ID
      - If email sending fails, log the error but do NOT fail the order (email is non-critical)
      - Return the same 201 response to client
      Files: app/api/orders/route.ts
      Verify: `npm run build`; dev server starts without errors.

---

## Environment Configuration

- [ ] 8. Add email credentials to .env.local.
      Add the following lines to `./.env.local`:
      ```
      GMAIL_USER=kyrofragrance@gmail.com
      GMAIL_PASSWORD=TODO_ADD_ACTUAL_PASSWORD_HERE
      ```
      NOTE: DO NOT commit the real password. Use a placeholder and update locally before sending emails.
      Files: .env.local
      Verify: File contains both keys; `npm run dev` starts without "Missing GMAIL_USER" errors.

---

## Testing & Verification

- [ ] 9. Build project and verify no TypeScript or ESLint errors.
      Run the full build pipeline:
      ```bash
      npm run build
      npm run lint
      ```
      Expected: Build succeeds, no TypeScript errors, no lint warnings on new files.

- [ ] 10. Manual integration test of checkout flow (local dev server).
      - Start dev server: `npm run dev`
      - Log in as test user
      - Add items to cart
      - Navigate to /checkout
      - Complete Step 1 (enter or select address)
      - Complete Step 2 (upload dummy receipt or skip)
      - Review Step 3 and place order
      - Verify: Order appears in /orders page with correct details
      - Verify: MongoDB order document has correct structure (delivery_address, payment_slip_url, status="pending_payment_verification")
      Expected: Checkout flow completes without errors, order persists in database.

---

## Files to Create

- `/app/(store)/checkout/page.tsx` — Multi-step checkout page
- `/app/api/orders/send-email/route.ts` — Email service endpoint

## Files to Modify

- `package.json` — Add nodemailer dependency
- `app/api/account/profile/route.ts` — Add saved_addresses support
- `app/api/orders/route.ts` — Accept address and payment receipt; call email service
- `app/(store)/cart/page.tsx` — Replace checkout form with navigate-to-checkout button
- `.env.local` — Add GMAIL_USER and GMAIL_PASSWORD placeholders

## Dependencies to Install

```bash
npm install nodemailer @types/nodemailer
```

---

## Key Design Decisions

1. **Multi-step checkout**: Implemented as a single page with step state to keep UI cohesive and allow back/forward navigation.
2. **Saved addresses**: Stored in MongoDB user document as array to enable reuse across multiple orders.
3. **Payment receipt upload**: Stored in Supabase `receipts/` path (separate from product images) for organization.
4. **Email sending**: Non-blocking—if email fails, order still succeeds to ensure checkout is resilient.
5. **Cart data flow**: Read from localStorage on mount; cleared after order placement.
6. **Auth check**: Client-side redirect to /login if no session; server-side verification also required on orders POST.
7. **Order status**: Changed from "pending" to "pending_payment_verification" to indicate payment receipt verification step.

---

## Implementation Notes

- Next.js 16.4.0 uses App Router conventions; all routes are `/app/api/*/route.ts` and pages are `/app/(group)/path/page.tsx`.
- Supabase client already configured in `lib/supabase.ts`; reuse for receipt upload.
- MongoDB client already configured in `lib/mongodb.ts`; reuse for profile and order operations.
- Session verification via `lib/auth.ts` getSession() function.
- Email templates should match Kyro aesthetic: gold (#aa8953), cream/ivory backgrounds, serif fonts.
- Product images in emails must be fetched server-side to include as inline CID; use `next/image` or fetch directly from Supabase URL.
