import { NextRequest } from "next/server";
import { clientPromise } from "@/lib/mongodb";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const q = searchParams.get("q")?.trim() ?? "";
    const limit = Math.min(Number(searchParams.get("limit") ?? 50), 50);

    const client = await clientPromise;
    const db = client.db("kyro");
    const collection = db.collection("products");

    // Build a case-insensitive search filter when ?q= is provided
    const filter = q
      ? {
          $or: [
            { name: { $regex: q, $options: "i" } },
            { brand: { $regex: q, $options: "i" } },
            { description: { $regex: q, $options: "i" } },
            { category: { $regex: q, $options: "i" } },
            { "notes.top": { $elemMatch: { $regex: q, $options: "i" } } },
            { "notes.middle": { $elemMatch: { $regex: q, $options: "i" } } },
            { "notes.base": { $elemMatch: { $regex: q, $options: "i" } } },
          ],
        }
      : {};

    const products = await collection
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();

    const serialized = products.map((product) => ({
      id: product._id.toString(),
      slug: String(product.slug || product._id.toString()),
      name: String(product.name || ""),
      brand: String(product.brand || ""),
      price: Number(product.decants?.[0]?.price ?? 0),
      size: `${product.decants?.[0]?.size ?? 5}${
        product.decants?.[0]?.unit ?? "ml"
      }`,
      notes: [
        ...(product.notes?.top ?? []),
        ...(product.notes?.middle ?? []),
        ...(product.notes?.base ?? []),
      ].join(", "),
      description: String(product.description || ""),
      category: String(product.category || ""),
      concentration:
        product.fragrance?.concentration ?? product.type ?? "",
      gender: String(product.fragrance?.gender || product.category || ""),
      imageUrl: String(product.images?.[0] ?? ""),
      stock:
        (product.decants as Array<{ stock: number }> | undefined)?.reduce(
          (sum, d) => sum + (d.stock ?? 0),
          0
        ) ?? 0,
      featured: Boolean(product.isFeatured),
      shortDescription: String(product.shortDescription || ""),
    }));

    return Response.json({ products: serialized });
  } catch (error) {
    console.error("Failed to fetch products:", error);
    return Response.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}
