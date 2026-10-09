import ContactForm from "./ContactForm";
import Footer from "@/app/components/Footer";

export const metadata = {
  title: "Contact | Kyro Parfums",
  description:
    "Get in touch with Kyro Parfums. We're here to help with fragrances, orders, and recommendations.",
};

export default function ContactPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f8f6f0] text-[#171717]">
      {/* Decorative background */}
      <div className="pointer-events-none fixed inset-0 -z-0 overflow-hidden">
        <div className="absolute -left-32 top-32 h-72 w-72 rounded-full bg-[#b08d50]/10 blur-3xl" />
        <div className="absolute -right-32 top-[45%] h-96 w-96 rounded-full bg-[#d6bd8b]/10 blur-3xl" />
      </div>

      {/* Hero */}
      <section className="relative z-10 mx-auto max-w-7xl px-5 pb-16 pt-0 sm:px-8 sm:pt-20 lg:px-12 lg:pb-24 lg:pt-12">
        <div className="grid items-center gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          {/* LEFT */}
          <div className="animate-[fadeUp_.7s_ease-out_both]">
            <div className="mb-7 flex items-center gap-3">
              <span className="h-px w-10 bg-[#b08d50]" />

              <span className="text-[10px] font-semibold tracking-[0.3em] text-[#8d7144]">
                GET IN TOUCH
              </span>
            </div>

            <h1 className="max-w-xl font-serif text-[3.5rem] leading-[0.95] tracking-[-0.045em] sm:text-[4.5rem] lg:text-[5.3rem]">
              Let&apos;s talk
              <br />
              <span className="italic text-[#a58551]">fragrance.</span>
            </h1>

            <p className="mt-8 max-w-lg text-[15px] leading-7 text-black/55 sm:text-base">
              Have a question about a fragrance? Need help with an order?
              Looking for your next signature scent? Our scent specialists are
              here to help.
            </p>

            {/* Info cards */}
            <div className="mt-10 grid max-w-lg gap-3 sm:grid-cols-2">
              <div className="group rounded-2xl border border-black/[0.07] bg-white/70 p-5 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#b08d50]/30 hover:shadow-[0_15px_40px_rgba(0,0,0,0.07)]">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-[#171717] text-white transition-transform duration-300 group-hover:scale-110">
                  <svg
                    width="17"
                    height="17"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                    <path d="m3 7 9 6 9-6" />
                  </svg>
                </div>

                <p className="text-[10px] font-semibold tracking-[0.2em] text-black/35">
                  EMAIL
                </p>

                <p className="mt-1 text-sm font-medium text-black/75">
                  hello@kyroparfums.com
                </p>
              </div>

              <div className="group rounded-2xl border border-black/[0.07] bg-white/70 p-5 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#b08d50]/30 hover:shadow-[0_15px_40px_rgba(0,0,0,0.07)]">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-[#b08d50]/15 text-[#96733d] transition-transform duration-300 group-hover:scale-110">
                  <svg
                    width="17"
                    height="17"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 7v5l3 2" />
                  </svg>
                </div>

                <p className="text-[10px] font-semibold tracking-[0.2em] text-black/35">
                  RESPONSE TIME
                </p>

                <p className="mt-1 text-sm font-medium text-black/75">
                  Within 24 hours
                </p>
              </div>
            </div>

            {/* Small quote */}
            <div className="mt-10 border-l border-[#b08d50]/50 pl-5">
              <p className="font-serif text-lg italic text-black/55">
                &quot;Every scent tells a story.&quot;
              </p>

              <p className="mt-2 text-[9px] font-semibold tracking-[0.25em] text-[#a58551]">
                KYRO PARFUMS
              </p>
            </div>
          </div>

          {/* RIGHT FORM */}
          <div className="relative animate-[fadeUp_.8s_.1s_ease-out_both]">
            {/* Decorative circle */}
            <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full border border-[#b08d50]/20 sm:-right-14 sm:-top-14 sm:h-44 sm:w-44" />

            <div className="relative overflow-hidden rounded-[28px] border border-black/[0.07] bg-white/90 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.08)] backdrop-blur-xl sm:p-8 lg:p-10">
              {/* Form heading */}
              <div className="mb-8">
                <div className="mb-3 flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#b08d50]" />

                  <span className="text-[9px] font-semibold tracking-[0.25em] text-black/35">
                    SEND A MESSAGE
                  </span>
                </div>

                <h2 className="font-serif text-3xl tracking-[-0.02em] sm:text-4xl">
                  How can we help?
                </h2>

                <p className="mt-3 text-sm leading-6 text-black/45">
                  Tell us what&apos;s on your mind and we&apos;ll get back to
                  you as soon as possible.
                </p>
              </div>

              <ContactForm />
            </div>
          </div>
        </div>
      </section>

      {/* Global animation — NOT styled-jsx */}
      <style>{`
        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(22px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      <Footer />
    </main>
  );
}