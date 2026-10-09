import { NextResponse } from "next/server";
import { clientPromise } from "@/lib/mongodb";
import { createSession, ensureAdminUser, SESSION_COOKIE, verifyPassword } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { identifier, email, password } = await request.json();
    const loginIdentifier = typeof identifier === "string" ? identifier.trim().toLowerCase() : typeof email === "string" ? email.trim().toLowerCase() : "";
    if (!loginIdentifier || typeof password !== "string" || !password) return NextResponse.json({ message: "Enter your username or email and password." }, { status: 400 });
    await ensureAdminUser();
    const users = (await clientPromise).db("kyro").collection("users");
    const user = await users.findOne({ $or: [{ email: loginIdentifier }, { username: loginIdentifier }] });
    if (!user || typeof user.passwordHash !== "string" || !(await verifyPassword(password, user.passwordHash))) return NextResponse.json({ message: "Email or password is incorrect." }, { status: 401 });
    const response = NextResponse.json({ message: "Signed in.", role: user.role ?? "customer" });
    response.cookies.set(SESSION_COOKIE, createSession({ userId: user._id.toString(), username: String(user.username ?? user.email), role: String(user.role ?? "customer") }), {
      httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7,
    });
    return response;
  } catch (error) {
    console.error("Login failed:", error);
    return NextResponse.json({ message: "We could not sign you in right now." }, { status: 500 });
  }
}
