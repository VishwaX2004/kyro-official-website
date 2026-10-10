"use client";

import { FormEvent, useState } from "react";
import { Mail, Phone, MessageCircle, Send, CheckCircle, ArrowRight, Sparkles } from "lucide-react";
import toast from "react-hot-toast";
import WhatsAppButton from "@/app/components/WhatsAppButton";

type ContactFormData = {
  name: string;
  email: string;
  subject: string;
  message: string;
  phone?: string;
};

export default function ContactPage() {
  const [formData, setFormData] = useState<ContactFormData>({
    name: "",
    email: "",
    subject: "",
    message: "",
    phone: "",
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          subject: formData.subject,
          message: formData.message,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || "Failed to send message");
      }

      toast.success("Thank you! We'll be in touch within 24 hours.");
      setSubmitted(true);
      setFormData({
        name: "",
        email: "",
        subject: "",
        message: "",
        phone: "",
      });

      // Reset after 3 seconds
      setTimeout(() => {
        setSubmitted(false);
      }, 3000);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to send message. Please try again.";
      toast.error(errorMsg);
      console.error("Contact form error:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
    <main className="relative min-h-screen overflow-hidden bg-[#f8f6f0] text-[#171717]">
      <style jsx>{`
        @media (max-width: 768px) {
          .grid.items-start.gap-8.lg\\:grid-cols-\\[1fr_340px\\] {
            grid-template-columns: 1fr !important;
          }
          
          .grid.gap-5.sm\\:grid-cols-2 {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }
          
          section {
            padding-left: 1rem !important;
            padding-right: 1rem !important;
          }
          
          input,
          textarea {
            min-height: 44px !important;
            font-size: 16px !important;
          }
          
          button {
            min-height: 44px !important;
          }
          
          .overflow-hidden.rounded-\\[26px\\] {
            border-radius: 20px !important;
          }
        }
        
        @media (max-width: 480px) {
          h1 {
            font-size: 1.5rem !important;
            line-height: 1.3;
          }
          
          textarea {
            min-height: 120px !important;
            rows: 4;
          }
          
          .flex.flex-col-reverse.gap-3 {
            flex-direction: column !important;
            gap: 10px !important;
          }
          
          .flex.flex-col-reverse.gap-3 button {
            width: 100% !important;
          }
        }

        @media (max-width: 375px) {
          h1 {
            font-size: 1.3rem !important;
          }

          p {
            font-size: 14px !important;
          }

          .grid.gap-5.sm\\:grid-cols-2 {
            gap: 10px !important;
          }

          input,
          textarea {
            font-size: 16px !important;
            min-height: 40px !important;
          }

          button {
            min-height: 40px !important;
            font-size: 12px !important;
          }

          .overflow-hidden.rounded-\\[26px\\] {
            border-radius: 16px !important;
          }
        }
      `}</style>
      {/* Soft, fixed brand glows */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -left-32 top-24 h-72 w-72 rounded-full bg-[#b08d50]/10 blur-3xl" />
        <div className="absolute -right-40 top-[38rem] h-96 w-96 rounded-full bg-[#d6bd8b]/15 blur-3xl" />
      </div>

      <section className="relative mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 sm:pb-20 sm:pt-12 lg:px-10 lg:pb-24 lg:pt-16">
        {/* Hero section */}
        <div className="mb-12 text-center sm:mb-16 lg:mb-20">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#b08d50]/20 bg-white/50 px-4 py-2 text-[10px] font-semibold tracking-[0.2em] text-[#a58551]">
            <Sparkles className="h-3.5 w-3.5" />
            GET IN TOUCH
          </div>
          <h1 className="mx-auto mb-4 max-w-3xl font-serif text-4xl leading-tight tracking-[-0.045em] sm:text-5xl lg:text-6xl">
            Let's talk about your <span className="italic text-[#b08d50]">scent story.</span>
          </h1>
          <p className="mx-auto max-w-2xl text-base leading-relaxed text-black/50 sm:text-lg sm:leading-relaxed">
            Have questions, feedback, or just want to say hello? We'd love to hear from you. Drop us a message and we'll get back to you within 24 hours.
          </p>
        </div>

        {/* Form section */}
        <div className="grid items-start gap-8 lg:grid-cols-[1fr_340px]">
          {/* Contact form */}
          <div className="overflow-hidden rounded-[26px] border border-black/[0.07] bg-white/90 shadow-[0_18px_60px_rgba(0,0,0,0.045)] backdrop-blur-xl">
            {submitted ? (
              <div className="flex min-h-[500px] flex-col items-center justify-center px-6 py-12 text-center sm:px-8">
                <div className="mb-6 rounded-full bg-emerald-50 p-4">
                  <CheckCircle className="h-12 w-12 text-emerald-600" strokeWidth={1.5} />
                </div>
                <h2 className="mb-2 font-serif text-2xl sm:text-3xl">Thank you!</h2>
                <p className="mb-6 text-sm leading-relaxed text-black/50 sm:text-base">
                  Your message has been received. We'll review it and get back to you soon.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="inline-flex items-center gap-2 rounded-xl border border-[#b08d50]/35 bg-[#b08d50]/10 px-5 py-3 text-sm font-medium text-[#765b30] transition hover:border-[#b08d50]/60 hover:bg-[#b08d50]/20 focus:outline-none focus:ring-4 focus:ring-[#b08d50]/20"
                >
                  Send another message
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5 px-6 py-8 sm:px-8 sm:py-10">
                {/* Name field */}
                <div className="grid gap-5 sm:grid-cols-2">
                  <label className="block min-w-0">
                    <span className="mb-2 block text-[11px] font-semibold tracking-[0.14em] text-black/65">
                      Your name <span className="font-normal text-black/35">*</span>
                    </span>
                    <div className="relative block">
                      <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-black/30">
                        <MessageCircle className="h-4 w-4" />
                      </div>
                      <input
                        type="text"
                        name="name"
                        placeholder="Your name"
                        required
                        minLength={2}
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full min-h-[44px] rounded-xl border border-black/[0.09] bg-[#fbfaf7] px-4 py-3.5 pl-10 text-sm text-[#171717] outline-none transition placeholder:text-black/30 hover:border-[#b08d50]/50 focus:border-[#b08d50] focus:bg-white focus:ring-4 focus:ring-[#b08d50]/10"
                      />
                    </div>
                  </label>

                  {/* Email field */}
                  <label className="block min-w-0">
                    <span className="mb-2 block text-[11px] font-semibold tracking-[0.14em] text-black/65">
                      Your email <span className="font-normal text-black/35">*</span>
                    </span>
                    <div className="relative block">
                      <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-black/30">
                        <Mail className="h-4 w-4" />
                      </div>
                      <input
                        type="email"
                        name="email"
                        placeholder="you@example.com"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full min-h-[44px] rounded-xl border border-black/[0.09] bg-[#fbfaf7] px-4 py-3.5 pl-10 text-sm text-[#171717] outline-none transition placeholder:text-black/30 hover:border-[#b08d50]/50 focus:border-[#b08d50] focus:bg-white focus:ring-4 focus:ring-[#b08d50]/10"
                      />
                    </div>
                  </label>
                </div>

                {/* Subject field */}
                <label className="block min-w-0">
                  <span className="mb-2 block text-[11px] font-semibold tracking-[0.14em] text-black/65">
                    Subject <span className="font-normal text-black/35">*</span>
                  </span>
                  <div className="relative block">
                    <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-black/30">
                      <MessageCircle className="h-4 w-4" />
                    </div>
                    <input
                      type="text"
                      name="subject"
                      placeholder="What's this about?"
                      required
                      minLength={5}
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full min-h-[44px] rounded-xl border border-black/[0.09] bg-[#fbfaf7] px-4 py-3.5 pl-10 text-sm text-[#171717] outline-none transition placeholder:text-black/30 hover:border-[#b08d50]/50 focus:border-[#b08d50] focus:bg-white focus:ring-4 focus:ring-[#b08d50]/10"
                    />
                  </div>
                </label>

                {/* Phone field (optional) */}
                <label className="block min-w-0">
                  <span className="mb-2 block text-[11px] font-semibold tracking-[0.14em] text-black/65">
                    Phone <span className="font-normal text-black/35">optional</span>
                  </span>
                  <div className="relative block">
                    <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-black/30">
                      <Phone className="h-4 w-4" />
                    </div>
                    <input
                      type="tel"
                      name="phone"
                      placeholder="+1 (555) 000-0000"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full min-h-[44px] rounded-xl border border-black/[0.09] bg-[#fbfaf7] px-4 py-3.5 pl-10 text-sm text-[#171717] outline-none transition placeholder:text-black/30 hover:border-[#b08d50]/50 focus:border-[#b08d50] focus:bg-white focus:ring-4 focus:ring-[#b08d50]/10"
                    />
                  </div>
                </label>

                {/* Message field */}
                <label className="block min-w-0">
                  <span className="mb-2 block text-[11px] font-semibold tracking-[0.14em] text-black/65">
                    Your message <span className="font-normal text-black/35">*</span>
                  </span>
                  <textarea
                    name="message"
                    placeholder="Tell us everything..."
                    required
                    minLength={10}
                    rows={6}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full min-h-[160px] rounded-xl border border-black/[0.09] bg-[#fbfaf7] px-4 py-3.5 text-sm text-[#171717] outline-none transition placeholder:text-black/30 hover:border-[#b08d50]/50 focus:border-[#b08d50] focus:bg-white focus:ring-4 focus:ring-[#b08d50]/10 resize-none"
                  />
                </label>

                {/* Submit button */}
                <div className="flex flex-col-reverse gap-3 border-t border-black/[0.06] pt-6 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-[11px] leading-5 text-black/35">We typically respond within 24 hours during business days.</p>
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#171717] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#302a20] focus:outline-none focus:ring-4 focus:ring-[#b08d50]/20 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                  >
                    {loading ? (
                      <>
                        Sending...
                        <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                      </>
                    ) : (
                      <>
                        Send message
                        <Send className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Contact info sidebar */}
          <aside className="sticky top-8 hidden lg:block">
            <div className="overflow-hidden rounded-[26px] border border-black/[0.07] bg-white/90 p-6 shadow-[0_18px_60px_rgba(0,0,0,0.045)] backdrop-blur-xl sm:p-8">
              <div className="mb-6 flex items-center gap-3">
                <div className="rounded-xl bg-[#f8f6f0]">
                  <Mail className="h-5 w-5 text-[#a58551] p-2 box-content" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-black/50 uppercase tracking-[0.1em]">Email</p>
                  <p className="mt-1 text-sm font-medium text-[#b08d50]">kyrofragrance@gmail.com</p>
                </div>
              </div>

              <div className="mb-6 h-px bg-gradient-to-r from-[#b08d50]/35 via-black/[0.06] to-transparent" />

              <div className="rounded-2xl border border-[#b08d50]/15 bg-[#faf7f0] p-4">
                <div className="mb-2 flex items-center gap-2 text-[#96733d]">
                  <Sparkles className="h-4 w-4" />
                  <span className="text-[9px] font-semibold tracking-[0.2em]">RESPONSE TIME</span>
                </div>
                <p className="text-[13px] leading-relaxed text-black/60">
                  We typically respond to all inquiries within <strong>24 hours</strong> during business days. Thank you for your patience.
                </p>
              </div>

              <div className="mt-6 rounded-xl border border-black/[0.06] bg-[#fbfaf7] p-4">
                <p className="text-[11px] leading-5 text-black/40">
                  Your message helps us understand your needs better. Whether it's about our fragrances, orders, or just a suggestion — we're listening.
                </p>
              </div>
            </div>
          </aside>
        </div>

        {/* Mobile contact info */}
        <div className="mt-12 rounded-[26px] border border-black/[0.07] bg-white/90 p-6 shadow-[0_18px_60px_rgba(0,0,0,0.045)] backdrop-blur-xl sm:p-8 lg:hidden">
          <h3 className="mb-4 font-serif text-lg sm:text-xl">Other ways to reach us</h3>
          <div className="flex items-start gap-3">
            <Mail className="h-5 w-5 mt-0.5 shrink-0 text-[#a58551]" />
            <div>
              <p className="text-xs font-semibold text-black/50 uppercase tracking-[0.1em]">Email</p>
              <p className="mt-1 text-sm font-medium text-[#b08d50]">kyrofragrance@gmail.com</p>
            </div>
          </div>
        </div>
      </section>
    </main>

    <WhatsAppButton />
    </>
  );
}
