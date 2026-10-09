"use client"; 
 
import { FormEvent, useState } from "react"; 
import { useRouter } from "next/navigation"; 
import Image from "next/image"; 
import toast from "react-hot-toast"; 
 
type Mode = "login" | "register"; 
 
const features = [ 
  ["01", "Curated scents", "Explore without committing to a full bottle."], 
  ["02", "Small sizes", "Take your favorite fragrance anywhere."], 
  ["03", "Your collection", "Keep your discoveries together."], 
]; 
 
/* ---------- shared styles ---------- */ 
 
const labelClass = 
  "mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-black/65"; 
 
const inputClass = 
  "h-12 w-full rounded-xl border border-black/15 bg-white pl-11 text-sm text-[#171717] outline-none transition-all duration-300 placeholder:text-black/35 hover:border-black/25 focus:border-[#b08d50] focus:ring-4 focus:ring-[#b08d50]/15"; 
 
/* Inline padding so global CSS resets can't override it and cause icon/placeholder overlap */ 
const inputStyle: React.CSSProperties = { 
  paddingLeft: "2.75rem", 
  paddingRight: "1rem", 
}; 
 
const inputStyleWithToggle: React.CSSProperties = { 
  paddingLeft: "2.75rem", 
  paddingRight: "4rem", 
}; 
 
const iconWrap = 
  "pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#a27d3f]"; 
 
const toggleClass = 
  "absolute right-3 top-1/2 -translate-y-1/2 rounded-md px-1.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-black/55 transition-colors duration-300 hover:text-[#a27d3f]"; 
 
/* ---------- icons ---------- */ 
 
function IconBase({ children }: { children: React.ReactNode }) { 
  return ( 
    <svg 
      width="18" 
      height="18" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="1.7" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      aria-hidden="true" 
    > 
      {children} 
    </svg> 
  ); 
} 
 
const UserIcon = () => ( 
  <IconBase> 
    <circle cx="12" cy="8" r="4" /> 
    <path d="M4 21c0-4 3.5-6 8-6s8 2 8 6" /> 
  </IconBase> 
); 
 
const MailIcon = () => ( 
  <IconBase> 
    <rect x="3" y="5" width="18" height="14" rx="2" /> 
    <path d="M3 7l9 6 9-6" /> 
  </IconBase> 
); 
 
const LockIcon = () => ( 
  <IconBase> 
    <rect x="4" y="11" width="16" height="10" rx="2" /> 
    <path d="M8 11V7a4 4 0 0 1 8 0v4" /> 
  </IconBase> 
); 
 
const GoogleIcon = () => ( 
  <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true"> 
    <path 
      fill="#FFC107" 
      d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z" 
    /> 
    <path 
      fill="#FF3D00" 
      d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" 
    /> 
    <path 
      fill="#4CAF50" 
      d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" 
    /> 
    <path 
      fill="#1976D2" 
      d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.6-.4-3.9z" 
    /> 
  </svg> 
); 
 
