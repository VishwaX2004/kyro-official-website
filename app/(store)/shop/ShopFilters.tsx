"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

/* =========================================================
   TYPES
========================================================= */

interface ShopFiltersProps {
  brands: string[];
  categories: string[];
  concentrations: string[];
  genders: string[];
  defaults: {
    q?: string;
    brand?: string;
    category?: string;
    gender?: string;
    concentration?: string;
    minPrice?: string;
    maxPrice?: string;
    inStock?: string;
    sort?: string;
  };
}

/* =========================================================
   HELPERS
========================================================= */

/** Build a new URLSearchParams, set/delete a key, push to router */
function useFilterUpdater() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const update = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === "" || value === "0" || value === "10000") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });

      const qs = params.toString();
      startTransition(() => {
        router.push(qs ? `${pathname}?${qs}` : pathname);
      });
    },
    [router, pathname, searchParams, startTransition]
  );

  const reset = useCallback(() => {
    startTransition(() => {
      router.push(pathname);
    });
  }, [router, pathname, startTransition]);

  return { update, reset, isPending };
}

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function ShopFilters({
  brands,
  categories,
  concentrations,
  genders,
  defaults,
}: ShopFiltersProps) {
  const { update, reset, isPending } = useFilterUpdater();

  /* -- Derived active values from URL (always in sync) -- */
  const q = defaults.q ?? "";
  const activeBrands = defaults.brand ? defaults.brand.split(",").filter(Boolean) : [];
  const activeCategory = defaults.category ?? "";
  const activeGender = defaults.gender ?? "";
  const activeConcentrations = defaults.concentration
    ? defaults.concentration.split(",").filter(Boolean)
    : [];
  const minPrice = defaults.minPrice ?? "";
  const maxPrice = defaults.maxPrice ?? "";
  const inStock = defaults.inStock === "true";
  const sort = defaults.sort ?? "newest";

  const activeCount = [
    q,
    activeBrands.length > 0 ? "1" : "",
    activeCategory,
    activeGender,
    activeConcentrations.length > 0 ? "1" : "",
    minPrice,
    maxPrice,
    inStock ? "1" : "",
  ].filter(Boolean).length;

  /* ── Controlled search input with debounce ── */
  const [searchValue, setSearchValue] = useState(q);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* Keep local input in sync when URL changes externally (e.g. chip removal) */
  useEffect(() => {
    setSearchValue(q);
  }, [q]);

  function handleSearchChange(value: string) {
    setSearchValue(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      update({ q: value.trim() || null });
    }, 350);
  }

  function handleSearchClear() {
    setSearchValue("");
    if (debounceRef.current) clearTimeout(debounceRef.current);
    update({ q: null });
  }

  /* Cleanup debounce on unmount */
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  function handleSort(value: string) {
    update({ sort: value === "newest" ? null : value });
  }

  function toggleBrand(brand: string, checked: boolean) {
    const next = checked
      ? [...activeBrands, brand]
      : activeBrands.filter((b) => b !== brand);
    update({ brand: next.length > 0 ? next.join(",") : null });
  }

  function toggleCategory(cat: string, checked: boolean) {
    update({ category: checked ? cat : null });
  }

  function toggleGender(gender: string, checked: boolean) {
    update({ gender: checked ? gender : null });
  }

  function toggleConcentration(conc: string, checked: boolean) {
    const next = checked
      ? [...activeConcentrations, conc]
      : activeConcentrations.filter((c) => c !== conc);
    update({ concentration: next.length > 0 ? next.join(",") : null });
  }

  function handleMinPrice(value: string) {
    update({ minPrice: value && value !== "0" ? value : null });
  }

  function handleMaxPrice(value: string) {
    update({ maxPrice: value && value !== "10000" ? value : null });
  }

  function handleInStock(checked: boolean) {
    update({ inStock: checked ? "true" : null });
  }

  function removeChip(key: string, value?: string) {
    if (key === "brand" && value) {
      const next = activeBrands.filter((b) => b !== value);
      update({ brand: next.length > 0 ? next.join(",") : null });
    } else if (key === "concentration" && value) {
      const next = activeConcentrations.filter((c) => c !== value);
      update({ concentration: next.length > 0 ? next.join(",") : null });
    } else {
      update({ [key]: null });
    }
  }

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        /* ── Filter wrapper ── */
        .sf-wrap { display: flex; flex-direction: column; gap: 0; }

        /* ── Search bar ── */
        .sf-search {
          display: flex;
          align-items: center;
          gap: 7px;
          background: #fff;
          border: 1px solid rgba(23,23,23,.09);
          border-radius: 10px;
          padding: 8px 10px;
          margin-bottom: 10px;
          transition: border-color .2s, box-shadow .2s;
        }
        .sf-search:focus-within {
          border-color: #aa8953;
          box-shadow: 0 0 0 3px rgba(170,137,83,.10);
        }
        .sf-search svg { flex-shrink:0; color: #aa8953; }
        .sf-search input {
          flex: 1;
          border: none;
          outline: none !important;
          box-shadow: none !important;
          background: transparent;
          font-size: 12px;
          color: #171717;
        }
        .sf-search input:focus,
        .sf-search input:focus-visible {
          outline: none !important;
          box-shadow: none !important;
          border: none !important;
        }
        .sf-search input::placeholder { color: rgba(0,0,0,.38); }
        .sf-search button {
          border: none;
          background: none;
          cursor: pointer;
          color: rgba(0,0,0,.35);
          font-size: 15px;
          padding: 0 2px;
          line-height: 1;
          transition: color .15s;
        }
        .sf-search button:hover { color: rgba(0,0,0,.75); }

        /* ── Section ── */
        .sf-section {
          border-top: 1px solid rgba(23,23,23,.07);
          padding: 10px 0;
        }
        .sf-section-label {
          font-size: 8px;
          font-weight: 700;
          letter-spacing: .18em;
          text-transform: uppercase;
          color: #806537;
          margin: 0 0 8px;
        }

        /* ── Select ── */
        .sf-select {
          width: 100%;
          border: 1px solid rgba(23,23,23,.09);
          background: #fff;
          padding: 7px 10px;
          border-radius: 8px;
          font-size: 11px;
          color: #171717;
          outline: none;
          cursor: pointer;
          transition: border-color .2s;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23806537' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 10px center;
          padding-right: 28px;
        }
        .sf-select:focus { border-color: #aa8953; }

        /* ── Checkbox item ── */
        .sf-check {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 4px 0;
          cursor: pointer;
          user-select: none;
        }
        .sf-check input[type="checkbox"] {
          width: 14px;
          height: 14px;
          accent-color: #aa8953;
          cursor: pointer;
          flex-shrink: 0;
        }
        .sf-check span {
          font-size: 11px;
          font-weight: 500;
          color: rgba(0,0,0,.72);
          transition: color .15s;
        }
        .sf-check:hover span { color: #171717; }

        /* ── Price inputs ── */
        .sf-price-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 6px;
          margin-bottom: 8px;
        }
        .sf-price-row input {
          border: 1px solid rgba(23,23,23,.09);
          background: #fff;
          padding: 6px 8px;
          border-radius: 7px;
          font-size: 11px;
          color: #171717;
          outline: none;
          width: 100%;
          transition: border-color .2s;
        }
        .sf-price-row input:focus { border-color: #aa8953; }
        .sf-range {
          width: 100%;
          accent-color: #aa8953;
          cursor: pointer;
        }
        .sf-price-hint {
          font-size: 9px;
          color: rgba(0,0,0,.40);
          margin-top: 5px;
          font-weight: 500;
        }

        /* ── Active chips ── */
        .sf-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 5px;
          padding-bottom: 10px;
        }
        .sf-chip {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          background: rgba(170,137,83,.10);
          border: 1px solid rgba(170,137,83,.28);
          border-radius: 999px;
          padding: 3px 9px 3px 10px;
          font-size: 10px;
          font-weight: 600;
          color: #5e3e18;
        }
        .sf-chip button {
          border: none;
          background: none;
          cursor: pointer;
          color: rgba(0,0,0,.45);
          font-size: 12px;
          padding: 0;
          line-height: 1;
          transition: color .15s;
        }
        .sf-chip button:hover { color: #171717; }

        /* ── Reset button ── */
        .sf-reset {
          width: 100%;
          margin-top: 4px;
          padding: 9px;
          border: 1px solid rgba(23,23,23,.10);
          border-radius: 10px;
          background: transparent;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: .12em;
          text-transform: uppercase;
          color: rgba(0,0,0,.55);
          cursor: pointer;
          transition: background .2s, color .2s, border-color .2s;
        }
        .sf-reset:hover {
          background: rgba(0,0,0,.04);
          color: #171717;
          border-color: rgba(0,0,0,.2);
        }

        /* Pending dimming */
        .sf-pending { opacity: .65; pointer-events: none; transition: opacity .2s; }
      `}} />

      <div className={`sf-wrap${isPending ? " sf-pending" : ""}`}>

        {/* ── Search ── */}
        <div className="sf-search">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" />
          </svg>
          <input
            type="search"
            value={searchValue}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search scents, notes…"
            aria-label="Search products"
          />
          {searchValue && (
            <button
              type="button"
              onClick={handleSearchClear}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>

        {/* ── Active chips ── */}
        {activeCount > 0 && (
          <div className="sf-chips">
            {q && (
              <span className="sf-chip">
                &ldquo;{q}&rdquo;
                <button type="button" onClick={() => removeChip("q")} aria-label="Remove search filter">×</button>
              </span>
            )}
            {activeBrands.map((b) => (
              <span key={b} className="sf-chip">
                {b}
                <button type="button" onClick={() => removeChip("brand", b)} aria-label={`Remove ${b}`}>×</button>
              </span>
            ))}
            {activeCategory && (
              <span className="sf-chip">
                {activeCategory}
                <button type="button" onClick={() => removeChip("category")} aria-label="Remove category">×</button>
              </span>
            )}
            {activeGender && (
              <span className="sf-chip">
                {activeGender}
                <button type="button" onClick={() => removeChip("gender")} aria-label="Remove gender">×</button>
              </span>
            )}
            {activeConcentrations.map((c) => (
              <span key={c} className="sf-chip">
                {c}
                <button type="button" onClick={() => removeChip("concentration", c)} aria-label={`Remove ${c}`}>×</button>
              </span>
            ))}
            {inStock && (
              <span className="sf-chip">
                In Stock
                <button type="button" onClick={() => handleInStock(false)} aria-label="Remove in-stock filter">×</button>
              </span>
            )}
          </div>
        )}

        {/* ── Sort ── */}
        <div className="sf-section">
          <p className="sf-section-label">Sort by</p>
          <select
            className="sf-select"
            value={sort}
            onChange={(e) => handleSort(e.target.value)}
            aria-label="Sort products"
          >
            <option value="newest">Newest First</option>
            <option value="price-asc">Price: Low → High</option>
            <option value="price-desc">Price: High → Low</option>
            <option value="name-asc">Name: A → Z</option>
          </select>
        </div>

        {/* ── Brand ── */}
        {brands.length > 0 && (
          <div className="sf-section">
            <p className="sf-section-label">Brand</p>
            {brands.map((brand) => (
              <label key={brand} className="sf-check">
                <input
                  type="checkbox"
                  checked={activeBrands.includes(brand)}
                  onChange={(e) => toggleBrand(brand, e.target.checked)}
                />
                <span>{brand}</span>
              </label>
            ))}
          </div>
        )}

        {/* ── Category ── */}
        {categories.length > 0 && (
          <div className="sf-section">
            <p className="sf-section-label">Category</p>
            {categories.map((cat) => (
              <label key={cat} className="sf-check">
                <input
                  type="checkbox"
                  checked={activeCategory === cat}
                  onChange={(e) => toggleCategory(cat, e.target.checked)}
                />
                <span>{cat}</span>
              </label>
            ))}
          </div>
        )}

        {/* ── Gender ── */}
        {genders.length > 0 && (
          <div className="sf-section">
            <p className="sf-section-label">Gender</p>
            {genders.map((gender) => (
              <label key={gender} className="sf-check">
                <input
                  type="checkbox"
                  checked={activeGender === gender}
                  onChange={(e) => toggleGender(gender, e.target.checked)}
                />
                <span>{gender}</span>
              </label>
            ))}
          </div>
        )}

        {/* ── Concentration ── */}
        {concentrations.length > 0 && (
          <div className="sf-section">
            <p className="sf-section-label">Type</p>
            {concentrations.map((conc) => (
              <label key={conc} className="sf-check">
                <input
                  type="checkbox"
                  checked={activeConcentrations.includes(conc)}
                  onChange={(e) => toggleConcentration(conc, e.target.checked)}
                />
                <span>{conc}</span>
              </label>
            ))}
          </div>
        )}

        {/* ── Price ── */}
        <div className="sf-section">
          <p className="sf-section-label">Price (Rs.)</p>
          <div className="sf-price-row">
            <input
              type="number"
              min="0"
              placeholder="Min"
              defaultValue={minPrice}
              key={`min-${minPrice}`}
              onBlur={(e) => handleMinPrice(e.target.value)}
              aria-label="Minimum price"
            />
            <input
              type="number"
              min="0"
              placeholder="Max"
              defaultValue={maxPrice}
              key={`max-${maxPrice}`}
              onBlur={(e) => handleMaxPrice(e.target.value)}
              aria-label="Maximum price"
            />
          </div>
          <input
            type="range"
            min="0"
            max="20000"
            step="500"
            className="sf-range"
            defaultValue={maxPrice || "20000"}
            key={`range-${maxPrice}`}
            onMouseUp={(e) => handleMaxPrice((e.target as HTMLInputElement).value)}
            onTouchEnd={(e) => handleMaxPrice((e.target as HTMLInputElement).value)}
            aria-label="Max price slider"
          />
          <p className="sf-price-hint">
            Rs. {(parseInt(minPrice) || 0).toLocaleString()} –
            Rs. {(parseInt(maxPrice) || 20000).toLocaleString()}
          </p>
        </div>

        {/* ── In Stock ── */}
        <div className="sf-section">
          <label className="sf-check">
            <input
              type="checkbox"
              checked={inStock}
              onChange={(e) => handleInStock(e.target.checked)}
            />
            <span>In Stock Only</span>
          </label>
        </div>

        {/* ── Reset ── */}
        {activeCount > 0 && (
          <button type="button" className="sf-reset" onClick={reset}>
            Clear all filters ({activeCount})
          </button>
        )}

      </div>
    </>
  );
}
