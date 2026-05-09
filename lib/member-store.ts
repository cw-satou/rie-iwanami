/**
 * 会員データストア
 *
 * 接続先の優先順位:
 *   1. REDIS_URL が設定されている場合    → ioredis（Redis Cloud 等の標準 Redis）
 *   2. KV_REST_API_URL が設定されている場合 → @vercel/kv（Upstash REST API）
 *   3. どちらも未設定                   → data/members.json（開発用ローカルファイル）
 *
 * KVキー構成（Redis / Vercel KV 共通）:
 *   fc:members        - メインの会員データ（JSON文字列）
 *   fc:backup:list    - バックアップメタ情報リスト（JSON文字列）
 *   fc:backup:{id}    - バックアップスナップショット（JSON文字列）
 */

import { Member, MembersRecord, BackupEntry } from "./types";
import path from "path";
import fs from "fs";

const USE_REDIS = !!process.env.REDIS_URL;
const USE_KV = !USE_REDIS && !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);

const DATA_FILE = path.join(process.cwd(), "data", "members.json");
const MEMBERS_KEY = "fc:members";
const BACKUP_LIST_KEY = "fc:backup:list";
const MAX_BACKUPS = 20;

// ---- Redis シングルトン ----

let redisClient: import("ioredis").Redis | null = null;

async function getRedis(): Promise<import("ioredis").Redis> {
  if (!redisClient) {
    const { default: Redis } = await import("ioredis");
    redisClient = new Redis(process.env.REDIS_URL!, { maxRetriesPerRequest: 3 });
  }
  return redisClient;
}

// ---- KV ヘルパー（ioredis / @vercel/kv の差異を吸収）----

async function kvGet<T>(key: string): Promise<T | null> {
  if (USE_REDIS) {
    const redis = await getRedis();
    const val = await redis.get(key);
    return val ? (JSON.parse(val) as T) : null;
  }
  if (USE_KV) {
    const { kv } = await import("@vercel/kv");
    return (await kv.get<T>(key)) ?? null;
  }
  return null;
}

async function kvSet(key: string, value: unknown): Promise<void> {
  if (USE_REDIS) {
    const redis = await getRedis();
    await redis.set(key, JSON.stringify(value));
    return;
  }
  if (USE_KV) {
    const { kv } = await import("@vercel/kv");
    await kv.set(key, value);
  }
}

// ---- ローカルファイル操作 ----

type LocalDB = {
  members: MembersRecord;
  backups: BackupEntry[];
  lastUpdated: string;
};

function readLocalDB(): LocalDB {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8")) as LocalDB;
  } catch {
    return { members: {}, backups: [], lastUpdated: new Date().toISOString() };
  }
}

function writeLocalDB(db: LocalDB): void {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2), "utf-8");
}

// ---- 公開 API ----

export async function getMembers(): Promise<MembersRecord> {
  if (USE_REDIS || USE_KV) {
    return (await kvGet<MembersRecord>(MEMBERS_KEY)) ?? {};
  }
  return readLocalDB().members;
}

export async function setMembers(members: MembersRecord): Promise<void> {
  if (USE_REDIS || USE_KV) {
    await kvSet(MEMBERS_KEY, members);
    return;
  }
  const db = readLocalDB();
  db.members = members;
  db.lastUpdated = new Date().toISOString();
  writeLocalDB(db);
}

export async function getMember(memberNumber: string): Promise<Member | null> {
  const members = await getMembers();
  return members[memberNumber] ?? null;
}

export async function upsertMember(member: Member): Promise<void> {
  const members = await getMembers();
  members[member.memberNumber] = {
    ...member,
    updatedAt: new Date().toISOString(),
  };
  await setMembers(members);
}

export async function deleteMember(memberNumber: string): Promise<void> {
  const members = await getMembers();
  delete members[memberNumber];
  await setMembers(members);
}

// ---- バックアップ ----

