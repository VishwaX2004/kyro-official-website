import { NextResponse } from "next/server";
import { clientPromise } from "@/lib/mongodb";
import { createSession, hashPassword, SESSION_COOKIE } from "@/lib/auth";
import { randomBytes } from "node:crypto";

export async function POST(request: Request) {
  try {
    const { accessToken } = (await request.json()) as { accessToken?: string };

    if (!accessToken || typeof accessToken !== "string") {
      return NextResponse.json(
        { message: "Access token is required." },
        { status: 400 }
      );
    }

    // Fetch user info from Google using the access token
    const userInfoRes = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!userInfoRes.ok) {
      return NextResponse.json(
        { message: "Failed to fetch user info from Google." },
        { status: 401 }
      );
    }

    const googleUser = (await userInfoRes.json()) as {
      id?: string;
      email?: string;
      name?: string;
      picture?: string;
    };

    if (!googleUser.id || !googleUser.email) {
      return NextResponse.json(
        { message: "Invalid Google account — missing email or ID." },
        { status: 401 }
      );
    }

    // Upsert user in MongoDB
    const client = await clientPromise;
    const usersCol = client.db("kyro").collection("users");

    let user = await usersCol.findOne({
      $or: [{ googleId: googleUser.id }, { email: googleUser.email }],
    });

    if (!user) {
      // New user — create account
      const newUser = {
        googleId: googleUser.id,
        email: googleUser.email,
        name: googleUser.name ?? googleUser.email.split("@")[0],
        username: googleUser.email.split("@")[0],
        role: "customer",
        picture: googleUser.picture ?? null,
        passwordHash: await hashPassword(randomBytes(16).toString("hex")),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const result = await usersCol.insertOne(newUser);
      user = { _id: result.insertedId, ...newUser };
    } else if (!user.googleId) {
      // Existing email account — link Google ID
      await usersCol.updateOne(
        { _id: user._id },
        {
          $set: {
            googleId: googleUser.id,
            picture: googleUser.picture ?? user.picture,
            updatedAt: new Date(),
          },
        }
      );
      user.googleId = googleUser.id;
    }

    // Create signed session token
    const sessionToken = createSession({
      userId: user._id.toString(),
      username: user.username ?? user.email,
      role: user.role ?? "customer",
    });

    const response = NextResponse.json({
      message: "Signed in with Google.",
      role: user.role ?? "customer",
    });

    response.cookies.set(SESSION_COOKIE, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error("[GOOGLE CALLBACK]", error);
    return NextResponse.json(
      { message: "Google sign-in failed. Please try again." },
      { status: 500 }
    );
  }
}
