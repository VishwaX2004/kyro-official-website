import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { clientPromise } from "@/lib/mongodb";
import { getSession, hashPassword, verifyPassword } from "@/lib/auth";

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Please sign in first." }, { status: 401 });
  if (!ObjectId.isValid(session.userId)) return NextResponse.json({ message: "Your session is invalid. Please sign in again." }, { status: 401 });
  try {
    const { currentPassword, newPassword } = await request.json();
    if (typeof currentPassword !== "string" || typeof newPassword !== "string" || newPassword.length < 8) return NextResponse.json({ message: "Use a new password of at least 8 characters." }, { status: 400 });
    const users = (await clientPromise).db("kyro").collection("users");
    const user = await users.findOne({ _id: new ObjectId(session.userId) });
    if (!user || typeof user.passwordHash !== "string" || !(await verifyPassword(currentPassword, user.passwordHash))) return NextResponse.json({ message: "Your current password is incorrect." }, { status: 401 });
    await users.updateOne({ _id: user._id }, { $set: { passwordHash: await hashPassword(newPassword), updatedAt: new Date() } });
    return NextResponse.json({ message: "Password changed securely." });
  } catch (error) {
    console.error("Password update failed:", error);
    return NextResponse.json({ message: "Unable to change your password." }, { status: 500 });
  }
}
