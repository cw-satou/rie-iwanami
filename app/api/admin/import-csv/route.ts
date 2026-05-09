import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { importMembers } from "@/lib/member-store";
import { Member, MembersRecord } from "@/lib/types";

export const dynamic = "force-dynamic";

function unauthorized() {
  return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
}

// 日付文字列（YYYY/MM/DD or YYYY-MM-DD）を YYYY-MM-DD に正規化
function parseDate(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const match = trimmed.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
  if (!match) return null;
  return `${match[1]}-${match[2].padStart(2, "0")}-${match[3].padStart(2, "0")}`;
}

// CSVの1行をパース（クォート対応）
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

export async function POST(req: NextRequest) {
  if (!(await getAdminSession())) return unauthorized();

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "ファイルが選択されていません" }, { status: 400 });
  }

  const text = await file.text();
  // BOM除去
  const content = text.startsWith("﻿") ? text.slice(1) : text;
  const lines = content.split(/\r?\n/).filter((l) => l.trim() !== "");

  if (lines.length < 2) {
    return NextResponse.json({ error: "データ行がありません" }, { status: 400 });
  }

  const headers = parseCsvLine(lines[0]).map((h) => h.trim());

  const idxOf = (names: string[]) =>
    headers.findIndex((h) => names.some((n) => h.includes(n)));

  const colMemberNo = idxOf(["会員NO", "会員No", "会員番号"]);
  const colName     = idxOf(["名前", "氏名"]);
  const colFurigana = idxOf(["フリガナ", "ふりがな", "カナ"]);
  const colZip      = idxOf(["〒", "郵便番号"]);
  const colAddress  = idxOf(["住所"]);
  const colPhone    = idxOf(["電話番号", "電話"]);
  const colEmail    = idxOf(["メールアドレス", "メール"]);
  const colBirthday = idxOf(["生年月日", "誕生日"]);

  // 入会日（最初の振込日列）
  const colJoinDate = idxOf(["入会日", "振込日①", "振込日1", "初回振込"]);

  // 日付系の列（生年月日以外）をインデックス順に収集
  const dateCols: number[] = [];
  for (let i = 0; i < headers.length; i++) {
    if (i === colBirthday) continue;
    const h = headers[i];
    if (
      h.includes("入会日") ||
      h.includes("振込日") ||
      h.includes("更新日") ||
      h.includes("振込")
    ) {
      dateCols.push(i);
    }
  }

  const now = new Date().toISOString();
  const today = now.slice(0, 10);

  const newMembers: MembersRecord = {};

  for (let r = 1; r < lines.length; r++) {
    const cols = parseCsvLine(lines[r]);

    const memberNumber = colMemberNo >= 0 ? cols[colMemberNo]?.trim() ?? "" : "";
    if (!memberNumber) continue;

    const name = colName >= 0 ? cols[colName]?.trim() ?? "" : "";
    if (!name) continue;

    // 日付を収集
    let allDates: (string | null)[];
    if (dateCols.length > 0) {
      allDates = dateCols.map((ci) => parseDate(cols[ci] ?? ""));
    } else {
      // ヘッダーで特定できなかった場合は全列を走査
      allDates = cols
        .filter((_, ci) => ci !== colBirthday)
        .map((v) => parseDate(v));
    }

    const nonNullDates = allDates.filter((d): d is string => !!d);

    let joinDate = colJoinDate >= 0 ? parseDate(cols[colJoinDate] ?? "") : null;
    if (!joinDate && nonNullDates.length > 0) joinDate = nonNullDates[0];

    // 最終振込日 = 最右の日付
    const lastPaymentDate = nonNullDates.length > 0
      ? nonNullDates[nonNullDates.length - 1]
      : null;

    // 次回振込日 = 最終振込日 + 1年
    let nextPaymentDate: string | null = null;
    if (lastPaymentDate) {
      const d = new Date(lastPaymentDate);
      d.setFullYear(d.getFullYear() + 1);
      nextPaymentDate = d.toISOString().slice(0, 10);
    }

    const isActive = nextPaymentDate ? nextPaymentDate >= today : false;

    const birthday = colBirthday >= 0 ? parseDate(cols[colBirthday] ?? "") : null;

    const member: Member = {
      memberNumber,
      name,
      furigana:  colFurigana >= 0 ? cols[colFurigana]?.trim() || undefined : undefined,
      zipCode:   colZip      >= 0 ? cols[colZip]?.trim()      || undefined : undefined,
      address:   colAddress  >= 0 ? cols[colAddress]?.trim()   || undefined : undefined,
      phone:     colPhone    >= 0 ? cols[colPhone]?.trim()     || undefined : undefined,
      email:     colEmail    >= 0 ? cols[colEmail]?.trim()     || undefined : undefined,
      birthday:  birthday ?? undefined,
      password:  memberNumber,
      isActive,
      joinDate:  joinDate ?? today,
      lastPaymentDate,
      nextPaymentDate,
      notes:     undefined,
      createdAt: now,
      updatedAt: now,
    };

    newMembers[memberNumber] = member;
  }

  if (Object.keys(newMembers).length === 0) {
    return NextResponse.json({ error: "インポートできる行がありませんでした" }, { status: 400 });
  }

  const { added, updated, skipped } = await importMembers(newMembers);

  return NextResponse.json({
    ok: true,
    added: added.length,
    updated: updated.length,
    skipped: skipped.length,
    total: Object.keys(newMembers).length,
  });
}
