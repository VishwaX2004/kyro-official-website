# Mobile Responsiveness Implementation Plan

## Project Overview
- **Stack**: Next.js 16.4, React 19, TypeScript, Tailwind CSS 4, PostCSS
- **Breakpoints**: Mobile (375–767px), Tablet (768–1023px), Desktop (1024px+)
- **Constraint**: No changes to desktop styles; add mobile-specific media queries only
- **Current State**: Most pages have inline `<style>` tags with animations; some use Tailwind classes; many lack mobile media queries

---

## Key Findings

### Existing Mobile Coverage
- **Login page**: Has mobile-specific CSS in `@media (max-width: 768px)` but left panel hidden on mobile (good pattern)
- **Shop page**: Has comprehensive breakpoint coverage (`@media (max-width: 1120px)`, `900px`, `560px`, `768px`)
- **Home page**: Has some mobile media queries but limited mobile grid adjustments
- **Checkout page**: Minimal mobile CSS; needs work on form layout and sidebar
- **Orders page**: Basic mobile CSS but timeline needs adjustment for small screens
- **Cart page**: Minimal mobile CSS; product cards and summary sidebar need fixes
- **Account page**: Limited mobile CSS; form needs single-column layout
- **Product detail page**: Has inline media queries; needs mobile refinements
- **Contact page**: Missing mobile-specific media queries
- **About page**: Missing mobile-specific media queries
- **Admin page**: Missing mobile-specific media queries

### Common Patterns Found
1. **Desktop grids**: Most use multi-column grids (2–4 columns); need to collapse to 1–2 on mobile
2. **Sticky sidebars**: Many pages have `position: sticky` sidebars that should collapse or stack on mobile
3. **Large padding/gaps**: Desktop uses 24–32px padding; mobile should use 16–20px
4. **Long headings**: Use `clamp()` for responsive font sizes; works well
5. **Images**: Most use `Next/Image` with responsive `sizes` prop; good
6. **Forms**: Input height is mostly 44px+; meets accessibility standard
7. **Tables**: Orders page converts table-like UI to card layout (good pattern)
8. **Touch targets**: Buttons mostly 44px+; some small icons need wrapping

---

## Implementation Plan

### 1. Login Page (`app/(auth)/login/page.tsx`)
**Status**: Mostly mobile-ready; needs refinement.

#### Mobile Changes (max-width: 768px):
- Left brand panel already hidden (good)
- Add padding refinement for mobile:
  ```css
  @media (max-width: 768px) {
    .kyro-login-main {
      padding: 20px 16px;
    }
    .kyro-login-main max-w-[440px] {
      max-width: 100%;
    }
  }
  ```
- Ensure form inputs have 44px+ height (already met)
- Mobile form spacing adjustment

**Files**: `app/(auth)/login/page.tsx`
**Verify**: Test login form on mobile; ensure inputs are touch-friendly and full-width

---

### 2. Home Page (`app/(store)/page.tsx`)
**Status**: Has animations but lacks mobile grid optimization.

#### Mobile Changes (max-width: 768px):
- Hero heading already uses `clamp()` (good)
- Product grid: Already has `.kyro-products-grid` with `repeat(2, 1fr)` media query
- **Add**: Single-column grid on very small screens (max-width: 480px):
  ```css
  @media (max-width: 480px) {
    .kyro-products-grid {
      grid-template-columns: 1fr !important;
    }
  }
  ```
- Hero CTAs should stack on mobile:
  ```css
  @media (max-width: 768px) {
    .kyro-hero .flex.flex-wrap.items-center.gap-3 {
      flex-direction: column;
      align-items: stretch;
    }
    .kyro-hero a {
      width: 100%;
      justify-content: center;
    }
  }
  ```
- Reduce top/bottom spacing for mobile sections
- Suppress large decorative circles on mobile (already present)

**Files**: `app/(store)/page.tsx`
**Verify**: `npm run build` and test responsive grid at 375px, 480px, 768px widths

---

### 3. Shop Page (`app/(store)/shop/page.tsx`)
**Status**: Comprehensive mobile CSS already exists.

#### Mobile Refinements (max-width: 768px):
- Media queries already cover `1120px`, `900px`, `768px`, `560px`
- Current state: Filter sidebar moves below products on tablet (good)
- Product grid: 2 columns on tablet, 1 column on mobile (good)
- **Verify**: No additional changes needed; existing CSS is solid

