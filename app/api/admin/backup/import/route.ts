import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { importMembers, createBackup } from "@/lib/member-store";
import { MembersRecord } from "@/lib/types";

export async function POST(req: NextRequest) {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  const body = await req.json();

  // インポートファイルは { members: MembersRecord } または MembersRecord のどちらでも受け付ける
  const incoming: MembersRecord = body.members ?? body;

  if (typeof incoming !== "object" || Array.isArray(incoming)) {
    return NextResponse.json({ error: "不正なデータ形式です" }, { status: 400 });
  }

  // インポート前に現在データのバックアップを作成
  await createBackup("インポート前自動バックアップ");

  const result = await importMembers(incoming);

  return NextResponse.json({
    ok: true,
    added: result.added,
    updated: result.updated,
    skipped: result.skipped,
  });
}
