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

export default function AccountPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const [notice, setNotice] = useState<string>("");
  const [error, setError] = useState<string>("");

  const [savingProfile, setSavingProfile] = useState<boolean>(false);
  const [changingPassword, setChangingPassword] = useState<boolean>(false);

  const [profileImageUrl, setProfileImageUrl] = useState<string>(user?.imageUrl ?? "");
  const [imageUploading, setImageUploading] = useState<boolean>(false);

  const [showAvatarEditor, setShowAvatarEditor] = useState<boolean>(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState<boolean>(false);
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [newPasswordValue, setNewPasswordValue] = useState<string>("");

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

  // --------------------------------------------------
  // Handle avatar image change from MediaUpload
  // --------------------------------------------------
  async function handleImageUrlChange(url: string) {
    setProfileImageUrl(url);

    try {
      const response = await fetch("/api/account/profile", {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: user?.name,
          email: user?.email,
          imageUrl: url,
        }),
      });

      if (response.ok) {
        setUser((currentUser) => {
          if (!currentUser) return currentUser;
          return {
            ...currentUser,
            imageUrl: url,
          };
        });
        toast.success("Profile photo updated");
      } else {
        toast.error("Failed to update profile photo");
      }
    } catch (err) {
      console.error("Error updating profile photo:", err);
      toast.error("Error updating profile photo");
    }
  }

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
        headers: {
          "Content-Type": "application/json",
        },
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

      setUser((currentUser) => {
        if (!currentUser) {
          return currentUser;
        }

        return {
          ...currentUser,
          name,
          email,
          imageUrl: profileImageUrl || null,
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
        return;
      }

      if (newPassword.length < 8) {
        setError("New password must contain at least 8 characters.");
        return;
      }

      if (currentPassword === newPassword) {
        setError(
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
    <main className="kyro-account-page">
      <style
        dangerouslySetInnerHTML={{
          __html: `
          .kyro-account-page {
            --kyro-bg: #f8f6f0;
            --kyro-surface: #fffefa;
            --kyro-paper: #fbfaf7;
            --kyro-ink: #171717;
            --kyro-gold: #aa8953;
            --kyro-gold-dark: #806537;
            --kyro-gold-light: #a27d3f;
            --kyro-muted: #777268;
            --kyro-line: rgba(23, 23, 23, 0.10);
            --kyro-line-gold: rgba(176, 141, 80, 0.20);

            min-height: 100vh;
            padding: 55px 24px 100px;
            color: var(--kyro-ink);

            background:
              radial-gradient(
                circle at 7% 8%,
                rgba(170, 137, 83, 0.075),
                transparent 25%
              ),
              radial-gradient(
                circle at 94% 20%,
                rgba(170, 137, 83, 0.055),
                transparent 24%
              ),
              linear-gradient(
                180deg,
                #f8f6f0 0%,
                #faf8f3 52%,
                #f3eee5 100%
              );

            animation: kyroAccountPageReveal 0.7s ease both;
          }

          .kyro-account-container {
            width: min(1180px, 100%);
            margin: 0 auto;
          }

          .kyro-account-layout {
            display: grid;
            grid-template-columns: 1fr 340px;
            gap: 22px;
            align-items: start;
          }

          @media (max-width: 1024px) {
            .kyro-account-layout {
              grid-template-columns: 1fr;
            }
          }

          /* =====================================================
             AVATAR CARD (LEFT/TOP COLUMN)
             ===================================================== */

          .kyro-account-sidebar {
            position: sticky;
            top: 95px;
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;

            padding: 28px 24px;
            border: 1px solid var(--kyro-line);
            border-radius: 20px;
            background: linear-gradient(
              145deg,
              rgba(255, 254, 250, 0.94),
              rgba(246, 242, 233, 0.78)
            );
            box-shadow: 0 15px 40px rgba(30, 25, 18, 0.045);
            backdrop-filter: blur(18px);

            animation: kyroAccountCardIn 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) both;
            animation-delay: 0.1s;
          }

          @media (max-width: 1024px) {
            .kyro-account-sidebar {
              position: relative;
              top: auto;
              flex-direction: column;
              align-items: center;
            }
          }

          .account-avatar-wrapper {
            position: relative;
            margin-bottom: 20px;
          }

          .account-avatar {
            position: relative;
            width: 120px;
            height: 120px;
            border-radius: 50%;
            border: 2px solid var(--kyro-gold);
            background: radial-gradient(
              circle at 50% 45%,
              #ffffff 0%,
              #f3eee5 58%,
              #e7e1d5 100%
            );
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--kyro-gold-dark);
            font-weight: 700;
            font-size: 42px;
            overflow: hidden;
            margin: 0 auto;
          }

          .account-avatar img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }

          .account-avatar-overlay {
            position: absolute;
            inset: 0;
            border-radius: 50%;
            background: rgba(23, 23, 23, 0.4);
            display: flex;
            align-items: center;
            justify-content: center;
            flex-direction: column;
            gap: 8px;
            cursor: pointer;
            opacity: 0;
            transition: opacity 0.3s ease;
          }

          .account-avatar:hover .account-avatar-overlay {
            opacity: 1;
          }

          .account-avatar-overlay-icon {
            font-size: 24px;
            color: white;
          }

          .account-avatar-overlay-text {
            font-size: 11px;
            font-weight: 600;
            color: white;
            text-transform: uppercase;
            letter-spacing: 0.08em;
          }

          .account-sidebar-name {
            margin: 0 0 8px;
            font-size: 20px;
            font-weight: 650;
            color: var(--kyro-ink);
          }

          .account-sidebar-email {
            margin: 0 0 16px;
            font-size: 12px;
            color: var(--kyro-muted);
            line-height: 1.5;
          }

          .account-role {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 999px;
            background: rgba(176, 141, 80, 0.1);
            color: var(--kyro-gold-dark);
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 0.08em;
          }

          .admin-kicker {
            display: block;
            margin-bottom: 12px;
            color: var(--kyro-gold-dark);
            font-size: 9px;
            font-weight: 800;
            letter-spacing: 0.22em;
            text-transform: uppercase;
          }

          /* =====================================================
             AVATAR EDITOR
             ===================================================== */

          .account-avatar-editor {
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid var(--kyro-line);
            width: 100%;
          }

          /* =====================================================
             FORMS SECTION (RIGHT/BOTTOM COLUMN)
             ===================================================== */

          .kyro-account-forms {
            display: flex;
            flex-direction: column;
            gap: 22px;
          }

          .account-intro {
            animation: kyroAccountCardIn 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) both;
          }

          .store-eyebrow {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            margin: 0 0 12px;
            color: var(--kyro-gold-dark);
            font-size: 9px;
            font-weight: 800;
            letter-spacing: 0.22em;
            text-transform: uppercase;
          }

          .store-eyebrow::before {
            content: '';
            width: 20px;
            height: 1px;
            background: var(--kyro-gold);
          }

          .account-intro h2 {
            margin: 0 0 12px;
            font-size: clamp(1.8rem, 4vw, 3.2rem);
            line-height: 1.1;
            letter-spacing: -0.045em;
            font-weight: 500;
          }

          .account-intro h2 em {
            font-family: Georgia, "Times New Roman", serif;
            font-weight: 400;
            color: var(--kyro-gold-dark);
            font-style: italic;
          }

          .account-intro p {
            margin: 0;
            color: var(--kyro-muted);
            font-size: 13px;
            line-height: 1.75;
          }

          /* =====================================================
             ALERTS
             ===================================================== */

          .account-alert {
            display: flex;
            align-items: flex-start;
            gap: 12px;
            padding: 14px 16px;
            border: 1px solid;
            border-radius: 14px;
            font-size: 12px;
            animation: kyroFadeUp 0.5s ease-out;
          }

          .account-alert.success {
            border-color: rgba(34, 197, 94, 0.2);
            background: rgba(34, 197, 94, 0.05);
            color: #15803d;
          }

          .account-alert.error {
            border-color: rgba(220, 38, 38, 0.2);
            background: rgba(220, 38, 38, 0.05);
            color: #991b1b;
          }

          .account-alert span {
            flex: 0 0 auto;
            font-weight: 700;
          }

          .account-alert p {
            margin: 0;
          }

          /* =====================================================
             FORM CARDS
             ===================================================== */

          .kyro-account-form {
            padding: 28px;
            border: 1px solid var(--kyro-line);
            border-radius: 20px;
            background: rgba(255, 254, 250, 0.9);
            box-shadow: 0 15px 40px rgba(30, 25, 18, 0.045);
            backdrop-filter: blur(18px);

            animation: kyroFormSectionReveal 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) both;
          }

          .kyro-account-form:nth-of-type(3) {
            animation-delay: 0.1s;
          }

          .kyro-account-form:nth-of-type(4) {
            animation-delay: 0.2s;
          }

          .account-form-header {
            display: flex;
            align-items: flex-start;
            gap: 16px;
            margin-bottom: 24px;
            padding-bottom: 20px;
            border-bottom: 1px solid var(--kyro-line);
          }

          .account-form-number {
            flex: 0 0 auto;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 44px;
            height: 44px;
            border-radius: 14px;
            background: var(--kyro-ink);
            color: white;
            font-weight: 700;
            font-size: 16px;
          }

          .account-form-title {
            flex: 1;
          }

          .account-form-title h3 {
            margin: 0 0 6px;
            font-size: 18px;
            font-weight: 650;
            color: var(--kyro-ink);
          }

          .account-form-title p {
            margin: 0;
            font-size: 13px;
            color: var(--kyro-muted);
            line-height: 1.6;
          }

          /* =====================================================
             FORM FIELDS
             ===================================================== */

          .form-field-group {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 18px;
            margin-bottom: 18px;
          }

          .form-field {
            display: flex;
            flex-direction: column;
          }

          .form-label {
            display: block;
            margin-bottom: 8px;
            color: var(--kyro-ink);
            font-size: 11px;
            font-weight: 800;
            letter-spacing: 0.14em;
            text-transform: uppercase;
          }

          .form-label small {
            font-weight: 400;
            color: var(--kyro-muted);
            letter-spacing: normal;
            text-transform: none;
            font-size: 10px;
          }

          .form-input-wrapper {
            position: relative;
            display: block;
          }

          .form-input {
            width: 100%;
            min-height: 44px;
            padding: 11px 16px 11px 44px;
            border: 1px solid var(--kyro-line);
            border-radius: 12px;
            background: rgba(255, 254, 250, 0.95);
            color: var(--kyro-ink);
            font-size: 13px;
            line-height: 1.5;
            outline: none;
            transition: all 0.3s ease;
          }

          .form-input::placeholder {
            color: var(--kyro-muted);
            opacity: 0.6;
          }

          .form-input:hover {
            border-color: rgba(176, 141, 80, 0.3);
            background: white;
          }

          .form-input:focus {
            border-color: var(--kyro-gold);
            background: white;
            box-shadow: 0 0 0 3px rgba(176, 141, 80, 0.15);
          }

          .form-input-icon {
            position: absolute;
            left: 14px;
            top: 50%;
            transform: translateY(-50%);
            color: var(--kyro-gold-dark);
            font-size: 16px;
            pointer-events: none;
          }

          .form-input.has-toggle-icon {
            padding-right: 44px;
          }

          .form-input-toggle {
            position: absolute;
            right: 14px;
            top: 50%;
            transform: translateY(-50%);
            background: none;
            border: none;
            color: var(--kyro-gold-dark);
            font-size: 16px;
            cursor: pointer;
            padding: 4px;
            transition: color 0.2s ease;
          }

          .form-input-toggle:hover {
            color: var(--kyro-gold);
          }

          /* =====================================================
             BUTTONS
             ===================================================== */

          .account-save {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            min-height: 44px;
            padding: 0 24px;
            border: none;
            border-radius: 999px;
            background: var(--kyro-ink);
            color: white;
            font-size: 12px;
            font-weight: 800;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            cursor: pointer;
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
          }

          .account-save::before {
            content: '';
            position: absolute;
            left: -100%;
            top: 0;
            width: 50%;
            height: 100%;
            background: linear-gradient(
              90deg,
              transparent,
              rgba(255, 255, 255, 0.2),
              transparent
            );
            transform: skewX(-20deg);
            transition: left 0.6s ease;
          }

          .account-save:hover::before {
            left: 135%;
          }

          .account-save:hover {
            transform: translateY(-2px);
            background: #2b2b2b;
            box-shadow: 0 10px 28px rgba(23, 23, 23, 0.15);
          }

          .account-save:active {
            transform: translateY(0);
          }

          .account-save:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none;
          }

          .account-save.secondary {
            background: transparent;
            border: 1px solid rgba(176, 141, 80, 0.4);
            color: var(--kyro-gold-dark);
          }

          .account-save.secondary:hover {
            border-color: rgba(176, 141, 80, 0.7);
            background: rgba(176, 141, 80, 0.08);
            color: var(--kyro-gold-dark);
          }

          .button-spinner {
            display: inline-block;
            width: 14px;
            height: 14px;
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-top-color: white;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
          }

          .account-save.secondary .button-spinner {
            border-color: rgba(128, 101, 55, 0.3);
            border-top-color: var(--kyro-gold-dark);
          }

          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }

          /* =====================================================
             PASSWORD STRENGTH INDICATOR
             ===================================================== */

          .password-strength {
            margin-top: 8px;
            display: flex;
            gap: 4px;
          }

          .strength-bar {
            flex: 1;
            height: 2px;
            border-radius: 1px;
            background: var(--kyro-line);
            transition: background 0.3s ease;
          }

          .strength-bar.filled {
            background: var(--kyro-muted);
          }

          .password-strength-label {
            margin-top: 6px;
            font-size: 10px;
            color: var(--kyro-muted);
            transition: color 0.2s ease;
          }

          /* =====================================================
             LOADING STATE
             ===================================================== */

          .account-loading {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            background: linear-gradient(
              180deg,
              #f8f6f0 0%,
              #faf8f3 52%,
              #f3eee5 100%
            );
          }

          .account-loading-content {
            text-align: center;
          }

          .account-spinner {
            width: 48px;
            height: 48px;
            margin: 0 auto 16px;
            border: 3px solid var(--kyro-line);
            border-top-color: var(--kyro-gold);
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }

          .account-loading p {
            margin: 0;
            color: var(--kyro-muted);
            font-size: 13px;
          }

          /* =====================================================
             MEDIA UPLOAD
             ===================================================== */

          .media-upload {
            margin-bottom: 18px;
          }

          .media-upload-label {
            display: block;
            margin-bottom: 8px;
            color: var(--kyro-ink);
            font-size: 11px;
            font-weight: 800;
            letter-spacing: 0.14em;
            text-transform: uppercase;
          }

          .media-dropzone {
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 140px;
            padding: 20px;
            border: 2px dashed var(--kyro-line);
            border-radius: 16px;
            background: rgba(255, 254, 250, 0.7);
            cursor: pointer;
            transition: all 0.3s ease;
            overflow: hidden;
          }

          .media-dropzone:hover {
            border-color: rgba(176, 141, 80, 0.4);
            background: rgba(176, 141, 80, 0.02);
          }

          .media-dropzone.drag-active {
            border-color: var(--kyro-gold);
            background: rgba(176, 141, 80, 0.08);
          }

          .media-dropzone.has-image {
            border-style: solid;
            border-width: 1px;
            background: rgba(255, 254, 250, 0.9);
            min-height: auto;
          }

          .media-preview {
            position: absolute;
            inset: 0;
            background-size: cover;
            background-position: center;
            border-radius: 14px;
            opacity: 0.3;
          }

          .media-placeholder {
            font-size: 32px;
            color: var(--kyro-gold);
            margin-right: 12px;
          }

          .media-copy {
            display: flex;
            flex-direction: column;
            text-align: center;
            pointer-events: none;
          }

          .media-copy strong {
            display: block;
            margin-bottom: 4px;
            color: var(--kyro-ink);
            font-size: 13px;
            font-weight: 600;
          }

          .media-copy small {
            display: block;
            color: var(--kyro-muted);
            font-size: 11px;
            line-height: 1.5;
          }

          .media-error {
            display: block;
            margin-top: 8px;
            color: #991b1b;
            font-size: 11px;
          }

          .media-dropzone input[type="file"] {
            display: none;
          }

          /* =====================================================
             MOBILE RESPONSIVE
             ===================================================== */

          @media (max-width: 1024px) {
            .kyro-account-page {
              padding: 45px 20px 80px;
            }

            .form-field-group {
              grid-template-columns: 1fr;
            }
          }

          @media (max-width: 640px) {
            .kyro-account-page {
              padding: 40px 16px 60px;
            }

            .kyro-account-form {
              padding: 20px 16px;
            }

            .account-form-header {
              flex-direction: column;
            }

            .account-form-number {
              align-self: flex-start;
            }

            .form-label {
              font-size: 10px;
            }

            .form-input {
              min-height: 44px;
            }

            .account-avatar {
              width: 96px;
              height: 96px;
              font-size: 36px;
            }

            .account-sidebar-name {
              font-size: 18px;
            }

            .account-intro h2 {
              font-size: clamp(1.4rem, 3vw, 2rem);
            }
          }

          /* =====================================================
             KEYFRAME ANIMATIONS
             ===================================================== */

          @keyframes kyroAccountPageReveal {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes kyroAccountCardIn {
            0% {
              opacity: 0;
              transform: translateY(-12px) scale(0.98);
              filter: blur(1px);
            }
            100% {
              opacity: 1;
              transform: translateY(0) scale(1);
              filter: blur(0);
            }
          }

          @keyframes kyroFormSectionReveal {
            0% {
              opacity: 0;
              transform: translateY(14px) scale(0.98);
              filter: blur(1px);
            }
            100% {
              opacity: 1;
              transform: translateY(0) scale(1);
              filter: blur(0);
            }
          }

          @keyframes kyroFadeUp {
            from {
              opacity: 0;
              transform: translateY(12px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          `,
        }}
      />

      <section className="kyro-account-container">
        <div className="kyro-account-layout">
          {/* ============================================
              AVATAR SIDEBAR
          ============================================ */}
          <aside className="kyro-account-sidebar">
            <div className="account-avatar-wrapper">
              <div className="account-avatar">
                {profileImageUrl ? (
                  <Image
                    src={profileImageUrl}
                    alt={`${user.name}'s profile`}
                    fill
                    sizes="120px"
                    style={{ objectFit: "cover" }}
                  />
                ) : (
                  <span>{initials}</span>
                )}
                <div
                  className="account-avatar-overlay"
                  onClick={() => setShowAvatarEditor(!showAvatarEditor)}
                >
                  <div className="account-avatar-overlay-icon">📷</div>
                  <div className="account-avatar-overlay-text">Change Photo</div>
                </div>
              </div>
            </div>

            <span className="admin-kicker">YOUR SCENT JOURNAL</span>

            <h2 className="account-sidebar-name">{user.name}</h2>

            <p className="account-sidebar-email">{user.email}</p>

            <span className="account-role">
              {isAdmin ? "Administrator" : "Scent collector"}
            </span>

            {showAvatarEditor && (
              <div className="account-avatar-editor">
                <MediaUpload
                  name="profileImageUrl"
                  initialUrl={profileImageUrl}
                  onChange={handleImageUrlChange}
                  onUploadStateChange={setImageUploading}
                />
              </div>
            )}
          </aside>

          {/* ============================================
              MAIN FORMS
          ============================================ */}
          <div className="kyro-account-forms">
            {/* INTRO */}
            <div className="account-intro">
              <p className="store-eyebrow">THE PRIVATE EDIT</p>
              <h2>
                Make your account feel like <em>you.</em>
              </h2>
              <p>
                Manage your profile, protect your account, and keep your fragrance journey close.
              </p>
            </div>

            {/* ==========================================
                ALERTS
            ========================================== */}
            {notice && (
              <div className="account-alert success" role="status">
                <span>✓</span>
                <p>{notice}</p>
              </div>
            )}

            {error && (
              <div className="account-alert error" role="alert">
                <span>!</span>
                <p>{error}</p>
              </div>
            )}

            {/* ==========================================
                PROFILE FORM
            ========================================== */}
            <form className="kyro-account-form" onSubmit={updateProfile}>
              <div className="account-form-header">
                <div className="account-form-number">01</div>
                <div className="account-form-title">
                  <h3>Personal Details</h3>
                  <p>The name and email attached to your Kyro account.</p>
                </div>
              </div>

              <div className="form-field-group">
                <div className="form-field">
                  <label className="form-label">
                    Display name
                  </label>
                  <div className="form-input-wrapper">
                    <svg
                      className="form-input-icon"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    <input
                      className="form-input"
                      name="name"
                      type="text"
                      defaultValue={user.name}
                      placeholder="Your name"
                      autoComplete="name"
                      required
                      minLength={2}
                    />
                  </div>
                </div>

                <div className="form-field">
                  <label className="form-label">
                    Email address
                  </label>
                  <div className="form-input-wrapper">
                    <svg
                      className="form-input-icon"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                      <path d="m10 9 5 3.5L20 9"></path>
                    </svg>
                    <input
                      className="form-input"
                      name="email"
                      type="email"
                      defaultValue={user.email}
                      placeholder="you@example.com"
                      autoComplete="email"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="form-field">
                <label className="form-label">Profile Photo</label>
                <MediaUpload
                  name="profileImageUrl"
                  initialUrl={profileImageUrl}
                  onChange={handleImageUrlChange}
                  onUploadStateChange={setImageUploading}
                />
              </div>

              <button
                className="account-save"
                type="submit"
                disabled={savingProfile || imageUploading}
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
            <form className="kyro-account-form" onSubmit={updatePassword}>
              <div className="account-form-header">
                <div className="account-form-number">02</div>
                <div className="account-form-title">
                  <h3>Account Security</h3>
                  <p>Change your password whenever you need to.</p>
                </div>
              </div>

              <div className="form-field-group">
                <div className="form-field">
                  <label className="form-label">Current password</label>
                  <div className="form-input-wrapper">
                    <svg
                      className="form-input-icon"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                    <input
                      className="form-input has-toggle-icon"
                      name="currentPassword"
                      type={showCurrentPassword ? "text" : "password"}
                      placeholder="Enter current password"
                      autoComplete="current-password"
                      required
                    />
                    <button
                      type="button"
                      className="form-input-toggle"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? "👁" : "👁‍🗨"}
                    </button>
                  </div>
                </div>

                <div className="form-field">
                  <label className="form-label">New password</label>
                  <div className="form-input-wrapper">
                    <svg
                      className="form-input-icon"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                    <input
                      className="form-input has-toggle-icon"
                      name="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      placeholder="Minimum 8 characters"
                      autoComplete="new-password"
                      minLength={8}
                      required
                      value={newPasswordValue}
                      onChange={(e) => setNewPasswordValue(e.target.value)}
                    />
                    <button
                      type="button"
                      className="form-input-toggle"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? "👁" : "👁‍🗨"}
                    </button>
                  </div>
                </div>
              </div>

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
        </div>
      </section>
    </main>
  );
}

