import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ObjectId } from "mongodb";

import { clientPromise } from "@/lib/mongodb";
import Footer from "@/app/components/Footer";
import ProductActions from "./ProductActions";

/* =========================================================
   TYPES
========================================================= */

export type Decant = {
  size: number;
  unit: string;
  labelledPrice?: number;
  price: number;
  stock: number;
};

export type Product = {
  id: string;
  name: string;
  brand: string;
  slug: string;
  description: string;
  shortDescription: string;
  category: string;
  type: string;
  images: string[];
  decants: Decant[];
  notes: {
    top: string[];
    middle: string[];
    base: string[];
  };
  fragrance: {
    gender: string;
    concentration: string;
    season: string[];
    occasion: string[];
    longevity: string;
    sillage: string;
  };
  isFeatured: boolean;
  isBestSeller: boolean;
};

export type SerializedProduct = {
  id: string;
  name: string;
  brand: string;
  images: string[];
  decants: Decant[];
  isFeatured: boolean;
  isBestSeller: boolean;
};

/* =========================================================
   HELPERS
========================================================= */

export const formatPrice = (price: number) =>
  new Intl.NumberFormat("en-LK", {
    maximumFractionDigits: 0,
  }).format(price);

export const getDiscount = (
  labelledPrice: number | undefined,
  price: number
): number => {
  if (!labelledPrice || labelledPrice <= price) return 0;

  return Math.round(
    ((labelledPrice - price) / labelledPrice) * 100
  );
};

/* =========================================================
   DATA FETCH
========================================================= */

async function getProduct(id: string): Promise<Product | null> {
  try {
    if (!ObjectId.isValid(id)) return null;

    const client = await clientPromise;

    const doc = await client
      .db("kyro")
      .collection("products")
      .findOne({ _id: new ObjectId(id) });

    if (!doc) return null;

    return {
      id: doc._id.toString(),
      name: String(doc.name ?? ""),
      brand: String(doc.brand ?? ""),
      slug: String(doc.slug ?? ""),
      description: String(doc.description ?? ""),
      shortDescription: String(doc.shortDescription ?? ""),
      category: String(doc.category ?? ""),
      type: String(doc.type ?? ""),

      images: Array.isArray(doc.images)
        ? doc.images.map(String)
        : [],

      decants: Array.isArray(doc.decants)
        ? (doc.decants as Decant[]).map((d) => ({
            size: Number(d.size),
            unit: String(d.unit),
            labelledPrice:
              d.labelledPrice !== undefined
                ? Number(d.labelledPrice)
                : undefined,
            price: Number(d.price),
            stock: Number(d.stock),
          }))
        : [],

      notes: {
        top: Array.isArray(doc.notes?.top)
          ? doc.notes.top.map(String)
          : [],
        middle: Array.isArray(doc.notes?.middle)
          ? doc.notes.middle.map(String)
          : [],
        base: Array.isArray(doc.notes?.base)
          ? doc.notes.base.map(String)
          : [],
      },

      fragrance: {
        gender: String(
          doc.fragrance?.gender ?? doc.category ?? ""
        ),
        concentration: String(
          doc.fragrance?.concentration ?? doc.type ?? ""
        ),
        season: Array.isArray(doc.fragrance?.season)
          ? doc.fragrance.season.map(String)
          : [],
        occasion: Array.isArray(doc.fragrance?.occasion)
          ? doc.fragrance.occasion.map(String)
          : [],
        longevity: String(doc.fragrance?.longevity ?? ""),
        sillage: String(doc.fragrance?.sillage ?? ""),
      },

      isFeatured: Boolean(doc.isFeatured),
      isBestSeller: Boolean(doc.isBestSeller),
    };
  } catch (error) {
    console.error("Failed to fetch product:", error);
    return null;
  }
}

/* =========================================================
   METADATA
========================================================= */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    return {
      title: "Product Not Found | Kyro Parfums",
    };
  }

  return {
    title: `${product.name} | Kyro Parfums`,
    description:
      product.shortDescription ||
      product.description ||
      `Discover ${product.name} by ${product.brand} at Kyro Parfums.`,
  };
}

