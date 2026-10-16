"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import toast from "react-hot-toast";
import { FaWhatsapp } from "react-icons/fa";
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

type CheckoutStep = "delivery" | "review" | "payment";

type CheckoutProgress = {
  currentStep: CheckoutStep;
  deliveryForm: SavedAddress;
  confirmedOrder?: {
    referenceNumber: string;
    orderId: string;
    items: CartItem[];
    total: number;
  };
  savedAt: number;
};

export default function CheckoutPage() {
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState<CheckoutStep>("delivery");
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Confirmed order state
  const [confirmedOrder, setConfirmedOrder] = useState<{
    referenceNumber: string;
    orderId: string;
    items: CartItem[];
    total: number;
  } | null>(null);

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
  const [tempReferenceNumber, setTempReferenceNumber] = useState<string>("");

  // Progress saving state
  const [progressSaved, setProgressSaved] = useState(false);

  // Save checkout progress to localStorage
  function saveCheckoutProgress() {
    const progress: CheckoutProgress = {
      currentStep,
      deliveryForm,
      confirmedOrder: confirmedOrder || undefined,
      savedAt: Date.now(),
    };
    localStorage.setItem("kyro_checkout_progress", JSON.stringify(progress));
    setProgressSaved(true);
    setTimeout(() => setProgressSaved(false), 2000);
  }

  // Load cart and user on mount, and restore progress if available
  useEffect(() => {
    async function init() {
      // Check for saved progress first
      const savedProgress = localStorage.getItem("kyro_checkout_progress");
      if (savedProgress) {
        try {
          const progress = JSON.parse(savedProgress) as CheckoutProgress;
          // Check if saved data is within 2 hours (7200000ms)
          if (Date.now() - progress.savedAt < 7200000) {
            setCurrentStep(progress.currentStep);
            setDeliveryForm(progress.deliveryForm);
            if (progress.confirmedOrder) {
              setConfirmedOrder(progress.confirmedOrder);
            }
            toast.success("✓ Checkout progress restored");
          }
        } catch (err) {
          console.error("Error restoring checkout progress:", err);
        }
      }

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

  // Proceed to review
  function proceedToReview() {
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

    // Save progress before moving to review
    saveCheckoutProgress();
    setCurrentStep("review");
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

  // Confirm order (creates order and generates reference number, then goes to payment)
  async function confirmOrder() {
    // Snapshot cart items
    const cartSnapshot = [...cartItems];

    setSubmitting(true);
    const submittingToastId = toast.loading("Creating your order...");

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          items: cartSnapshot,
          delivery_address: deliveryForm,
          payment_slip_url: "",  // No receipt yet
          payment_slip_filename: "",
        }),
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      const data = (await response.json()) as {
        message?: string;
        orderId?: string;
        reference_number?: string;
      };

      if (!response.ok) {
        throw new Error(data.message || "Failed to create order");
      }

      // Calculate subtotal
      const subtotal = cartSnapshot.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );

      // Store confirmed order data and reference number
      const newConfirmedOrder = {
        referenceNumber: data.reference_number || "",
        orderId: data.orderId || "",
        items: cartSnapshot,
        total: subtotal,
      };
      setConfirmedOrder(newConfirmedOrder);
      setTempReferenceNumber(data.reference_number || "");

      // Save progress with confirmed order before moving to payment
      const progress: CheckoutProgress = {
        currentStep: "payment",
        deliveryForm,
        confirmedOrder: newConfirmedOrder,
        savedAt: Date.now(),
      };
      localStorage.setItem("kyro_checkout_progress", JSON.stringify(progress));
      setProgressSaved(true);
      setTimeout(() => setProgressSaved(false), 2000);

      // Go to payment step
      setCurrentStep("payment");

      // Dismiss loading toast and show success
      toast.dismiss(submittingToastId);
      toast.success("Order created! Now please make payment.");

    } catch (err) {
      // Save form state before showing error (for error recovery)
      saveCheckoutProgress();
      // Dismiss loading toast and show error
      toast.dismiss(submittingToastId);
      toast.error(
        err instanceof Error ? err.message : "Failed to create order"
      );
    } finally {
      setSubmitting(false);
    }
  }

  // Complete order (user will send receipt via WhatsApp)
  async function updateOrderWithReceipt() {
    if (!confirmedOrder) {
      toast.error("Order not found");
      return;
    }

    setSubmitting(true);
    const submittingToastId = toast.loading("Completing your order...");

    try {
      // Just clear cart and redirect - receipt will be sent via WhatsApp
      saveCart([]);
      setCartItems([]);

      // Clear localStorage progress as order is completed
      localStorage.removeItem("kyro_checkout_progress");

      // Dismiss loading toast and show success
      toast.dismiss(submittingToastId);
      toast.success("Order completed! Please send receipt via WhatsApp. 🙏");

      // Navigate to orders page after a short delay
      setTimeout(() => {
        router.push("/orders");
      }, 1500);
    } catch (err) {
      // Dismiss loading toast and show error
      toast.dismiss(submittingToastId);
      toast.error(
        err instanceof Error ? err.message : "Failed to complete order"
      );
    } finally {
      setSubmitting(false);
    }
  }

  // Place order (deprecated - replaced by confirmOrder)
  async function placeOrder() {
    // This function is replaced by updateOrderWithReceipt
    await updateOrderWithReceipt();
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
          padding: 48px 20px 80px;
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
          margin-bottom: 28px;
          animation: kyroSlideUp 0.75s cubic-bezier(.2,.8,.2,1) both;
          position: relative;
        }

        .checkout-heading {
          display: flex;
          align-items: center;
          gap: 12px;
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

        .secure-badge {
          position: absolute;
          top: 0;
          right: 0;
          background: rgba(170,137,83,0.1);
          border: 1px solid rgba(170,137,83,0.3);
          border-radius: 8px;
          padding: 6px 12px;
          font-size: 11px;
          font-weight: 700;
          color: var(--kyro-gold-dark);
          display: flex;
          align-items: center;
          gap: 6px;
        }

        /* Progress Indicator */
        .progress-indicator {
          display: flex;
          justify-content: space-between;
          margin-bottom: 28px;
          gap: 16px;
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
          grid-template-columns: 1fr 360px;
          gap: 20px;
          align-items: start;
        }

        @media (max-width: 1100px) {
          .checkout-layout {
            grid-template-columns: 1fr 320px;
            gap: 18px;
          }
        }

        @media (max-width: 768px) {
          .checkout-layout {
            grid-template-columns: 1fr;
          }

          .checkout-summary {
            position: static;
            top: auto;
          }

          .checkout-form-card {
            padding: 20px;
          }

          .saved-addresses-list {
            grid-template-columns: 1fr;
          }

          .review-item {
            grid-template-columns: 60px 1fr;
            gap: 12px;
          }

          .review-item-price {
            grid-column: 1 / -1;
            text-align: left;
            margin-top: 8px;
          }

          .progress-indicator {
            flex-direction: column;
            gap: 12px;
          }

          .progress-step {
            gap: 10px;
          }

          .form-row {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }

          .form-input {
            min-height: 44px;
            font-size: 16px;
            padding: 12px 14px;
          }

          .button-group {
            flex-direction: column;
            gap: 10px;
          }

          .button-group button {
            flex: 1;
            width: 100%;
            min-height: 44px;
          }

          .btn-primary,
          .btn-secondary {
            min-height: 44px;
            padding: 12px 16px;
            font-size: 11px;
          }

          .checkout-heading h1 {
            font-size: 2rem;
          }

          .bank-details {
            font-size: 11px;
            line-height: 1.6;
          }

          .review-item-image {
            width: 60px;
            height: 60px;
          }

          .form-label {
            font-size: 10px;
          }

          .form-field {
            margin-bottom: 0;
          }

          input[type="text"],
          input[type="number"],
          input[type="email"],
          input[type="tel"],
          textarea {
            font-size: 16px;
            min-height: 44px;
          }

          .secure-badge {
            position: static;
            margin-top: 12px;
          }
        }

        .checkout-form-card {
          padding: 24px;
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
          margin-bottom: 18px;
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
          font-weight: 700;
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
          gap: 14px;
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

        /* Order Review */
        .review-section {
          margin-bottom: 18px;
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
          margin-bottom: 6px;
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
          padding: 12px 20px;
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
          padding: 22px;
          border: 1px solid var(--kyro-line);
          border-radius: 20px;
          background: linear-gradient(145deg, rgba(255,254,250,0.94), rgba(246,242,233,0.78));
          box-shadow: 0 15px 40px rgba(30,25,18,0.045);
          animation: kyroSlideUp 0.8s 0.2s cubic-bezier(.2,.8,.2,1) both;
          max-height: 80vh;
          overflow-y: auto;
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

        /* Saved Progress Badge */
        .save-indicator {
          position: absolute;
          bottom: 24px;
          right: 24px;
          background: rgba(76, 175, 80, 0.15);
          border: 1px solid rgba(76, 175, 80, 0.4);
          border-radius: 8px;
          padding: 8px 12px;
          font-size: 11px;
          font-weight: 700;
          color: #4caf50;
          display: flex;
          align-items: center;
          gap: 6px;
          animation: slideIn 0.3s ease-out;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
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

        @media (max-width: 480px) {
          .checkout-form-card {
            padding: 16px;
            border-radius: 16px;
          }

          .checkout-heading h1 {
            font-size: 1.5rem;
          }

          .progress-circle {
            width: 36px;
            height: 36px;
            font-size: 12px;
          }

          .form-input {
            font-size: 16px;
            padding: 11px 12px;
          }

          .btn-primary,
          .btn-secondary {
            padding: 11px 14px;
            font-size: 10px;
          }

          .bank-details {
            font-size: 10px;
            padding: 12px;
          }

          .checkout-summary {
            padding: 16px;
          }

          .summary-title {
            font-size: 12px;
          }

          input[type="text"],
          input[type="number"],
          input[type="email"],
          input[type="tel"],
          textarea {
            font-size: 16px;
            min-height: 40px;
          }
        }

        @media (max-width: 375px) {
          .checkout-form-card {
            padding: 14px;
            border-radius: 14px;
          }

          .checkout-heading h1 {
            font-size: 1.3rem;
          }

          .progress-circle {
            width: 32px;
            height: 32px;
            font-size: 10px;
          }

          .saved-addresses-list {
            grid-template-columns: 1fr;
            gap: 10px;
          }

          .form-input {
            font-size: 16px;
            padding: 10px 11px;
            min-height: 40px;
          }

          .btn-primary,
          .btn-secondary {
            padding: 10px 12px;
            font-size: 9px;
            min-height: 40px;
          }

          .bank-details {
            font-size: 9px;
            padding: 10px;
          }

          .checkout-summary {
            padding: 14px;
          }

          .review-item-image {
            width: 50px;
            height: 50px;
          }

          .review-item {
            grid-template-columns: 50px 1fr;
            gap: 10px;
          }

          input[type="text"],
          input[type="number"],
          input[type="email"],
          input[type="tel"],
          textarea {
            font-size: 16px;
            min-height: 40px;
          }
        }
      `,
        }}
      />

      <div className="checkout-container">
        {/* Header */}
        <div className="checkout-header">
          <div className="checkout-heading">
            <h1>🔒 Checkout</h1>
            <p>Complete your order in just 3 steps</p>
          </div>
          <div className="secure-badge">
            🔒 Secure Checkout
          </div>
          {progressSaved && (
            <div className="save-indicator">
              ✓ Saved
            </div>
          )}
        </div>

        {/* Progress */}
        <div className="progress-indicator">
          {(["delivery", "review", "payment"] as const).map((step, idx) => {
            const steps = ["delivery", "review", "payment"] as const;
            const stepIndex = steps.indexOf(step);
            const currentStepIndex = steps.indexOf(currentStep);
            const isCompleted = stepIndex < currentStepIndex;
            return (
              <div
                key={step}
                className={`progress-step ${
                  currentStep === step
                    ? "active"
                    : isCompleted
                    ? "completed"
                    : ""
                }`}
              >
                <div className="progress-circle">
                  {isCompleted ? "✓" : idx + 1}
                </div>
                <span className="progress-label">
                  {step === "delivery"
                    ? "Delivery"
                    : step === "review"
                    ? "Review"
                    : "Payment"}
                </span>
              </div>
            );
          })}
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
                    onClick={proceedToReview}
                  >
                    Next: Review
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Payment */}
            {currentStep === "payment" && (
              <div className="checkout-form-card">
                <div className="form-section-title">
                  <div className="form-section-number">3</div>
                  <h2>🔒 Payment & Receipt</h2>
                </div>

                {/* Reference Number Section */}
                <div style={{ 
                  marginBottom: "24px", 
                  padding: "16px", 
                  background: "linear-gradient(135deg, rgba(170, 137, 83, 0.1), rgba(170, 137, 83, 0.05))",
                  border: "2px solid #aa8953",
                  borderRadius: "12px",
                  textAlign: "center"
                }}>
                  <p style={{ margin: "0 0 8px", fontSize: "11px", color: "#806537", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.1em" }}>
                    Your Reference Number
                  </p>
                  {confirmedOrder && (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", marginTop: "12px" }}>
                      <p style={{
                        margin: "0",
                        fontSize: "42px",
                        fontFamily: "Courier New, monospace",
                        fontWeight: 700,
                        color: "#aa8953",
                        letterSpacing: "3px",
                        flex: 1
                      }}>
                        {confirmedOrder.referenceNumber}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(confirmedOrder.referenceNumber);
                          toast.success("Copied!");
                        }}
                        style={{
                          background: "#aa8953",
                          border: "none",
                          borderRadius: "8px",
                          width: "44px",
                          height: "44px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "20px",
                          transition: "all 0.2s ease",
                          flexShrink: 0
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#806537")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "#aa8953")}
                        title="Copy reference number"
                      >
                        📋
                      </button>
                    </div>
                  )}
                </div>

                {/* Safe & Secure Badge */}
                <div style={{
                  marginBottom: "24px",
                  padding: "12px 16px",
                  background: "rgba(76, 175, 80, 0.08)",
                  border: "1px solid rgba(76, 175, 80, 0.3)",
                  borderRadius: "8px",
                  fontSize: "12px",
                  color: "#4caf50",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}>
                  🔒 Your information is secure and encrypted
                </div>

                {/* Down Payment Notice */}
                <div style={{
                  marginBottom: "24px",
                  padding: "14px 16px",
                  background: "rgba(255, 165, 0, 0.08)",
                  border: "1px solid rgba(255, 165, 0, 0.3)",
                  borderRadius: "8px",
                  fontSize: "13px",
                  color: "#7a4f00"
                }}>
                  <strong style={{ display: "block", marginBottom: "6px" }}>⚠️ Down Payment Required: Rs.500.00/-</strong>
                  <span style={{ fontSize: "12px", lineHeight: "1.5" }}>
                    Please transfer Rs.500.00/- as a down payment to the bank account below before your order is processed.
                  </span>
                </div>

                <div style={{ marginBottom: "24px" }}>
                  <p style={{ margin: "0 0 12px", fontSize: "12px", fontWeight: 700, color: "var(--kyro-muted)" }}>
                    Bank Transfer Instructions
                  </p>
                  <style>{`
                    .bank-details-container {
                      background: linear-gradient(135deg, rgba(170, 137, 83, 0.15) 0%, rgba(170, 137, 83, 0.08) 100%);
                      border: 2px solid #aa8953;
                      border-radius: 12px;
                      padding: 16px;
                      margin-top: 8px;
                    }
                    
                    .bank-detail-row {
                      display: flex;
                      align-items: center;
                      gap: 12px;
                      margin-bottom: 12px;
                      padding: 12px;
                      background: white;
                      border-radius: 8px;
                      border: 1px solid rgba(170, 137, 83, 0.2);
                    }
                    
                    .bank-detail-row:last-child {
                      margin-bottom: 0;
                    }
                    
                    .bank-label {
                      min-width: 120px;
                      font-weight: 700;
                      color: #806537;
                      font-size: 11px;
                      text-transform: uppercase;
                      letter-spacing: 0.08em;
                    }
                    
                    .bank-value {
                      flex: 1;
                      font-family: 'Courier New', monospace;
                      font-weight: 600;
                      color: #171717;
                      font-size: 13px;
                      padding: 8px 12px;
                      background: #fffefa;
                      border-radius: 6px;
                      user-select: all;
                      cursor: pointer;
                      transition: all 0.2s ease;
                    }
                    
                    .bank-value:hover {
                      background: #f5f2e9;
                      box-shadow: 0 2px 8px rgba(170, 137, 83, 0.15);
                    }
                    
                    .copy-btn {
                      background: #aa8953;
                      border: none;
                      border-radius: 6px;
                      width: 36px;
                      height: 36px;
                      cursor: pointer;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      font-size: 16px;
                      transition: all 0.2s ease;
                      padding: 0;
                      flex-shrink: 0;
                    }
                    
                    .copy-btn:hover {
                      background: #806537;
                      transform: scale(1.05);
                      box-shadow: 0 4px 12px rgba(170, 137, 83, 0.25);
                    }
                    
                    .copy-btn:active {
                      transform: scale(0.95);
                    }
                  `}</style>
                  <div className="bank-details-container">
                    <div className="bank-detail-row">
                      <span className="bank-label">Bank:</span>
                      <span className="bank-value">Commercial Bank</span>
                      <button 
                        type="button"
                        className="copy-btn" 
                        onClick={() => {
                          navigator.clipboard.writeText('Commercial Bank');
                          toast.success('Copied to clipboard!');
                        }} 
                        title="Copy to clipboard"
                      >
                        📋
                      </button>
                    </div>
                    <div className="bank-detail-row">
                      <span className="bank-label">Account Number:</span>
                      <span className="bank-value">8029116122</span>
                      <button 
                        type="button"
                        className="copy-btn" 
                        onClick={() => {
                          navigator.clipboard.writeText('8029116122');
                          toast.success('Copied to clipboard!');
                        }} 
                        title="Copy to clipboard"
                      >
                        📋
                      </button>
                    </div>
                    <div className="bank-detail-row">
                      <span className="bank-label">Account Name:</span>
                      <span className="bank-value">N.A.K.I Neththasingha</span>
                      <button 
                        type="button"
                        className="copy-btn" 
                        onClick={() => {
                          navigator.clipboard.writeText('N.A.K.I Neththasingha');
                          toast.success('Copied to clipboard!');
                        }} 
                        title="Copy to clipboard"
                      >
                        📋
                      </button>
                    </div>
                    <div className="bank-detail-row">
                      <span className="bank-label">Branch:</span>
                      <span className="bank-value">Narammala Branch</span>
                      <button 
                        type="button"
                        className="copy-btn" 
                        onClick={() => {
                          navigator.clipboard.writeText('Narammala Branch');
                          toast.success('Copied to clipboard!');
                        }} 
                        title="Copy to clipboard"
                      >
                        📋
                      </button>
                    </div>
                  </div>
                </div>

                {/* WhatsApp Button to Send Receipt */}
                <button
                  type="button"
                  style={{
                    width: "100%",
                    height: "48px",
                    background: "#25D366",
                    color: "white",
                    border: "none",
                    borderRadius: "10px",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "10px",
                    marginBottom: "16px",
                    transition: "all 0.3s ease",
                    boxShadow: "0 4px 12px rgba(37, 211, 102, 0.3)"
                  }}
                  onClick={() => {
                    if (!confirmedOrder) {
                      toast.error("Order data not found");
                      return;
                    }
                    const message = `Hi Kyro! 🌸\nOrder Reference: ${confirmedOrder.referenceNumber}\n\nItems:\n${confirmedOrder.items
                      .map((item) => `- ${item.quantity}x ${item.name}${item.category ? ` (${item.category})` : ""}${item.size ? ` - ${item.size}` : ""}`)
                      .join("\n")}\n\nTotal: Rs.${confirmedOrder.total.toLocaleString("en-LK")}\nDown Payment: Rs.500 (to be paid)\nBalance Due: Rs.${(confirmedOrder.total - 500).toLocaleString("en-LK")}\n\nPlease confirm my order. 🙏`;
                    const waUrl = `https://wa.me/94768644132?text=${encodeURIComponent(message)}`;
                    window.open(waUrl, "_blank", "noopener,noreferrer");
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = "#20BA5A";
                    (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = "#25D366";
                    (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
                  }}
                >
                  <FaWhatsapp size={18} />
                  SEND RECEIPT VIA WHATSAPP
                </button>

                <div className="button-group">
                  <button
                    className="btn-secondary"
                    onClick={() => setCurrentStep("review")}
                  >
                    Back
                  </button>
                  <button
                    className="btn-primary"
                    onClick={updateOrderWithReceipt}
                    disabled={submitting}
                  >
                    {submitting ? "Completing Order..." : "Complete Order"}
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Review */}
            {currentStep === "review" && (
              <div className="checkout-form-card">
                <div className="form-section-title">
                  <div className="form-section-number">2</div>
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

                <div className="review-totals">
                  <div className="total-row">
                    <span>Subtotal:</span>
                    <span>Rs {subtotal.toLocaleString("en-LK")}</span>
                  </div>
                  <div className="total-row">
                    <span>Down Payment:</span>
                    <span style={{ color: "#aa8953" }}>Rs 500.00</span>
                  </div>
                  <div className="total-row final">
                    <span>Total:</span>
                    <span>Rs {subtotal.toLocaleString("en-LK")}</span>
                  </div>
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
                    onClick={confirmOrder}
                    disabled={submitting}
                  >
                    {submitting ? "Creating Order..." : "Confirm Order"}
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
