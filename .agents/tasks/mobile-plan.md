# Mobile Responsive Implementation Plan

Target: No horizontal scroll at 375px · All tap targets ≥ 44px · Grids collapse to 1–2 columns · No desktop styles changed.

Breakpoints used throughout:
- `@media (max-width: 768px)` — mobile (must work at 375px / iPhone SE)
- `@media (max-width: 1024px)` — tablet (only where layout genuinely breaks)

---

## 1. `app/components/StoreHeader.tsx`

**Current state:** The header already has a complete hamburger-driven mobile menu (`mobileOpen` state, `lg:hidden` / `hidden lg:flex` Tailwind guards). The mobile menu slides in with search, nav links, and user actions. This is solid.

**Gaps found:**

1. **Header height** — The header `div` uses `h-[70px]` which is fine, but the logo `h-[60px] w-[76px]` container and the logo itself (`h-[52px] w-[72px]`) leave very little padding on 375px. The flex gap between logo and mobile icons is `gap-5` (20px) which can cause crowding.

2. **Mobile search focus** — The mobile search bar is `h-[46px]` (≥ 44px ✓) but sits at the very top of the slide-down menu inside `px-5`. Fine.

3. **Mobile nav links** — Each link is `py-3.5` ≈ ~44px tall — meets the tap-target minimum. No changes needed.

4. **Account dropdown** — Already conditionally hidden on mobile; the user avatar/login link is replaced by dedicated mobile nav items inside the menu. ✓

5. **Cart badge & hamburger** — Both are `h-10 w-10` (40px), just under the 44px tap target recommendation. The surrounding area makes the effective tap zone larger, but we should add `min-h-[44px] min-w-[44px]` to these two buttons on mobile.

**Changes to make — inside the `<style dangerouslySetInnerHTML>` block** (add below existing rules):

```css
@media (max-width: 768px) {
  /* Ensure cart and hamburger buttons meet 44px tap target */
  .kyro-header-mobile-btn {
    min-height: 44px;
    min-width: 44px;
  }
}
```

Add `kyro-header-mobile-btn` class to both the cart `<Link>` and the hamburger `<button>` in the mobile actions section (they currently have `h-10 w-10` = 40px).

**Verification:** No horizontal scroll at 375px, both buttons ≥ 44px tap target.

---

## 2. `app/(auth)/login/page.tsx`

**Current state:** Uses Tailwind only (no `<style>` block). The page is a `fixed inset-0` full-screen layout split into `grid lg:grid-cols-[42%_58%]`. On mobile/tablet (below `lg` = 1024px), the left brand panel is `hidden lg:flex`, so only the right auth panel is visible — correct behavior.

**Gaps found:**

1. **Right panel padding** — `px-5 py-4 sm:px-8` is fine at 375px.

2. **Auth form card** — `max-w-[440px] py-2` with `my-auto` centers well. The form fields (`h-11` = 44px) already meet tap targets. ✓

3. **Mode switch buttons** — `h-10` = 40px, just under 44px. Need to bump to `h-11` on mobile.

4. **Submit / Google buttons** — `h-11` = 44px ✓.

5. **"Register" extra fields** — `space-y-3.5` stacking is fine on mobile.

6. **The heading `clamp(1.8rem,3.4vw,2.6rem)`** — at 375px, `3.4vw` ≈ 12.75px, so `clamp` hits its `1.8rem` floor. Fine.

7. **Terms links** — small text `text-[11px]` will be readable; no overflow risk.

**Changes to make — add a `<style dangerouslySetInnerHTML>` block** (the file has none currently, so add one before the closing `</main>`):

```css
@media (max-width: 768px) {
  /* Mode-switch tab buttons: bump to 44px tap target */
  [role="tablist"] button {
    min-height: 44px;
  }
}
```

**Alternatively (Tailwind-only — preferred since file uses Tailwind):**  
Change the two tab buttons from `h-10` to `h-11` (44px) without any media query — `h-11` is 44px unconditionally. This is safe since the tabs already look fine at desktop with `h-11`.

Action: change `className={... flex h-10 flex-1 ...}` → `flex h-11 flex-1` on both `<button role="tab">` elements.

---

## 3. `app/(store)/page.tsx` (Home)

**Current state:** Has an inline `<style>` block with an existing `@media (max-width: 640px)` section that only adds `padding-left/right: 20px !important` and disables some animations.

The hero uses `grid-cols-1 ... lg:grid-cols-[1fr_.82fr]` — collapses to single column below `lg` via Tailwind. The product grids use responsive Tailwind classes. Most layout is already Tailwind-responsive.

**Gaps found:**

