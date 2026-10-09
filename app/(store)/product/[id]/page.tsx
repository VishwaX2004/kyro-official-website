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
  new Intl.NumberFormat("en-LK", { maximumFractionDigits: 0 }).format(price);

export const getDiscount = (
  labelledPrice: number | undefined,
  price: number
): number => {
  if (!labelledPrice || labelledPrice <= price) return 0;
  return Math.round(((labelledPrice - price) / labelledPrice) * 100);
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
      images: Array.isArray(doc.images) ? doc.images.map(String) : [],
      decants: Array.isArray(doc.decants)
        ? (doc.decants as Decant[]).map((d) => ({
            size: Number(d.size),
            unit: String(d.unit),
            labelledPrice:
              d.labelledPrice !== undefined ? Number(d.labelledPrice) : undefined,
            price: Number(d.price),
            stock: Number(d.stock),
          }))
        : [],
      notes: {
        top: Array.isArray(doc.notes?.top) ? doc.notes.top.map(String) : [],
        middle: Array.isArray(doc.notes?.middle)
          ? doc.notes.middle.map(String)
          : [],
        base: Array.isArray(doc.notes?.base) ? doc.notes.base.map(String) : [],
      },
      fragrance: {
        gender: String(doc.fragrance?.gender ?? doc.category ?? ""),
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
    return { title: "Product Not Found | Kyro Parfums" };
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
   PAGE (Server Component)
========================================================= */

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) notFound();

  /* ---------- derived values (server-side) ---------- */

  const primaryImage = product.images[0] ?? "";

  const totalStock = product.decants.reduce(
    (total, d) => total + Number(d.stock ?? 0),
    0
  );

  const lowestPrice =
    product.decants.length > 0
      ? Math.min(...product.decants.map((d) => Number(d.price ?? 0)))
      : 0;

  const allNotes = [
    ...product.notes.top,
    ...product.notes.middle,
    ...product.notes.base,
  ];

  const basicDetails = [
    {
      label: "TYPE",
      value: product.fragrance.concentration || product.type,
    },
    {
      label: "GENDER",
      value: product.fragrance.gender || product.category,
    },
    { label: "LONGEVITY", value: product.fragrance.longevity },
    { label: "SILLAGE", value: product.fragrance.sillage },
  ].filter((item) => item.value);

  const detailedInfo = [
    {
      label: "Concentration",
      value: product.fragrance.concentration || product.type,
    },
    {
      label: "Gender",
      value: product.fragrance.gender || product.category,
    },
    { label: "Longevity", value: product.fragrance.longevity },
    { label: "Sillage", value: product.fragrance.sillage },
    {
      label: "Season",
      value: product.fragrance.season.join(", "),
    },
    {
      label: "Occasion",
      value: product.fragrance.occasion.join(", "),
    },
  ].filter((item) => item.value);

  /* ---------- serialized product for client component ---------- */

  const serializedProduct: SerializedProduct = {
    id: product.id,
    name: product.name,
    brand: product.brand,
    images: product.images,
    decants: product.decants,
    isFeatured: product.isFeatured,
    isBestSeller: product.isBestSeller,
  };

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes fadeInUp {
              from { opacity: 0; transform: translateY(16px); }
              to   { opacity: 1; transform: translateY(0); }
            }
            .kyro-fade-in { animation: fadeInUp 0.55s ease both; }
            .kyro-fade-in-delay { animation: fadeInUp 0.55s ease 0.12s both; }
          `,
        }}
      />

      <main className="min-h-screen overflow-x-hidden bg-[#f8f6f0] text-[#171717]">

        {/* ── Ambient background ── */}
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 -z-0 overflow-hidden"
        >
          <div className="absolute -left-40 top-0 h-[400px] w-[400px] rounded-full bg-[#b08d50]/[0.045] blur-3xl" />
          <div className="absolute -right-40 top-[30%] h-[400px] w-[400px] rounded-full bg-[#d6bd8b]/[0.05] blur-3xl" />
        </div>

        {/* ════════════════════════════════════════════════════
            BREADCRUMB
        ════════════════════════════════════════════════════ */}
        <div className="relative z-10 mx-auto max-w-[1120px] px-5 pt-3 sm:px-6 lg:px-7">
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-2 overflow-hidden whitespace-nowrap text-[8px] font-semibold tracking-[0.15em] text-black/45"
          >
            <Link
              href="/"
              className="shrink-0 transition-colors hover:text-[#aa8953]"
            >
              HOME
            </Link>
            <span className="text-black/20">/</span>
            <Link
              href="/shop"
              className="shrink-0 transition-colors hover:text-[#aa8953]"
            >
              SHOP
            </Link>
            <span className="text-black/20">/</span>
            <span className="truncate text-black/65">{product.name}</span>
          </nav>
        </div>

        {/* ════════════════════════════════════════════════════
            PRODUCT HERO
        ════════════════════════════════════════════════════ */}
        <section className="relative z-10 mx-auto max-w-[1120px] px-5 pb-7 pt-4 sm:px-6 lg:px-7 lg:pb-8 lg:pt-5">
          <div className="grid items-start gap-6 lg:grid-cols-[340px_minmax(0,1fr)] lg:gap-8 xl:grid-cols-[365px_minmax(0,1fr)] xl:gap-9">

            {/* ── LEFT: Image ── */}
            <div className="kyro-fade-in">
              <div className="relative overflow-hidden rounded-[20px] border border-black/[0.07] bg-[radial-gradient(circle_at_50%_40%,#fff_0%,#f4f0e8_58%,#e8e1d4_100%)] shadow-[0_16px_40px_rgba(0,0,0,0.06)]">
                <div className="relative aspect-square">
                  {primaryImage ? (
                    <Image
                      src={primaryImage}
                      alt={product.name}
                      fill
                      priority
                      sizes="(max-width: 1024px) 90vw, 365px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center font-serif text-6xl text-black/10">
                      ◇
                    </div>
                  )}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-black/[0.035]" />
                </div>
              </div>

              {/* Badges */}
              <div className="mt-2 flex flex-wrap gap-1.5">
                {product.isFeatured && (
                  <span className="rounded-full border border-[#aa8953]/30 bg-[#aa8953]/10 px-2.5 py-1 text-[7px] font-bold tracking-[0.14em] text-[#806537]">
                    FEATURED
                  </span>
                )}
                {product.isBestSeller && (
                  <span className="rounded-full border border-black/10 bg-black/[0.045] px-2.5 py-1 text-[7px] font-bold tracking-[0.14em] text-black/65">
                    BEST SELLER
                  </span>
                )}
                <span
                  className={`rounded-full px-2.5 py-1 text-[7px] font-bold tracking-[0.14em] ${
                    totalStock > 0
                      ? "border border-green-500/20 bg-green-50 text-green-700"
                      : "border border-red-400/20 bg-red-50 text-red-600"
                  }`}
                >
                  {totalStock > 0 ? `${totalStock} IN STOCK` : "OUT OF STOCK"}
                </span>
              </div>
            </div>

            {/* ── RIGHT: Info ── */}
            <div className="kyro-fade-in-delay min-w-0">

              {/* Brand */}
              <div className="flex items-center gap-2">
                <span className="h-px w-6 bg-[#aa8953]" />
                <p className="text-[8px] font-bold tracking-[0.25em] text-[#806537]">
                  {product.brand.toUpperCase()}
                </p>
              </div>

              {/* Product name */}
              <h1 className="mt-2 max-w-[700px] font-serif text-[clamp(1.9rem,3.3vw,3.05rem)] font-normal leading-[0.98] tracking-[-0.045em]">
                {product.name}
              </h1>

              {/* Short description */}
              {product.shortDescription && (
                <p className="mt-2.5 max-w-[680px] text-[11px] leading-5 text-black/55">
                  {product.shortDescription}
                </p>
              )}

              {/* Meta pills */}
              {basicDetails.length > 0 && (
                <div className="mt-3 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                  {basicDetails.map((item) => (
                    <div
                      key={item.label}
                      className="min-w-0 rounded-[10px] border border-black/[0.065] bg-white/70 px-2.5 py-2"
                    >
                      <p className="text-[6.5px] font-bold tracking-[0.16em] text-black/35">
                        {item.label}
                      </p>
                      <p className="mt-0.5 truncate text-[9px] font-semibold text-black/75">
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Full description */}
              {product.description && (
                <div className="mt-3">
                  <p className="text-[7px] font-bold tracking-[0.2em] text-[#806537]">
                    ABOUT THIS FRAGRANCE
                  </p>
                  <p className="mt-1 max-w-[700px] text-[11px] leading-5 text-black/60">
                    {product.description}
                  </p>
                </div>
              )}

              <div className="my-3.5 h-px bg-black/[0.08]" />

              {/* Price overview */}
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-[7px] font-bold tracking-[0.2em] text-black/45">
                    AVAILABLE FROM
                  </p>
                  <div className="mt-0.5 flex items-baseline gap-2">
                    <span className="text-[23px] font-bold tracking-[-0.03em]">
                      Rs.&nbsp;{formatPrice(lowestPrice)}
                    </span>
                    <span className="text-[9px] text-black/40">onwards</span>
                  </div>
                </div>
                <p className="text-[8px] font-semibold text-black/40">
                  {product.decants.length} size
                  {product.decants.length !== 1 ? "s" : ""}
                </p>
              </div>

              {/* ── Client Component: size picker + quantity + add to cart ── */}
              <ProductActions product={serializedProduct} />

              {/* Trust strip */}
              <div className="mt-2 grid grid-cols-3 gap-1.5">
                {["Authentic fragrance", "Secure checkout", "Fast delivery"].map(
                  (item) => (
                    <div
                      key={item}
                      className="flex items-center justify-center rounded-[9px] border border-black/[0.05] bg-white/45 px-1.5 py-1.5"
                    >
                      <span className="text-center text-[6.5px] font-semibold text-black/45">
                        ✦ {item}
                      </span>
                    </div>
                  )
                )}
              </div>
            </div>

          </div>
        </section>

        {/* ════════════════════════════════════════════════════
            QUICK DETAILS BAR
        ════════════════════════════════════════════════════ */}
        <section className="relative z-10 border-y border-black/[0.07] bg-[#fffefa]">
          <div className="mx-auto max-w-[1120px] px-5 py-5 sm:px-6 lg:px-7">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                { label: "BRAND", value: product.brand || "Kyro Parfums" },
                { label: "CATEGORY", value: product.category || "Fragrance" },
                {
                  label: "SIZES",
                  value:
                    product.decants.length > 0
                      ? product.decants
                          .map((d) => `${d.size}${d.unit}`)
                          .join(" · ")
                      : "N/A",
                },
                {
                  label: "STOCK",
                  value:
                    totalStock > 0
                      ? `${totalStock} available`
                      : "Sold out",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-[12px] border border-black/[0.06] bg-[#f8f6f0] px-3 py-2.5"
                >
                  <p className="text-[6.5px] font-bold tracking-[0.17em] text-black/35">
                    {item.label}
                  </p>
                  <p className="mt-0.5 text-[10px] font-semibold text-black/75">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════
            FRAGRANCE NOTES
        ════════════════════════════════════════════════════ */}
        {allNotes.length > 0 && (
          <section className="relative z-10">
            <div className="mx-auto max-w-[1120px] px-5 py-7 sm:px-6 lg:px-7 lg:py-9">
              <div className="mb-4">
                <div className="flex items-center gap-3">
                  <span className="h-px w-7 bg-[#aa8953]" />
                  <p className="text-[8px] font-bold tracking-[0.24em] text-[#806537]">
                    FRAGRANCE NOTES
                  </p>
                </div>
                <h2 className="mt-1.5 font-serif text-xl tracking-[-0.03em] sm:text-2xl">
                  The scent journey
                </h2>
              </div>

              <div className="grid gap-2.5 md:grid-cols-3">
                {[
                  {
                    label: "TOP NOTES",
                    notes: product.notes.top,
                    number: "01",
                  },
                  {
                    label: "HEART NOTES",
                    notes: product.notes.middle,
                    number: "02",
                  },
                  {
                    label: "BASE NOTES",
                    notes: product.notes.base,
                    number: "03",
                  },
                ]
                  .filter((group) => group.notes.length > 0)
                  .map((group) => (
                    <div
                      key={group.label}
                      className="rounded-[15px] border border-black/[0.07] bg-white/65 p-3.5"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-[8px] font-bold tracking-[0.18em] text-[#806537]">
                          {group.label}
                        </p>
                        <span className="font-serif text-base text-[#aa8953]/50">
                          {group.number}
                        </span>
                      </div>
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {group.notes.map((note) => (
                          <span
                            key={note}
                            className="rounded-full border border-black/[0.07] bg-[#f8f6f0] px-2.5 py-1 text-[9px] font-semibold text-black/65"
                          >
                            {note}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </section>
        )}

        {/* ════════════════════════════════════════════════════
            FRAGRANCE DETAILS
        ════════════════════════════════════════════════════ */}
        {detailedInfo.length > 0 && (
          <section className="relative z-10 border-t border-black/[0.07] bg-[#fffefa]">
            <div className="mx-auto max-w-[1120px] px-5 py-7 sm:px-6 lg:px-7 lg:py-9">
              <div className="mb-4">
                <div className="flex items-center gap-3">
                  <span className="h-px w-7 bg-[#aa8953]" />
                  <p className="text-[8px] font-bold tracking-[0.24em] text-[#806537]">
                    FRAGRANCE DETAILS
                  </p>
                </div>
                <h2 className="mt-1.5 font-serif text-xl tracking-[-0.03em] sm:text-2xl">
                  Everything you need to know
                </h2>
              </div>

              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {detailedInfo.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-[12px] border border-black/[0.07] bg-white/70 px-3.5 py-3"
                  >
                    <p className="text-[7px] font-bold tracking-[0.18em] text-[#806537]">
                      {item.label.toUpperCase()}
                    </p>
                    <p className="mt-1 text-[11px] font-semibold text-black/75">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ════════════════════════════════════════════════════
            CTA DARK STRIP
        ════════════════════════════════════════════════════ */}
        <section className="relative z-10 overflow-hidden bg-[#171717]">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -left-20 top-1/2 h-56 w-56 -translate-y-1/2 rounded-full bg-[#aa8953]/[0.08] blur-3xl" />
            <div className="absolute -right-20 top-1/2 h-56 w-56 -translate-y-1/2 rounded-full bg-[#aa8953]/[0.06] blur-3xl" />
          </div>

          <div className="relative mx-auto max-w-[1120px] px-5 py-10 text-center sm:px-6 lg:px-7 lg:py-12">
            <p className="text-[8px] font-bold tracking-[0.3em] text-[#aa8953]">
              KYRO PARFUMS
            </p>
            <h2 className="mt-2 font-serif text-2xl font-normal tracking-[-0.03em] text-white sm:text-3xl">
              Explore the full Kyro collection
            </h2>
            <p className="mx-auto mt-2 max-w-[400px] text-[11px] leading-5 text-white/50">
              Discover more carefully curated fragrances — from daring
              ouds to delicate florals.
            </p>
            <Link
              href="/shop"
              className="mt-6 inline-flex items-center gap-3 rounded-full border border-[#aa8953]/40 bg-[#aa8953]/10 px-7 py-3 text-[9px] font-bold tracking-[0.2em] text-[#d4a853] transition-all hover:bg-[#aa8953]/20 hover:border-[#aa8953]/70"
            >
              BROWSE COLLECTION
              <span>→</span>
            </Link>
          </div>
        </section>

        <Footer />
      </main>
    </>
  );
}
