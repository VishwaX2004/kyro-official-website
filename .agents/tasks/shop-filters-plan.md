# Shop Page Filters & Search Implementation Plan

## Project Context
- **Framework**: Next.js 16.3.8 with React 19.2.8 (App Router)
- **Database**: MongoDB with `clientPromise` for server-side queries
- **Build/Test**: `npm run build` and `npm run dev`
- **Current Issue**: Existing shop page only supports basic search by `q` param
- **Requirement**: Add comprehensive filter sidebar (desktop/mobile responsive) with URL-driven state management

---

## Implementation Plan

### 1. Create ShopFilters.tsx Client Component
**What**: Create a new client component that renders a fully functional filter sidebar with search, multi-select filters, and mobile toggle.

**Key Features**:
- Search bar input tied to `q` URL parameter
- Brand multi-select checkboxes (from unique brands list)
- Category pills (Men/Women/Unisex/All) 
- Gender pills (if available in data)
- Concentration checkboxes (from unique concentrations list)
- Price range with min/max number inputs
- In Stock toggle checkbox
- Active filter chips with individual X-buttons to clear
- Apply and Reset buttons (clear all filters)
- Desktop: sidebar always visible; Mobile: collapsible with toggle button
- Uses `useRouter()` and `useSearchParams()` from `next/navigation` to update URL params on filter apply
- Passes selected values to parent via URL params in format:
  - `q`: search string
  - `brand`: comma-separated brands (e.g., `Dior,Creed`)
  - `category`: single category or empty for all
  - `gender`: single gender or empty for all  
  - `concentration`: comma-separated concentrations (e.g., `EDP,EDT`)
  - `minPrice`: minimum price number
  - `maxPrice`: maximum price number
  - `inStock`: `true` to show only in-stock items
  - `sort`: sort order (`newest` default, `price-asc`, `price-desc`, `name-asc`)

**Files**: 
- Create `d:\Devlopment\Kyro-Web\app\(store)\shop\ShopFilters.tsx`

**Verify**: 
- Component renders without error in dev mode
- No build errors with `npm run build`

---

### 2. Update shop/page.tsx Server Component to Support All Filters
**What**: Modify the server component to accept and apply all new filter URL parameters.

**Key Changes**:
- Extend `searchParams` type to include: `brand`, `category`, `gender`, `concentration`, `minPrice`, `maxPrice`, `inStock`, `sort`
- Read and parse all new params from `searchParams` prop
- Filter `serializedProducts` array server-side using:
  - **Search (q)**: Text search across name, brand, notes, description, category, concentration, size (existing logic, keep unchanged)
  - **Brand**: Filter where `product.brand` matches any in comma-separated `brand` param
  - **Category**: Filter where `product.category` equals the `category` param (or skip if empty/"All")
  - **Gender**: Filter where `product.category` equals the `gender` param (or skip if empty)
  - **Concentration**: Filter where `product.concentration` matches any in comma-separated `concentration` param
  - **Price Range**: Filter where `product.price >= minPrice AND product.price <= maxPrice`
  - **In Stock**: Filter where `product.stock > 0` if `inStock=true`
  - **Sort**: Apply sorting after all filters:
    - `newest`: Keep current default (by `-createdAt` or insertion order)
    - `price-asc`: Sort by `product.price` ascending
    - `price-desc`: Sort by `product.price` descending
    - `name-asc`: Sort by `product.name` ascending

- Extract unique values for filter options:
  - **Brands**: `Array.from(new Set(serializedProducts.map(p => p.brand).filter(Boolean)))`
  - **Categories**: `Array.from(new Set(serializedProducts.map(p => p.category).filter(Boolean)))`
  - **Concentrations**: `Array.from(new Set(serializedProducts.map(p => p.concentration).filter(Boolean)))`
  - **Genders**: (same as categories if same field, or extract from a dedicated field if available)
  
- Pass to ShopFilters as props:
  - `availableBrands`: string[]
  - `availableCategories`: string[]
  - `availableConcentrations`: string[]
  - `availableGenders`: string[] (if available)
  - `defaultSearch`: current `q` value
  - `defaultBrand`: current `brand` value
  - `defaultCategory`: current `category` value
  - `defaultGender`: current `gender` value
  - `defaultConcentration`: current `concentration` value
  - `defaultMinPrice`: current `minPrice` value
  - `defaultMaxPrice`: current `maxPrice` value
  - `defaultInStock`: current `inStock` value
  - `defaultSort`: current `sort` value

- **IMPORTANT**: Keep all existing CSS (inline style tag), product card markup, product grid layout, empty state, hero section, bottom statement **EXACTLY as-is**. Only remove the existing `<form>` search toolbar and replace with `<ShopFilters />` component.