**Files**: `app/(store)/shop/page.tsx`
**Verify**: `npm run build` and test at 375px (mobile), 768px (tablet), 1024px (desktop)

---

### 4. Product Detail Page (`app/(store)/product/[id]/page.tsx`)
**Status**: Has inline media queries; needs mobile refinements.

#### Mobile Changes (max-width: 768px):
- Already handles single-column grid for mobile
- Breadcrumb: Reduce font size from `text-xs` to `text-[10px]` on mobile
- Product image: Adjust aspect ratio for mobile
  ```css
  @media (max-width: 768px) {
    .product-detail-grid {
      grid-template-columns: 1fr !important;
      gap: 1.5rem !important;
    }
    .product-detail-container {
      padding-left: 1rem;
      padding-right: 1rem;
    }
  }
  ```
- Price cards: Stack vertically on mobile (already using 2-column grid)
- Quick details grid: Reduce from 4 columns to 2 on mobile
  ```css
  @media (max-width: 768px) {
    .product-detail .grid.grid-cols-2.sm\\:grid-cols-4 {
      grid-template-columns: repeat(2, 1fr) !important;
    }
  }
  ```
- Ensure ProductActions buttons are full-width on mobile (already present in inline styles)
- Trust information icons: Reduce font size on mobile

**Files**: `app/(store)/product/[id]/page.tsx`
**Verify**: Navigate to any product and test at 375px width; check image sizing and form usability

---

### 5. Cart Page (`app/(store)/cart/page.tsx`)
**Status**: Minimal mobile CSS; needs grid and layout adjustments.

#### Mobile Changes (max-width: 768px):
- Main cart layout: Collapse 2-column grid (items + summary) to 1 column
  ```css
  @media (max-width: 768px) {
    .cart-layout {
      grid-template-columns: 1fr !important;
    }
    .cart-summary {
      position: static;
      top: auto;
    }
  }
  ```
- Cart item row: Adjust from `grid-template-columns: 100px minmax(0, 1fr) auto` to mobile-friendly layout
  ```css
  @media (max-width: 640px) {
    .cart-item {
      grid-template-columns: 80px 1fr;
      gap: 12px;
      min-height: auto;
      padding: 12px;
    }
    .cart-item-right {
      grid-column: 1 / -1;
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
      margin-top: 8px;
    }
  }
  ```
- Product image: Reduce from 100px to 80px on mobile
- Summary sidebar: Stack below items on mobile; remove `sticky` positioning
- Heading: Already uses `clamp()` (good)
- Padding: Reduce from 24px to 16px on mobile

**Files**: `app/(store)/cart/page.tsx`
**Verify**: Add items to cart and test at 375px; verify layout stacks correctly

---

### 6. Checkout Page (`app/(store)/checkout/page.tsx`)
**Status**: Has media queries but layout needs mobile optimization.

#### Mobile Changes (max-width: 768px):
- Main layout: Collapse 2-column grid (form + summary) to 1 column
  ```css
  @media (max-width: 768px) {
    .checkout-layout {
      grid-template-columns: 1fr !important;
    }
    .checkout-summary {
      position: static;
      top: auto;
    }
  }
  ```
- Form fields: Already use responsive grid; reduce gap on mobile
  ```css
  @media (max-width: 640px) {
    .form-row {
      grid-template-columns: 1fr !important;
      gap: 12px !important;
    }
  }
  ```
- Saved addresses grid: Single column on mobile
  ```css
  @media (max-width: 768px) {
    .saved-addresses-list {
      grid-template-columns: 1fr !important;
    }
  }
  ```
- Review items: Adjust from 3-column grid to 2-column or card layout
  ```css
  @media (max-width: 640px) {
    .review-item {
      grid-template-columns: 60px 1fr !important;
      gap: 12px !important;
    }
    .review-item-price {
      grid-column: 1 / -1;
      text-align: left;
      margin-top: 8px;
    }
  }
  ```
- Progress indicator: Stack steps vertically on mobile
  ```css
  @media (max-width: 768px) {
    .progress-indicator {
      flex-direction: column;
      gap: 12px;
    }
  }
  ```
- Padding: Reduce from 32px to 20px on mobile
- Form card radius: Reduce from 20px to 16px on mobile

**Files**: `app/(store)/checkout/page.tsx`
**Verify**: Test checkout flow at 375px; verify form fields are single-column and accessible

---