1. **Hero heading** `clamp(3.5rem,7vw,7.2rem)` — at 375px, `7vw` = 26.25px, so `clamp` floor is `3.5rem` = 56px. The heading "Find a scent / worth keeping." at 56px on a 375px screen: `max-w-[760px]` on the h1 is fine since the grid is already single-column. However `leading-[.84]` is very tight. No overflow because it breaks to two lines. ✓

2. **Hero CTA buttons row** — `flex flex-wrap items-center gap-3` — wraps fine at 375px. Both buttons have `h-12` = 48px ✓.

3. **Info row below CTA** — `flex flex-wrap gap-x-8 gap-y-4` — wraps fine. `max-w-[610px]` is irrelevant on mobile.

4. **Right hero / spotlight column** — hidden below `lg` via `grid-cols-1` (the spotlight simply stacks below). The decorative circles and product card all become vertically stacked at mobile. This works but the spotlight image card may look odd with its absolute-positioned circles overlapping content. Need to suppress the decorative `.kyro-drift` circles on mobile.

5. **"More picks" grid** — uses `grid-cols-2 sm:grid-cols-4` style Tailwind. At 375px, 2 columns is fine for ProductCard.

6. **`#collection` section** — uses inline `grid grid-cols-2 lg:grid-cols-4` presumably. Need to verify (file was truncated but the picks and more arrays use `<ProductCard>` wrapped in `.kyro-product-wrap`). The home page `picks` section likely uses Tailwind grid, which already handles mobile.

7. **CTA section last-of-type** — Uses Tailwind classes, no mobile issues expected.

**Changes to make — extend the existing `@media (max-width: 640px)` block:**

```css
@media (max-width: 640px) {
  /* existing rules... */

  /* Suppress large decorative circles in hero on mobile to avoid overflow */
  .kyro-hero > div[aria-hidden="true"] {
    display: none;
  }

  /* Hero spotlight column: reduce padding when stacked */
  .kyro-hero-image {
    max-width: 320px;
    margin: 0 auto;
  }
}
```

Also verify the home page renders without horizontal scroll at 375px. The main issue could be absolute-positioned circles with negative offsets (`-right-32`, `-top-32`). These are `pointer-events-none` and `overflow-hidden` is on the section — already clipped. ✓ No changes needed for those.

---

## 4. `app/(store)/shop/page.tsx`

**Current state:** Has a rich inline `<style>` block with already-complete breakpoints:
- `@media (max-width: 1120px)` — narrower sidebar (225px)
- `@media (max-width: 900px)` — filter sidebar stacks above products, 2-column grid
- `@media (max-width: 560px)` — single-column grid, font-size reductions, no count box

**Gaps found:**

1. The `@media (max-width: 560px)` section is comprehensive and handles 375px well. The product grid becomes 1-column, the header stacks, padding is reduced.

2. **Filter sidebar at 560px and below** — `.kyro-filter-column` becomes `position: relative; top: auto` at 900px. At 560px: `border-radius: 18px`, reduced padding. The filter content is full-width and scrollable. ✓

3. **Missing: at 375px, the `.kyro-shop-inner` width** is `calc(100% - 20px)` = 355px. With `padding-top: 15px; padding-bottom: 55px`. Looks clean. ✓

4. **The `kyro-shop-count-box` is set to `display: none` at 560px** — ✓ removes overflow risk.

5. **Gap: `.kyro-results-tag` and `.kyro-results-divider` are hidden at 560px** — ✓.

6. **No `@media (max-width: 768px)` block exists** — the existing 560px block covers the target 375px case adequately. However, between 560px and 768px, the layout switches to single-column (from 900px). We should verify no overflow occurs between 560px and 768px.

   At 600px width: `.kyro-shop-inner` is `calc(100% - 30px)` = 570px, grid is 2 columns. The filter sidebar transitions at 900px to stacked block layout. Between 560px and 900px, the layout is block (stacked), 2-column grid. This is fine.

**Missing fix:** Add `@media (max-width: 768px)` to expand the existing partial coverage — specifically the count box and the filter chip overflow:

```css
@media (max-width: 768px) {
  .kyro-shop-inner {
    width: calc(100% - 24px);
    padding-top: 18px;
  }
  /* Prevent filter chips from overflowing */
  .kyro-filter-content {
    overflow-x: hidden;
  }
}
```

This is minor — the existing 560px rules already cover 375px. The shop page is mostly well-handled.

---

## 5. `app/(store)/shop/ShopFilters.tsx`

**Current state:** Pure Tailwind-style scoped CSS in a `<style dangerouslySetInnerHTML>` block. All widths are 100% or fit-content. No grid layouts. Checkboxes are 14×14px (below 44px tap target for the label area).

