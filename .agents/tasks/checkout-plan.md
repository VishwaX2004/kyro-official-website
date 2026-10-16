# Checkout Page Redesign - Implementation Plan

## Overview
Redesign `app/(store)/checkout/page.tsx` to optimize for 1366x768 viewport, add progress persistence via localStorage, improve security feel, and refine typography/information display.

---

## 1. Viewport-Fit Layout Optimization
**Decision**: The page currently uses padding (55px 24px 100px) which is excessive for viewport-fit design. Reduce to (48px 20px 80px) for 1366x768. The layout grid uses `1fr 340px` columns which already supports 2-column, but CSS media breakpoints need adjustment. Summary sidebar should use `position: sticky` more aggressively. On desktop, target ~1000px max-width with 2-column grid; on tablet (<900px), switch to single column.

**What to do**: Refactor CSS to use a 1366x768-optimized viewport layout with 2-column grid on wide screens (form left, summary right), reduced padding/margins throughout, and compact spacing in sections. Add media query for 900-1366px range specifically. Ensure all content fits without scrolling.

**Files**: `app/(store)/checkout/page.tsx` (CSS section only)

**Verify**: Open the page in a 1366x768 viewport (DevTools or actual window). Confirm:
- All progress indicator circles fit on one line
- Both delivery form and summary visible without scrolling
- Review step items visible with order summary
- Payment step shows reference number + bank details + WhatsApp button without scrolling
- No horizontal overflow on any step

---

## 2. localStorage Progress Persistence Setup
**Decision**: Use a dedicated localStorage key `kyro_checkout_progress` storing: `{ currentStep, deliveryForm, confirmedOrder, savedAt }`. On mount, check for saved data <2 hours old. If found, restore and show toast. After each form completion, auto-save. On successful order completion, clear localStorage. Add a small "Saved ✓" badge state that appears for 2s after save.

**What to do**: 
- Add new state: `saveIndicatorVisible: boolean` for the "Saved ✓" badge
- Add useEffect hook (runs once on mount) to: check localStorage, restore if <2 hours old, show "Progress restored" toast
- Add function `saveCheckoutProgress()` to write current state to localStorage with timestamp
- Call `saveCheckoutProgress()` after user completes delivery form validation, after confirming order, and before navigation
- Add `setSaveIndicatorVisible(true)` on save, auto-hide after 2s via setTimeout
- Add UI badge (small text/icon) positioned in header that shows "Saved ✓" when visible
- Clear localStorage in `updateOrderWithReceipt()` before redirect

**Files**: `app/(store)/checkout/page.tsx` (React state + useEffect + utility functions + UI badge)

**Verify**: 
- Fill delivery form, proceed to review. Hard refresh page. Confirm form data restored, "Progress restored" toast shown.
- Wait 2+ hours (simulate by setting savedAt to past date in DevTools), refresh. Confirm NOT restored (expired).
- Watch for "Saved ✓" badge appearing briefly after form submission.
- Verify localStorage key cleared after successful order completion.

---

## 3. Typography & Information Display Refinements
**Decision**: Reference number should use monospace font (Courier New) with bold weight and 28px+ font size for clarity and copyability. Account information labels in delivery form use bold. Critical info (down payment, reference number) use gold/brown color with high contrast. Add visual separators between major sections.

