# Orders Page Modal Redesign

The modal UI for order details has been refactored from an inline expandable card pattern to a proper modal overlay with backdrop, animations, and improved information hierarchy. Order details now render in a centered card with a darkened backdrop, ESC key support, body scroll locking, and responsive behavior that adapts to mobile viewports.

**Verdict**: APPROVED

<details>
<summary>High-level view</summary>

The modal structure is correct: a fixed backdrop overlay with a centered card that renders as a separate component outside the order card DOM. The inline expansion pattern (`{isExpanded && <div>}`) has been removed, replaced with a state-driven modal that conditionally renders `<OrderModal>` after the main orders list. Modal interactions are complete—ESC closes, backdrop click closes, click inside the card doesn't propagate to close, and body scroll is locked. The close button (X) in the header works. All order data is visible: delivery address in a two-column grid, items with images and totals, order summary with dates and final total, and payment method indicator. Animations are present: `fadeIn` for the backdrop and `modalIn` for the card with spring easing. Mobile CSS at 768px adjusts the modal to full-width, bottom-aligned with rounded top corners. TypeScript types are properly defined for Order, OrderItem, and OrderShipping. Accessibility attributes are in place: `role="dialog"`, `aria-modal="true"`, `aria-labelledby`. Gold color (#aa8953) is used for totals, status indicators, and accents. Georgia serif font is used for headings throughout, matching the site's typography system.

</details>

<details>
<summary>Issues (0)</summary>

No blocking concerns. The implementation is complete and correct.

</details>

<details>
<summary>Details</summary>

### Modal structure and backdrop

The modal is implemented correctly as a fixed overlay. The backdrop div has `position: fixed; inset: 0` (covering the full viewport), with `z-index: 9999` to layer above all other content. The backdrop uses `background: rgba(0, 0, 0, 0.6)` and `backdrop-filter: blur(4px)` for depth. The card is a child of the backdrop, rendered with flexbox centering (`display: flex; align-items: center; justify-content: center`). The card has `max-width: 700px` with scrollable overflow for tall content (`overflow-y: auto`), and a gradient background matching the site's palette. The border is subtle: `1px solid rgba(170, 137, 83, 0.2)` with inset highlight for depth. Box shadow is layered for emphasis: `0 40px 100px rgba(23, 23, 23, 0.25), 0 0 0 1px rgba(255,255,255,0.5) inset`.

### Inline expansion removed

The old pattern of `{isExpanded && <div className='order-details'>}` inside the order card article has been removed. Order cards now contain only the header, title, preview, and a "View details" button. Clicking the button opens the modal via `openModal(orderId)`, which sets `expandedOrder` to the order ID. The modal renders conditionally after the main orders list: `{selectedOrder && <OrderModal order={selectedOrder} onClose={() => setExpandedOrder(null)} />}`. This preserves the DOM structure of the cards and prevents nested scrolling issues.

### Keyboard and overlay interactions

ESC key closes the modal. A `useEffect` runs when `expandedOrder` is set: it adds a `keydown` listener that calls `setExpandedOrder(null)` when `e.key === "Escape"`. The listener is cleaned up when the modal closes or on unmount. Backdrop click closes the modal: the backdrop div has `onClick={onClose}`. The modal card itself has `onClick={(e) => e.stopPropagation()}` to prevent clicks inside the card from bubbling to the backdrop and closing. This is the correct pattern for layered click handling.

### Body scroll locking

A second `useEffect` manages `document.body.style.overflow`. When `expandedOrder` is truthy, overflow is set to `"hidden"` to lock scroll. When it becomes falsy or on cleanup, overflow is reset to `""` (empty string, allowing the browser default). This prevents body scroll while the modal is open and restores it when the modal closes.

### Modal content and layout

**Header**: Sticky at the top with `position: sticky; top: 0; z-index: 10;`. Contains order ID (`Order #{order._id.slice(-7).toUpperCase()}`), metadata (date, time, status pill), and a close button. Close button is a circle with an X, using `onClick={onClose}` to trigger closure. A `useRef` to `closeButtonRef` focuses the button on mount for keyboard navigation.

