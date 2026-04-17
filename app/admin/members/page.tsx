import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";
import { getAllMembers, toPublic } from "@/lib/members";
import { getLiveStatus } from "@/lib/live-status";
import { getAllNewsletters } from "@/lib/newsletter-store";
import AdminMembersUI from "@/components/AdminMembersUI";
import AdminNewslettersUI from "@/components/AdminNewslettersUI";
import LiveToggle from "@/components/LiveToggle";

export const dynamic = "force-dynamic";

export default async function AdminMembersPage() {
  const isAdmin = await getAdminSession();
  if (!isAdmin) redirect("/admin/login");

  const [members, liveStatus, newsletters] = await Promise.all([
    getAllMembers(),
    getLiveStatus(),
    getAllNewsletters(),
  ]);
  const initialMembers = members.map(toPublic);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-800">管理画面</h1>
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

        {/* Live status toggle */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6 shadow-sm">
          <h2 className="text-base font-bold text-gray-700 mb-1">Pococha 配信ステータス</h2>
          <p className="text-xs text-gray-400 mb-4">配信状態は自動検出されます。検出できない場合は手動でONにしてください。ONにすると自動検出より優先されます。</p>
          <LiveToggle initialLive={liveStatus} />
        </div>

        {/* Members */}
        <div className="mb-2">
          <h2 className="text-base font-bold text-gray-700">会員管理</h2>
          <p className="text-sm text-gray-400 mt-0.5">{initialMembers.length}名登録中</p>
        </div>
        <AdminMembersUI initialMembers={initialMembers} />

        {/* Newsletters */}
        <div className="mt-8 mb-2">
          <h2 className="text-base font-bold text-gray-700">会報管理</h2>
          <p className="text-sm text-gray-400 mt-0.5">{newsletters.length}件登録中</p>
        </div>
        <AdminNewslettersUI initialNewsletters={newsletters} />
      </div>
    </div>
  );
}
