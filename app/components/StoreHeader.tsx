"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { cartCount, readCart } from "@/lib/cart";
import toast from "react-hot-toast";

/* =========================================================
   TYPES
========================================================= */

type User = {
  name: string;
  username: string;
  email: string;
  role: string;
  imageUrl?: string;
};

type SearchProduct = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  imageUrl: string;
  concentration: string;
};

/* =========================================================
   PRICE FORMAT
========================================================= */

function formatPrice(price: number) {
  return new Intl.NumberFormat("en-LK", {
    maximumFractionDigits: 0,
  }).format(price);
}

/* =========================================================
   SEARCH SUGGESTIONS DROPDOWN
========================================================= */

type SuggestionsProps = {
  results: SearchProduct[];
  loading: boolean;
  query: string;
  onSelect: () => void;
};

function SearchSuggestions({
  results,
  loading,
  query,
  onSelect,
}: SuggestionsProps) {
  const router = useRouter();

  function navigate(href: string) {
    router.push(href);
    onSelect();
  }

  return (
    <div className="search-suggestions-dropdown">
      {loading ? (
        /* ── Loading skeleton ── */
        <div className="suggestions-loading">
          {[0, 1, 2].map((i) => (
            <div key={i} className="suggestion-skeleton">
              <div className="skeleton-img" />
              <div className="skeleton-text">
                <div className="skeleton-line skeleton-line-long" />
                <div className="skeleton-line skeleton-line-short" />
              </div>
            </div>
          ))}
        </div>
      ) : results.length === 0 ? (
        /* ── Empty state ── */
        <div className="suggestions-empty">
          <span className="suggestions-empty-icon">◇</span>
          <p className="suggestions-empty-title">No fragrances found</p>
          <p className="suggestions-empty-sub">
            Try a different name or brand
          </p>
        </div>
      ) : (
        /* ── Results ── */
        <>
          <ul className="suggestions-list">
            {results.slice(0, 6).map((product) => (
              <li key={product.id}>
                <button
                  type="button"
                  className="suggestion-item"
                  onClick={() =>
                    navigate(`/shop?q=${encodeURIComponent(product.name)}`)
                  }
                >
                  {/* Image */}
                  <div className="suggestion-img-wrap">
                    {product.imageUrl ? (
                      <Image
                        src={product.imageUrl}
                        alt={product.name}
                        width={44}
                        height={44}
                        className="suggestion-img"
                      />
                    ) : (
                      <div className="suggestion-img-placeholder">◇</div>
                    )}
                  </div>

                  {/* Text */}
                  <div className="suggestion-text">
                    <span className="suggestion-name">{product.name}</span>
                    <span className="suggestion-meta">
                      {product.brand}
                      {product.concentration
                        ? ` · ${product.concentration}`
                        : ""}
                    </span>
                  </div>

                  {/* Price + arrow */}
                  <div className="suggestion-right">
                    <span className="suggestion-price">
                      Rs. {formatPrice(product.price)}
                    </span>
                    <span className="suggestion-arrow">→</span>
                  </div>
                </button>
              </li>
            ))}
          </ul>

          {/* View all */}
          <button
            type="button"
            className="suggestions-view-all"
            onClick={() =>
              navigate(`/shop?q=${encodeURIComponent(query)}`)
            }
          >
            <span>VIEW ALL RESULTS</span>
            <span className="suggestions-view-all-arrow">→</span>
          </button>
        </>
      )}

      {/* Scoped styles */}
      <style dangerouslySetInnerHTML={{__html: `
        .search-suggestions-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          left: 0;
          right: 0;
          z-index: 200;
          background: #fffefa;
          border: 1px solid rgba(23,23,23,0.10);
          border-radius: 18px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.06);
          overflow: hidden;
          animation: suggestIn 0.18s cubic-bezier(0.2,0.8,0.2,1) both;
        }

        @keyframes suggestIn {
          from { opacity: 0; transform: translateY(-6px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0)   scale(1);    }
        }

        /* Loading skeleton */
        .suggestions-loading {
          padding: 8px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .suggestion-skeleton {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px;
          border-radius: 12px;
        }
        .skeleton-img {
          width: 44px;
          height: 44px;
          border-radius: 10px;
          background: linear-gradient(90deg, #f0ebe3 25%, #e8e1d6 50%, #f0ebe3 75%);
          background-size: 200% 100%;
          animation: shimmer 1.2s infinite;
          flex-shrink: 0;
        }
        .skeleton-text { flex: 1; display: flex; flex-direction: column; gap: 6px; }
        .skeleton-line {
          height: 10px;
          border-radius: 6px;
          background: linear-gradient(90deg, #f0ebe3 25%, #e8e1d6 50%, #f0ebe3 75%);
          background-size: 200% 100%;
          animation: shimmer 1.2s infinite;
        }
        .skeleton-line-long  { width: 70%; }
        .skeleton-line-short { width: 40%; }
        @keyframes shimmer {
          from { background-position: 200% 0; }
          to   { background-position: -200% 0; }
        }

        /* Empty state */
        .suggestions-empty {
          padding: 28px 16px;
          text-align: center;
        }
        .suggestions-empty-icon {
          display: block;
          font-family: Georgia, serif;
          font-size: 24px;
          color: rgba(0,0,0,0.15);
          margin-bottom: 10px;
        }
        .suggestions-empty-title {
          margin: 0 0 4px;
          font-size: 13px;
          font-weight: 600;
          color: #171717;
        }
        .suggestions-empty-sub {
          margin: 0;
          font-size: 11px;
          color: rgba(0,0,0,0.45);
        }

        /* List */
        .suggestions-list {
          list-style: none;
          margin: 0;
          padding: 8px 8px 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        /* Each item */
        .suggestion-item {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px;
          border: none;
          background: transparent;
          border-radius: 12px;
          cursor: pointer;
          text-align: left;
          transition: background 0.15s ease;
        }
        .suggestion-item:hover {
          background: rgba(176,141,80,0.07);
        }
        .suggestion-item:hover .suggestion-arrow {
          opacity: 1;
          transform: translateX(2px);
        }

        .suggestion-img-wrap {
          width: 44px;
          height: 44px;
          flex-shrink: 0;
          border-radius: 10px;
          overflow: hidden;
          background: radial-gradient(circle at 50% 45%, #fff 0%, #f4f0e8 55%, #e9e3d7 100%);
          border: 1px solid rgba(0,0,0,0.05);
        }
        .suggestion-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .suggestion-img-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: Georgia, serif;
          font-size: 16px;
          color: rgba(0,0,0,0.15);
        }

        .suggestion-text {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .suggestion-name {
          font-size: 12px;
          font-weight: 600;
          color: #171717;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .suggestion-meta {
          font-size: 10px;
          color: rgba(0,0,0,0.50);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .suggestion-right {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 2px;
          flex-shrink: 0;
        }
        .suggestion-price {
          font-size: 11px;
          font-weight: 700;
          color: #171717;
          white-space: nowrap;
        }
        .suggestion-arrow {
          font-size: 11px;
          color: #aa8953;
          opacity: 0;
          transition: opacity 0.15s ease, transform 0.15s ease;
        }

        /* View all */
        .suggestions-view-all {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 16px;
          margin-top: 4px;
          border: none;
          border-top: 1px solid rgba(0,0,0,0.06);
          background: rgba(250,248,241,0.8);
          color: #806537;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.18em;
          cursor: pointer;
          transition: background 0.15s ease, color 0.15s ease;
        }
        .suggestions-view-all:hover {
          background: rgba(176,141,80,0.10);
          color: #5e3e18;
        }
        .suggestions-view-all-arrow {
          transition: transform 0.2s ease;
        }
        .suggestions-view-all:hover .suggestions-view-all-arrow {
          transform: translateX(3px);
        }
      `}} />
    </div>
  );
}

