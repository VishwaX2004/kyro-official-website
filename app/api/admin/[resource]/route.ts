import { NextResponse } from "next/server";
import { clientPromise } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/auth";

const allowed = new Set(["users", "products", "orders"]);

function collectionName(resource: string) {
  if (!allowed.has(resource)) throw new Error("Unsupported admin resource.");
  return resource;
}

export async function GET(_request: Request, { params }: { params: Promise<{ resource: string }> }) {
  try {
    if (!(await requireAdmin())) return NextResponse.json({ message: "Admin authentication required." }, { status: 401 });
    const { resource } = await params;
    const records = await (await clientPromise).db("kyro").collection(collectionName(resource)).find({}, { projection: { passwordHash: 0 } }).sort({ createdAt: -1 }).toArray();
    return NextResponse.json({ records });
  } catch (error) {
    console.error("Admin collection read failed:", error);
    return NextResponse.json({ message: "Unable to load this collection." }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ resource: string }> }) {
  try {
    if (!(await requireAdmin())) return NextResponse.json({ message: "Admin authentication required." }, { status: 401 });
    const { resource } = await params;
    const payload = await request.json();
    const clean = Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== ""));
    if (resource === "users" && (!clean.name || !clean.email)) return NextResponse.json({ message: "Name and email are required." }, { status: 400 });
    if (resource === "products" && (!clean.name || !clean.decants || !Array.isArray(clean.decants) || clean.decants.length === 0)) return NextResponse.json({ message: "Name and at least one decant size are required." }, { status: 400 });
    const result = await (await clientPromise).db("kyro").collection(collectionName(resource)).insertOne({ ...clean, createdAt: new Date() });
    return NextResponse.json({ id: result.insertedId }, { status: 201 });
  } catch (error) {
    console.error("Admin collection create failed:", error);
    return NextResponse.json({ message: "Unable to create this record." }, { status: 500 });
  }
}
