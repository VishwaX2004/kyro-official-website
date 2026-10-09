import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { clientPromise } from "@/lib/mongodb";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { message: "Please sign in to view your orders." },
      { status: 401 }
    );
  }

  try {
    console.log("[ORDERS GET] Fetching orders for user:", session.userId);
    
    const client = await clientPromise;
    console.log("[ORDERS GET] MongoDB client connected");
    
    const db = client.db("kyro");
    console.log("[ORDERS GET] Database 'kyro' selected");
    
    const query =
      session.role === "admin" ? {} : { userId: session.userId };
    console.log("[ORDERS GET] Query:", JSON.stringify(query));

    const orders = await db
      .collection("orders")
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    console.log("[ORDERS GET] Found", orders.length, "orders");
    if (orders.length > 0) {
      console.log("[ORDERS GET] First order:", JSON.stringify(orders[0], null, 2));
    }

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
  console.log("[ORDER POST] ========== ORDER POST START ==========");
  
  const session = await getSession();
  console.log("[ORDER POST] Session object:", JSON.stringify(session, null, 2));
  
  if (!session) {
    console.error("[ORDER POST] NO SESSION - returning 401");
    return NextResponse.json(
      { message: "Please sign in to place an order." },
      { status: 401 }
    );
  }

  try {
    console.log("[ORDER POST] Session userId:", session.userId);
    console.log("[ORDER POST] Session username:", session.username);
    console.log("[ORDER POST] Session role:", session.role);

    const body = (await request.json()) as {
      items: {
        productId: string;
        name: string;
        price: number;
        quantity: number;
        size?: string;
        imageUrl?: string;
      }[];
      shipping: {
        name: string;
        email: string;
        phone: string;
        address: string;
        city: string;
        postalCode: string;
      };
    };

    const { items, shipping } = body;
    console.log("[ORDER POST] Items count:", items?.length);
    console.log("[ORDER POST] First item:", items?.[0]);
    console.log("[ORDER POST] Shipping name:", shipping?.name);

    if (!Array.isArray(items) || items.length === 0) {
      console.warn("[ORDER POST] Empty items array - returning 400");
      return NextResponse.json(
        { message: "Your cart is empty." },
        { status: 400 }
      );
    }

    const total = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    console.log("[ORDER POST] Total calculated:", total);

    let client;
    try {
      console.log("[ORDER POST] Connecting to MongoDB...");
      client = await clientPromise;
      console.log("[ORDER POST] ✓ MongoDB client promise resolved");
      
      const adminDb = client.db("admin");
      console.log("[ORDER POST] Testing connection with admin.ping...");
      const pingResult = await adminDb.command({ ping: 1 });
      console.log("[ORDER POST] ✓ Ping successful:", pingResult);
    } catch (connError) {
      console.error("[ORDER POST] ✗ MongoDB connection error:", connError);
      throw connError;
    }

    const db = client.db("kyro");
    console.log("[ORDER POST] ✓ Selected database 'kyro'");

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
    console.log(`[ORDER POST] Generated order ID: ${displayOrderId}`);

    const orderData = {
      userId: session.userId,
      customerName: session.username,
      items,
      shipping,
      total,
      status: "pending",
      displayOrderId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    console.log("[ORDER POST] Order data prepared:", JSON.stringify(orderData, null, 2));

    let result;
    try {
      console.log("[ORDER POST] Calling insertOne on 'orders' collection...");
      result = await db.collection("orders").insertOne(orderData);
      console.log("[ORDER POST] ✓ insertOne returned");
      console.log("[ORDER POST] Result:", {
        insertedId: result.insertedId?.toString(),
        acknowledged: result.acknowledged,
      });
    } catch (insertError) {
      console.error("[ORDER POST] ✗ insertOne failed:", insertError);
      throw insertError;
    }

    if (!result.insertedId) {
      console.error("[ORDER POST] ✗ No insertedId in result!");
      throw new Error("Order was not inserted into database");
    }

    console.log("[ORDER POST] ✓ Order inserted with ID:", result.insertedId.toString());

    // Verify the insert by reading it back
    try {
      console.log("[ORDER POST] Verifying insert by reading back...");
      const verifyRead = await db.collection("orders").findOne({ _id: result.insertedId });
      console.log("[ORDER POST] ✓ Verification read successful:", verifyRead ? "FOUND" : "NOT FOUND");
    } catch (verifyError) {
      console.error("[ORDER POST] Warning: Verification read failed:", verifyError);
    }

    // Decrement stock for the ordered decant size
    for (const item of items) {
      if (ObjectId.isValid(item.productId) && item.size) {
        const sizeNum = parseFloat(item.size);
        try {
          console.log(`[ORDER POST] Decrementing stock for product ${item.productId}, size ${sizeNum}...`);
          const updateResult = await db.collection("products").updateOne(
            { _id: new ObjectId(item.productId) },
            { $inc: { "decants.$[elem].stock": -item.quantity } },
            { arrayFilters: [{ "elem.size": sizeNum }] }
          );
          console.log(`[ORDER POST] ✓ Stock update - matched: ${updateResult.matchedCount}, modified: ${updateResult.modifiedCount}`);
        } catch (stockError) {
          console.error(`[ORDER POST] ✗ Stock decrement failed for ${item.productId}:`, stockError);
        }
      }
    }

    console.log("[ORDER POST] ========== ORDER POST SUCCESS ==========");
    return NextResponse.json(
      {
        message: "Order placed successfully.",
        orderId: displayOrderId,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[ORDER POST] ========== ORDER POST FAILED ==========");
    console.error("[ORDER POST] Error message:", error instanceof Error ? error.message : String(error));
    console.error("[ORDER POST] Error stack:", error instanceof Error ? error.stack : "No stack trace");
    console.error("[ORDER POST] Full error object:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
    
    return NextResponse.json(
      { message: "Unable to place your order." },
      { status: 500 }
    );
  }
}