### 7. Orders Page (`app/(store)/orders/page.tsx`)
**Status**: Has inline CSS; needs mobile refinements.

#### Mobile Changes (max-width: 768px):
- Main shell width: Adjust for mobile padding
  ```css
  @media (max-width: 768px) {
    .orders-shell {
      width: calc(100% - 20px);
    }
  }
  ```
- Orders heading: Stack layout elements vertically
  ```css
  @media (max-width: 768px) {
    .orders-heading {
      flex-direction: column;
      align-items: flex-start;
      gap: 16px;
    }
    .refresh-button {
      width: 100%;
    }
  }
  ```
- Stats grid: Reduce from 3 columns to 2 on mobile
  ```css
  @media (max-width: 640px) {
    .stats-grid {
      grid-template-columns: repeat(2, 1fr) !important;
      gap: 12px !important;
    }
  }
  ```
- Order card top grid: Stack on mobile
  ```css
  @media (max-width: 768px) {
    .order-card-top {
      grid-template-columns: 1fr !important;
      gap: 16px !important;
    }
    .order-right {
      flex-direction: row;
      justify-content: space-between;
      align-items: center;
    }
  }
  ```
- Timeline: Convert from 4-column grid to vertical stack on mobile
  ```css
  @media (max-width: 640px) {
    .timeline-track {
      grid-template-columns: 1fr !important;
      gap: 20px !important;
    }
    .timeline-line {
      display: none !important;
    }
  }
  ```
- Product list: Adjust layout from horizontal to vertical
  ```css
  @media (max-width: 640px) {
    .product-row {
      grid-template-columns: 1fr !important;
    }
  }
  ```
- Modal: Add mobile-specific modal styling
  ```css
  @media (max-width: 768px) {
    .modal-card {
      max-height: 90vh;
      overflow-y: auto;
    }
    .modal-header {
      position: sticky;
      top: 0;
      background: #fff;
      z-index: 10;
    }
  }
  ```

**Files**: `app/(store)/orders/page.tsx`
**Verify**: View orders page at 375px; click "View Details" to test modal responsiveness

---

### 8. Account Page (`app/(store)/account/page.tsx`)
**Status**: Minimal mobile CSS; needs major layout adjustments.

#### Mobile Changes (max-width: 768px):
- Settings grid: Collapse from 2-column (sidebar + content) to 1 column
  ```css
  @media (max-width: 768px) {
    .settings-grid {
      grid-template-columns: 1fr !important;
      gap: 16px !important;
    }
  }
  ```
- Profile sidebar: Move to top on mobile; adjust sticky positioning
  ```css
  @media (max-width: 768px) {
    .settings-profile {
      position: static;
      top: auto;
      border-radius: 16px;
      margin-bottom: 20px;
    }
  }
  ```
- Settings nav: Display horizontally as tabs on mobile instead of vertical nav
  ```css
  @media (max-width: 768px) {
    .settings-nav {
      display: flex;
      flex-direction: row;
      gap: 6px;
      margin-bottom: 20px;
      border-bottom: 1px solid var(--line);
      padding-bottom: 12px;
    }
    .settings-nav button {
      flex: 1;
      padding: 10px 8px;
      font-size: 12px;
      border-radius: 8px;
    }
  }
  ```
- Form fields: Adjust spacing and font sizes for mobile
  ```css
  @media (max-width: 640px) {
    .settings-card input,
    .settings-card textarea {
      font-size: 16px;
      min-height: 44px;
    }
  }
  ```
- Avatar: Reduce size from 88px to 72px on mobile
- Heading: Adjust font size to `clamp(24px, 6vw, 40px)`
- Padding: Reduce from 20px–24px to 16px on mobile

**Files**: `app/(store)/account/page.tsx`
**Verify**: View account settings at 375px; ensure form inputs are touch-friendly

---

### 9. Contact Page (`app/(store)/contact/page.tsx`)
**Status**: Modern component; missing mobile media queries.

#### Mobile Changes (max-width: 768px):
- Main section: Adjust padding from `pt-8 sm:pt-12 lg:pt-16` to mobile padding
  ```css
  @media (max-width: 768px) {
    section.relative.mx-auto {
      padding: 32px 16px 64px;
    }
  }
  ```
- Form grid: Collapse from 2-column (form + sidebar) to 1 column
  ```css
  @media (max-width: 768px) {
    .grid.items-start.gap-8.lg\\:grid-cols-\\[1fr_340px\\] {
      grid-template-columns: 1fr !important;
    }
  }
  ```