export default function Home() { 
  const [mode, setMode] = useState<Mode>("login"); 
  const [showPassword, setShowPassword] = useState(false); 
  const [showConfirmPassword, setShowConfirmPassword] = useState(false); 
  const [loading, setLoading] = useState(false); 
  const [googleLoading, setGoogleLoading] = useState(false); 
  const [imageUploading, setImageUploading] = useState(false); 
  const [message, setMessage] = useState(""); 
 
  const router = useRouter(); 
 
  async function handleSubmit(event: FormEvent<HTMLFormElement>) { 
    event.preventDefault(); 
 
    setLoading(true); 
    setMessage(""); 
 
    const form = event.currentTarget; 
    const formData = new FormData(form); 
 
    const password = String(formData.get("password") ?? ""); 
    const confirmPassword = String(formData.get("confirmPassword") ?? ""); 
 
    if (mode === "register" && password !== confirmPassword) { 
      const errorMessage = "Passwords do not match."; 
      setMessage(errorMessage); 
      toast.error(errorMessage); 
      setLoading(false); 
      return; 
    } 
 
    if (mode === "register" && password.length < 8) { 
      const errorMessage = "Password must contain at least 8 characters."; 
      setMessage(errorMessage); 
      toast.error(errorMessage); 
      setLoading(false); 
      return; 
    } 
 
    if (mode === "register" && imageUploading) { 
      const errorMessage = "Please wait until your profile image finishes uploading."; 
      setMessage(errorMessage); 
      toast.error(errorMessage); 
      setLoading(false); 
      return; 
    } 
 
    const payload = { 
      identifier: String(formData.get("identifier") ?? ""), 
      ...(mode === "register" 
        ? { 
            email: String(formData.get("email") ?? ""), 
            role: "customer", 
          } 
        : {}), 
      password, 
      ...(mode === "register" 
        ? { 
            name: String(formData.get("name") ?? ""), 
            createdAt: new Date().toISOString(), 
            updatedAt: new Date().toISOString(), 
          } 
        : {}), 
    }; 
 
    try { 
      const response = await fetch(`/api/auth/${mode}`, { 
        method: "POST", 
        headers: { 
          "Content-Type": "application/json", 
        }, 
        body: JSON.stringify(payload), 
      }); 
 
      const data = (await response.json()) as { 
        message?: string; 
        role?: string; 
      }; 
 
      if (!response.ok) { 
        throw new Error(data.message || "Something went wrong."); 
      } 
 
      setMessage( 
        mode === "login" 
          ? "Welcome back. You're all set." 
          : "Account created. Welcome to Kyro." 
      ); 
 
      toast.success( 
        mode === "login" 
          ? "Welcome back. You're all set." 
          : "Account created. Welcome to Kyro." 
      ); 
 
      form.reset(); 
 
      if (mode === "login" && data.role === "admin") { 
        router.push("/admin"); 
      } else { 
        router.push("/"); 
      } 
    } catch (error) { 
      const errorMessage = 
        error instanceof Error 
          ? error.message 
          : "Unable to complete that request."; 
 
      setMessage(errorMessage); 
      toast.error(errorMessage); 
    } finally { 
      setLoading(false); 
    } 
  } 
 
  /* Google sign-in: redirects to your Google OAuth route */ 
  function handleGoogle() { 
    setGoogleLoading(true); 
    window.location.href = "/api/auth/google"; 
  } 
 
  function switchMode(nextMode: Mode) { 
    if (nextMode === mode) return; 
 
    setMode(nextMode); 
    setMessage(""); 
    setShowPassword(false); 
    setShowConfirmPassword(false); 
    setImageUploading(false); 
  } 
 
  const isSuccess = 
    message.includes("Welcome") || message.includes("created"); 
 
  return ( 
    <main className="fixed inset-0 overflow-hidden bg-[#f8f6f0] text-[#171717]"> 
      <div className="grid h-full w-full lg:grid-cols-[42%_58%]"> 
        {/* ===================================================== 
            LEFT BRAND PANEL 
        ====================================================== */} 
        <section className="relative hidden h-full overflow-hidden bg-[#eee9dc] lg:flex"> 
          <div className="pointer-events-none absolute -left-32 -top-32 h-[420px] w-[420px] rounded-full bg-[#b08d50]/10 blur-3xl" /> 
          <div className="pointer-events-none absolute -bottom-40 -right-32 h-[480px] w-[480px] rounded-full bg-[#d8c8aa]/20 blur-3xl" /> 
 
          <div className="relative z-10 flex h-full w-full flex-col px-10 py-8 xl:px-14 xl:py-10"> 
            <div className="animate-[kyroFadeIn_700ms_ease-out]"> 
              <Image 
                src="/logo.png" 
                alt="Kyro Parfums" 
                width={126} 
                height={76} 
                priority 
                className="h-auto w-[92px] object-contain" 
              /> 
            </div> 
 
            <div className="my-auto max-w-[500px] animate-[kyroFadeUp_800ms_ease-out]"> 
              <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.3em] text-[#8f6d36]"> 
                KYRO PARFUMS 
              </p> 
 
              <h1 className="max-w-[470px] text-[clamp(2.4rem,4vw,4.5rem)] font-light leading-[0.98] tracking-[-0.045em]"> 
                Your next 
                <br /> 
                signature is{" "} 
                <em className="font-serif not-italic text-[#a27d3f]"> 
                  closer. 
                </em> 
              </h1> 
 
              <p className="mt-5 max-w-[410px] text-[15px] leading-6 text-black/60"> 
                Discover refined fragrances in a more personal way. 
              </p> 
 
              <div className="mt-8 space-y-3"> 
                {features.map(([number, title, description], index) => ( 
                  <div 
                    key={number} 
                    className="group flex items-start gap-4 rounded-2xl border border-black/[0.06] bg-white/60 p-4 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:bg-white/90 hover:shadow-[0_12px_30px_rgba(0,0,0,0.06)]" 
                    style={{ 
                      animation: `kyroFadeUp 700ms ease-out ${ 
                        150 + index * 100 
                      }ms both`, 
                    }} 
                  > 
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#171717] text-[10px] font-medium tracking-widest text-white transition-transform duration-300 group-hover:scale-110"> 
                      {number} 
                    </span> 
 
                    <div> 
                      <h2 className="text-sm font-semibold tracking-wide"> 
                        {title} 
                      </h2> 
 
                      <p className="mt-1 text-xs leading-5 text-black/55"> 
                        {description} 
                      </p> 
                    </div> 
                  </div> 
                ))} 
              </div> 
            </div> 
 
            <div className="flex items-center justify-between border-t border-black/[0.08] pt-4 text-[10px] uppercase tracking-[0.16em] text-black/45"> 
              <span>© 2026 Kyro Parfums</span> 
              <span className="text-[#8f6d36]">Wear your atmosphere.</span> 
            </div> 
          </div> 
        </section> 
 
        {/* ===================================================== 
            RIGHT AUTH PANEL 
        ====================================================== */} 
        <section className="relative flex h-full justify-center overflow-y-auto bg-[#fffefa] px-5 py-6 sm:px-8"> 
          <div className="pointer-events-none fixed -right-32 -top-32 h-[400px] w-[400px] rounded-full bg-[#b08d50]/[0.06] blur-3xl" /> 
          <div className="pointer-events-none fixed -bottom-40 -left-32 h-[420px] w-[420px] rounded-full bg-[#d8c8aa]/[0.10] blur-3xl" /> 
 
          <div className="relative z-10 my-auto w-full max-w-[460px] py-2"> 
            {/* Mobile logo */} 
            <div className="mb-6 flex justify-center lg:hidden"> 
              <Image 
                src="/logo.png" 
                alt="Kyro Parfums" 
                width={126} 
                height={76} 
                priority 
                className="h-auto w-[88px] object-contain" 
              /> 
            </div> 
 
            {/* Status */} 
            <div className="mb-4 flex items-center gap-2"> 
              <span className="relative flex h-2 w-2"> 
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#b08d50]/40" /> 
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#b08d50]" /> 
              </span> 
 
              <span 
                key={`status-${mode}`} 
                className="animate-[kyroSoftIn_500ms_ease-out] text-[11px] font-medium uppercase tracking-[0.14em] text-black/55" 
              > 
                {mode === "login" 
                  ? "Your private scent journal awaits" 
                  : "Make room for new obsessions"} 
              </span> 
            </div> 
 
            <div className="relative"> 
              {/* Heading + description */} 
              <div 
                key={`intro-${mode}`} 
                className="animate-[kyroModeIn_600ms_cubic-bezier(0.22,1,0.36,1)]" 
              > 
                <h2 className="text-[clamp(2rem,4vw,3rem)] font-light leading-[1.02] tracking-[-0.04em]"> 
                  {mode === "login" ? ( 
                    <> 
                      Return to 
                      <br /> 
                      your{" "} 
                      <em className="font-serif not-italic text-[#a27d3f]"> 
                        ritual. 
                      </em> 
                    </> 
                  ) : ( 
                    <> 
                      Join the 
                      <br /> 
                      fragrance{" "} 
                      <em className="font-serif not-italic text-[#a27d3f]"> 
                        house. 
                      </em> 
                    </> 
                  )} 
                </h2> 
 
                <p className="mt-3 max-w-[420px] text-sm leading-6 text-black/60"> 
                  {mode === "login" 
                    ? "Sign in to revisit saved scents, wish lists, and your next great find." 
                    : "Create your account in seconds and keep every beautiful discovery close."} 
                </p> 
              </div> 
 
              {/* MODE SWITCH */} 
              <div 
                className="relative mt-6 flex rounded-full border border-black/10 bg-[#f4f1e8] p-1 shadow-[0_3px_15px_rgba(0,0,0,0.035)]" 
                role="tablist" 
                aria-label="Authentication mode" 
              > 
                <div 
                  className={`pointer-events-none absolute bottom-1 top-1 w-[calc(50%-4px)] rounded-full bg-[#171717] shadow-[0_5px_18px_rgba(0,0,0,0.14)] transition-transform duration-500 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] ${ 
                    mode === "register" 
                      ? "translate-x-[calc(100%+4px)]" 
                      : "translate-x-0" 
                  }`} 
                /> 
 
                <button 
                  type="button" 
                  onClick={() => switchMode("login")} 
                  role="tab" 
                  aria-selected={mode === "login"} 
                  className={`relative z-10 flex h-11 flex-1 items-center justify-center rounded-full text-xs font-semibold uppercase tracking-[0.1em] transition-colors duration-500 ${ 
                    mode === "login" 
                      ? "text-white" 
                      : "text-black/55 hover:text-black/80" 
                  }`} 
                > 
                  Sign in 
                </button> 
 
                <button 
                  type="button" 
                  onClick={() => switchMode("register")} 
                  role="tab" 
                  aria-selected={mode === "register"} 
                  className={`relative z-10 flex h-11 flex-1 items-center justify-center rounded-full text-xs font-semibold uppercase tracking-[0.1em] transition-colors duration-500 ${ 
                    mode === "register" 
                      ? "text-white" 
                      : "text-black/55 hover:text-black/80" 
                  }`} 
                > 
                  Create account 
                </button> 
              </div> 
 
              {/* FORM */} 
              <form 
                key={`form-${mode}`} 
                onSubmit={handleSubmit} 
                className="mt-6 space-y-4" 
              > 
                {/* ---------- REGISTER FIELDS ---------- */} 
                {mode === "register" && ( 
                  <div className="space-y-4 animate-[kyroFieldIn_500ms_cubic-bezier(0.22,1,0.36,1)]"> 
                    {/* Name */} 
                    <label className="block"> 
                      <span className={labelClass}>Full name</span> 
                      <div className="relative"> 
                        <span className={iconWrap}> 
                          <UserIcon /> 
                        </span> 
                        <input 
                          name="name" 
                          type="text" 
                          placeholder="Kasun Perera" 
                          autoComplete="name" 
                          minLength={2} 
                          required 
                          className={`${inputClass} pr-4`} 
                          style={inputStyle} 
                        /> 
                      </div> 
                    </label> 
 
                    {/* Email */} 
                    <label className="block"> 
                      <span className={labelClass}>Email address</span> 
                      <div className="relative"> 
                        <span className={iconWrap}> 
                          <MailIcon /> 
                        </span> 
                        <input 
                          name="email" 
                          type="email" 
                          placeholder="kasun@example.com" 
                          autoComplete="email" 
                          required 
                          className={`${inputClass} pr-4`} 
                          style={inputStyle} 
                        /> 
                      </div> 
                    </label> 
 
                    {/* Passwords */} 
                    <div className="grid gap-4 sm:grid-cols-2"> 
                      <label className="block"> 
                        <span className={labelClass}>Password</span> 
                        <div className="relative"> 
                          <span className={iconWrap}> 
                            <LockIcon /> 
                          </span> 
                          <input 
                            name="password" 
                            type={showPassword ? "text" : "password"} 
                            placeholder="Min. 8 characters" 
                            autoComplete="new-password" 
                            minLength={8} 
                            required 
                            className={`${inputClass} pr-16`} 
                            style={inputStyleWithToggle} 
                          /> 
                          <button 
                            type="button" 
                            onClick={() => setShowPassword((value) => !value)} 
                            aria-label={ 
                              showPassword ? "Hide password" : "Show password" 
                            } 
                            className={toggleClass} 
                          > 
                            {showPassword ? "Hide" : "Show"} 
                          </button> 
                        </div> 
                      </label> 
 
                      <label className="block"> 
                        <span className={labelClass}>Confirm password</span> 
                        <div className="relative"> 
                          <span className={iconWrap}> 
                            <LockIcon /> 
                          </span> 
                          <input 
                            name="confirmPassword" 
                            type={showConfirmPassword ? "text" : "password"} 
                            placeholder="Repeat password" 
                            autoComplete="new-password" 
                            minLength={8} 
                            required 
                            className={`${inputClass} pr-16`} 
                            style={inputStyleWithToggle} 
                          /> 
                          <button 
                            type="button" 
                            onClick={() => 
                              setShowConfirmPassword((value) => !value) 
                            } 
                            aria-label={ 
                              showConfirmPassword 
                                ? "Hide confirm password" 
                                : "Show confirm password" 
                            } 
                            className={toggleClass} 
                          > 
                            {showConfirmPassword ? "Hide" : "Show"} 
                          </button> 
                        </div> 
                      </label> 
                    </div> 
 
                    <p className="text-xs leading-5 text-black/50"> 
                      Use at least 8 characters. You can add more profile 
                      details later from your account. 
                    </p> 
                  </div> 
                )} 
 
                {/* ---------- LOGIN FIELDS ---------- */} 
                {mode === "login" && ( 
                  <> 
                    <label className="block animate-[kyroFieldIn_450ms_cubic-bezier(0.22,1,0.36,1)]"> 
                      <span className={labelClass}>Username or email</span> 
                      <div className="relative"> 
                        <span className={iconWrap}> 
                          <UserIcon /> 
                        </span> 
                        <input 
                          name="identifier" 
                          type="text" 
                          placeholder="admin or you@company.com" 
                          autoComplete="username" 
                          required 
                          className={`${inputClass} pr-4`} 
                          style={inputStyle} 
                        /> 
                      </div> 
                    </label> 
 
                    <label className="block animate-[kyroFieldIn_500ms_cubic-bezier(0.22,1,0.36,1)]"> 
                      <span className={labelClass}>Password</span> 
                      <div className="relative"> 
                        <span className={iconWrap}> 
                          <LockIcon /> 
                        </span> 
                        <input 
                          name="password" 
                          type={showPassword ? "text" : "password"} 
                          placeholder="Enter your password" 
                          autoComplete="current-password" 
                          minLength={8} 
                          required 
                          className={`${inputClass} pr-16`} 
                          style={inputStyleWithToggle} 
                        /> 
                        <button 
                          type="button" 
                          onClick={() => setShowPassword((value) => !value)} 
                          aria-label={ 
                            showPassword ? "Hide password" : "Show password" 
                          } 
                          className={toggleClass} 
                        > 
                          {showPassword ? "Hide" : "Show"} 
                        </button> 
                      </div> 
                    </label> 
 
                    <div className="flex items-center justify-between pt-0.5 animate-[kyroFieldIn_450ms_cubic-bezier(0.22,1,0.36,1)]"> 
                      <label className="flex cursor-pointer items-center gap-2 text-xs text-black/65"> 
                        <input 
                          type="checkbox" 
                          className="h-4 w-4 accent-[#171717]" 
                        /> 
                        <span>Remember me</span> 
                      </label> 
 
                      <button 
                        type="button" 
                        className="text-xs font-medium text-black/55 transition-colors duration-300 hover:text-[#a27d3f]" 
                      > 
                        Forgot password? 
                      </button> 
                    </div> 
                  </> 
                )} 
 
                {/* Message */} 
                {message && ( 
                  <div 
                    className={`animate-[kyroFieldIn_350ms_cubic-bezier(0.22,1,0.36,1)] rounded-xl border px-4 py-3 text-xs font-medium ${ 
                      isSuccess 
                        ? "border-green-300 bg-green-50 text-green-800" 
                        : "border-red-300 bg-red-50 text-red-700" 
                    }`} 
                    role="status" 
                  > 
                    {message} 
                  </div> 
                )} 
 
                {/* Submit */} 
                <button 
                  type="submit" 
                  disabled={loading || imageUploading} 
                  className="group relative flex h-12 w-full items-center justify-center gap-3 overflow-hidden rounded-full bg-[#171717] text-xs font-semibold uppercase tracking-[0.15em] text-white shadow-[0_8px_25px_rgba(0,0,0,0.14)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#2b2b2b] hover:shadow-[0_12px_30px_rgba(0,0,0,0.2)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60" 
                > 
                  <span className="pointer-events-none absolute -left-20 top-0 h-full w-16 rotate-12 bg-white/10 transition-all duration-700 group-hover:left-[120%]" /> 
 
                  <span className="relative text-white"> 
                    {imageUploading 
                      ? "Uploading profile..." 
                      : loading 
                      ? "Opening your shelf..." 
                      : mode === "login" 
                      ? "Enter the collection" 
                      : "Create my account"} 
                  </span> 
 
                  {!loading && !imageUploading && ( 
                    <span className="relative text-base text-white transition-transform duration-300 group-hover:translate-x-1"> 
                      → 
                    </span> 
                  )} 
                </button> 
 
                {/* Divider */} 
                <div className="flex items-center gap-3 py-1"> 
                  <span className="h-px flex-1 bg-black/10" /> 
                  <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-black/45"> 
                    or 
                  </span> 
                  <span className="h-px flex-1 bg-black/10" /> 
                </div> 
 
                {/* Google */} 
                <button 
                  type="button" 
                  onClick={handleGoogle} 
                  disabled={googleLoading || loading} 
                  className="flex h-12 w-full items-center justify-center gap-3 rounded-full border border-black/15 bg-white text-sm font-semibold text-[#171717] shadow-[0_3px_12px_rgba(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-0.5 hover:border-black/30 hover:shadow-[0_10px_25px_rgba(0,0,0,0.09)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60" 
                > 
                  <GoogleIcon /> 
                  <span> 
                    {googleLoading 
                      ? "Redirecting to Google..." 
                      : mode === "login" 
                      ? "Sign in with Google" 
                      : "Sign up with Google"} 
                  </span> 
                </button> 
              </form> 
 
              {/* Terms */} 
              <p className="mt-6 text-center text-[11px] leading-5 text-black/50"> 
                By continuing, you agree to our{" "} 
                <a 
                  href="#terms" 
                  className="underline underline-offset-2 transition-colors duration-300 hover:text-[#a27d3f]" 
                > 
                  Terms of Service 
                </a>{" "} 
                and{" "} 
                <a 
                  href="#privacy" 
                  className="underline underline-offset-2 transition-colors duration-300 hover:text-[#a27d3f]" 
                > 
                  Privacy Policy 
                </a> 
                . 
              </p> 
            </div> 
          </div> 
        </section> 
      </div> 
 
      {/* ===================================================== 
          ANIMATION HELPERS 
      ====================================================== */} 
      <div className="hidden"> 
        <span className="animate-[kyroFadeUp_800ms_ease-out]" /> 
        <span className="animate-[kyroFadeIn_700ms_ease-out]" /> 
        <span className="animate-[kyroModeIn_600ms_cubic-bezier(0.22,1,0.36,1)]" /> 
        <span className="animate-[kyroFieldIn_500ms_cubic-bezier(0.22,1,0.36,1)]" /> 
        <span className="animate-[kyroSoftIn_500ms_ease-out]" /> 
      </div> 
 
      <style 
        dangerouslySetInnerHTML={{ 
          __html: ` 
            @keyframes kyroFadeUp { 
              from { opacity: 0; transform: translateY(18px); } 
              to { opacity: 1; transform: translateY(0); } 
            } 
 
            @keyframes kyroFadeIn { 
              from { opacity: 0; } 
              to { opacity: 1; } 
            } 
 
            @keyframes kyroModeIn { 
              0% { opacity: 0; transform: translateY(14px) scale(0.985); filter: blur(2px); } 
              45% { opacity: 0.75; filter: blur(0.5px); } 
              100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); } 
            } 
 
            @keyframes kyroFieldIn { 
              from { opacity: 0; transform: translateY(10px); } 
              to { opacity: 1; transform: translateY(0); } 
            } 
 
            @keyframes kyroSoftIn { 
              from { opacity: 0; transform: translateY(4px); } 
              to { opacity: 1; transform: translateY(0); } 
            } 
 
            @media (prefers-reduced-motion: reduce) { 
              *, *::before, *::after { 
                animation-duration: 0.01ms !important; 
                animation-iteration-count: 1 !important; 
                transition-duration: 0.01ms !important; 
                scroll-behavior: auto !important; 
              } 
            } 
          `, 
        }} 
      /> 
    </main> 
  ); 
}