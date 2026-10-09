import { createHmac, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { clientPromise } from "@/lib/mongodb";

export const SESSION_COOKIE = "kyro_session";
const sessionSecret = process.env.AUTH_SECRET ?? "";
if (!sessionSecret) throw new Error("Missing AUTH_SECRET environment variable.");

export type Session = { userId: string; username: string; role: string; expiresAt: number };

export const hashPassword = (password: string) => new Promise<string>((resolve, reject) => {
  const salt = randomBytes(16).toString("hex");
  scrypt(password, salt, 64, (error: Error | null, derivedKey: Buffer) => error ? reject(error) : resolve(`${salt}:${derivedKey.toString("hex")}`));
});

export const verifyPassword = (password: string, storedHash: string) => new Promise<boolean>((resolve, reject) => {
  const [salt, key] = storedHash.split(":");
  if (!salt || !key) return resolve(false);
  scrypt(password, salt, 64, (error: Error | null, derivedKey: Buffer) => {
    if (error) return reject(error);
    const expected = Buffer.from(key, "hex");
    resolve(expected.length === derivedKey.length && timingSafeEqual(expected, derivedKey));
  });
});

function sign(value: string) {
  return createHmac("sha256", sessionSecret).update(value).digest("base64url");
}

export function createSession(session: Omit<Session, "expiresAt">) {
  const payload = Buffer.from(JSON.stringify({ ...session, expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 7 })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function verifySession(token: string | undefined): Session | null {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  const expectedSignature = Buffer.from(sign(payload ?? ""));
  const receivedSignature = Buffer.from(signature ?? "");
  if (!payload || !signature || receivedSignature.length !== expectedSignature.length || !timingSafeEqual(receivedSignature, expectedSignature)) return null;
  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString()) as Session;
    return session.expiresAt > Date.now() ? session : null;
  } catch {
    return null;
  }
}

export async function getSession() {
  return verifySession((await cookies()).get(SESSION_COOKIE)?.value);
}

export async function requireAdmin() {
  const session = await getSession();
  return session?.role === "admin" ? session : null;
}

export async function ensureAdminUser() {
  const users = (await clientPromise).db("kyro").collection("users");
  const existing = await users.findOne({ username: "admin" });
  if (existing) return existing;
  const passwordHash = await hashPassword(process.env.ADMIN_PASSWORD ?? "adminpwd");
  const result = await users.insertOne({
    username: "admin",
    name: "Kyro Admin",
    email: "admin@kyroparfums.com",
    role: "admin",
    passwordHash,
    createdAt: new Date(),
  });
  return { _id: result.insertedId, username: "admin", role: "admin", name: "Kyro Admin", email: "admin@kyroparfums.com", passwordHash };
}
