import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { clientPromise } from "@/lib/mongodb";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ user: null }, { status: 401 });
  if (!ObjectId.isValid(session.userId)) return NextResponse.json({ user: null }, { status: 401 });
  const user = await (await clientPromise).db("kyro").collection("users").findOne(
    { _id: new ObjectId(session.userId) },
    { projection: { passwordHash: 0 } },
  );
  if (!user) return NextResponse.json({ user: null }, { status: 401 });
  return NextResponse.json({ user: { name: user.name ?? user.username, username: user.username, email: user.email, role: user.role ?? "customer", imageUrl: user.imageUrl ?? "" } });
}
