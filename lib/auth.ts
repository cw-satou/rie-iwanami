import { cookies } from "next/headers";
import { MemberSession } from "./types";

// Member credentials are read from the FC_MEMBERS environment variable.
// Format (JSON string): FC_MEMBERS={"FC001":"password1","FC002":"password2"}
// Falls back to demo credentials when the variable is not set (local dev only).
function getMembers(): Record<string, string> {
  if (process.env.FC_MEMBERS) {
    try {
      return JSON.parse(process.env.FC_MEMBERS);
    } catch {
      console.error("FC_MEMBERS env var is not valid JSON");
    }
  }
  return {
    FC001: "iwanami2024",
    FC002: "rieclub2024",
  };
}

function generateToken(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// ---------------------------------------------------------------------------
// Session store
// - Production (KV_REST_API_URL is set): Vercel KV — survives redeploys
// - Local dev (no KV): in-memory fallback
// ---------------------------------------------------------------------------

type SessionData = { memberNumber: string; expiresAt: number };

const memSessions: Map<string, SessionData> = new Map();

function useKV(): boolean {
  return Boolean(process.env.KV_REST_API_URL);
}

async function sessionSet(token: string, data: SessionData): Promise<void> {
  if (useKV()) {
    const { kv } = await import("@vercel/kv");
    const ttlSeconds = Math.ceil((data.expiresAt - Date.now()) / 1000);
    await kv.set(`session:${token}`, data, { ex: ttlSeconds });
  } else {
    memSessions.set(token, data);
  }
}

async function sessionGet(token: string): Promise<SessionData | null> {
  if (useKV()) {
    const { kv } = await import("@vercel/kv");
    return kv.get<SessionData>(`session:${token}`);
  }
  return memSessions.get(token) ?? null;
}

async function sessionDelete(token: string): Promise<void> {
  if (useKV()) {
    const { kv } = await import("@vercel/kv");
    await kv.del(`session:${token}`);
  } else {
    memSessions.delete(token);
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function login(
  memberNumber: string,
  password: string
): Promise<{ success: boolean; token?: string; error?: string }> {
  const members = getMembers();
  const storedPassword = members[memberNumber];

  if (!storedPassword || storedPassword !== password) {
    return { success: false, error: "会員番号またはパスワードが正しくありません" };
  }

  const token = generateToken();
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days

  await sessionSet(token, { memberNumber, expiresAt });

  const cookieStore = await cookies();
  cookieStore.set("fc_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60,
    path: "/",
  });

  return { success: true, token };
}

export async function logout(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get("fc_session")?.value;
  if (token) {
    await sessionDelete(token);
  }
  cookieStore.set("fc_session", "", {
    httpOnly: true,
    maxAge: 0,
    path: "/",
  });
}

export async function getSession(): Promise<MemberSession> {
  const cookieStore = await cookies();
  const token = cookieStore.get("fc_session")?.value;

  if (!token) {
    return { memberNumber: "", loggedIn: false };
  }

  const session = await sessionGet(token);
  if (!session || session.expiresAt < Date.now()) {
    await sessionDelete(token);
    return { memberNumber: "", loggedIn: false };
  }

  return { memberNumber: session.memberNumber, loggedIn: true };
}