/* =========================================================
   MAIN HEADER
========================================================= */

export default function StoreHeader() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [open, setOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [itemsInCart, setItemsInCart] = useState(0);
  const [scrolled, setScrolled] = useState(false);

  /* ── Search suggestions state ── */
  const [suggestions, setSuggestions] = useState<SearchProduct[]>([]);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const menuRef = useRef<HTMLDivElement | null>(null);
  const desktopSearchRef = useRef<HTMLDivElement | null>(null);
  const mobileSearchRef = useRef<HTMLDivElement | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  /* =========================================================
     LOAD CURRENT USER
  ========================================================= */

  useEffect(() => {
    let mounted = true;
    async function loadUser() {
      try {
        const response = await fetch("/api/auth/session", {
          method: "GET",
          cache: "no-store",
        });
        if (!response.ok) {
          if (mounted) setUser(null);
          return;
        }
        const data = (await response.json()) as { user?: User | null };
        if (mounted) setUser(data.user ?? null);
      } catch {
        if (mounted) setUser(null);
      }
    }
    loadUser();
    return () => { mounted = false; };
  }, []);

  /* =========================================================
     CART COUNT
  ========================================================= */

  useEffect(() => {
    function updateCartCount() {
      try { setItemsInCart(cartCount(readCart())); }
      catch { setItemsInCart(0); }
    }
    updateCartCount();
    window.addEventListener("kyro-cart-updated", updateCartCount);
    return () => window.removeEventListener("kyro-cart-updated", updateCartCount);
  }, []);

  /* =========================================================
     SCROLL EFFECT
  ========================================================= */

  useEffect(() => {
    function handleScroll() { setScrolled(window.scrollY > 15); }
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  /* =========================================================
     CLOSE ACCOUNT DROPDOWN ON OUTSIDE CLICK
  ========================================================= */

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      const target = event.target as Node;
      if (menuRef.current && !menuRef.current.contains(target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  /* =========================================================
     CLOSE SUGGESTIONS ON OUTSIDE CLICK
  ========================================================= */

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      const target = event.target as Node;
      const inDesktop = desktopSearchRef.current?.contains(target);
      const inMobile = mobileSearchRef.current?.contains(target);
      if (!inDesktop && !inMobile) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  /* =========================================================
     RESPONSIVE MENU
  ========================================================= */

  useEffect(() => {
    function handleResize() {
      if (window.innerWidth >= 1024) setMobileOpen(false);
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  /* =========================================================
     SEARCH — DEBOUNCE + FETCH SUGGESTIONS
  ========================================================= */

  const fetchSuggestions = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      setSuggestLoading(false);
      return;
    }

    // Cancel any in-flight request
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    setSuggestLoading(true);
    setShowSuggestions(true);

    try {
      const res = await fetch(
        `/api/products?q=${encodeURIComponent(query)}&limit=6`,
        { signal: abortRef.current.signal }
      );
      if (!res.ok) throw new Error("fetch failed");
      const data = (await res.json()) as { products: SearchProduct[] };
      setSuggestions(data.products ?? []);
    } catch (err: unknown) {
      // Ignore aborted requests
      if (err instanceof Error && err.name === "AbortError") return;
      setSuggestions([]);
      if (err instanceof Error && err.name !== "AbortError") {
        toast.error("Unable to fetch suggestions. Please try again.");
      }
    } finally {
      setSuggestLoading(false);
    }
  }, []);

  function handleSearchChange(value: string) {
    setSearch(value);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!value.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      setSuggestLoading(false);
      return;
    }

    setSuggestLoading(true);
    setShowSuggestions(true);
    debounceRef.current = setTimeout(() => {
      fetchSuggestions(value);
    }, 280);
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  /* =========================================================
     LOGOUT
  ========================================================= */

  async function logout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      setOpen(false);
      setMobileOpen(false);
      toast.success("Signed out. See you next time.");
      router.push("/");
      router.refresh();
    } catch {
      toast.error("Sign-out failed. Please try again.");
    }
  }

  /* =========================================================
     SEARCH SUBMIT
  ========================================================= */

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = search.trim();
    closeSuggestions();
    setMobileOpen(false);
    router.push(query ? `/shop?q=${encodeURIComponent(query)}` : "/shop");
  }

  function clearSearch() {
    setSearch("");
    setSuggestions([]);
    setShowSuggestions(false);
  }

  function closeSuggestions() {
    setShowSuggestions(false);
  }

  function closeMobileMenu() {
    setMobileOpen(false);
    setShowSuggestions(false);
  }

  /* =========================================================
     USER DISPLAY
  ========================================================= */

  const displayName = user?.name || user?.username || "Kyro Collector";
  const initials =
    displayName
      .split(/\s+/)
      .map((part) => part.charAt(0))
      .join("")
      .slice(0, 2)
      .toUpperCase() || "K";

  /* =========================================================
     NAVIGATION
  ========================================================= */

  const navLinks = [
    ["HOME", "/"],
    ["SHOP", "/shop"],
    ["ABOUT", "/about"],
    ["CONTACT", "/contact"],
    ["ORDERS", "/orders"],
  ];

  /* =========================================================
     SHARED INPUT STYLE
  ========================================================= */

  const inputStyle: React.CSSProperties = {
    WebkitAppearance: "none",
    appearance: "none",
    border: "none",
    outline: "none",
    boxShadow: "none",
    background: "transparent",
    /* Hide native browser search cancel button */
    // @ts-expect-error — vendor prefix not in CSSProperties
    WebkitSearchCancelButton: "none",
    WebkitSearchDecoration: "none",
  };

  return (
    <>
      {/* Hide native browser search clear × globally */}
      <style dangerouslySetInnerHTML={{__html: `
        input[type="search"]::-webkit-search-cancel-button,
        input[type="search"]::-webkit-search-decoration,
        input[type="search"]::-webkit-search-results-button,
        input[type="search"]::-webkit-search-results-decoration {
          display: none !important;
          -webkit-appearance: none !important;
        }
        input[type="search"]::-ms-clear,
        input[type="search"]::-ms-reveal {
          display: none !important;
          width: 0 !important;
          height: 0 !important;
        }
      `}} />

      {/* =====================================================
          HEADER
      ===================================================== */}

      <header
        className={`
          sticky top-0 z-[100] w-full bg-[#fffefa]
          transition-all duration-300
          ${
            scrolled
              ? "border-b border-black/[0.08] shadow-[0_8px_30px_rgba(0,0,0,0.07)]"
              : "border-b border-black/[0.04]"
          }
        `}
      >
        <div className="mx-auto w-full max-w-[1480px] px-5 sm:px-8 lg:px-10 xl:px-12">
          <div className="flex h-[70px] items-center justify-between gap-5">

            {/* ── Logo ── */}
            <Link
              href="/"
              onClick={closeMobileMenu}
              aria-label="Kyro Parfums Home"
              className="group flex h-[60px] w-[76px] shrink-0 items-center justify-center"
            >
              <Image
                src="/logo.png"
                alt="Kyro Parfums"
                width={90}
                height={60}
                priority
                className="h-[52px] w-[72px] object-contain transition-all duration-300 group-hover:scale-[1.04] group-hover:opacity-80"
              />
            </Link>

            {/* ── Desktop Navigation ── */}
            <nav className="hidden items-center gap-7 lg:flex xl:gap-9">
              {navLinks.map(([label, href]) => (
                <Link
                  key={href}
                  href={href}
                  className="
                    group relative py-2
                    text-[10px] font-bold tracking-[0.22em] text-black/80
                    transition-colors duration-200 hover:text-black
                  "
                >
                  {label}
                  <span className="absolute bottom-0 left-1/2 h-[1px] w-0 -translate-x-1/2 bg-[#aa8953] transition-all duration-300 group-hover:w-full" />
                </Link>
              ))}

              <Link
                href="/cart"
                className="
                  group flex items-center gap-2 py-2
                  text-[10px] font-bold tracking-[0.22em] text-black/80
                  transition-colors duration-200 hover:text-black
                "
              >
                <span>CART</span>
                <span
                  className={`
                    flex h-[18px] min-w-[18px] items-center justify-center
                    rounded-full px-1 text-[8px] font-semibold tracking-normal
                    transition-all duration-200
                    ${itemsInCart > 0
                      ? "bg-[#171717] text-white"
                      : "bg-black/[0.06] text-black/60"
                    }
                  `}
                >
                  {itemsInCart}
                </span>
              </Link>
            </nav>

            {/* ── Desktop Right Side ── */}
            <div className="hidden items-center gap-3 lg:flex">

              {/* ── Desktop Search ── */}
              <div ref={desktopSearchRef} className="relative shrink-0">
                <form onSubmit={submitSearch} role="search">
                  <label htmlFor="desktop-store-search" className="sr-only">
                    Search fragrances
                  </label>

                  <div
                    className="
                      group flex h-[42px] w-[230px] items-center
                      rounded-full border border-black/[0.10]
                      bg-white px-[7px]
                      shadow-[0_3px_14px_rgba(0,0,0,0.035)]
                      transition-all duration-300
                      hover:border-black/[0.17]
                      hover:shadow-[0_6px_20px_rgba(0,0,0,0.06)]
                      focus-within:w-[260px]
                      focus-within:border-[#b08d50]/55
                      focus-within:shadow-[0_8px_25px_rgba(176,141,80,0.12)]
                    "
                  >
                    {/* Search icon */}
                    <button
                      type="submit"
                      aria-label="Search"
                      className="
                        flex h-[32px] w-[32px] shrink-0 items-center justify-center
                        rounded-full text-black/60
                        transition-all duration-200
                        hover:bg-[#b08d50]/[0.08] hover:text-[#a17c42]
                        active:scale-90
                      "
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="7" />
                        <path d="m20 20-4-4" />
                      </svg>
                    </button>

                    {/* Input */}
                    <input
                      id="desktop-store-search"
                      type="search"
                      value={search}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      onFocus={() => {
                        if (search.trim()) setShowSuggestions(true);
                      }}
                      placeholder="Search scents"
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck={false}
                      className="
                        min-w-0 flex-1 appearance-none border-0 bg-transparent
                        px-2 text-[13px] font-medium tracking-[0.01em] text-black
                        outline-none ring-0 shadow-none
                        placeholder:text-black/45
                        focus:border-0 focus:outline-none focus:ring-0 focus:shadow-none
                      "
                      style={inputStyle}
                    />

                    {/* Single custom clear button — only when there is text */}
                    {search.length > 0 && (
                      <button
                        type="button"
                        onClick={clearSearch}
                        aria-label="Clear search"
                        className="
                          flex h-[28px] w-[28px] shrink-0 items-center justify-center
                          rounded-full text-[15px] leading-none text-black/50
                          transition-all duration-200
                          hover:bg-black/[0.06] hover:text-black/80
                          active:scale-90
                        "
                      >
                        ×
                      </button>
                    )}

                    {/* Arrow — only when input is empty */}
                    {!search && (
                      <button
                        type="submit"
                        aria-label="Submit search"
                        className="
                          flex h-[30px] w-[30px] shrink-0 items-center justify-center
                          rounded-full text-black/50
                          transition-all duration-200
                          hover:bg-[#b08d50]/[0.08] hover:text-[#a17c42]
                          active:scale-90
                        "
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M5 12h14" />
                          <path d="m13 6 6 6-6 6" />
                        </svg>
                      </button>
                    )}
                  </div>
                </form>

                {/* Suggestions dropdown — desktop */}
                {showSuggestions && (
                  <SearchSuggestions
                    results={suggestions}
                    loading={suggestLoading}
                    query={search}
                    onSelect={closeSuggestions}
                  />
                )}
              </div>

              {/* ── Account ── */}
              <div ref={menuRef} className="relative">
                {user ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setOpen((v) => !v)}
                      aria-expanded={open}
                      aria-haspopup="menu"
                      className="
                        group flex h-[42px] items-center gap-2.5 rounded-full
                        border border-black/[0.08] bg-white pl-1 pr-3
                        shadow-[0_3px_12px_rgba(0,0,0,0.035)]
                        transition-all duration-300
                        hover:-translate-y-[1px] hover:border-[#b08d50]/40
                        hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)]
                        active:translate-y-0
                      "
                    >
                      {user.imageUrl ? (
                        <Image
                          src={user.imageUrl}
                          alt={displayName}
                          width={34}
                          height={34}
                          className="h-[34px] w-[34px] rounded-full object-cover ring-1 ring-black/[0.06]"
                        />
                      ) : (
                        <div className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-[#171717] text-[10px] font-semibold tracking-[0.08em] text-white">
                          {initials}
                        </div>
                      )}
                      <span className="max-w-[82px] truncate text-[11px] font-semibold text-black/85">
                        {displayName.split(" ")[0]}
                      </span>
                      <svg
                        width="11" height="11" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="1.8"
                        className={`text-black/60 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
                      >
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </button>

                    {/* Account dropdown */}
                    {open && (
                      <div
                        role="menu"
                        className="
                          absolute right-0 top-[51px] w-[280px] overflow-hidden
                          rounded-[18px] border border-black/[0.08] bg-[#fffefa]
                          shadow-[0_20px_60px_rgba(0,0,0,0.14)]
                          animate-in fade-in slide-in-from-top-2 duration-200
                        "
                      >
                        {/* Profile */}
                        <div className="border-b border-black/[0.06] bg-[#faf8f2] px-5 py-4">
                          <div className="flex items-center gap-3">
                            {user.imageUrl ? (
                              <Image
                                src={user.imageUrl}
                                alt={displayName}
                                width={44}
                                height={44}
                                className="h-11 w-11 rounded-full object-cover"
                              />
                            ) : (
                              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#171717] text-[11px] font-semibold text-white">
                                {initials}
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-black/90">
                                {displayName}
                              </p>
                              <p className="mt-0.5 truncate text-[11px] text-black/55 font-medium">
                                {user.email}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Menu items */}
                        <div className="p-2">
                          {[
                            { label: "Account Settings", href: "/account" },
                            { label: "Order History", href: "/orders" },
                          ].map(({ label, href }) => (
                            <Link
                              key={href}
                              href={href}
                              onClick={() => setOpen(false)}
                              className="
                                flex items-center justify-between rounded-xl
                                px-3 py-2.5 text-[12px] font-medium text-black/80
                                transition-all duration-200
                                hover:bg-black/[0.04] hover:pl-4 hover:text-black
                              "
                            >
                              <span>{label}</span>
                              <span className="text-black/50 font-semibold">→</span>
                            </Link>
                          ))}

                          {user.role === "admin" && (
                            <Link
                              href="/admin"
                              onClick={() => setOpen(false)}
                              className="
                                flex items-center justify-between rounded-xl
                                px-3 py-2.5 text-[12px] font-medium text-black/80
                                transition-all duration-200
                                hover:bg-black/[0.04] hover:pl-4 hover:text-black
                              "
                            >
                              <span>Admin Dashboard</span>
                              <span className="text-black/50 font-semibold">↗</span>
                            </Link>
                          )}

                          <div className="my-1 border-t border-black/[0.05]" />

                          <button
                            type="button"
                            onClick={logout}
                            className="
                              flex w-full items-center justify-between rounded-xl
                              px-3 py-2.5 text-left text-[12px] font-medium text-red-500
                              transition-all duration-200
                              hover:bg-red-50 hover:pl-4
                            "
                          >
                            <span>Sign Out</span>
                            <span>↗</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <Link
                    href="/login"
                    className="
                      group relative flex h-[42px] items-center gap-2 overflow-hidden
                      rounded-full bg-[#171717] px-[18px]
                      text-[10px] font-semibold tracking-[0.18em] text-white
                      shadow-[0_4px_15px_rgba(0,0,0,0.10)]
                      transition-all duration-300
                      hover:-translate-y-[1px] hover:bg-[#292929]
                      hover:shadow-[0_9px_25px_rgba(0,0,0,0.17)]
                      active:translate-y-0
                    "
                  >
                    <span className="absolute -left-10 top-0 h-full w-10 rotate-12 bg-white/10 transition-all duration-500 group-hover:left-[120%]" />
                    <span className="relative">LOGIN</span>
                    <span className="relative flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-[11px] transition-all duration-300 group-hover:translate-x-1 group-hover:bg-[#b08d50]">
                      ↗
                    </span>
                  </Link>
                )}
              </div>
            </div>

            {/* ── Mobile Actions ── */}
            <div className="flex items-center gap-2 lg:hidden">
              {/* Cart */}
              <Link
                href="/cart"
                aria-label={`Cart with ${itemsInCart} items`}
                className="
                  relative flex h-10 w-10 items-center justify-center
                  rounded-full border border-black/[0.08] bg-white
                  transition-all duration-200
                  hover:border-black/20 hover:bg-black/[0.03]
                  active:scale-95
                "
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 7h12l1 13H5L6 7Z" />
                  <path d="M9 7a3 3 0 0 1 6 0" />
                </svg>
                {itemsInCart > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-black px-1 text-[9px] font-semibold text-white">
                    {itemsInCart}
                  </span>
                )}
              </Link>

              {/* Account/Login — Mobile only */}
              {user ? (
                <button
                  type="button"
                  onClick={() => setMobileOpen((v) => !v)}
                  aria-label={mobileOpen ? "Close menu" : "Open account menu"}
                  aria-expanded={mobileOpen}
                  className="
                    flex h-10 w-10 items-center justify-center
                    rounded-full border border-black/[0.08] bg-white
                    transition-all duration-200
                    hover:border-black/20 hover:bg-black/[0.03]
                    active:scale-95
                  "
                >
                  {user.imageUrl ? (
                    <Image
                      src={user.imageUrl}
                      alt={displayName}
                      width={34}
                      height={34}
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center rounded-full bg-[#171717] text-[9px] font-semibold text-white">
                      {initials}
                    </div>
                  )}
                </button>
              ) : (
                <Link
                  href="/login"
                  className="
                    flex h-10 px-3 items-center justify-center
                    rounded-full bg-[#171717] text-white text-[10px] font-semibold
                    transition-all duration-200
                    hover:bg-[#292929]
                    active:scale-95
                  "
                >
                  Login
                </Link>
              )}

              {/* Hamburger */}
              <button
                type="button"
                onClick={() => setMobileOpen((v) => !v)}
                aria-label={mobileOpen ? "Close menu" : "Open menu"}
                aria-expanded={mobileOpen}
                className="
                  flex h-10 w-10 items-center justify-center
                  rounded-full border border-black/[0.08] bg-white
                  transition-all duration-200
                  hover:border-black/20 active:scale-95
                "
              >
                <div className="flex w-[17px] flex-col gap-[4px]">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className={`h-[1.5px] w-full bg-black transition-all duration-300 ${
                        i === 0 && mobileOpen ? "translate-y-[5.5px] rotate-45" :
                        i === 1 && mobileOpen ? "scale-0 opacity-0" :
                        i === 2 && mobileOpen ? "-translate-y-[5.5px] -rotate-45" : ""
                      }`}
                    />
                  ))}
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* =====================================================
            MOBILE MENU
        ===================================================== */}

        {mobileOpen && (
          <div className="border-t border-black/[0.06] bg-[#fffefa] px-5 pb-6 pt-4 shadow-[0_12px_30px_rgba(0,0,0,0.06)] lg:hidden">

            {/* Mobile search */}
            <div ref={mobileSearchRef} className="relative mb-5">
              <form
                onSubmit={submitSearch}
                role="search"
                className="
                  group flex h-[46px] items-center rounded-full
                  border border-black/[0.09] bg-white px-2
                  transition-all
                  focus-within:border-[#b08d50]/50
                  focus-within:shadow-[0_6px_20px_rgba(176,141,80,0.10)]
                "
              >
                <button
                  type="submit"
                  aria-label="Search"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-black/60 transition-colors hover:text-[#a17c42]"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="7" />
                    <path d="m20 20-4-4" />
                  </svg>
                </button>

                <label htmlFor="mobile-store-search" className="sr-only">
                  Search fragrances
                </label>

                <input
                  id="mobile-store-search"
                  type="search"
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onFocus={() => {
                    if (search.trim()) setShowSuggestions(true);
                  }}
                  placeholder="Search scents"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  className="
                    min-w-0 flex-1 appearance-none border-0 bg-transparent
                    px-2 text-sm font-medium text-black
                    outline-none ring-0 shadow-none
                    placeholder:text-black/45
                    focus:border-0 focus:outline-none focus:ring-0 focus:shadow-none
                  "
                  style={inputStyle}
                />

                {/* Single custom clear */}
                {search && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    aria-label="Clear search"
                    className="flex h-7 w-7 items-center justify-center rounded-full text-sm text-black/50 hover:bg-black/[0.05] hover:text-black/80"
                  >
                    ×
                  </button>
                )}
              </form>

              {/* Suggestions dropdown — mobile */}
              {showSuggestions && (
                <SearchSuggestions
                  results={suggestions}
                  loading={suggestLoading}
                  query={search}
                  onSelect={() => {
                    closeSuggestions();
                    closeMobileMenu();
                  }}
                />
              )}
            </div>

            {/* Mobile nav links */}
            <nav className="space-y-1">
              {navLinks.map(([label, href]) => (
                <Link
                  key={href}
                  href={href}
                  onClick={closeMobileMenu}
                  className="
                    flex items-center justify-between rounded-xl
                    px-3 py-3.5 text-[11px] font-bold tracking-[0.18em] text-black/80
                    transition-all duration-200
                    hover:bg-black/[0.04] hover:pl-4 hover:text-black
                  "
                >
                  <span>{label}</span>
                  <span className="text-black/50 font-semibold">→</span>
                </Link>
              ))}

              <Link
                href="/cart"
                onClick={closeMobileMenu}
                className="
                  flex items-center justify-between rounded-xl
                  px-3 py-3.5 text-[11px] font-bold tracking-[0.18em] text-black/80
                  transition-all duration-200
                  hover:bg-black/[0.04]
                "
              >
                <span>CART</span>
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-black/[0.06] px-1.5 text-[9px] tracking-normal text-black/65 font-semibold">
                  {itemsInCart}
                </span>
              </Link>
            </nav>

            {/* Mobile account */}
            <div className="mt-5 border-t border-black/[0.06] pt-5">
              {user ? (
                <div className="rounded-2xl border border-black/[0.07] bg-[#faf8f2] p-4">
                  <div className="flex items-center gap-3">
                    {user.imageUrl ? (
                      <Image
                        src={user.imageUrl}
                        alt={displayName}
                        width={42}
                        height={42}
                        className="h-[42px] w-[42px] rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full bg-black text-[11px] font-semibold text-white">
                        {initials}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-black/90">
                        {displayName}
                      </p>
                      <p className="truncate text-[11px] font-medium text-black/55">
                        {user.email}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <Link
                      href="/account"
                      onClick={closeMobileMenu}
                      className="flex h-10 items-center justify-center rounded-xl border border-black/[0.08] bg-white text-[11px] font-semibold transition-all hover:bg-black/[0.03]"
                    >
                      ACCOUNT
                    </Link>

                    {user.role === "admin" ? (
                      <Link
                        href="/admin"
                        onClick={closeMobileMenu}
                        className="flex h-10 items-center justify-center rounded-xl bg-black text-[11px] font-semibold text-white transition-all hover:bg-[#292929]"
                      >
                        ADMIN
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={logout}
                        className="h-10 rounded-xl bg-black text-[11px] font-semibold text-white transition-all hover:bg-[#292929]"
                      >
                        SIGN OUT
                      </button>
                    )}
                  </div>

                  {user.role === "admin" && (
                    <button
                      type="button"
                      onClick={logout}
                      className="mt-2 w-full rounded-xl py-2.5 text-[11px] font-medium text-red-500 transition-colors hover:bg-red-50"
                    >
                      SIGN OUT
                    </button>
                  )}
                </div>
              ) : (
                <Link
                  href="/login"
                  onClick={closeMobileMenu}
                  className="
                    group flex h-[46px] items-center justify-center gap-2 rounded-full
                    bg-[#171717] text-[11px] font-semibold tracking-[0.17em] text-white
                    transition-all duration-300
                    hover:bg-[#292929] hover:shadow-[0_8px_24px_rgba(0,0,0,0.14)]
                    active:scale-[0.98]
                  "
                >
                  LOGIN
                  <span className="transition-transform duration-300 group-hover:translate-x-1">↗</span>
                </Link>
              )}
            </div>
          </div>
        )}
      </header>
    </>
  );
}
