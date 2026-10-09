import { NextResponse } from "next/server";
import { clientPromise } from "@/lib/mongodb";

export async function GET() {
  try {
    console.log("[HEALTH] ========== HEALTH CHECK START ==========");
    console.log("[HEALTH] MONGODB_URI env var present:", !!process.env.MONGODB_URI);
    console.log("[HEALTH] MONGODB_URI first 50 chars:", process.env.MONGODB_URI?.substring(0, 50));

    const client = await clientPromise;
    console.log("[HEALTH] ✓ Connected to MongoDB client");

    const adminDb = client.db("admin");
    const pingResult = await adminDb.command({ ping: 1 });
    console.log("[HEALTH] ✓ Ping successful:", pingResult);

    // Get cluster info
    const serverStatus = await adminDb.command({ serverStatus: 1 });
    const clusterInfo = {
      version: serverStatus.version,
      host: serverStatus.host,
    };
    console.log("[HEALTH] Cluster info:", clusterInfo);

    // Try to connect to kyro database
    const kyroDb = client.db("kyro");
    const collections = await kyroDb.listCollections().toArray();
    console.log("[HEALTH] Collections in 'kyro' database:", collections.map(c => c.name));

    // Count documents in each collection
    const stats: Record<string, number> = {};
    for (const collInfo of collections) {
      try {
        const count = await kyroDb.collection(collInfo.name).countDocuments();
        stats[collInfo.name] = count;
        console.log(`[HEALTH] Collection '${collInfo.name}': ${count} documents`);
      } catch (err) {
        console.error(`[HEALTH] Error counting '${collInfo.name}':`, err);
      }
    }

    console.log("[HEALTH] ========== HEALTH CHECK COMPLETE ==========");
    return NextResponse.json(
      {
        status: "ok",
        mongodb: "connected",
        uri: process.env.MONGODB_URI,
        clusterInfo,
        kyro_database: {
          collections: collections.map(c => c.name),
          stats,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[HEALTH] ========== HEALTH CHECK FAILED ==========");
    console.error("[HEALTH] Error:", error);
    return NextResponse.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : String(error),
        uri: process.env.MONGODB_URI?.substring(0, 50),
      },
      { status: 500 }
    );
  }
}