**Gaps found:**

1. **Checkbox labels (`.sf-check`)** — `padding: 4px 0` gives a label height of ~4+14+4 = 22px effective tap zone. Need to increase to at least 44px via padding, or a min-height.

2. **Price inputs (`.sf-price-row`)** — `padding: 6px 8px` on inputs gives ~28px height, below 44px. Inputs need `min-height: 44px` on mobile.

3. **Sort `<select>` (`.sf-select`)** — `padding: 7px 10px` gives ~28px, below 44px. Needs `min-height: 44px` on mobile.

4. **Search bar (`.sf-search`)** — `padding: 8px 10px`. The inner input is flexible but the container may be ~38px tall. Need `min-height: 44px`.

5. **Reset button (`.sf-reset`)** — `padding: 9px` gives ~36px. Needs `min-height: 44px`.

**Changes to make — add inside the existing `<style>` block:**

```css
@media (max-width: 768px) {
  .sf-search {
    min-height: 44px;
  }
  .sf-select {
    min-height: 44px;
  }
  .sf-check {
    min-height: 44px;
    padding: 8px 0;
  }
  .sf-check input[type="checkbox"] {
    width: 18px;
    height: 18px;
  }
  .sf-price-row input {
    min-height: 44px;
    padding: 10px 8px;
  }
  .sf-reset {
    min-height: 44px;
  }
  /* Chip text wrapping */
  .sf-chip {
    font-size: 11px;
  }
}
```

---

## 6. `app/(store)/product/[id]/page.tsx`

**Current state:** Uses Tailwind classes throughout, with a small `<style>` block for animations and `.product-actions-prominent` overrides. The product hero uses `grid lg:grid-cols-[minmax(320px,0.9fr)_minmax(0,1.1fr)]` — below `lg` it's a single column (default `grid`). 

**Gaps found:**

1. **Single column below `lg` — image stacks above info.** At 375px, the image column with `aspect-[4/4.3]` fills the full width. That's about 375px × (4/4.3) ≈ 349px tall. Fine.

2. **Breadcrumb** — `overflow-hidden whitespace-nowrap` prevents overflow ✓.

3. **Product tags (`flex flex-wrap gap-2`)** — wraps fine ✓.

4. **Quick details grid** — `grid-cols-2 sm:grid-cols-4`. At 375px, 2 columns is fine. ✓

5. **Decant size cards** — `grid grid-cols-2 gap-3` always 2-col. At 375px (min 175px per card), this is fine. ✓

6. **Purchase section** — `rounded-[26px] p-5 sm:p-6`. At 375px, padding is `p-5` = 20px, so content width ≈ 335px. Fine. The `text-4xl sm:text-5xl` price stays at `text-4xl` (36px) on mobile — readable. ✓

7. **Trust icons row** — `grid-cols-3 gap-3`. At 375px, each cell is ≈115px. The icon + text fits. ✓

8. **Scent notes grid** — `gap-3 sm:grid-cols-3` — default is `grid` (single col on mobile). Fine. ✓

9. **`product-actions-prominent` button min-height** — already set to `50px` via the style block. ✓

10. **Sticky image column** — `lg:sticky lg:top-6`. On mobile, it's not sticky. ✓

11. **Potential overflow: "Browse collection" section** — absolute positioned blur divs with `-left-24` etc. These are inside `overflow-hidden` — OK.

12. **Missing: price display on very small screens** — `text-4xl` (36px) + `Rs.` prefix on 375px in the purchase section box: "Rs. 1,200" could overflow if price is long. The box is full-width so `break-words` on the parent is needed.

**Changes to make — add to the existing `<style>` block:**

```css
@media (max-width: 768px) {
  /* Prevent long prices from overflowing the purchase card */
  .product-actions-prominent,
  .product-actions-prominent [class*="total"],
  .product-actions-prominent [class*="price"],
  .product-actions-prominent [class*="Price"] {
    overflow-wrap: break-word;
    word-break: break-word;
  }

  /* Quick details grid: keep 2 columns but reduce padding */
  /* (these are Tailwind divs, target by their content structure) */
}
```

Also add Tailwind `sm:` prefix check: the `text-4xl sm:text-5xl` price heading is inside a `div`. On 375px, `text-4xl` is 36px — acceptable. No change needed.

The biggest actual gap is the `basic details` 2-col grid at 375px — at `px-3.5 py-4` each cell is ~(375/2 - padding) ≈ 167px. The label wraps fine. ✓

**Overall:** Product page is largely well-handled by Tailwind breakpoints. The style block additions above are sufficient.

---

## 7. `app/(store)/cart/page.tsx`

