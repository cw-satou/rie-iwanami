import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";
import { getAllMembers, toPublic } from "@/lib/members";
import AdminMembersUI from "@/components/AdminMembersUI";

export const dynamic = "force-dynamic";

export default async function AdminMembersPage() {
  const isAdmin = await getAdminSession();
  if (!isAdmin) redirect("/admin/login");

  const members = await getAllMembers();
  const initialMembers = members.map(toPublic);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-800">会員管理</h1>
            <p className="text-sm text-gray-400 mt-0.5">{initialMembers.length}名登録中</p>
          </div>
          <form action="/api/admin/auth/logout" method="POST">
            <button
              type="submit"
              className="text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg px-3 py-1.5 bg-white"
            >
              ログアウト
            </button>
          </form>
        </div>

        <AdminMembersUI initialMembers={initialMembers} />
      </div>
    </div>
  );
}
