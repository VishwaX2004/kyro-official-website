import { NextResponse } from "next/server";
import { clientPromise } from "@/lib/mongodb";

export async function POST(request: Request) {
  try {
    const { name, email, subject, message } = (await request.json()) as {
      name: string;
      email: string;
      subject: string;
      message: string;
    };

    if (
      typeof name !== "string" ||
      name.trim().length < 2 ||
      typeof email !== "string" ||
      !email.includes("@") ||
      typeof message !== "string" ||
      message.trim().length < 5
    ) {
      return NextResponse.json(
        { message: "Please fill in all required fields." },
        { status: 400 }
      );
    }

    const db = (await clientPromise).db("kyro");
    await db.collection("contacts").insertOne({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      subject: typeof subject === "string" ? subject.trim() : "",
      message: message.trim(),
      createdAt: new Date(),
    });

    return NextResponse.json({
      message: "Message received. We'll get back to you within 24 hours.",
    });
  } catch (error) {
    console.error("Contact form submission failed:", error);
    return NextResponse.json(
      {
        message:
          "Unable to send your message right now. Please try again.",
      },
      { status: 500 }
    );
  }
}