- Form fields: Adjust from 2-column name/email grid to 1 column
  ```css
  @media (max-width: 640px) {
    .grid.gap-5.sm\\:grid-cols-2 {
      grid-template-columns: 1fr !important;
    }
  }
  ```
- Textarea: Ensure 6 rows don't overflow mobile viewport
- Sidebar: Move from right column to below form; adjust width to full
- Contact info sidebar: Already uses `hidden lg:block`; show on mobile below form
- Buttons: Ensure submit button is full-width on mobile

**Files**: `app/(store)/contact/page.tsx`
**Verify**: Visit contact page at 375px; test form submission

---

### 10. About Page (`app/(store)/about/page.tsx`)
**Status**: Has animations; missing mobile breakpoints.

#### Mobile Changes (max-width: 768px):
- Hero heading: Already uses responsive font sizing; verify
  ```css
  @media (max-width: 768px) {
    .about-hero h1 {
      font-size: clamp(2.2rem, 9vw, 3.5rem) !important;
    }
  }
  ```
- Two-column layout: Collapse from 2 columns to 1
  ```css
  @media (max-width: 768px) {
    .about-two-col {
      grid-template-columns: 1fr !important;
      gap: 1.5rem !important;
    }
  }
  ```
- Experience cards: Reduce grid from 3 columns to 1–2 on mobile
  ```css
  @media (max-width: 640px) {
    .grid.grid-cols-1.sm\\:grid-cols-3 {
      grid-template-columns: 1fr !important;
    }
  }
  ```
- Values section: Similar grid adjustment (3 columns → 1 on mobile)
- Image containers: Adjust aspect ratios for mobile
- Padding: Reduce section padding from 40–60px to 24px on mobile
- Heading size: Ensure no overflow; use `clamp()` if needed

**Files**: `app/(store)/about/page.tsx`
**Verify**: View about page at 375px; ensure cards and grids stack properly

---

### 11. Admin Page (`app/admin/page.tsx`)
**Status**: Complex multi-tab interface; missing mobile CSS.

#### Mobile Changes (max-width: 768px):
- Sidebar: Hide sidebar on mobile; add hamburger menu toggle (out of scope for this plan; flag for future)
- Main content: Expand to full width when sidebar is hidden
- Admin table layout: Convert from table format to card layout on mobile
  ```css
  @media (max-width: 768px) {
    .admin-table {
      display: grid;
      grid-template-columns: 1fr;
    }
    .admin-table-row {
      display: grid;
      grid-template-columns: 1fr;
      gap: 8px;
      padding: 12px;
      border: 1px solid var(--line);
      border-radius: 12px;
      margin-bottom: 12px;
    }
  }
  ```
- Form fields: Single column on mobile
  ```css
  @media (max-width: 768px) {
    .admin-form-row {
      grid-template-columns: 1fr !important;
    }
  }
  ```
- User image display: Adjust thumbnail size from 40px to 32px on mobile
- Padding: Reduce from 24px to 16px on mobile

**Files**: `app/admin/page.tsx`
**Verify**: View admin page at 375px (note: sidebar visibility issue is separate; focus on content layout)

---

### 12. Header Component (`app/components/StoreHeader.tsx`)
**Status**: Likely has existing mobile navigation; verify.

#### Mobile Changes (max-width: 768px):
- Hamburger menu: Should already exist; verify visibility
- Logo size: Reduce from default to fit mobile header
- Navigation links: Hide on mobile; show in hamburger menu
- Search bar: Optional; can be hidden on mobile
- User profile icon: Ensure 44px+ touch target
- Spacing: Reduce header height from 64px to 56px on mobile

**Files**: `app/components/StoreHeader.tsx`
**Verify**: View any page at 375px; check header responsiveness and hamburger menu

---

### 13. Product Card Component (`app/components/ProductCard.tsx`)
**Status**: Rendering as part of grid; needs mobile grid support (handled in parent pages).

#### Mobile Changes:
- No component-level changes needed; parent page grids control card layout
- Verify card height and aspect ratio work on mobile
- Ensure product image lazy loading works on mobile

**Files**: `app/components/ProductCard.tsx`
**Verify**: View shop page and home page at 375px; check product card rendering

---

### 14. Footer Component (`app/components/Footer.tsx`)
**Status**: Likely has existing mobile layout; verify.