**Current state:** Has inline styles with existing mobile breakpoints:
- `@media (max-width: 900px)` — `cart-layout` goes to single column
- `@media (max-width: 620px)` — padding, heading, cart-item grid, etc.

**Gaps found:**

1. **The existing 620px breakpoint** covers 375px adequately. Cart item becomes 2-col (image + details), summary stacks below items. ✓

2. **Cart item at 375px** — `grid-template-columns: 76px minmax(0, 1fr); gap: 12px; padding: 10px`. Full width = 375 - 15*2 - 10*2 = 325px usable. 76px image + 12px gap + 237px details. Readable. ✓

3. **Quantity control buttons** — `width: 32px; height: 100%` of a 31px container = 31px. Below 44px. On mobile, increase to 44px.

4. **Remove button** — `width: 29px; height: 29px`. Below 44px. Need to increase on mobile.

5. **Checkout button** — `height: 47px` ✓.

6. **Checkout overlay form inputs** — `height: 46px` ✓.

7. **Clear cart button** — `padding: 5px` inline with text. Effective tap zone is small. Need `min-height: 44px` on mobile.

8. **`cart-count-badge`** — flex row with `padding: 10px 14px`, fine as a display element (not interactive). ✓

9. **`continue-shopping` link** — `font-size: 10px`, just text link. On mobile, add `min-height: 44px; display: flex; align-items: center`.

**Changes to make — extend the existing `@media (max-width: 620px)` block (add rules):**

```css
@media (max-width: 620px) {
  /* existing rules... */

  /* Quantity buttons: meet 44px tap target */
  .quantity-control {
    height: 44px;
  }
  .quantity-control button {
    width: 44px;
  }
  .quantity-control span {
    min-width: 32px;
  }

  /* Remove button: meet 44px tap target */
  .remove-item-button {
    width: 44px;
    height: 44px;
  }

  /* Clear cart button: meet 44px tap target */
  .clear-cart-button {
    min-height: 44px;
    display: flex;
    align-items: center;
  }

  /* Continue shopping link: meet 44px tap target */
  .continue-shopping {
    min-height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}
```

---

## 8. `app/(store)/account/page.tsx`

**Note:** Two account pages exist — `app/(store)/account/page.tsx` and `app/(store)/contact/page.tsx`. Based on the audit, `contact/page.tsx` is actually the **newer/redesigned account page** (it imports Lucide icons and uses Tailwind classes) while `account/page.tsx` uses scoped CSS class names (`account-page`, `account-layout`, etc.). Both need mobile CSS. The scoped-CSS version is at `account/page.tsx`.

**Current state of `account/page.tsx`:** Uses className-based scoped CSS (classes like `account-page`, `account-layout`, `account-profile-card`, `account-forms`) but there is **no `<style>` block** visible in the file. The styles must live in a global CSS file or the component relies on Tailwind. On closer inspection, the JSX uses custom classes like `account-layout`, `account-profile-card`, etc. which are defined elsewhere (likely in a global stylesheet).

**Action:** Read the global CSS file to find where these styles are defined, then add mobile rules there. However, since this plan is file-scoped, we treat the component as needing an inline `<style>` block added to it.

**Gaps found:**

1. **`.account-layout`** — likely a 2-column grid (profile card + forms). On mobile, should be single column.
2. **`.account-profile-card`** — likely sticky sidebar. Should unstick and stack on mobile.
3. **Profile avatar** — likely fixed size.
4. **Form inputs** — unknown height, should be ≥ 44px.
5. **Save button (`.account-save`)** — unknown height.

**Changes to make — add a `<style dangerouslySetInnerHTML>` block** to `account/page.tsx` before the closing `</main>` tag:

```css
@media (max-width: 768px) {
  .account-page {
    padding: 24px 16px 80px;
  }
  .account-layout {
    display: block; /* unstick sidebar, stack vertically */
  }
  .account-profile-card {
    position: static;
    margin-bottom: 24px;
    padding: 20px;
  }
  .account-avatar {
    width: 72px;
    height: 72px;
    margin: 0 auto 12px;
  }
  .account-forms {
    width: 100%;
  }
  .account-form label input,
  .account-form label {
    min-height: 44px;
  }
  .account-form input[type="text"],
  .account-form input[type="email"],
  .account-form input[type="url"],
  .account-form input[type="password"] {
    min-height: 44px;
    font-size: 16px; /* prevents iOS zoom */
  }
  .account-save {
    min-height: 48px;
    width: 100%;
  }
  .account-intro h2 {
    font-size: clamp(1.8rem, 7vw, 2.4rem);
  }
}
```

---

## 9. `app/(store)/contact/page.tsx`