**What to do**:
- Increase reference number font-size from 36px to 42px, ensure letter-spacing: 3px for digits
- Keep reference number in gold (#aa8953) with monospace font-family
- Ensure copy button (📋) is prominent and clickable next to reference number
- Make delivery form labels bold (font-weight: 700) and uppercase
- Add visual section separators: subtle border-top between delivery/payment info sections
- Review section title styling: use gold-dark color, uppercase, 11px, letter-spacing
- Bank details layout: keep as rows with labels on left (white background, rounded corners), values in monospace centered or right-aligned
- Down payment notice: use warning orange background with clear bold text

**Files**: `app/(store)/checkout/page.tsx` (CSS + inline styles)

**Verify**: 
- View checkout at 1366x768: reference number is large, bold, clearly readable in monospace
- Bank account details are clearly labeled and copyable
- Down payment warning stands out visually
- Typography hierarchy is clear: section titles > labels > values

---

## 4. Security & Trust Feel Additions
**Decision**: Add visual trust indicators without changing structure or business logic. Use lock emoji (🔒) in header or section titles where payment/personal info is shown. Add checkmarks (✓) in progress steps when completed. Show "🔒 Safe & Secure" badge near payment section. Use existing gold/brown theme for consistency.

**What to do**:
- Add lock emoji to payment section title: "🔒 Payment & Receipt"
- In completed progress steps, replace circle number with checkmark: "✓"
- Add small "🔒 Safe & Secure" text badge in payment section (before bank details), using trust-building color (green or gold)
- Add subtle trust messaging in down payment notice: "Your information is secure"
- Update form-section-number styling to show checkmark character when step is completed (CSS content or React conditional)

**Files**: `app/(store)/checkout/page.tsx` (CSS + conditional rendering)

**Verify**: 
- Progress circles show numbers for current/future steps, checkmarks for completed steps
- Payment section displays lock emoji and "Safe & Secure" messaging
- No structural changes to form or state management
- Visual indicators appear only where appropriate

---

## 5. Layout Grid & 2-Column Optimization
**Decision**: The current grid is already `grid-template-columns: 1fr 340px` but needs refinement. On 1366px: keep 2-column, increase summary width to 360px for better visibility. On 900-1365px: keep 2-column but reduce summary to 320px. Below 900px: collapse to 1-column. Adjust gap from 22px to 20px on wide screens for viewport fit.

**What to do**:
- Keep `.checkout-layout` grid structure but adjust:
  - Desktop (>1100px): `1fr 360px`, gap: `20px`
  - Tablet (900-1100px): `1fr 320px`, gap: `18px`
  - Mobile (<900px): `1fr`, stack vertically
- Adjust `.checkout-container` max-width: keep 1000px but ensure padding allows full use on 1366px viewport
- Summary sidebar: increase padding from 24px to 22px (slightly tighter)
- Form card: reduce padding from 32px to 28px on desktop for compact fit
- Review section: tighten margins between review items (8px → 6px)

**Files**: `app/(store)/checkout/page.tsx` (CSS media queries and grid values)

**Verify**: 
- On 1366x768: 2-column layout fits without horizontal scroll, summary sidebar visible
- On 1024x768: still 2-column, both visible
- On 768x768: switches to 1-column, stacked layout
- All text remains readable; no content overflow

---

## 6. Error Recovery & Data Persistence on API Failure
**Decision**: When `confirmOrder()` or order creation API fails, save deliveryForm + step to localStorage before showing error. User can fix the issue and retry without re-entering data. Add explicit error message with "Retry" button option. Do not clear localStorage on API error.

**What to do**:
- In `confirmOrder()` catch block: before toast.error(), call `saveCheckoutProgress()` to preserve form state
- Modify error toast or add explicit UI element with "Retry" button if needed
- Verify `saveCheckoutProgress()` saves even partial data (deliveryForm without confirmedOrder)
- On mount, restoration logic should handle cases where currentStep is "review" but confirmedOrder is null (step backward)

**Files**: `app/(store)/checkout/page.tsx` (confirmOrder function + error handling)

**Verify**: 
- Trigger API failure (DevTools network throttle or mock API error)
- Confirm deliveryForm saved to localStorage
- Confirm error toast shown with retry option
- Refresh page, confirm form data restored, still on delivery step
- Successfully retry order creation

---

## 7. CSS Cleanup & Compaction for Viewport Fit
**Decision**: Remove excessive spacing. The existing CSS has good organization but excessive padding in many places (32px form card, 40px margin-bottom on header). Reduce to: form-card padding 24px, header margin-bottom 28px, section margins 18px. Use `clamp()` for responsive font sizing where appropriate.

**What to do**:
- `.checkout-form-card`: reduce padding from 32px to 24px
- `.checkout-header`: reduce margin-bottom from 40px to 28px
- `.form-section-title`: reduce margin-bottom from 24px to 18px
- `.review-section`: reduce margin-bottom from 24px to 18px
- `.bank-details-container`: reduce padding from 16px to 14px
- `.form-row`: reduce gap from 16px to 14px
- `.progress-indicator`: reduce gap from 20px to 16px
- Button padding: reduce from 13px 24px to 12px 20px where possible
- Ensure no collateral damage to mobile breakpoints (they should already be compact)

**Files**: `app/(store)/checkout/page.tsx` (CSS values)

**Verify**: 
- Run `npm run build` — no errors
- Open checkout at 1366x768, measure viewport fit, confirm all content visible without scroll
- Open at 1024x768 and 768x768, confirm responsive behavior unchanged
- Visual comparison: spacing looks intentional and compact, not cramped

---

## 8. Add Saved Progress Badge UI
**Decision**: Show a small "Saved ✓" badge near the top-right of the form or in header area when progress is saved. Badge appears for 2 seconds then disappears. Uses green checkmark or simple text style. Position: absolute or fixed to avoid layout shift.

**What to do**:
- Add state: `const [saveIndicatorVisible, setSaveIndicatorVisible] = useState(false)`
- Create UI element (positioned top-right of checkout form or header) that renders when saveIndicatorVisible is true
- Style: compact badge, green or gold text, checkmark icon (✓), font-size 12px, padding 6px 10px, border-radius 6px
- Update `saveCheckoutProgress()` to call `setSaveIndicatorVisible(true)`, then schedule `setTimeout(() => setSaveIndicatorVisible(false), 2000)`

**Files**: `app/(store)/checkout/page.tsx` (state + UI element + CSS styling)

**Verify**: 
- Fill delivery form, proceed to review. Observe "Saved ✓" badge appears briefly in UI
- Refresh page, confirm data restored without badge visible (only on fresh save)
- Confirm badge position does not cause layout shift

---

## Summary of Changes

| Aspect | Change | Impact |
|--------|--------|--------|
| **Layout** | Reduce padding, optimize 2-col grid for 1366px | Fits viewport without scroll |
| **Typography** | Larger reference number (42px), bold labels | Improved readability, copyability |
| **localStorage** | Add progress save/restore with 2-hour TTL | User data persists, errors don't lose form |
| **Security** | Add lock icons, checkmarks, "Safe & Secure" badge | Visual trust improvements |
| **CSS Spacing** | Compact margins/padding throughout | Viewport-fit without cramping |
| **Error Handling** | Save state before API error, enable retry | Better UX on transient failures |
| **UI Badge** | "Saved ✓" appears 2s after form save | Feedback that progress was persisted |

---

## Notes

- **No breaking changes**: 3-step flow, confirmOrder() logic, updateOrderWithReceipt() all remain unchanged
- **No new dependencies**: Uses only existing React, localStorage, and inline CSS
- **Backward compatible**: Old localStorage data (if any) will be overwritten on first save
- **Mobile-first CSS**: Existing mobile breakpoints remain effective; new desktop optimizations add on top
- **Email/API unchanged**: Reference number generation and email sending continue to work as before

---

## Verification Checklist

Before marking as complete, verify:

- [ ] Page loads without errors at 1366x768, 1024x768, 768x768 viewports
- [ ] All steps (delivery, review, payment) fit in viewport without scrolling
- [ ] localStorage saves progress after each step, restores on page refresh
- [ ] "Saved ✓" badge appears for 2s after form save
- [ ] Error state preserves form data to localStorage
- [ ] Reference number displays large and copyable
- [ ] Bank details clearly labeled and copyable
- [ ] Security badges/icons visible in payment section
- [ ] Completed progress steps show checkmarks
- [ ] 2-column layout visible on 1366px desktop
- [ ] Single-column layout on mobile (<900px)
- [ ] Responsive grid handles 900-1100px range correctly
- [ ] No visual regressions vs. current design
- [ ] `npm run build` completes without errors