#### Mobile Changes (max-width: 768px):
- Footer grid: Collapse from multi-column to 1–2 columns
- Links: Stack vertically on mobile
- Padding: Reduce from 40px to 24px on mobile
- Font sizes: Reduce for mobile readability

**Files**: `app/components/Footer.tsx`
**Verify**: Scroll to bottom of any page at 375px; check footer layout

---

## Cross-Cutting CSS Patterns

### Global Mobile Media Queries (to add where missing)

```css
/* Mobile breakpoint: 375px–767px */
@media (max-width: 768px) {
  /* Padding adjustments */
  body {
    font-size: 16px; /* Prevents zoom on iOS */
  }

  /* Input field minimum height for touch targets */
  input, textarea, select, button {
    min-height: 44px;
  }

  /* Spacing */
  .kyro-section {
    padding-left: 16px;
    padding-right: 16px;
    margin-bottom: 24px;
  }

  /* Headings */
  h1 {
    font-size: clamp(24px, 6vw, 40px);
  }
  h2 {
    font-size: clamp(20px, 5vw, 32px);
  }

  /* Cards and containers */
  .card {
    border-radius: 16px;
    padding: 16px;
  }

  /* Buttons */
  button {
    min-width: 44px;
    min-height: 44px;
  }
}

/* Tablet breakpoint: 768px–1023px */
@media (max-width: 1023px) {
  /* 2-column layouts adjust to single column or stacked layout */
  .two-col-desktop {
    grid-template-columns: 1fr !important;
  }
}
```

---

## Testing Checklist

### Browser & Device Testing
- [ ] Chrome DevTools: 375px (iPhone SE), 425px (iPhone 12), 768px (iPad), 1024px (desktop)
- [ ] Safari: iOS 14+ on iPhone 12
- [ ] Firefox: Mobile and desktop
- [ ] Android Chrome: Android 10+

### Functionality Testing
- [ ] Navigation works on mobile (hamburger menu, links clickable)
- [ ] Forms are accessible (44px+ inputs, proper focus states)
- [ ] Images load correctly and scale responsively
- [ ] Buttons are touch-friendly (44x44px minimum)
- [ ] Modals/popovers close properly on mobile
- [ ] Lazy loading works on slow 3G
- [ ] No horizontal scroll on any page

### Visual Testing
- [ ] No text overflow or truncation
- [ ] Proper spacing and alignment
- [ ] Color contrast meets WCAG AA (4.5:1 for body text)
- [ ] Font sizes readable at arm's length (16px minimum for body)
- [ ] Animations perform smoothly (no jank)

### Performance
- [ ] Lighthouse score ≥ 80 on mobile
- [ ] Core Web Vitals: LCP < 2.5s, FID < 100ms, CLS < 0.1
- [ ] Image optimization: WebP format, responsive sizes

---

## Build & Verify Commands

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Test responsive layout
npm run dev
# Open http://localhost:3000 in Chrome DevTools with Device Mode enabled

# Run linter
npm run lint

# Check bundle size (optional)
npm run build && ls -lh .next/
```

---

## Files to Modify (Priority Order)

1. **High Priority** (core user flows):
   - `app/(store)/checkout/page.tsx` – payment flow
   - `app/(store)/cart/page.tsx` – shopping flow
   - `app/(store)/account/page.tsx` – account management

2. **Medium Priority** (key pages):
   - `app/(store)/orders/page.tsx` – order history
   - `app/(store)/contact/page.tsx` – contact form
   - `app/(store)/product/[id]/page.tsx` – product page

3. **Low Priority** (informational):
   - `app/(store)/about/page.tsx` – about page
   - `app/admin/page.tsx` – admin dashboard
   - `app/components/StoreHeader.tsx` – header
   - `app/components/Footer.tsx` – footer

---

## Notes

- **Existing CSS in `<style>` tags**: Each file has inline CSS; add mobile media queries to the same `<style>` block
- **No Tailwind utility changes**: Do not add or remove Tailwind classes; only adjust media queries in inline `<style>` tags
- **Desktop unchanged**: All desktop styles (1024px+) must remain identical
- **Touch-friendly defaults**: Ensure all interactive elements are ≥44x44px
- **Viewport meta tag**: Already present in root layout; verify `width=device-width, initial-scale=1`
- **Animations**: Consider `prefers-reduced-motion` for accessibility (already present in many files)

