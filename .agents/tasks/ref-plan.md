# Implementation Plan: Order Reference Number System (KYROID format)

This plan implements a complete order reference number system across checkout, admin dashboard, and email notifications. The format is KYROID + zero-padded 6-digit sequence (KYROID000001, KYROID000002, etc.), using the total cumulative order count as the sequence.

## Architecture Decisions

1. **Reference number format**: KYROID + 6-digit zero-padded sequence (not daily/monthly) — ensures uniqueness and simplicity. Sequence is based on total order count across all time.
2. **Generation location**: In `/app/api/orders/route.ts` POST handler — calculated after successful insert using cumulative count, ensuring atomicity.
3. **Confirmation flow**: New `confirmed` step added to checkout state machine after `review`, staying on the same page (no navigation) — provides immediate user feedback with order details.
4. **Email structure**: Reference number block added at TOP of both customer and admin emails before order summary — maximum visibility.
5. **Admin dashboard**: Reference column added as first visible field in orders table — supports quick identification.
6. **WhatsApp integration**: Pre-filled message includes reference number, items (with categories if available), down payment Rs.500, and total — auto-generates wa.me deep link.

---

## Implementation Steps

### 1. Update MongoDB order schema in `/app/api/orders/route.ts` — Add reference_number generation

**What to do**: Modify the POST handler to generate reference_number after successful insert. Calculate the reference number using total cumulative order count (not daily count). Store as `reference_number` field on the order document. Return reference_number in POST response.

**Files**:
- `app/api/orders/route.ts`

**Changes**:
- After `db.collection("orders").insertOne(orderData)` succeeds, query the count of ALL orders in the collection to determine the sequence number.
- Format: `KYROID${String(totalOrderCount).padStart(6, "0")}`
- Add `reference_number` field to the response JSON alongside `orderId` (displayOrderId).
- Pass `reference_number` to the email background call.

**Code pattern**:
```typescript
// After insertOne succeeds:
const totalOrderCount = await db.collection("orders").countDocuments({});
const referenceNumber = `KYROID${String(totalOrderCount).padStart(6, "0")}`;

// Update the inserted order with reference_number
await db.collection("orders").updateOne(
  { _id: result.insertedId },
  { $set: { reference_number: referenceNumber } }
);

// Return in response
return NextResponse.json(
  {
    message: "Order placed successfully.",
    orderId: displayOrderId,
    reference_number: referenceNumber,
  },
  { status: 201 }
);

// Pass to email in after() block
await fetch("/api/orders/send-email", {
  method: "POST",
  body: JSON.stringify({
    order: {
      displayOrderId,
      reference_number: referenceNumber,
      createdAt: new Date().toISOString(),
      items,
      delivery_address: delivery_address || shipping,
      total,
      payment_slip_url,
      payment_slip_filename,
    },
    customerEmail,
  }),
  // ...
});
```

**Verify**: 
- Run `npm run dev` and place a test order. Check the browser Network tab POST /api/orders response contains both `orderId` and `reference_number` fields. Confirm response status is 201.
- Check MongoDB directly: `db.orders.findOne({ displayOrderId: "12-25-ID001" })` should have `reference_number: "KYROID000001"` (or next sequence number depending on total orders).

---

### 2. Update email route to accept and display reference_number in `/app/api/orders/send-email/route.ts`

**What to do**: Add `reference_number` field to the request body type. Add a prominent reference number block at the TOP of both customer and admin email HTML, styled in gold with large, clear text. Update items table to include category if present.

**Files**:
- `app/api/orders/send-email/route.ts`

