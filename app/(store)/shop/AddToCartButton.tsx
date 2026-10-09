"use client";

import { readCart, saveCart } from "@/lib/cart";
import { useState } from "react";
import toast from "react-hot-toast";

type ProductProps = {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
  size?: string;
};

export default function AddToCartButton({ product }: { product: ProductProps }) {
  const [added, setAdded] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  function handleAdd() {
    if (isAdding) return;

    setIsAdding(true);
    try {
      const cart = readCart();
      const existing = cart.find(item => item.productId === product.id);
      if (existing) {
        existing.quantity += 1;
      } else {
        cart.push({
          productId: product.id,
          name: product.name,
          price: product.price,
          imageUrl: product.imageUrl,
          size: product.size || "5ml",
          quantity: 1,
        });
      }
      saveCart(cart);

      setAdded(true);
      toast.success(`${product.name} added to cart.`);
      setTimeout(() => {
        setAdded(false);
        setIsAdding(false);
      }, 2000);
    } catch {
      toast.error("Could not add to cart. Please try again.");
      setIsAdding(false);
    }
  }

  return (
    <button
      onClick={handleAdd}
      disabled={isAdding}
      className="submit-button"
      style={{
        width: "100%",
        padding: "14px",
        border: "none",
        borderRadius: "8px",
        fontWeight: "bold",
        cursor: isAdding ? "not-allowed" : "pointer",
        opacity: isAdding ? 0.6 : 1,
        transition: "all 0.2s ease"
      }}
    >
      {isAdding ? "Adding..." : added ? "Added!" : "Add to Cart"}
    </button>
  );
}
