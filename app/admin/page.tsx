"use client";

import { useEffect, useRef, useState } from "react";
import AdminNewslettersUI from "@/components/AdminNewslettersUI";

// ---- 型定義 ----

interface Member {
  memberNumber: string;
  name: string;
  furigana?: string;
  zipCode?: string;
  address?: string;
  phone?: string;
  email?: string;
  birthday?: string;
  password: string;
  isActive: boolean;
  joinDate: string;
  lastPaymentDate: string | null;
  nextPaymentDate: string | null;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface BackupEntry {
  id: string;
  timestamp: string;
  memberCount: number;
  label?: string;
}

interface Newsletter {
  id: string;
  vol: string;
  issue: string;
  title: string;
  gradient: string;
  coverImage: string;
  pages: string[];
}

// ---- ユーティリティ ----

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function nextYear(date: string): string {
  const d = new Date(date);
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().slice(0, 10);
}

function fmtDate(d: string | null): string {
  if (!d) return "—";
  return d;
}

function isOverdue(nextDate: string | null): boolean {
  if (!nextDate) return false;
  return nextDate < today();
}

function isThisMonth(nextDate: string | null): boolean {
  if (!nextDate) return false;
  return nextDate.startsWith(new Date().toISOString().slice(0, 7));
}

// "active" | "thisMonth" | "overdue" | "withdrawn"
function memberStatus(m: Member): "active" | "thisMonth" | "overdue" | "withdrawn" {
  if (!m.isActive) return "withdrawn";
  if (isThisMonth(m.nextPaymentDate)) return "thisMonth";
  if (isOverdue(m.nextPaymentDate)) return "overdue";
  return "active";
}

// ---- メインコンポーネント ----

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loading, setLoading] = useState(true);

  const [members, setMembers] = useState<Member[]>([]);
  const [backups, setBackups] = useState<BackupEntry[]>([]);
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [newslettersLoaded, setNewslettersLoaded] = useState(false);
  const [tab, setTab] = useState<"members" | "newsletters" | "backup">("members");
  const [memberSearch, setMemberSearch] = useState("");
  const [memberFilter, setMemberFilter] = useState<"all" | "active" | "inactive" | "thisMonth">("all");

  // 会員編集モーダル
  const [editMember, setEditMember] = useState<Member | null>(null);
  const [editForm, setEditForm] = useState<Partial<Member>>({});
  const [editSaving, setEditSaving] = useState(false);

  // 振込確認（編集モーダル内）
  const [confirmDate, setConfirmDate] = useState(today());
  const [confirming, setConfirming] = useState(false);

  // 一覧からのクイック振込確認
  const [quickConfirming, setQuickConfirming] = useState<string | null>(null);

  // 振込履歴（編集モーダル内）
  const [payHistory, setPayHistory] = useState<string[]>([]);
  const [payHistLoading, setPayHistLoading] = useState(false);
  const [deletingDate, setDeletingDate] = useState<string | null>(null);

  // 新規追加フォーム
  const [showAdd, setShowAdd] = useState(false);
  const [newForm, setNewForm] = useState<Partial<Member>>({
    isActive: true,
    joinDate: today(),
    lastPaymentDate: null,
    nextPaymentDate: null,
  });
  const [addSaving, setAddSaving] = useState(false);

  // JSONインポート
  const importRef = useRef<HTMLInputElement>(null);
  const [importMsg, setImportMsg] = useState("");

  // CSVインポート
  const csvRef = useRef<HTMLInputElement>(null);
  const [csvMsg, setCsvMsg] = useState("");
  const [csvWorking, setCsvWorking] = useState(false);

  // バックアップ作成中
  const [backupWorking, setBackupWorking] = useState(false);

  // KV→Redis 移行
  const [migrateMsg, setMigrateMsg] = useState("");
  const [migrating, setMigrating] = useState(false);

  // ---- セッション確認 ----
  useEffect(() => {
    fetch("/api/admin/backup").then(async (res) => {
      if (res.ok) {
        setAuthed(true);
        await loadAll();
      }
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- ログイン ----
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError("");
    const res = await fetch("/api/admin/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      setAuthed(true);
      await loadAll();
    } else {
      const data = await res.json();
      setLoginError(data.error ?? "ログインに失敗しました");
    }
  }

  async function handleLogout() {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    setAuthed(false);
    setMembers([]);
    setBackups([]);
  }

  // ---- データ読み込み ----
  async function loadAll() {
    const [mRes, bRes, nRes] = await Promise.all([
      fetch("/api/admin/members"),
      fetch("/api/admin/backup"),
      fetch("/api/admin/newsletters"),
    ]);
    if (mRes.ok) setMembers(await mRes.json());
    if (bRes.ok) setBackups(await bRes.json());
    if (nRes.ok) {
      const data = await nRes.json();
      setNewsletters(data.newsletters ?? []);
      setNewslettersLoaded(true);
    }
  }

  // ---- 会員編集モーダルを開く ----
  async function openEdit(m: Member) {
    setEditMember(m);
    setEditForm({ ...m });
    setConfirmDate(today());
    setPayHistory([]);
    setPayHistLoading(true);
    const res = await fetch(`/api/admin/payments?memberNumber=${m.memberNumber}`);
    if (res.ok) setPayHistory(await res.json());
    setPayHistLoading(false);
  }

  // ---- 一覧からのクイック振込確認（今日付け） ----
  async function handleQuickConfirm(e: React.MouseEvent, memberNumber: string, name: string) {
    e.stopPropagation();
    if (!confirm(`会員No:${memberNumber} ${name}さんの振込を今日（${today()}）で確認しますか？`)) return;
    setQuickConfirming(memberNumber);
    const res = await fetch("/api/admin/transfer-confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberNumber, paymentDate: today() }),
    });
    if (res.ok) {
      const updated: Member = await res.json();
      setMembers((prev) =>
        prev.map((m) => (m.memberNumber === updated.memberNumber ? updated : m))
      );
    }
    setQuickConfirming(null);
  }

  // ---- 振込確認（編集モーダル内） ----
  async function handleInlineConfirm() {
    if (!editMember) return;
    setConfirming(true);
    const res = await fetch("/api/admin/transfer-confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberNumber: editMember.memberNumber, paymentDate: confirmDate }),
    });
    if (res.ok) {
      const updated: Member = await res.json();
      setMembers((prev) =>
        prev.map((m) => (m.memberNumber === updated.memberNumber ? updated : m))
      );
      setEditMember(updated);
      setEditForm({ ...updated });
      // 履歴を再取得
      const hRes = await fetch(`/api/admin/payments?memberNumber=${updated.memberNumber}`);
      if (hRes.ok) setPayHistory(await hRes.json());
      setConfirmDate(today());
    }
    setConfirming(false);
  }

  // ---- 振込履歴から1件削除 ----
  async function handleDeletePayment(date: string) {
    if (!editMember) return;
    if (!confirm(`${date} の振込記録を削除しますか？`)) return;
    setDeletingDate(date);
    const res = await fetch("/api/admin/payments", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberNumber: editMember.memberNumber, date }),
    });
    if (res.ok) {
      const data: { history: string[]; member: Member | null } = await res.json();
      setPayHistory(data.history);
      if (data.member) {
        setMembers((prev) =>
          prev.map((m) => (m.memberNumber === data.member!.memberNumber ? data.member! : m))
        );
        setEditMember(data.member);
        setEditForm({ ...data.member });
      }
    }
    setDeletingDate(null);
  }

  // ---- 会員情報保存 ----
  async function handleEditSave() {
    if (!editMember) return;
    setEditSaving(true);
    const res = await fetch("/api/admin/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    if (res.ok) {
      const updated: Member = await res.json();
      setMembers((prev) =>
        prev.map((m) => (m.memberNumber === updated.memberNumber ? updated : m))
      );
      setEditMember(null);
    }
    setEditSaving(false);
  }

  async function handleDeleteMember() {
    if (!editMember) return;
    if (!confirm(`${editMember.name}（${editMember.memberNumber}）を削除しますか？`)) return;
    const res = await fetch("/api/admin/members", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberNumber: editMember.memberNumber }),
    });
    if (res.ok) {
      setMembers((prev) => prev.filter((m) => m.memberNumber !== editMember.memberNumber));
      setEditMember(null);
    }
  }

  // ---- 新規会員追加 ----
  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault();
    setAddSaving(true);
    const res = await fetch("/api/admin/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newForm),
    });
    if (res.ok) {
      const member: Member = await res.json();
      setMembers((prev) => [...prev, member]);
      setShowAdd(false);
      setNewForm({ isActive: true, joinDate: today(), lastPaymentDate: null, nextPaymentDate: null });
    }
    setAddSaving(false);
  }

  // ---- KV→Redis 移行 ----
  async function handleMigrateKV() {
    setMigrating(true);
    setMigrateMsg("");
    const res = await fetch("/api/admin/migrate-kv", { method: "POST" });
    const data = await res.json();
    if (res.ok) {
      setMigrateMsg(`移行完了: ${data.migratedCount}名（${data.members.join(", ")}）`);
      await loadAll();
    } else {
      setMigrateMsg(data.error ?? "移行に失敗しました");
    }
    setMigrating(false);
  }

  // ---- CSVインポート ----
  async function handleCsvImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvMsg("");
    setCsvWorking(true);
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/admin/import-csv", { method: "POST", body: formData });
    const data = await res.json();
    if (res.ok) {
      setCsvMsg(`インポート完了: 追加 ${data.added}件、更新 ${data.updated}件（合計 ${data.total}件）`);
      await loadAll();
    } else {
      setCsvMsg(data.error ?? "CSVインポートに失敗しました");
    }
    setCsvWorking(false);
    e.target.value = "";
  }

  // ---- バックアップ作成＆ダウンロード ----
  async function handleBackup() {
    setBackupWorking(true);
    const res = await fetch("/api/admin/backup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ download: true }),
    });
    if (res.ok) {
      const blob = await res.blob();
      const cd = res.headers.get("Content-Disposition") ?? "";
      const match = cd.match(/filename="([^"]+)"/);
      const filename = match?.[1] ?? "members-backup.json";
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      const bRes = await fetch("/api/admin/backup");
      if (bRes.ok) setBackups(await bRes.json());
    }
    setBackupWorking(false);
  }

  // ---- 差分インポート（JSON） ----
  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportMsg("");
    let parsed: unknown;
    try {
      parsed = JSON.parse(await file.text());
    } catch {
      setImportMsg("JSONの解析に失敗しました");
      return;
    }
    const res = await fetch("/api/admin/backup/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed),
    });
    const data = await res.json();
    if (res.ok) {
      setImportMsg(`インポート完了: 追加 ${data.added.length}件、更新 ${data.updated.length}件、スキップ ${data.skipped.length}件`);
      await loadAll();
    } else {
      setImportMsg(data.error ?? "インポートに失敗しました");
    }
    e.target.value = "";
  }

  // ---- ローディング中 ----
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="text-gray-400 text-sm">読み込み中...</span>
      </div>
    );
  }

  // ---- ログインフォーム ----
  if (!authed) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 w-full max-w-sm">
          <h1 className="text-xl font-bold text-center mb-6">管理者ログイン</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              placeholder="管理者パスワード"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-pink-400"
              autoFocus
            />
            {loginError && <p className="text-red-500 text-xs text-center">{loginError}</p>}
            <button
              type="submit"
              className="w-full bg-pink-400 text-white font-bold py-3 rounded-xl text-sm active:bg-pink-500"
            >
              ログイン
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ---- 管理者ダッシュボード ----
  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* ヘッダー */}
      <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between flex-shrink-0 z-10">
        <h1 className="font-bold text-sm">管理者ページ</h1>
        <button
          onClick={handleLogout}
          className="text-xs text-gray-500 border border-gray-200 rounded-full px-3 py-1 active:bg-gray-50"
        >
          ログアウト
        </button>
      </div>

      {/* タブ */}
      <div className="flex border-b border-gray-200 bg-white flex-shrink-0">
        {(["members", "newsletters", "backup"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              tab === t ? "text-pink-500 border-b-2 border-pink-500" : "text-gray-500"
            }`}
          >
            {t === "members" ? "会員管理" : t === "newsletters" ? "会報管理" : "データ管理"}
          </button>
        ))}
      </div>

      {/* ====== 会員管理タブ ====== */}
      {tab === "members" && (
        <>
          {/* コントロール（スクロールしない固定エリア） */}
          <div className="flex-shrink-0 px-3 pt-2 pb-1.5 space-y-1.5 bg-gray-50">
            {/* 統計 */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "総会員数", value: members.length },
                { label: "有効", value: members.filter((m) => memberStatus(m) === "active" || memberStatus(m) === "thisMonth").length },
                { label: "無効", value: members.filter((m) => memberStatus(m) === "overdue" || memberStatus(m) === "withdrawn").length },
              ].map((s) => (
                <div key={s.label} className="bg-white rounded-xl p-2 border border-gray-100 text-center">
                  <p className="text-xl font-bold text-pink-500">{s.value}</p>
                  <p className="text-xs text-gray-400">{s.label}</p>
                </div>
              ))}
            </div>

            {/* 検索 */}
            <input
              type="text"
              placeholder="会員番号・名前・フリガナで絞り込み"
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-pink-400"
            />

            {/* 絞り込みボタン */}
            <div className="flex gap-1.5">
              {(
                [
                  { key: "all",       label: "すべて" },
                  { key: "active",    label: "有効" },
                  { key: "inactive",  label: "無効" },
                  { key: "thisMonth", label: "今月更新" },
                ] as const
              ).map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setMemberFilter(key)}
                  className={`flex-1 py-1 rounded-full text-xs font-medium border transition-colors ${
                    memberFilter === key
                      ? "bg-pink-400 text-white border-pink-400"
                      : "bg-white text-gray-500 border-gray-200 active:bg-gray-50"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* 会員追加ボタン */}
            <button
              onClick={() => setShowAdd(true)}
              className="w-full py-1.5 rounded-xl border-2 border-dashed border-pink-200 text-sm text-pink-400 font-medium active:bg-pink-50"
            >
              ＋ 会員を追加
            </button>
          </div>

          {/* テーブル（ここだけスクロール、ヘッダー固定） */}
          {members.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-8">会員データがありません</p>
          ) : (
            <div className="flex-1 min-h-0 overflow-auto mx-3 mb-3 bg-white rounded-xl border border-gray-100">
              <table className="w-full text-sm min-w-[560px]">
                <thead className="sticky top-0 z-10 bg-gray-50">
                  <tr className="border-b border-gray-100">
                    <th className="text-left px-3 py-2 text-xs font-medium text-gray-500 whitespace-nowrap">会員NO</th>
                    <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">氏名</th>
                    <th className="text-left px-3 py-2 text-xs font-medium text-gray-500 whitespace-nowrap">最終振込日</th>
                    <th className="text-left px-3 py-2 text-xs font-medium text-gray-500 whitespace-nowrap">次回振込日</th>
                    <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">状態</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {members
                    .slice()
                    .sort((a, b) => a.memberNumber.localeCompare(b.memberNumber, "ja"))
                    .filter((m) => {
                      if (memberSearch) {
                        const q = memberSearch.toLowerCase();
                        const matchText =
                          m.memberNumber.toLowerCase().includes(q) ||
                          m.name.toLowerCase().includes(q) ||
                          (m.furigana ?? "").toLowerCase().includes(q);
                        if (!matchText) return false;
                      }
                      if (memberFilter === "active") return memberStatus(m) === "active" || memberStatus(m) === "thisMonth";
                      if (memberFilter === "inactive") return memberStatus(m) === "overdue" || memberStatus(m) === "withdrawn";
                      if (memberFilter === "thisMonth") {
                        if (!m.isActive || !m.nextPaymentDate) return false;
                        const ym = new Date().toISOString().slice(0, 7);
                        return m.nextPaymentDate.startsWith(ym);
                      }
                      return true;
                    })
                    .map((m) => (
                      <tr
                        key={m.memberNumber}
                        onClick={() => openEdit(m)}
                        className="border-b border-gray-50 last:border-0 hover:bg-pink-50 active:bg-pink-50 cursor-pointer"
                      >
                        <td className="px-3 py-2 text-xs text-gray-500 whitespace-nowrap">{m.memberNumber}</td>
                        <td className="px-3 py-2 font-medium text-pink-600 whitespace-nowrap">{m.name}</td>
                        <td className="px-3 py-2 text-xs text-gray-700 whitespace-nowrap">{fmtDate(m.lastPaymentDate)}</td>
                        <td className="px-3 py-2 text-xs text-gray-700 whitespace-nowrap">{fmtDate(m.nextPaymentDate)}</td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          {(() => {
                            const s = memberStatus(m);
                            const label =
                              s === "active" ? "有効" :
                              s === "thisMonth" ? "今月期限" :
                              s === "withdrawn" ? "退会済" : "無効";
                            const cls =
                              s === "active" ? "bg-green-100 text-green-700" :
                              s === "thisMonth" ? "bg-yellow-100 text-yellow-700" :
                              s === "withdrawn" ? "bg-red-100 text-red-500" :
                              "bg-gray-100 text-gray-500";
                            return (
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cls}`}>
                                {label}
                              </span>
                            );
                          })()}
                        </td>
                        <td className="px-2 py-1.5 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={(e) => handleQuickConfirm(e, m.memberNumber, m.name)}
                            disabled={quickConfirming === m.memberNumber}
                            className="text-xs px-2 py-1 bg-blue-500 text-white rounded-lg disabled:opacity-50 active:bg-blue-600 whitespace-nowrap"
                          >
                            {quickConfirming === m.memberNumber ? "…" : "振込確認"}
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ====== 会報管理タブ ====== */}
      {tab === "newsletters" && (
        <div className="flex-1 overflow-y-auto p-4">
          {newslettersLoaded ? (
            <AdminNewslettersUI
              key={`nl-${newsletters.length}`}
              initialNewsletters={newsletters}
            />
          ) : (
            <p className="text-center text-sm text-gray-400 py-8">読み込み中...</p>
          )}
        </div>
      )}

      {/* ====== データ管理タブ ====== */}
      {tab === "backup" && (
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
              <h2 className="text-sm font-bold">バックアップ</h2>
              <p className="text-xs text-gray-500 leading-relaxed">
                Redisのバックアップ用キーに複製し、同時にJSONファイルをダウンロードします。
              </p>
              <button
                onClick={handleBackup}
                disabled={backupWorking}
                className="w-full py-2.5 bg-pink-400 text-white font-bold rounded-xl text-sm disabled:opacity-60 active:bg-pink-500"
              >
                {backupWorking ? "処理中..." : "バックアップ作成＆ダウンロード"}
              </button>
            </div>

            {/* KV→Redis 移行 */}
            <div className="bg-yellow-50 rounded-xl border border-yellow-200 p-4 space-y-3">
              <h2 className="text-sm font-bold text-yellow-800">データ復元（KV→Redis 移行）</h2>
              <p className="text-xs text-yellow-700 leading-relaxed">
                以前 Vercel KV に保存されていたデータを Redis に移行します。
              </p>
              <button
                onClick={handleMigrateKV}
                disabled={migrating}
                className="w-full py-2.5 bg-yellow-400 text-white font-bold rounded-xl text-sm disabled:opacity-60 active:bg-yellow-500"
              >
                {migrating ? "移行中..." : "KVからデータを復元する"}
              </button>
              {migrateMsg && (
                <p className={`text-xs text-center ${migrateMsg.startsWith("移行完了") ? "text-green-600" : "text-red-500"}`}>
                  {migrateMsg}
                </p>
              )}
            </div>

            {/* CSVインポート */}
            <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
              <h2 className="text-sm font-bold">CSVインポート</h2>
              <p className="text-xs text-gray-500 leading-relaxed">
                CSVファイルから会員データを一括登録します。振込履歴も別テーブルに保存します。
              </p>
              <p className="text-xs text-gray-400 leading-relaxed">
                ※ パスワードは生年月日8桁（YYYYMMDD）、生年月日なしの場合は会員番号を設定します。
              </p>
              <input ref={csvRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleCsvImport} />
              <button
                onClick={() => csvRef.current?.click()}
                disabled={csvWorking}
                className="w-full py-2.5 bg-green-500 text-white font-bold rounded-xl text-sm disabled:opacity-60 active:bg-green-600"
              >
                {csvWorking ? "処理中..." : "CSVファイルを選択してインポート"}
              </button>
              {csvMsg && (
                <p className={`text-xs text-center ${csvMsg.startsWith("インポート完了") ? "text-green-600" : "text-red-500"}`}>
                  {csvMsg}
                </p>
              )}
            </div>

            {/* JSON差分インポート */}
            <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
              <h2 className="text-sm font-bold">差分インポート（JSON）</h2>
              <p className="text-xs text-gray-500 leading-relaxed">
                JSONファイルを選択すると、更新が新しい会員データのみ上書きします。
              </p>
              <input ref={importRef} type="file" accept="application/json,.json" className="hidden" onChange={handleImport} />
              <button
                onClick={() => importRef.current?.click()}
                className="w-full py-2.5 border border-gray-200 text-gray-700 font-medium rounded-xl text-sm active:bg-gray-50"
              >
                JSONファイルを選択してインポート
              </button>
              {importMsg && (
                <p className={`text-xs text-center ${importMsg.startsWith("インポート完了") ? "text-green-600" : "text-red-500"}`}>
                  {importMsg}
                </p>
              )}
            </div>

            {/* バックアップ履歴 */}
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <h2 className="text-sm font-bold mb-3">バックアップ履歴 ({backups.length}件)</h2>
              {backups.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">バックアップはありません</p>
              ) : (
                <div className="space-y-2">
                  {backups.map((b) => (
                    <div key={b.id} className="flex items-center justify-between gap-2 py-2 border-b border-gray-50 last:border-0">
                      <div>
                        <p className="text-xs font-medium text-gray-700">
                          {new Date(b.timestamp).toLocaleString("ja-JP")}
                        </p>
                        <p className="text-xs text-gray-400">{b.memberCount}名{b.label ? ` ・ ${b.label}` : ""}</p>
                      </div>
                      <a
                        href={`/api/admin/backup?id=${b.id}`}
                        download
                        className="text-xs text-blue-500 border border-blue-200 rounded-lg px-2.5 py-1 active:bg-blue-50"
                      >
                        DL
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ====== 会員編集モーダル（名前タップで開く） ====== */}
      {editMember && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-sm max-h-[90vh] overflow-y-auto">
            {/* ヘッダー */}
            <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between z-10">
              <div>
                <p className="font-bold text-base">{editMember.name}</p>
                <p className="text-xs text-gray-400">{editMember.memberNumber}</p>
              </div>
              <button onClick={() => setEditMember(null)} className="text-gray-400 text-xl leading-none">✕</button>
            </div>

            <div className="p-5 space-y-5">
              {/* ── 振込確認 ── */}
              <div className="bg-blue-50 rounded-xl p-4 space-y-3 border border-blue-100">
                <p className="text-xs font-bold text-blue-700">振込確認</p>
                <div>
                  <label className="text-xs text-blue-600 block mb-1">振込日</label>
                  <input
                    type="date"
                    value={confirmDate}
                    onChange={(e) => setConfirmDate(e.target.value)}
                    className="w-full border border-blue-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400 bg-white"
                  />
                </div>
                <p className="text-xs text-blue-600">次回振込日: {confirmDate ? nextYear(confirmDate) : "—"}</p>
                <button
                  onClick={handleInlineConfirm}
                  disabled={confirming || !confirmDate}
                  className="w-full py-2 bg-blue-500 text-white font-bold rounded-xl text-sm disabled:opacity-60 active:bg-blue-600"
                >
                  {confirming ? "処理中..." : "振込確認する"}
                </button>
              </div>

              {/* ── 振込履歴 ── */}
              <div>
                <p className="text-xs font-bold text-gray-500 mb-2">振込履歴</p>
                {payHistLoading ? (
                  <p className="text-xs text-gray-400 text-center py-2">読み込み中...</p>
                ) : payHistory.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-2">履歴がありません</p>
                ) : (
                  <div className="space-y-1">
                    {[...payHistory].reverse().map((date) => (
                      <div key={date} className="flex items-center justify-between py-1.5 border-b border-gray-50">
                        <span className="text-sm text-gray-700">{date}</span>
                        <button
                          onClick={() => handleDeletePayment(date)}
                          disabled={deletingDate === date}
                          className="text-xs text-red-400 border border-red-200 rounded-lg px-2 py-0.5 active:bg-red-50 disabled:opacity-50"
                        >
                          {deletingDate === date ? "..." : "削除"}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ── 基本情報 ── */}
              <div className="space-y-4">
                <p className="text-xs font-bold text-gray-500">基本情報</p>

                {[
                  { label: "会員番号", key: "memberNumber", type: "text", disabled: true },
                  { label: "氏名", key: "name", type: "text" },
                  { label: "フリガナ", key: "furigana", type: "text" },
                  { label: "郵便番号", key: "zipCode", type: "text" },
                  { label: "住所", key: "address", type: "text" },
                  { label: "電話番号", key: "phone", type: "tel" },
                  { label: "メールアドレス", key: "email", type: "email" },
                  { label: "生年月日", key: "birthday", type: "date" },
                  { label: "パスワード", key: "password", type: "text" },
                  { label: "入会日", key: "joinDate", type: "date" },
                  { label: "備考", key: "notes", type: "text" },
                ].map(({ label, key, type, disabled }) => (
                  <div key={key}>
                    <label className="text-xs text-gray-500 block mb-1">{label}</label>
                    <input
                      type={type}
                      value={(editForm[key as keyof Member] as string | null | undefined) ?? ""}
                      onChange={(e) => setEditForm((f) => ({ ...f, [key]: e.target.value || null }))}
                      disabled={disabled}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-pink-400 disabled:bg-gray-50 disabled:text-gray-400"
                    />
                  </div>
                ))}

                {/* 有効状態トグル */}
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm font-medium">会員有効状態</span>
                  <button
                    onClick={() => setEditForm((f) => ({ ...f, isActive: !f.isActive }))}
                    className={`relative w-12 h-6 rounded-full transition-colors ${editForm.isActive ? "bg-green-400" : "bg-gray-300"}`}
                  >
                    <span
                      className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                        editForm.isActive ? "translate-x-6" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* 操作ボタン */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleDeleteMember}
                  className="px-4 py-2.5 border border-red-200 text-red-500 rounded-xl text-sm font-medium active:bg-red-50"
                >
                  削除
                </button>
                <button
                  onClick={handleEditSave}
                  disabled={editSaving}
                  className="flex-1 py-2.5 bg-pink-400 text-white font-bold rounded-xl text-sm disabled:opacity-60 active:bg-pink-500"
                >
                  {editSaving ? "保存中..." : "保存する"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====== 新規会員追加モーダル ====== */}
      {showAdd && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-sm max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between">
              <h2 className="font-bold text-base">会員を追加</h2>
              <button onClick={() => setShowAdd(false)} className="text-gray-400 text-xl leading-none">✕</button>
            </div>
            <form onSubmit={handleAddMember} className="p-5 space-y-4">
              {[
                { label: "会員番号 *", key: "memberNumber", type: "text", required: true },
                { label: "氏名 *", key: "name", type: "text", required: true },
                { label: "フリガナ", key: "furigana", type: "text" },
                { label: "郵便番号", key: "zipCode", type: "text" },
                { label: "住所", key: "address", type: "text" },
                { label: "電話番号", key: "phone", type: "tel" },
                { label: "メールアドレス", key: "email", type: "email" },
                { label: "生年月日", key: "birthday", type: "date" },
                { label: "パスワード *", key: "password", type: "text", required: true },
                { label: "入会日", key: "joinDate", type: "date" },
                { label: "備考", key: "notes", type: "text" },
              ].map(({ label, key, type, required }) => (
                <div key={key}>
                  <label className="text-xs text-gray-500 block mb-1">{label}</label>
                  <input
                    type={type}
                    value={(newForm[key as keyof Member] as string | null | undefined) ?? ""}
                    onChange={(e) => setNewForm((f) => ({ ...f, [key]: e.target.value || null }))}
                    required={required}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-pink-400"
                  />
                </div>
              ))}

              <div className="flex items-center justify-between py-2">
                <span className="text-sm font-medium">会員有効状態</span>
                <button
                  type="button"
                  onClick={() => setNewForm((f) => ({ ...f, isActive: !f.isActive }))}
                  className={`relative w-12 h-6 rounded-full transition-colors ${newForm.isActive ? "bg-green-400" : "bg-gray-300"}`}
                >
                  <span
                    className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                      newForm.isActive ? "translate-x-6" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdd(false)}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium active:bg-gray-50"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={addSaving}
                  className="flex-1 py-2.5 bg-pink-400 text-white font-bold rounded-xl text-sm disabled:opacity-60 active:bg-pink-500"
                >
                  {addSaving ? "追加中..." : "追加する"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
