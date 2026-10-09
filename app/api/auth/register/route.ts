import { NextResponse } from "next/server";
import { clientPromise } from "@/lib/mongodb";
import { hashPassword, createSession, SESSION_COOKIE } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();
    if (typeof name !== "string" || name.trim().length < 2 || typeof email !== "string" || typeof password !== "string" || password.length < 8) {
      return NextResponse.json({ message: "Please provide a name, valid email, and password of at least 8 characters." }, { status: 400 });
    }
    const normalizedEmail = email.trim().toLowerCase();
    const users = (await clientPromise).db("kyro").collection("users");
    if (await users.findOne({ email: normalizedEmail })) return NextResponse.json({ message: "An account with that email already exists." }, { status: 409 });
    const result = await users.insertOne({ name: name.trim(), email: normalizedEmail, username: normalizedEmail.split("@")[0], role: "customer", passwordHash: await hashPassword(password), createdAt: new Date() });
    const response = NextResponse.json({ message: "Account created.", role: "customer" }, { status: 201 });
    response.cookies.set(SESSION_COOKIE, createSession({ userId: result.insertedId.toString(), username: normalizedEmail, role: "customer" }), {
      httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7,
    });
    return response;
  } catch (error) {
    console.error("Registration failed:", error);
    return NextResponse.json({ message: "We could not create your account right now." }, { status: 500 });
  }
}
