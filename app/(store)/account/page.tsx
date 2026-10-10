"use client";

import Image from "next/image";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import MediaUpload from "@/app/components/MediaUpload";

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

type SettingsTab = "profile" | "security";

export default function AccountPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState("");
  const [imageUploading, setImageUploading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [newPasswordValue, setNewPasswordValue] = useState("");
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");

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
          setProfileImageUrl(data.user.imageUrl ?? "");
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

  async function handleImageUrlChange(url: string) {
    setProfileImageUrl(url);

    try {
      const response = await fetch("/api/account/profile", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: user?.name,
          email: user?.email,
          imageUrl: url,
        }),
      });

      if (response.ok) {
        setUser((currentUser) =>
          currentUser ? { ...currentUser, imageUrl: url } : currentUser
        );
        toast.success("Profile photo updated");
      } else {
        toast.error("Failed to update profile photo");
      }
    } catch (err) {
      console.error("Error updating profile photo:", err);
      toast.error("Error updating profile photo");
    }
  }

  async function updateProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("");
    setError("");
    setSavingProfile(true);

    try {
      const formData = new FormData(event.currentTarget);
      const name = String(formData.get("name") ?? "").trim();
      const email = String(formData.get("email") ?? "").trim();

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
        body: JSON.stringify({
          name,
          email,
          imageUrl: profileImageUrl,
        }),
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
          ? { ...currentUser, name, email, imageUrl: profileImageUrl || null }
          : currentUser
      );

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
      setNewPasswordValue("");
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

  function calculatePasswordStrength(password: string) {
    if (!password) return { score: 0, label: "", color: "" };

    let score = 0;
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/\d/.test(password)) score += 1;
    if (/[^a-zA-Z0-9]/.test(password)) score += 1;

    if (score <= 1) return { score, label: "Weak", color: "#dc2626" };
    if (score <= 2) return { score, label: "Fair", color: "#f59e0b" };
    if (score <= 3) return { score, label: "Good", color: "#ca8a04" };
    if (score <= 4) return { score, label: "Strong", color: "#65a30d" };
    return { score: 5, label: "Very strong", color: "#16a34a" };
  }

  if (loading) {
    return (
      <main className="account-state">
        <div className="account-loader" />
        <p>Loading your account settings...</p>
        <style jsx>{`
          .account-state{min-height:70vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;color:#6b665d;font:14px Arial,sans-serif}
          .account-loader{width:38px;height:38px;border:3px solid #e9e3d8;border-top-color:#9a7843;border-radius:50%;animation:spin .8s linear infinite}
          @keyframes spin{to{transform:rotate(360deg)}}
        `}</style>
      </main>
    );
  }

  if (!user) return null;

  const initials =
    user.name?.split(/\s+/).filter(Boolean).map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "KY";
  const isAdmin = user.role?.toLowerCase() === "admin";
  const passwordStrength = calculatePasswordStrength(newPasswordValue);

  return (
    <main className="kyro-settings">
      <style jsx global>{`
        .kyro-settings{--ink:#211f1b;--muted:#777166;--gold:#987442;--line:#e9e4da;--paper:#fffefa;min-height:100vh;padding:44px 20px 76px;background:#f7f5f0;color:var(--ink);font-family:Arial,Helvetica,sans-serif}
        .kyro-settings *{box-sizing:border-box}
        .settings-wrap{width:min(1040px,100%);margin:0 auto}
        .settings-heading{margin-bottom:28px}
        .settings-eyebrow{margin:0 0 9px;color:var(--gold);font-size:11px;font-weight:800;letter-spacing:.16em;text-transform:uppercase}
        .settings-heading h1{margin:0;font-size:clamp(28px,4vw,40px);letter-spacing:-.04em;font-weight:700}
        .settings-heading p{margin:10px 0 0;color:var(--muted);font-size:14px;line-height:1.65}
        .settings-grid{display:grid;grid-template-columns:280px minmax(0,1fr);gap:22px;align-items:start}
        .settings-card{border:1px solid var(--line);border-radius:18px;background:var(--paper);box-shadow:0 8px 28px #2b241408}
        .settings-profile{padding:24px 20px;text-align:center;position:sticky;top:24px}
        .settings-avatar{width:88px;height:88px;border-radius:50%;margin:0 auto 14px;position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center;background:#eee6d8;border:2px solid #d6c29f;color:#775a2f;font-size:28px;font-weight:700}
        .settings-avatar img{object-fit:cover}
        .settings-profile h2{margin:0 0 7px;font-size:18px;overflow-wrap:anywhere}
        .settings-profile-email{margin:0 auto 14px;color:var(--muted);font-size:13px;line-height:1.5;overflow-wrap:anywhere}
        .settings-role{display:inline-flex;border-radius:99px;padding:6px 10px;background:#f2ecdf;color:#755b31;font-size:11px;font-weight:700}
        .settings-divider{height:1px;background:var(--line);margin:22px 0}
        .settings-nav{display:grid;gap:8px}
        .settings-nav button{width:100%;border:1px solid transparent;border-radius:11px;background:transparent;display:flex;align-items:center;gap:11px;padding:12px 13px;text-align:left;color:#625d53;font-size:14px;font-weight:600;cursor:pointer;transition:.18s}
        .settings-nav button:hover{background:#f8f5ee}
        .settings-nav button[aria-selected="true"]{border-color:#e5d8c1;background:#f6f0e5;color:#594321}
        .nav-icon{width:30px;height:30px;display:grid;place-items:center;border-radius:9px;background:#f0ece4;font-size:16px}
        .settings-main{min-width:0}
        .settings-panel{padding:28px}
        .panel-heading{display:flex;align-items:flex-start;gap:13px;margin-bottom:25px;padding-bottom:20px;border-bottom:1px solid var(--line)}
        .panel-icon{flex:0 0 42px;width:42px;height:42px;border-radius:12px;display:grid;place-items:center;background:#f2ecdf;color:#795d32;font-size:19px}
        .panel-heading h2{margin:1px 0 6px;font-size:20px;letter-spacing:-.02em}
        .panel-heading p{margin:0;color:var(--muted);font-size:13px;line-height:1.6}
        .field-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:19px}
        .field{min-width:0;display:flex;flex-direction:column;gap:8px;margin-bottom:20px}
        .field label{font-size:13px;font-weight:700;color:#353128}
        .field-help{font-size:12px;color:var(--muted);font-weight:400}
        .settings-input-wrap{position:relative}
        .settings-input{width:100%;height:47px;border:1px solid #ded8cc;border-radius:10px;background:#fff;padding:0 13px;color:var(--ink);font-size:14px;outline:none;transition:border-color .18s,box-shadow .18s}
        .settings-input:focus{border-color:#a98a58;box-shadow:0 0 0 3px #a98a581f}
        .settings-input::placeholder{color:#aaa397}
        .settings-input.password-input{padding-right:75px}
        .password-toggle{position:absolute;right:9px;top:50%;transform:translateY(-50%);border:0;background:transparent;color:#795d32;padding:6px;font-size:12px;font-weight:700;cursor:pointer}
        .settings-actions{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-top:5px;padding-top:18px;border-top:1px solid var(--line)}
        .settings-note{max-width:320px;color:var(--muted);font-size:12px;line-height:1.6}
        .settings-button{min-height:45px;padding:0 19px;border:1px solid #211f1b;border-radius:10px;background:#211f1b;color:#fff;font-size:13px;font-weight:700;display:inline-flex;align-items:center;justify-content:center;gap:9px;cursor:pointer;transition:.18s}
        .settings-button:hover{background:#403b32;transform:translateY(-1px)}
        .settings-button:disabled{opacity:.55;cursor:not-allowed;transform:none}
        .settings-button.secondary{background:#fffefa;border-color:#ded3c0;color:#72572e}
        .settings-button.secondary:hover{background:#f7f1e7}
        .settings-alert{display:flex;gap:10px;align-items:flex-start;padding:13px 15px;border-radius:11px;font-size:13px;line-height:1.5;margin-bottom:18px}
        .settings-alert.success{border:1px solid #c9e8d1;background:#f0fbf2;color:#176534}
        .settings-alert.error{border:1px solid #f0cccc;background:#fff4f4;color:#9b2424}
        .upload-block{padding:17px;border:1px solid var(--line);border-radius:12px;background:#fcfaf6;margin-bottom:22px}
        .upload-block-title{margin:0 0 5px;font-size:13px;font-weight:700}
        .upload-block-description{margin:0 0 14px;color:var(--muted);font-size:12px;line-height:1.5}
        .password-rules{display:flex;gap:5px;margin-top:9px}
        .password-bar{height:4px;flex:1;border-radius:5px;background:#e9e4da}
        .password-strength-label{font-size:12px;font-weight:700;margin-top:7px}
        .security-tip{display:flex;gap:11px;padding:13px 14px;border-radius:11px;background:#f7f3eb;color:#6f5a38;font-size:12px;line-height:1.6;margin-bottom:22px}
        .settings-spinner{width:15px;height:15px;border:2px solid #ffffff70;border-top-color:#fff;border-radius:50%;animation:settingsSpin .7s linear infinite}
        @keyframes settingsSpin{to{transform:rotate(360deg)}}
        @media(max-width:768px){.kyro-settings{padding:35px 16px 60px}.settings-grid{grid-template-columns:1fr;gap:16px}.settings-profile{position:static;padding:18px;border-radius:14px}.settings-profile-top{display:flex;align-items:flex-start;gap:12px;text-align:left;flex-wrap:wrap}.settings-avatar{width:70px;height:70px;flex:0 0 70px;margin:0}.settings-profile h2{font-size:16px;margin:0 0 4px}.settings-profile-email{margin:2px 0 8px;font-size:12px}.settings-divider{margin:16px 0}.settings-nav{grid-template-columns:repeat(2,minmax(0,1fr));gap:6px}.settings-nav button{padding:10px;gap:8px;font-size:12px;min-height:44px}.nav-icon{width:32px;height:32px;flex:0 0 32px;font-size:14px}.settings-panel{padding:18px 16px}.panel-heading{gap:10px;margin-bottom:18px;padding-bottom:14px}.panel-icon{flex:0 0 38px;width:38px;height:38px;font-size:16px}.panel-heading h2{font-size:17px;margin:0 0 4px}.panel-heading p{font-size:12px}.field-grid{grid-template-columns:1fr;gap:0;margin-bottom:16px}.field{margin-bottom:12px}.field label{font-size:12px;font-weight:700}.settings-input{height:44px;padding:10px 12px;font-size:16px;min-height:44px}.settings-actions{flex-direction:column-reverse;align-items:stretch;gap:10px;padding-top:12px}.settings-note{max-width:100%;font-size:11px;margin-bottom:10px;order:2}.settings-button{width:100%;min-height:44px;padding:11px 14px;font-size:12px}.upload-block{padding:12px;margin-bottom:16px}.upload-block-title{font-size:12px;margin-bottom:4px}.password-rules{gap:4px;margin-top:6px}.password-bar{height:3px}.password-strength-label{font-size:11px;margin-top:4px}.security-tip{gap:8px;padding:10px 12px;font-size:11px}.field-help{font-size:11px}}
        @media(max-width:480px){.kyro-settings{padding:25px 14px 50px;overflow-x:hidden}.settings-heading h1{font-size:26px}.settings-profile-top{flex-direction:column;align-items:center;text-align:center;justify-content:center}.settings-nav{grid-template-columns:1fr}.settings-nav button{gap:10px}.settings-panel{padding:14px 12px}.panel-heading{gap:8px}.field label{font-size:13px}.settings-input{font-size:16px;min-height:40px}.settings-input::placeholder{font-size:12px}.password-toggle{right:6px;padding:4px;font-size:11px}}
        @media(max-width:420px){.settings-nav button{gap:7px}.settings-nav button span:last-child{line-height:1.3}.settings-actions{align-items:stretch}.settings-actions .settings-button{width:100%}.settings-note{max-width:none}}
        @media(max-width:375px){.kyro-settings{padding:20px 12px 45px;overflow-x:hidden}.settings-heading h1{font-size:22px}.settings-profile{padding:14px;border-radius:12px}.settings-avatar{width:60px;height:60px;flex:0 0 60px}.settings-profile h2{font-size:14px}.settings-input{font-size:16px;min-height:40px;padding:10px 10px}.settings-button{font-size:11px;min-height:40px}.panel-heading h2{font-size:15px}.panel-icon{width:32px;height:32px;font-size:14px}.settings-panel{padding:12px 10px}.upload-block{padding:10px}}
        @media(prefers-reduced-motion:reduce){.kyro-settings *{animation:none!important;transition:none!important}}
      `}</style>

      <div className="settings-wrap">
        <header className="settings-heading">
          <p className="settings-eyebrow">KYRO PARFUMS · ACCOUNT</p>
          <h1>Account settings</h1>
          <p>Manage your personal details and security in one simple place.</p>
        </header>

        <div className="settings-grid">
          <aside className="settings-card settings-profile">
            <div className="settings-profile-top">
              <div className="settings-avatar">
                {profileImageUrl ? (
                  <Image src={profileImageUrl} alt={`${user.name}'s profile`} fill sizes="88px" />
                ) : (
                  <span>{initials}</span>
                )}
              </div>
              <div>
                <h2>{user.name}</h2>
                <p className="settings-profile-email">{user.email}</p>
                <span className="settings-role">{isAdmin ? "Administrator" : "Scent collector"}</span>
              </div>
            </div>

            <div className="settings-divider" />
            <nav className="settings-nav" aria-label="Account settings sections">
              <button type="button" aria-selected={activeTab === "profile"} onClick={() => { setActiveTab("profile"); setNotice(""); setError(""); }}>
                <span className="nav-icon">♙</span><span>Personal details</span>
              </button>
              <button type="button" aria-selected={activeTab === "security"} onClick={() => { setActiveTab("security"); setNotice(""); setError(""); }}>
                <span className="nav-icon">⌑</span><span>Password & security</span>
              </button>
            </nav>
          </aside>

          <section className="settings-main">
            {(notice || error) && (
              <div className={`settings-alert ${error ? "error" : "success"}`} role={error ? "alert" : "status"}>
                <strong>{error ? "!" : "✓"}</strong>
                <span>{error || notice}</span>
              </div>
            )}

            {activeTab === "profile" ? (
              <form className="settings-card settings-panel" onSubmit={updateProfile}>
                <div className="panel-heading">
                  <div className="panel-icon">♙</div>
                  <div>
                    <h2>Personal details</h2>
                    <p>Keep your name and email address up to date.</p>
                  </div>
                </div>

                <div className="field-grid">
                  <div className="field">
                    <label htmlFor="account-name">Display name</label>
                    <input id="account-name" className="settings-input" name="name" type="text" defaultValue={user.name} placeholder="Your full name" autoComplete="name" minLength={2} required />
                  </div>
                  <div className="field">
                    <label htmlFor="account-email">Email address</label>
                    <input id="account-email" className="settings-input" name="email" type="email" defaultValue={user.email} placeholder="you@example.com" autoComplete="email" required />
                  </div>
                </div>

                <div className="upload-block">
                  <p className="upload-block-title">Profile photo</p>
                  <p className="upload-block-description">Choose a clear image so you can recognize your account easily.</p>
                  <MediaUpload
                    name="profileImageUrl"
                    initialUrl={profileImageUrl}
                    onChange={handleImageUrlChange}
                    onUploadStateChange={setImageUploading}
                    label="Upload profile photo"
                  />
                </div>

                <div className="settings-actions">
                  <p className="settings-note">Your updated details will be used for your account profile.</p>
                  <button className="settings-button" type="submit" disabled={savingProfile || imageUploading}>
                    {savingProfile ? <><span className="settings-spinner" /> Saving changes...</> : imageUploading ? "Uploading photo..." : <>Save changes <span aria-hidden="true">→</span></>}
                  </button>
                </div>
              </form>
            ) : (
              <form className="settings-card settings-panel" onSubmit={updatePassword}>
                <div className="panel-heading">
                  <div className="panel-icon">⌑</div>
                  <div>
                    <h2>Password & security</h2>
                    <p>Choose a strong password to help protect your account.</p>
                  </div>
                </div>

                <div className="security-tip">
                  <span aria-hidden="true">ⓘ</span>
                  <span>Use at least 8 characters. A mix of uppercase letters, numbers, and symbols makes your password harder to guess.</span>
                </div>

                <div className="field">
                  <label htmlFor="current-password">Current password</label>
                  <div className="settings-input-wrap">
                    <input id="current-password" className="settings-input password-input" name="currentPassword" type={showCurrentPassword ? "text" : "password"} placeholder="Enter your current password" autoComplete="current-password" required />
                    <button className="password-toggle" type="button" onClick={() => setShowCurrentPassword((value) => !value)} aria-label={showCurrentPassword ? "Hide current password" : "Show current password"}>{showCurrentPassword ? "Hide" : "Show"}</button>
                  </div>
                </div>

                <div className="field">
                  <label htmlFor="new-password">New password <span className="field-help">· Minimum 8 characters</span></label>
                  <div className="settings-input-wrap">
                    <input id="new-password" className="settings-input password-input" name="newPassword" type={showNewPassword ? "text" : "password"} placeholder="Create a new password" autoComplete="new-password" minLength={8} required value={newPasswordValue} onChange={(event) => setNewPasswordValue(event.target.value)} />
                    <button className="password-toggle" type="button" onClick={() => setShowNewPassword((value) => !value)} aria-label={showNewPassword ? "Hide new password" : "Show new password"}>{showNewPassword ? "Hide" : "Show"}</button>
                  </div>
                  {newPasswordValue && (
                    <>
                      <div className="password-rules" aria-label={`Password strength: ${passwordStrength.label}`}>
                        {[1, 2, 3, 4, 5].map((bar) => (
                          <span key={bar} className="password-bar" style={bar <= passwordStrength.score ? { background: passwordStrength.color } : undefined} />
                        ))}
                      </div>
                      <div className="password-strength-label" style={{ color: passwordStrength.color }}>{passwordStrength.label}</div>
                    </>
                  )}
                </div>

                <div className="settings-actions">
                  <p className="settings-note">You will need your current password to make this change.</p>
                  <button className="settings-button" type="submit" disabled={changingPassword}>
                    {changingPassword ? <><span className="settings-spinner" /> Updating password...</> : <>Update password <span aria-hidden="true">→</span></>}
                  </button>
                </div>
              </form>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
