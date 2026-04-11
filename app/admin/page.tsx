import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";

export default async function AdminPage() {
  const isAdmin = await getAdminSession();
  redirect(isAdmin ? "/admin/members" : "/admin/login");
}
