import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { importMembers } from "@/lib/member-store";
import { Member, MembersRecord } from "@/lib/types";
import * as XLSX from "xlsx";

export const dynamic = "force-dynamic";

function unauthorized() {
  return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
}

// Excel のシリアル日付 (数値) を YYYY-MM-DD に変換
function excelDateToString(value: unknown): string | null {
  if (value == null || value === "") return null;
  if (typeof value === "number") {
    const date = XLSX.SSF.parse_date_code(value);
    if (!date) return null;
    const y = date.y;
    const m = String(date.m).padStart(2, "0");
    const d = String(date.d).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    // YYYY/MM/DD or YYYY-MM-DD
    const match = trimmed.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
    if (match) {
      return `${match[1]}-${match[2].padStart(2, "0")}-${match[3].padStart(2, "0")}`;
    }
  }
  return null;
}

// 日付っぽい値かどうか判定
function looksLikeDate(value: unknown): boolean {
  if (typeof value === "number" && value > 40000 && value < 60000) return true;
  if (typeof value === "string") {
    return /^\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}$/.test(value.trim());
  }
  return false;
}

export async function POST(req: NextRequest) {
  if (!(await getAdminSession())) return unauthorized();

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "ファイルが選択されていません" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: false });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });

  if (rows.length < 2) {
    return NextResponse.json({ error: "データ行がありません" }, { status: 400 });
  }

  const headers = (rows[0] as string[]).map((h) => String(h).trim());

  // ヘッダーインデックスを特定
  const idxOf = (names: string[]) =>
    headers.findIndex((h) => names.some((n) => h.includes(n)));

  const colMemberNo = idxOf(["会員NO", "会員No", "会員番号", "NO", "No"]);
  const colName = idxOf(["名前", "氏名"]);
  const colFurigana = idxOf(["フリガナ", "ふりがな", "カナ"]);
  const colZip = idxOf(["〒", "郵便番号", "zip"]);
  const colAddress = idxOf(["住所"]);
  const colPhone = idxOf(["電話番号", "電話", "TEL"]);
  const colEmail = idxOf(["メールアドレス", "メール", "mail", "email"]);
  const colBirthday = idxOf(["生年月日", "誕生日"]);

  // 入会日（一番左の振込日列）のインデックス
  const colJoinDate = idxOf(["入会日", "振込日①", "振込日1", "初回振込"]);

  // 「更新日」または振込日②以降の日付列を特定する
  // メールアドレスより右、生年月日より左にある日付系列をすべて収集
  // ただし「入会日」相当の列は除く
  const dateCols: number[] = [];
  for (let i = 0; i < headers.length; i++) {
    if (i === colBirthday) continue;
    const h = headers[i];
    if (
      h.includes("更新日") ||
      h.includes("振込日") ||
      h.includes("振込") ||
      h.includes("入会日")
    ) {
      dateCols.push(i);
    }
  }
  // 日付列が見つからない場合はヘッダーなし日付列を値から探す（後で行処理時に検出）

  const now = new Date().toISOString();
  const today = now.slice(0, 10);

  const newMembers: MembersRecord = {};

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r] as unknown[];

    const memberNumber =
      colMemberNo >= 0 ? String(row[colMemberNo] ?? "").trim() : "";
    if (!memberNumber) continue;

    const name = colName >= 0 ? String(row[colName] ?? "").trim() : "";
    if (!name) continue;

    // 日付列が固定で取れない場合、行の値から動的に日付を探す
    let allDates: (string | null)[] = [];
    if (dateCols.length > 0) {
      allDates = dateCols.map((ci) => excelDateToString(row[ci]));
    } else {
      // ヘッダー名で特定できなかった場合は全列を走査
      for (let ci = 0; ci < row.length; ci++) {
        if (ci === colBirthday) continue;
        if (looksLikeDate(row[ci])) {
          allDates.push(excelDateToString(row[ci]));
        }
      }
    }

    const nonNullDates = allDates.filter((d): d is string => !!d);

    // 入会日（最左の日付 or 専用列）
    let joinDate =
      colJoinDate >= 0 ? excelDateToString(row[colJoinDate]) : null;
    if (!joinDate && nonNullDates.length > 0) {
      joinDate = nonNullDates[0];
    }

    // 最終振込日（最右の日付）
    let lastPaymentDate: string | null = null;
    if (nonNullDates.length > 0) {
      lastPaymentDate = nonNullDates[nonNullDates.length - 1];
    }

    // 次回振込日（最終振込日 + 1年）
    let nextPaymentDate: string | null = null;
    if (lastPaymentDate) {
      const d = new Date(lastPaymentDate);
      d.setFullYear(d.getFullYear() + 1);
      nextPaymentDate = d.toISOString().slice(0, 10);
    }

    // 有効判定（次回振込日が今日以降）
    const isActive = nextPaymentDate ? nextPaymentDate >= today : false;

    const birthday =
      colBirthday >= 0 ? excelDateToString(row[colBirthday]) : null;

    const member: Member = {
      memberNumber,
      name,
      furigana: colFurigana >= 0 ? String(row[colFurigana] ?? "").trim() || undefined : undefined,
      zipCode: colZip >= 0 ? String(row[colZip] ?? "").trim() || undefined : undefined,
      address: colAddress >= 0 ? String(row[colAddress] ?? "").trim() || undefined : undefined,
      phone: colPhone >= 0 ? String(row[colPhone] ?? "").trim() || undefined : undefined,
      email: colEmail >= 0 ? String(row[colEmail] ?? "").trim() || undefined : undefined,
      birthday: birthday ?? undefined,
      password: memberNumber, // デフォルトは会員番号
      isActive,
      joinDate: joinDate ?? today,
      lastPaymentDate,
      nextPaymentDate,
      notes: undefined,
      createdAt: now,
      updatedAt: now,
    };

    newMembers[memberNumber] = member;
  }

  if (Object.keys(newMembers).length === 0) {
    return NextResponse.json({ error: "インポートできる行がありませんでした" }, { status: 400 });
  }

  // 既存データと差分マージ（updatedAt 比較）
  const { added, updated, skipped } = await importMembers(newMembers);

  return NextResponse.json({
    ok: true,
    added: added.length,
    updated: updated.length,
    skipped: skipped.length,
    total: Object.keys(newMembers).length,
  });
}
