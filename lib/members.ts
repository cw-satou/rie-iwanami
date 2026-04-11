import { scryptSync, randomBytes, timingSafeEqual } from "crypto";

export interface Member {
  memberNumber: string;
  name: string;
  passwordHash: string;
  joinedAt: string;
  active: boolean;
}

export type MemberPublic = Omit<Member, "passwordHash">;

// ---------------------------------------------------------------------------
// Password hashing (Node.js built-in crypto — no extra packages needed)
// ---------------------------------------------------------------------------

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPasswordHash(password: string, stored: string): boolean {
  try {
    const [salt, hash] = stored.split(":");
    const hashBuffer = Buffer.from(hash, "hex");
    const derived = scryptSync(password, salt, 64);
    return timingSafeEqual(hashBuffer, derived);
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Storage: Vercel KV when KV_REST_API_URL is set, otherwise in-memory
// ---------------------------------------------------------------------------

const mem = new Map<string, Member>();

function isKVEnabled(): boolean {
  return Boolean(process.env.KV_REST_API_URL);
}

export async function getMember(memberNumber: string): Promise<Member | null> {
  if (isKVEnabled()) {
    const { kv } = await import("@vercel/kv");
    return kv.get<Member>(`member:${memberNumber}`);
  }
  return mem.get(memberNumber) ?? null;
}

export async function getAllMembers(): Promise<Member[]> {
  if (isKVEnabled()) {
    const { kv } = await import("@vercel/kv");
    const numbers = await kv.smembers<string[]>("member_list");
    if (!numbers?.length) return [];
    const list = await Promise.all(numbers.map((n) => kv.get<Member>(`member:${n}`)));
    return list.filter((m): m is Member => m !== null);
  }
  return Array.from(mem.values());
}

export async function createMember(
  memberNumber: string,
  name: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  if (await getMember(memberNumber)) {
    return { success: false, error: "既に存在する会員番号です" };
  }

  const member: Member = {
    memberNumber,
    name,
    passwordHash: hashPassword(password),
    joinedAt: new Date().toISOString(),
    active: true,
  };

  if (isKVEnabled()) {
    const { kv } = await import("@vercel/kv");
    await kv.set(`member:${memberNumber}`, member);
    await kv.sadd("member_list", memberNumber);
  } else {
    mem.set(memberNumber, member);
  }

  return { success: true };
}

export async function updateMember(
  memberNumber: string,
  updates: { name?: string; password?: string; active?: boolean }
): Promise<{ success: boolean; error?: string; member?: Member }> {
  const existing = await getMember(memberNumber);
  if (!existing) return { success: false, error: "会員が見つかりません" };

  const updated: Member = {
    ...existing,
    ...(updates.name !== undefined && { name: updates.name }),
    ...(updates.active !== undefined && { active: updates.active }),
    ...(updates.password && { passwordHash: hashPassword(updates.password) }),
  };

  if (isKVEnabled()) {
    const { kv } = await import("@vercel/kv");
    await kv.set(`member:${memberNumber}`, updated);
  } else {
    mem.set(memberNumber, updated);
  }

  return { success: true, member: updated };
}

export async function deleteMember(
  memberNumber: string
): Promise<{ success: boolean; error?: string }> {
  if (!(await getMember(memberNumber))) {
    return { success: false, error: "会員が見つかりません" };
  }

  if (isKVEnabled()) {
    const { kv } = await import("@vercel/kv");
    await kv.del(`member:${memberNumber}`);
    await kv.srem("member_list", memberNumber);
  } else {
    mem.delete(memberNumber);
  }

  return { success: true };
}

// Used by lib/auth.ts to verify login credentials against KV members
export async function verifyMemberCredentials(
  memberNumber: string,
  password: string
): Promise<boolean> {
  const member = await getMember(memberNumber);
  if (!member || !member.active) return false;
  return verifyPasswordHash(password, member.passwordHash);
}

export function toPublic(member: Member): MemberPublic {
  const { passwordHash: _, ...pub } = member;
  return pub;
}
