import Image from "next/image";
import Link from "next/link";
import AddToCartButton from "@/app/(store)/shop/AddToCartButton";

export type ProductCardProduct = {
  id: string;
  name: string;
  brand: string;
  price: number;
  size: string;
  notes: string;
  category: string;
  concentration: string;
  imageUrl: string;
  stock: number;
  featured: boolean;
  shortDescription: string;
};

type ProductCardProps = {
  product: ProductCardProduct;
  index?: number;
  animation?: boolean;
};

const formatPrice = (price: number) =>
  new Intl.NumberFormat("en-LK", { maximumFractionDigits: 0 }).format(price);

export default function ProductCard({
  product,
  index = 0,
  animation = true,
}: ProductCardProps) {
  const inStock = product.stock > 0;

  return (
    <article
      className={[
        "kp-card group relative flex flex-col overflow-hidden rounded-[22px]",
        "border border-black/[0.06] bg-white/70",
        "transition-all duration-500",
        "hover:-translate-y-2 hover:border-[#aa8953]/40 hover:bg-white",
        "hover:shadow-[0_30px_70px_rgba(30,25,18,.12)]",
        animation ? "kp-card-animated" : "",
      ].join(" ")}
      style={animation ? { animationDelay: `${index * 90}ms` } : undefined}
    >
      {/* ── Image — wrapped in Link ────────────────────────── */}
      <Link href={`/product/${product.id}`} className="block">
        <div className="relative h-[200px] overflow-hidden bg-[radial-gradient(circle_at_50%_45%,#fff_0%,#f4f0e8_55%,#e9e3d7_100%)] sm:h-[250px]">
        {product.featured && (
          <span className="absolute left-3 top-3 z-10 rounded-full border border-black/5 bg-white/90 px-3 py-1.5 text-[8px] font-bold tracking-[.12em] backdrop-blur">
            FEATURED
          </span>
        )}

        <span
          className={`absolute right-3 top-3 z-10 rounded-full px-3 py-1.5 text-[8px] font-semibold tracking-[.05em] text-white backdrop-blur ${
            inStock ? "bg-[#171717]/85" : "bg-[#6e685e]/90"
          }`}
        >
          {inStock ? `${product.stock} available` : "Out of stock"}
        </span>

        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.07]"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center font-serif text-5xl text-black/20">
            ◇
          </div>
        )}

        {/* shine sweep on hover */}
        <div className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-[900ms] group-hover:translate-x-full" />
      </div>
      </Link>

      {/* ── Content ───────────────────────────────────────── */}
      <div className="flex flex-1 flex-col p-5">
        <p className="truncate text-[8px] font-bold tracking-[.18em] text-[#806537]">
          {(product.brand || "Kyro Parfums").toUpperCase()}
        </p>

        <div className="mt-1.5 flex items-start justify-between gap-3">
          <Link href={`/product/${product.id}`} className="hover:text-[#806537] transition-colors duration-200">
            <h3 className="line-clamp-2 min-h-[2.5em] text-[15px] font-semibold leading-tight tracking-[-.02em]">
              {product.name}
            </h3>
          </Link>
          <span className="shrink-0 text-[13px] font-extrabold">
            Rs. {formatPrice(product.price)}
          </span>
        </div>

        <p className="mt-2 truncate text-[10px] text-black/45">
          {[product.size, product.concentration, product.category]
            .filter(Boolean)
            .join("  ·  ")}
        </p>

        <p className="mt-3 line-clamp-2 min-h-[2.9em] font-serif text-[12px] italic leading-relaxed text-black/50">
          {product.notes ||
            product.shortDescription ||
            "A carefully selected fragrance from the Kyro collection."}
        </p>

        {/* ── Add to cart ─────────────────────────────────── */}
        <div className="kp-action mt-auto pt-4">
          {inStock ? (
            <AddToCartButton
              product={{
                id: product.id,
                name: product.name,
                price: product.price,
                imageUrl: product.imageUrl,
                size: product.size,
              }}
            />
          ) : (
            <button
              type="button"
              disabled
              className="h-11 w-full cursor-not-allowed rounded-full border border-black/5 bg-[#e7e3da] text-[10px] font-bold text-[#8b867c]"
            >
              Out of Stock
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
