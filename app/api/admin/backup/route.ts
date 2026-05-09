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

  // KVとローカルにバックアップ保存
  const entry = await createBackup(label);

  if (download) {
    // 現在の会員データをダウンロード用に返す
    const members = await getMembers();
    const timestamp = entry.timestamp.replace(/[:.]/g, "-");
    const filename = `members-${timestamp}.json`;
    const payload = {
      exportedAt: entry.timestamp,
      backupId: entry.id,
      members,
    };
    return new NextResponse(JSON.stringify(payload, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  }

  return NextResponse.json(entry);
}
