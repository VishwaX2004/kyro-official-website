import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth";

export async function POST() {
  const response = NextResponse.json({ message: "Signed out." });
  response.cookies.set(SESSION_COOKIE, "", { httpOnly: true, expires: new Date(0), sameSite: "lax", path: "/" });
  return response;
}
