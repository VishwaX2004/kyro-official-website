import { ObjectId } from "mongodb";
import { NextResponse, after } from "next/server";
import { clientPromise } from "@/lib/mongodb";
import { getSession } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { message: "Please sign in to view your orders." },
      { status: 401 }
    );
  }

  try {
    const client = await clientPromise;
    const db = client.db("kyro");
    const query =
      session.role === "admin" ? {} : { userId: session.userId };

    const orders = await db
      .collection("orders")
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    // Serialize ObjectId and Date fields so JSON.stringify works
    const serialized = orders.map((order) => ({
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
    }));

    return NextResponse.json({ orders: serialized });
  } catch (error) {
    console.error("[ORDERS GET] Orders fetch failed:", error);
    return NextResponse.json(
      { message: "Unable to load your orders." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      { message: "Please sign in to place an order." },
      { status: 401 }
    );
  }

  try {
    // Parse request body
    const body = (await request.json()) as {
      items: {
        productId: string;
        name: string;
        price: number;
        quantity: number;
        size?: string;
        imageUrl?: string;
      }[];
      delivery_address?: {
        name: string;
        email: string;
        phone: string;
        street: string;
        city: string;
        postalCode: string;
        country: string;
      };
      shipping?: {
        name: string;
        email: string;
        phone: string;
        address: string;
        city: string;
        postalCode: string;
      };
      payment_slip_url?: string;
      payment_slip_filename?: string;
    };

    const { items, shipping, delivery_address, payment_slip_url, payment_slip_filename } = body;

    // Validate items array
    if (!Array.isArray(items) || items.length === 0 || items.length > 20) {
      return NextResponse.json(
        { message: "Cart must contain 1-20 items." },
        { status: 400 }
      );
    }

    // Validate each item
    for (const item of items) {
      if (
        typeof item.productId !== "string" ||
        typeof item.name !== "string" ||
        typeof item.price !== "number" ||
        typeof item.quantity !== "number"
      ) {
        return NextResponse.json(
          { message: "Invalid item format." },
          { status: 400 }
        );
      }

      if (item.price <= 0) {
        return NextResponse.json(
          { message: "Item prices must be greater than 0." },
          { status: 400 }
        );
      }

      if (!Number.isInteger(item.quantity) || item.quantity < 1) {
        return NextResponse.json(
          { message: "Item quantities must be positive integers." },
          { status: 400 }
        );
      }
    }

    // Trim and validate delivery address fields
    if (delivery_address) {
      const requiredFields = [
        "name",
        "email",
        "phone",
        "street",
        "city",
        "postalCode",
        "country",
      ];
      for (const field of requiredFields) {
        const value = delivery_address[field as keyof typeof delivery_address];
        if (!value || typeof value !== "string" || value.trim().length === 0) {
          return NextResponse.json(
            { message: `Delivery address field '${field}' is required.` },
            { status: 400 }
          );
        }
        // Trim the field value and update it
        delivery_address[field as keyof typeof delivery_address] = value.trim();
      }
    }

    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db("kyro");

    // Generate order ID in format MM-DD-ID001
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const datePrefix = `${month}-${day}`;

    // Count orders created today to get sequential number
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    const todayOrderCount = await db
      .collection("orders")
      .countDocuments({
        createdAt: {
          $gte: startOfDay,
          $lte: endOfDay,
        },
      });

    const sequenceNum = String(todayOrderCount + 1).padStart(3, "0");
    const displayOrderId = `${datePrefix}-ID${sequenceNum}`;

    // Prepare order data
    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const orderData = {
      userId: session.userId,
      customerName: session.username,
      items,
      shipping,
      delivery_address,
      payment_slip_url,
      payment_slip_filename,
      total,
      status: "pending_payment_verification",
      displayOrderId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Insert order into database
    const result = await db.collection("orders").insertOne(orderData);

    if (!result.insertedId) {
      console.error("[ORDER POST] No insertedId returned from insertOne");
      throw new Error("Order insertion failed");
    }

    // Rate limiting: check AFTER successful insert to ensure order was created
    const rateLimitResult = checkRateLimit(session.userId, 3, 60000);
    if (!rateLimitResult.allowed) {
      // Log warning but don't fail the response—the order is already inserted
      console.error("[ORDER POST] Rate limit exceeded after successful insert");
    }

    // Return 201 immediately; background tasks execute after response is sent
    const response = NextResponse.json(
      {
        message: "Order placed successfully.",
        orderId: displayOrderId,
      },
      { status: 201 }
    );

    // Background tasks: send emails and decrement stock
    after(async () => {
      try {
        // Send confirmation emails
        const customerEmail =
          delivery_address?.email || shipping?.email || session.username;

        try {
          await fetch(
            `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/orders/send-email`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                order: {
                  displayOrderId,
                  createdAt: new Date().toISOString(),
                  items,
                  delivery_address: delivery_address || shipping,
                  total,
                  payment_slip_url,
                  payment_slip_filename,
                },
                customerEmail,
              }),
              signal: AbortSignal.timeout(5000), // 5 second timeout
            }
          );
        } catch (emailError) {
          console.error(
            "[ORDER BACKGROUND] Email sending failed:",
            emailError
          );
        }

        // Decrement stock for the ordered decant sizes
        for (const item of items) {
          if (ObjectId.isValid(item.productId) && item.size) {
            const sizeNum = parseFloat(item.size);
            try {
              await db.collection("products").updateOne(
                { _id: new ObjectId(item.productId) },
                { $inc: { "decants.$[elem].stock": -item.quantity } },
                { arrayFilters: [{ "elem.size": sizeNum }] }
              );
            } catch (stockError) {
              console.error(
                `[ORDER BACKGROUND] Stock decrement failed for ${item.productId}:`,
                stockError
              );
            }
          }
        }
      } catch (err) {
        console.error("[ORDER BACKGROUND] Background task failed:", err);
      }
    });

    return response;
  } catch (error) {
    console.error(
      "[ORDER POST] Error:",
      error instanceof Error ? error.message : String(error)
    );

    return NextResponse.json(
      { message: "Unable to place your order." },
      { status: 500 }
    );
  }
}