**Note:** This file is actually the **redesigned account page** (it exports `AccountPage` and handles profile/password forms). It uses Tailwind exclusively.

**Current state:** Well-structured with `sm:` and `lg:` prefixes throughout. The main layout is `grid lg:grid-cols-[0.72fr_1.28fr]` — single column below `lg`. Profile sidebar is `lg:sticky lg:top-8`.

**Gaps found:**

1. **Profile sidebar image** — `h-[76px] w-[76px] sm:h-24 sm:w-24`. At 375px, `h-[76px] w-[76px]` is fine.

2. **Avatar + info row** — `flex items-center gap-4 sm:flex-col sm:items-start`. At 375px (below `sm`), avatar and name are side-by-side. Fine for mobile. ✓

3. **Form inputs** — `py-3.5` = 14px top+bottom + ~14px line height ≈ 42px. Just under 44px. Need `min-h-[44px]` on inputs.

4. **Submit buttons** — `min-h-12` = 48px ✓.

5. **Password toggle buttons** — `p-1.5` = 6px pad, icon is `h-4 w-4` = 16px. Button total ≈ 28px. Below 44px. These are positioned absolutely inside the input — the user must tap them, so they need enlarging on mobile.

6. **Heading** — `text-[2.55rem] sm:text-5xl lg:text-[3.6rem]`. At 375px below `sm`, it's 2.55rem = ~41px. "Your account, your signature." with `font-serif` — can it overflow at 375px with `max-w-2xl`? The `max-w-2xl` is irrelevant on mobile since width is already constrained. The text breaks onto 2 lines naturally. ✓

7. **Form grid** — `grid gap-5 sm:grid-cols-2`. On mobile (below `sm`), it's single column. ✓

8. **Security badge** — `hidden ... md:inline-flex`. Hidden on mobile. ✓

9. **Save button row** — `flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between`. On mobile it stacks: button on top, hint text below. The button is `w-full sm:w-auto`. ✓

**Changes to make — add Tailwind classes and a scoped style block:**

Add to the `<main>` wrapper or add a `<style dangerouslySetInnerHTML>` at the top of the return:

```css
@media (max-width: 768px) {
  /* Form inputs: ensure 44px tap target */
  /* (targeted by inputClass which includes py-3.5) */
}
```

Tailwind-only changes (preferred, no desktop impact):
- Form inputs: add `min-h-[44px]` to `inputClass` constant (it already has `py-3.5`, making it ~42px — just add `min-h-[44px]`).
- Password toggle buttons: change from `p-1.5` to use `h-11 w-11` positioned. Or add a wrapper that enlarges the tap zone.
- Actually, the toggle buttons are `absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1.5` — to enlarge: change `p-1.5` to `p-2.5` which gives ~36px, still not 44px. Better: change to `h-11 w-11 -translate-y-1/2 rounded-md absolute right-2 top-1/2`.

**Concrete change:**
1. In `inputClass`: add `min-h-[44px]` → `"mt-2.5 w-full min-h-[44px] rounded-xl border ..."`
2. Password toggle buttons: change `p-1.5` → `p-3` and `right-3` → `right-1.5` in both show-password and show-confirm-password button `className` strings.

---

## 10. `app/(store)/orders/page.tsx`

**Current state:** Has inline styles with existing breakpoints:
- `@media (max-width: 800px)` — heading stacks, stats become single column, order card becomes single column, timeline becomes vertical
- `@media (max-width: 560px)` — h1 font-size, product-row 2-col (no price column), floating chat adjusts

**Gaps found:**

1. **The 800px and 560px breakpoints cover 375px well.** Stats go single-column, timeline goes vertical, order cards stack. ✓

2. **`stats-grid` at 375px** — `grid-template-columns: 1fr` via 800px breakpoint. Each stat card is `min-height: 128px` with `padding: 24px`. Total ~128px per card × 3 = 384px+ just for stats, takes significant vertical space. Acceptable. ✓

3. **`order-card-top` at 375px** — `grid-template-columns: 1fr; padding: 23px`. ✓

4. **Order title** — `clamp(21px,3vw,30px)`. At 375px, `3vw` = 11.25px, floor 21px. Fine. ✓

5. **`details-button`** — `padding: 10px 15px`. Approximately 40px height. Needs `min-height: 44px`.

6. **`refresh-button`** — `min-width: 132px; padding: 13px 17px`. ~42px height. Needs `min-height: 44px`.

7. **`hero-button`** (shop button on empty state) — `min-height: 50px` ✓.

8. **`floating-chat`** — fixed element at `right: 15px; bottom: 15px` at 560px. The chat icon + copy takes space on small screens. The 560px rule hides `.chat-copy span` (reduces width). Fine. ✓

