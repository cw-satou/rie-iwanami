import { cookies } from "next/headers";
import { randomBytes } from "crypto";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "admin2024";
const SESSION_DURATION = 8 * 60 * 60 * 1000; // 8時間

// member-store.ts と同じ優先順位で保存先を選ぶ
const USE_REDIS = !!process.env.REDIS_URL;
const USE_KV = !USE_REDIS && !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);

// ローカル開発用インメモリフォールバック（Redis/KV がない場合のみ）
const mem = new Map<string, number>(); // token → expiresAt

let redisClient: import("ioredis").Redis | null = null;

async function getRedis(): Promise<import("ioredis").Redis> {
  if (!redisClient) {
    const { default: Redis } = await import("ioredis");
    redisClient = new Redis(process.env.REDIS_URL!, { maxRetriesPerRequest: 3 });
  }
  return redisClient;
}

function generateToken(): string {
  return randomBytes(32).toString("hex");
}

async function sessionSet(token: string, expiresAt: number): Promise<void> {
  const ttl = Math.ceil((expiresAt - Date.now()) / 1000);
  if (USE_REDIS) {
    const redis = await getRedis();
    await redis.set(`admin_session:${token}`, String(expiresAt), "EX", ttl);
  } else if (USE_KV) {
    const { kv } = await import("@vercel/kv");
    await kv.set(`admin_session:${token}`, expiresAt, { ex: ttl });
  } else {
    mem.set(token, expiresAt);
  }
}

async function sessionGet(token: string): Promise<number | null> {
  if (USE_REDIS) {
    const redis = await getRedis();
    const val = await redis.get(`admin_session:${token}`);
    return val ? Number(val) : null;
  }
  if (USE_KV) {
    const { kv } = await import("@vercel/kv");
    return kv.get<number>(`admin_session:${token}`);
  }
  return mem.get(token) ?? null;
}

async function sessionDelete(token: string): Promise<void> {
  if (USE_REDIS) {
    const redis = await getRedis();
    await redis.del(`admin_session:${token}`);
  } else if (USE_KV) {
    const { kv } = await import("@vercel/kv");
    await kv.del(`admin_session:${token}`);
  } else {
    mem.delete(token);
  }
}

export async function adminLogin(password: string): Promise<boolean> {
  if (password !== ADMIN_PASSWORD) return false;

  const token = generateToken();
  const expiresAt = Date.now() + SESSION_DURATION;
  await sessionSet(token, expiresAt);

  const cookieStore = await cookies();
  cookieStore.set("admin_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_DURATION / 1000,
    path: "/",
  });

  return true;
}

export async function getAdminSession(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_session")?.value;
  if (!token) return false;

  const expiresAt = await sessionGet(token);
  if (!expiresAt || expiresAt < Date.now()) {
    await sessionDelete(token);
    return false;
  }

  return true;
}

export async function adminLogout(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_session")?.value;
  if (token) await sessionDelete(token);
  cookieStore.set("admin_session", "", { httpOnly: true, maxAge: 0, path: "/" });
}
