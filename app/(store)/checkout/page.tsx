"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import toast from "react-hot-toast";
import { readCart, saveCart, CartItem } from "@/lib/cart";
import { supabase } from "@/lib/supabase";

type SavedAddress = {
  id?: string;
  name: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  postalCode: string;
  country: string;
};

type User = {
  name: string;
  email: string;
  imageUrl?: string;
  saved_addresses: SavedAddress[];
};

type CheckoutStep = "delivery" | "payment" | "review";

export default function CheckoutPage() {
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState<CheckoutStep>("delivery");
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Delivery form state
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [deliveryForm, setDeliveryForm] = useState<SavedAddress>({
    name: "",
    email: "",
    phone: "",
    street: "",
    city: "",
    postalCode: "",
    country: "",
  });
  const [saveAddress, setSaveAddress] = useState(false);

  // Payment state
  const [receiptUrl, setReceiptUrl] = useState<string>("");
  const [receiptFilename, setReceiptFilename] = useState<string>("");
  const [uploadingReceipt, setUploadingReceipt] = useState(false);

  // Load cart and user on mount
  useEffect(() => {
    async function init() {
      const cart = readCart();
      if (!cart.length) {
        router.push("/cart");
        return;
      }

      setCartItems(cart);

      // Check session
      try {
        const sessionRes = await fetch("/api/auth/session", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        if (!sessionRes.ok) {
          router.push("/login");
          return;
        }

        // Fetch user profile
        const profileRes = await fetch("/api/account/profile", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        if (profileRes.ok) {
          const userData = (await profileRes.json()) as User;
          setUser(userData);
          if (userData.saved_addresses?.length > 0) {
            setSelectedAddressId(userData.saved_addresses[0].id || "0");
            setDeliveryForm(userData.saved_addresses[0]);
          } else if (userData.email) {
            setDeliveryForm((prev) => ({
              ...prev,
              name: userData.name || "",
              email: userData.email,
            }));
          }
        }
      } catch (err) {
        console.error("Initialization error:", err);
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [router]);

  // Handle delivery form change
  function handleDeliveryChange(
    field: keyof SavedAddress,
    value: string
  ) {
    setDeliveryForm((prev) => ({
      ...prev,
      [field]: value,
    }));
    setSelectedAddressId("");
  }

  // Select saved address
  function selectSavedAddress(address: SavedAddress, index: number) {
    setSelectedAddressId(address.id || String(index));
    setDeliveryForm(address);
  }

  // Proceed to payment
  function proceedToPayment() {
    if (
      !deliveryForm.name ||
      !deliveryForm.email ||
      !deliveryForm.phone ||
      !deliveryForm.street ||
      !deliveryForm.city ||
      !deliveryForm.postalCode ||
      !deliveryForm.country
    ) {
      toast.error("Please fill in all delivery fields");
      return;
    }

    // Save address if checkbox is checked
    if (saveAddress && user && selectedAddressId === "") {
      handleSaveAddress();
    }

    setCurrentStep("payment");
  }

  // Save address to profile
  async function handleSaveAddress() {
    try {
      const newAddress = {
        ...deliveryForm,
        id: Date.now().toString(),
      };

      const addresses = user?.saved_addresses || [];
      addresses.push(newAddress);

      await fetch("/api/account/profile", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: user?.name,
          email: user?.email,
          saved_addresses: addresses,
        }),
      });

      setUser((prev) =>
        prev ? { ...prev, saved_addresses: addresses } : null
      );
      toast.success("Address saved for future orders");
    } catch (err) {
      console.error("Error saving address:", err);
    }
  }

  // Handle receipt upload
  async function handleReceiptUpload(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    setUploadingReceipt(true);
    try {
      const fileName = `receipts/${Date.now()}_${file.name}`;
      const { data, error } = await supabase.storage
        .from("images")
        .upload(fileName, file);

      if (error) throw error;

      const {
        data: { publicUrl },
      } = supabase.storage.from("images").getPublicUrl(fileName);

      setReceiptUrl(publicUrl);
      setReceiptFilename(file.name);
      toast.success("Receipt uploaded successfully");
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Failed to upload receipt");
    } finally {
      setUploadingReceipt(false);
    }
  }

  // Place order
  async function placeOrder() {
    if (!receiptUrl) {
      toast.error("Please upload a payment receipt");
      return;
    }

    // Snapshot cart items before clearing
    const cartSnapshot = [...cartItems];

    // Optimistic UI: clear cart immediately before fetch
    saveCart([]);
    setCartItems([]);
    setSubmitting(true);
    const submittingToastId = toast.loading("Placing your order...");

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          items: cartSnapshot,
          delivery_address: deliveryForm,
          payment_slip_url: receiptUrl,
          payment_slip_filename: receiptFilename,
        }),
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      const data = (await response.json()) as {
        message?: string;
        orderId?: string;
      };

      if (!response.ok) {
        throw new Error(data.message || "Failed to place order");
      }

      // Dismiss loading toast and show success
      toast.dismiss(submittingToastId);
      toast.success(`Order ${data.orderId} placed successfully!`);

      // Navigate after short delay
      setTimeout(() => {
        router.push("/orders");
      }, 1500);
    } catch (err) {
      // Restore cart on error
      saveCart(cartSnapshot);
      setCartItems(cartSnapshot);

      // Dismiss loading toast and show error
      toast.dismiss(submittingToastId);
      toast.error(
        err instanceof Error ? err.message : "Failed to place order"
      );
    } finally {
      setSubmitting(false);
    }
  }

  // Calculate totals
  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  if (loading) {
    return (
      <main className="checkout-loading">
        <div className="checkout-spinner" />
      </main>
    );
  }

  return (
    <main className="kyro-checkout-page">
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .kyro-checkout-page {
          --kyro-bg: #f8f6f0;
          --kyro-surface: #fffefa;
          --kyro-paper: #fbfaf7;
          --kyro-ink: #171717;
          --kyro-gold: #aa8953;
          --kyro-gold-dark: #806537;
          --kyro-muted: #777268;
          --kyro-line: rgba(23, 23, 23, 0.10);

          min-height: 100vh;
          padding: 55px 24px 100px;
          color: var(--kyro-ink);
          background:
            radial-gradient(circle at 7% 8%, rgba(170,137,83,0.075), transparent 25%),
            radial-gradient(circle at 94% 20%, rgba(170,137,83,0.055), transparent 24%),
            linear-gradient(180deg, #f8f6f0 0%, #faf8f3 52%, #f3eee5 100%);
        }

        .checkout-container {
          width: min(1000px, 100%);
          margin: 0 auto;
        }

        .checkout-header {
          margin-bottom: 40px;
          animation: kyroSlideUp 0.75s cubic-bezier(.2,.8,.2,1) both;
        }

        .checkout-heading h1 {
          margin: 0 0 8px;
          font-size: clamp(2rem, 5vw, 3.6rem);
          line-height: 1;
          font-weight: 500;
        }

        .checkout-heading p {
          margin: 0;
          color: var(--kyro-muted);
          font-size: 13px;
        }

        /* Progress Indicator */
        .progress-indicator {
          display: flex;
          justify-content: space-between;
          margin-bottom: 40px;
          gap: 20px;
        }

        .progress-step {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .progress-circle {
          width: 40px;
          height: 40px;
          min-width: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 700;
          border: 2px solid var(--kyro-line);
          background: var(--kyro-surface);
          color: var(--kyro-muted);
          transition: all 0.3s ease;
        }

        .progress-step.active .progress-circle {
          border-color: var(--kyro-gold);
          background: var(--kyro-gold);
          color: white;
        }

        .progress-step.completed .progress-circle {
          background: var(--kyro-gold);
          color: white;
          border-color: var(--kyro-gold);
        }

        .progress-label {
          font-size: 12px;
          font-weight: 600;
          color: var(--kyro-muted);
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        .progress-step.active .progress-label {
          color: var(--kyro-gold);
        }

        /* Layout */
        .checkout-layout {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 22px;
          align-items: start;
        }

        @media (max-width: 768px) {
          .checkout-layout {
            grid-template-columns: 1fr;
          }
        }

        /* Form Card */
        .checkout-form-card {
          padding: 32px;
          border: 1px solid var(--kyro-line);
          border-radius: 20px;
          background: rgba(255,254,250,0.9);
          box-shadow: 0 15px 40px rgba(30,25,18,0.045);
          animation: kyroSlideUp 0.8s 0.1s cubic-bezier(.2,.8,.2,1) both;
        }

        .form-section-title {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 1px solid var(--kyro-line);
        }

        .form-section-number {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: var(--kyro-ink);
          color: white;
          font-weight: 700;
          font-size: 14px;
        }

        .form-section-title h2 {
          margin: 0;
          font-size: 18px;
          color: var(--kyro-ink);
        }

        /* Saved Addresses */
        .saved-addresses-list {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 12px;
          margin-bottom: 24px;
        }

        .address-card {
          padding: 16px;
          border: 2px solid var(--kyro-line);
          border-radius: 12px;
          background: var(--kyro-surface);
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .address-card:hover {
          border-color: rgba(170,137,83,0.3);
          background: #fffefa;
        }

        .address-card.selected {
          border-color: var(--kyro-gold);
          background: rgba(170,137,83,0.05);
        }

        .address-card-name {
          margin: 0 0 6px;
          font-size: 12px;
          font-weight: 700;
          color: var(--kyro-ink);
        }

        .address-card-details {
          margin: 0;
          font-size: 11px;
          color: var(--kyro-muted);
          line-height: 1.5;
        }

        /* Form Fields */
        .form-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 16px;
        }

        .form-field {
          display: flex;
          flex-direction: column;
        }

        .form-label {
          margin-bottom: 6px;
          font-size: 11px;
          font-weight: 700;
          color: var(--kyro-ink);
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        .form-input {
          padding: 11px 14px;
          border: 1px solid var(--kyro-line);
          border-radius: 8px;
          background: var(--kyro-surface);
          font-size: 13px;
          color: var(--kyro-ink);
          transition: all 0.3s ease;
        }

        .form-input::placeholder {
          color: var(--kyro-muted);
        }

        .form-input:focus {
          outline: none;
          border-color: var(--kyro-gold);
          box-shadow: 0 0 0 3px rgba(170,137,83,0.15);
        }

        .checkbox-wrapper {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 16px;
        }

        .checkbox-wrapper input {
          width: 18px;
          height: 18px;
          cursor: pointer;
          accent-color: var(--kyro-gold);
        }

        .checkbox-wrapper label {
          font-size: 12px;
          color: var(--kyro-muted);
          cursor: pointer;
        }

        /* Bank Details */
        .bank-details {
          padding: 16px;
          border: 1px solid var(--kyro-line);
          border-radius: 8px;
          background: var(--kyro-surface);
          font-family: 'Courier New', monospace;
          font-size: 12px;
          color: var(--kyro-ink);
          line-height: 1.8;
          margin-bottom: 24px;
        }

        .bank-details-label {
          margin: 0 0 12px;
          font-size: 11px;
          font-weight: 700;
          color: var(--kyro-gold-dark);
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        /* Receipt Upload */
        .receipt-upload {
          margin-bottom: 24px;
        }

        .upload-label {
          display: block;
          margin-bottom: 8px;
          font-size: 11px;
          font-weight: 700;
          color: var(--kyro-ink);
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        .upload-dropzone {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 120px;
          padding: 20px;
          border: 2px dashed var(--kyro-line);
          border-radius: 12px;
          background: var(--kyro-surface);
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .upload-dropzone:hover {
          border-color: rgba(170,137,83,0.3);
          background: #fffefa;
        }

        .upload-dropzone.has-image {
          border-style: solid;
          border-width: 1px;
          min-height: auto;
        }

        .upload-placeholder {
          text-align: center;
          color: var(--kyro-muted);
          font-size: 12px;
        }

        .upload-placeholder strong {
          display: block;
          margin-bottom: 4px;
          color: var(--kyro-ink);
        }

        .upload-input {
          display: none;
        }

        .receipt-preview {
          position: relative;
          margin-top: 12px;
          border-radius: 8px;
          overflow: hidden;
          max-width: 100%;
          max-height: 200px;
        }

        .receipt-preview img {
          width: 100%;
          height: auto;
          display: block;
        }

        /* Order Review */
        .review-section {
          margin-bottom: 24px;
        }

        .review-section-title {
          margin: 0 0 12px;
          font-size: 12px;
          font-weight: 700;
          color: var(--kyro-gold-dark);
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        .review-item {
          display: grid;
          grid-template-columns: 80px 1fr auto;
          gap: 16px;
          padding: 12px;
          border: 1px solid var(--kyro-line);
          border-radius: 8px;
          margin-bottom: 10px;
          background: var(--kyro-surface);
        }

        .review-item-image {
          width: 80px;
          height: 80px;
          border-radius: 6px;
          background: radial-gradient(circle at 50% 45%, #ffffff, #f3eee5);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .review-item-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .review-item-details {
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .review-item-name {
          margin: 0 0 4px;
          font-size: 13px;
          font-weight: 600;
          color: var(--kyro-ink);
        }

        .review-item-meta {
          font-size: 11px;
          color: var(--kyro-muted);
        }

        .review-item-price {
          text-align: right;
          display: flex;
          flex-direction: column;
          justify-content: center;
          font-weight: 600;
          font-size: 12px;
        }

        .review-totals {
          padding: 16px;
          border: 1px solid var(--kyro-line);
          border-radius: 8px;
          background: rgba(170,137,83,0.05);
        }

        .total-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          font-size: 12px;
        }

        .total-row.final {
          margin-bottom: 0;
          padding-top: 8px;
          border-top: 1px solid var(--kyro-line);
          font-size: 16px;
          font-weight: 700;
          color: var(--kyro-gold);
        }

        /* Buttons */
        .button-group {
          display: flex;
          gap: 12px;
          margin-top: 24px;
        }

        .button-group button {
          flex: 1;
        }

        .btn-primary,
        .btn-secondary {
          padding: 13px 24px;
          border: none;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-primary {
          background: var(--kyro-ink);
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 28px rgba(23,23,23,0.15);
        }

        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-secondary {
          background: transparent;
          border: 1px solid var(--kyro-line);
          color: var(--kyro-ink);
        }

        .btn-secondary:hover {
          border-color: var(--kyro-gold);
          background: rgba(170,137,83,0.05);
        }

        /* Summary Sidebar */
        .checkout-summary {
          position: sticky;
          top: 95px;
          padding: 24px;
          border: 1px solid var(--kyro-line);
          border-radius: 20px;
          background: linear-gradient(145deg, rgba(255,254,250,0.94), rgba(246,242,233,0.78));
          box-shadow: 0 15px 40px rgba(30,25,18,0.045);
          animation: kyroSlideUp 0.8s 0.2s cubic-bezier(.2,.8,.2,1) both;
        }

        .summary-title {
          margin: 0 0 16px;
          font-size: 14px;
          font-weight: 700;
          color: var(--kyro-ink);
        }

        .summary-items {
          margin-bottom: 16px;
          max-height: 300px;
          overflow-y: auto;
        }

        .summary-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
          font-size: 11px;
          color: var(--kyro-muted);
        }

        .summary-item-name {
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .summary-item-price {
          font-weight: 600;
          color: var(--kyro-ink);
        }

        .summary-divider {
          height: 1px;
          background: var(--kyro-line);
          margin: 12px 0;
        }

        .summary-total {
          font-size: 18px;
          font-weight: 700;
          color: var(--kyro-gold);
          text-align: right;
        }

        /* Loading */
        .checkout-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          background: linear-gradient(180deg, #f8f6f0 0%, #faf8f3 52%, #f3eee5 100%);
        }

        .checkout-spinner {
          width: 48px;
          height: 48px;
          border: 3px solid var(--kyro-line);
          border-top-color: var(--kyro-gold);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @keyframes kyroSlideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 768px) {
          .checkout-form-card {
            padding: 24px;
          }

          .saved-addresses-list {
            grid-template-columns: 1fr;
          }

          .review-item {
            grid-template-columns: 60px 1fr;
          }

          .review-item-price {
            grid-column: 1 / -1;
            text-align: left;
            margin-top: 8px;
          }
        }
      `,
        }}
      />

      <div className="checkout-container">
        {/* Header */}
        <div className="checkout-header">
          <div className="checkout-heading">
            <h1>Checkout</h1>
            <p>Complete your order in just 3 steps</p>
          </div>
        </div>

        {/* Progress */}
        <div className="progress-indicator">
          {(["delivery", "payment", "review"] as const).map((step, idx) => (
            <div
              key={step}
              className={`progress-step ${
                currentStep === step
                  ? "active"
                  : idx < (["delivery", "payment", "review"] as const).indexOf(currentStep)
                  ? "completed"
                  : ""
              }`}
            >
              <div className="progress-circle">{idx + 1}</div>
              <span className="progress-label">
                {step === "delivery"
                  ? "Delivery"
                  : step === "payment"
                  ? "Payment"
                  : "Review"}
              </span>
            </div>
          ))}
        </div>

        {/* Main Layout */}
        <div className="checkout-layout">
          {/* Forms */}
          <div>
            {/* Step 1: Delivery */}
            {currentStep === "delivery" && (
              <div className="checkout-form-card">
                <div className="form-section-title">
                  <div className="form-section-number">1</div>
                  <h2>Delivery Details</h2>
                </div>

                {/* Saved Addresses */}
                {user?.saved_addresses && user.saved_addresses.length > 0 && (
                  <>
                    <p style={{ margin: "0 0 12px", fontSize: "12px", color: "var(--kyro-muted)" }}>
                      Or select a saved address:
                    </p>
                    <div className="saved-addresses-list">
                      {user.saved_addresses.map((addr, idx) => (
                        <div
                          key={idx}
                          className={`address-card ${
                            selectedAddressId === (addr.id || String(idx))
                              ? "selected"
                              : ""
                          }`}
                          onClick={() => selectSavedAddress(addr, idx)}
                        >
                          <p className="address-card-name">{addr.name}</p>
                          <p className="address-card-details">
                            {addr.street}
                            <br />
                            {addr.city}, {addr.postalCode}
                          </p>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* Form */}
                <div className="form-row">
                  <div className="form-field">
                    <label className="form-label">Full Name</label>
                    <input
                      className="form-input"
                      type="text"
                      value={deliveryForm.name}
                      onChange={(e) =>
                        handleDeliveryChange("name", e.target.value)
                      }
                      placeholder="John Doe"
                    />
                  </div>
                  <div className="form-field">
                    <label className="form-label">Email</label>
                    <input
                      className="form-input"
                      type="email"
                      value={deliveryForm.email}
                      onChange={(e) =>
                        handleDeliveryChange("email", e.target.value)
                      }
                      placeholder="john@example.com"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-field">
                    <label className="form-label">Phone</label>
                    <input
                      className="form-input"
                      type="tel"
                      value={deliveryForm.phone}
                      onChange={(e) =>
                        handleDeliveryChange("phone", e.target.value)
                      }
                      placeholder="+94 xx xxx xxxx"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-field">
                    <label className="form-label">Street Address</label>
                    <input
                      className="form-input"
                      type="text"
                      value={deliveryForm.street}
                      onChange={(e) =>
                        handleDeliveryChange("street", e.target.value)
                      }
                      placeholder="123 Main Street"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-field">
                    <label className="form-label">City</label>
                    <input
                      className="form-input"
                      type="text"
                      value={deliveryForm.city}
                      onChange={(e) =>
                        handleDeliveryChange("city", e.target.value)
                      }
                      placeholder="Colombo"
                    />
                  </div>
                  <div className="form-field">
                    <label className="form-label">Postal Code</label>
                    <input
                      className="form-input"
                      type="text"
                      value={deliveryForm.postalCode}
                      onChange={(e) =>
                        handleDeliveryChange("postalCode", e.target.value)
                      }
                      placeholder="12345"
                    />
                  </div>
                  <div className="form-field">
                    <label className="form-label">Country</label>
                    <input
                      className="form-input"
                      type="text"
                      value={deliveryForm.country}
                      onChange={(e) =>
                        handleDeliveryChange("country", e.target.value)
                      }
                      placeholder="Sri Lanka"
                    />
                  </div>
                </div>

                <div className="checkbox-wrapper">
                  <input
                    type="checkbox"
                    id="saveAddr"
                    checked={saveAddress}
                    onChange={(e) => setSaveAddress(e.target.checked)}
                  />
                  <label htmlFor="saveAddr">
                    Save this address for future orders
                  </label>
                </div>

                <div className="button-group">
                  <button className="btn-secondary" onClick={() => router.back()}>
                    Back
                  </button>
                  <button
                    className="btn-primary"
                    onClick={proceedToPayment}
                  >
                    Next: Payment
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Payment */}
            {currentStep === "payment" && (
              <div className="checkout-form-card">
                <div className="form-section-title">
                  <div className="form-section-number">2</div>
                  <h2>Payment Details</h2>
                </div>

                <div style={{ marginBottom: "24px" }}>
                  <p style={{ margin: "0 0 12px", fontSize: "12px", color: "var(--kyro-muted)" }}>
                    Bank Transfer Instructions
                  </p>
                  <div className="bank-details">
                    <strong>Bank:</strong> People's Bank
                    <br />
                    <strong>Account Name:</strong> Kyro Fragrances
                    <br />
                    <strong>Account Number:</strong> 212-1-002-3-0030826
                    <br />
                    <strong>Branch:</strong> Kiribathgoda
                    <br />
                    <strong>Swift/BIC:</strong> PSBKLKLX
                  </div>
                </div>

                <div className="receipt-upload">
                  <label className="upload-label">Upload Payment Receipt</label>
                  <div
                    className={`upload-dropzone ${
                      receiptUrl ? "has-image" : ""
                    }`}
                    onClick={() =>
                      document.getElementById("receipt-input")?.click()
                    }
                  >
                    {receiptUrl ? (
                      <div style={{ width: "100%" }}>
                        <p className="upload-placeholder">
                          <strong>Receipt Uploaded</strong>
                          {receiptFilename}
                        </p>
                        <img
                          src={receiptUrl}
                          alt="Receipt preview"
                          style={{
                            maxWidth: "100%",
                            maxHeight: "150px",
                            borderRadius: "6px",
                            marginTop: "8px",
                          }}
                        />
                      </div>
                    ) : (
                      <div className="upload-placeholder">
                        <strong>Click to upload receipt</strong>
                        or drag and drop
                        <br />
                        <small>(JPG, PNG)</small>
                      </div>
                    )}
                  </div>
                  <input
                    id="receipt-input"
                    className="upload-input"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleReceiptUpload(file);
                    }}
                  />
                </div>

                <div className="button-group">
                  <button
                    className="btn-secondary"
                    onClick={() => setCurrentStep("delivery")}
                  >
                    Back
                  </button>
                  <button
                    className="btn-primary"
                    onClick={() => setCurrentStep("review")}
                    disabled={!receiptUrl || uploadingReceipt}
                  >
                    Next: Review
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Review */}
            {currentStep === "review" && (
              <div className="checkout-form-card">
                <div className="form-section-title">
                  <div className="form-section-number">3</div>
                  <h2>Order Review</h2>
                </div>

                <div className="review-section">
                  <p className="review-section-title">Items</p>
                  {cartItems.map((item) => (
                    <div key={item.productId} className="review-item">
                      <div className="review-item-image">
                        {item.imageUrl ? (
                          <Image
                            src={item.imageUrl}
                            alt={item.name}
                            width={80}
                            height={80}
                            style={{ objectFit: "cover" }}
                          />
                        ) : (
                          "🧴"
                        )}
                      </div>
                      <div className="review-item-details">
                        <p className="review-item-name">{item.name}</p>
                        <p className="review-item-meta">
                          {item.size && `${item.size} • `}
                          Qty: {item.quantity}
                        </p>
                      </div>
                      <div className="review-item-price">
                        Rs {(item.price * item.quantity).toLocaleString(
                          "en-LK"
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="review-section">
                  <p className="review-section-title">Delivery To</p>
                  <div
                    style={{
                      padding: "12px",
                      border: "1px solid var(--kyro-line)",
                      borderRadius: "8px",
                      background: "var(--kyro-surface)",
                      fontSize: "12px",
                      color: "var(--kyro-ink)",
                    }}
                  >
                    <strong>{deliveryForm.name}</strong>
                    <br />
                    {deliveryForm.street}
                    <br />
                    {deliveryForm.city}, {deliveryForm.postalCode}
                    <br />
                    {deliveryForm.country}
                    <br />
                    Phone: {deliveryForm.phone}
                  </div>
                </div>

                <div className="review-section">
                  <p className="review-section-title">Payment</p>
                  <div
                    style={{
                      padding: "12px",
                      border: "1px solid var(--kyro-line)",
                      borderRadius: "8px",
                      background: "var(--kyro-surface)",
                      fontSize: "11px",
                      color: "var(--kyro-muted)",
                    }}
                  >
                    Receipt: {receiptFilename}
                  </div>
                </div>

                <div className="button-group">
                  <button
                    className="btn-secondary"
                    onClick={() => setCurrentStep("payment")}
                  >
                    Back
                  </button>
                  <button
                    className="btn-primary"
                    onClick={placeOrder}
                    disabled={submitting}
                  >
                    {submitting ? "Placing Order..." : "Place Order"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Summary Sidebar */}
          <div className="checkout-summary">
            <h3 className="summary-title">Order Summary</h3>

            <div className="summary-items">
              {cartItems.map((item) => (
                <div key={item.productId} className="summary-item">
                  <span className="summary-item-name">
                    {item.name} × {item.quantity}
                  </span>
                  <span className="summary-item-price">
                    Rs {(item.price * item.quantity).toLocaleString("en-LK")}
                  </span>
                </div>
              ))}
            </div>

            <div className="summary-divider" />

            <div className="summary-total">
              Rs {subtotal.toLocaleString("en-LK")}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