export async function createBackup(label?: string): Promise<BackupEntry> {
  const members = await getMembers();
  const now = new Date().toISOString();
  const id = now.replace(/[:.]/g, "-");
  const entry: BackupEntry = {
    id,
    timestamp: now,
    memberCount: Object.keys(members).length,
    label,
  };

  if (USE_REDIS || USE_KV) {
    await kvSet(`fc:backup:${id}`, members);
    const list = (await kvGet<BackupEntry[]>(BACKUP_LIST_KEY)) ?? [];
    list.unshift(entry);
    if (list.length > MAX_BACKUPS) list.length = MAX_BACKUPS;
    await kvSet(BACKUP_LIST_KEY, list);
  } else {
    const db = readLocalDB();
    const backupsDir = path.join(process.cwd(), "data", "backups");
    fs.mkdirSync(backupsDir, { recursive: true });
    fs.writeFileSync(
      path.join(backupsDir, `${id}.json`),
      JSON.stringify(members, null, 2),
      "utf-8"
    );
    db.backups.unshift(entry);
    if (db.backups.length > MAX_BACKUPS) db.backups.length = MAX_BACKUPS;
    db.lastUpdated = now;
    writeLocalDB(db);
  }

  return entry;
}

export async function getBackupList(): Promise<BackupEntry[]> {
  if (USE_REDIS || USE_KV) {
    return (await kvGet<BackupEntry[]>(BACKUP_LIST_KEY)) ?? [];
  }
  return readLocalDB().backups;
}

export async function getBackupData(id: string): Promise<MembersRecord | null> {
  if (USE_REDIS || USE_KV) {
    return await kvGet<MembersRecord>(`fc:backup:${id}`);
  }
  const file = path.join(process.cwd(), "data", "backups", `${id}.json`);
  try {
    return JSON.parse(fs.readFileSync(file, "utf-8")) as MembersRecord;
  } catch {
    return null;
  }
}

// ---- 差分インポート ----

export interface ImportResult {
  added: string[];
  updated: string[];
  skipped: string[];
}

export async function importMembers(incoming: MembersRecord): Promise<ImportResult> {
  const current = await getMembers();
  const result: ImportResult = { added: [], updated: [], skipped: [] };

  for (const [num, member] of Object.entries(incoming)) {
    if (!current[num]) {
      current[num] = member;
      result.added.push(num);
    } else if (new Date(member.updatedAt) > new Date(current[num].updatedAt)) {
      current[num] = member;
      result.updated.push(num);
    } else {
      result.skipped.push(num);
    }
  }

  await setMembers(current);
  return result;
}

// ---- 振込履歴（別テーブル） ----

const PAYMENTS_KEY = "fc:payments";

export async function getPaymentHistoryAll(): Promise<Record<string, string[]>> {
  if (USE_REDIS || USE_KV) {
    return (await kvGet<Record<string, string[]>>(PAYMENTS_KEY)) ?? {};
  }
  const db = readLocalDB() as LocalDB & { payments?: Record<string, string[]> };
  return db.payments ?? {};
}

export async function setPaymentHistoryAll(data: Record<string, string[]>): Promise<void> {
  if (USE_REDIS || USE_KV) {
    await kvSet(PAYMENTS_KEY, data);
    return;
  }
  const db = readLocalDB() as LocalDB & { payments?: Record<string, string[]> };
  (db as Record<string, unknown>).payments = data;
  writeLocalDB(db);
}

export async function getPaymentHistory(memberNumber: string): Promise<string[]> {
  const all = await getPaymentHistoryAll();
  return all[memberNumber] ?? [];
}

export async function addPayment(memberNumber: string, date: string): Promise<string[]> {
  const all = await getPaymentHistoryAll();
  const current = all[memberNumber] ?? [];
  if (!current.includes(date)) {
    current.push(date);
    current.sort();
  }
  all[memberNumber] = current;
  await setPaymentHistoryAll(all);
  return current;
}

export async function removePayment(memberNumber: string, date: string): Promise<{ history: string[]; member: Member | null }> {
  const all = await getPaymentHistoryAll();
  const remaining = (all[memberNumber] ?? []).filter((d) => d !== date);
  all[memberNumber] = remaining;
  await setPaymentHistoryAll(all);

  // 会員レコードの lastPaymentDate / nextPaymentDate を再計算して更新
  const member = await getMember(memberNumber);
  if (!member) return { history: remaining, member: null };

  const lastPayment = remaining.length > 0 ? remaining[remaining.length - 1] : null;
  let nextPaymentDate: string | null = null;
  if (lastPayment) {
    const d = new Date(lastPayment);
    d.setFullYear(d.getFullYear() + 1);
    nextPaymentDate = d.toISOString().slice(0, 10);
  }
  const today = new Date().toISOString().slice(0, 10);
  const updated: Member = {
    ...member,
    lastPaymentDate: lastPayment,
    nextPaymentDate,
    isActive: nextPaymentDate ? nextPaymentDate >= today : false,
    updatedAt: new Date().toISOString(),
  };
  await upsertMember(updated);
  return { history: remaining, member: updated };
}
