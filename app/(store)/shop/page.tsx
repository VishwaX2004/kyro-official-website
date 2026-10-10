import { clientPromise } from "@/lib/mongodb";
import Footer from "@/app/components/Footer";
import ProductCard, {
  type ProductCardProduct,
} from "@/app/components/ProductCard";
import WhatsAppButton from "@/app/components/WhatsAppButton";

import ShopFilters from "./ShopFilters";

export const metadata = {
  title: "Shop | Kyro Parfums",
  description:
    "Explore the Kyro Parfums collection of thoughtfully decanted fragrances.",
};

/* =========================================================
   TYPES
========================================================= */

type ShopPageProps = {
  searchParams: Promise<{
    q?: string;
    brand?: string;
    category?: string;
    gender?: string;
    concentration?: string;
    minPrice?: string;
    maxPrice?: string;
    inStock?: string;
    sort?: string;
  }>;
};

type ShopProduct = ProductCardProduct & {
  gender: string;
  description: string;
};

/* =========================================================
   FETCH PRODUCTS
========================================================= */

async function fetchProducts(): Promise<ShopProduct[]> {
  try {
    const client = await clientPromise;

    const docs = await client
      .db("kyro")
      .collection("products")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    return docs.map((p) => ({
      id: p._id.toString(),

      name: String(p.name || ""),

      brand: String(p.brand || ""),

      price: Number(p.decants?.[0]?.price ?? 0),

      size: `${p.decants?.[0]?.size ?? 5}${
        p.decants?.[0]?.unit ?? "ml"
      }`,

      notes: [
        ...(p.notes?.top ?? []),
        ...(p.notes?.middle ?? []),
        ...(p.notes?.base ?? []),
      ].join(", "),

      description: String(p.description || ""),

      shortDescription: String(
        p.shortDescription || p.description || ""
      ),

      category: String(p.category || ""),

      concentration: String(
        p.fragrance?.concentration ?? p.type ?? ""
      ),

      gender: String(
        p.fragrance?.gender || p.category || ""
      ),

      imageUrl: String(p.images?.[0] ?? ""),

      stock:
        (
          p.decants as Array<{
            stock: number;
          }> | undefined
        )?.reduce(
          (sum, d) => sum + (d.stock ?? 0),
          0
        ) ?? 0,

      featured: Boolean(p.isFeatured),
    }));
  } catch (error) {
    console.error("Failed to fetch products:", error);

    return [];
  }
}

/* =========================================================
   HELPERS
========================================================= */

function extractUnique(
  products: ShopProduct[],
  key: keyof ShopProduct
): string[] {
  return Array.from(
    new Set(
      products
        .map((p) => String(p[key]))
        .filter(Boolean)
    )
  ).sort();
}

