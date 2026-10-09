"use client";

import Image from "next/image";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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

export default function AccountPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const [notice, setNotice] = useState<string>("");
  const [error, setError] = useState<string>("");

  const [savingProfile, setSavingProfile] = useState<boolean>(false);
  const [changingPassword, setChangingPassword] = useState<boolean>(false);

  // --------------------------------------------------
  // Load current user
  // --------------------------------------------------
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

  // --------------------------------------------------
  // Update profile
  // --------------------------------------------------
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
        toast.error("Display name must contain at least 2 characters.");
        return;
      }

      if (!email) {
        setError("Please enter your email address.");
        toast.error("Please enter your email address.");
        return;
      }

      const response = await fetch("/api/account/profile", {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          imageUrl,
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

      setUser((currentUser) => {
        if (!currentUser) {
          return currentUser;
        }

        return {
          ...currentUser,
          name,
          email,
          imageUrl: imageUrl || null,
        };
      });

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

  // --------------------------------------------------
  // Update password
  // --------------------------------------------------
  async function updatePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setNotice("");
    setError("");
    setChangingPassword(true);

    const form = event.currentTarget;

    try {
      const formData = new FormData(form);

      const currentPassword = String(
        formData.get("currentPassword") ?? ""
      );

      const newPassword = String(
        formData.get("newPassword") ?? ""
      );

      if (!currentPassword) {
        setError("Please enter your current password.");
        toast.error("Please enter your current password.");
        return;
      }

      if (newPassword.length < 8) {
        setError("New password must contain at least 8 characters.");
        toast.error("New password must contain at least 8 characters.");
        return;
      }

      if (currentPassword === newPassword) {
        setError(
          "Your new password must be different from your current password."
        );
        toast.error(
          "Your new password must be different from your current password."
        );
        return;
      }

      const response = await fetch("/api/account/password", {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
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

  // --------------------------------------------------
  // Loading screen
  // --------------------------------------------------
  if (loading) {
    return (
      <main className="account-loading">
        <div className="account-loading-content">
          <div className="account-spinner" />
          <p>Opening your scent journal...</p>
        </div>
      </main>
    );
  }

  // --------------------------------------------------
  // User not available
  // --------------------------------------------------
  if (!user) {
    return null;
  }

  // --------------------------------------------------
  // Initials
  // --------------------------------------------------
  const initials =
    user.name
      ?.split(/\s+/)
      .filter(Boolean)
      .map((part) => part.charAt(0))
      .join("")
      .slice(0, 2)
      .toUpperCase() || "KY";

  const isAdmin = user.role?.toLowerCase() === "admin";

  // --------------------------------------------------
  // Page
  // --------------------------------------------------
  return (
    <main className="account-page">
      <section className="account-layout">
        {/* ============================================
            PROFILE CARD
        ============================================ */}
        <aside className="account-profile-card">
          <div className="account-avatar">
            {user.imageUrl ? (
              <Image
                src={user.imageUrl}
                alt={`${user.name}'s profile`}
                fill
                sizes="100px"
                className="account-avatar-image"
              />
            ) : (
              <span>{initials}</span>
            )}
          </div>

          <span className="admin-kicker">
            YOUR SCENT JOURNAL
          </span>

          <h1>{user.name}</h1>

          <p className="account-email">
            {user.email}
          </p>

          <span className="account-role">
            {isAdmin ? "Administrator" : "Scent collector"}
          </span>

          <div className="account-profile-note">
            Keep your details current so every Kyro moment
            feels personal.
          </div>
        </aside>

        {/* ============================================
            FORMS
        ============================================ */}
        <div className="account-forms">
          {/* INTRO */}
          <div className="account-intro">
            <p className="store-eyebrow">
              THE PRIVATE EDIT
            </p>

            <h2>
              Make your account feel like{" "}
              <em>you.</em>
            </h2>

            <p>
              Manage your profile, protect your account,
              and keep your fragrance journey close.
            </p>
          </div>

          {/* ==========================================
              ALERTS
          ========================================== */}
          {notice && (
            <div
              className="account-alert success"
              role="status"
            >
              <span>✓</span>
              <p>{notice}</p>
            </div>
          )}

          {error && (
            <div
              className="account-alert error"
              role="alert"
            >
              <span>!</span>
              <p>{error}</p>
            </div>
          )}

          {/* ==========================================
              PROFILE FORM
          ========================================== */}
          <form
            className="account-form"
            onSubmit={updateProfile}
          >
            <div className="account-form-title">
              <span>01</span>

              <div>
                <h3>Personal details</h3>

                <p>
                  The name and email attached to your
                  Kyro account.
                </p>
              </div>
            </div>

            {/* Name */}
            <label>
              <span>Display name</span>

              <input
                name="name"
                type="text"
                defaultValue={user.name}
                placeholder="Your name"
                autoComplete="name"
                required
                minLength={2}
              />
            </label>

            {/* Email */}
            <label>
              <span>Email address</span>

              <input
                name="email"
                type="email"
                defaultValue={user.email}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </label>

            {/* Image */}
            <label>
              <span>
                Profile image URL{" "}
                <small>
                  Optional — use a public image URL
                </small>
              </span>

              <input
                name="imageUrl"
                type="url"
                defaultValue={user.imageUrl ?? ""}
                placeholder="https://example.com/profile.jpg"
                autoComplete="off"
              />
            </label>

            {/* Save */}
            <button
              className="account-save"
              type="submit"
              disabled={savingProfile}
            >
              {savingProfile ? (
                <>
                  Saving...
                  <span className="button-spinner" />
                </>
              ) : (
                <>
                  Save profile
                  <span>→</span>
                </>
              )}
            </button>
          </form>

          {/* ==========================================
              PASSWORD FORM
          ========================================== */}
          <form
            className="account-form"
            onSubmit={updatePassword}
          >
            <div className="account-form-title">
              <span>02</span>

              <div>
                <h3>Account security</h3>

                <p>
                  Change your password whenever you
                  need to.
                </p>
              </div>
            </div>

            {/* Current password */}
            <label>
              <span>Current password</span>

              <input
                name="currentPassword"
                type="password"
                placeholder="Enter current password"
                autoComplete="current-password"
                required
              />
            </label>

            {/* New password */}
            <label>
              <span>New password</span>

              <input
                name="newPassword"
                type="password"
                placeholder="Minimum 8 characters"
                autoComplete="new-password"
                minLength={8}
                required
              />
            </label>

            {/* Update */}
            <button
              className="account-save secondary"
              type="submit"
              disabled={changingPassword}
            >
              {changingPassword ? (
                <>
                  Updating...
                  <span className="button-spinner" />
                </>
              ) : (
                <>
                  Update password
                  <span>→</span>
                </>
              )}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}