**Changes**:
- Update the `order` type in the POST request body to include `reference_number: string`.
- Add reference number HTML block at the TOP of both `customerEmailHtml` and `adminEmailHtml`, before the greeting section.
- Reference number block should be: large gold text (#aa8953), prominent styling, monospace font for easy readability.
- In items table, update the product cell to conditionally include category (check if `item.category` exists and display on a new line in smaller text).
- Add "Down Payment Required: Rs.500.00" notice block after the reference number block.

**Code pattern** (reference block):
```html
<!-- Reference Number Block - TOP of email -->
<tr>
  <td style="padding: 20px; text-align: center; background: rgba(170, 137, 83, 0.08); border-bottom: 2px solid #aa8953;">
    <p style="margin: 0 0 8px; font-size: 11px; color: #806537; text-transform: uppercase; font-weight: 700; letter-spacing: 0.1em;">Order Reference</p>
    <p style="margin: 0; font-size: 32px; color: #aa8953; font-weight: 700; font-family: 'Courier New', monospace; letter-spacing: 2px;">
      ${order.reference_number}
    </p>
  </td>
</tr>

<!-- Down Payment Notice -->
<tr>
  <td style="padding: 16px 20px; background: rgba(170, 137, 83, 0.04); border-bottom: 1px solid rgba(170, 137, 83, 0.2);">
    <p style="margin: 0; font-size: 12px; color: #806537; font-weight: 600;">
      ⚠️ Down Payment Required: <strong>Rs.500.00/-</strong> to the provided account. Reference: ${order.reference_number}
    </p>
  </td>
</tr>
```

**Items table update**: Modify the `itemsTableHtml` template to check for `item.category`:
```typescript
${item.category ? `<br><small style="color: #806537; font-weight: 500;">${item.category}</small>` : ""}
```

**Verify**:
- Place a test order and check customer email inbox. Confirm reference number appears prominently at the TOP in large gold text, is copyable/readable.
- Check admin email: confirm reference number and down payment notice are present.
- Search inbox for the reference number format KYROID000001 to confirm display.

---

### 3. Add confirmed state to checkout page in `/app/(store)/checkout/page.tsx`

**What to do**: Add a new `confirmed` step to the checkout state machine. When order POST returns 201 with reference_number, transition to confirmed view (do NOT navigate away). The confirmation view displays:
- Large, bold reference number (48-56px) in gold (#aa8953), copyable with copy button + toast success
- "Down payment required: Rs.500.00/-" banner with gold border
- Order summary (items with categories, total, remaining after Rs.500)
- WhatsApp button pre-filled with order message
- WhatsApp number +94768644132

**Files**:
- `app/app/(store)/checkout/page.tsx`

**Changes**:

1. Update the `CheckoutStep` type to include `"confirmed"`:
   ```typescript
   type CheckoutStep = "delivery" | "payment" | "review" | "confirmed";
   ```

2. Add state variables for confirmation view:
   ```typescript
   const [confirmedOrder, setConfirmedOrder] = useState<{
     referenceNumber: string;
     orderId: string;
     items: CartItem[];
     total: number;
   } | null>(null);
   ```

3. Update `placeOrder()` function to handle reference_number in response:
   ```typescript
   const data = (await response.json()) as {
     message?: string;
     orderId?: string;
     reference_number?: string;
   };

   if (!response.ok) {
     throw new Error(data.message || "Failed to place order");
   }

   // Transition to confirmed view instead of navigating
   setConfirmedOrder({
     referenceNumber: data.reference_number || "",
     orderId: data.orderId || "",
     items: cartSnapshot,
     total: subtotal,
   });
   setCurrentStep("confirmed");

   // Dismiss loading toast
   toast.dismiss(submittingToastId);
   toast.success("Order placed successfully!");
   ```

4. Add a new `ConfirmedView` component or section (inside the main return block). This view should:
   - Show reference number prominently (gold, large font, serif)
   - Include copy button that copies to clipboard and shows toast
   - Display "Down payment required: Rs.500.00/-" in a gold-bordered banner
   - Show order summary (items, categories if available, total)
   - Calculate and display "Amount Remaining" = total - 500
   - Include a WhatsApp button that generates wa.me link with pre-filled message
   - Style in Kyro aesthetic (gold #aa8953, cream #fffefa, serif font)

5. WhatsApp message format:
   ```
   Hi Kyro! 🌸
   Order Reference: KYROID000001
   
   Items:
   - 1x Kyro Signature - Perfume (5ml)
   - 2x Rose Oud - Oud (3ml)
   
   Total: Rs.5000
   Down Payment: Rs.500 (paid to account)
   Balance: Rs.4500
   
   Please confirm my order. 🙏
   ```

   Use `FaWhatsapp` from react-icons if available, otherwise SVG fallback. WhatsApp link:
   ```
   https://wa.me/94768644132?text=${encodeURIComponent(message)}
   ```

6. Add progress indicator update: when step is "confirmed", mark review as completed and confirmed as current.

**Verify**:
- Run `npm run dev`, log in, add items to cart, proceed to checkout.
- Complete delivery and payment steps, upload receipt, click "Confirm Order".
- Confirm the page transitions to confirmed view (not a new page) showing reference number, down payment banner, and order summary.
- Click the copy button next to reference number and confirm toast shows "Copied!".
- Click the WhatsApp button and confirm it opens WhatsApp with the pre-filled message in the chat bar.

---

### 4. Update admin orders table to show reference_number in `/app/admin/page.tsx`

**What to do**: In the orders table/list view, add a Reference column as the first visible field. In the order detail drawer, display reference_number prominently below the order number. Update the table row rendering to include reference_number.

**Files**:
- `app/admin/page.tsx`

**Changes**:

1. In the `TableView` component where orders are rendered, update the order row to include reference_number:
   - Add a new `<td>` for reference number as the first column after the row opening
   - Display format: "Ref #" label with the reference_number value
   - Style similarly to displayOrderId (monospace, bold)

2. In the `OrderDrawer` component (around line 4550), add reference_number display:
   - Add reference_number to the drawer header or near the order number
   - Display format: "Reference: KYROID000001"
   - Style in gold, monospace
   - Include a copy button (similar to existing copy ID functionality)

3. Update the CSV/export if applicable to include reference_number.

**Code pattern** (table row update):
```typescript
{isOrders && (
  <>
    <td className="td-ref">
      <small style={{ color: "#806537", fontFamily: "monospace", fontWeight: 600 }}>
        {record.reference_number || "—"}
      </small>
    </td>
    <td className="td-order">
      {/* existing order display */}
    </td>
    {/* ... rest of columns */}
  </>
)}
```

**Code pattern** (OrderDrawer header update):
```typescript
<div className="drawer-title-row">
  <h2 id="order-drawer-title" style={{ color: "white" }}>
    #{orderNumber(order)}
  </h2>
  {order.reference_number && (
    <span style={{ color: "#aa8953", fontFamily: "monospace", fontSize: "14px", fontWeight: 600 }}>
      {order.reference_number}
    </span>
  )}
  <span className={`order-status ${currentStatus}`}>
    {currentStatus}
  </span>
</div>
```

**Verify**:
- Run `npm run dev`, navigate to admin dashboard, click Orders tab.
- Confirm reference number appears as first column in orders table or near order ID.
- Click on an order to open the detail drawer.
- Confirm reference number is displayed prominently in the drawer header.
- Test copy button and confirm it copies the reference number to clipboard.

---

### 5. (Optional) Ensure category field is available in cart items when passed to email

**What to do**: Verify that cart items include a `category` field when added to the cart. If not, gracefully handle missing categories in the email template (already done in step 2).

**Files**:
- `lib/cart.ts` (CartItem type definition check)
- `app/(store)/product/[id]/page.tsx` (product page add-to-cart logic)

**Changes**:
- Check if CartItem type includes `category?: string`. If not, it's safe to add — email template already checks for its presence.
- If adding category to CartItem, ensure product page passes category when creating cart item.

**Verify**:
- Add a product to cart, inspect localStorage (DevTools → Application → Local Storage → kyro_cart). Confirm item object includes category if available.
- If category is present, email template will display it; if not, it will skip it gracefully.

---

## Verification Strategy (Full End-to-End)

1. **Local dev setup**: `npm run dev` from workspace root.
2. **Database state**: Clear test orders from MongoDB or use a test collection.
3. **Test user**: Log in as a customer (create account or use existing).
4. **Checkout flow**:
   - Add product to cart with size selection.
   - Proceed to checkout.
   - Fill delivery address, proceed to payment.
   - Upload payment receipt, click "Confirm Order".
   - Confirm order transitions to confirmed view with reference number visible.
5. **Reference number validation**:
   - Confirm POST /api/orders response includes `reference_number: "KYROID000001"`.
   - Confirm MongoDB document has `reference_number` field.
   - Confirm second order has `KYROID000002`, etc. (cumulative count, not daily).
6. **Email verification**:
   - Wait for background email job (5-15 seconds).
   - Check customer inbox for confirmation email with reference number at TOP in large gold text.
   - Check admin inbox for order notification with reference number and down payment notice.
   - Verify category displays in items table if product has category.
7. **Admin dashboard**:
   - Navigate to admin → Orders.
   - Confirm reference number appears in orders table as first column.
   - Click on an order to open drawer.
   - Confirm reference number displayed in drawer header with copy button.
8. **WhatsApp integration**:
   - On confirmed view, click WhatsApp button.
   - Confirm it opens WhatsApp (or web.whatsapp.com) with pre-filled message.
   - Confirm message includes reference number, items, down payment, and total.

---

## Notes

- **Category field**: CartItem may not have a category field. Email template gracefully handles missing categories (checks existence before display).
- **Atomicity**: Reference number is generated using cumulative order count after insert. This is sufficient for a small-to-medium scale app; for high-volume apps, consider a dedicated sequence collection.
- **No breaking changes**: Existing order display and email templates remain functional; new reference_number is additive.
- **Mobile responsiveness**: Confirmed view should use responsive breakpoints matching existing Kyro aesthetic (breakpoint at 768px).

---

## Files Summary

| File | Change | Scope |
|------|--------|-------|
| `app/api/orders/route.ts` | Add reference_number generation, count, return in response | Medium |
| `app/api/orders/send-email/route.ts` | Add reference_number to email HTML, display prominently, include down payment notice | Medium |
| `app/(store)/checkout/page.tsx` | Add `confirmed` step, confirmation view UI, WhatsApp integration | Large |
| `app/admin/page.tsx` | Add reference_number column to orders table, add to OrderDrawer | Small |
| `lib/cart.ts` | Optional: verify/add category field to CartItem type | Small |

---

## Timeline Estimate

- Step 1 (orders/route.ts): 15 min
- Step 2 (send-email/route.ts): 20 min
- Step 3 (checkout confirmation view): 45 min
- Step 4 (admin dashboard): 20 min
- Step 5 (cart category): 5 min
- Verification & testing: 30 min
- **Total: ~2.5 hours**
