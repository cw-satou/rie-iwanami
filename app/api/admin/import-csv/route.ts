import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { importMembers, getPaymentHistoryAll, setPaymentHistoryAll } from "@/lib/member-store";
import { Member, MembersRecord } from "@/lib/types";

export const dynamic = "force-dynamic";

function unauthorized() {
  return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
}

function parseDate(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const match = trimmed.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
  if (!match) return null;
  return `${match[1]}-${match[2].padStart(2, "0")}-${match[3].padStart(2, "0")}`;
}

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      fields.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  fields.push(current);
  return fields;
}

// 状態列 → isActive（退会済のみ false）
function isActiveFromStatus(status: string): boolean {
  return !status.includes("退会");
}

export async function POST(req: NextRequest) {
  if (!(await getAdminSession())) return unauthorized();

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "ファイルが選択されていません" }, { status: 400 });
  }

  const text = await file.text();
  const content = text.startsWith("﻿") ? text.slice(1) : text;
  const lines = content.split(/\r?\n/).filter((l) => l.trim() !== "");

  if (lines.length < 2) {
    return NextResponse.json({ error: "データ行がありません" }, { status: 400 });
  }

  const headers = parseCsvLine(lines[0]).map((h) => h.trim());

  const idxOf = (names: string[]) =>
    headers.findIndex((h) => names.some((n) => h.includes(n)));

  const colMemberNo    = idxOf(["会員NO", "会員No", "会員番号"]);
  const colName        = idxOf(["名前", "氏名"]);
  const colFurigana    = idxOf(["フリガナ", "ふりがな"]);
  const colZip         = idxOf(["〒", "郵便番号"]);
  const colAddress     = idxOf(["住所"]);
  const colPhone       = idxOf(["電話番号", "電話"]);
  const colEmail       = idxOf(["メールアドレス", "メール"]);
  const colJoinDate    = idxOf(["入会日"]);
  const colLastPayment = idxOf(["最終振込日"]);
  const colPayHistory  = idxOf(["振込履歴"]);
  const colBirthday    = idxOf(["生年月日", "誕生日"]);
  const colStatus      = idxOf(["状態"]);
  const colNotes       = idxOf(["備考"]);

  const now = new Date().toISOString();
  const today = now.slice(0, 10);

  const newMembers: MembersRecord = {};
  // 振込履歴（会員番号 → 日付配列）を別途収集
  const payHistMap: Record<string, string[]> = {};

  for (let r = 1; r < lines.length; r++) {
    const cols = parseCsvLine(lines[r]);

    const memberNumber = colMemberNo >= 0 ? cols[colMemberNo]?.trim() ?? "" : "";
    if (!memberNumber) continue;

    const name = colName >= 0 ? cols[colName]?.trim() ?? "" : "";
    if (!name) continue;

    const joinDate    = colJoinDate    >= 0 ? parseDate(cols[colJoinDate] ?? "")    : null;
    const lastPayment = colLastPayment >= 0 ? parseDate(cols[colLastPayment] ?? "") : null;
    const birthday    = colBirthday   >= 0 ? parseDate(cols[colBirthday] ?? "")    : null;
    const statusStr   = colStatus     >= 0 ? cols[colStatus]?.trim() ?? ""          : "";

    // 振込履歴列をパース（セミコロン区切り）
    if (colPayHistory >= 0) {
      const histStr = cols[colPayHistory]?.trim() ?? "";
      const dates = histStr
        .split(";")
        .map((d) => parseDate(d.trim()))
        .filter((d): d is string => !!d)
        .sort();
      if (dates.length > 0) payHistMap[memberNumber] = dates;
    }

    let nextPaymentDate: string | null = null;
    if (lastPayment) {
      const d = new Date(lastPayment);
      d.setFullYear(d.getFullYear() + 1);
      nextPaymentDate = d.toISOString().slice(0, 10);
    }

    const isActive = statusStr
      ? isActiveFromStatus(statusStr)
      : nextPaymentDate ? nextPaymentDate >= today : false;

    // パスワード: 生年月日がある場合はYYYYMMDD（ハイフンなし8桁）、なければ会員番号
    const password = birthday ? birthday.replace(/-/g, "") : memberNumber;

    const member: Member = {
      memberNumber,
      name,
      furigana:        colFurigana >= 0 ? cols[colFurigana]?.trim()  || undefined : undefined,
      zipCode:         colZip      >= 0 ? cols[colZip]?.trim()        || undefined : undefined,
      address:         colAddress  >= 0 ? cols[colAddress]?.trim()    || undefined : undefined,
      phone:           colPhone    >= 0 ? cols[colPhone]?.trim()      || undefined : undefined,
      email:           colEmail    >= 0 ? cols[colEmail]?.trim()      || undefined : undefined,
      birthday:        birthday ?? undefined,
      password,
      isActive,
      joinDate:        joinDate ?? today,
      lastPaymentDate: lastPayment,
      nextPaymentDate,
      notes:           colNotes >= 0 ? cols[colNotes]?.trim() || undefined : undefined,
      createdAt:       now,
      updatedAt:       now,
    };

    newMembers[memberNumber] = member;
  }

  if (Object.keys(newMembers).length === 0) {
    return NextResponse.json({ error: "インポートできる行がありませんでした" }, { status: 400 });
  }

  // 会員データの差分インポート
  const { added, updated, skipped } = await importMembers(newMembers);

  // 振込履歴を既存データとマージして保存
  if (Object.keys(payHistMap).length > 0) {
    const existing = await getPaymentHistoryAll();
    for (const [num, dates] of Object.entries(payHistMap)) {
      const merged = [...new Set([...(existing[num] ?? []), ...dates])].sort();
      existing[num] = merged;
    }
    await setPaymentHistoryAll(existing);
  }

  return NextResponse.json({
    ok: true,
    added: added.length,
    updated: updated.length,
    skipped: skipped.length,
    total: Object.keys(newMembers).length,
  });
}
