import { cookies } from "next/headers";
import { MemberSession } from "./types";

// In production, use Vercel KV or Postgres.
// For now, use a simple in-memory store + signed cookies.
// Members are stored as: { memberNumber: string, passwordHash: string }
const DEMO_MEMBERS: Record<string, string> = {
  FC001: "iwanami2024",
  FC002: "rieclub2024",
};

// Simple session token generator
function generateToken(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// In-memory session store (replace with Vercel KV in production)
const sessions: Map<string, { memberNumber: string; expiresAt: number }> =
  new Map();

export async function login(
  memberNumber: string,
  password: string
): Promise<{ success: boolean; token?: string; error?: string }> {
  const storedPassword = DEMO_MEMBERS[memberNumber];

  if (!storedPassword || storedPassword !== password) {
    return { success: false, error: "会員番号またはパスワードが正しくありません" };
  }

  const token = generateToken();
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days

  sessions.set(token, { memberNumber, expiresAt });

  // Set cookie
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
    sessions.delete(token);
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

  const session = sessions.get(token);
  if (!session || session.expiresAt < Date.now()) {
    sessions.delete(token!);
    return { memberNumber: "", loggedIn: false };
  }

  return { memberNumber: session.memberNumber, loggedIn: true };
}
