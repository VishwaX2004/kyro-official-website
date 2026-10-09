import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { clientPromise } from "@/lib/mongodb";
import { getSession } from "@/lib/auth";

type RouteContext = { params: Promise<{ id: string }> };

const VALID_STATUSES = [
  "pending",
  "processing",
  "paid",
  "shipped",
  "delivered",
  "completed",
  "cancelled",
] as const;

export async function GET(
  _request: Request,
  { params }: RouteContext
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { message: "Please sign in to view this order." },
      { status: 401 }
    );
  }

  const { id } = await params;
  if (!ObjectId.isValid(id)) {
    return NextResponse.json(
      { message: "Invalid order id." },
      { status: 400 }
    );
  }

  try {
    const db = (await clientPromise).db("kyro");
    const order = await db
      .collection("orders")
      .findOne({ _id: new ObjectId(id) });

    if (!order) {
      return NextResponse.json(
        { message: "Order not found." },
        { status: 404 }
      );
    }

    // Non-admins can only see their own orders
    if (session.role !== "admin" && order.userId !== session.userId) {
      return NextResponse.json(
        { message: "Not authorised." },
        { status: 403 }
      );
    }

    return NextResponse.json({
      order: {
        ...order,
        _id: order._id.toString(),
        createdAt:
          order.createdAt instanceof Date
            ? order.createdAt.toISOString()
            : String(order.createdAt ?? ""),
        updatedAt:
          order.updatedAt instanceof Date
            ? order.updatedAt.toISOString()
            : order.updatedAt
            ? String(order.updatedAt)
            : undefined,
      },
    });
  } catch (error) {
    console.error("Order fetch failed:", error);
    return NextResponse.json(
      { message: "Unable to load this order." },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: RouteContext
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { message: "Please sign in." },
      { status: 401 }
    );
  }

  const { id } = await params;
  if (!ObjectId.isValid(id)) {
    return NextResponse.json(
      { message: "Invalid order id." },
      { status: 400 }
    );
  }

  try {
    const db = (await clientPromise).db("kyro");
    const body = (await request.json()) as { status?: string };

    // Only admins can change status; customers cannot modify their own orders
    if (session.role !== "admin") {
      return NextResponse.json(
        { message: "Admin access required to update orders." },
        { status: 403 }
      );
    }

    const newStatus = body.status?.toLowerCase().trim();
    if (!newStatus || !VALID_STATUSES.includes(newStatus as typeof VALID_STATUSES[number])) {
      return NextResponse.json(
        {
          message: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}.`,
        },
        { status: 400 }
      );
    }

    const result = await db.collection("orders").updateOne(
      { _id: new ObjectId(id) },
      { $set: { status: newStatus, updatedAt: new Date() } }
    );

    if (!result.matchedCount) {
      return NextResponse.json(
        { message: "Order not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Order status updated." });
  } catch (error) {
    console.error("Order update failed:", error);
    return NextResponse.json(
      { message: "Unable to update this order." },
      { status: 500 }
    );
  }
}
