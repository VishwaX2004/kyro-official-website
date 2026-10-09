"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-black/[0.09] bg-white">
      {/* Decorative glow */}
      <div className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-[#b08d3c]/[0.06] blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-24 h-64 w-64 rounded-full bg-[#b08d3c]/[0.04] blur-3xl" />

      <div className="relative mx-auto max-w-[1200px] px-5 py-12 sm:px-8 md:py-14 lg:px-10">
        {/* Main footer */}
        <div className="grid gap-10 md:grid-cols-[1.2fr_1fr_1fr] md:gap-14">

          {/* Brand */}
          <div className="group">
            <Link href="/" className="inline-block">
              <div className="transition-transform duration-500 group-hover:-translate-y-1">
                <p className="font-serif text-3xl font-semibold tracking-[-0.04em] text-[#111111] sm:text-[34px]">
                  KYRO
                </p>

                <div className="mt-1 flex items-center gap-2">
                  <span className="h-px w-7 bg-[#92774d] transition-all duration-500 group-hover:w-12" />

                  <p className="text-[8px] font-extrabold tracking-[0.3em] text-[#92774d]">
                    PARFUMS
                  </p>
                </div>
              </div>
            </Link>

            <p className="mt-5 max-w-[280px] text-[11px] font-medium leading-6 text-black/60">
              Thoughtfully decanted fragrances for those who appreciate
              character, detail, and timeless scent.
            </p>

            {/* Decorative number */}
            <p className="mt-6 text-[8px] font-bold tracking-[0.3em] text-black/35">
              EST. 2026
            </p>
          </div>

          {/* Navigation */}
          <div>
            <p className="mb-5 text-[9px] font-extrabold tracking-[0.25em] text-black/55">
              EXPLORE
            </p>

            <nav className="flex flex-col items-start gap-3">
              <Link
                href="/shop"
                className="group flex items-center gap-2 text-[10px] font-bold tracking-[0.16em] text-black/70 transition-all duration-300 hover:translate-x-1 hover:text-[#92774d]"
              >
                <span className="h-px w-0 bg-[#92774d] transition-all duration-300 group-hover:w-4" />
                SHOP
              </Link>

              <Link
                href="/about"
                className="group flex items-center gap-2 text-[10px] font-bold tracking-[0.16em] text-black/70 transition-all duration-300 hover:translate-x-1 hover:text-[#92774d]"
              >
                <span className="h-px w-0 bg-[#92774d] transition-all duration-300 group-hover:w-4" />
                ABOUT
              </Link>

              <Link
                href="/contact"
                className="group flex items-center gap-2 text-[10px] font-bold tracking-[0.16em] text-black/70 transition-all duration-300 hover:translate-x-1 hover:text-[#92774d]"
              >
                <span className="h-px w-0 bg-[#92774d] transition-all duration-300 group-hover:w-4" />
                CONTACT
              </Link>
            </nav>
          </div>

          {/* Brand message */}
          <div>
            <p className="mb-5 text-[9px] font-extrabold tracking-[0.25em] text-black/55">
              THE KYRO EDIT
            </p>

            <p className="max-w-[260px] text-[11px] font-medium leading-6 text-black/60">
              Discover fragrances in considered sizes before committing to a
              full bottle.
            </p>

            <Link
              href="/shop"
              className="group mt-6 inline-flex items-center gap-3 border-b border-black/25 pb-2 text-[9px] font-extrabold tracking-[0.2em] text-black/75 transition-all duration-300 hover:border-[#92774d] hover:text-[#92774d]"
            >
              DISCOVER COLLECTION

              <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">
                →
              </span>
            </Link>
          </div>
        </div>

        {/* Divider */}
        <div className="my-10 h-px bg-black/[0.10]" />

        {/* Bottom bar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[9px] font-semibold tracking-[0.05em] text-black/50">
            © {new Date().getFullYear()} Kyro Parfums. All rights reserved.
          </p>

          <div className="flex items-center gap-5">
            <Link
              href="/"
              className="text-[8px] font-bold tracking-[0.18em] text-black/50 transition-colors duration-300 hover:text-[#92774d]"
            >
              HOME
            </Link>

            <span className="h-3 w-px bg-black/15" />

            <Link
              href="/shop"
              className="text-[8px] font-bold tracking-[0.18em] text-black/50 transition-colors duration-300 hover:text-[#92774d]"
            >
              COLLECTION
            </Link>

            <span className="h-3 w-px bg-black/15" />

            <button
              type="button"
              onClick={() =>
                window.scrollTo({
                  top: 0,
                  behavior: "smooth",
                })
              }
              className="group flex items-center gap-2 text-[8px] font-bold tracking-[0.18em] text-black/50 transition-colors duration-300 hover:text-[#92774d]"
            >
              TOP

              <span className="transition-transform duration-300 group-hover:-translate-y-1">
                ↑
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom gold accent */}
      <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-[#92774d]/50 to-transparent" />
    </footer>
  );
}