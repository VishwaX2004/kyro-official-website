"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { readCart, saveCart } from "@/lib/cart";
import type { SerializedProduct, Decant } from "./page";

/* =========================================================
   HELPERS (client-side copies)
========================================================= */

const formatPrice = (price: number) =>
  new Intl.NumberFormat("en-LK", { maximumFractionDigits: 0 }).format(price);

const getDiscount = (
  labelledPrice: number | undefined,
  price: number
): number => {
  if (!labelledPrice || labelledPrice <= price) return 0;
  return Math.round(((labelledPrice - price) / labelledPrice) * 100);
};

/* =========================================================
   COMPONENT
========================================================= */

export default function ProductActions({
  product,
}: {
  product: SerializedProduct;
}) {
  const primaryImage = product.images[0] ?? "";

  /* ── initial size: first in-stock decant ── */
  const defaultIndex = (() => {
    const idx = product.decants.findIndex((d) => Number(d.stock ?? 0) > 0);
    return idx >= 0 ? idx : 0;
  })();

  const [selectedIndex, setSelectedIndex] = useState<number>(defaultIndex);
  const [quantity, setQuantity] = useState<number>(1);
  const [adding, setAdding] = useState<boolean>(false);
  const [justAdded, setJustAdded] = useState<boolean>(false);

  const selectedDecant: Decant | undefined = product.decants[selectedIndex];
  const selectedStock = Number(selectedDecant?.stock ?? 0);
  const selectedPrice = Number(selectedDecant?.price ?? 0);
  const selectedSize = selectedDecant
    ? `${selectedDecant.size}${selectedDecant.unit}`
    : "";
  const discount = selectedDecant
    ? getDiscount(selectedDecant.labelledPrice, selectedDecant.price)
    : 0;

  const totalStock = product.decants.reduce(
    (sum, d) => sum + Number(d.stock ?? 0),
    0
  );
  const canAddToCart = totalStock > 0 && selectedStock > 0;
  const maxQuantity = selectedStock > 0 ? selectedStock : 1;

  /* ── handlers ── */

  function handleSizeChange(index: number) {
    const decant = product.decants[index];
    if (!decant || Number(decant.stock ?? 0) <= 0) return;
    setSelectedIndex(index);
    setQuantity((prev) => Math.min(Math.max(1, prev), Number(decant.stock)));
  }

  function decreaseQuantity() {
    setQuantity((prev) => Math.max(1, prev - 1));
  }

  function increaseQuantity() {
    setQuantity((prev) => Math.min(maxQuantity, prev + 1));
  }

  function handleAddToCart() {
    if (!canAddToCart || !selectedDecant || adding) return;

    setAdding(true);
    try {
      const cart = readCart();
      const existing = cart.find(
        (item) =>
          item.productId === product.id && item.size === selectedSize
      );

      if (existing) {
        existing.quantity = Math.min(
          existing.quantity + quantity,
          selectedStock
        );
      } else {
        cart.push({
          productId: product.id,
          name: product.name,
          price: selectedPrice,
          imageUrl: primaryImage,
          size: selectedSize,
          quantity,
        });
      }

      saveCart(cart);
      setJustAdded(true);
      toast.success(`${product.name} (${selectedSize}) added to cart!`);

      setTimeout(() => {
        setJustAdded(false);
        setAdding(false);
      }, 2000);
    } catch {
      toast.error("Could not add to cart. Please try again.");
      setAdding(false);
    }
  }

  /* ── render ── */

  return (
    <div>
      {/* ================================================
          SIZE SELECTION
      ================================================ */}
      <div className="mt-3.5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[8px] font-bold tracking-[0.18em] text-black/55">
              SELECT SIZE
            </p>
            <p className="mt-0.5 text-[7px] text-black/35">
              Choose your preferred decant
            </p>
          </div>
          {selectedSize && (
            <span className="rounded-full bg-[#aa8953]/10 px-2.5 py-1 text-[7px] font-bold text-[#806537]">
              {selectedSize}
            </span>
          )}
        </div>

        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {product.decants.map((decant, index) => {
            const itemDiscount = getDiscount(
              decant.labelledPrice,
              decant.price
            );
            const available = Number(decant.stock ?? 0) > 0;
            const selected = selectedIndex === index;

            return (
              <button
                key={`${decant.size}-${decant.unit}`}
                type="button"
                disabled={!available}
                onClick={() => handleSizeChange(index)}
                className={`relative rounded-[13px] border p-2.5 text-left transition-all ${
                  !available
                    ? "cursor-not-allowed border-black/[0.04] bg-black/[0.02] opacity-45"
                    : selected
                    ? "border-[#aa8953] bg-[#aa8953]/[0.07] shadow-[0_6px_18px_rgba(170,137,83,0.12)]"
                    : "border-black/[0.08] bg-white hover:border-[#aa8953]/50 hover:shadow-[0_6px_18px_rgba(0,0,0,0.05)]"
                }`}
              >
                {/* Radio + size */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                        selected
                          ? "border-[#aa8953] bg-[#aa8953]"
                          : "border-black/20 bg-white"
                      }`}
                    >
                      {selected && (
                        <span className="h-1.5 w-1.5 rounded-full bg-white" />
                      )}
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-[17px] font-bold leading-none">
                        {decant.size}
                      </span>
                      <span className="text-[9px] font-semibold uppercase text-black/40">
                        {decant.unit}
                      </span>
                    </div>
                  </div>
                  {itemDiscount > 0 && (
                    <span className="rounded-full bg-[#aa8953] px-1.5 py-0.5 text-[6px] font-bold text-white">
                      -{itemDiscount}%
                    </span>
                  )}
                </div>

                {/* Price */}
                <p className="mt-2 text-[11px] font-bold">
                  Rs.&nbsp;{formatPrice(decant.price)}
                </p>
                {itemDiscount > 0 && decant.labelledPrice !== undefined && (
                  <p className="text-[7px] text-black/30 line-through">
                    Rs.&nbsp;{formatPrice(decant.labelledPrice)}
                  </p>
                )}

                {/* Stock indicator */}
                <div className="mt-1 flex items-center gap-1">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      available ? "bg-green-500" : "bg-red-400"
                    }`}
                  />
                  <span
                    className={`text-[7px] font-semibold ${
                      available ? "text-green-700" : "text-red-500"
                    }`}
                  >
                    {available ? `${decant.stock} left` : "Sold out"}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ================================================
          SELECTED PRICE SUMMARY
      ================================================ */}
      {selectedDecant && (
        <div className="mt-2 flex items-center justify-between rounded-[10px] bg-[#aa8953]/[0.06] px-3 py-2">
          <div className="flex items-center gap-2">
            <span className="text-[7px] font-bold tracking-[0.12em] text-[#806537]">
              SELECTED
            </span>
            <span className="text-[10px] font-bold">{selectedSize}</span>
          </div>
          <div className="flex items-center gap-2">
            {discount > 0 && selectedDecant.labelledPrice !== undefined && (
              <span className="text-[8px] text-black/30 line-through">
                Rs.&nbsp;{formatPrice(selectedDecant.labelledPrice)}
              </span>
            )}
            <span className="text-[12px] font-bold text-[#806537]">
              Rs.&nbsp;{formatPrice(selectedPrice)}
            </span>
          </div>
        </div>
      )}

      {/* ================================================
          QUANTITY
      ================================================ */}
      <div className="mt-2.5 flex items-center justify-between rounded-[13px] border border-black/[0.07] bg-white/65 px-3.5 py-2.5">
        <div>
          <p className="text-[8px] font-bold tracking-[0.18em] text-black/55">
            QUANTITY
          </p>
          <p className="mt-0.5 text-[7px] text-black/35">
            Max&nbsp;{selectedStock} available
          </p>
        </div>
        <div className="flex items-center rounded-full border border-black/[0.09] bg-[#f8f6f0]">
          <button
            type="button"
            onClick={decreaseQuantity}
            disabled={!canAddToCart || quantity <= 1}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[17px] text-black/65 transition hover:bg-black/[0.05] disabled:cursor-not-allowed disabled:opacity-30"
            aria-label="Decrease quantity"
          >
            −
          </button>
          <span className="flex h-8 min-w-[34px] items-center justify-center border-x border-black/[0.07] text-[11px] font-bold">
            {quantity}
          </span>
          <button
            type="button"
            onClick={increaseQuantity}
            disabled={!canAddToCart || quantity >= maxQuantity}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[17px] text-black/65 transition hover:bg-black/[0.05] disabled:cursor-not-allowed disabled:opacity-30"
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
      </div>

      {/* ================================================
          ADD TO CART BUTTON
      ================================================ */}
      <div className="mt-3">
        {canAddToCart ? (
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={adding}
            className={`relative h-12 w-full overflow-hidden rounded-full text-[9px] font-bold tracking-[0.18em] transition-all duration-300 ${
              justAdded
                ? "bg-green-700 text-white"
                : "bg-[#171717] text-[#d4a853] hover:bg-[#2a2a2a] active:scale-[0.98]"
            } disabled:cursor-not-allowed disabled:opacity-70`}
          >
            {/* Shimmer effect on hover */}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/[0.07] to-transparent transition-transform duration-700 hover:translate-x-full"
            />
            <span className="relative z-10">
              {justAdded ? "✓ ADDED TO CART" : "ADD TO CART"}
            </span>
          </button>
        ) : (
          <button
            disabled
            type="button"
            className="h-12 w-full cursor-not-allowed rounded-full bg-[#e4e0d7] text-[9px] font-bold tracking-[0.16em] text-[#8b867c]"
          >
            OUT OF STOCK
          </button>
        )}
      </div>
    </div>
  );
}