/* =========================================================
   PRODUCT PAGE
========================================================= */

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) notFound();

  const primaryImage = product.images[0] ?? "";

  const totalStock = product.decants.reduce(
    (total, decant) => total + Number(decant.stock ?? 0),
    0
  );

  const lowestPrice =
    product.decants.length > 0
      ? Math.min(
          ...product.decants.map((decant) =>
            Number(decant.price ?? 0)
          )
        )
      : 0;

  const allNotes = [
    ...product.notes.top,
    ...product.notes.middle,
    ...product.notes.base,
  ];

  const basicDetails = [
    {
      label: "Concentration",
      value:
        product.fragrance.concentration || product.type,
    },
    {
      label: "Gender",
      value: product.fragrance.gender || product.category,
    },
    {
      label: "Longevity",
      value: product.fragrance.longevity,
    },
    {
      label: "Sillage",
      value: product.fragrance.sillage,
    },
  ].filter((item) => item.value);

  const detailedInfo = [
    {
      label: "Concentration",
      value:
        product.fragrance.concentration || product.type,
    },
    {
      label: "Gender",
      value: product.fragrance.gender || product.category,
    },
    {
      label: "Longevity",
      value: product.fragrance.longevity,
    },
    {
      label: "Sillage",
      value: product.fragrance.sillage,
    },
    {
      label: "Season",
      value: product.fragrance.season.join(", "),
    },
    {
      label: "Occasion",
      value: product.fragrance.occasion.join(", "),
    },
  ].filter((item) => item.value);

  const serializedProduct: SerializedProduct = {
    id: product.id,
    name: product.name,
    brand: product.brand,
    images: product.images,
    decants: product.decants,
    isFeatured: product.isFeatured,
    isBestSeller: product.isBestSeller,
  };

  const sizesToDisplay = [5, 10];

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes kyroRise {
              from {
                opacity: 0;
                transform: translateY(12px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }

            .kyro-rise {
              animation: kyroRise .5s ease-out both;
            }

            .kyro-rise-delay {
              animation: kyroRise .5s .08s ease-out both;
            }

            .kyro-product-copy {
              overflow-wrap: anywhere;
            }

            /* ProductActions: improve the visibility of its existing controls. */
            .product-actions-prominent {
              width: 100%;
            }

            .product-actions-prominent button {
              transition:
                background-color .2s ease,
                border-color .2s ease,
                color .2s ease,
                transform .2s ease,
                box-shadow .2s ease;
            }

            .product-actions-prominent button:focus-visible {
              outline: 3px solid rgba(170,137,83,.5);
              outline-offset: 3px;
            }

            .product-actions-prominent button:disabled {
              cursor: not-allowed;
              opacity: .5;
            }

            .product-actions-prominent input,
            .product-actions-prominent select {
              min-height: 50px;
              font-size: 16px;
              font-weight: 600;
            }

            .product-actions-prominent button {
              min-height: 50px;
              font-size: 16px;
              font-weight: 700;
            }

            /* Moderately larger labels and total price text inside ProductActions */
            .product-actions-prominent label {
              font-size: 15px;
              font-weight: 700;
            }

            .product-actions-prominent [class*="total"],
            .product-actions-prominent [class*="Total"],
            .product-actions-prominent [class*="price"],
            .product-actions-prominent [class*="Price"] {
              font-size: 1.5rem;
              font-weight: 800;
              line-height: 1.2;
            }

            @media (min-width: 640px) {
              .product-actions-prominent [class*="total"],
              .product-actions-prominent [class*="Total"],
              .product-actions-prominent [class*="price"],
              .product-actions-prominent [class*="Price"] {
                font-size: 1.875rem;
              }
            }

            @media (prefers-reduced-motion: reduce) {
              .kyro-rise,
              .kyro-rise-delay {
                animation: none;
              }
            }

            @media (max-width: 768px) {
              /* Product grid: single column below lg is already handled by Tailwind.
                 These rules add extra polish for mobile. */
              .product-detail-grid {
                grid-template-columns: 1fr !important;
                gap: 1.5rem !important;
              }
              
              /* Purchase section action buttons: full width */
              .product-actions-prominent button {
                width: 100% !important;
                min-height: 44px !important;
              }

              .product-actions-prominent input,
              .product-actions-prominent select {
                min-height: 44px !important;
                font-size: 16px;
              }

              .product-actions-prominent label {
                font-size: 14px;
              }

              .product-actions-prominent [class*="total"],
              .product-actions-prominent [class*="Total"],
              .product-actions-prominent [class*="price"],
              .product-actions-prominent [class*="Price"] {
                font-size: 1.25rem !important;
                word-break: break-word;
              }

              .product-detail-container {
                padding-left: 1rem;
                padding-right: 1rem;
              }
              
              /* Prevent long prices overflowing */
              .product-actions-prominent {
                overflow-wrap: break-word;
                word-break: break-word;
              }
              
              /* Breadcrumb mobile */
              nav[aria-label="Breadcrumb"] {
                font-size: 10px;
              }
              
              /* Badges stack on mobile */
              .absolute.left-4.top-4.flex {
                flex-direction: column;
                gap: 6px !important;
              }
              
              /* Price cards: single column on mobile */
              .grid.grid-cols-2.gap-3 {
                grid-template-columns: 1fr !important;
              }
              
              /* Trust icons: reduce size on mobile */
              .mt-5.grid.grid-cols-3.gap-3 {
                grid-template-columns: repeat(2, 1fr) !important;
              }
              
              /* Heading: responsive font sizing */
              h1 {
                font-size: clamp(1.8rem, 5vw, 3rem) !important;
              }

              /* Stock indicator */
              .rounded-2xl.border.border-black {
                padding: 12px 16px;
              }

              /* Available sizes section */
              .mt-4 {
                margin-top: 20px;
              }

              /* Decant price card buttons */
              .rounded-2xl.border-2 {
                padding: 12px;
              }

              /* Product details grid */
              .grid.gap-3.sm\\:grid-cols-4 {
                grid-template-columns: repeat(2, 1fr) !important;
                gap: 12px !important;
              }
            }

            @media (max-width: 480px) {
              .product-actions-prominent button {
                font-size: 13px;
                padding: 10px 14px;
              }

              .product-actions-prominent input,
              .product-actions-prominent select {
                font-size: 16px;
                padding: 10px 12px;
              }

              nav[aria-label="Breadcrumb"] {
                font-size: 9px;
              }

              h1 {
                font-size: clamp(1.5rem, 4vw, 2.5rem) !important;
              }

              .grid.gap-3.sm\\:grid-cols-4 {
                grid-template-columns: 1fr !important;
              }

              .mt-5.grid.grid-cols-3.gap-3 {
                grid-template-columns: 1fr !important;
              }
            }
          `,
        }}
      />

      <main className="min-h-screen overflow-x-clip bg-[#f8f7f3] text-[#1d1b18]">
        {/* Background */}
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 -z-0 overflow-hidden"
        >
          <div className="absolute -left-48 top-10 h-[460px] w-[460px] rounded-full bg-[#b99a61]/[0.08] blur-[90px]" />
          <div className="absolute -right-48 top-[28%] h-[480px] w-[480px] rounded-full bg-[#d6c7a7]/[0.13] blur-[100px]" />
        </div>

        {/* Breadcrumb */}
        <div className="relative z-10 mx-auto max-w-[1320px] px-4 pt-5 sm:px-6 lg:px-10">
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-2 overflow-hidden whitespace-nowrap text-xs font-semibold tracking-[0.1em] text-black/45"
          >
            <Link
              href="/"
              className="shrink-0 transition-colors hover:text-[#94713c]"
            >
              Home
            </Link>

            <span aria-hidden="true">/</span>

            <Link
              href="/shop"
              className="shrink-0 transition-colors hover:text-[#94713c]"
            >
              Shop
            </Link>

            <span aria-hidden="true">/</span>

            <span className="truncate font-medium text-black/70">
              {product.name}
            </span>
          </nav>
        </div>

        {/* Product hero */}
        <section className="relative z-10 mx-auto max-w-[1320px] px-4 pb-10 pt-5 sm:px-6 sm:pt-7 lg:px-10 lg:pb-12 lg:pt-8">
          <div className="grid items-start gap-7 lg:grid-cols-[minmax(320px,0.9fr)_minmax(0,1.1fr)] lg:gap-10 xl:grid-cols-[minmax(420px,0.95fr)_minmax(0,1.05fr)] xl:gap-14">
            {/* Image column */}
            <div className="kyro-rise lg:sticky lg:top-6">
              <div className="group relative overflow-hidden rounded-[26px] border border-black/[0.07] bg-[radial-gradient(ellipse_at_50%_38%,#ffffff_0%,#f3eee4_62%,#e8dfcf_100%)] shadow-[0_22px_60px_rgba(40,32,18,0.09)]">
                <div className="relative aspect-[4/4.3] sm:aspect-square lg:aspect-[4/4.7] xl:aspect-[4/4.5]">
                  {primaryImage ? (
                    <Image
                      src={primaryImage}
                      alt={`${product.name} by ${product.brand}`}
                      fill
                      priority
                      sizes="(max-width: 640px) 94vw, (max-width: 1024px) 70vw, 540px"
                      className="object-contain p-5 transition-transform duration-700 ease-out group-hover:scale-[1.025] sm:p-8"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center font-serif text-7xl text-black/15">
                      ◇
                    </div>
                  )}

                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#8b744f]/[0.08] via-transparent to-white/20" />

                  <div className="absolute left-4 top-4 flex flex-wrap gap-2 sm:left-5 sm:top-5">
                    {product.isFeatured && (
                      <span className="rounded-full border border-[#a88a50]/30 bg-white/90 px-3 py-1.5 text-xs font-bold tracking-[0.1em] text-[#795c2d] shadow-sm backdrop-blur">
                        FEATURED
                      </span>
                    )}

                    {product.isBestSeller && (
                      <span className="rounded-full border border-black/[0.08] bg-white/90 px-3 py-1.5 text-xs font-bold tracking-[0.1em] text-black/70 shadow-sm backdrop-blur">
                        BEST SELLER
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Stock indicator */}
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-black/[0.06] bg-white/80 px-4 py-3 shadow-sm">
                <div className="flex items-center gap-3">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      totalStock > 0
                        ? "bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,.10)]"
                        : "bg-red-500"
                    }`}
                  />

                  <span className="text-sm font-bold text-black/75">
                    {totalStock > 0
                      ? "Available to order"
                      : "Currently sold out"}
                  </span>
                </div>

                <span className="text-sm font-medium text-black/45">
                  {totalStock > 0
                    ? `${totalStock} decants in stock`
                    : "Check back soon"}
                </span>
              </div>

              {/* 5 ml and 10 ml price cards */}
              <div className="mt-4">
                <h2 className="mb-3 text-sm font-bold uppercase tracking-[0.14em] text-black/65 sm:text-[15px]">
                  Available decant sizes
                </h2>

                <div className="grid grid-cols-2 gap-3">
                  {sizesToDisplay.map((size) => {
                    const option = product.decants.find(
                      (decant) => decant.size === size
                    );

                    const isAvailable =
                      Boolean(option) && Number(option?.stock ?? 0) > 0;

                    return (
                      <div
                        key={size}
                        className={`relative rounded-2xl border-2 p-4 sm:p-5 ${
                          isAvailable
                            ? "border-[#b49a68]/55 bg-[#fffdf8] shadow-[0_8px_24px_rgba(65,47,18,.07)]"
                            : "border-black/[0.08] bg-white/55"
                        }`}
                      >
                        {isAvailable && (
                          <span className="absolute right-3 top-3 rounded-full bg-[#eee4d0] px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-[#73592e] sm:text-[11px]">
                            In stock
                          </span>
                        )}

                        <p className="text-sm font-bold uppercase tracking-[0.12em] text-black/50 sm:text-base">
                          {size} ml
                        </p>

                        <p className="mt-2 text-xl font-extrabold tracking-tight text-[#211e19] sm:mt-3 sm:text-[1.75rem]">
                          {option
                            ? `Rs. ${formatPrice(option.price)}`
                            : "N/A"}
                        </p>

                        <p
                          className={`mt-2 text-sm font-semibold ${
                            isAvailable
                              ? "text-emerald-700"
                              : "text-red-600"
                          }`}
                        >
                          {!option
                            ? "Not available"
                            : isAvailable
                              ? `${option.stock} available`
                              : "Out of stock"}
                        </p>
                      </div>
                    );
                  })}
                </div>

                <p className="mt-3 text-sm leading-6 text-black/50">
                  Choose your preferred size in the order section to continue.
                </p>
              </div>
            </div>

            {/* Product information column */}
            <div className="kyro-rise-delay min-w-0">
              <div className="flex items-center gap-3">
                <span className="h-px w-8 bg-[#aa8953]" />

                <p className="text-xs font-bold uppercase tracking-[0.23em] text-[#806537]">
                  {product.brand || "Kyro Parfums"}
                </p>
              </div>

              <h1 className="kyro-product-copy mt-3 max-w-[760px] font-serif text-[clamp(2.25rem,4.2vw,4.2rem)] font-medium leading-[1.02] tracking-[-0.045em] text-[#211e19]">
                {product.name}
              </h1>

              {product.shortDescription && (
                <p className="mt-4 max-w-[720px] text-base leading-7 text-black/60 sm:text-lg">
                  {product.shortDescription}
                </p>
              )}

              {/* Product tags */}
              <div className="mt-5 flex flex-wrap gap-2">
                {product.category && (
                  <span className="rounded-full border border-black/[0.08] bg-white/80 px-3.5 py-2 text-sm font-semibold text-black/65">
                    {product.category}
                  </span>
                )}

                {(product.fragrance.concentration || product.type) && (
                  <span className="rounded-full border border-black/[0.08] bg-white/80 px-3.5 py-2 text-sm font-semibold text-black/65">
                    {product.fragrance.concentration || product.type}
                  </span>
                )}

                {product.fragrance.gender && (
                  <span className="rounded-full border border-black/[0.08] bg-white/80 px-3.5 py-2 text-sm font-semibold text-black/65">
                    {product.fragrance.gender}
                  </span>
                )}
              </div>

              {/* Quick details */}
              {basicDetails.length > 0 && (
                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {basicDetails.map((item) => (
                    <div
                      key={item.label}
                      className="min-w-0 rounded-2xl border border-black/[0.07] bg-white/80 px-3.5 py-4"
                    >
                      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-black/45">
                        {item.label}
                      </p>

                      <p className="mt-2 break-words text-sm font-bold leading-5 text-black/80">
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Full description */}
              {product.description && (
                <div className="mt-6">
                  <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-[#806537]">
                    About this fragrance
                  </h2>

                  <p className="mt-2 max-w-[760px] whitespace-pre-line text-base leading-7 text-black/65">
                    {product.description}
                  </p>
                </div>
              )}

              {/* Purchase section */}
              <div className="mt-7 rounded-[26px] border border-[#b59a65]/35 bg-[#fffdf8] p-5 shadow-[0_15px_45px_rgba(45,35,18,0.08)] sm:p-6">
                <div className="flex flex-wrap items-end justify-between gap-4 border-b border-black/[0.08] pb-5">
                  <div>
                    <p className="text-sm font-bold uppercase tracking-[0.16em] text-black/50">
                      Price starts from
                    </p>

                    <p className="mt-2 text-4xl font-extrabold tracking-[-0.045em] text-[#211e19] sm:text-5xl">
                      Rs. {formatPrice(lowestPrice)}
                    </p>

                    <p className="mt-2 text-sm text-black/55">
                      Final price depends on your selected size and quantity.
                    </p>
                  </div>

                  <span className="rounded-full bg-[#f0e8d8] px-4 py-2 text-sm font-bold text-[#73592e]">
                    {product.decants.length} size
                    {product.decants.length !== 1 ? "s" : ""} listed
                  </span>
                </div>

                <div className="product-actions-prominent mt-5">
                  <ProductActions product={serializedProduct} />
                </div>

                {totalStock <= 0 && (
                  <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                    This fragrance is currently out of stock.
                  </p>
                )}

                {/* Trust information */}
                <div className="mt-5 grid grid-cols-3 gap-3 border-t border-black/[0.08] pt-5">
                  {[
                    {
                      icon: "✦",
                      title: "Authentic",
                      detail: "Genuine fragrance",
                    },
                    {
                      icon: "⌑",
                      title: "Secure",
                      detail: "Secure checkout",
                    },
                    {
                      icon: "↗",
                      title: "Delivery",
                      detail: "Islandwide service",
                    },
                  ].map((item) => (
                    <div key={item.title} className="text-center">
                      <span className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-[#f1eadc] text-base text-[#8c6e3c]">
                        {item.icon}
                      </span>

                      <p className="mt-2 text-sm font-bold text-black/75">
                        {item.title}
                      </p>

                      <p className="mt-1 text-xs leading-4 text-black/45">
                        {item.detail}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Scent notes */}
              {allNotes.length > 0 && (
                <div className="mt-7">
                  <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-[#806537]">
                    Scent profile
                  </h2>

                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    {[
                      {
                        label: "Top notes",
                        notes: product.notes.top,
                      },
                      {
                        label: "Heart notes",
                        notes: product.notes.middle,
                      },
                      {
                        label: "Base notes",
                        notes: product.notes.base,
                      },
                    ]
                      .filter((group) => group.notes.length > 0)
                      .map((group) => (
                        <div
                          key={group.label}
                          className="rounded-2xl border border-black/[0.07] bg-white/80 p-4"
                        >
                          <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#806537]">
                            {group.label}
                          </p>

                          <div className="mt-3 flex flex-wrap gap-2">
                            {group.notes.map((note) => (
                              <span
                                key={note}
                                className="rounded-full border border-black/[0.07] bg-[#f8f6f0] px-3 py-2 text-sm font-medium text-black/70"
                              >
                                {note}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Fragrance details */}
        {detailedInfo.length > 0 && (
          <section className="relative z-10 border-y border-black/[0.07] bg-[#fffefa]">
            <div className="mx-auto max-w-[1320px] px-4 py-10 sm:px-6 lg:px-10 lg:py-14">
              <div className="max-w-2xl">
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#806537]">
                  Fragrance profile
                </p>

                <h2 className="mt-2 font-serif text-3xl tracking-[-0.035em] text-[#211e19] sm:text-4xl">
                  The details behind the scent
                </h2>

                <p className="mt-3 text-base leading-7 text-black/55">
                  Explore the fragrance character, performance, and best
                  occasions to wear it.
                </p>
              </div>

              <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {detailedInfo.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-black/[0.07] bg-[#f8f6f0]/70 p-5 transition-colors hover:bg-white"
                  >
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#806537]">
                      {item.label}
                    </p>

                    <p className="mt-2 break-words text-base font-semibold leading-6 text-black/80">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Browse collection */}
        <section className="relative z-10 overflow-hidden bg-[#1b1915]">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
          >
            <div className="absolute -left-24 top-1/2 h-72 w-72 -translate-y-1/2 rounded-full bg-[#aa8953]/10 blur-[90px]" />
            <div className="absolute -right-24 top-1/2 h-72 w-72 -translate-y-1/2 rounded-full bg-[#aa8953]/10 blur-[90px]" />
          </div>

          <div className="relative mx-auto max-w-[1320px] px-4 py-12 text-center sm:px-6 sm:py-16 lg:px-10">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#c5a56a]">
              Kyro Parfums
            </p>

            <h2 className="mt-3 font-serif text-3xl font-medium tracking-[-0.035em] text-white sm:text-4xl">
              Find your next signature scent
            </h2>

            <p className="mx-auto mt-3 max-w-xl text-base leading-7 text-white/60">
              Explore carefully selected fragrances in convenient decant
              sizes and discover your next favourite scent.
            </p>

            <Link
              href="/shop"
              className="mt-7 inline-flex min-h-12 items-center justify-center gap-3 rounded-full border border-[#c5a56a]/60 bg-[#b99a61] px-7 py-3 text-sm font-bold tracking-[0.1em] text-[#211b10] transition hover:bg-[#d1b77f] focus:outline-none focus:ring-2 focus:ring-[#d1b77f] focus:ring-offset-2 focus:ring-offset-[#1b1915]"
            >
              Browse collection
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </section>

        <Footer />
      </main>
    </>
  );
}