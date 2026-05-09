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

// 「状態」列の値から isActive を判定
// 退会済 → false、それ以外（在籍・連絡中・要確認 など）→ true
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
  // UTF-8 BOM 除去
  const content = text.startsWith("﻿") ? text.slice(1) : text;
  const lines = content.split(/\r?\n/).filter((l) => l.trim() !== "");

  if (lines.length < 2) {
    return NextResponse.json({ error: "データ行がありません" }, { status: 400 });
  }

  const headers = parseCsvLine(lines[0]).map((h) => h.trim());

  // ヘッダー名でインデックスを検索
  const idxOf = (names: string[]) =>
    headers.findIndex((h) => names.some((n) => h.includes(n)));

  const colMemberNo       = idxOf(["会員NO", "会員No", "会員番号"]);
  const colName           = idxOf(["名前", "氏名"]);
  const colFurigana       = idxOf(["フリガナ", "ふりがな"]);
  const colZip            = idxOf(["〒", "郵便番号"]);
  const colAddress        = idxOf(["住所"]);
  const colPhone          = idxOf(["電話番号", "電話"]);
  const colEmail          = idxOf(["メールアドレス", "メール"]);
  const colJoinDate       = idxOf(["入会日"]);
  const colLastPayment    = idxOf(["最終振込日", "ææ°æ¯è¾¼æ¥"]);
  const colBirthday       = idxOf(["生年月日", "誕生日"]);
  const colStatus         = idxOf(["状態", "ç¶æ"]);
  const colNotes          = idxOf(["備考", "åè"]);

  const now = new Date().toISOString();
  const today = now.slice(0, 10);

  const newMembers: MembersRecord = {};

  for (let r = 1; r < lines.length; r++) {
    const cols = parseCsvLine(lines[r]);

    const memberNumber = colMemberNo >= 0 ? cols[colMemberNo]?.trim() ?? "" : "";
    if (!memberNumber) continue;

    const name = colName >= 0 ? cols[colName]?.trim() ?? "" : "";
    if (!name) continue;

    const joinDate     = colJoinDate    >= 0 ? parseDate(cols[colJoinDate] ?? "")    : null;
    const lastPayment  = colLastPayment >= 0 ? parseDate(cols[colLastPayment] ?? "") : null;
    const birthday     = colBirthday   >= 0 ? parseDate(cols[colBirthday] ?? "")   : null;
    const statusStr    = colStatus     >= 0 ? cols[colStatus]?.trim() ?? ""         : "";

    // 次回振込日 = 最終振込日 + 1年
    let nextPaymentDate: string | null = null;
    if (lastPayment) {
      const d = new Date(lastPayment);
      d.setFullYear(d.getFullYear() + 1);
      nextPaymentDate = d.toISOString().slice(0, 10);
    }

    // 有効判定: 状態列を優先、退会済なら無効
    const isActive = statusStr
      ? isActiveFromStatus(statusStr)
      : nextPaymentDate ? nextPaymentDate >= today : false;

    const member: Member = {
      memberNumber,
      name,
      furigana:         colFurigana  >= 0 ? cols[colFurigana]?.trim()  || undefined : undefined,
      zipCode:          colZip       >= 0 ? cols[colZip]?.trim()        || undefined : undefined,
      address:          colAddress   >= 0 ? cols[colAddress]?.trim()    || undefined : undefined,
      phone:            colPhone     >= 0 ? cols[colPhone]?.trim()      || undefined : undefined,
      email:            colEmail     >= 0 ? cols[colEmail]?.trim()      || undefined : undefined,
      birthday:         birthday ?? undefined,
      password:         memberNumber,
      isActive,
      joinDate:         joinDate ?? today,
      lastPaymentDate:  lastPayment,
      nextPaymentDate,
      notes:            colNotes >= 0 ? cols[colNotes]?.trim() || undefined : undefined,
      createdAt:        now,
      updatedAt:        now,
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
