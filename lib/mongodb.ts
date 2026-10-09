import { MongoClient, MongoClientOptions } from "mongodb";

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error("Missing MONGODB_URI environment variable.");

const options: MongoClientOptions = {
  serverSelectionTimeoutMS: 10000,
  connectTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  maxPoolSize: 10,
  retryWrites: true,
  retryReads: true,
};

// In development, cache the client on globalThis to survive hot-reloads.
// We also store the URI that was used so we can detect if .env.local changed
// and force a fresh connection when it does.
declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
  // eslint-disable-next-line no-var
  var _mongoUri: string | undefined;
}

let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === "production") {
  // In production always create a fresh client — no global cache needed.
  clientPromise = new MongoClient(uri, options).connect();
} else {
  // In development reuse the client, BUT only when the URI hasn't changed.
  if (global._mongoClientPromise && global._mongoUri === uri) {
    clientPromise = global._mongoClientPromise;
  } else {
    // URI changed (or first boot) — close the old client if one exists then
    // create a brand-new connection pointing at the correct cluster.
    if (global._mongoClientPromise && global._mongoUri !== uri) {
      // Fire-and-forget close so we don't block startup.
      global._mongoClientPromise
        .then((old) => old.close())
        .catch(() => {});
    }
    global._mongoUri = uri;
    global._mongoClientPromise = new MongoClient(uri, options).connect();
    clientPromise = global._mongoClientPromise;
  }
}

export { clientPromise };
