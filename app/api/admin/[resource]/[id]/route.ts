import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { clientPromise } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/auth";

const allowed = new Set(["users", "products", "orders"]);
async function getCollection(resource: string) {
  if (!allowed.has(resource)) throw new Error("Unsupported admin resource.");
  return (await clientPromise).db("kyro").collection(resource);
}

export async function PATCH(request: Request, { params }: { params: Promise<{ resource: string; id: string }> }) {
  try {
    if (!(await requireAdmin())) return NextResponse.json({ message: "Admin authentication required." }, { status: 401 });
    const { resource, id } = await params;
    if (!ObjectId.isValid(id)) return NextResponse.json({ message: "Invalid record id." }, { status: 400 });
    const collection = await getCollection(resource);
    const payload = await request.json();
    const result = await collection.updateOne({ _id: new ObjectId(id) }, { $set: { ...payload, updatedAt: new Date() } });
    if (!result.matchedCount) return NextResponse.json({ message: "Record not found." }, { status: 404 });
    return NextResponse.json({ message: "Updated." });
  } catch (error) {
    console.error("Admin collection update failed:", error);
    return NextResponse.json({ message: "Unable to update this record." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ resource: string; id: string }> }) {
  try {
    if (!(await requireAdmin())) return NextResponse.json({ message: "Admin authentication required." }, { status: 401 });
    const { resource, id } = await params;
    if (!ObjectId.isValid(id)) return NextResponse.json({ message: "Invalid record id." }, { status: 400 });
    const result = await (await getCollection(resource)).deleteOne({ _id: new ObjectId(id) });
    if (!result.deletedCount) return NextResponse.json({ message: "Record not found." }, { status: 404 });
    return NextResponse.json({ message: "Deleted." });
  } catch (error) {
    console.error("Admin collection delete failed:", error);
    return NextResponse.json({ message: "Unable to delete this record." }, { status: 500 });
  }
}