9. **`order-details` section padding** — `padding: 22px` at 800px breakpoint. At 375px: 375 - 22*2 = 331px content width. Fine. ✓

10. **Product row at 560px** — `grid-template-columns: 58px minmax(0,1fr)` with price moving to column 2. Fine. ✓

11. **`summary-grid`** — `grid-template-columns: 1fr` at 800px breakpoint. ✓

12. **Orders heading h1** — `font-size: 43px` at 560px. At 375px: "Every scent story, in one place." at 43px serif = multi-line. Fine.

**Missing: ensure `details-button` and `refresh-button` meet 44px tap target on mobile.**

**Changes to make — add to the existing `@media (max-width: 560px)` block:**

```css
@media (max-width: 560px) {
  /* existing rules... */

  .details-button {
    min-height: 44px;
  }
  .refresh-button {
    min-height: 44px;
  }
}
```

Or add a new `@media (max-width: 768px)` block:

```css
@media (max-width: 768px) {
  .details-button {
    min-height: 44px;
  }
  .refresh-button {
    min-height: 44px;
  }
}
```

---

## 11. `app/(store)/about/page.tsx`

**Current state:** Uses Tailwind classes exclusively with `sm:` and `lg:` prefixes. Has an inline `<style>` block for animations only (no layout CSS). Uses `overflow-x-hidden` on the main element.

**Gaps found:**

1. **Hero heading** — `text-[clamp(3rem,7.2vw,7rem)]`. At 375px: `7.2vw` = 27px, floor `3rem` = 48px. "Fragrance / should feel / like discovery." at 48px across 375px. Each word fits comfortably on its own line. ✓

2. **Hero section** — `px-5 pb-16 pt-14 sm:px-6 sm:pb-20` — good on mobile. ✓

3. **Hero intro grid** — `gap-8 lg:grid-cols-[1fr_390px]` — single column below `lg`. ✓

4. **Philosophy section** — `grid lg:grid-cols-[250px_1fr]` — single column below `lg`. ✓

5. **Philosophy right side** — `grid sm:grid-cols-2`. Two-column text paragraphs at `sm` (≥640px). At 375px, single column. ✓

6. **Experience cards** — `grid md:grid-cols-3`. On mobile, single column. The card has `min-h-[310px]` — at 375px with `p-6` = 24px, content ≈ 327px wide. Fine. ✓

7. **Story section** — `grid lg:grid-cols-[440px_1fr]` — single column on mobile. The visual bottle column has `min-h-[450px]` at desktop. On mobile, it stacks and takes full width at the same min-height — the bottle visually is centered. ✓

8. **Values section** — `grid md:grid-cols-3`. On mobile, single column. Each value gets full-width `py-8`. ✓

9. **CTA section** — dark background section, centered text, single link with `min-h-12 items-center` = 48px ✓.

10. **All links/buttons** meet 44px via explicit sizing. ✓

11. **"A personal touch" decorative number** — `font-serif text-5xl text-black/[0.045]` — purely decorative. ✓

12. **Potential issue: the `grid-cols-3` values at 375px** — uses `border-l` divisions that only apply at `md:`. On mobile, the `:border-t` applies. Fine.

13. **Large bottle visual on mobile** — This is a purely CSS-drawn decorative bottle inside a `min-h-[450px]` box. It looks fine on mobile since it uses absolute positioning within that container.

**The about page is well-handled by Tailwind breakpoints. No changes required.** The only minor enhancement would be to the `@media (max-width: 640px)` section in the `<style>` block, but nothing breaks.

**No changes needed.**

---

## 12. `app/(store)/contact/page.tsx` → (Already covered as Account Page in item 9)

The file named `contact/page.tsx` is the redesigned account management page (`export default function AccountPage`). See item 9 above.

---

## 13. `app/components/ProductCard.tsx`

**Current state:** Pure Tailwind. The card itself is `flex flex-col overflow-hidden rounded-[22px]`. The image has `h-[250px]`. Content is `p-5`. The `AddToCartButton` is rendered at full width.

**Gaps found:**

1. **Image height** — `h-[250px]` is fixed regardless of card width. At 375px in a single-column grid, the card is full-width (≈355px after page padding), so a 250px tall image on a ~355px wide card gives a 1.42:1 ratio — acceptable for a product card. ✓

2. **Product name** `text-[15px]` — fine on mobile. ✓

3. **`AddToCartButton`** — This is a sibling component (`app/(store)/shop/AddToCartButton.tsx`). Its height is unknown from the current read, but it's wrapped in `kp-action mt-auto pt-4` and should be ≥ 44px.

