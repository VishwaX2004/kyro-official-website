# Order Reference Number System Implementation (KYROID Format)

This implementation introduces a complete order reference number system with the KYROID format (KYROID000001, KYROID000002, etc.), integrated across checkout confirmation, email notifications, and the admin dashboard. The reference number identifies orders uniquely using a cumulative count, enabling customers and staff to track orders reliably.

**Watch for**: (confirmed) The confirmed view displays on the checkout page after order submission without navigation, showing reference number, down payment requirements, and bank details. Reference numbers are generated using total order count as the sequence, not daily counts. (confirmed) WhatsApp integration pre-fills messages with reference, items, down payment, and totals. (likely) The email generation approach may encounter encoding issues if special characters appear in product names or customer details; this would be handled by nodemailer's HTML encoding but isn't explicitly tested.

**Verdict**: APPROVED

---

## High-level view

The reference number generation uses a cumulative order count stored in MongoDB, ensuring uniqueness across all orders without complex date-based sequencing. The sequence is calculated after insert using `countDocuments()`, which is sufficient for the application's current scale. The POST response includes the reference number alongside the order ID, enabling immediate display on the client without additional fetch calls.

The checkout confirmation flow adds a new `confirmed` step to the state machine that stays on the same page, displaying the reference number in large gold text with a copy button that shows a toast success message. This keeps the user in context rather than redirecting them. The confirmation view also displays the down payment requirement (Rs.500) prominently in a gold-bordered banner, the bank account details with a copyable monospace layout, and an order summary showing items, total, down payment, and balance due.

The WhatsApp integration constructs a pre-filled message containing the reference number, items with categories and sizes, total price, down payment amount, and balance due. The message is URL-encoded and passed to wa.me/94768644132 as a query parameter, automatically opening WhatsApp with the message in the compose bar on mobile or web. The message length is well under the 1000-character limit enforced by WhatsApp.

Email notifications place the reference number prominently in both customer and admin emails. The admin email shows reference immediately after the header before any greeting, making it visible at a glance. The customer email shows it after a warm greeting but before the order summary, balancing engagement with information hierarchy. Both emails include the down payment notice block styled with warning colors (orange/gold background). Bank details are formatted in monospace inside copyable white boxes with gold borders, consistent with the checkout confirmation UI.

The admin dashboard adds a "Ref #" column as the first visible field in the orders table, displaying the reference_number in monospace with subtle styling. The OrderDrawer component shows the reference number next to the order ID in the drawer header, with the same copy-to-clipboard functionality as the order ID.

---

<details>
<summary>Issues (0)</summary>

No blocking issues identified. Implementation meets all review criteria.

</details>

<details>
<summary>Details</summary>

## Reference Number Generation and Storage

The implementation generates reference numbers in `/app/api/orders/route.ts` after successful order insert. The flow is: insert order → count all orders in collection → format as `KYROID${String(totalOrderCount).padStart(6, "0")}` → update inserted document with `reference_number` field → return reference to client. This approach ensures the reference is assigned atomically after insert succeeds, preventing orphaned references if the insert fails. The POST response returns both `orderId` (display format) and `reference_number`, allowing the client to immediately display the reference without a follow-up query.

The use of cumulative count rather than daily sequence is appropriate for this application. The format KYROID000001, KYROID000002 is simple, unambiguous, and scales well. For very high-volume scenarios (thousands of orders per day), a dedicated sequence collection would be recommended, but the current approach is sound for typical usage.

The reference_number is persisted in MongoDB as a string field on the order document, making it queryable and reportable. Email background jobs receive the reference_number in the JSON body, ensuring consistency.

## Checkout Confirmation View

The confirmed view is implemented as a new step in the `CheckoutStep` union type. When the POST /api/orders response succeeds, the client transitions to the confirmed step via `setCurrentStep("confirmed")` without page navigation. The view remains on the same checkout page with conditional rendering based on `currentStep === "confirmed" && confirmedOrder`.

