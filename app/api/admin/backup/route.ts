import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import {
  getBackupList,
  createBackup,
  getMembers,
  getBackupData,
} from "@/lib/member-store";

export const dynamic = "force-dynamic";

function unauthorized() {
  return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
}

// バックアップ一覧 または 特定バックアップのダウンロード
export async function GET(req: NextRequest) {
  if (!(await getAdminSession())) return unauthorized();

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (id) {
    // 特定バックアップのデータを返す
    const data = await getBackupData(id);
    if (!data) {
      return NextResponse.json({ error: "バックアップが見つかりません" }, { status: 404 });
    }
    const filename = `members-backup-${id}.json`;
    return new NextResponse(JSON.stringify({ id, data }, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  }

  // バックアップ一覧
  const list = await getBackupList();
  return NextResponse.json(list);
}

// バックアップ作成 + 現在データのダウンロード用レスポンス
export async function POST(req: NextRequest) {
  if (!(await getAdminSession())) return unauthorized();

  const body = await req.json().catch(() => ({}));
  const label: string | undefined = body.label;
  const download: boolean = body.download ?? false;

  // バックアップ保存（失敗してもダウンロードは続行）
  let entry = null;
  try {
    entry = await createBackup(label);
  } catch (err) {
    console.error("バックアップ保存エラー（ダウンロードは続行）:", err);
  }

  if (download) {
    const members = await getMembers();
    const now = new Date().toISOString();
    const timestamp = now.replace(/[:.]/g, "-");
    const filename = `members-${timestamp}.json`;
    const payload = {
      exportedAt: now,
      backupId: entry?.id ?? null,
      members,
    };
    return new NextResponse(JSON.stringify(payload, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  }

  if (!entry) {
    return NextResponse.json({ error: "バックアップ保存に失敗しました" }, { status: 500 });
  }

  return NextResponse.json(entry);
}
