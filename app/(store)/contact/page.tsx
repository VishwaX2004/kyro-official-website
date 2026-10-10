 "use client";

import Image from "next/image";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Check,
  ChevronRight,
  CircleUserRound,
  Clock3,
  Fingerprint,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
  UserRound,
  AtSign,
  Image as ImageIcon,
  Eye,
  EyeOff,
  LoaderCircle,
} from "lucide-react";
import toast from "react-hot-toast";

type User = {
  name: string;
  username: string;
  email: string;
  role: string;
  imageUrl?: string | null;
};

type ApiResponse = {
  message?: string;
};

const inputClass =
  "mt-2.5 w-full min-h-[44px] rounded-xl border border-black/[0.09] bg-[#fbfaf7] px-4 py-3.5 text-sm text-[#171717] outline-none transition placeholder:text-black/30 hover:border-[#b08d50]/50 focus:border-[#b08d50] focus:bg-white focus:ring-4 focus:ring-[#b08d50]/10";

function FieldLabel({
  children,
  hint,
}: {
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-semibold tracking-[0.08em] text-black/65">
      {children}
      {hint && (
        <span className="font-normal tracking-normal text-black/35">
          {hint}
        </span>
      )}
    </span>
  );
}

export default function AccountPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      try {
        const response = await fetch("/api/auth/session", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        if (!response.ok) {
          router.push("/login");
          return;
        }

        const data = (await response.json()) as { user?: User };

        if (!data.user) {
          router.push("/login");
          return;
        }

        if (mounted) {
          setUser(data.user);
          setLoading(false);
        }
      } catch (err) {
        console.error("Session loading error:", err);
        if (mounted) {
          setLoading(false);
          router.push("/login");
        }
      }
    }

    loadSession();
    return () => {
      mounted = false;
    };
  }, [router]);

  async function updateProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("");
    setError("");
    setSavingProfile(true);

    try {
      const formData = new FormData(event.currentTarget);
      const name = String(formData.get("name") ?? "").trim();
      const email = String(formData.get("email") ?? "").trim();
      const imageUrl = String(formData.get("imageUrl") ?? "").trim();

      if (name.length < 2) {
        setError("Display name must contain at least 2 characters.");
        return;
      }

      if (!email) {
        setError("Please enter your email address.");
        return;
      }

      const response = await fetch("/api/account/profile", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, imageUrl }),
      });

      let data: ApiResponse = {};
      try {
        data = (await response.json()) as ApiResponse;
      } catch {
        data = {};
      }

      if (!response.ok) {
        const errMsg = data.message ?? "Unable to save your profile.";
        setError(errMsg);
        toast.error(errMsg);
        return;
      }

      setUser((currentUser) =>
        currentUser
          ? { ...currentUser, name, email, imageUrl: imageUrl || null }
          : currentUser,
      );
      setImageFailed(false);
      const successMsg = data.message ?? "Your profile has been saved.";
      setNotice(successMsg);
      toast.success(successMsg);
    } catch (err) {
      console.error("Profile update error:", err);
      const errMsg = "Something went wrong while saving your profile.";
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setSavingProfile(false);
    }
  }

  async function updatePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("");
    setError("");
    setChangingPassword(true);

    const form = event.currentTarget;

    try {
      const formData = new FormData(form);
      const currentPassword = String(formData.get("currentPassword") ?? "");
      const newPassword = String(formData.get("newPassword") ?? "");

      if (!currentPassword) {
        setError("Please enter your current password.");
        return;
      }

      if (newPassword.length < 8) {
        setError("New password must contain at least 8 characters.");
        return;
      }

      if (currentPassword === newPassword) {
        setError("Your new password must be different from your current password.");
        return;
      }

      const response = await fetch("/api/account/password", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      let data: ApiResponse = {};
      try {
        data = (await response.json()) as ApiResponse;
      } catch {
        data = {};
      }

      if (!response.ok) {
        const errMsg = data.message ?? "Unable to change your password.";
        setError(errMsg);
        toast.error(errMsg);
        return;
      }

      form.reset();
      const successMsg = data.message ?? "Your password has been changed.";
      setNotice(successMsg);
      toast.success(successMsg);
    } catch (err) {
      console.error("Password update error:", err);
      const errMsg = "Something went wrong while changing your password.";
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setChangingPassword(false);
    }
  }

  if (loading) {
    return (
      <main className="relative grid min-h-[70vh] place-items-center overflow-hidden bg-[#f8f6f0] px-5 text-[#171717]">
        <div className="pointer-events-none absolute -left-20 top-20 h-64 w-64 rounded-full bg-[#b08d50]/10 blur-3xl" />
        <div className="relative flex flex-col items-center text-center">
          <div className="grid h-14 w-14 place-items-center rounded-full border border-[#b08d50]/30 bg-white shadow-sm">
            <LoaderCircle className="h-6 w-6 animate-spin text-[#a58551]" />
          </div>
          <p className="mt-5 font-serif text-xl">Opening your scent journal...</p>
          <p className="mt-2 text-xs tracking-wide text-black/40">A moment, please</p>
        </div>
      </main>
    );
  }

  if (!user) return null;

  const initials =
    user.name
      ?.split(/\s+/)
      .filter(Boolean)
      .map((part) => part.charAt(0))
      .join("")
      .slice(0, 2)
      .toUpperCase() || "KY";

  const isAdmin = user.role?.toLowerCase() === "admin";

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f8f6f0] text-[#171717]">
      {/* Soft, fixed brand glows */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -left-32 top-24 h-72 w-72 rounded-full bg-[#b08d50]/10 blur-3xl" />
        <div className="absolute -right-40 top-[38rem] h-96 w-96 rounded-full bg-[#d6bd8b]/15 blur-3xl" />
      </div>

      <section className="relative mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 sm:pb-20 sm:pt-12 lg:px-10 lg:pb-24 lg:pt-16">
        {/* Breadcrumb / page eyebrow */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3 sm:mb-10">
          <div className="flex items-center gap-2 text-[10px] font-semibold tracking-[0.22em] text-black/40">
            <span className="text-[#a58551]">KYRO PARFUMS</span>
            <ChevronRight className="h-3.5 w-3.5" />
            <span>MY ACCOUNT</span>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#b08d50]/20 bg-white/70 px-3 py-2 text-[10px] font-medium tracking-wide text-black/55">
            <ShieldCheck className="h-3.5 w-3.5 text-[#a58551]" />
            Private &amp; secure
          </div>
        </div>

        <div className="grid items-start gap-7 lg:grid-cols-[0.72fr_1.28fr] lg:gap-10">
          {/* Profile sidebar */}
          <aside className="relative overflow-hidden rounded-[26px] border border-black/[0.07] bg-white/80 p-6 shadow-[0_18px_60px_rgba(0,0,0,0.045)] backdrop-blur-xl sm:p-8 lg:sticky lg:top-8">
            <div className="absolute right-0 top-0 h-28 w-28 translate-x-1/3 -translate-y-1/3 rounded-full border border-[#b08d50]/20" />
            <div className="absolute right-5 top-5 text-[#b08d50]/60">
              <Sparkles className="h-5 w-5" strokeWidth={1.4} />
            </div>

            <div className="relative mb-6 flex items-center gap-4 sm:flex-col sm:items-start">
              <div className="relative grid h-[76px] w-[76px] shrink-0 place-items-center overflow-hidden rounded-full border border-[#b08d50]/35 bg-[#f3ede0] ring-4 ring-[#b08d50]/[0.08] sm:h-24 sm:w-24">
                {user.imageUrl && !imageFailed ? (
                  <Image
                    src={user.imageUrl}
                    alt={`${user.name}'s profile`}
                    fill
                    sizes="(max-width: 640px) 76px, 96px"
                    className="object-cover"
                    onError={() => setImageFailed(true)}
                  />
                ) : (
                  <span className="font-serif text-2xl text-[#96733d] sm:text-3xl">
                    {initials}
                  </span>
                )}
                <span className="absolute bottom-0 right-0 h-4 w-4 rounded-full border-[3px] border-white bg-[#7f9b70]" />
              </div>

              <div className="min-w-0">
                <p className="mb-1 text-[9px] font-semibold tracking-[0.25em] text-[#a58551]">
                  YOUR SCENT JOURNAL
                </p>
                <h1 className="break-words font-serif text-2xl leading-tight tracking-[-0.03em] sm:text-3xl">
                  {user.name}
                </h1>
                <p className="mt-1 break-all text-xs text-black/45">{user.email}</p>
                <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#b08d50]/10 px-3 py-1.5 text-[10px] font-semibold tracking-wide text-[#8d7144]">
                  {isAdmin ? <ShieldCheck className="h-3 w-3" /> : <Sparkles className="h-3 w-3" />}
                  {isAdmin ? "Administrator" : "Scent collector"}
                </span>
              </div>
            </div>

            <div className="my-6 h-px bg-gradient-to-r from-[#b08d50]/35 via-black/[0.06] to-transparent" />

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#f8f6f0] text-[#a58551]">
                  <CircleUserRound className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-xs font-medium">Personal details</p>
                  <p className="mt-1 text-xs leading-5 text-black/40">Keep your profile current and recognisable.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#f8f6f0] text-[#a58551]">
                  <Fingerprint className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-xs font-medium">Account protection</p>
                  <p className="mt-1 text-xs leading-5 text-black/40">Update your password to help keep your account safe.</p>
                </div>
              </div>
            </div>

            <div className="mt-7 rounded-2xl border border-[#b08d50]/15 bg-[#faf7f0] p-4 sm:p-5">
              <div className="mb-2 flex items-center gap-2 text-[#96733d]">
                <Sparkles className="h-4 w-4" />
                <span className="text-[9px] font-semibold tracking-[0.2em]">A PERSONAL TOUCH</span>
              </div>
              <p className="font-serif text-lg italic leading-snug text-black/65">
                “Every scent tells a story.”
              </p>
              <p className="mt-2 text-[9px] font-semibold tracking-[0.2em] text-[#a58551]">
                KYRO PARFUMS
              </p>
            </div>
          </aside>

          {/* Main settings content */}
          <div className="min-w-0">
            <header className="mb-7 sm:mb-9">
              <div className="mb-4 flex items-center gap-3">
                <span className="h-px w-9 bg-[#b08d50]" />
                <span className="text-[10px] font-semibold tracking-[0.28em] text-[#8d7144]">
                  THE PRIVATE EDIT
                </span>
              </div>
              <h2 className="max-w-2xl font-serif text-[2.55rem] leading-[0.98] tracking-[-0.045em] sm:text-5xl lg:text-[3.6rem]">
                Your account,
                <br className="hidden sm:block" /> <span className="italic text-[#a58551]">your signature.</span>
              </h2>
              <p className="mt-5 max-w-xl text-sm leading-6 text-black/50 sm:text-[15px] sm:leading-7">
                Manage your personal details and keep your account secure — thoughtfully, simply, all in one place.
              </p>
            </header>

            {notice && (
              <div className="mb-5 flex items-start gap-3 rounded-2xl border border-emerald-700/15 bg-emerald-50/80 p-4 text-sm text-emerald-900" role="status">
                <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-700 text-white">
                  <Check className="h-3 w-3" />
                </span>
                <p className="leading-6">{notice}</p>
              </div>
            )}

            {error && (
              <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-700/15 bg-red-50/80 p-4 text-sm text-red-800" role="alert">
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-red-700 text-white">!</span>
                <p className="leading-6">{error}</p>
              </div>
            )}

            {/* Personal details card */}
            <section className="mb-6 overflow-hidden rounded-[26px] border border-black/[0.07] bg-white/90 shadow-[0_18px_60px_rgba(0,0,0,0.045)] backdrop-blur-xl">
              <div className="flex items-start gap-4 border-b border-black/[0.06] px-5 py-5 sm:px-8 sm:py-6">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#171717] text-white">
                  <UserRound className="h-5 w-5" strokeWidth={1.5} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="text-[9px] font-semibold tracking-[0.2em] text-[#a58551]">01 / PROFILE</span>
                  </div>
                  <h3 className="font-serif text-xl tracking-[-0.02em] sm:text-2xl">Personal details</h3>
                  <p className="mt-1.5 text-xs leading-5 text-black/45 sm:text-sm">The details associated with your Kyro account.</p>
                </div>
              </div>

              <form className="space-y-5 px-5 py-6 sm:px-8 sm:py-8" onSubmit={updateProfile}>
                <div className="grid gap-5 sm:grid-cols-2">
                  <label className="block min-w-0">
                    <FieldLabel>Display name</FieldLabel>
                    <span className="relative block">
                      <UserRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-black/30" />
                      <input className={`${inputClass} pl-10`} name="name" type="text" defaultValue={user.name} placeholder="Your name" autoComplete="name" required minLength={2} />
                    </span>
                  </label>
                  <label className="block min-w-0">
                    <FieldLabel>Email address</FieldLabel>
                    <span className="relative block">
                      <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-black/30" />
                      <input className={`${inputClass} pl-10`} name="email" type="email" defaultValue={user.email} placeholder="you@example.com" autoComplete="email" required />
                    </span>
                  </label>
                </div>

                <label className="block min-w-0">
                  <FieldLabel hint="Optional · public image URL">Profile image</FieldLabel>
                  <span className="relative block">
                    <ImageIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-black/30" />
                    <input className={`${inputClass} pl-10`} name="imageUrl" type="url" defaultValue={user.imageUrl ?? ""} placeholder="https://example.com/profile.jpg" autoComplete="url" />
                  </span>
                  <span className="mt-2 block text-[11px] leading-5 text-black/35">Use a direct link to an image you want to use as your profile photo.</span>
                </label>

                <div className="flex flex-col-reverse gap-3 border-t border-black/[0.06] pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-[11px] leading-5 text-black/35">Your profile details are only updated after you save.</p>
                  <button className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#171717] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#302a20] focus:outline-none focus:ring-4 focus:ring-[#b08d50]/20 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto" type="submit" disabled={savingProfile}>
                    {savingProfile ? (
                      <>Saving profile <LoaderCircle className="h-4 w-4 animate-spin" /></>
                    ) : (
                      <>Save changes <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></>
                    )}
                  </button>
                </div>
              </form>
            </section>

            {/* Security card */}
            <section className="overflow-hidden rounded-[26px] border border-black/[0.07] bg-white/90 shadow-[0_18px_60px_rgba(0,0,0,0.045)] backdrop-blur-xl">
              <div className="flex items-start gap-4 border-b border-black/[0.06] px-5 py-5 sm:px-8 sm:py-6">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#b08d50]/15 text-[#96733d]">
                  <LockKeyhole className="h-5 w-5" strokeWidth={1.5} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="text-[9px] font-semibold tracking-[0.2em] text-[#a58551]">02 / SECURITY</span>
                  </div>
                  <h3 className="font-serif text-xl tracking-[-0.02em] sm:text-2xl">Account security</h3>
                  <p className="mt-1.5 text-xs leading-5 text-black/45 sm:text-sm">Choose a strong password to help protect your account.</p>
                </div>
                <span className="hidden shrink-0 items-center gap-1.5 rounded-full border border-[#b08d50]/20 px-3 py-1.5 text-[10px] font-medium text-[#8d7144] md:inline-flex">
                  <ShieldCheck className="h-3.5 w-3.5" /> Secure
                </span>
              </div>

              <form className="space-y-5 px-5 py-6 sm:px-8 sm:py-8" onSubmit={updatePassword}>
                <div className="grid gap-5 sm:grid-cols-2">
                  <label className="block min-w-0">
                    <FieldLabel>Current password</FieldLabel>
                    <span className="relative block">
                      <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-black/30" />
                      <input className={`${inputClass} pl-10 pr-12`} name="currentPassword" type={showCurrentPassword ? "text" : "password"} placeholder="Enter current password" autoComplete="current-password" required />
                      <button className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-2.5 text-black/35 transition hover:bg-black/5 hover:text-black/70 focus:outline-none focus:ring-2 focus:ring-[#b08d50]/40" type="button" onClick={() => setShowCurrentPassword((value) => !value)} aria-label={showCurrentPassword ? "Hide current password" : "Show current password"}>
                        {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </span>
                  </label>
                  <label className="block min-w-0">
                    <FieldLabel>New password</FieldLabel>
                    <span className="relative block">
                      <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-black/30" />
                      <input className={`${inputClass} pl-10 pr-12`} name="newPassword" type={showNewPassword ? "text" : "password"} placeholder="At least 8 characters" autoComplete="new-password" minLength={8} required />
                      <button className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-black/35 transition hover:bg-black/5 hover:text-black/70 focus:outline-none focus:ring-2 focus:ring-[#b08d50]/40" type="button" onClick={() => setShowNewPassword((value) => !value)} aria-label={showNewPassword ? "Hide new password" : "Show new password"}>
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </span>
                  </label>
                </div>

                <div className="rounded-xl border border-[#b08d50]/15 bg-[#faf7f0] px-4 py-3.5">
                  <div className="flex items-start gap-2.5">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#a58551]" />
                    <p className="text-[11px] leading-5 text-black/50">For better security, use at least 8 characters and avoid reusing a password from another account.</p>
                  </div>
                </div>

                <div className="flex flex-col-reverse gap-3 border-t border-black/[0.06] pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-[11px] leading-5 text-black/35">You may need to sign in again on other devices.</p>
                  <button className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-[#b08d50]/35 bg-[#b08d50]/10 px-5 py-3 text-sm font-medium text-[#765b30] transition hover:border-[#b08d50]/60 hover:bg-[#b08d50]/20 focus:outline-none focus:ring-4 focus:ring-[#b08d50]/20 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto" type="submit" disabled={changingPassword}>
                    {changingPassword ? (
                      <>Updating password <LoaderCircle className="h-4 w-4 animate-spin" /></>
                    ) : (
                      <>Update password <ArrowRight className="h-4 w-4" /></>
                    )}
                  </button>
                </div>
              </form>
            </section>

            <div className="mt-6 flex items-start gap-3 px-1 text-black/35">
              <Clock3 className="mt-0.5 h-4 w-4 shrink-0" />
              <p className="text-[11px] leading-5">Take a moment to keep your details accurate. A little care goes a long way — just like finding your signature scent.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
