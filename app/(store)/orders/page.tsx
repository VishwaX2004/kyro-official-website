"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

type OrderItem = {
  name: string;
  quantity: number;
  price?: number;
  size?: string;
  imageUrl?: string;
};

type OrderShipping = {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
};

type Order = {
  _id: string;
  total: number;
  status: string;
  createdAt: string;
  updatedAt?: string;
  items: OrderItem[];
  shipping?: OrderShipping;
  customerName?: string;
};

type StatusKey =
  | "pending"
  | "processing"
  | "paid"
  | "shipped"
  | "delivered"
  | "completed"
  | "cancelled";

const formatPrice = (value: number) => {
  return `Rs. ${new Intl.NumberFormat("en-LK", {
    maximumFractionDigits: 0,
  }).format(Number(value) || 0)}`;
};

const formatDate = (date: string) => {
  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "Date unavailable";
  }

  return parsed.toLocaleDateString("en-LK", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const formatTime = (date: string) => {
  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return parsed.toLocaleTimeString("en-LK", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

function normalizeStatus(status: string): StatusKey {
  const value = String(status || "")
    .toLowerCase()
    .trim();

  if (value.includes("cancel")) return "cancelled";
  if (value.includes("deliver")) return "delivered";
  if (value.includes("complete")) return "completed";
  if (value.includes("ship")) return "shipped";
  if (value.includes("paid")) return "paid";
  if (value.includes("process")) return "processing";

  return "pending";
}

function getStatusLabel(status: string) {
  switch (normalizeStatus(status)) {
    case "processing":
      return "Processing";
    case "paid":
      return "Paid";
    case "shipped":
      return "Shipped";
    case "delivered":
      return "Delivered";
    case "completed":
      return "Completed";
    case "cancelled":
      return "Cancelled";
    default:
      return "Pending";
  }
}

function getStatusDescription(status: string) {
  switch (normalizeStatus(status)) {
    case "processing":
      return "Your order is being carefully prepared.";
    case "paid":
      return "Payment has been received and your order is confirmed.";
    case "shipped":
      return "Your fragrance journey is on the way.";
    case "delivered":
      return "Your order has arrived at its destination.";
    case "completed":
      return "This scent story has been completed.";
    case "cancelled":
      return "This order has been cancelled.";
    default:
      return "Your order has been received and is waiting to be processed.";
  }
}

function getStatusStep(status: string) {
  const normalized = normalizeStatus(status);

  if (normalized === "cancelled") return -1;
  if (normalized === "pending") return 0;
  if (normalized === "processing" || normalized === "paid") return 1;
  if (normalized === "shipped") return 2;
  if (normalized === "delivered" || normalized === "completed") return 3;

  return 0;
}

function getStatusIcon(status: StatusKey) {
  switch (status) {
    case "processing":
    case "paid":
      return "◌";
    case "shipped":
      return "✦";
    case "delivered":
    case "completed":
      return "✓";
    case "cancelled":
      return "×";
    default:
      return "○";
  }
}

function ProductImage({
  src,
  name,
}: {
  src?: string;
  name: string;
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className="order-product-fallback" aria-hidden="true">
        K
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      className="order-product-image"
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}

function StatusTimeline({ status }: { status: string }) {
  const currentStep = getStatusStep(status);
  const cancelled = normalizeStatus(status) === "cancelled";

  const steps = [
    {
      title: "Order placed",
      description: "We've received your order.",
    },
    {
      title: "Preparing",
      description: "Your fragrances are being prepared.",
    },
    {
      title: "On the way",
      description: "Your parcel is moving toward you.",
    },
    {
      title: "Delivered",
      description: "Enjoy your new scent story.",
    },
  ];

  return (
    <div className="status-timeline">
      {cancelled ? (
        <div className="cancelled-state">
          <div className="cancelled-icon">×</div>

          <div>
            <strong>Order cancelled</strong>
            <p>
              This order will not continue through the normal delivery
              journey.
            </p>
          </div>
        </div>
      ) : (
        <div className="timeline-track">
          {steps.map((step, index) => {
            const completed = index <= currentStep;
            const active = index === currentStep;

            return (
              <div
                className={`timeline-step ${
                  completed ? "is-complete" : ""
                } ${active ? "is-active" : ""}`}
                key={step.title}
              >
                <div className="timeline-marker">
                  {completed ? "✓" : index + 1}
                </div>

                <div className="timeline-copy">
                  <strong>{step.title}</strong>
                  <span>{step.description}</span>
                </div>

                {index < steps.length - 1 && (
                  <div
                    className={`timeline-line ${
                      index < currentStep ? "is-filled" : ""
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState("");
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  const loadOrders = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setMessage("");

      const response = await fetch("/api/orders", {
        method: "GET",
        cache: "no-store",
      });

      const data = (await response.json()) as {
        orders?: Order[];
        message?: string;
      };

      if (!response.ok) {
        throw new Error(data.message ?? "Unable to load your orders.");
      }

      const fetchedOrders = data.orders ?? [];

      setOrders(fetchedOrders);

      if (!fetchedOrders.length) {
        setMessage("Your first Kyro order is waiting to be discovered.");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Unable to load your orders.";

      setMessage(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const totalSpent = useMemo(() => {
    return orders.reduce(
      (sum, order) => sum + Number(order.total || 0),
      0
    );
  }, [orders]);

  const totalItems = useMemo(() => {
    return orders.reduce(
      (sum, order) =>
        sum +
        order.items.reduce(
          (itemSum, item) => itemSum + Number(item.quantity || 0),
          0
        ),
      0
    );
  }, [orders]);

  const activeOrders = useMemo(() => {
    return orders.filter((order) => {
      const status = normalizeStatus(order.status);

      return !["delivered", "completed", "cancelled"].includes(status);
    }).length;
  }, [orders]);

  function toggleOrder(orderId: string) {
    setExpandedOrder((current) =>
      current === orderId ? null : orderId
    );
  }

  return (
    <main className="orders-page">
      <style dangerouslySetInnerHTML={{__html: `
        .orders-page {
          --kyro-bg: #f8f6f0;
          --kyro-surface: #fffefa;
          --kyro-paper: #efebe1;
          --kyro-ink: #171717;
          --kyro-muted: #777268;
          --kyro-soft: #aaa397;
          --kyro-line: rgba(23, 23, 23, 0.1);
          --kyro-gold: #aa8953;
          --kyro-gold-dark: #806537;
          --kyro-dark: #171717;

          min-height: 100vh;
          padding: 48px 5vw 120px;
          background:
            radial-gradient(
              circle at 10% 10%,
              rgba(170, 137, 83, 0.1),
              transparent 28%
            ),
            radial-gradient(
              circle at 90% 30%,
              rgba(170, 137, 83, 0.08),
              transparent 25%
            ),
            var(--kyro-bg);
          color: var(--kyro-ink);
          overflow: hidden;
        }

        .orders-shell {
          width: min(1240px, 100%);
          margin: 0 auto;
        }

        .orders-heading {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 32px;
          margin-bottom: 42px;
          animation: fadeUp 0.7s ease both;
        }

        .heading-copy {
          max-width: 720px;
        }

        .store-eyebrow {
          margin: 0 0 13px;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.24em;
          color: var(--kyro-gold-dark);
        }

        .orders-heading h1 {
          margin: 0;
          font-family: Georgia, "Times New Roman", serif;
          font-size: clamp(42px, 6vw, 78px);
          line-height: 0.98;
          font-weight: 400;
          letter-spacing: -0.045em;
        }

        .orders-heading h1 em {
          color: var(--kyro-gold-dark);
          font-style: italic;
        }

        .heading-description {
          margin: 20px 0 0;
          max-width: 600px;
          color: var(--kyro-muted);
          font-size: 15px;
          line-height: 1.8;
        }

        .refresh-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          min-width: 132px;
          padding: 13px 17px;
          border: 1px solid var(--kyro-line);
          border-radius: 999px;
          background: rgba(255, 254, 250, 0.75);
          color: var(--kyro-ink);
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.03em;
          cursor: pointer;
          transition:
            transform 0.25s ease,
            background 0.25s ease,
            border-color 0.25s ease;
        }

        .refresh-button:hover {
          transform: translateY(-3px);
          background: var(--kyro-surface);
          border-color: rgba(170, 137, 83, 0.45);
        }

        .refresh-icon {
          display: inline-block;
          font-size: 16px;
        }

        .refresh-icon.spinning {
          animation: spin 0.8s linear infinite;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
          margin-bottom: 34px;
          animation: fadeUp 0.7s 0.08s ease both;
        }

        .stat-card {
          position: relative;
          overflow: hidden;
          min-height: 128px;
          padding: 24px;
          border: 1px solid var(--kyro-line);
          border-radius: 24px;
          background: rgba(255, 254, 250, 0.72);
          box-shadow: 0 15px 45px rgba(23, 23, 23, 0.035);
        }

        .stat-card::after {
          content: "";
          position: absolute;
          right: -30px;
          bottom: -50px;
          width: 130px;
          height: 130px;
          border-radius: 50%;
          background: rgba(170, 137, 83, 0.08);
        }

        .stat-label {
          position: relative;
          z-index: 1;
          margin-bottom: 13px;
          color: var(--kyro-muted);
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.16em;
          text-transform: uppercase;
        }

        .stat-value {
          position: relative;
          z-index: 1;
          font-family: Georgia, "Times New Roman", serif;
          font-size: 30px;
        }

        .orders-list {
          display: grid;
          gap: 20px;
        }

        .order-card {
          position: relative;
          overflow: hidden;
          border: 1px solid var(--kyro-line);
          border-radius: 30px;
          background: rgba(255, 254, 250, 0.88);
          box-shadow: 0 20px 60px rgba(23, 23, 23, 0.045);
          animation: fadeUp 0.7s ease both;
          transition:
            transform 0.35s ease,
            box-shadow 0.35s ease,
            border-color 0.35s ease;
        }

        .order-card:hover {
          transform: translateY(-4px);
          border-color: rgba(170, 137, 83, 0.3);
          box-shadow: 0 28px 75px rgba(23, 23, 23, 0.075);
        }

        .order-card-top {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 25px;
          padding: 28px 30px;
        }

        .order-main {
          min-width: 0;
        }

        .order-number {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 10px;
          margin-bottom: 10px;
        }

        .order-number p {
          margin: 0;
        }

        .order-id {
          color: var(--kyro-soft);
          font-size: 10px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }

        .order-date {
          color: var(--kyro-muted);
          font-size: 11px;
        }

        .order-title {
          margin: 0;
          max-width: 800px;
          font-family: Georgia, "Times New Roman", serif;
          font-size: clamp(21px, 3vw, 30px);
          line-height: 1.2;
          font-weight: 400;
        }

        .order-preview {
          margin: 10px 0 0;
          color: var(--kyro-muted);
          font-size: 13px;
          line-height: 1.65;
        }

        .order-right {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          justify-content: space-between;
          gap: 18px;
          min-width: 160px;
        }

        .order-total {
          font-family: Georgia, "Times New Roman", serif;
          font-size: 25px;
          white-space: nowrap;
        }

        .status-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          width: fit-content;
          padding: 8px 12px;
          border-radius: 999px;
          background: rgba(170, 137, 83, 0.11);
          color: var(--kyro-gold-dark);
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--kyro-gold);
          box-shadow: 0 0 0 4px rgba(170, 137, 83, 0.1);
        }

        .status-pill.cancelled {
          background: rgba(80, 70, 65, 0.08);
          color: #655d55;
        }

        .status-pill.cancelled .status-dot {
          background: #655d55;
          box-shadow: 0 0 0 4px rgba(80, 70, 65, 0.08);
        }

        .order-actions {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          padding: 0 30px 25px;
        }

        .order-status-description {
          color: var(--kyro-muted);
          font-size: 12px;
        }

        .details-button {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          padding: 10px 15px;
          border: 1px solid var(--kyro-line);
          border-radius: 999px;
          background: transparent;
          color: var(--kyro-ink);
          font-size: 11px;
          font-weight: 800;
          cursor: pointer;
          transition:
            background 0.25s ease,
            color 0.25s ease,
            transform 0.25s ease;
        }

        .details-button:hover {
          transform: translateY(-2px);
          background: var(--kyro-dark);
          color: white;
        }

        .arrow {
          transition: transform 0.25s ease;
        }

        .arrow.open {
          transform: rotate(180deg);
        }

        .order-details {
          border-top: 1px solid var(--kyro-line);
          padding: 30px;
          background:
            linear-gradient(
              180deg,
              rgba(239, 235, 225, 0.42),
              rgba(255, 254, 250, 0.1)
            );
          animation: revealDetails 0.35s ease both;
        }

        .details-heading {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 24px;
        }

        .details-heading h3 {
          margin: 0;
          font-family: Georgia, "Times New Roman", serif;
          font-size: 25px;
          font-weight: 400;
        }

        .details-heading span {
          color: var(--kyro-muted);
          font-size: 11px;
        }

        .status-timeline {
          margin-bottom: 32px;
          padding: 25px;
          border: 1px solid var(--kyro-line);
          border-radius: 22px;
          background: rgba(255, 254, 250, 0.62);
        }

        .timeline-track {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
        }

        .timeline-step {
          position: relative;
          min-width: 0;
        }

        .timeline-marker {
          position: relative;
          z-index: 2;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 34px;
          height: 34px;
          border: 1px solid var(--kyro-line);
          border-radius: 50%;
          background: var(--kyro-bg);
          color: var(--kyro-soft);
          font-size: 11px;
          font-weight: 800;
          transition: all 0.3s ease;
        }

        .timeline-step.is-complete .timeline-marker {
          border-color: var(--kyro-gold);
          background: var(--kyro-dark);
          color: white;
        }

        .timeline-step.is-active .timeline-marker {
          box-shadow: 0 0 0 7px rgba(170, 137, 83, 0.11);
        }

        .timeline-copy {
          display: flex;
          flex-direction: column;
          gap: 5px;
          margin-top: 12px;
          padding-right: 15px;
        }

        .timeline-copy strong {
          font-size: 12px;
        }

        .timeline-copy span {
          color: var(--kyro-muted);
          font-size: 10px;
          line-height: 1.5;
        }

        .timeline-line {
          position: absolute;
          top: 17px;
          left: 34px;
          right: -10px;
          height: 1px;
          background: var(--kyro-line);
          z-index: 1;
        }

        .timeline-line.is-filled {
          background: var(--kyro-gold);
        }

        .cancelled-state {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .cancelled-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          flex: 0 0 auto;
          width: 42px;
          height: 42px;
          border-radius: 50%;
          background: rgba(80, 70, 65, 0.09);
          color: #655d55;
          font-size: 22px;
        }

        .cancelled-state strong {
          display: block;
          margin-bottom: 4px;
        }

        .cancelled-state p {
          margin: 0;
          color: var(--kyro-muted);
          font-size: 12px;
        }

        .products-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          margin-bottom: 13px;
        }

        .products-heading span {
          color: var(--kyro-muted);
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.13em;
          text-transform: uppercase;
        }

        .product-list {
          display: grid;
          gap: 10px;
        }

        .product-row {
          display: grid;
          grid-template-columns: 68px minmax(0, 1fr) auto;
          align-items: center;
          gap: 16px;
          padding: 12px;
          border: 1px solid rgba(23, 23, 23, 0.07);
          border-radius: 18px;
          background: rgba(255, 254, 250, 0.75);
        }

        .product-image-wrap {
          width: 68px;
          height: 68px;
          overflow: hidden;
          border-radius: 14px;
          background: var(--kyro-paper);
        }

        .order-product-image {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .order-product-fallback {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
          background:
            radial-gradient(
              circle at 35% 25%,
              rgba(170, 137, 83, 0.35),
              transparent 30%
            ),
            #e8e1d3;
          color: var(--kyro-gold-dark);
          font-family: Georgia, "Times New Roman", serif;
          font-size: 25px;
          font-style: italic;
        }

        .product-info {
          min-width: 0;
        }

        .product-info h4 {
          overflow: hidden;
          margin: 0 0 6px;
          font-family: Georgia, "Times New Roman", serif;
          font-size: 17px;
          font-weight: 400;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .product-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
          color: var(--kyro-muted);
          font-size: 10px;
        }

        .meta-divider {
          color: var(--kyro-soft);
        }

        .product-price {
          text-align: right;
        }

        .product-price strong {
          display: block;
          margin-bottom: 4px;
          font-size: 14px;
        }

        .product-price span {
          color: var(--kyro-muted);
          font-size: 10px;
        }

        .summary-grid {
          display: grid;
          grid-template-columns: 1fr 320px;
          gap: 18px;
          margin-top: 20px;
        }

        .summary-card {
          padding: 24px;
          border: 1px solid var(--kyro-line);
          border-radius: 22px;
          background: rgba(255, 254, 250, 0.72);
        }

        .summary-card h4 {
          margin: 0 0 17px;
          font-family: Georgia, "Times New Roman", serif;
          font-size: 21px;
          font-weight: 400;
        }

        .summary-row {
          display: flex;
          justify-content: space-between;
          gap: 15px;
          padding: 9px 0;
          color: var(--kyro-muted);
          font-size: 12px;
        }

        .summary-row.total {
          margin-top: 8px;
          padding-top: 16px;
          border-top: 1px solid var(--kyro-line);
          color: var(--kyro-ink);
          font-size: 15px;
          font-weight: 800;
        }

        .summary-row.total strong {
          font-family: Georgia, "Times New Roman", serif;
          font-size: 22px;
          font-weight: 400;
        }

        .continue-button {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          margin-top: 20px;
          color: var(--kyro-gold-dark);
          font-size: 11px;
          font-weight: 800;
          text-decoration: none;
          transition: gap 0.25s ease;
        }

        .continue-button:hover {
          gap: 14px;
        }

        .empty-state {
          position: relative;
          overflow: hidden;
          min-height: 430px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 50px 25px;
          border: 1px solid var(--kyro-line);
          border-radius: 35px;
          background: rgba(255, 254, 250, 0.78);
          text-align: center;
          animation: fadeUp 0.7s ease both;
        }

        .empty-orb {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 110px;
          height: 110px;
          margin-bottom: 25px;
          border: 1px solid rgba(170, 137, 83, 0.3);
          border-radius: 50%;
          background:
            radial-gradient(
              circle at 35% 30%,
              rgba(255, 255, 255, 0.9),
              transparent 28%
            ),
            #e9e1d3;
          box-shadow:
            0 25px 55px rgba(23, 23, 23, 0.08),
            inset 0 0 0 12px rgba(255, 255, 255, 0.2);
          animation: float 4s ease-in-out infinite;
        }

        .empty-orb::before {
          content: "";
          position: absolute;
          inset: -13px;
          border: 1px solid rgba(170, 137, 83, 0.12);
          border-radius: inherit;
          animation: pulse 3s ease-in-out infinite;
        }

        .empty-orb span {
          font-family: Georgia, "Times New Roman", serif;
          color: var(--kyro-gold-dark);
          font-size: 38px;
          font-style: italic;
        }

        .empty-state h2 {
          margin: 0;
          max-width: 550px;
          font-family: Georgia, "Times New Roman", serif;
          font-size: clamp(27px, 4vw, 42px);
          font-weight: 400;
        }

        .empty-state p {
          max-width: 500px;
          margin: 14px 0 25px;
          color: var(--kyro-muted);
          line-height: 1.7;
          font-size: 14px;
        }

        .hero-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 14px;
          min-height: 50px;
          padding: 0 22px;
          border: 1px solid var(--kyro-dark);
          border-radius: 999px;
          background: var(--kyro-dark);
          color: white;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.04em;
          text-decoration: none;
          transition:
            transform 0.25s ease,
            box-shadow 0.25s ease,
            background 0.25s ease;
        }

        .hero-button:hover {
          transform: translateY(-3px);
          background: #2a2825;
          box-shadow: 0 14px 30px rgba(23, 23, 23, 0.16);
        }

        .floating-chat {
          position: fixed;
          right: 24px;
          bottom: 24px;
          z-index: 50;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 13px 17px 13px 13px;
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 999px;
          background: var(--kyro-dark);
          color: white;
          text-decoration: none;
          box-shadow: 0 20px 45px rgba(23, 23, 23, 0.2);
          animation:
            chatAppear 0.8s 0.8s ease both,
            chatFloat 3.5s 1.6s ease-in-out infinite;
          transition:
            transform 0.25s ease,
            box-shadow 0.25s ease;
        }

        .floating-chat:hover {
          transform: translateY(-5px) scale(1.02);
          box-shadow: 0 25px 55px rgba(23, 23, 23, 0.28);
        }

        .chat-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: var(--kyro-gold);
          color: white;
          font-size: 15px;
        }

        .chat-copy {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .chat-copy strong {
          font-size: 11px;
          letter-spacing: 0.02em;
        }

        .chat-copy span {
          color: rgba(255, 255, 255, 0.58);
          font-size: 9px;
        }

        .loading-state {
          display: flex;
          min-height: 430px;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--kyro-line);
          border-radius: 35px;
          background: rgba(255, 254, 250, 0.75);
          animation: fadeUp 0.6s ease both;
        }

        .loading-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 17px;
        }

        .loading-ring {
          width: 44px;
          height: 44px;
          border: 2px solid rgba(170, 137, 83, 0.18);
          border-top-color: var(--kyro-gold);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        .loading-content p {
          margin: 0;
          color: var(--kyro-muted);
          font-family: Georgia, "Times New Roman", serif;
          font-size: 18px;
          font-style: italic;
        }

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

        @keyframes revealDetails {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes float {
          0%,
          100% {
            transform: translateY(0);
          }

          50% {
            transform: translateY(-10px);
          }
        }

        @keyframes pulse {
          0%,
          100% {
            transform: scale(1);
            opacity: 0.55;
          }

          50% {
            transform: scale(1.08);
            opacity: 1;
          }
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes chatAppear {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.9);
          }

          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes chatFloat {
          0%,
          100% {
            box-shadow: 0 20px 45px rgba(23, 23, 23, 0.2);
          }

          50% {
            box-shadow: 0 25px 55px rgba(23, 23, 23, 0.27);
          }
        }

        @media (max-width: 800px) {
          .orders-page {
            padding: 35px 18px 100px;
          }

          .orders-heading {
            flex-direction: column;
            align-items: flex-start;
            gap: 22px;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }

          .order-card-top {
            grid-template-columns: 1fr;
            padding: 23px;
          }

          .order-right {
            align-items: flex-start;
            flex-direction: row;
          }

          .order-actions {
            align-items: flex-start;
            flex-direction: column;
            padding: 0 23px 22px;
          }

          .order-details {
            padding: 22px;
          }

          .timeline-track {
            display: block;
          }

          .timeline-step {
            display: grid;
            grid-template-columns: 34px 1fr;
            column-gap: 14px;
            min-height: 75px;
          }

          .timeline-copy {
            margin-top: 0;
            padding: 4px 0 15px;
          }

          .timeline-line {
            top: 34px;
            left: 16px;
            right: auto;
            width: 1px;
            height: calc(100% - 34px);
          }

          .summary-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 560px) {
          .orders-heading h1 {
            font-size: 43px;
          }

          .order-right {
            align-items: flex-start;
            flex-direction: column;
            gap: 10px;
          }

          .order-total {
            font-size: 23px;
          }

          .product-row {
            grid-template-columns: 58px minmax(0, 1fr);
          }

          .product-image-wrap {
            width: 58px;
            height: 58px;
          }

          .product-price {
            grid-column: 2;
            text-align: left;
          }

          .floating-chat {
            right: 15px;
            bottom: 15px;
            padding-right: 14px;
          }

          .chat-copy span {
            display: none;
          }

          .chat-copy strong {
            font-size: 10px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .orders-page *,
          .orders-page *::before,
          .orders-page *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            scroll-behavior: auto !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}} />

      <div className="orders-shell">
        {/* =========================================================
            HEADER
        ========================================================= */}
        <section className="orders-heading">
          <div className="heading-copy">
            <p className="store-eyebrow">KYRO / ORDER HISTORY</p>

            <h1>
              Every scent story,
              <br />
              <em>in one place.</em>
            </h1>

            <p className="heading-description">
              Follow your orders, revisit your fragrance discoveries, and
              keep track of every bottle and decant that becomes part of
              your collection.
            </p>
          </div>

          <button
            type="button"
            className="refresh-button"
            onClick={() => loadOrders(true)}
            disabled={loading || refreshing}
          >
            <span
              className={`refresh-icon ${
                refreshing ? "spinning" : ""
              }`}
            >
              ↻
            </span>

            {refreshing ? "Refreshing" : "Refresh"}
          </button>
        </section>

        {/* =========================================================
            LOADING
        ========================================================= */}
        {loading ? (
          <section className="loading-state">
            <div className="loading-content">
              <div className="loading-ring" />

              <p>Loading your scent stories...</p>
            </div>
          </section>
        ) : orders.length ? (
          <>
            {/* =====================================================
                STATS
            ===================================================== */}
            <section className="stats-grid">
              <article className="stat-card">
                <div className="stat-label">Total orders</div>
                <div className="stat-value">{orders.length}</div>
              </article>

              <article className="stat-card">
                <div className="stat-label">Items collected</div>
                <div className="stat-value">{totalItems}</div>
              </article>

              <article className="stat-card">
                <div className="stat-label">Active orders</div>
                <div className="stat-value">{activeOrders}</div>
              </article>
            </section>

            {/* =====================================================
                ORDERS
            ===================================================== */}
            <section className="orders-list">
              {orders.map((order, index) => {
                const normalizedStatus = normalizeStatus(
                  order.status
                );

                const isExpanded = expandedOrder === order._id;

                const itemCount = order.items.reduce(
                  (sum, item) =>
                    sum + Number(item.quantity || 0),
                  0
                );

                const previewItems = order.items
                  .slice(0, 2)
                  .map(
                    (item) =>
                      `${item.name} × ${item.quantity}`
                  )
                  .join(" · ");

                const remaining =
                  order.items.length > 2
                    ? ` + ${order.items.length - 2} more`
                    : "";

                return (
                  <article
                    className="order-card"
                    key={order._id}
                    style={{
                      animationDelay: `${index * 90}ms`,
                    }}
                  >
                    <div className="order-card-top">
                      <div className="order-main">
                        <div className="order-number">
                          <p className="store-eyebrow">
                            ORDER{" "}
                            {order._id
                              .slice(-7)
                              .toUpperCase()}
                          </p>

                          <span className="order-date">
                            {formatDate(order.createdAt)}
                          </span>

                          <span className="order-date">
                            {formatTime(order.createdAt)}
                          </span>
                        </div>

                        <h2 className="order-title">
                          {itemCount}{" "}
                          {itemCount === 1
                            ? "fragrance"
                            : "fragrances"}{" "}
                          in this order
                        </h2>

                        <p className="order-preview">
                          {previewItems}
                          {remaining}
                        </p>
                      </div>

                      <div className="order-right">
                        <strong className="order-total">
                          {formatPrice(order.total)}
                        </strong>

                        <span
                          className={`status-pill ${
                            normalizedStatus ===
                            "cancelled"
                              ? "cancelled"
                              : ""
                          }`}
                        >
                          <span className="status-dot" />

                          {getStatusLabel(order.status)}
                        </span>
                      </div>
                    </div>

                    <div className="order-actions">
                      <span className="order-status-description">
                        {getStatusDescription(order.status)}
                      </span>

                      <button
                        type="button"
                        className="details-button"
                        onClick={() =>
                          toggleOrder(order._id)
                        }
                        aria-expanded={isExpanded}
                      >
                        {isExpanded
                          ? "Hide details"
                          : "View details"}

                        <span
                          className={`arrow ${
                            isExpanded ? "open" : ""
                          }`}
                        >
                          ↓
                        </span>
                      </button>
                    </div>

                    {/* =================================================
                        EXPANDED ORDER DETAILS
                    ================================================= */}
                    {isExpanded && (
                      <div className="order-details">
                        <div className="details-heading">
                          <div>
                            <p className="store-eyebrow">
                              ORDER DETAILS
                            </p>

                            <h3>
                              Your Kyro collection
                            </h3>
                          </div>

                          <span>
                            #{order._id}
                          </span>
                        </div>

                        {/* STATUS TIMELINE */}
                        <StatusTimeline
                          status={order.status}
                        />

                        {/* PRODUCTS */}
                        <div className="products-heading">
                          <span>Items</span>

                          <span>
                            {itemCount}{" "}
                            {itemCount === 1
                              ? "item"
                              : "items"}
                          </span>
                        </div>

                        <div className="product-list">
                          {order.items.map(
                            (item, itemIndex) => {
                              const lineTotal =
                                Number(
                                  item.price || 0
                                ) *
                                Number(
                                  item.quantity || 0
                                );

                              return (
                                <div
                                  className="product-row"
                                  key={`${order._id}-${itemIndex}`}
                                >
                                  <div className="product-image-wrap">
                                    <ProductImage
                                      src={
                                        item.imageUrl
                                      }
                                      name={
                                        item.name
                                      }
                                    />
                                  </div>

                                  <div className="product-info">
                                    <h4>
                                      {item.name}
                                    </h4>

                                    <div className="product-meta">
                                      <span>
                                        Qty{" "}
                                        {
                                          item.quantity
                                        }
                                      </span>

                                      {item.size && (
                                        <>
                                          <span className="meta-divider">
                                            •
                                          </span>

                                          <span>
                                            {
                                              item.size
                                            }
                                          </span>
                                        </>
                                      )}

                                      {item.price !==
                                        undefined && (
                                        <>
                                          <span className="meta-divider">
                                            •
                                          </span>

                                          <span>
                                            {formatPrice(
                                              item.price
                                            )}{" "}
                                            each
                                          </span>
                                        </>
                                      )}
                                    </div>
                                  </div>

                                  <div className="product-price">
                                    <strong>
                                      {item.price !==
                                      undefined
                                        ? formatPrice(
                                            lineTotal
                                          )
                                        : "—"}
                                    </strong>

                                    <span>
                                      {item.quantity}{" "}
                                      × item
                                    </span>
                                  </div>
                                </div>
                              );
                            }
                          )}
                        </div>

                        {/* SUMMARY */}
                        <div className="summary-grid">
                          <div className="summary-card">
                            <p className="store-eyebrow">
                              YOUR ORDER
                            </p>

                            <h4>
                              Thank you for choosing
                              Kyro.
                            </h4>

                            <p
                              style={{
                                margin: 0,
                                color:
                                  "var(--kyro-muted)",
                                fontSize: 12,
                                lineHeight: 1.8,
                              }}
                            >
                              Every order is part of
                              your personal fragrance
                              journey. Keep this order
                              reference for future
                              assistance.
                            </p>

                            {order.shipping && (
                              <div
                                style={{
                                  marginTop: 18,
                                  padding: "12px 14px",
                                  border:
                                    "1px solid var(--kyro-line)",
                                  borderRadius: 14,
                                  background:
                                    "rgba(239,235,225,0.5)",
                                }}
                              >
                                <p
                                  style={{
                                    margin: "0 0 8px",
                                    fontSize: 9,
                                    fontWeight: 800,
                                    letterSpacing:
                                      "0.16em",
                                    textTransform:
                                      "uppercase",
                                    color:
                                      "var(--kyro-gold-dark)",
                                  }}
                                >
                                  Delivery address
                                </p>
                                <p
                                  style={{
                                    margin: 0,
                                    fontSize: 12,
                                    lineHeight: 1.9,
                                    color:
                                      "var(--kyro-ink)",
                                  }}
                                >
                                  <strong>
                                    {order.shipping.name}
                                  </strong>
                                  <br />
                                  {order.shipping.address}
                                  <br />
                                  {order.shipping.city}
                                  {order.shipping
                                    .postalCode
                                    ? `, ${order.shipping.postalCode}`
                                    : ""}
                                  <br />
                                  <span
                                    style={{
                                      color:
                                        "var(--kyro-muted)",
                                    }}
                                  >
                                    {order.shipping.phone}
                                  </span>
                                  <br />
                                  <span
                                    style={{
                                      color:
                                        "var(--kyro-muted)",
                                    }}
                                  >
                                    {order.shipping.email}
                                  </span>
                                </p>
                              </div>
                            )}

                            <Link
                              href="/shop"
                              className="continue-button"
                            >
                              Continue shopping
                              <span>→</span>
                            </Link>
                          </div>

                          <div className="summary-card">
                            <p className="store-eyebrow">
                              ORDER SUMMARY
                            </p>

                            <div className="summary-row">
                              <span>Order ID</span>
                              <span
                                style={{
                                  fontFamily:
                                    "monospace",
                                  fontSize: 10,
                                  wordBreak:
                                    "break-all",
                                }}
                              >
                                {order._id}
                              </span>
                            </div>

                            <div className="summary-row">
                              <span>Items</span>
                              <span>
                                {itemCount}
                              </span>
                            </div>

                            <div className="summary-row">
                              <span>Order date</span>
                              <span>
                                {formatDate(
                                  order.createdAt
                                )}
                              </span>
                            </div>

                            <div className="summary-row">
                              <span>Status</span>
                              <span>
                                {getStatusLabel(
                                  order.status
                                )}
                              </span>
                            </div>

                            {order.updatedAt && (
                              <div className="summary-row">
                                <span>Last updated</span>
                                <span>
                                  {formatDate(
                                    order.updatedAt
                                  )}
                                </span>
                              </div>
                            )}

                            <div className="summary-row total">
                              <span>Total</span>

                              <strong>
                                {formatPrice(
                                  order.total
                                )}
                              </strong>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </section>

            {/* TOTAL SPENT */}
            <div
              style={{
                marginTop: 30,
                textAlign: "right",
                color: "var(--kyro-muted)",
                fontSize: 11,
              }}
            >
              Total value of your Kyro orders:{" "}
              <strong
                style={{
                  color: "var(--kyro-ink)",
                  fontFamily:
                    'Georgia, "Times New Roman", serif',
                  fontSize: 18,
                  marginLeft: 5,
                }}
              >
                {formatPrice(totalSpent)}
              </strong>
            </div>
          </>
        ) : (
          /* =========================================================
             EMPTY STATE
          ========================================================= */
          <section className="empty-state">
            <div className="empty-orb">
              <span>K</span>
            </div>

            <p className="store-eyebrow">
              KYRO / YOUR JOURNEY
            </p>

            <h2>{message}</h2>

            <p>
              Your fragrance collection starts with one
              discovery. Explore the Kyro edit and find
              something that feels unmistakably yours.
            </p>

            <Link
              className="hero-button"
              href="/shop"
            >
              Shop the collection
              <span>→</span>
            </Link>
          </section>
        )}
      </div>

      {/* ===========================================================
          FLOATING SELLER CHAT
      =========================================================== */}
      <Link
        href="/contact"
        className="floating-chat"
        aria-label="Chat with seller"
      >
        <span className="chat-icon">✦</span>

        <span className="chat-copy">
          <strong>Chat with seller</strong>
          <span>Need help with your order?</span>
        </span>
      </Link>
    </main>
  );
}