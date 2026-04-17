"use client";

import { useState, useMemo } from "react";

interface Member {
  memberNumber: string;
  name: string;
  joinedAt: string;
  active: boolean;
  renewalMonth?: number;
}

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

export default function AdminMembersUI({ initialMembers }: { initialMembers: Member[] }) {
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Search / filter state
  const [nameQuery, setNameQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [thisMonthOnly, setThisMonthOnly] = useState(false);

  // Add form
  const [addNum, setAddNum] = useState("");
  const [addName, setAddName] = useState("");
  const [addPass, setAddPass] = useState("");
  const [addLoading, setAddLoading] = useState(false);

  // Edit form
  const [editName, setEditName] = useState("");
  const [editPass, setEditPass] = useState("");
  const [editActive, setEditActive] = useState(true);
  const [editRenewalMonth, setEditRenewalMonth] = useState<number | "">("");
  const [editLoading, setEditLoading] = useState(false);

  const currentMonth = new Date().getMonth() + 1;

  const filtered = useMemo(() => {
    return members.filter((m) => {
      if (nameQuery && !m.name.includes(nameQuery)) return false;
      if (statusFilter === "active" && !m.active) return false;
      if (statusFilter === "inactive" && m.active) return false;
      if (thisMonthOnly && m.renewalMonth !== currentMonth) return false;
      return true;
    });
  }, [members, nameQuery, statusFilter, thisMonthOnly, currentMonth]);

  function startEdit(m: Member) {
    setEditingId(m.memberNumber);
    setEditName(m.name);
    setEditActive(m.active);
    setEditPass("");
    setEditRenewalMonth(m.renewalMonth ?? "");
    setGlobalError(null);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setAddLoading(true);
    setGlobalError(null);
    try {
      const res = await fetch("/api/admin/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberNumber: addNum, name: addName, password: addPass }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "エラーが発生しました");
      setMembers((prev) => [...prev, data.member]);
      setShowAddForm(false);
      setAddNum("");
      setAddName("");
      setAddPass("");
    } catch (err: unknown) {
      setGlobalError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setAddLoading(false);
    }
  }

  async function handleEdit(e: React.FormEvent, memberNumber: string) {
    e.preventDefault();
    setEditLoading(true);
    setGlobalError(null);
    try {
      const body: Record<string, unknown> = {
        name: editName,
        active: editActive,
        renewalMonth: editRenewalMonth === "" ? null : Number(editRenewalMonth),
      };
      if (editPass) body.password = editPass;
      const res = await fetch(`/api/admin/members/${memberNumber}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "エラーが発生しました");
      setMembers((prev) => prev.map((m) => (m.memberNumber === memberNumber ? data.member : m)));
      setEditingId(null);
    } catch (err: unknown) {
      setGlobalError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setEditLoading(false);
    }
  }

  async function handleDelete(memberNumber: string, name: string) {
    if (!confirm(`「${name}（${memberNumber}）」を削除しますか？\nこの操作は取り消せません。`)) return;
    setGlobalError(null);
    try {
      const res = await fetch(`/api/admin/members/${memberNumber}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "エラーが発生しました");
      }
      setMembers((prev) => prev.filter((m) => m.memberNumber !== memberNumber));
      if (editingId === memberNumber) setEditingId(null);
    } catch (err: unknown) {
      setGlobalError(err instanceof Error ? err.message : "エラーが発生しました");
    }
  }

  return (
    <div className="space-y-4">
      {/* Global error */}
      {globalError && (
        <div className="flex items-center justify-between bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
          <span>{globalError}</span>
          <button onClick={() => setGlobalError(null)} className="ml-3 text-red-400 hover:text-red-600">✕</button>
        </div>
      )}

      {/* Search / filter bar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
        {/* Name search */}
        <input
          type="text"
          placeholder="名前で検索..."
          value={nameQuery}
          onChange={(e) => setNameQuery(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200"
        />

        <div className="flex flex-wrap gap-2 items-center">
          {/* Status filter */}
          {(["all", "active", "inactive"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setStatusFilter(v)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors ${
                statusFilter === v
                  ? "bg-pink-500 text-white"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              {v === "all" ? "すべて" : v === "active" ? "有効" : "無効"}
            </button>
          ))}

          {/* This-month renewal toggle */}
          <button
            onClick={() => setThisMonthOnly((v) => !v)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors ${
              thisMonthOnly
                ? "bg-amber-400 text-white"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
          >
            {currentMonth}月更新のみ
          </button>

          <span className="ml-auto text-xs text-gray-400">
            {filtered.length} / {members.length} 名
          </span>
        </div>
      </div>

      {/* Member table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 font-semibold text-xs uppercase tracking-wide">
              <th className="text-left px-5 py-3">会員番号</th>
              <th className="text-left px-5 py-3">名前</th>
              <th className="text-left px-5 py-3 hidden sm:table-cell">登録日</th>
              <th className="text-left px-5 py-3">状態</th>
              <th className="text-left px-4 py-3 hidden sm:table-cell">更新月</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-gray-400 text-sm">
                  {members.length === 0 ? "会員が登録されていません" : "条件に一致する会員がいません"}
                </td>
              </tr>
            )}

            {filtered.map((member) =>
              editingId === member.memberNumber ? (
                /* ── Edit row ── */
                <tr key={member.memberNumber} className="border-b border-gray-100 bg-pink-50/40">
                  <td className="px-5 py-4 font-mono text-xs text-gray-500 align-top pt-5">
                    {member.memberNumber}
                  </td>
                  <td className="px-5 py-4" colSpan={5}>
                    <form onSubmit={(e) => handleEdit(e, member.memberNumber)}>
                      <div className="flex flex-wrap gap-2 items-end">
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">名前</label>
                          <input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            required
                            className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-36 focus:outline-none focus:ring-2 focus:ring-pink-200"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">
                            新パスワード<span className="text-gray-300">（空欄で変更なし）</span>
                          </label>
                          <input
                            type="password"
                            value={editPass}
                            onChange={(e) => setEditPass(e.target.value)}
                            placeholder="変更しない場合は空欄"
                            className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-44 focus:outline-none focus:ring-2 focus:ring-pink-200"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">更新月</label>
                          <select
                            value={editRenewalMonth}
                            onChange={(e) => setEditRenewalMonth(e.target.value === "" ? "" : Number(e.target.value))}
                            className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-24 focus:outline-none focus:ring-2 focus:ring-pink-200"
                          >
                            <option value="">なし</option>
                            {MONTHS.map((m) => (
                              <option key={m} value={m}>{m}月</option>
                            ))}
                          </select>
                        </div>
                        <label className="flex items-center gap-1.5 text-sm text-gray-600 mb-0.5">
                          <input
                            type="checkbox"
                            checked={editActive}
                            onChange={(e) => setEditActive(e.target.checked)}
                            className="accent-pink-500"
                          />
                          有効
                        </label>
                        <div className="flex gap-2">
                          <button
                            type="submit"
                            disabled={editLoading}
                            className="px-4 py-2 bg-pink-500 text-white rounded-xl text-sm font-medium disabled:opacity-60"
                          >
                            {editLoading ? "保存中..." : "保存"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-500 bg-white"
                          >
                            キャンセル
                          </button>
                        </div>
                      </div>
                    </form>
                  </td>
                </tr>
              ) : (
                /* ── Normal row ── */
                <tr key={member.memberNumber} className="border-b border-gray-100 hover:bg-gray-50/60 transition-colors">
                  <td className="px-5 py-4 font-mono text-sm text-gray-600">{member.memberNumber}</td>
                  <td className="px-5 py-4 font-medium text-gray-800">
                    <span>{member.name}</span>
                    {member.renewalMonth === currentMonth && (
                      <span className="ml-2 inline-block px-1.5 py-0.5 bg-amber-100 text-amber-600 rounded text-xs font-medium">
                        今月更新
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-gray-400 text-xs hidden sm:table-cell">
                    {new Date(member.joinedAt).toLocaleDateString("ja-JP")}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        member.active
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {member.active ? "有効" : "無効"}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-xs text-gray-400 hidden sm:table-cell">
                    {member.renewalMonth ? `${member.renewalMonth}月` : "—"}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => startEdit(member)}
                        className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
                      >
                        編集
                      </button>
                      <button
                        onClick={() => handleDelete(member.memberNumber, member.name)}
                        className="px-3 py-1.5 text-xs border border-red-200 text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        削除
                      </button>
                    </div>
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>

      {/* Add member form */}
      {showAddForm ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-semibold text-gray-700 mb-4 text-sm">新規会員を追加</h3>
          <form onSubmit={handleAdd}>
            <div className="flex flex-wrap gap-3 items-end">
              <div>
                <label className="block text-xs text-gray-400 mb-1">会員番号</label>
                <input
                  value={addNum}
                  onChange={(e) => setAddNum(e.target.value)}
                  placeholder="FC003"
                  required
                  className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm w-28 focus:outline-none focus:ring-2 focus:ring-pink-200"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">名前</label>
                <input
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  placeholder="山田花子"
                  required
                  className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm w-40 focus:outline-none focus:ring-2 focus:ring-pink-200"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">パスワード</label>
                <input
                  type="password"
                  value={addPass}
                  onChange={(e) => setAddPass(e.target.value)}
                  placeholder="6文字以上"
                  required
                  minLength={6}
                  className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm w-44 focus:outline-none focus:ring-2 focus:ring-pink-200"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={addLoading}
                  className="px-5 py-2.5 bg-pink-500 text-white rounded-xl text-sm font-semibold disabled:opacity-60 hover:bg-pink-600 transition-colors"
                >
                  {addLoading ? "追加中..." : "追加"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-5 py-2.5 border border-gray-200 text-gray-500 rounded-xl text-sm bg-white hover:bg-gray-50 transition-colors"
                >
                  キャンセル
                </button>
              </div>
            </div>
          </form>
        </div>
      ) : (
        <button
          onClick={() => { setShowAddForm(true); setGlobalError(null); }}
          className="w-full py-3.5 border-2 border-dashed border-pink-200 rounded-2xl text-pink-400 text-sm font-medium hover:border-pink-300 hover:text-pink-500 transition-colors"
        >
          ＋ 新規会員を追加
        </button>
      )}
    </div>
  );
}
