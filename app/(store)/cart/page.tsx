"use client";

import Link from "next/link";
import {
  useMemo,
  useState,
} from "react";
import {
  CartItem,
  readCart,
  saveCart,
} from "@/lib/cart";
import toast from "react-hot-toast";

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>(() =>
    readCart()
  );

  const [message, setMessage] =
    useState("");

  const [removingId, setRemovingId] =
    useState<string | null>(null);

  const total = useMemo(
    () =>
      items.reduce(
        (sum, item) =>
          sum + item.price * item.quantity,
        0
      ),
    [items]
  );

  const itemCount = useMemo(
    () =>
      items.reduce(
        (sum, item) =>
          sum + item.quantity,
        0
      ),
    [items]
  );

  /* =========================================================
     PRICE FORMATTER
     ========================================================= */

  function formatPrice(price: number) {
    return new Intl.NumberFormat(
      "en-LK",
      {
        maximumFractionDigits: 0,
      }
    ).format(price);
  }

  /* =========================================================
     UPDATE QUANTITY
     ========================================================= */

  function update(
    productId: string,
    quantity: number
  ) {
    const currentItem = items.find(
      (item) =>
        item.productId === productId
    );

    if (!currentItem) return;

    if (quantity <= 0) {
      removeItem(productId);
      return;
    }

    const next = items.map((item) =>
      item.productId === productId
        ? {
            ...item,
            quantity,
          }
        : item
    );

    setItems(next);
    saveCart(next);
  }

  /* =========================================================
     REMOVE ITEM
     ========================================================= */

  function removeItem(productId: string) {
    const item = items.find(
      (cartItem) =>
        cartItem.productId === productId
    );

    if (!item) return;

    setRemovingId(productId);

    /*
     * Small delay allows the remove animation
     * to play before the item disappears.
     */
    window.setTimeout(() => {
      const next = items.filter(
        (cartItem) =>
          cartItem.productId !== productId
      );

      setItems(next);
      saveCart(next);

      setRemovingId(null);

      toast.success(
        `${item.name} removed from cart.`
      );
    }, 300);
  }

  /* =========================================================
     CLEAR CART
     ========================================================= */

  function clearCart() {
    if (!items.length) return;

    setItems([]);
    saveCart([]);

    toast.success(
      "Your cart has been cleared."
    );
  }

  /* =========================================================
     PLACE ORDER
     ========================================================= */

  function proceedToCheckout() {
    if (!items.length) {
      toast.error(
        "Your cart is empty."
      );
      return;
    }

    // Navigate to checkout page
    window.location.href = "/checkout";
  }

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `

          /* =====================================================
             KYRO CART PAGE
             ===================================================== */

          .kyro-cart-page {
            --kyro-bg: #f8f6f0;
            --kyro-surface: #fffefa;
            --kyro-paper: #efebe1;
            --kyro-ink: #171717;
            --kyro-muted: #777268;
            --kyro-soft: #aaa397;
            --kyro-line: rgba(23, 23, 23, 0.10);
            --kyro-gold: #aa8953;
            --kyro-gold-dark: #806537;
            --kyro-dark: #171717;

            min-height: 100vh;

            padding:
              55px 24px 100px;

            color:
              var(--kyro-ink);

            background:
              radial-gradient(
                circle at 7% 8%,
                rgba(170,137,83,0.075),
                transparent 25%
              ),
              radial-gradient(
                circle at 94% 20%,
                rgba(170,137,83,0.055),
                transparent 24%
              ),
              linear-gradient(
                180deg,
                #f8f6f0 0%,
                #faf8f3 52%,
                #f3eee5 100%
              );

            animation:
              kyroPageReveal
              0.7s
              ease
              both;
          }

          .kyro-cart-inner {
            width:
              min(1180px, 100%);

            margin:
              0 auto;
          }

          /* =====================================================
             HEADER
             ===================================================== */

          .cart-heading {
            display:
              flex;

            align-items:
              flex-end;

            justify-content:
              space-between;

            gap:
              30px;

            margin-bottom:
              35px;

            animation:
              kyroSlideUp
              0.75s
              cubic-bezier(.2,.8,.2,1)
              both;
          }

          .cart-heading-left {
            min-width: 0;
          }

          .store-eyebrow {
            display:
              inline-flex;

            align-items:
              center;

            gap:
              9px;

            margin:
              0 0 13px;

            color:
              var(--kyro-gold-dark);

            font-size:
              9px;

            font-weight:
              800;

            letter-spacing:
              0.22em;

            text-transform:
              uppercase;
          }

          .store-eyebrow::before {
            content: "";

            width:
              27px;

            height:
              1px;

            background:
              var(--kyro-gold);
          }

          .cart-heading h1 {
            margin:
              0;

            font-size:
              clamp(
                2.1rem,
                5vw,
                4.4rem
              );

            line-height:
              0.95;

            letter-spacing:
              -0.055em;

            font-weight:
              500;
          }

          .cart-heading h1 em {
            font-family:
              Georgia,
              "Times New Roman",
              serif;

            font-weight:
              400;

            color:
              var(--kyro-gold-dark);
          }

          .cart-heading-description {
            max-width:
              510px;

            margin:
              16px 0 0;

            color:
              var(--kyro-muted);

            font-size:
              13px;

            line-height:
              1.75;
          }

          .cart-count-badge {
            flex:
              0 0 auto;

            display:
              flex;

            align-items:
              center;

            gap:
              10px;

            padding:
              10px 14px;

            border:
              1px solid
              var(--kyro-line);

            border-radius:
              999px;

            background:
              rgba(
                255,
                254,
                250,
                0.7
              );

            color:
              var(--kyro-muted);

            font-size:
              10px;

            font-weight:
              700;

            backdrop-filter:
              blur(12px);
          }

          .cart-count-badge strong {
            display:
              inline-flex;

            align-items:
              center;

            justify-content:
              center;

            min-width:
              22px;

            height:
              22px;

            padding:
              0 6px;

            border-radius:
              999px;

            background:
              var(--kyro-ink);

            color:
              white;

            font-size:
              9px;
          }

          /* =====================================================
             MESSAGE
             ===================================================== */

          .commerce-message {
            margin:
              0 0 22px;

            padding:
              13px 16px;

            border:
              1px solid
              rgba(170,137,83,0.24);

            border-radius:
              12px;

            background:
              rgba(
                255,
                254,
                250,
                0.8
              );

            color:
              var(--kyro-ink);

            font-size:
              12px;

            animation:
              kyroMessage
              0.45s
              ease
              both;
          }

          /* =====================================================
             MAIN CART LAYOUT
             ===================================================== */

          .cart-layout {
            display:
              grid;

            grid-template-columns:
              minmax(0, 1fr)
              340px;

            align-items:
              start;

            gap:
              22px;

            animation:
              kyroSlideUp
              0.8s
              0.1s
              cubic-bezier(.2,.8,.2,1)
              both;
          }

          /* =====================================================
             CART ITEMS
             ===================================================== */

          .cart-items {
            display:
              flex;

            flex-direction:
              column;

            gap:
              12px;
          }

          .cart-items-header {
            display:
              flex;

            align-items:
              center;

            justify-content:
              space-between;

            margin:
              0 2px 4px;
          }

          .cart-items-label {
            margin:
              0;

            color:
              var(--kyro-gold-dark);

            font-size:
              9px;

            font-weight:
              800;

            letter-spacing:
              0.18em;

            text-transform:
              uppercase;
          }

          .clear-cart-button {
            border:
              none;

            background:
              transparent;

            color:
              var(--kyro-muted);

            font-size:
              10px;

            font-weight:
              700;

            cursor:
              pointer;

            padding:
              5px;

            transition:
              color 0.2s ease,
              transform 0.2s ease;
          }

          .clear-cart-button:hover {
            color:
              var(--kyro-ink);

            transform:
              translateY(-1px);
          }

          /* =====================================================
             CART ITEM
             ===================================================== */

          .cart-item {
            position:
              relative;

            display:
              grid;

            grid-template-columns:
              100px
              minmax(0, 1fr)
              auto;

            align-items:
              center;

            gap:
              17px;

            min-height:
              130px;

            padding:
              13px;

            border:
              1px solid
              var(--kyro-line);

            border-radius:
              17px;

            background:
              rgba(
                255,
                254,
                250,
                0.78
              );

            box-shadow:
              0 7px 22px
              rgba(30,25,18,0.025);

            overflow:
              hidden;

            animation:
              cartItemReveal
              0.55s
              cubic-bezier(.2,.8,.2,1)
              both;

            transition:
              transform 0.3s ease,
              border-color 0.3s ease,
              box-shadow 0.3s ease,
              opacity 0.3s ease;
          }

          .cart-item:nth-child(2) {
            animation-delay:
              0.06s;
          }

          .cart-item:nth-child(3) {
            animation-delay:
              0.12s;
          }

          .cart-item:nth-child(4) {
            animation-delay:
              0.18s;
          }

          .cart-item:hover {
            transform:
              translateY(-2px);

            border-color:
              rgba(
                170,
                137,
                83,
                0.28
              );

            box-shadow:
              0 15px 35px
              rgba(30,25,18,0.065);
          }

          .cart-item.removing {
            opacity:
              0;

            transform:
              translateX(20px)
              scale(0.97);
          }

          /* =====================================================
             PRODUCT IMAGE
             ===================================================== */

          .cart-item-image {
            position:
              relative;

            width:
              100px;

            height:
              103px;

            overflow:
              hidden;

            border-radius:
              12px;

            background:
              radial-gradient(
                circle at 50% 45%,
                #ffffff 0%,
                #f3eee5 58%,
                #e7e1d5 100%
              );

            flex-shrink:
              0;
          }

          .cart-item-image::after {
            content:
              "";

            position:
              absolute;

            inset:
              0;

            pointer-events:
              none;

            background:
              linear-gradient(
                180deg,
                transparent,
                rgba(23,23,23,0.06)
              );
          }

          .cart-item-image img {
            width:
              100%;

            height:
              100%;

            display:
              block;

            object-fit:
              cover;

            transition:
              transform 0.55s
              cubic-bezier(.2,.8,.2,1);
          }

          .cart-item:hover
          .cart-item-image img {
            transform:
              scale(1.07);
          }

          .cart-item-art {
            width:
              100%;

            height:
              100%;

            display:
              flex;

            align-items:
              center;

            justify-content:
              center;

            color:
              var(--kyro-gold-dark);

            font-family:
              Georgia,
              serif;

            font-size:
              27px;
          }

          /* =====================================================
             ITEM DETAILS
             ===================================================== */

          .cart-item-details {
            min-width:
              0;

            display:
              flex;

            flex-direction:
              column;

            justify-content:
              center;
          }

          .cart-item-brand {
            margin:
              0 0 5px;

            color:
              var(--kyro-gold-dark);

            font-size:
              8px;

            font-weight:
              800;

            letter-spacing:
              0.16em;

            text-transform:
              uppercase;

            white-space:
              nowrap;

            overflow:
              hidden;

            text-overflow:
              ellipsis;
          }

          .cart-item-name {
            display:
              -webkit-box;

            -webkit-box-orient:
              vertical;

            -webkit-line-clamp:
              2;

            overflow:
              hidden;

            margin:
              0;

            color:
              var(--kyro-ink);

            font-size:
              15px;

            line-height:
              1.25;

            font-weight:
              650;

            letter-spacing:
              -0.025em;
          }

          .cart-item-meta {
            display:
              flex;

            align-items:
              center;

            flex-wrap:
              wrap;

            gap:
              7px;

            margin:
              7px 0 10px;

            color:
              var(--kyro-muted);

            font-size:
              10px;
          }

          .cart-item-meta-dot {
            width:
              3px;

            height:
              3px;

            border-radius:
              50%;

            background:
              #aaa398;
          }

          /* =====================================================
             QUANTITY
             ===================================================== */

          .quantity-control {
            display:
              inline-flex;

            align-items:
              center;

            width:
              fit-content;

            height:
              31px;

            border:
              1px solid
              var(--kyro-line);

            border-radius:
              999px;

            background:
              rgba(
                255,
                254,
                250,
                0.82
              );

            overflow:
              hidden;
          }

          .quantity-control button {
            width:
              32px;

            height:
              100%;

            display:
              flex;

            align-items:
              center;

            justify-content:
              center;

            border:
              none;

            background:
              transparent;

            color:
              var(--kyro-ink);

            font-size:
              16px;

            line-height:
              1;

            cursor:
              pointer;

            transition:
              background 0.2s ease,
              color 0.2s ease,
              transform 0.2s ease;
          }

          .quantity-control button:hover {
            background:
              var(--kyro-paper);

            color:
              var(--kyro-gold-dark);
          }

          .quantity-control button:active {
            transform:
              scale(0.88);
          }

          .quantity-control span {
            min-width:
              28px;

            text-align:
              center;

            color:
              var(--kyro-ink);

            font-size:
              10px;

            font-weight:
              800;
          }

          /* =====================================================
             ITEM PRICE / DELETE
             ===================================================== */

          .cart-item-right {
            display:
              flex;

            flex-direction:
              column;

            align-items:
              flex-end;

            justify-content:
              space-between;

            align-self:
              stretch;

            gap:
              12px;
          }

          .cart-item-total {
            color:
              var(--kyro-ink);

            font-size:
              14px;

            font-weight:
              800;

            white-space:
              nowrap;
          }

          .remove-item-button {
            display:
              inline-flex;

            align-items:
              center;

            justify-content:
              center;

            width:
              29px;

            height:
              29px;

            border:
              1px solid
              rgba(
                23,
                23,
                23,
                0.08
              );

            border-radius:
              50%;

            background:
              transparent;

            color:
              var(--kyro-muted);

            font-size:
              15px;

            cursor:
              pointer;

            transition:
              transform 0.25s ease,
              color 0.25s ease,
              background 0.25s ease,
              border-color 0.25s ease;
          }

          .remove-item-button:hover {
            transform:
              rotate(90deg);

            color:
              #8c5b4c;

            background:
              #f1e9e2;

            border-color:
              rgba(140,91,76,0.18);
          }

          /* =====================================================
             SUMMARY
             ===================================================== */

          .cart-summary {
            position:
              sticky;

            top:
              95px;

            padding:
              24px;

            border:
              1px solid
              var(--kyro-line);

            border-radius:
              20px;

            background:
              linear-gradient(
                145deg,
                rgba(255,254,250,0.94),
                rgba(246,242,233,0.78)
              );

            box-shadow:
              0 15px 40px
              rgba(30,25,18,0.045);

            backdrop-filter:
              blur(18px);

            animation:
              summaryReveal
              0.75s
              0.22s
              cubic-bezier(.2,.8,.2,1)
              both;
          }

          .summary-label {
            margin:
              0 0 8px;

            color:
              var(--kyro-gold-dark);

            font-size:
              9px;

            font-weight:
              800;

            letter-spacing:
              0.20em;

            text-transform:
              uppercase;
          }

          .summary-heading {
            margin:
              0;

            color:
              var(--kyro-ink);

            font-size:
              12px;

            font-weight:
              600;
          }

          .summary-total {
            margin:
              10px 0 0;

            font-size:
              31px;

            line-height:
              1;

            font-weight:
              600;

            letter-spacing:
              -0.045em;
          }

          .summary-divider {
            width:
              100%;

            height:
              1px;

            margin:
              22px 0;

            background:
              var(--kyro-line);
          }

          .summary-row {
            display:
              flex;

            align-items:
              center;

            justify-content:
              space-between;

            gap:
              15px;

            margin:
              11px 0;

            color:
              var(--kyro-muted);

            font-size:
              11px;
          }

          .summary-row strong {
            color:
              var(--kyro-ink);

            font-weight:
              700;
          }

          .summary-note {
            margin:
              20px 0;

            padding:
              12px;

            border-radius:
              11px;

            background:
              rgba(
                170,
                137,
                83,
                0.075
              );

            color:
              var(--kyro-muted);

            font-family:
              Georgia,
              serif;

            font-size:
              11px;

            line-height:
              1.6;
          }

          /* =====================================================
             CHECKOUT BUTTON
             ===================================================== */

          .checkout-button {
            position:
              relative;

            width:
              100%;

            height:
              47px;

            display:
              flex;

            align-items:
              center;

            justify-content:
              space-between;

            padding:
              0 17px;

            border:
              none;

            border-radius:
              999px;

            background:
              var(--kyro-ink);

            color:
              white;

            font-size:
              10px;

            font-weight:
              800;

            letter-spacing:
              0.06em;

            cursor:
              pointer;

            overflow:
              hidden;

            transition:
              transform 0.25s ease,
              box-shadow 0.25s ease,
              background 0.25s ease;
          }

          .checkout-button::before {
            content:
              "";

            position:
              absolute;

            left:
              -100%;

            top:
              0;

            width:
              55%;

            height:
              100%;

            background:
              linear-gradient(
                90deg,
                transparent,
                rgba(255,255,255,0.14),
                transparent
              );

            transform:
              skewX(-20deg);

            transition:
              left 0.55s ease;
          }

          .checkout-button:hover::before {
            left:
              135%;
          }

          .checkout-button:hover {
            transform:
              translateY(-2px);

            background:
              #292929;

            box-shadow:
              0 12px 28px
              rgba(23,23,23,0.17);
          }

          .checkout-button span {
            font-size:
              16px;

            transition:
              transform 0.25s ease;
          }

          .checkout-button:hover span {
            transform:
              translateX(4px);
          }

          /* =====================================================
             CONTINUE SHOPPING
             ===================================================== */

          .continue-shopping {
            display:
              flex;

            align-items:
              center;

            justify-content:
              center;

            gap:
              7px;

            margin:
              14px 0 0;

            color:
              var(--kyro-muted);

            text-decoration:
              none;

            font-size:
              10px;

            font-weight:
              700;

            transition:
              color 0.2s ease;
          }

          .continue-shopping:hover {
            color:
              var(--kyro-ink);
          }

          /* =====================================================
             EMPTY CART
             ===================================================== */

          .empty-commerce {
            min-height:
              420px;

            display:
              flex;

            flex-direction:
              column;

            align-items:
              center;

            justify-content:
              center;

            padding:
              60px 25px;

            border:
              1px solid
              var(--kyro-line);

            border-radius:
              24px;

            background:
              rgba(
                255,
                254,
                250,
                0.65
              );

            text-align:
              center;

            animation:
              kyroSlideUp
              0.7s
              ease
              both;
          }

          .empty-mark {
            width:
              68px;

            height:
              68px;

            display:
              flex;

            align-items:
              center;

            justify-content:
              center;

            margin-bottom:
              22px;

            border:
              1px solid
              rgba(
                170,
                137,
                83,
                0.4
              );

            border-radius:
              50%;

            color:
              var(--kyro-gold-dark);

            font-family:
              Georgia,
              serif;

            font-size:
              25px;

            animation:
              kyroFloat
              3.5s
              ease-in-out
              infinite;
          }

          .empty-commerce h2 {
            margin:
              0;

            font-size:
              26px;

            font-weight:
              500;

            letter-spacing:
              -0.035em;
          }

          .empty-commerce p {
            margin:
              10px 0 22px;

            color:
              var(--kyro-muted);

            font-size:
              13px;
          }

          .empty-shop-button {
            display:
              inline-flex;

            align-items:
              center;

            justify-content:
              center;

            gap:
              14px;

            min-height:
              44px;

            padding:
              0 20px;

            border-radius:
              999px;

            background:
              var(--kyro-ink);

            color:
              white;

            text-decoration:
              none;

            font-size:
              10px;

            font-weight:
              800;

            transition:
              transform 0.25s ease,
              box-shadow 0.25s ease;
          }

          .empty-shop-button:hover {
            transform:
              translateY(-2px);

            box-shadow:
              0 12px 25px
              rgba(23,23,23,0.15);
          }

          /* =====================================================
             CHECKOUT OVERLAY
             ===================================================== */

          .checkout-backdrop {
            position:
              fixed;

            inset:
              0;

            z-index:
              1000;

            display:
              flex;

            align-items:
              center;

            justify-content:
              center;

            padding:
              20px;

            background:
              rgba(
                18,
                17,
                15,
                0.58
              );

            backdrop-filter:
              blur(10px);

            animation:
              backdropReveal
              0.3s
              ease
              both;
          }

          .checkout-card {
            position:
              relative;

            width:
              min(510px, 100%);

            max-height:
              calc(100vh - 40px);

            overflow-y:
              auto;

            padding:
              28px;

            border:
              1px solid
              rgba(
                255,
                255,
                255,
                0.22
              );

            border-radius:
              24px;

            background:
              linear-gradient(
                145deg,
                #fffefa,
                #f4f0e7
              );

            box-shadow:
              0 30px 90px
              rgba(0,0,0,0.25);

            animation:
              checkoutReveal
              0.45s
              cubic-bezier(.2,.8,.2,1)
              both;
          }

          .close-button {
            position:
              absolute;

            top:
              18px;

            right:
              18px;

            width:
              34px;

            height:
              34px;

            display:
              flex;

            align-items:
              center;

            justify-content:
              center;

            border:
              1px solid
              var(--kyro-line);

            border-radius:
              50%;

            background:
              rgba(
                255,
                254,
                250,
                0.7
              );

            color:
              var(--kyro-ink);

            font-size:
              20px;

            line-height:
              1;

            cursor:
              pointer;

            transition:
              transform 0.25s ease,
              background 0.25s ease;
          }

          .close-button:hover {
            transform:
              rotate(90deg);

            background:
              var(--kyro-paper);
          }

          .checkout-card .store-eyebrow {
            margin-bottom:
              11px;
          }

          .checkout-card h2 {
            margin:
              0 45px 23px 0;

            font-size:
              25px;

            line-height:
              1.05;

            font-weight:
              500;

            letter-spacing:
              -0.035em;
          }

          .checkout-card input {
            width:
              100%;

            height:
              46px;

            margin-bottom:
              10px;

            padding:
              0 14px;

            border:
              1px solid
              var(--kyro-line);

            border-radius:
              11px;

            outline:
              none;

            background:
              rgba(
                255,
                254,
                250,
                0.8
              );

            color:
              var(--kyro-ink);

            font-size:
              12px;

            transition:
              border-color 0.25s ease,
              box-shadow 0.25s ease,
              background 0.25s ease;
          }

          .checkout-card input::placeholder {
            color:
              #9b968c;
          }

          .checkout-card input:focus {
            border-color:
              rgba(
                170,
                137,
                83,
                0.65
              );

            background:
              #fffefa;

            box-shadow:
              0 0 0 4px
              rgba(
                170,
                137,
                83,
                0.08
              );
          }

          .checkout-row {
            display:
              grid;

            grid-template-columns:
              1fr 1fr;

            gap:
              10px;
          }

          .checkout-submit {
            width:
              100%;

            height:
              48px;

            margin-top:
              8px;

            border:
              none;

            border-radius:
              999px;

            background:
              var(--kyro-ink);

            color:
              white;

            font-size:
              10px;

            font-weight:
              800;

            letter-spacing:
              0.06em;

            cursor:
              pointer;

            transition:
              transform 0.25s ease,
              box-shadow 0.25s ease,
              background 0.25s ease;
          }

          .checkout-submit:hover {
            transform:
              translateY(-2px);

            background:
              #2c2c2c;

            box-shadow:
              0 12px 25px
              rgba(23,23,23,0.16);
          }

          /* =====================================================
             ANIMATIONS
             ===================================================== */

          @keyframes kyroPageReveal {
            from {
              opacity:
                0;
            }

            to {
              opacity:
                1;
            }
          }

          @keyframes kyroSlideUp {
            from {
              opacity:
                0;

              transform:
                translateY(22px);
            }

            to {
              opacity:
                1;

              transform:
                translateY(0);
            }
          }

          @keyframes cartItemReveal {
            from {
              opacity:
                0;

              transform:
                translateY(18px)
                scale(0.985);
            }

            to {
              opacity:
                1;

              transform:
                translateY(0)
                scale(1);
            }
          }

          @keyframes summaryReveal {
            from {
              opacity:
                0;

              transform:
                translateX(20px);
            }

            to {
              opacity:
                1;

              transform:
                translateX(0);
            }
          }

          @keyframes checkoutReveal {
            from {
              opacity:
                0;

              transform:
                translateY(18px)
                scale(0.96);
            }

            to {
              opacity:
                1;

              transform:
                translateY(0)
                scale(1);
            }
          }

          @keyframes backdropReveal {
            from {
              opacity:
                0;
            }

            to {
              opacity:
                1;
            }
          }

          @keyframes kyroMessage {
            from {
              opacity:
                0;

              transform:
                translateY(-8px);
            }

            to {
              opacity:
                1;

              transform:
                translateY(0);
            }
          }

          @keyframes kyroFloat {
            0%,
            100% {
              transform:
                translateY(0);
            }

            50% {
              transform:
                translateY(-6px);
            }
          }

          /* =====================================================
             TABLET
             ===================================================== */

          @media (max-width: 900px) {

            .cart-layout {
              grid-template-columns:
                1fr;
            }

            .cart-summary {
              position:
                relative;

              top:
                auto;
            }

          }

          /* =====================================================
             MOBILE
             ===================================================== */

          @media (max-width: 768px) {
            .kyro-cart-page {
              padding: 45px 16px 80px;
            }

            .kyro-cart-inner {
              width: calc(100% - 0px);
            }

            .cart-layout {
              grid-template-columns: 1fr !important;
              gap: 16px !important;
            }

            .cart-summary {
              position: static !important;
              top: auto !important;
            }

            .cart-heading {
              align-items: flex-start;
              flex-direction: column;
              gap: 14px;
              margin-bottom: 20px;
            }

            .cart-heading h1 {
              font-size: clamp(1.8rem, 5vw, 2.8rem);
            }

            .cart-heading-description {
              font-size: 12px;
              max-width: 100%;
            }

            .cart-count-badge {
              width: 100%;
              justify-content: space-between;
            }

            .cart-item {
              grid-template-columns: 80px minmax(0, 1fr);
              gap: 12px;
              min-height: auto;
              padding: 12px;
            }

            .cart-item-image {
              width: 80px;
              height: 90px;
            }

            .cart-item-right {
              grid-column: 2;
              grid-row: auto;
              flex-direction: row;
              align-items: center;
              justify-content: space-between;
              margin-top: 0;
            }

            .cart-item-details {
              min-width: 0;
            }

            .cart-item-name {
              font-size: 13px;
              -webkit-line-clamp: 2;
            }

            .cart-item-meta {
              font-size: 10px;
              margin: 4px 0 6px;
            }

            .cart-item-brand {
              font-size: 8px;
            }

            .cart-item-total {
              font-size: 13px;
              min-height: 44px;
              display: flex;
              align-items: center;
              padding: 8px;
            }

            .quantity-control {
              height: 44px !important;
              min-height: 44px;
              min-width: 100px;
            }

            .quantity-control button {
              width: 44px !important;
              height: 44px !important;
              min-width: 44px;
            }

            .quantity-control span {
              min-width: 32px;
            }

            .remove-item-button {
              width: 44px !important;
              height: 44px !important;
              min-width: 44px;
              min-height: 44px;
            }

            .clear-cart-button {
              min-height: 44px;
              padding: 8px 12px;
              font-size: 10px;
            }

            .cart-summary {
              padding: 18px;
            }

            .summary-total {
              font-size: 26px;
              margin-top: 8px;
            }

            .summary-row {
              font-size: 11px;
              margin: 8px 0;
            }

            .checkout-button {
              height: 44px;
              min-height: 44px;
              font-size: 11px;
              padding: 0 14px;
            }

            .checkout-button span {
              font-size: 14px;
            }

            .continue-shopping {
              font-size: 11px;
              gap: 6px;
              min-height: 44px;
              padding: 8px 12px;
            }

            .checkout-card input {
              font-size: 16px;
              min-height: 44px;
              padding: 12px 14px;
            }

            .checkout-submit {
              height: 44px;
              min-height: 44px;
              font-size: 12px;
            }

            .empty-commerce {
              min-height: 300px;
              padding: 40px 16px;
            }

            .empty-mark {
              width: 60px;
              height: 60px;
              font-size: 22px;
            }

            .empty-commerce h2 {
              font-size: 20px;
            }

            .empty-commerce p {
              font-size: 12px;
            }

            .empty-shop-button {
              min-height: 44px;
              padding: 0 16px;
              font-size: 11px;
            }
          }

          @media (prefers-reduced-motion: reduce) {

            *,
            *::before,
            *::after {
              animation-duration:
                0.01ms !important;

              animation-iteration-count:
                1 !important;

              transition-duration:
                0.01ms !important;
            }

          }

        `,
        }}
      />

      <main className="kyro-cart-page">
        <div className="kyro-cart-inner">

          {/* =====================================================
              PAGE HEADER
              ===================================================== */}

          <section className="cart-heading">

            <div className="cart-heading-left">

              <p className="store-eyebrow">
                KYRO / YOUR CART
              </p>

              <h1>
                Curate your{" "}
                <em>ritual.</em>
              </h1>

              <p className="cart-heading-description">
                Small bottles, considered choices,
                and a fragrance collection that
                belongs entirely to you.
              </p>

            </div>

            <div className="cart-count-badge">
              <span>
                Your selection
              </span>

              <strong>
                {itemCount}
              </strong>
            </div>

          </section>

          {/* =====================================================
              MESSAGE
              ===================================================== */}

          {message && (
            <div
              className="commerce-message"
              role="status"
            >
              {message}
            </div>
          )}

          {/* =====================================================
              CART
              ===================================================== */}

          {items.length ? (

            <section className="cart-layout">

              {/* =================================================
                  ITEMS
                  ================================================= */}

              <div className="cart-items">

                <div className="cart-items-header">

                  <p className="cart-items-label">
                    Selected fragrances
                  </p>

                  <button
                    type="button"
                    className="clear-cart-button"
                    onClick={clearCart}
                  >
                    Clear cart
                  </button>

                </div>

                {items.map((item, index) => {

                  const itemTotal =
                    item.price *
                    item.quantity;

                  const isRemoving =
                    removingId ===
                    item.productId;

                  return (
                    <article
                      className={`cart-item ${
                        isRemoving
                          ? "removing"
                          : ""
                      }`}
                      key={`${item.productId}-${index}`}
                    >

                      {/* =========================================
                          PRODUCT IMAGE
                          ========================================= */}

                      <div className="cart-item-image">

                        {item.imageUrl ? (

                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            loading="lazy"
                          />

                        ) : (

                          <div className="cart-item-art">
                            K
                          </div>

                        )}

                      </div>

                      {/* =========================================
                          DETAILS
                          ========================================= */}

                      <div className="cart-item-details">

                        <p className="cart-item-brand">
                          KYRO PARFUMS
                        </p>

                        <h2 className="cart-item-name">
                          {item.name}
                        </h2>

                        <div className="cart-item-meta">

                          <span>
                            {item.size ??
                              "Decant"}
                          </span>

                          <span className="cart-item-meta-dot" />

                          <span>
                            Rs.{" "}
                            {formatPrice(
                              item.price
                            )}
                          </span>

                        </div>

                        {/* =====================================
                            QUANTITY
                            ===================================== */}

                        <div className="quantity-control">

                          <button
                            type="button"
                            onClick={() =>
                              update(
                                item.productId,
                                item.quantity - 1
                              )
                            }
                            aria-label={`Decrease ${item.name}`}
                          >
                            −
                          </button>

                          <span>
                            {item.quantity}
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              update(
                                item.productId,
                                item.quantity + 1
                              )
                            }
                            aria-label={`Increase ${item.name}`}
                          >
                            +
                          </button>

                        </div>

                      </div>

                      {/* =========================================
                          PRICE / DELETE
                          ========================================= */}

                      <div className="cart-item-right">

                        <strong className="cart-item-total">
                          Rs.{" "}
                          {formatPrice(
                            itemTotal
                          )}
                        </strong>

                        <button
                          type="button"
                          className="remove-item-button"
                          onClick={() =>
                            removeItem(
                              item.productId
                            )
                          }
                          aria-label={`Remove ${item.name}`}
                          title="Remove item"
                        >
                          ×
                        </button>

                      </div>

                    </article>
                  );
                })}

              </div>

              {/* =================================================
                  ORDER SUMMARY
                  ================================================= */}

              <aside className="cart-summary">

                <p className="summary-label">
                  ORDER SUMMARY
                </p>

                <p className="summary-heading">
                  Your Kyro collection
                </p>

                <h2 className="summary-total">
                  Rs.{" "}
                  {formatPrice(total)}
                </h2>

                <div className="summary-divider" />

                <div className="summary-row">
                  <span>
                    Items
                  </span>

                  <strong>
                    {itemCount}
                  </strong>
                </div>

                <div className="summary-row">
                  <span>
                    Subtotal
                  </span>

                  <strong>
                    Rs.{" "}
                    {formatPrice(total)}
                  </strong>
                </div>

                <div className="summary-row">
                  <span>
                    Delivery
                  </span>

                  <strong>
                    Calculated at checkout
                  </strong>
                </div>

                <div className="summary-note">
                  Every Kyro order is carefully
                  prepared and packed so your
                  fragrance arrives ready for its
                  next ritual.
                </div>

                <button
                  type="button"
                  className="checkout-button"
                  onClick={proceedToCheckout}
                >
                  <span>
                    Continue to checkout
                  </span>

                  <span>
                    →
                  </span>
                </button>

                <Link
                  href="/shop"
                  className="continue-shopping"
                >
                  ← Continue shopping
                </Link>

              </aside>

            </section>

          ) : (

            /* ===================================================
               EMPTY CART
               =================================================== */

            <section className="empty-commerce">

              <div className="empty-mark">
                K
              </div>

              <h2>
                Your cart is beautifully empty.
              </h2>

              <p>
                Start with one note, or let your
                mood lead the way.
              </p>

              <Link
                className="empty-shop-button"
                href="/shop"
              >
                <span>
                  Explore the edit
                </span>

                <span>
                  →
                </span>
              </Link>

            </section>

          )}

        </div>
      </main>

      {/* =========================================================
          CHECKOUT MODAL - REMOVED
          ========================================================= */}
      {/* The checkout flow has been moved to a dedicated /checkout page */}
    </>
  );
}