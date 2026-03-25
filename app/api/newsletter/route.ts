import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { newsletters } from "@/lib/newsletter";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();

  if (!session.loggedIn) {
    // Return only cover images (first page) for non-members
    const preview = newsletters.map((nl) => ({
      id: nl.id,
      vol: nl.vol,
      issue: nl.issue,
      title: nl.title,
      gradient: nl.gradient,
      coverImage: nl.coverImage,
      totalPages: nl.pages.length,
    }));

    return NextResponse.json({
      loggedIn: false,
      newsletters: preview,
    });
  }

  // Members get full page list
  return NextResponse.json({
    loggedIn: true,
    memberNumber: session.memberNumber,
    newsletters,
  });
}