- Keep the category pills display or integrate into ShopFilters — per requirements, keep it if it doesn't conflict. The spec says "Replace with <ShopFilters>" so category display moves into the filter sidebar.

**Files**: 
- Modify `d:\Devlopment\Kyro-Web\app\(store)\shop\page.tsx`

**Verify**: 
- `npm run build` succeeds (no errors)
- Page renders without errors in `npm run dev`
- Sample filter URLs work and return filtered results (test with manual URL edits in browser)

---

### 3. Style ShopFilters Component to Match Shop Design
**What**: Write inline CSS (or Tailwind if preferred) for ShopFilters to match the existing Kyro shop aesthetic.

**Design Requirements**:
- Use the existing design system from shop/page.tsx:
  - Color variables: `--kyro-bg`, `--kyro-surface`, `--kyro-ink`, `--kyro-gold`, etc.
  - Font sizes, transitions, and spacing consistent with existing cards
  - Responsive: Desktop sidebar (always visible), Tablet/Mobile (toggle-able)
  
- Layout:
  - Desktop: Sidebar on left (or above grid), filter panel visible by default
  - Tablet/Mobile: Collapsible toggle button (hamburger or "Filters" button)
  - Search bar at top
  - Checkboxes/pills for each filter type
  - Active filter chips with close buttons
  - Apply + Reset buttons at bottom

- Keep animations and transitions light and smooth (matching existing shop page animations)

**Files**: 
- Styles inline in `ShopFilters.tsx` component (in a `<style>` tag or via CSS module)

**Verify**: 
- Visual design matches Kyro brand guidelines (gold accents, sans-serif font, soft gradients)
- Responsive behavior works on mobile and desktop
- No layout shift or CLS (Cumulative Layout Shift) issues

---

### 4. Test Filter and Search Flow
**What**: Verify all filters and search work end-to-end.

**Test Cases**:
- Search by product name: `/shop?q=rose` → shows only rose fragrances
- Search by brand: `/shop?q=dior` → shows only Dior fragrances
- Filter by brand: `/shop?brand=Dior` → shows only Dior
- Filter by multiple brands: `/shop?brand=Dior,Creed` → shows Dior and Creed
- Filter by category: `/shop?category=Women` → shows only Women's fragrances
- Filter by concentration: `/shop?concentration=EDP,EDT` → shows EDP and EDT fragrances
- Price range: `/shop?minPrice=100&maxPrice=500` → shows fragrances in that range
- In stock only: `/shop?inStock=true` → shows only items with stock > 0
- Sort by price ascending: `/shop?sort=price-asc`
- Sort by price descending: `/shop?sort=price-desc`
- Sort by name ascending: `/shop?sort=name-asc`
- Combined filters: `/shop?q=rose&brand=Dior&minPrice=100&sort=price-asc`
- UI reflects current filter state on page load
- Apply button updates URL and results
- Reset button clears all filters and returns to `/shop`
- Clear individual filter chip removes that filter from URL

**Files**: 
- No new files; test via `npm run dev` and manual browser testing

**Verify**: 
- All test cases pass
- No console errors
- URL params persist on page refresh
- Page title and meta stay consistent

---

## Notes on Implementation Decisions

1. **Server-side vs Client-side Filtering**: Filtering is done server-side (in the Next.js async server component) for SEO, performance, and URL-driven state. The client-side ShopFilters component only manages UI and URL updates via router.

2. **URL Params Format**: 
   - Multi-select values (brand, concentration) are comma-separated to keep URLs readable and shareable
   - Boolean values (inStock) use `true`/`false` string representation
   - Sort uses short codes (`price-asc`, etc.) for readability

3. **Backwards Compatibility**: Existing search functionality via `?q=` param is preserved; new filters are additive.

4. **Accessibility**: 
   - All checkboxes and inputs labeled with `<label>` or `aria-label`
   - Mobile toggle button has appropriate ARIA attributes
   - Keyboard navigation supported for all interactive elements
   - Focus states visible on all buttons and inputs

5. **Mobile Experience**: 
   - Filter sidebar collapses on mobile with a toggle button
   - Touch-friendly checkbox and button sizes
   - Separate sort dropdown or button (if space-constrained on mobile)

---

## File Summary

| File | Type | Status |
|------|------|--------|
| `app/(store)/shop/ShopFilters.tsx` | New Client Component | To Create |
| `app/(store)/shop/page.tsx` | Existing Server Component | To Modify |
| `app/globals.css` | Styles | No changes needed (inline styles in ShopFilters) |

---
