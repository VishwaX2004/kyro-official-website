import { NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { clientPromise } from "@/lib/mongodb";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return Response.json({ error: "Invalid product ID" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("kyro");
    const product = await db
      .collection("products")
      .findOne({ _id: new ObjectId(id) });

    if (!product) {
      return Response.json({ error: "Product not found" }, { status: 404 });
    }

    const serialized = {
      id: product._id.toString(),
      slug: String(product.slug || product._id.toString()),
      name: String(product.name || ""),
      brand: String(product.brand || ""),
      description: String(product.description || ""),
      shortDescription: String(product.shortDescription || ""),
      category: String(product.category || ""),
      type: String(product.type || ""),
      images: (product.images as string[] | undefined) ?? [],
      decants: (
        product.decants as Array<{
          size: number;
          unit: string;
          labelledPrice?: number;
          price: number;
          stock: number;
        }>
      ) ?? [],
      notes: {
        top: (product.notes?.top as string[]) ?? [],
        middle: (product.notes?.middle as string[]) ?? [],
        base: (product.notes?.base as string[]) ?? [],
      },
      fragrance: {
        gender: String(product.fragrance?.gender || product.category || ""),
        concentration: String(
          product.fragrance?.concentration || product.type || ""
        ),
        season: (product.fragrance?.season as string[]) ?? [],
        occasion: (product.fragrance?.occasion as string[]) ?? [],
        longevity: String(product.fragrance?.longevity || ""),
        sillage: String(product.fragrance?.sillage || ""),
      },
      isFeatured: Boolean(product.isFeatured),
      isBestSeller: Boolean(product.isBestSeller),
    };

    return Response.json({ product: serialized });
  } catch (error) {
    console.error("Failed to fetch product:", error);
    return Response.json({ error: "Failed to fetch product" }, { status: 500 });
  }
}
