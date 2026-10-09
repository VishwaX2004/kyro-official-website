import Image from "next/image";
import Link from "next/link";

import { clientPromise } from "@/lib/mongodb";

import ProductCard, {
  type ProductCardProduct,
} from "@/app/components/ProductCard";

import Footer from "@/app/components/Footer";

/* =========================================================
   PRODUCT TYPE
========================================================= */

type Product = ProductCardProduct;

/* =========================================================
   GET PRODUCTS
========================================================= */

async function getProducts(): Promise<Product[]> {
  try {
    const client = await clientPromise;

    const docs = await client
      .db("kyro")
      .collection("products")
      .find({})
      .toArray();

    const products: Product[] = docs.map((p) => ({
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

      category: String(p.category || ""),

      concentration: String(
        p.fragrance?.concentration ?? p.type ?? ""
      ),

      imageUrl: String(p.images?.[0] ?? ""),

      stock:
        (
          p.decants as
            | Array<{
                stock?: number;
              }>
            | undefined
        )?.reduce(
          (sum, decant) =>
            sum + Number(decant.stock ?? 0),
          0
        ) ?? 0,

      featured: Boolean(p.isFeatured),

      shortDescription: String(
        p.shortDescription || p.description || ""
      ),
    }));

    return products;
  } catch (error) {
    console.error(
      "Home page: failed to load products",
      error
    );

    return [];
  }
}

/* =========================================================
   RANDOM PRODUCTS
========================================================= */

async function getRandomProducts(): Promise<Product[]> {
  const products = await getProducts();

  return [...products].sort(
    () => Math.random() - 0.5
  );
}

/* =========================================================
   HOME PAGE
========================================================= */

