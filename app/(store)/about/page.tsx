import Link from "next/link";
import Footer from "@/app/components/Footer";

export const metadata = {
  title: "About | Kyro Parfums",
  description:
    "Discover the story, philosophy, and fragrance experience behind Kyro Parfums.",
};

/* =========================================================
   DATA
========================================================= */

const experienceCards = [
  {
    number: "01",
    title: "Explore freely.",
    description:
      "Try different fragrances without committing to a large bottle.",
    theme: "light",
  },
  {
    number: "02",
    title: "Carry beautifully.",
    description:
      "Thoughtfully sized decants designed to travel with you, wherever the day takes you.",
    theme: "dark",
  },
  {
    number: "03",
    title: "Find your signature.",
    description:
      "Discover the notes, moods, and memories that feel uniquely yours.",
    theme: "sand",
  },
];

const values = [
  {
    number: "01",
    label: "AUTHENTICITY",
    title: "Only the real thing.",
    description:
      "Every fragrance experience begins with authenticity and quality.",
  },
  {
    number: "02",
    label: "PERSONALITY",
    title: "Fragrance is personal.",
    description:
      "Your scent should tell a story that feels completely your own.",
  },
  {
    number: "03",
    label: "FREEDOM",
    title: "Discover without limits.",
    description:
      "Explore different worlds of fragrance without unnecessary commitment.",
  },
];

/* =========================================================
   PAGE
========================================================= */