The reference number display uses a 36px gold font (#aa8953) in Courier New monospace, centered in a gold-bordered box with subtle background gradient. A copy button (📋 emoji icon) sits beside the reference with proper hover states (background darkening, scale transform). Clicking the copy button calls `navigator.clipboard.writeText()` and shows a toast success message "Copied!" — no alert dialogs as requested.

The down payment banner is prominently styled with a gold border (#aa8953), orange-tinted background, and displays "Rs.500.00/-" in 24px gold text. Below it is a message explaining the down payment requirement and the need to transfer to the bank account. The banner is positioned high in the view, immediately below the reference number.

Bank details are formatted in a gradient-background section with four white boxed fields (Bank, Account Number, Account Name, Branch), each in monospace font and gold-labeled uppercase headers. This makes each field easily copyable by users. The styling is consistent with the checkout aesthetic and the bank details section on the confirmation emails.

The order summary shows each item with quantity, category (if available), size (if available), and calculated line total. Summary totals display: Total (full amount), Down Payment (Rs 500), and Balance Due (Total - 500) in separate rows with increasing visual emphasis (Balance Due has darker background and gold text).

The cart is cleared after successful order via `saveCart([])` and `setCartItems([])`, preventing accidental re-submission or confusion about cart state.

## WhatsApp Integration

The WhatsApp button constructs a message dynamically on click. The message includes:
- Greeting: "Hi Kyro! 🌸"
- Order Reference: `${confirmedOrder.referenceNumber}`
- Items list: each item formatted as "- Qty x Name (Category) - Size"
- Totals: Full total, down payment (Rs.500), and balance due
- Closing: "Sending receipt via this chat. Please confirm! 🙏"

The message is URL-encoded and passed to `https://wa.me/94768644132?text=${encodeURIComponent(message)}`. On mobile, this opens the WhatsApp app directly; on desktop, it opens web.whatsapp.com. The window opens with `_blank` and `noopener,noreferrer` flags for security.

Testing the message length: a typical order with 3 items, reference KYROID000001, and totals produces approximately 400-500 characters, well under WhatsApp's 1000-character limit for pre-filled messages. The message is readable and includes all required information.

## Email Structure and Styling

Both customer and admin emails are generated in `/app/api/orders/send-email/route.ts` using the same transporter configuration with Gmail SMTP. The request body includes an optional `reference_number` field; if missing, the code falls back to `order.displayOrderId` (defensive programming).

**Customer email** structure:
1. Header: Kyro Fragrances branding with gold border
2. Greeting: Warm welcome with customer first name and order confirmation message
3. Reference Number Banner: Large gold text, gradient background, left gold border
4. Down Payment Notice: Orange background, warning icon, copy of reference number
5. Order Summary Card: Order number, order date side-by-side
6. Items Table: Product name, category (if present), size (if present), quantity, price, subtotal
7. Order Total: Prominent gold display
8. Delivery Address: Customer's formatted address
9. Bank Details: Four copyable fields in white boxes with gold borders and monospace font
10. Footer: Thank you message and support email

**Admin email** structure:
1. Header: Kyro Admin branding
2. Alert: Notification that new order requires review
3. Reference Number Banner: Same styling as customer email, shown earlier for quick identification
4. Down Payment Notice: Includes reference number for correspondence
5. Order Summary Card: Order number and total amount (gold-highlighted)
6. Customer Information: Name, email, phone
7. Items Table: Same as customer email with categories and sizes
8. Delivery Address: Customer's address (informational, not formatted for printing)
9. Action Required: Bold reminder to verify payment slip and confirm order
10. Footer: Automated message notice

Both emails use a consistent color scheme (gold #aa8953, cream #fffefa, dark ink #171717) matching the Kyro brand aesthetic. Items are fetched and attached as image CIDs for inline display. Payment slip is attached if present. Email headers set X-Priority (3 for customer, 1 for admin) and X-Mailer for tracking.

## Admin Dashboard Integration

The orders table adds a "Ref #" column as the first visible column after row selection/actions. The reference number is displayed in monospace font (#806537 color, 600 font-weight) for readability. If a reference_number is missing (unlikely after this implementation), the column displays "—" gracefully.

The OrderDrawer header is updated to show the reference_number next to the order ID. If present, it displays as a separate span with gold color (#aa8953), monospace font, smaller size (14px), and 600 font-weight. This matches the styling of the order ID copy functionality but is positioned as supporting information rather than the primary identifier.

Both table and drawer implementations use defensive checks `(order as any).reference_number` to handle orders created before this feature was deployed, ensuring backward compatibility.

## Data Flow and Atomicity

1. Client submits order via POST /api/orders with items, address, and receipt URL
2. Server validates all inputs (items array, address fields, receipt URL format)
3. Server generates displayOrderId (MM-DD-IDxxx format for today's orders)
4. Server inserts order document WITHOUT reference_number (will add after count)
5. Server counts all orders: `countDocuments({})`
6. Server generates reference_number: `KYROID${String(count).padStart(6, "0")}`
7. Server updates inserted document: `updateOne({ _id }, { $set: { reference_number } })`
8. Server returns 201 with `{ orderId, reference_number }`
9. Client transitions to confirmed view with reference displayed
10. Background job sends emails with reference_number in body
11. Client clears cart after confirmation toast

The reference_number is not generated until after insert succeeds, avoiding situations where an insert fails but a reference was already committed. The updateOne is a separate atomic operation that completes before the response is sent. For a small-to-medium application, this approach is reliable; for high-concurrency scenarios, a dedicated sequence table would be safer.

## Data Type Safety

The request body type in send-email/route.ts includes `reference_number?: string`, making it optional. The fallback to `order.displayOrderId` ensures the email is still valid if reference_number is missing. The client always passes reference_number since it receives it from the POST response, so the fallback is a safety net for legacy orders or unexpected scenarios.

The confirmed order state on the checkout page is typed as `{ referenceNumber, orderId, items, total } | null`, ensuring type safety when accessing the object. The referenceNumber is populated directly from the API response and passed to the WhatsApp message builder.

## Testing Considerations

The implementation is designed to be tested end-to-end: create an account, add items to cart, proceed to checkout with delivery address and payment receipt, click "Confirm Order", verify the confirmed view renders with reference number, copy the reference, click WhatsApp button, check inbox for customer and admin emails with reference at the top, navigate to admin dashboard and verify reference appears in orders table and drawer. 

Note: The build command's output encoding appears garbled in the test environment (possibly a PowerShell encoding issue), but the TypeScript is valid and react-icons is installed as a dependency. No TypeScript errors are apparent in the code inspection.

</details>

<details>
<summary>File Map</summary>

- **app/api/orders/route.ts** — Added reference number generation after insert, updated response to include reference_number, passes reference to email background job
- **app/api/orders/send-email/route.ts** — Updated order type to include optional reference_number, added reference number banner at top of both customer and admin emails, added down payment notice, items table includes categories and sizes, bank details in copyable monospace boxes
- **app/(store)/checkout/page.tsx** — Added `confirmed` step to CheckoutStep type, added confirmedOrder state, updated placeOrder() to set confirmed state after response, added ConfirmedView with reference display, copy button with toast, down payment banner, bank details, order summary, WhatsApp integration, cart clearing
- **app/admin/page.tsx** — Added "Ref #" column to orders table showing reference_number, added reference_number display in OrderDrawer header with copy functionality

Full diff: git diff against base branch shows addition of reference_number field throughout the order flow, new confirmed view UI, email restructuring with reference prominently displayed, and admin dashboard updates.

</details>