export default async function HomePage() {
  const products = await getRandomProducts();

  const spotlight = products[0];

  const picks = products.slice(0, 4);

  const more = products.slice(4, 12);

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            /* =====================================================
               KYRO HOME ANIMATIONS
            ===================================================== */

            @keyframes kyroFadeUp {
              from {
                opacity: 0;
                transform: translateY(24px);
              }

              to {
                opacity: 1;
                transform: translateY(0);
              }
            }

            @keyframes kyroFadeIn {
              from {
                opacity: 0;
              }

              to {
                opacity: 1;
              }
            }

            @keyframes kyroHeroImage {
              from {
                opacity: 0;
                transform: scale(.96) translateY(15px);
              }

              to {
                opacity: 1;
                transform: scale(1) translateY(0);
              }
            }

            /* =====================================================
               NEW — HERO IMAGE FLOAT
            ===================================================== */

            @keyframes kyroHeroFloat {
              0%,
              100% {
                transform: translateY(0) rotate(0deg);
              }

              50% {
                transform: translateY(-9px) rotate(.25deg);
              }
            }

            /* =====================================================
               NEW — HERO IMAGE BREATHING
            ===================================================== */

            @keyframes kyroHeroBreath {
              0%,
              100% {
                transform: scale(1);
              }

              50% {
                transform: scale(1.018);
              }
            }

            /* =====================================================
               NEW — DECORATIVE ROTATION
            ===================================================== */

            @keyframes kyroRotateSlow {
              from {
                transform: rotate(0deg);
              }

              to {
                transform: rotate(360deg);
              }
            }

            /* =====================================================
               NEW — DECORATIVE REVERSE ROTATION
            ===================================================== */

            @keyframes kyroRotateReverse {
              from {
                transform: rotate(360deg);
              }

              to {
                transform: rotate(0deg);
              }
            }

            /* =====================================================
               NEW — SOFT BACKGROUND FLOAT
            ===================================================== */

            @keyframes kyroBackgroundFloat {
              0%,
              100% {
                transform: translate3d(0, 0, 0) scale(1);
              }

              33% {
                transform: translate3d(15px, -12px, 0) scale(1.04);
              }

              66% {
                transform: translate3d(-10px, 8px, 0) scale(.98);
              }
            }

            /* =====================================================
               NEW — GLOW BREATH
            ===================================================== */

            @keyframes kyroGlowBreath {
              0%,
              100% {
                opacity: .25;
                transform: scale(.95);
              }

              50% {
                opacity: .65;
                transform: scale(1.1);
              }
            }

            /* =====================================================
               NEW — TEXT SHIMMER
            ===================================================== */

            @keyframes kyroShimmer {
              0% {
                background-position: -200% center;
              }

              100% {
                background-position: 200% center;
              }
            }

            /* =====================================================
               NEW — BUTTON SHINE
            ===================================================== */

            @keyframes kyroButtonShine {
              0% {
                transform: translateX(-140%) skewX(-18deg);
              }

              45%,
              100% {
                transform: translateX(160%) skewX(-18deg);
              }
            }

            /* =====================================================
               NEW — PRODUCT REVEAL
            ===================================================== */

            @keyframes kyroProductReveal {
              from {
                opacity: 0;
                transform: translateY(35px) scale(.97);
                filter: blur(4px);
              }

              to {
                opacity: 1;
                transform: translateY(0) scale(1);
                filter: blur(0);
              }
            }

            /* =====================================================
               NEW — SECTION REVEAL
            ===================================================== */

            @keyframes kyroSectionReveal {
              from {
                opacity: 0;
                transform: translateY(30px);
              }

              to {
                opacity: 1;
                transform: translateY(0);
              }
            }

            /* =====================================================
               NEW — BORDER GLOW
            ===================================================== */

            @keyframes kyroBorderGlow {
              0%,
              100% {
                opacity: .25;
              }

              50% {
                opacity: .65;
              }
            }

            /* =====================================================
               NEW — CTA FLOAT
            ===================================================== */

            @keyframes kyroCtaFloat {
              0%,
              100% {
                transform: translateY(0);
              }

              50% {
                transform: translateY(-5px);
              }
            }

            /* =====================================================
               NEW — SCROLL LINE
            ===================================================== */

            @keyframes kyroScrollLine {
              0% {
                height: 0;
                opacity: 0;
              }

              25% {
                opacity: 1;
              }

              75% {
                height: 14px;
                opacity: 1;
              }

              100% {
                height: 0;
                opacity: 0;
              }
            }

            /* =====================================================
               ORIGINAL ANIMATIONS
            ===================================================== */

            @keyframes kyroDrift {
              0%,
              100% {
                transform: translateY(0);
              }

              50% {
                transform: translateY(-8px);
              }
            }

            @keyframes kyroPulse {
              0%,
              100% {
                opacity: .35;
                transform: scale(1);
              }

              50% {
                opacity: .7;
                transform: scale(1.08);
              }
            }

            @keyframes kyroScroll {
              0% {
                transform: translateY(-5px);
                opacity: 0;
              }

              30% {
                opacity: 1;
              }

              70% {
                opacity: 1;
              }

              100% {
                transform: translateY(6px);
                opacity: 0;
              }
            }

            /* =====================================================
               BASE ANIMATION CLASSES
            ===================================================== */

            .kyro-fade-up {
              animation:
                kyroFadeUp
                .8s
                cubic-bezier(.22,1,.36,1)
                both;
            }

            .kyro-fade-in {
              animation:
                kyroFadeIn
                .9s
                ease
                both;
            }

            .kyro-hero-image {
              animation:
                kyroHeroImage
                1s
                cubic-bezier(.22,1,.36,1)
                .18s
                both;
            }

            /* =====================================================
               NEW — HERO FLOATING
            ===================================================== */

            .kyro-hero-image {
              will-change: transform;
            }

            .kyro-hero-image:hover {
              animation:
                kyroHeroFloat
                4s
                ease-in-out
                infinite;
            }

            /* =====================================================
               NEW — IMAGE INNER BREATHING
            ===================================================== */

            .kyro-hero-image img {
              animation:
                kyroHeroBreath
                7s
                ease-in-out
                infinite;
            }

            .kyro-drift {
              animation:
                kyroDrift
                6s
                ease-in-out
                infinite;
            }

            .kyro-pulse {
              animation:
                kyroPulse
                5s
                ease-in-out
                infinite;
            }

            .kyro-scroll-dot {
              animation:
                kyroScroll
                1.8s
                ease-in-out
                infinite;
            }

            /* =====================================================
               NEW — BACKGROUND DECORATION
            ===================================================== */

            .kyro-hero > div[aria-hidden="true"] {
              will-change: transform;
            }

            .kyro-hero > div[aria-hidden="true"]:nth-child(1) {
              animation:
                kyroRotateSlow
                35s
                linear
                infinite;
            }

            .kyro-hero > div[aria-hidden="true"]:nth-child(2) {
              animation:
                kyroRotateReverse
                28s
                linear
                infinite;
            }

            .kyro-hero > div[aria-hidden="true"]:nth-child(3) {
              animation:
                kyroBackgroundFloat
                14s
                ease-in-out
                infinite;
            }

            /* =====================================================
               NEW — SOFT GLOW
            ===================================================== */

            .kyro-soft-glow {
              animation:
                kyroGlowBreath
                7s
                ease-in-out
                infinite;
            }

            .kyro-soft-glow {
              transition:
                transform .8s ease,
                opacity .8s ease;
            }

            .kyro-hero:hover .kyro-soft-glow {
              transform: scale(1.05);
              opacity: .8;
            }

            /* =====================================================
               PRODUCT SECTION
            ===================================================== */

            .kyro-product-section {
              animation:
                kyroFadeUp
                .75s
                cubic-bezier(.22,1,.36,1)
                both;
            }

            .kyro-product-section:nth-child(2) {
              animation-delay: .08s;
            }

            .kyro-product-section:nth-child(3) {
              animation-delay: .14s;
            }

            .kyro-product-section:nth-child(4) {
              animation-delay: .20s;
            }

            /* =====================================================
               PRODUCT CARDS
            ===================================================== */

            .kyro-product-wrap {
              transition:
                transform .45s cubic-bezier(.22,1,.36,1),
                opacity .45s ease,
                filter .45s ease;
            }

            .kyro-product-wrap:hover {
              transform: translateY(-7px);
            }

            /* =====================================================
               NEW — PRODUCT CARD IMAGE MOTION
            ===================================================== */

            .kyro-product-wrap img {
              transition:
                transform .7s cubic-bezier(.22,1,.36,1),
                filter .7s ease;
            }

            .kyro-product-wrap:hover img {
              transform: scale(1.045);
            }

            /* =====================================================
               NEW — COLLECTION SECTION
            ===================================================== */

            #collection {
              position: relative;
            }

            #collection::before {
              content: "";
              position: absolute;
              left: 10%;
              right: 10%;
              top: 0;
              height: 1px;
              background: linear-gradient(
                90deg,
                transparent,
                rgba(146,119,77,.18),
                transparent
              );
              animation:
                kyroBorderGlow
                4s
                ease-in-out
                infinite;
            }

            /* =====================================================
               NEW — BUTTON SHINE
            ===================================================== */

            .kyro-hero a[href="/shop"],
            .kyro-hero a[href="#collection"] {
              position: relative;
              overflow: hidden;
            }

            .kyro-hero a[href="/shop"]::after,
            .kyro-hero a[href="#collection"]::after {
              content: "";
              position: absolute;
              top: 0;
              bottom: 0;
              left: 0;
              width: 35%;
              background: linear-gradient(
                90deg,
                transparent,
                rgba(255,255,255,.28),
                transparent
              );
              transform: translateX(-140%) skewX(-18deg);
              pointer-events: none;
            }

            .kyro-hero a[href="/shop"]:hover::after,
            .kyro-hero a[href="#collection"]:hover::after {
              animation:
                kyroButtonShine
                .8s
                ease
                forwards;
            }

            /* =====================================================
               NEW — HERO HEADING HOVER
            ===================================================== */

            .kyro-hero h1 em {
              transition:
                letter-spacing .5s ease,
                opacity .5s ease;
            }

            .kyro-hero h1:hover em {
              letter-spacing: -.02em;
              opacity: .88;
            }

            /* =====================================================
               NEW — CTA FLOAT
            ===================================================== */

            section:last-of-type > div {
              transition:
                transform .5s cubic-bezier(.22,1,.36,1),
                box-shadow .5s ease;
            }

            section:last-of-type > div:hover {
              transform: translateY(-4px);
              box-shadow:
                0 30px 80px rgba(23,23,23,.16);
            }

            /* =====================================================
               NEW — CTA DECORATIVE MOVEMENT
            ===================================================== */

            section:last-of-type
              > div
              > div[aria-hidden="true"]:nth-child(1) {
              animation:
                kyroRotateSlow
                40s
                linear
                infinite;
            }

            section:last-of-type
              > div
              > div[aria-hidden="true"]:nth-child(2) {
              animation:
                kyroRotateReverse
                34s
                linear
                infinite;
            }

            section:last-of-type
              > div
              > div[aria-hidden="true"]:nth-child(3) {
              animation:
                kyroGlowBreath
                6s
                ease-in-out
                infinite;
            }

            /* =====================================================
               NEW — SECTION CONTENT MICRO MOTION
            ===================================================== */

            section h2,
            section h3 {
              transition:
                transform .45s cubic-bezier(.22,1,.36,1);
            }

            section h2:hover {
              transform: translateX(3px);
            }

            /* =====================================================
               NEW — LINK ARROW MOTION
            ===================================================== */

            a span {
              will-change: transform;
            }

            /* =====================================================
               NEW — FEATURE NUMBER MOTION
            ===================================================== */

            section span[class*="text-[#92774d]"] {
              transition:
                letter-spacing .4s ease,
                opacity .4s ease;
            }

            section div:hover > span[class*="text-[#92774d]"] {
              letter-spacing: .28em;
            }

            /* =====================================================
               REDUCED MOTION
            ===================================================== */

            @media (prefers-reduced-motion: reduce) {
              *,
              *::before,
              *::after {
                animation-duration: .01ms !important;
                animation-iteration-count: 1 !important;
                scroll-behavior: auto !important;
                transition-duration: .01ms !important;
              }

              .kyro-fade-up,
              .kyro-fade-in,
              .kyro-hero-image,
              .kyro-drift,
              .kyro-pulse,
              .kyro-scroll-dot,
              .kyro-product-section,
              .kyro-soft-glow {
                animation: none !important;
              }

              .kyro-product-wrap,
              .kyro-soft-glow {
                transition: none !important;
              }
            }

            /* =====================================================
               MOBILE
            ===================================================== */

            @media (max-width: 640px) {
              .kyro-mobile-tight {
                padding-left: 20px !important;
                padding-right: 20px !important;
              }

              .kyro-hero-image:hover {
                animation: none;
              }

              .kyro-product-wrap:hover {
                transform: translateY(-3px);
              }
            }

            /* =====================================================
               TABLET / DESKTOP EXTRA MOTION
            ===================================================== */

            @media (min-width: 768px) {
              .kyro-product-wrap {
                animation:
                  kyroProductReveal
                  .8s
                  cubic-bezier(.22,1,.36,1)
                  both;
              }

              .kyro-product-wrap:nth-child(1) {
                animation-delay: .05s;
              }

              .kyro-product-wrap:nth-child(2) {
                animation-delay: .12s;
              }

              .kyro-product-wrap:nth-child(3) {
                animation-delay: .19s;
              }

              .kyro-product-wrap:nth-child(4) {
                animation-delay: .26s;
              }
            }
          `,
        }}
      />

      <main className="min-h-screen overflow-hidden bg-[#f7f3ec] text-[#171717]">

        {/* =====================================================
            HERO
        ===================================================== */}

        <section className="kyro-hero relative overflow-hidden">

          {/* Background decoration */}

          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-32 -top-32 h-[420px] w-[420px] rounded-full border border-[#92774d]/10"
          />

          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-16 -top-16 h-[300px] w-[300px] rounded-full border border-[#92774d]/10"
          />

          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-48 -left-40 h-[430px] w-[430px] rounded-full border border-black/[0.035]"
          />

          <div
            aria-hidden="true"
            className="kyro-soft-glow pointer-events-none absolute left-[40%] top-[35%] h-[300px] w-[300px] rounded-full bg-[#d9c7a9]/20 blur-[100px]"
          />

          {/* Main constrained hero */}

          <div className="mx-auto max-w-[1280px] px-5 sm:px-8 lg:px-10">

            <div className="grid min-h-[calc(100vh-80px)] grid-cols-1 items-start gap-8 py-14 lg:grid-cols-[1fr_.82fr] lg:gap-12 lg:py-16 xl:gap-16">

              {/* =================================================
                  LEFT HERO
              ================================================= */}

              <div className="relative z-10 flex flex-col justify-center">

                <p
                  className="kyro-fade-up text-[9px] font-bold tracking-[0.34em] text-[#92774d]"
                  style={{
                    animationDelay: "0ms",
                  }}
                >
                  KYRO PARFUMS / DECANTS
                </p>

                <h1
                  className="kyro-fade-up mt-6 max-w-[760px] font-serif text-[clamp(3.5rem,7vw,7.2rem)] font-light leading-[.84] tracking-[-.065em]"
                  style={{
                    animationDelay: "80ms",
                  }}
                >
                  Find a scent
                  <br />

                  <em className="not-italic text-[#92774d]">
                    worth keeping.
                  </em>
                </h1>

                <p
                  className="kyro-fade-up mt-7 max-w-[510px] text-[13px] leading-7 text-black/50 sm:text-[14px]"
                  style={{
                    animationDelay: "160ms",
                  }}
                >
                  Discover carefully selected fragrances
                  in thoughtfully sized decants. Explore
                  more scents, find your signature, and
                  wear something that feels distinctly
                  yours.
                </p>

                <div
                  className="kyro-fade-up mt-8 flex flex-wrap items-center gap-3"
                  style={{
                    animationDelay: "240ms",
                  }}
                >

                  <Link
                    href="/shop"
                    className="group inline-flex h-12 items-center justify-center gap-4 rounded-full bg-[#171717] px-7 text-[10px] font-bold tracking-[0.18em] text-white transition-all duration-300 hover:-translate-y-1 hover:bg-[#2d2d2d] hover:shadow-[0_16px_35px_rgba(23,23,23,.18)]"
                  >
                    SHOP FRAGRANCES

                    <span className="transition-transform duration-300 group-hover:translate-x-1">
                      →
                    </span>
                  </Link>

                  <Link
                    href="#collection"
                    className="inline-flex h-12 items-center justify-center rounded-full border border-black/10 bg-white/45 px-7 text-[10px] font-bold tracking-[0.18em] transition-all duration-300 hover:-translate-y-1 hover:border-[#92774d]/40 hover:bg-white hover:shadow-[0_10px_25px_rgba(23,23,23,.06)]"
                  >
                    EXPLORE
                  </Link>

                </div>

                {/* Small information row */}

                <div
                  className="kyro-fade-up mt-10 flex max-w-[610px] flex-wrap gap-x-8 gap-y-4 border-t border-black/10 pt-6 sm:gap-x-10"
                  style={{
                    animationDelay: "320ms",
                  }}
                >

                  <div>
                    <p className="text-[9px] font-bold tracking-[0.2em] text-[#92774d]">
                      01
                    </p>

                    <p className="mt-1 text-[10px] text-black/50">
                      Carefully selected scents
                    </p>
                  </div>

                  <div>
                    <p className="text-[9px] font-bold tracking-[0.2em] text-[#92774d]">
                      02
                    </p>

                    <p className="mt-1 text-[10px] text-black/50">
                      Practical decant sizes
                    </p>
                  </div>

                  <div>
                    <p className="text-[9px] font-bold tracking-[0.2em] text-[#92774d]">
                      03
                    </p>

                    <p className="mt-1 text-[10px] text-black/50">
                      Discover before committing
                    </p>
                  </div>

                </div>

              </div>

              {/* =================================================
                  RIGHT HERO / SPOTLIGHT
              ================================================= */}

              <div className="relative flex items-center justify-center py-8 lg:py-0">

                {/* Decorative circles */}

                <div
                  aria-hidden="true"
                  className="kyro-drift absolute h-[310px] w-[310px] rounded-full border border-[#92774d]/15 sm:h-[430px] sm:w-[430px] lg:h-[480px] lg:w-[480px]"
                />

                <div
                  aria-hidden="true"
                  className="kyro-pulse absolute h-[250px] w-[250px] rounded-full bg-[#e9dfce]/60 blur-3xl sm:h-[350px] sm:w-[350px] lg:h-[410px] lg:w-[410px]"
                />

                {spotlight ? (
                  <div
                    className="kyro-hero-image relative z-10 w-full max-w-[410px]"
                  >

                    <div className="mb-4 flex items-center justify-between px-2">

                      <span className="text-[8px] font-bold tracking-[0.25em] text-[#92774d]">
                        SPOTLIGHT
                      </span>

                      <span className="text-[8px] font-semibold tracking-[0.18em] text-black/30">
                        KYRO COLLECTION
                      </span>

                    </div>

                    <div className="overflow-hidden rounded-[27px] border border-black/[0.06] bg-white/70 p-2.5 shadow-[0_25px_65px_rgba(40,30,20,.10)] backdrop-blur-sm">

                      <div className="relative aspect-[4/5] overflow-hidden rounded-[21px] bg-[#eee8dc]">

                        {spotlight.imageUrl ? (
                          <Image
                            src={spotlight.imageUrl}
                            alt={spotlight.name}
                            fill
                            priority
                            sizes="(max-width: 1024px) 85vw, 410px"
                            className="object-cover transition-transform duration-[1200ms] hover:scale-[1.045]"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center font-serif text-7xl text-black/10">
                            ◇
                          </div>
                        )}

                        {/* Bottom product information */}

                        <div className="absolute inset-x-4 bottom-4">

                          <div className="rounded-[16px] border border-white/30 bg-white/80 p-3.5 shadow-lg backdrop-blur-xl">

                            <p className="text-[8px] font-bold tracking-[0.2em] text-[#806537]">
                              {spotlight.brand.toUpperCase()}
                            </p>

                            <div className="mt-1 flex items-end justify-between gap-3">

                              <h2 className="font-serif text-[21px] font-medium leading-tight">
                                {spotlight.name}
                              </h2>

                              <span className="shrink-0 text-[13px] font-bold">
                                Rs.{" "}
                                {new Intl.NumberFormat(
                                  "en-LK",
                                  {
                                    maximumFractionDigits: 0,
                                  }
                                ).format(
                                  spotlight.price
                                )}
                              </span>

                            </div>

                            <p className="mt-1.5 text-[9px] text-black/45">
                              {[
                                spotlight.size,
                                spotlight.concentration,
                                spotlight.category,
                              ]
                                .filter(Boolean)
                                .join("  ·  ")}
                            </p>

                          </div>

                        </div>

                      </div>

                    </div>

                  </div>
                ) : (
                  <div className="relative z-10 flex h-[460px] w-full max-w-[410px] items-center justify-center rounded-[27px] border border-black/5 bg-white/50">

                    <div className="text-center">

                      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#eee7da] font-serif text-3xl text-black/20">
                        ◇
                      </div>

                      <p className="mt-5 text-[10px] font-bold tracking-[0.2em] text-black/35">
                        COLLECTION COMING SOON
                      </p>

                    </div>

                  </div>
                )}

              </div>

            </div>

            {/* Hero scroll indicator */}

            <div className="hidden justify-center pb-5 lg:flex">

              <div className="flex items-center gap-3 text-[8px] font-bold tracking-[0.25em] text-black/25">

                SCROLL TO EXPLORE

                <span className="flex h-7 w-4 items-start justify-center rounded-full border border-black/15 p-1">

                  <span className="kyro-scroll-dot h-1.5 w-0.5 rounded-full bg-[#92774d]" />

                </span>

              </div>

            </div>

          </div>

        </section>

        {/* =====================================================
            INTRO / BRAND STATEMENT
        ===================================================== */}

        <section className="border-y border-black/[0.06] bg-[#eee8dc]/60">

          <div className="mx-auto max-w-[1120px] px-5 py-16 sm:px-8 lg:px-10 lg:py-20">

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[220px_1fr] lg:gap-14">

              <div>

                <p className="text-[9px] font-bold tracking-[0.28em] text-[#92774d]">
                  THE KYRO APPROACH
                </p>

                <div className="mt-5 hidden h-px w-12 bg-[#92774d]/40 lg:block" />

              </div>

              <div>

                <h2 className="max-w-[850px] font-serif text-[clamp(2.2rem,4.6vw,4.6rem)] font-light leading-[.94] tracking-[-.045em]">

                  Fragrance should be{" "}

                  <em className="text-[#92774d]">
                    experienced,
                  </em>

                  <br className="hidden sm:block" />

                  {" "}not rushed into.

                </h2>

                <p className="mt-7 max-w-[650px] text-[13px] leading-7 text-black/50">
                  Full bottles are commitments. Decants give
                  you the freedom to explore. Kyro brings
                  together carefully selected fragrances in
                  practical sizes so you can discover what
                  truly belongs in your collection.
                </p>

              </div>

            </div>

          </div>

        </section>

        {/* =====================================================
            COLLECTION
        ===================================================== */}

        <section
          id="collection"
          className="kyro-product-section mx-auto max-w-[1200px] px-5 py-18 sm:px-8 lg:px-10 lg:py-24"
        >

          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">

            <div>

              <p className="text-[9px] font-bold tracking-[0.28em] text-[#92774d]">
                01 / COLLECTION
              </p>

              <h2 className="mt-3 font-serif text-[clamp(2.5rem,4.5vw,4.5rem)] font-light leading-none tracking-[-.05em]">
                Featured picks
              </h2>

              <p className="mt-3 max-w-[500px] text-[12px] leading-6 text-black/45">
                A rotating selection from our fragrance
                collection. Discover something new every
                time you visit.
              </p>

            </div>

            <Link
              href="/shop"
              className="group inline-flex items-center gap-3 self-start text-[9px] font-bold tracking-[0.2em] text-black/55 transition hover:text-[#92774d] md:self-auto"
            >
              VIEW ALL

              <span className="transition-transform duration-300 group-hover:translate-x-1">
                →
              </span>
            </Link>

          </div>

          {picks.length > 0 ? (

            <div className="mt-9 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

              {picks.map(
                (product, index) => (
                  <div
                    key={product.id}
                    className="kyro-product-wrap"
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

          ) : (

            <div className="mt-9 rounded-[25px] border border-black/5 bg-white/60 px-6 py-16 text-center">

              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#eee7da] font-serif text-2xl text-black/20">
                ◇
              </div>

              <h3 className="mt-5 font-serif text-3xl font-light">
                The collection is coming soon
              </h3>

              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-black/45">
                We are carefully preparing the first
                Kyro fragrance collection.
              </p>

            </div>

          )}

        </section>

        {/* =====================================================
            MORE FRAGRANCES
        ===================================================== */}

        {more.length > 0 && (

          <section className="border-t border-black/[0.06] bg-[#eee8dc]/45">

            <div className="kyro-product-section mx-auto max-w-[1200px] px-5 py-18 sm:px-8 lg:px-10 lg:py-24">

              <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">

                <div>

                  <p className="text-[9px] font-bold tracking-[0.28em] text-[#92774d]">
                    02 / DISCOVER MORE
                  </p>

                  <h2 className="mt-3 font-serif text-[clamp(2.5rem,4.5vw,4.5rem)] font-light leading-none tracking-[-.05em]">
                    More to explore
                  </h2>

                </div>

                <p className="max-w-[380px] text-[12px] leading-6 text-black/40 md:text-right">
                  More fragrances from the Kyro
                  collection, selected for different
                  moods, occasions, and personalities.
                </p>

              </div>

              <div className="mt-9 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

                {more.map(
                  (product, index) => (
                    <div
                      key={product.id}
                      className="kyro-product-wrap"
                    >
                      <ProductCard
                        product={product}
                        index={index + 4}
                        animation
                      />
                    </div>
                  )
                )}

              </div>

            </div>

          </section>

        )}

        {/* =====================================================
            WHY KYRO
        ===================================================== */}

        <section className="mx-auto max-w-[1120px] px-5 py-18 sm:px-8 lg:px-10 lg:py-24">

          <div className="grid grid-cols-1 gap-12 lg:grid-cols-[.72fr_1.28fr] lg:gap-16">

            <div>

              <p className="text-[9px] font-bold tracking-[0.28em] text-[#92774d]">
                WHY KYRO
              </p>

              <h2 className="mt-4 max-w-[420px] font-serif text-[clamp(2.8rem,5vw,4.8rem)] font-light leading-[.88] tracking-[-.05em]">

                Small
                <br />
                bottles.
                <br />

                <em className="not-italic text-[#92774d]">
                  Big discoveries.
                </em>

              </h2>

            </div>

            <div className="grid grid-cols-1 border-t border-black/10 sm:grid-cols-2">

              <div className="border-b border-black/10 p-6 sm:border-r">

                <span className="text-[9px] font-bold tracking-[0.2em] text-[#92774d]">
                  01
                </span>

                <h3 className="mt-4 font-serif text-[22px]">
                  Explore freely
                </h3>

                <p className="mt-2 text-[12px] leading-6 text-black/45">
                  Try different fragrances without
                  committing to a full-size bottle.
                </p>

              </div>

              <div className="border-b border-black/10 p-6">

                <span className="text-[9px] font-bold tracking-[0.2em] text-[#92774d]">
                  02
                </span>

                <h3 className="mt-4 font-serif text-[22px]">
                  Carry anywhere
                </h3>

                <p className="mt-2 text-[12px] leading-6 text-black/45">
                  Compact decants are easy to keep
                  in your bag, car, office, or travel kit.
                </p>

              </div>

              <div className="border-b border-black/10 p-6 sm:border-r">

                <span className="text-[9px] font-bold tracking-[0.2em] text-[#92774d]">
                  03
                </span>

                <h3 className="mt-4 font-serif text-[22px]">
                  Build your collection
                </h3>

                <p className="mt-2 text-[12px] leading-6 text-black/45">
                  Discover multiple scents and slowly
                  build a fragrance wardrobe that feels
                  personal.
                </p>

              </div>

              <div className="border-b border-black/10 p-6">

                <span className="text-[9px] font-bold tracking-[0.2em] text-[#92774d]">
                  04
                </span>

                <h3 className="mt-4 font-serif text-[22px]">
                  Find your signature
                </h3>

                <p className="mt-2 text-[12px] leading-6 text-black/45">
                  Wear a fragrance long enough to know
                  whether it really belongs to you.
                </p>

              </div>

            </div>

          </div>

        </section>

        {/* =====================================================
            CTA
        ===================================================== */}

        <section className="px-4 pb-16 sm:px-6 lg:px-8 lg:pb-20">

          <div className="relative mx-auto max-w-[1200px] overflow-hidden rounded-[28px] bg-[#171717] px-6 py-16 text-white sm:px-10 lg:px-14 lg:py-20">

            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-28 -top-28 h-[360px] w-[360px] rounded-full border border-white/10"
            />

            <div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-40 -left-28 h-[400px] w-[400px] rounded-full border border-white/[0.06]"
            />

            <div
              aria-hidden="true"
              className="pointer-events-none absolute right-[15%] top-[30%] h-32 w-32 rounded-full bg-[#92774d]/10 blur-3xl"
            />

            <div className="relative z-10 max-w-[680px]">

              <p className="text-[9px] font-bold tracking-[0.3em] text-[#c8a96b]">
                YOUR NEXT SCENT IS WAITING
              </p>

              <h2 className="mt-4 font-serif text-[clamp(3rem,6vw,5.8rem)] font-light leading-[.88] tracking-[-.06em]">

                Start exploring
                <br />

                <em className="not-italic text-[#c8a96b]">
                  Kyro.
                </em>

              </h2>

              <p className="mt-6 max-w-[520px] text-[12px] leading-7 text-white/50">
                Discover fragrances in sizes designed
                for exploration. Find something you love
                before making it part of your everyday
                collection.
              </p>

              <Link
                href="/shop"
                className="group mt-8 inline-flex h-12 items-center gap-4 rounded-full bg-white px-7 text-[10px] font-bold tracking-[0.18em] text-[#171717] transition-all duration-300 hover:-translate-y-1 hover:bg-[#f5eee2] hover:shadow-[0_15px_35px_rgba(255,255,255,.12)]"
              >
                EXPLORE THE COLLECTION

                <span className="transition-transform duration-300 group-hover:translate-x-1">
                  →
                </span>
              </Link>

            </div>

          </div>

        </section>

      </main>

      {/* =====================================================
          EXTRACTED FOOTER COMPONENT
      ===================================================== */}

      <Footer />
    </>
  );
}