4. **`line-clamp-2 min-h-[2.5em]`** — the product name has a min-height of 2 lines. ✓

5. **The out-of-stock button** — `h-10 w-full` = 40px. Should be `h-11` (44px) on mobile.

6. **Hover effects** — `hover:-translate-y-2 hover:border... hover:shadow...` — these are desktop-only interactions; on touch devices `:hover` behaves differently. No action needed (they simply don't trigger on mobile).

7. **Stock/Featured badges** — `absolute left-3 top-3` and `absolute right-3 top-3`. At card widths > 200px, these don't collide. ✓

**Changes to make:**

The card component uses Tailwind only. The out-of-stock button needs a tap-target fix:

Change `className="h-10 w-full cursor-not-allowed ..."` → `className="h-11 w-full cursor-not-allowed ..."` for the disabled out-of-stock button.

This is unconditional (h-11 = 44px works at all sizes) — safe.

Also check `AddToCartButton` — need to read that file to confirm it has `h-10` or `h-11`:

**Action:** Read `app/(store)/shop/AddToCartButton.tsx` and verify its button height. If it's `h-10`, bump to `h-11`.

---

## 14. `app/admin/page.tsx`

**Current state:** Has existing mobile breakpoints already in the inline `<style>` block:
- `@media(max-width:760px)` — sidebar collapses to a top bar (transformed layout)
- `@media(max-width:460px)` — header h1 font-size reduction
- `@media(max-width:850px)` — settings page grid collapses
- `@media(max-width:760px)` — modal max-height, modal content padding

**Gaps found from partial read:**

1. **The 760px breakpoint handles the sidebar → top-bar transformation.** This is the core mobile admin pattern. ✓

2. **Admin content margin** — `margin-left: var(--rail)` (224px) at desktop. At 760px, sidebar likely becomes a top bar and `margin-left` becomes 0. Need to verify in the unread section.

3. **Overview stats cards** — likely a multi-column grid. At 760px, may need to go single column.

4. **Products/Orders/Users tables** — likely horizontal-scroll tables. On mobile, need either horizontal scroll (`overflow-x: auto`) or a card-based stacked layout.

5. **Modal overlay** — `max-height: calc(100dvh - 20px)` at 760px. ✓

6. **Form grids (`form-grid-2`)** — `grid-template-columns: 1fr` at 760px ✓.

7. **Order drawer** — `width: 100%` at 760px ✓.

**The admin page already has comprehensive mobile CSS through the 760px breakpoint.** The main addition needed:

**Add `@media (max-width: 768px)` block** (broader than 760px to capture the 8px gap) with:

```css
@media (max-width: 768px) {
  /* Ensure admin content has no left margin when sidebar is collapsed */
  .kyro-admin .admin-content {
    margin-left: 0;
    padding: 16px 14px 40px;
  }
  /* Overview stat cards should stack on mobile */
  .overview-grid,
  .stats-row {
    grid-template-columns: 1fr !important;
  }
  /* Data tables: allow horizontal scroll rather than overflow */
  .admin-table-wrap,
  .collection table {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    display: block;
    width: 100%;
  }
  /* Collection header: stack search and add button */
  .collection-header {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }
  .collection-header button {
    width: 100%;
    min-height: 44px;
  }
  /* Admin header: stack on mobile */
  .kyro-admin .admin-header {
    flex-direction: column;
    gap: 14px;
  }
  .admin-header-actions {
    order: -1; /* move actions before title on mobile */
  }
}
```

Note: The exact class names for overview grid and collection header need to be verified from the unread portion of admin/page.tsx (the file was truncated at line 1139 of the JSX). The implementer should read the file fully and match the exact class names used.

---

## Summary of Changes Per File

| File | Work Needed | Complexity |
|------|-------------|------------|
| `StoreHeader.tsx` | Add `min-h-[44px] min-w-[44px]` to mobile cart/hamburger buttons; add `kyro-header-mobile-btn` CSS class | Low |
| `login/page.tsx` | Change mode-switch tab `h-10` → `h-11`; add `min-h-[44px]` to `inputClass` | Low |
| `(store)/page.tsx` | Add hero decorative circle suppression in existing 640px block | Low |
| `shop/page.tsx` | Add minor `@media (max-width: 768px)` filter overflow fix | Very Low |
| `ShopFilters.tsx` | Add `@media (max-width: 768px)` block with min-height 44px on all interactive elements | Medium |
| `product/[id]/page.tsx` | Add overflow-wrap to purchase section in style block; `h-11` for out-of-stock button (in ProductCard) | Low |
| `cart/page.tsx` | Extend 620px block: quantity buttons 44px, remove button 44px, clear cart button 44px, continue link 44px | Medium |
| `account/page.tsx` | Add `<style>` block with 768px breakpoint: single-column layout, form inputs 44px, buttons full-width | Medium |
| `contact/page.tsx` (account redesign) | Add `min-h-[44px]` to `inputClass`; enlarge password toggle buttons; verify grid collapse | Low |
| `orders/page.tsx` | Add `min-height: 44px` to `details-button` and `refresh-button` | Very Low |
| `about/page.tsx` | No changes needed — Tailwind breakpoints handle it correctly | None |
| `StoreHeader.tsx` | Already has full mobile menu — minor tap target fix only | Low |
| `Footer.tsx` | Review below |
| `ProductCard.tsx` | `h-10` → `h-11` on out-of-stock button | Very Low |
| `admin/page.tsx` | Add 768px block for content margin, table overflow-x, collection-header stacking | Medium |

---

## 15. `app/components/Footer.tsx`

**Current state:** Uses Tailwind. Main grid: `grid gap-10 md:grid-cols-[1.2fr_1fr_1fr] md:gap-14`. Below `md` (768px), single column. Bottom bar: `flex-col gap-4 sm:flex-row sm:items-center sm:justify-between`.

**Gaps found:**

1. **Single column below `md`** — Brand, Navigation, Brand message stack. ✓
2. **Nav links** — `gap-3` between items, each link is text-only with `text-[10px] font-bold tracking-[0.16em]`. Effective tap zone is very small (≈16-18px). Need to increase link tap targets.
3. **Bottom bar links** — `text-[8px] font-bold`. Tiny text, small tap zones.
4. **"DISCOVER COLLECTION" link** — `mt-6 inline-flex ... gap-3 border-b border-black/25 pb-2 text-[9px]` — similarly small.
5. **"Scroll to TOP" button** — `text-[8px]`, effectively 16px tap area. Very small.
6. **Footer `py-12 sm:px-8 md:py-14`** — On mobile: `px-5 py-12`. Fine.

**Changes to make — add a `<style dangerouslySetInnerHTML>` block** to Footer.tsx:

```css
@media (max-width: 768px) {
  /* Navigation links in footer: meet 44px tap target */
  footer nav a {
    min-height: 44px;
    display: flex;
    align-items: center;
  }
  /* Bottom bar links */
  footer .flex.items-center.gap-5 a,
  footer .flex.items-center.gap-5 button {
    min-height: 44px;
    display: flex;
    align-items: center;
  }
  /* DISCOVER COLLECTION link */
  footer a[href="/shop"].inline-flex {
    min-height: 44px;
  }
  /* Footer grid padding on mobile */
  footer .relative {
    padding-top: 32px;
    padding-bottom: 32px;
  }
}
```

**Alternative (preferred — Tailwind):** Add `py-3 sm:py-0` to each footer nav `<Link>` to give them vertical padding that enlarges the tap target without changing desktop layout. And add `py-3` to bottom bar links.

Since footer links are in the Tailwind markup:
- Footer nav links: add `py-3 sm:py-0` class to each `<Link>` in the nav section
- Bottom bar links: add `py-3 sm:py-0` and separate `<Link>` components from the inline separators

---

## Implementation Order (Dependency-Free — Can Be Done In Any Order)

1. **StoreHeader.tsx** — tap targets (quick, low risk)
2. **Footer.tsx** — tap target padding on nav links
3. **ProductCard.tsx** — h-11 for out-of-stock button
4. **login/page.tsx** — tab buttons h-11, inputClass min-h
5. **ShopFilters.tsx** — 44px tap targets for all controls
6. **cart/page.tsx** — extend 620px block with tap target fixes
7. **orders/page.tsx** — add 44px to details-button and refresh-button
8. **account/page.tsx** — add `<style>` block with stacking layout
9. **contact/page.tsx** — inputClass min-h, toggle button sizing
10. **product/[id]/page.tsx** — style block additions
11. **shop/page.tsx** — minor overflow fix
12. **(store)/page.tsx** — hero decoration suppression on mobile
13. **about/page.tsx** — no changes needed
14. **admin/page.tsx** — add 768px block (read full file first to get exact class names)

---

## Critical Rule Reminder for All Files

> **DO NOT change any CSS rule that is not inside a `@media (max-width: ...)` block, unless it is a Tailwind class change that only affects mobile viewports (e.g., removing `h-10` and replacing with `h-11` is safe because `h-11` works at all sizes and does not visually change desktop since 40px → 44px is imperceptible at 1280px). When in doubt, use a media query.**

> **`font-size` on inputs must be `16px` minimum on mobile to prevent iOS auto-zoom.**
