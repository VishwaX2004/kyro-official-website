# Implementation Plan: Orders Page Modal Redesign

## Task Overview
Redesign the orders page 'View Details' functionality to display order details in a professional modal/popup instead of expanding inline. This improves UX by giving the details full visual focus and reducing page clutter.

## Exploration Summary

**Current Implementation:**
- State: `expandedOrder` tracks which order ID's details are expanded (null or string)
- Rendering: Inline expansion using conditional rendering `{isExpanded && <div className='order-details'>...}`
- Details appear inside the same article card, below the order actions
- Styling: All CSS is inline in a `<style>` tag with 2000+ lines
- Component type: Client component ("use client")
- Dependencies: Next.js 16.4.0, React 19.2.8, no test framework

**Project Structure:**
- Next.js app router with route groups: (auth), (store), admin
- No tests configured (package.json lacks test script)
- CSS design system uses custom properties: --kyro-bg, --kyro-gold, --kyro-ink, etc.
- Serif font (Georgia) for headings, cream/ivory backgrounds, gold accents (#aa8953)
- Component includes StatusTimeline, ProductImage, and multiple utility functions

**Key Files Modified:**
- Only file to modify: `d:\Kyro-Web\app\(store)\orders\page.tsx`

## Implementation Decisions

1. **State Management**: Rename `expandedOrder` to `modalOrder` for clarity (tracks which order's modal is open or null). This makes the codebase self-documenting without changing the pattern.

2. **Modal Component**: Create an inline `OrderModal` component (nested inside the file) instead of extracting to a separate file. This keeps the modal logic co-located with the orders list and avoids extra imports; single-responsibility principle still holds since it's a presentational component for one specific use case.

3. **Modal Rendering**: Render the modal AFTER the orders-list section (inside the main shell but outside the article cards) using a portal-like pattern. This ensures proper stacking context and prevents z-index conflicts with card hover effects.

4. **Portal Alternative**: Since this is a single-page component, a portal is not necessary. Conditional rendering at the end of the main content works well and keeps styling in one place.

5. **CSS Keyframes**: Add new animation keyframes for modal fade-in/fade-out and backdrop blur. These follow the existing animation pattern in the stylesheet (e.g., fadeUp, revealDetails).

6. **Accessibility**: Add ARIA attributes (role='dialog', aria-modal, aria-labelledby) and keyboard support (ESC key to close). Focus management: focus close button on open, restore focus to "View details" button on close using useRef.

7. **Scroll Lock**: Add body overflow hidden when modal is open, restore on close, to prevent background scroll.

8. **Button Styling**: Update the "View details" button text (remove toggle between "Hide details") and remove the arrow chevron since the modal no longer lives inline.

## Implementation Steps

### Step 1: Add Modal CSS Keyframes and Classes to the Style Block
Add CSS classes and keyframes for the modal at the END of the existing `<style>` tag.

**CSS Classes to add:**
- `.modal-overlay` — full-screen backdrop with semi-transparent dark color and blur
- `.modal-backdrop` — the clickable overlay div
- `.modal-card` — centered modal container with max-width, shadow, and glassmorphic styling
- `.modal-header` — header section with order ID and close button
- `.modal-body` — scrollable content area
- `.modal-footer` — footer section with close button
- `.modal-close-button` — X close button styling
- Animations: `@keyframes modalFadeIn`, `@keyframes modalScaleIn` (combined for entrance effect)

**Keyframes:**
```css
@keyframes modalFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes modalScaleIn {
  from { 
    opacity: 0;
    transform: scale(0.92) translateY(10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}
```

**Media queries:** Add responsive rules for modal on mobile (max-width: 560px, max-width: 768px).

**Files to modify:**
- `d:\Kyro-Web\app\(store)\orders\page.tsx` (inside the `<style>` tag)

**Verify:** Open the file and confirm CSS was added before the closing `</style>` tag, and that the syntax is valid (no unclosed braces).

---

### Step 2: Create OrderModal Component Inside the File
Add a new function component `OrderModal` inside the page.tsx file (after helper functions, before the main OrdersPage component) that accepts:
- `order: Order` — the order to display
- `onClose: () => void` — callback to close the modal
- `modalRef: React.RefObject<HTMLDivElement>` — ref for the modal card for focus management

**Component structure:**
- Render a full-screen overlay div (`modal-overlay`)
- Inside it: a clickable backdrop div with onClick handler to close
- Inside backdrop: a modal card div (`modal-card`) with role='dialog' and aria-modal
- Modal content sections:
  - Header: Order ID, date/time, status, close button (X)
  - Body: StatusTimeline, delivery info, items list, summary
  - Footer: close button

**Content to include in modal:**
- Reuse existing sections from the inline details (StatusTimeline, product list, summary grid)
- Extract the existing HTML from `{isExpanded && <div className="order-details">...}` and adapt it into the modal structure
- Add delivery information section with customer name, email, phone, address (from order.shipping)

**Handle backdrop click:** The backdrop div (not the modal card itself) should have onClick to close; modal card should have onClick that prevents propagation.

**Files to modify:**
- `d:\Kyro-Web\app\(store)\orders\page.tsx` (add OrderModal component before OrdersPage)

**Verify:** Check that the component accepts the correct props and JSX compiles without errors (no TypeScript issues).

---

### Step 3: Add State, Refs, and Effects for Modal Management
In the `OrdersPage` component:

1. **Rename state**: Change `const [expandedOrder, setExpandedOrder] = useState<string | null>(null);` to `const [modalOrder, setModalOrder] = useState<string | null>(null);`

2. **Add refs:**
   ```typescript
   const modalRef = useRef<HTMLDivElement>(null);
   const closeButtonRef = useRef<HTMLButtonElement>(null);
   const lastFocusedButtonRef = useRef<HTMLButtonElement | null>(null);
   ```

3. **Add computed selected order:**
   ```typescript
   const selectedOrder = useMemo(() => {
     return orders.find(o => o._id === modalOrder);
   }, [modalOrder, orders]);
   ```

4. **Add ESC key listener effect:**
   ```typescript
   useEffect(() => {
     const handleEscKey = (e: KeyboardEvent) => {
       if (e.key === 'Escape' && modalOrder) {
         setModalOrder(null);
       }
     };
     document.addEventListener('keydown', handleEscKey);
     return () => document.removeEventListener('keydown', handleEscKey);
   }, [modalOrder]);
   ```

5. **Add focus management effect:**
   ```typescript
   useEffect(() => {
     if (modalOrder && closeButtonRef.current) {
       // Move focus to close button
       closeButtonRef.current.focus();
     }
   }, [modalOrder]);
   ```

6. **Add body scroll lock effect:**
   ```typescript
   useEffect(() => {
     if (modalOrder) {
       document.body.style.overflow = 'hidden';
     } else {
       document.body.style.overflow = 'unset';
     }
     return () => {
       document.body.style.overflow = 'unset';
     };
   }, [modalOrder]);
   ```

**Files to modify:**
- `d:\Kyro-Web\app\(store)\orders\page.tsx` (inside OrdersPage function body)

**Verify:** Check that TypeScript compilation succeeds (no ref type errors) and the component still loads without errors.

---

### Step 4: Update Button Click Handler and Remove Inline Details
1. **Update button handler**: Change the toggleOrder function to just open the modal (no toggle):
   ```typescript
   function openModal(orderId: string) {
     lastFocusedButtonRef.current = event?.currentTarget as HTMLButtonElement;
     setModalOrder(orderId);
   }
   ```

2. **Update button text and remove arrow**: In the JSX where the "View details" button is rendered, change:
   - Text: Always display "View details" (remove the ternary that showed "Hide details")
   - Arrow: Remove the `<span className={`arrow ${isExpanded ? "open" : ""}`}>↓</span>` element
   - Click handler: Change from `toggleOrder(order._id)` to `openModal(order._id)`

3. **Remove inline details**: Delete the entire `{isExpanded && <div className="order-details">...}` block from inside the article card (the one that starts with `{/* ================================================= EXPANDED ORDER DETAILS */}`). This entire section will now be in the modal instead.

**Files to modify:**
- `d:\Kyro-Web\app\(store)\orders\page.tsx` (update button and remove inline rendering)

**Verify:** Run `npm run build` to confirm Next.js builds without errors and no JSX syntax issues.

---

### Step 5: Render Modal Outside the Orders List
At the END of the orders-list section (after the closing `</section>` of `orders-list` and before the closing `</div>` of `orders-shell`), add:

```typescript
{/* MODAL OVERLAY */}
{selectedOrder && (
  <OrderModal 
    order={selectedOrder} 
    onClose={() => setModalOrder(null)}
    modalRef={modalRef}
  />
)}
```

This places the modal in the DOM tree at the page level (inside orders-shell but outside the orders-list section), ensuring proper layering.

**Files to modify:**
- `d:\Kyro-Web\app\(store)\orders\page.tsx` (after orders-list, before total-spent div)

**Verify:** Render the page in dev mode (`npm run dev`) and click "View details" to confirm the modal appears and closes properly.

---

### Step 6: Mobile Responsiveness Testing
Test the following mobile scenarios in dev mode:

1. **Small screens (< 560px):** Modal width is 95vw, max-height 90vh with scroll
2. **Close button:** Minimum 44px touch target
3. **Content scrolling:** Modal body scrolls independently if content exceeds max-height
4. **Backdrop click:** Clicking outside modal closes it
5. **Keyboard (ESC):** Press ESC to close modal
6. **No layout shift:** Background page doesn't scroll when modal is open

**Files to check:**
- CSS media queries in `<style>` tag for `.modal-overlay` and `.modal-card`

**Verify:** 
- Open mobile DevTools (F12 → toggle device toolbar)
- Test at viewport widths: 375px, 480px, 600px, 800px
- Confirm modal is readable and functional at all sizes
- Confirm background doesn't scroll behind modal

---

## Summary of Changes

| File | Changes |
|------|---------|
| `d:\Kyro-Web\app\(store)\orders\page.tsx` | 1. Add modal CSS classes and keyframes to `<style>` tag. 2. Create OrderModal component. 3. Rename `expandedOrder` to `modalOrder`. 4. Add refs and effects for focus, scroll lock, ESC key. 5. Update button handler and remove arrow. 6. Delete inline details rendering. 7. Add modal rendering after orders list. |

## Verification Steps

1. **Build succeeds:** Run `npm run build` — no errors or warnings
2. **Dev server runs:** Run `npm run dev` — page loads without console errors
3. **Modal opens/closes:** Click "View details" → modal appears; click close button or backdrop → modal closes
4. **ESC key works:** Open modal, press ESC → closes
5. **Focus management:** After modal closes, focus returns to "View details" button
6. **Scroll lock:** Open modal on desktop → background page cannot scroll; close modal → page scrollable again
7. **Mobile responsive:** Test at 375px, 480px, 768px widths → modal is readable, close button is touch-friendly
8. **No console errors:** DevTools console is clean (no warnings or errors)
9. **Styling consistency:** Modal matches Kyro brand (cream background, gold accents, serif headings, hover effects)
10. **All order details visible:** Modal displays order ID, status timeline, items, delivery address, order summary

## Design Decisions Rationale

- **Modal vs. expanding inline:** Modal gives details dedicated visual focus, reduces page clutter, improves mobile UX by avoiding long scrolling within a single card
- **Portal-like rendering outside article:** Ensures modal is not affected by card hover transforms or z-index stacking issues
- **Inline component vs. separate file:** Keeps logic co-located for single-page orders feature; avoids extra import complexity
- **Body scroll lock:** Prevents accidental background page scroll while modal is focused; standard pattern for modals
- **ESC key + backdrop click:** Provides multiple close affordances; improves accessibility and user control
- **Focus restoration:** Restores focus to the button that opened modal after close; aids keyboard navigation and assistive technology
- **Responsive modal:** Mobile users get a readable modal that adapts to screen size (95vw width, 90vh max-height with scroll)