function applyFilters(
  products: ShopProduct[],
  params: {
    q?: string;
    brand?: string;
    category?: string;
    gender?: string;
    concentration?: string;
    minPrice?: string;
    maxPrice?: string;
    inStock?: string;
    sort?: string;
  }
): ShopProduct[] {
  let result = [...products];

  /* SEARCH */

  if (params.q?.trim()) {
    const query = params.q.toLowerCase();

    result = result.filter((p) =>
      [
        p.name,
        p.brand,
        p.notes,
        p.description,
        p.category,
        p.concentration,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }

  /* BRAND */

  if (params.brand) {
    const brands = params.brand
      .split(",")
      .map((b) => b.trim().toLowerCase());

    result = result.filter((p) =>
      brands.includes(p.brand.toLowerCase())
    );
  }

  /* CATEGORY */

  if (params.category) {
    result = result.filter(
      (p) =>
        p.category.toLowerCase() ===
        params.category!.toLowerCase()
    );
  }

  /* GENDER */

  if (params.gender) {
    result = result.filter(
      (p) =>
        p.gender.toLowerCase() ===
        params.gender!.toLowerCase()
    );
  }

  /* CONCENTRATION */

  if (params.concentration) {
    const concs = params.concentration
      .split(",")
      .map((c) => c.trim().toLowerCase());

    result = result.filter((p) =>
      concs.includes(
        p.concentration.toLowerCase()
      )
    );
  }

  /* PRICE */

  const minP = params.minPrice
    ? Number(params.minPrice)
    : 0;

  const maxP = params.maxPrice
    ? Number(params.maxPrice)
    : Infinity;

  result = result.filter(
    (p) =>
      p.price >= minP &&
      p.price <= maxP
  );

  /* STOCK */

  if (params.inStock === "true") {
    result = result.filter(
      (p) => p.stock > 0
    );
  }

  /* SORT */

  switch (params.sort) {
    case "price-asc":
      result.sort(
        (a, b) => a.price - b.price
      );
      break;

    case "price-desc":
      result.sort(
        (a, b) => b.price - a.price
      );
      break;

    case "name-asc":
      result.sort(
        (a, b) =>
          a.name.localeCompare(b.name)
      );
      break;
  }

  return result;
}

/* =========================================================
   PAGE
========================================================= */

export default async function ShopPage({
  searchParams,
}: ShopPageProps) {
  const params = await searchParams;

  const allProducts = await fetchProducts();

  const filtered = applyFilters(
    allProducts,
    params
  );

  const availableBrands = extractUnique(
    allProducts,
    "brand"
  );

  const availableCategories = extractUnique(
    allProducts,
    "category"
  );

  const availableConcentrations =
    extractUnique(
      allProducts,
      "concentration"
    );

  const availableGenders = extractUnique(
    allProducts,
    "gender"
  );

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            /* =====================================================
               KYRO SHOP ANIMATIONS
            ===================================================== */

            @keyframes kyroShopReveal {
              from {
                opacity: 0;
                transform: translateY(18px);
              }

              to {
                opacity: 1;
                transform: translateY(0);
              }
            }

            @keyframes kyroShopFade {
              from {
                opacity: 0;
              }

              to {
                opacity: 1;
              }
            }

            @keyframes kyroGlow {
              0%,
              100% {
                opacity: .30;
                transform: scale(1);
              }

              50% {
                opacity: .68;
                transform: scale(1.08);
              }
            }

            /* =====================================================
               PAGE
            ===================================================== */

            .kyro-shop-page {
              min-height: 100vh;
              overflow: hidden;
              background:
                radial-gradient(
                  circle at 88% 0%,
                  rgba(176, 141, 60, .10),
                  transparent 25%
                ),
                radial-gradient(
                  circle at 0% 42%,
                  rgba(176, 141, 60, .045),
                  transparent 25%
                ),
                linear-gradient(
                  180deg,
                  #f8f6f0 0%,
                  #fbfaf6 48%,
                  #f5f2e9 100%
                );
              color: #171717;
            }

            /*
              Main content is deliberately narrower than the
              previous 1440px layout so the page feels balanced
              from the user's viewpoint.
            */

            .kyro-shop-inner {
              width: min(
                100% - 40px,
                1280px
              );
              margin: 0 auto;
              padding: 28px 0 90px;
            }

            /* =====================================================
               HEADER
            ===================================================== */

            .kyro-shop-header {
              display: flex;
              align-items: flex-end;
              justify-content: space-between;
              gap: 28px;
              padding: 8px 2px 28px;

              animation:
                kyroShopReveal
                .65s
                cubic-bezier(.22,1,.36,1)
                both;
            }

            .kyro-shop-eyebrow {
              display: flex;
              align-items: center;
              gap: 9px;

              margin: 0 0 10px;

              font-size: 9px;
              font-weight: 700;
              letter-spacing: .30em;
              text-transform: uppercase;

              color: #92774d;
            }

            .kyro-shop-eyebrow::before {
              content: "";

              width: 28px;
              height: 1px;

              background: #aa8953;
            }

            .kyro-shop-title {
              margin: 0;

              font-family:
                Georgia,
                "Times New Roman",
                serif;

              font-size:
                clamp(
                  36px,
                  4vw,
                  50px
                );

              font-weight: 400;
              line-height: .96;
              letter-spacing: -.045em;
            }

            .kyro-shop-title em {
              color: #92774d;
              font-weight: 400;
            }

            .kyro-shop-description {
              max-width: 510px;

              margin: 12px 0 0;

              font-size: 13px;
              line-height: 1.7;

              color: rgba(23,23,23,.52);
            }

            .kyro-shop-count-box {
              display: flex;
              align-items: center;
              gap: 10px;

              flex-shrink: 0;

              padding: 11px 15px;

              border:
                1px solid
                rgba(23,23,23,.08);

              border-radius: 999px;

              background:
                rgba(255,255,255,.68);

              box-shadow:
                0 8px 28px
                rgba(23,23,23,.035);

              backdrop-filter: blur(14px);

              font-size: 11px;

              color:
                rgba(23,23,23,.55);
            }

            .kyro-shop-count-dot {
              width: 7px;
              height: 7px;

              border-radius: 50%;

              background: #aa8953;

              box-shadow:
                0 0 0 5px
                rgba(170,137,83,.10);
            }

            /* =====================================================
               MAIN SHOP LAYOUT
            ===================================================== */

            .kyro-shop-layout {
              display: grid;

              /*
                Slightly narrower filter + wider catalog.
                This gives each product card enough breathing
                room while preserving 3 columns.
              */

              grid-template-columns:
                245px
                minmax(0, 1fr);

              align-items: start;

              gap: 25px;
            }

            /* =====================================================
               FILTER SIDEBAR
            ===================================================== */

            .kyro-filter-column {
              position: sticky;
              top: 22px;

              z-index: 20;

              min-width: 0;

              animation:
                kyroShopReveal
                .7s
                cubic-bezier(.22,1,.36,1)
                .08s
                both;
            }

            .kyro-filter-shell {
              position: relative;
              overflow: hidden;

              padding: 15px;

              border:
                1px solid
                rgba(23,23,23,.08);

              border-radius: 22px;

              background:
                linear-gradient(
                  145deg,
                  rgba(255,255,255,.84),
                  rgba(250,248,241,.74)
                );

              box-shadow:
                0 18px 50px
                rgba(23,23,23,.055);

              backdrop-filter: blur(20px);
            }

            .kyro-filter-shell::before {
              content: "";

              position: absolute;

              top: -90px;
              right: -90px;

              width: 185px;
              height: 185px;

              border-radius: 50%;

              background:
                rgba(176,141,60,.075);

              filter: blur(20px);

              pointer-events: none;

              animation:
                kyroGlow
                5s
                ease-in-out
                infinite;
            }

            .kyro-filter-heading {
              position: relative;

              display: flex;
              align-items: center;

              gap: 10px;

              margin-bottom: 14px;
              padding-bottom: 13px;

              border-bottom:
                1px solid
                rgba(23,23,23,.07);
            }

            .kyro-filter-heading-icon {
              display: flex;
              align-items: center;
              justify-content: center;

              width: 31px;
              height: 31px;

              flex-shrink: 0;

              border-radius: 9px;

              background: #171717;

              color: white;

              font-size: 13px;

              box-shadow:
                0 7px 18px
                rgba(23,23,23,.15);
            }

            .kyro-filter-heading-content {
              min-width: 0;
            }

            .kyro-filter-heading-title {
              margin: 0;

              font-size: 10px;
              font-weight: 700;

              letter-spacing: .12em;
              text-transform: uppercase;

              color: #282622;
            }

            .kyro-filter-heading-subtitle {
              margin: 3px 0 0;

              font-size: 9px;

              color:
                rgba(23,23,23,.40);
            }

            .kyro-filter-content {
              position: relative;
            }

            /* =====================================================
               PRODUCTS COLUMN
            ===================================================== */

            .kyro-products-column {
              min-width: 0;
            }

            .kyro-results-bar {
              display: flex;
              align-items: center;

              gap: 15px;

              min-height: 38px;

              margin:
                0 1px
                13px;

              padding:
                0 2px;

              animation:
                kyroShopFade
                .65s
                ease
                .18s
                both;
            }

            .kyro-results-left {
              display: flex;
              align-items: baseline;

              gap: 6px;

              min-width: 0;
            }

            .kyro-results-text {
              margin: 0;

              font-size: 10px;

              white-space: nowrap;

              color:
                rgba(23,23,23,.43);
            }

            .kyro-results-text strong {
              color: #171717;
              font-weight: 700;
            }

            .kyro-results-divider {
              width: 1px;
              height: 13px;

              margin: 0 4px;

              background:
                rgba(23,23,23,.10);
            }

            .kyro-results-tag {
              display: inline-flex;
              align-items: center;

              gap: 6px;

              font-size: 9px;

              color: #92774d;

              white-space: nowrap;
            }

            .kyro-results-tag::before {
              content: "";

              width: 5px;
              height: 5px;

              border-radius: 50%;

              background: #aa8953;
            }

            .kyro-results-line {
              flex: 1;

              height: 1px;

              background:
                rgba(23,23,23,.07);
            }

            /* =====================================================
               PRODUCT GRID

               IMPORTANT:
               Desktop = EXACTLY 3 cards per row.
            ===================================================== */

            .kyro-product-grid {
              display: grid;

              grid-template-columns:
                repeat(
                  3,
                  minmax(0, 1fr)
                );

              gap: 17px;
            }

            .kyro-product-entry {
              min-width: 0;

              animation:
                kyroShopReveal
                .65s
                cubic-bezier(.22,1,.36,1)
                both;

              transition:
                transform .3s ease;
            }

            .kyro-product-entry:hover {
              transform: translateY(-3px);
            }

            /*
              The card itself remains untouched.
              This wrapper controls the available width.
            */

            .kyro-product-entry > * {
              width: 100%;
              min-width: 0;
            }

            /* =====================================================
               EMPTY STATE
            ===================================================== */

            .kyro-empty-state {
              position: relative;
              overflow: hidden;

              display: flex;

              min-height: 430px;

              flex-direction: column;
              align-items: center;
              justify-content: center;

              padding: 50px 24px;

              border:
                1px solid
                rgba(23,23,23,.07);

              border-radius: 25px;

              background:
                rgba(255,254,250,.72);

              text-align: center;

              animation:
                kyroShopReveal
                .65s
                ease
                both;
            }

            .kyro-empty-glow {
              position: absolute;

              top: -100px;

              width: 280px;
              height: 280px;

              border-radius: 50%;

              background:
                rgba(170,137,83,.08);

              filter: blur(22px);

              animation:
                kyroGlow
                4s
                ease-in-out
                infinite;
            }

            .kyro-empty-symbol {
              position: relative;

              display: flex;

              width: 68px;
              height: 68px;

              align-items: center;
              justify-content: center;

              margin-bottom: 18px;

              border:
                1px solid
                rgba(170,137,83,.25);

              border-radius: 50%;

              background:
                rgba(255,255,255,.75);

              font-family:
                Georgia,
                serif;

              font-size: 26px;

              color: #aa8953;

              box-shadow:
                0 10px 30px
                rgba(23,23,23,.05);
            }

            .kyro-empty-state h2 {
              position: relative;

              margin: 0;

              font-family:
                Georgia,
                "Times New Roman",
                serif;

              font-size: 28px;

              font-weight: 400;

              letter-spacing: -.02em;
            }

            .kyro-empty-state p {
              position: relative;

              max-width: 410px;

              margin: 9px 0 22px;

              font-size: 12px;
              line-height: 1.75;

              color:
                rgba(23,23,23,.45);
            }

            .kyro-empty-button {
              position: relative;

              display: inline-flex;
              align-items: center;

              gap: 10px;

              padding: 13px 20px;

              border-radius: 999px;

              background: #171717;

              color: white;

              text-decoration: none;

              font-size: 11px;
              font-weight: 600;

              transition:
                transform .25s ease,
                box-shadow .25s ease;
            }

            .kyro-empty-button:hover {
              transform: translateY(-2px);

              box-shadow:
                0 12px 28px
                rgba(23,23,23,.17);
            }

            .kyro-empty-button span {
              transition:
                transform .25s ease;
            }

            .kyro-empty-button:hover span {
              transform: translateX(3px);
            }

            /* =====================================================
               LARGE TABLET
            ===================================================== */

            @media (max-width: 1120px) {
              .kyro-shop-inner {
                width:
                  min(
                    calc(100% - 36px),
                    1050px
                  );
              }

              .kyro-shop-layout {
                grid-template-columns:
                  225px
                  minmax(0, 1fr);

                gap: 20px;
              }

              .kyro-product-grid {
                grid-template-columns:
                  repeat(
                    3,
                    minmax(0, 1fr)
                  );

                gap: 13px;
              }

              .kyro-filter-shell {
                padding: 13px;
              }
            }

            /* =====================================================
               TABLET
            ===================================================== */

            @media (max-width: 900px) {
              .kyro-shop-inner {
                width:
                  min(
                    calc(100% - 30px),
                    760px
                  );
              }

              .kyro-shop-layout {
                display: block;
              }

              .kyro-filter-column {
                position: relative;
                top: auto;

                margin-bottom: 20px;
              }

              .kyro-filter-shell {
                border-radius: 20px;
              }

              .kyro-product-grid {
                grid-template-columns:
                  repeat(
                    2,
                    minmax(0, 1fr)
                  );

                gap: 15px;
              }
            }

            /* =====================================================
               MOBILE
            ===================================================== */

            @media (max-width: 560px) {
              .kyro-shop-inner {
                width:
                  calc(100% - 20px);

                padding-top: 15px;
                padding-bottom: 55px;
              }

              .kyro-shop-header {
                align-items: flex-start;

                flex-direction: column;

                gap: 12px;

                padding:
                  6px 0 20px;
              }

              .kyro-shop-title {
                font-size: 35px;
              }

              .kyro-shop-description {
                max-width: 330px;

                font-size: 12px;
              }

              .kyro-shop-count-box {
                display: none;
              }

              .kyro-filter-shell {
                padding: 12px;

                border-radius: 18px;
              }

              .kyro-filter-heading {
                margin-bottom: 12px;
              }

              .kyro-results-bar {
                min-height: 35px;

                margin-bottom: 10px;
              }

              .kyro-results-divider,
              .kyro-results-tag,
              .kyro-results-line {
                display: none;
              }

              .kyro-product-grid {
                grid-template-columns: 1fr;

                gap: 14px;
              }

              .kyro-empty-state {
                min-height: 330px;

                border-radius: 22px;
              }
            }

            /* =====================================================
               REDUCED MOTION
            ===================================================== */

            @media (prefers-reduced-motion: reduce) {
              .kyro-shop-header,
              .kyro-filter-column,
              .kyro-results-bar,
              .kyro-product-entry,
              .kyro-empty-state,
              .kyro-empty-glow,
              .kyro-filter-shell::before {
                animation: none !important;
              }

              .kyro-product-entry {
                transition: none !important;
              }
            }

            /* =====================================================
               ADDITIONAL MOBILE (768px)
            ===================================================== */

            @media (max-width: 768px) {
              .kyro-shop-inner {
                width: calc(100% - 24px);
                padding-top: 18px;
              }
              .kyro-filter-content {
                overflow-x: hidden;
              }
            }
          `,
        }}
      />

      <main className="kyro-shop-page">
        <div className="kyro-shop-inner">

          {/* =====================================================
              HEADER
          ===================================================== */}

          <header className="kyro-shop-header">
            <div>
              <p className="kyro-shop-eyebrow">
                The Kyro Collection
              </p>

              <h1 className="kyro-shop-title">
                Discover{" "}
                <em>fragrance.</em>
              </h1>

              <p className="kyro-shop-description">
                Thoughtfully decanted scents for every mood,
                moment and signature.
              </p>
            </div>

            <div className="kyro-shop-count-box">
              <span className="kyro-shop-count-dot" />

              <span>
                {allProducts.length} fragrances
              </span>
            </div>
          </header>

          {/* =====================================================
              SHOP LAYOUT
          ===================================================== */}

          <div className="kyro-shop-layout">

            {/* ===================================================
                LEFT FILTER SIDEBAR
            =================================================== */}

            <aside className="kyro-filter-column">
              <div className="kyro-filter-shell">

                <div className="kyro-filter-heading">
                  <div className="kyro-filter-heading-icon">
                    ☷
                  </div>

                  <div className="kyro-filter-heading-content">
                    <h2 className="kyro-filter-heading-title">
                      Refine collection
                    </h2>

                    <p className="kyro-filter-heading-subtitle">
                      Search & filter your scents
                    </p>
                  </div>
                </div>

                <div className="kyro-filter-content">
                  <ShopFilters
                    brands={availableBrands}
                    categories={availableCategories}
                    concentrations={
                      availableConcentrations
                    }
                    genders={availableGenders}
                    defaults={{
                      q: params.q,
                      brand: params.brand,
                      category: params.category,
                      gender: params.gender,
                      concentration:
                        params.concentration,
                      minPrice:
                        params.minPrice,
                      maxPrice:
                        params.maxPrice,
                      inStock:
                        params.inStock,
                      sort: params.sort,
                    }}
                  />
                </div>

              </div>
            </aside>

            {/* ===================================================
                RIGHT PRODUCT CATALOG
            =================================================== */}

            <section className="kyro-products-column">

              {filtered.length === 0 ? (
                <div className="kyro-empty-state">

                  <div className="kyro-empty-glow" />

                  <div className="kyro-empty-symbol">
                    ◇
                  </div>

                  <h2>
                    No fragrances found
                  </h2>

                  <p>
                    We couldn't find a scent matching
                    your current selection. Try another
                    search or adjust your filters.
                  </p>

                  <a
                    href="/shop"
                    className="kyro-empty-button"
                  >
                    Reset collection
                    <span>→</span>
                  </a>

                </div>
              ) : (
                <>
                  {/* =============================================
                      RESULTS HEADER
                  ============================================= */}

                  <div className="kyro-results-bar">

                    <div className="kyro-results-left">

                      <p className="kyro-results-text">
                        Showing{" "}
                        <strong>
                          {filtered.length}
                        </strong>{" "}
                        of{" "}
                        <strong>
                          {allProducts.length}
                        </strong>
                      </p>

                      <span className="kyro-results-divider" />

                      <span className="kyro-results-tag">
                        Curated collection
                      </span>

                    </div>

                    <div className="kyro-results-line" />

                  </div>

                  {/* =============================================
                      PRODUCTS
                  ============================================= */}

                  <div className="kyro-product-grid">

                    {filtered.map(
                      (product, index) => (
                        <div
                          key={product.id}
                          className="kyro-product-entry"
                          style={{
                            animationDelay:
                              `${Math.min(
                                index * 55,
                                500
                              )}ms`,
                          }}
                        >
                          <ProductCard
                            product={product}
                            index={index}
                            animation
                          />
                        </div>
                      )
                    )}

                  </div>
                </>
              )}

            </section>

          </div>
        </div>
      </main>
      <WhatsAppButton />
      <Footer />
    </>
  );
}