export default function AboutPage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f8f6f0] text-[#171717]">
      {/* =====================================================
          ANIMATIONS
      ===================================================== */}

      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes kyroFadeUp {
              from {
                opacity: 0;
                transform: translateY(28px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }

            @keyframes kyroFadeScale {
              from {
                opacity: 0;
                transform: translateY(25px) scale(.97);
              }
              to {
                opacity: 1;
                transform: translateY(0) scale(1);
              }
            }

            @keyframes kyroFloat {
              0%, 100% {
                transform: translateY(0) rotate(0deg);
              }

              50% {
                transform: translateY(-12px) rotate(1deg);
              }
            }

            @keyframes kyroFloatSlow {
              0%, 100% {
                transform: translate(0, 0);
              }

              50% {
                transform: translate(12px, -14px);
              }
            }

            @keyframes kyroPulse {
              0%, 100% {
                opacity: .3;
                transform: scale(1);
              }

              50% {
                opacity: .65;
                transform: scale(1.08);
              }
            }

            @keyframes kyroLine {
              from {
                transform: scaleX(0);
                transform-origin: left;
              }

              to {
                transform: scaleX(1);
                transform-origin: left;
              }
            }

            @keyframes kyroRevealScale {
              from {
                opacity: 0;
                transform: scale(1.05);
              }

              to {
                opacity: 1;
                transform: scale(1);
              }
            }

            .kyro-reveal {
              opacity: 0;
              animation: kyroFadeUp 850ms cubic-bezier(.22,1,.36,1) forwards;
            }

            .kyro-reveal-scale {
              opacity: 0;
              animation: kyroFadeScale 900ms cubic-bezier(.22,1,.36,1) forwards;
            }

            .kyro-delay-1 {
              animation-delay: 100ms;
            }

            .kyro-delay-2 {
              animation-delay: 200ms;
            }

            .kyro-delay-3 {
              animation-delay: 300ms;
            }

            .kyro-delay-4 {
              animation-delay: 400ms;
            }

            .kyro-float {
              animation: kyroFloat 6s ease-in-out infinite;
            }

            .kyro-float-slow {
              animation: kyroFloatSlow 8s ease-in-out infinite;
            }

            .kyro-pulse {
              animation: kyroPulse 5s ease-in-out infinite;
            }

            .kyro-line {
              animation: kyroLine 900ms cubic-bezier(.22,1,.36,1) 450ms both;
            }

            .kyro-reveal-on-hover {
              transition:
                transform 600ms cubic-bezier(.22,1,.36,1),
                box-shadow 600ms ease,
                border-color 400ms ease;
            }

            .kyro-reveal-on-hover:hover {
              transform: translateY(-7px);
            }

            @media (prefers-reduced-motion: reduce) {
              *,
              *::before,
              *::after {
                animation-duration: .01ms !important;
                animation-iteration-count: 1 !important;
                transition-duration: .01ms !important;
                scroll-behavior: auto !important;
              }

              .kyro-reveal,
              .kyro-reveal-scale {
                opacity: 1 !important;
              }
            }
          `,
        }}
      />

      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="relative isolate overflow-hidden px-5 pb-16 pt-14 sm:px-6 sm:pb-20 sm:pt-20 lg:px-8 lg:pb-24 lg:pt-10">
        {/* Ambient background */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-32 top-0 h-[300px] w-[300px] rounded-full bg-[#b08d50]/[0.07] blur-3xl sm:h-[400px] sm:w-[400px]"
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-32 top-0 h-[360px] w-[360px] rounded-full bg-[#d8c6a0]/[0.13] blur-3xl kyro-float-slow sm:h-[470px] sm:w-[470px]"
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-[15%] top-[20%] h-24 w-24 rounded-full border border-[#b08d50]/10 sm:h-32 sm:w-32"
        />

        <div className="relative mx-auto max-w-[1120px]">
          {/* Top meta */}
          <div className="kyro-reveal flex items-center justify-between border-b border-black/[0.07] pb-4">
            <div className="flex items-center gap-3">
              <span className="h-1.5 w-1.5 rounded-full bg-[#aa8953]" />

              <span className="text-[8px] font-semibold tracking-[0.25em] text-black/45 sm:text-[9px]">
                KYRO PARFUMS
              </span>
            </div>

            <span className="hidden text-[8px] tracking-[0.22em] text-black/30 sm:block">
              ABOUT / 01
            </span>
          </div>

          {/* Eyebrow */}
          <div className="kyro-reveal kyro-delay-1 mt-12 flex items-center gap-3 sm:mt-16">
            <span className="h-px w-9 bg-[#b08d50]/70 sm:w-14" />

            <p className="text-[8px] font-semibold tracking-[0.27em] text-black/50 sm:text-[9px]">
              THE KYRO STORY
            </p>
          </div>

          {/* Heading */}
          <div className="kyro-reveal kyro-delay-2 mt-7 max-w-[900px]">
            <h1 className="text-[clamp(3rem,7.2vw,7rem)] font-normal leading-[0.86] tracking-[-0.06em]">
              Fragrance
              <br />

              <span className="ml-[5%] text-[#aa8953]">
                should feel
              </span>

              <br />

              like{" "}
              <em className="font-serif not-italic">
                discovery.
              </em>
            </h1>
          </div>

          {/* Intro */}
          <div className="kyro-reveal kyro-delay-3 mt-12 grid gap-8 lg:mt-16 lg:grid-cols-[1fr_390px] lg:items-end">
            <div>
              <div className="hidden lg:block">
                <div className="flex items-center gap-3">
                  <span className="text-[7px] tracking-[0.22em] text-black/25">
                    EST.
                  </span>

                  <span className="h-px w-8 bg-black/10" />

                  <span className="text-[7px] tracking-[0.22em] text-black/25">
                    2026
                  </span>
                </div>
              </div>
            </div>

            <div>
              <p className="text-[14px] leading-7 text-[#171717]/60 sm:text-[15px]">
                At Kyro Parfums, we believe finding your
                signature scent should feel like a love story —
                not a commitment.
              </p>

              <div className="mt-7 flex items-center gap-3">
                <span className="group flex h-9 w-9 items-center justify-center rounded-full border border-black/10 text-[#aa8953] transition-all duration-500 hover:border-[#aa8953]/40 hover:bg-[#aa8953]/5">
                  <span className="transition-transform duration-500 group-hover:translate-y-1">
                    ↓
                  </span>
                </span>

                <span className="text-[7px] font-semibold tracking-[0.22em] text-black/35">
                  DISCOVER OUR PHILOSOPHY
                </span>
              </div>
            </div>
          </div>

          <div className="kyro-line mt-12 h-px w-full bg-black/[0.07] sm:mt-16" />
        </div>
      </section>

      {/* =====================================================
          PHILOSOPHY
      ===================================================== */}

      <section className="relative border-y border-black/[0.07] bg-[#fffefa] px-5 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-[-120px] top-1/2 h-[300px] w-[300px] -translate-y-1/2 rounded-full bg-[#b08d50]/[0.045] blur-3xl"
        />

        <div className="relative mx-auto max-w-[1120px]">
          <div className="grid gap-12 lg:grid-cols-[250px_1fr] lg:gap-20">
            {/* Left */}
            <div className="kyro-reveal">
              <div className="flex items-center gap-3">
                <span className="h-1.5 w-1.5 rounded-full bg-[#aa8953]" />

                <p className="text-[8px] font-semibold tracking-[0.24em] text-[#aa8953]">
                  01 / THE IDEA
                </p>
              </div>

              <div className="mt-7 hidden h-px w-20 bg-black/10 lg:block" />

              <p className="mt-7 max-w-[230px] text-[11px] leading-6 text-black/40">
                A different way to experience fine fragrance.
              </p>

              <div className="mt-10 hidden lg:block">
                <span className="font-serif text-5xl text-black/[0.045]">
                  01
                </span>
              </div>
            </div>

            {/* Right */}
            <div className="kyro-reveal kyro-delay-1">
              <h2 className="max-w-[800px] text-[clamp(2.1rem,4.3vw,4.5rem)] font-normal leading-[1.02] tracking-[-0.045em]">
                You shouldn't have to buy a{" "}
                <span className="text-[#aa8953]">
                  full bottle
                </span>{" "}
                to discover if a scent belongs to you.
              </h2>

              <div className="mt-8 grid gap-7 sm:grid-cols-2">
                <p className="text-[13px] leading-7 text-black/50 sm:text-[14px]">
                  The world of fine fragrance is vast,
                  expressive, and deeply personal. Yet
                  traditional full-sized bottles often ask
                  you to make a commitment before you have
                  truly experienced the scent.
                </p>

                <p className="text-[13px] leading-7 text-black/50 sm:text-[14px]">
                  Kyro changes that. We make discovering
                  fragrance more personal, more flexible,
                  and much more exciting.
                </p>
              </div>

              <div className="mt-8 flex items-center gap-4">
                <span className="h-px w-10 bg-[#aa8953]" />

                <span className="text-[7px] font-semibold tracking-[0.22em] text-black/35">
                  DISCOVER WITHOUT COMMITMENT
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          EXPERIENCE
      ===================================================== */}

      <section className="relative overflow-hidden bg-[#f8f6f0] px-5 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-[-100px] top-[30%] h-[260px] w-[260px] rounded-full bg-[#d8c6a0]/10 blur-3xl"
        />

        <div className="relative mx-auto max-w-[1120px]">
          {/* Header */}
          <div className="mb-12 flex flex-col justify-between gap-7 sm:mb-14 lg:flex-row lg:items-end">
            <div className="kyro-reveal">
              <div className="flex items-center gap-3">
                <span className="h-1.5 w-1.5 rounded-full bg-[#aa8953]" />

                <p className="text-[8px] font-semibold tracking-[0.24em] text-[#aa8953]">
                  02 / THE EXPERIENCE
                </p>
              </div>

              <h2 className="mt-5 text-[clamp(2.5rem,5vw,4.8rem)] font-normal leading-[0.9] tracking-[-0.05em]">
                Small bottle.
                <br />

                <em className="font-serif text-[#aa8953]">
                  Big discovery.
                </em>
              </h2>
            </div>

            <div className="max-w-[330px] kyro-reveal kyro-delay-1">
              <p className="text-[12px] leading-6 text-black/50">
                Carry beautifully. Sample boldly. Find the
                fragrance that feels like you.
              </p>

              <div className="mt-4 flex items-center gap-3">
                <span className="h-px w-7 bg-[#aa8953]/60" />

                <span className="text-[7px] tracking-[0.18em] text-black/30">
                  THE KYRO EXPERIENCE
                </span>
              </div>
            </div>
          </div>

          {/* Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            {experienceCards.map((card, index) => {
              const themeClasses =
                card.theme === "dark"
                  ? "bg-[#171717] text-white border-white/[0.08]"
                  : card.theme === "sand"
                    ? "bg-[#eee8da] text-[#171717] border-black/[0.06]"
                    : "bg-[#fffefa] text-[#171717] border-black/[0.07]";

              return (
                <div
                  key={card.number}
                  className={`kyro-reveal-scale group relative min-h-[310px] overflow-hidden rounded-[25px] border p-6 transition-all duration-700 hover:-translate-y-2 hover:shadow-[0_25px_60px_rgba(0,0,0,0.10)] sm:p-7 ${themeClasses}`}
                  style={{
                    animationDelay: `${index * 120}ms`,
                  }}
                >
                  <div
                    className={`absolute rounded-full blur-3xl transition-all duration-1000 group-hover:scale-[1.45] ${
                      card.theme === "dark"
                        ? "-bottom-20 -right-20 h-56 w-56 bg-[#b08d50]/10"
                        : "-right-12 -top-12 h-40 w-40 bg-[#b08d50]/[0.055]"
                    }`}
                  />

                  <div className="relative flex items-start justify-between">
                    <span
                      className={`text-[8px] font-semibold tracking-[0.2em] ${
                        card.theme === "dark"
                          ? "text-white/35"
                          : "text-black/30"
                      }`}
                    >
                      {card.number}
                    </span>

                    <span
                      className={`flex h-10 w-10 items-center justify-center rounded-full border transition-all duration-500 group-hover:rotate-45 group-hover:scale-110 ${
                        card.theme === "dark"
                          ? "border-white/15 text-[#d0ad70]"
                          : "border-black/10 text-[#aa8953]"
                      }`}
                    >
                      ↗
                    </span>
                  </div>

                  <div className="relative mt-24">
                    <h3 className="text-[22px] font-normal tracking-[-0.025em]">
                      {card.title}
                    </h3>

                    <p
                      className={`mt-3 text-[12px] leading-6 ${
                        card.theme === "dark"
                          ? "text-white/50"
                          : "text-black/50"
                      }`}
                    >
                      {card.description}
                    </p>
                  </div>

                  <div
                    className={`absolute bottom-6 left-6 h-px w-0 transition-all duration-700 group-hover:w-14 ${
                      card.theme === "dark"
                        ? "bg-[#d0ad70]"
                        : "bg-[#aa8953]"
                    }`}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =====================================================
          STORY
      ===================================================== */}

      <section className="relative overflow-hidden bg-[#fffefa] px-5 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-[1120px]">
          <div className="grid gap-12 lg:grid-cols-[440px_1fr] lg:gap-20">
            {/* Visual */}
            <div className="relative min-h-[450px] overflow-hidden rounded-[28px] bg-[#ede7d9] shadow-[0_25px_60px_rgba(0,0,0,0.06)] sm:min-h-[500px]">
              <div className="absolute left-1/2 top-1/2 h-[260px] w-[260px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#d7c29b]/30 blur-3xl kyro-pulse" />

              <div className="absolute left-1/2 top-1/2 h-[330px] w-[330px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#aa8953]/15" />

              <div className="absolute left-1/2 top-1/2 h-[255px] w-[255px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#aa8953]/10" />

              {/* Bottle */}
              <div className="kyro-float absolute left-1/2 top-1/2 h-[235px] w-[138px] -translate-x-1/2 -translate-y-1/2">
                {/* Cap */}
                <div className="absolute -top-[52px] left-1/2 h-[58px] w-[58px] -translate-x-1/2 rounded-t-[8px] bg-gradient-to-r from-[#111] via-[#3a3a3a] to-[#111] shadow-[0_10px_20px_rgba(0,0,0,0.18)]" />

                {/* Bottle */}
                <div className="relative h-full w-full overflow-hidden rounded-[23px] border border-black/[0.06] bg-gradient-to-b from-[#f8edcf] via-[#e3cd9d] to-[#c4a969] shadow-[0_30px_60px_rgba(75,55,25,0.20)]">
                  <div className="absolute left-4 top-0 h-full w-5 rotate-[8deg] bg-white/20 blur-md" />

                  <div className="absolute left-1/2 top-[68px] w-[100px] -translate-x-1/2 bg-[#fffefa]/80 px-2 py-6 text-center backdrop-blur-sm">
                    <p className="text-[6px] tracking-[0.3em] text-black/40">
                      KYRO
                    </p>

                    <p className="mt-2 font-serif text-lg">
                      KYRO
                    </p>

                    <div className="mx-auto mt-2 h-px w-8 bg-black/15" />

                    <p className="mt-2 text-[5px] tracking-[0.25em] text-black/35">
                      PARFUMS
                    </p>
                  </div>
                </div>
              </div>

              <div className="absolute left-6 top-6 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#aa8953]" />

                <span className="text-[7px] font-semibold tracking-[0.22em] text-black/35">
                  KYRO / 2026
                </span>
              </div>

              <div className="absolute bottom-6 left-6 right-6 flex justify-between">
                <span className="text-[7px] tracking-[0.2em] text-black/30">
                  AUTHENTIC
                </span>

                <span className="text-[7px] tracking-[0.2em] text-black/30">
                  FRAGRANCE
                </span>
              </div>
            </div>

            {/* Story */}
            <div className="flex flex-col justify-center">
              <div className="kyro-reveal">
                <div className="flex items-center gap-3">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#aa8953]" />

                  <p className="text-[8px] font-semibold tracking-[0.24em] text-[#aa8953]">
                    03 / OUR STORY
                  </p>
                </div>

                <h2 className="mt-5 text-[clamp(2.5rem,4.8vw,4.8rem)] font-normal leading-[0.92] tracking-[-0.05em]">
                  Made for your next
                  <br />

                  <em className="font-serif text-[#aa8953]">
                    olfactory obsession.
                  </em>
                </h2>
              </div>

              <div className="kyro-reveal kyro-delay-1 mt-8 space-y-5 text-[13px] leading-7 text-black/50 sm:text-[14px]">
                <p>
                  We source authentic, premium fragrances and
                  decant them thoughtfully into beautifully sized
                  bottles ranging from 2ml to 10ml.
                </p>

                <p>
                  Every fragrance we curate is selected for its
                  quality, character, longevity, and the unique
                  emotion it evokes.
                </p>

                <p>
                  Whether you are looking for a velvet citrus
                  to brighten your morning or a soft musk to
                  carry you into the evening, Kyro is here to
                  help you discover it.
                </p>
              </div>

              <div className="kyro-reveal kyro-delay-2 mt-8 flex items-center gap-4">
                <span className="h-px w-10 bg-[#aa8953]" />

                <span className="text-[7px] font-semibold tracking-[0.2em] text-black/35">
                  FIND WHAT FEELS LIKE YOU
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          VALUES
      ===================================================== */}

      <section className="relative border-y border-black/[0.07] bg-[#f8f6f0] px-5 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-[1120px]">
          {/* Heading */}
          <div className="mb-12 max-w-[650px] kyro-reveal">
            <div className="flex items-center gap-3">
              <span className="h-1.5 w-1.5 rounded-full bg-[#aa8953]" />

              <p className="text-[8px] font-semibold tracking-[0.24em] text-[#aa8953]">
                04 / WHAT WE BELIEVE
              </p>
            </div>

            <h2 className="mt-5 text-[clamp(2.5rem,5vw,4.8rem)] font-normal leading-[0.92] tracking-[-0.05em]">
              Thoughtful
              <br />

              <em className="font-serif text-[#aa8953]">
                by design.
              </em>
            </h2>
          </div>

          {/* Values */}
          <div className="grid border-t border-black/10 md:grid-cols-3">
            {values.map((value, index) => (
              <div
                key={value.number}
                className={`group py-8 ${
                  index === 0
                    ? "md:pr-8"
                    : index === 1
                      ? "border-t border-black/10 md:border-l md:border-t-0 md:px-8"
                      : "border-t border-black/10 md:border-l md:border-t-0 md:pl-8"
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="text-[8px] font-semibold tracking-[0.2em] text-black/30">
                    {value.label}
                  </p>

                  <span className="font-serif text-2xl text-black/[0.06] transition-colors duration-500 group-hover:text-[#aa8953]/20">
                    {value.number}
                  </span>
                </div>

                <h3 className="mt-5 text-[22px] font-normal tracking-[-0.025em]">
                  {value.title}
                </h3>

                <p className="mt-3 max-w-[300px] text-[12px] leading-6 text-black/45">
                  {value.description}
                </p>

                <div className="mt-7 h-px w-7 bg-[#aa8953]/50 transition-all duration-700 group-hover:w-14" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================
          CTA
      ===================================================== */}

      <section className="relative overflow-hidden bg-[#171717] px-5 py-20 text-white sm:px-6 sm:py-24 lg:px-8 lg:py-28">
        <div
          aria-hidden="true"
          className="absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#b08d50]/10 blur-3xl kyro-pulse"
        />

        <div
          aria-hidden="true"
          className="absolute left-1/2 top-1/2 h-[350px] w-[350px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#d0ad70]/[0.07]"
        />

        <div className="relative mx-auto max-w-[900px] text-center">
          <div className="kyro-reveal">
            <div className="flex items-center justify-center gap-3">
              <span className="h-1.5 w-1.5 rounded-full bg-[#d0ad70]" />

              <p className="text-[8px] font-semibold tracking-[0.26em] text-[#d0ad70]">
                YOUR NEXT SCENT AWAITS
              </p>

              <span className="h-1.5 w-1.5 rounded-full bg-[#d0ad70]" />
            </div>

            <h2 className="mt-7 text-[clamp(2.9rem,6.5vw,6.2rem)] font-normal leading-[0.88] tracking-[-0.06em]">
              Ready to find
              <br />

              <em className="font-serif text-[#d0ad70]">
                your scent?
              </em>
            </h2>

            <p className="mx-auto mt-7 max-w-[500px] text-[13px] leading-6 text-white/45">
              Explore our curated collection of authentic
              fragrances and find something that feels
              unmistakably yours.
            </p>

            <Link
              href="/shop"
              className="group mx-auto mt-9 flex w-fit items-center gap-4 rounded-full bg-[#fffefa] px-6 py-3.5 text-[8px] font-semibold tracking-[0.18em] text-[#171717] shadow-[0_10px_35px_rgba(0,0,0,0.18)] transition-all duration-500 hover:-translate-y-1 hover:bg-[#d0ad70] hover:shadow-[0_18px_45px_rgba(176,141,80,0.22)]"
            >
              <span>EXPLORE THE COLLECTION</span>

              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-black/[0.06] transition-all duration-500 group-hover:translate-x-1">
                →
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* =====================================================
          FOOTER
      ===================================================== */}

      <Footer />
    </main>
  );
}

