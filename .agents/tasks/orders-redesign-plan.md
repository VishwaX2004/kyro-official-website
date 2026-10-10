# Orders Page Product Cards Redesign — Implementation Plan

## Current State Analysis

The current `.product-row` layout in the orders detail section uses:
- **Grid**: `68px` image + content + right-aligned price (3 columns)
- **Image**: `68px × 68px`, cramped, minimal visual impact
- **Product name**: `17px` font, `nowrap` + `ellipsis`, truncated text
- **Metadata**: Single line, `10px` font, poorly visible
- **Price display**: Separate column, weak visual hierarchy
- **Mobile at 560px**: Drops price column entirely to `grid-column 2`, still horizontal
- **No hover effects** or card elevation
- **Minimal spacing**: `12px` padding, `10px` gap

**Problem**: Product cards feel secondary and cramped. Mobile layout breaks down. No visual emphasis on items.

---

## Design Goals

1. **Larger, prominent cards**: Desktop image `120px × 120px`, mobile `full-width` with `160px` height
2. **Card wrapper**: New `.product-card` with rounded corners (20px), border, gradient bg
3. **Mobile stacking**: Image on top (100%), details below (single column)
4. **Desktop layout**: Image left (120px), details right (2-column grid)
5. **No text truncation**: Full product name visible, proper line-height
6. **Visual hierarchy**: Name prominent (18px serif), size/qty/price line clear (13px), line total bold gold
7. **Consistent Kyro aesthetic**: Gold accents, cream backgrounds, glassmorphic cards, smooth transitions
8. **Hover effects**: Subtle lift, shadow expansion (matching checkout/account pages)

---

## Implementation Steps

### 1. Update CSS — `.product-row` → `.product-card` wrapper structure

**What**: Replace `.product-row` grid structure with a new `.product-card` wrapper that uses flexbox for desktop and grid for mobile.

**Files to modify**:
- `d:\Kyro-Web\app\(store)\orders\page.tsx` (CSS section inside `<style>`)

**Changes**:

- **Remove old `.product-row` styles**:
  - Delete: `display: grid; grid-template-columns: 68px minmax(0, 1fr) auto;`
  - Delete: `align-items: center; gap: 16px; padding: 12px;`
  - Delete: `border: 1px solid rgba(23, 23, 23, 0.07); border-radius: 18px;`

- **Add new `.product-card` styles**:
  ```css
  .product-card {
    display: flex;
    gap: 20px;
    align-items: flex-start;
    padding: 20px;
    border: 1px solid rgba(23, 23, 23, 0.08);
    border-radius: 20px;
    background: linear-gradient(
      145deg,
      rgba(255, 254, 250, 0.95),
      rgba(246, 242, 233, 0.85)
    );
    box-shadow: 0 10px 25px rgba(23, 23, 23, 0.06);
    transition: all 0.3s ease;
  }

  .product-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 15px 40px rgba(23, 23, 23, 0.12);
    border-color: rgba(170, 137, 83, 0.25);
  }
  ```

- **Update `.product-image-wrap` for desktop**:
  ```css
  .product-image-wrap {
    width: 120px;
    height: 120px;
    flex-shrink: 0;
    border-radius: 16px;
    overflow: hidden;
    background: var(--kyro-paper);
  }
  ```

### 2. Restructure product info layout

**What**: Change `.product-info` from a min-width container to a flex/grid container holding product name and new `.product-detail-line`.

**Changes**:

- **Update `.product-info`**:
  ```css
  .product-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  ```

- **Update `.product-info h4` (product name)**:
  ```css
  .product-info h4 {
    margin: 0;
    font-family: Georgia, "Times New Roman", serif;
    font-size: 18px;
    font-weight: 500;
    color: var(--kyro-ink);
    line-height: 1.3;
    word-wrap: break-word;
    white-space: normal;
    overflow: visible;
    text-overflow: clip;
  }
  ```

- **Create new `.product-detail-line` (replaces product-meta)**:
  ```css
  .product-detail-line {
    display: flex;
    align-items: baseline;
    flex-wrap: wrap;
    gap: 6px;
    font-size: 13px;
    color: var(--kyro-muted);
    line-height: 1.4;
  }

  .product-detail-line span {
    white-space: nowrap;
  }

  .product-detail-divider {
    color: var(--kyro-soft);
    font-weight: 300;
  }
  ```

### 3. Update price display — new `.product-line-total`

**What**: Create a new `.product-line-total` class that displays the line total (qty × price = total) in gold, bold, 16px font.

**Changes**:

- **Remove old `.product-price`**:
  - Delete: `text-align: right;` and nested styles

- **Add new `.product-line-total`**:
  ```css
  .product-line-total {
    margin-top: 4px;
    font-size: 16px;
    font-weight: 700;
    color: var(--kyro-gold);
    font-family: Georgia, "Times New Roman", serif;
  }
  ```

### 4. Add mobile responsive styles

**What**: Add media query for `max-width: 768px` to stack product card vertically: image full-width on top (160px height), details below.

**Changes**:

