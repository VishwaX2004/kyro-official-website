import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { clientPromise } from "@/lib/mongodb";
import { getSession } from "@/lib/auth";

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Please sign in first." }, { status: 401 });
  if (!ObjectId.isValid(session.userId)) return NextResponse.json({ message: "Your session is invalid. Please sign in again." }, { status: 401 });
  try {
    const payload = await request.json();
    const name = typeof payload.name === "string" ? payload.name.trim() : "";
    const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
    const imageUrl = typeof payload.imageUrl === "string" ? payload.imageUrl.trim() : "";
    if (name.length < 2 || !email.includes("@")) return NextResponse.json({ message: "Enter a valid name and email." }, { status: 400 });
    const users = (await clientPromise).db("kyro").collection("users");
    const duplicate = await users.findOne({ email, _id: { $ne: new ObjectId(session.userId) } });
    if (duplicate) return NextResponse.json({ message: "That email is already in use." }, { status: 409 });
    await users.updateOne({ _id: new ObjectId(session.userId) }, { $set: { name, email, imageUrl, updatedAt: new Date() } });
    return NextResponse.json({ message: "Account details saved." });
  } catch (error) {
    console.error("Profile update failed:", error);
    return NextResponse.json({ message: "Unable to save account details." }, { status: 500 });
  }
}
