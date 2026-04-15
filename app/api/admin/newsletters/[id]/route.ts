import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { updateNewsletter, deleteNewsletter } from "@/lib/newsletter-store";
import { Newsletter } from "@/lib/types";

async function requireAdmin() {
  const ok = await getAdminSession();
  if (!ok) return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  return null;
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  const body = await request.json();
  const { vol, issue, title, gradient, coverImage, pages } =
    body as Partial<Newsletter>;

  const updates: Partial<Omit<Newsletter, "id">> = {};
  if (vol !== undefined) updates.vol = vol.trim();
  if (issue !== undefined) updates.issue = issue.trim();
  if (title !== undefined) updates.title = title.trim();
  if (gradient !== undefined) updates.gradient = gradient.trim();
  if (coverImage !== undefined) updates.coverImage = coverImage.trim();
  if (pages !== undefined)
    updates.pages = pages.map((p: string) => p.trim()).filter(Boolean);

  const result = await updateNewsletter(id, updates);
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  const result = await deleteNewsletter(id);
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
