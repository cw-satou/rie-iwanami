import { cookies } from "next/headers";
import { randomBytes } from "crypto";

// ---------------------------------------------------------------------------
// Admin session store — same KV/memory pattern as lib/auth.ts
// ---------------------------------------------------------------------------

const mem = new Map<string, number>(); // token → expiresAt

function isKVEnabled(): boolean {
  return Boolean(process.env.KV_REST_API_URL);
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

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function adminLogin(
  password: string
): Promise<{ success: boolean; error?: string }> {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    return { success: false, error: "ADMIN_PASSWORD が設定されていません" };
  }
  if (password !== adminPassword) {
    return { success: false, error: "パスワードが正しくありません" };
  }

  const token = generateToken();
  const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24h

  await sessionSet(token, expiresAt);

  const cookieStore = await cookies();
  cookieStore.set("admin_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 24 * 60 * 60,
    path: "/",
  });

  return { success: true };
}

export async function adminLogout(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_session")?.value;
  if (token) await sessionDelete(token);
  cookieStore.set("admin_session", "", { httpOnly: true, maxAge: 0, path: "/" });
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
