import { cookies } from "next/headers";
import { randomBytes } from "crypto";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "admin2024";
const SESSION_DURATION = 8 * 60 * 60 * 1000; // 8時間

// KV未使用時のインメモリフォールバック
const mem = new Map<string, number>(); // token → expiresAt

function isKVEnabled(): boolean {
  return Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

function generateToken(): string {
  return randomBytes(32).toString("hex");
}

async function sessionSet(token: string, expiresAt: number): Promise<void> {
  const ttl = Math.ceil((expiresAt - Date.now()) / 1000);
  if (isKVEnabled()) {
    const { kv } = await import("@vercel/kv");
    await kv.set(`admin_session:${token}`, expiresAt, { ex: ttl });
  } else {
    mem.set(token, expiresAt);
  }
}

async function sessionGet(token: string): Promise<number | null> {
  if (isKVEnabled()) {
    const { kv } = await import("@vercel/kv");
    return kv.get<number>(`admin_session:${token}`);
  }
  return mem.get(token) ?? null;
}

async function sessionDelete(token: string): Promise<void> {
  if (isKVEnabled()) {
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