- **Add media query block**:
  ```css
  @media (max-width: 768px) {
    .product-card {
      flex-direction: column;
      padding: 16px;
      gap: 16px;
    }

    .product-image-wrap {
      width: 100%;
      height: 160px;
    }

    .product-info {
      gap: 8px;
    }

    .product-info h4 {
      font-size: 16px;
    }

    .product-detail-line {
      font-size: 12px;
    }

    .product-line-total {
      font-size: 14px;
    }
  }
  ```

### 5. Update JSX structure for product items

**What**: Restructure the JSX inside the `.product-list` map function to use new class names and layout structure.

**Files to modify**:
- `d:\Kyro-Web\app\(store)\orders\page.tsx` (JSX in order items render)

**Changes**:

Current JSX (to replace):
```jsx
<div className="product-row">
  <div className="product-image-wrap">
    <ProductImage src={item.imageUrl} name={item.name} />
  </div>

  <div className="product-info">
    <h4>{item.name}</h4>
    <div className="product-meta">
      <span>Qty {item.quantity}</span>
      {item.size && (
        <>
          <span className="meta-divider">•</span>
          <span>{item.size}</span>
        </>
      )}
      {item.price !== undefined && (
        <>
          <span className="meta-divider">•</span>
          <span>{formatPrice(item.price)} each</span>
        </>
      )}
    </div>
  </div>

  <div className="product-price">
    <strong>
      {item.price !== undefined
        ? formatPrice(lineTotal)
        : "—"}
    </strong>
    <span>{item.quantity} × item</span>
  </div>
</div>
```

New JSX:
```jsx
<div className="product-card">
  <div className="product-image-wrap">
    <ProductImage src={item.imageUrl} name={item.name} />
  </div>

  <div className="product-info">
    <h4>{item.name}</h4>
    <div className="product-detail-line">
      {item.size && <span>Size {item.size}</span>}
      {item.size && item.quantity && (
        <span className="product-detail-divider">•</span>
      )}
      {item.quantity && <span>Qty {item.quantity}</span>}
      {(item.size || item.quantity) && item.price !== undefined && (
        <span className="product-detail-divider">×</span>
      )}
      {item.price !== undefined && (
        <span>{formatPrice(item.price)}</span>
      )}
      {item.price !== undefined && item.quantity && (
        <>
          <span className="product-detail-divider">=</span>
          <span className="product-line-total">
            {formatPrice(lineTotal)}
          </span>
        </>
      )}
    </div>
  </div>
</div>
```

**Result layout**: `Size 50ml • Qty 2 × Rs. 3,200 = Rs. 6,400` (all on one line or wrapped naturally, no truncation)

### 6. Clean up old CSS classes

**What**: Remove or deprecate unused CSS classes that are no longer needed.

**Classes to remove**:
- `.product-row` (replaced by `.product-card`)
- `.product-meta` (replaced by `.product-detail-line`)
- `.meta-divider` (replaced by `.product-detail-divider`)
- `.product-price` (replaced by `.product-line-total`)

---

## Verification Steps

1. **Build the project**:
   ```bash
   npm run build
   ```
   Expected: No TypeScript or build errors.

2. **Run dev server and navigate to orders page**:
   ```bash
   npm run dev
   ```
   - Open `http://localhost:3000/orders`
   - Expand any order to view product cards

3. **Visual verification — Desktop (1200px+)**:
   - Each product card should display as a flex row: image (120×120) on left, product info on right
   - Product name should be fully visible (18px serif, no truncation)
   - Detail line: `Size X ml • Qty Y × Rs. ZZZZ = Rs. TOTAL` all on one line or wrapped naturally
   - Line total in gold (16px, bold)
   - Hover effect: card lifts slightly, shadow expands
   - Card has 20px border-radius, gradient background, subtle border

4. **Visual verification — Mobile (< 768px)**:
   - Product image stacks on top (100% width, 160px height)
   - Product info and details below
   - All text remains visible and readable (16px name, 12px details, 14px total)
   - Card padding 16px
   - No horizontal scrolling or truncation

5. **Cross-browser testing**:
   - Chrome/Edge: Verify flexbox layout, gradient background, box-shadow, transitions
   - Firefox: Same
   - Mobile Safari: Verify image aspect ratio, detail line wrapping

6. **Performance check**:
   - Inspect CSS file size (should be similar or slightly larger due to new card styles)
   - No layout shifts or jank on hover

7. **Unit/integration tests** (if applicable):
   - No tests currently in the codebase for this component, so skip.

---

## Dependencies & Compatibility

- **CSS**: Uses standard flexbox, gradients, and transitions (all well-supported)
- **TypeScript**: No new TS types needed
- **React**: No new hooks; uses existing component structure
- **Browser support**: All modern browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)

---

## Notes

- The new `.product-card` design matches the Kyro aesthetic used in `checkout/page.tsx` and `account/page.tsx` (gold accents, serif fonts, gradient backgrounds, glassmorphic cards)
- No breaking changes to data structure or API contracts
- The redesign is purely visual and layout-focused
- Mobile breakpoint at 768px aligns with existing Kyro media queries
- All changes are CSS-first; minimal JSX restructuring required (just swapping class names and div nesting)
