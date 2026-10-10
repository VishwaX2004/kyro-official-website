import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { clientPromise } from "@/lib/mongodb";
import { getSession } from "@/lib/auth";

export type SavedAddress = {
  id?: string;
  name: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  postalCode: string;
  country: string;
};

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Please sign in first." }, { status: 401 });
  if (!ObjectId.isValid(session.userId)) return NextResponse.json({ message: "Your session is invalid. Please sign in again." }, { status: 401 });
  
  try {
    const users = (await clientPromise).db("kyro").collection("users");
    const user = await users.findOne({ _id: new ObjectId(session.userId) });
    
    if (!user) return NextResponse.json({ message: "User not found." }, { status: 404 });
    
    return NextResponse.json({
      name: user.name || "",
      email: user.email || "",
      imageUrl: user.imageUrl || "",
      saved_addresses: user.saved_addresses || [],
    });
  } catch (error) {
    console.error("Profile fetch failed:", error);
    return NextResponse.json({ message: "Unable to fetch profile details." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Please sign in first." }, { status: 401 });
  if (!ObjectId.isValid(session.userId)) return NextResponse.json({ message: "Your session is invalid. Please sign in again." }, { status: 401 });
  try {
    const payload = await request.json();
    const name = typeof payload.name === "string" ? payload.name.trim() : "";
    const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
    const imageUrl = typeof payload.imageUrl === "string" ? payload.imageUrl.trim() : "";
    const saved_addresses = Array.isArray(payload.saved_addresses) ? payload.saved_addresses : [];
    
    if (name && (name.length < 2 || !email.includes("@"))) return NextResponse.json({ message: "Enter a valid name and email." }, { status: 400 });
    
    const users = (await clientPromise).db("kyro").collection("users");
    const duplicate = await users.findOne({ email, _id: { $ne: new ObjectId(session.userId) } });
    if (duplicate && email) return NextResponse.json({ message: "That email is already in use." }, { status: 409 });
    
    const updateData: any = { updatedAt: new Date() };
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (saved_addresses.length > 0) updateData.saved_addresses = saved_addresses;
    
    await users.updateOne({ _id: new ObjectId(session.userId) }, { $set: updateData });
    return NextResponse.json({ message: "Account details saved." });
  } catch (error) {
    console.error("Profile update failed:", error);
    return NextResponse.json({ message: "Unable to save account details." }, { status: 500 });
  }
}