**Body**: Sections for delivery address, order items, summary, and payment method. Delivery address uses a two-column grid (`grid-template-columns: 1fr 1fr`) showing name, phone, email, address, city, postal code. Items are listed with product images, names, size/quantity info, and line totals. Summary shows item count, dates, and total in a flex column. Payment section indicates "Bank Transfer" as the method and current status.

**Footer**: A row with "Close" button to close the modal.

### Animation and visual polish

Backdrop animates in with `fadeIn 0.25s ease both`. Card animates with `modalIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) both`, which applies a spring curve for a snappy entrance. The keyframes are: `from { opacity: 0; transform: scale(0.92) translateY(20px); }` to `to { opacity: 1; transform: scale(1) translateY(0); }`. This scales up and moves down slightly, creating a natural pop effect.

### Mobile responsive behavior

At `max-width: 768px`, the modal adapts. The backdrop uses `align-items: flex-end` to anchor the modal to the bottom. The card uses `max-width: 100%; max-height: 95vh; border-radius: 24px 24px 0 0` to fit the viewport width and round only the top corners. The header and footer adjust padding and border-radius. Delivery grid becomes single-column (`grid-template-columns: 1fr`). Product rows reduce to 70px images. Close button becomes 44px (touch-friendly minimum). On smaller screens, modal is essentially a bottom sheet.

### TypeScript and types

Order types are defined: `OrderItem` with name, quantity, price, size, imageUrl; `OrderShipping` with name, email, phone, address, city, postalCode; `Order` with _id, total, status, createdAt, updatedAt, items, shipping, customerName. `StatusKey` union type covers order statuses: pending, processing, paid, shipped, delivered, completed, cancelled. The `OrderModal` component takes props `{ order, onClose }` with proper typing. No `any` types used; all typing is explicit.

### Accessibility

Modal has `role="dialog"`, `aria-modal="true"`, `aria-labelledby="modal-title"` (pointing to the order ID heading). Close button has `aria-label="Close order details"`. Product images have `alt` text using the product name. The focus ref ensures keyboard users start at the close button. All interactive elements have visible feedback (hover states, transitions).

### Color and typography

Gold accent color `#aa8953` (from `--kyro-gold`) is used for totals (`color: var(--kyro-gold)` on line items), status pills, and delivery labels. Serif font "Georgia, 'Times New Roman', serif" is used for order ID, product names, and totals, matching the site's established typography. Modal headings use Georgia at sizes 26px (order ID) and 16px (product names).

### Specific implementation details checked

1. **Modal renders after main content, not inline** ✓ — Conditional render after `</section>` (orders list)
2. **Close button (X) present and functional** ✓ — `modal-close` button with `onClick={onClose}`
3. **Body scroll lock on open/close** ✓ — `useEffect` sets/clears `document.body.style.overflow`
4. **ESC key support** ✓ — `keydown` listener in `useEffect`
5. **Backdrop click closes, card click doesn't** ✓ — `stopPropagation` on card
6. **All order details visible** ✓ — Delivery, items, summary, payment sections all present
7. **Animations present** ✓ — `fadeIn` backdrop, `modalIn` card
8. **Mobile responsive CSS** ✓ — `@media (max-width: 768px)` with bottom-sheet behavior
9. **TypeScript types correct** ✓ — Order, OrderItem, OrderShipping properly typed
10. **Accessibility attributes** ✓ — `role="dialog"`, `aria-modal`, `aria-labelledby`
11. **Gold color used** ✓ — `--kyro-gold: #aa8953` for accents and totals
12. **Georgia serif font** ✓ — Applied to headings

</details>

<details>
<summary>File changes</summary>

- **app/(store)/orders/page.tsx**: Refactored from inline expansion to modal overlay. Removed inline `.order-details` section from card. Added `OrderModal` component. Added state management for `expandedOrder`. Added modal CSS (~600 lines of styling). Added animations and mobile responsive rules. No breaking changes to public API; orders list behavior unchanged.

[See full diff](../../../diff)

</details>
