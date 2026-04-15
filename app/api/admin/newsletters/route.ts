import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { getAllNewsletters, createNewsletter } from "@/lib/newsletter-store";
import { Newsletter } from "@/lib/types";

async function requireAdmin() {
  const ok = await getAdminSession();
  if (!ok) return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  return null;
}

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const newsletters = await getAllNewsletters();
  return NextResponse.json({ newsletters });
}

export async function POST(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const body = await request.json();
  const { id, vol, issue, title, gradient, coverImage, pages } = body as Partial<Newsletter>;

  if (!id || !vol || !issue || !title || !coverImage || !pages?.length) {
    return NextResponse.json(
      { error: "id・vol・issue・title・coverImage・pages は必須です" },
      { status: 400 }
    );
  }

  const nl: Newsletter = {
    id: id.trim(),
    vol: vol.trim(),
    issue: issue.trim(),
    title: title.trim(),
    gradient: gradient?.trim() ?? "linear-gradient(135deg, #F0B8C8, #E8A0B4)",
    coverImage: coverImage.trim(),
    pages: pages.map((p: string) => p.trim()).filter(Boolean),
  };

  const result = await createNewsletter(nl);
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 409 });
  }

  return NextResponse.json({ newsletter: nl }, { status: 201 });
}
