"use client";

import { useEffect, useRef, useState } from "react";

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

// ---- メインコンポーネント ----

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loading, setLoading] = useState(true);

  const [members, setMembers] = useState<Member[]>([]);
  const [backups, setBackups] = useState<BackupEntry[]>([]);
  const [tab, setTab] = useState<"members" | "backup">("members");

  // 会員編集モーダル
  const [editMember, setEditMember] = useState<Member | null>(null);
  const [editForm, setEditForm] = useState<Partial<Member>>({});
  const [editSaving, setEditSaving] = useState(false);

  // 振込確認モーダル
  const [confirmMember, setConfirmMember] = useState<Member | null>(null);
  const [confirmDate, setConfirmDate] = useState(today());
  const [confirming, setConfirming] = useState(false);

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
    // ログイン済みかどうか確認（バックアップ一覧が取れるかで判断）
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
    const [mRes, bRes] = await Promise.all([
      fetch("/api/admin/members"),
      fetch("/api/admin/backup"),
    ]);
    if (mRes.ok) setMembers(await mRes.json());
    if (bRes.ok) setBackups(await bRes.json());
  }

  // ---- 振込確認 ----
  function openConfirm(m: Member) {
    setConfirmMember(m);
    setConfirmDate(today());
  }

  async function handleTransferConfirm() {
    if (!confirmMember) return;
    setConfirming(true);
    const res = await fetch("/api/admin/transfer-confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        memberNumber: confirmMember.memberNumber,
        paymentDate: confirmDate,
      }),
    });
    if (res.ok) {
      const updated: Member = await res.json();
      setMembers((prev) =>
        prev.map((m) => (m.memberNumber === updated.memberNumber ? updated : m))
      );
      setConfirmMember(null);
    }
    setConfirming(false);
  }

  // ---- 会員編集 ----
  function openEdit(m: Member) {
    setEditMember(m);
    setEditForm({ ...m });
  }

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
    if (!confirm(`${editMember.name}（${editMember.memberNumber}）を削除しますか？`))
      return;
    const res = await fetch("/api/admin/members", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberNumber: editMember.memberNumber }),
    });
    if (res.ok) {
      setMembers((prev) =>
        prev.filter((m) => m.memberNumber !== editMember.memberNumber)
      );
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
      setNewForm({
        isActive: true,
        joinDate: today(),
        lastPaymentDate: null,
        nextPaymentDate: null,
      });
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

    const res = await fetch("/api/admin/import-csv", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    if (res.ok) {
      setCsvMsg(
        `インポート完了: 追加 ${data.added}件、更新 ${data.updated}件、スキップ ${data.skipped}件（合計 ${data.total}件）`
      );
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

  // ---- 差分インポート ----
  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportMsg("");

    const text = await file.text();
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
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
      setImportMsg(
        `インポート完了: 追加 ${data.added.length}件、更新 ${data.updated.length}件、スキップ ${data.skipped.length}件`
      );
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
            {loginError && (
              <p className="text-red-500 text-xs text-center">{loginError}</p>
            )}
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
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <h1 className="font-bold text-base">管理者ページ</h1>
        <button
          onClick={handleLogout}
          className="text-xs text-gray-500 border border-gray-200 rounded-full px-3 py-1.5 active:bg-gray-50"
        >
          ログアウト
        </button>
      </div>

      {/* タブ */}
      <div className="flex border-b border-gray-200 bg-white">
        {(["members", "backup"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              tab === t
                ? "text-pink-500 border-b-2 border-pink-500"
                : "text-gray-500"
            }`}
          >
            {t === "members" ? "会員管理" : "データ管理"}
          </button>
        ))}
      </div>

      <div className="p-4">
        {/* ====== 会員管理タブ ====== */}
        {tab === "members" && (
          <div className="space-y-3">
            {/* 統計 */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "総会員数", value: members.length },
                { label: "有効", value: members.filter((m) => m.isActive).length },
                {
                  label: "期限切れ",
                  value: members.filter(
                    (m) => m.isActive && isOverdue(m.nextPaymentDate)
                  ).length,
                },
              ].map((s) => (
                <div
                  key={s.label}
                  className="bg-white rounded-xl p-3 border border-gray-100 text-center"
                >
                  <p className="text-2xl font-bold text-pink-500">{s.value}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            {/* 会員追加ボタン */}
            <button
              onClick={() => setShowAdd(true)}
              className="w-full py-2.5 rounded-xl border-2 border-dashed border-pink-200 text-sm text-pink-400 font-medium active:bg-pink-50"
            >
              ＋ 会員を追加
            </button>

            {/* 会員リスト */}
            {members.length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-8">
                会員データがありません
              </p>
            ) : (
              <div className="space-y-2">
                {members.map((m) => (
                  <div
                    key={m.memberNumber}
                    className="bg-white rounded-xl border border-gray-100 p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <button
                          onClick={() => openEdit(m)}
                          className="text-sm font-bold text-pink-600 underline decoration-dotted text-left"
                        >
                          {m.name || m.memberNumber}
                        </button>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {m.memberNumber}
                          {m.email && ` ・ ${m.email}`}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-500">
                          <span>最終振込: {fmtDate(m.lastPaymentDate)}</span>
                          <span>次回: {fmtDate(m.nextPaymentDate)}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            m.isActive
                              ? isOverdue(m.nextPaymentDate)
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {m.isActive
                            ? isOverdue(m.nextPaymentDate)
                              ? "期限切れ"
                              : "有効"
                            : "無効"}
                        </span>
                        <button
                          onClick={() => openConfirm(m)}
                          className="text-xs bg-blue-50 text-blue-600 border border-blue-200 rounded-lg px-2.5 py-1 font-medium active:bg-blue-100"
                        >
                          振込確認
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ====== データ管理タブ ====== */}
        {tab === "backup" && (
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
                データが消えた場合にお試しください。
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
                CSVファイルから会員データを一括登録します。
                列の順序: 会員NO・名前・フリガナ・〒・住所・電話番号・メールアドレス・入会日(振込日)・更新日①②...・生年月日
              </p>
              <p className="text-xs text-gray-400 leading-relaxed">
                ※ パスワードは会員番号で自動設定されます。有効期限は最終振込日+1年で判定します。
              </p>
              <input
                ref={csvRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={handleCsvImport}
              />
              <button
                onClick={() => csvRef.current?.click()}
                disabled={csvWorking}
                className="w-full py-2.5 bg-green-500 text-white font-bold rounded-xl text-sm disabled:opacity-60 active:bg-green-600"
              >
                {csvWorking ? "処理中..." : "CSVファイルを選択してインポート"}
              </button>
              {csvMsg && (
                <p
                  className={`text-xs text-center ${
                    csvMsg.startsWith("インポート完了")
                      ? "text-green-600"
                      : "text-red-500"
                  }`}
                >
                  {csvMsg}
                </p>
              )}
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
              <h2 className="text-sm font-bold">差分インポート（JSON）</h2>
              <p className="text-xs text-gray-500 leading-relaxed">
                JSONファイルを選択すると、更新が新しい会員データのみ上書きします。
                インポート前に自動バックアップを作成します。
              </p>
              <input
                ref={importRef}
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={handleImport}
              />
              <button
                onClick={() => importRef.current?.click()}
                className="w-full py-2.5 border border-gray-200 text-gray-700 font-medium rounded-xl text-sm active:bg-gray-50"
              >
                JSONファイルを選択してインポート
              </button>
              {importMsg && (
                <p
                  className={`text-xs text-center ${
                    importMsg.startsWith("インポート完了")
                      ? "text-green-600"
                      : "text-red-500"
                  }`}
                >
                  {importMsg}
                </p>
              )}
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <h2 className="text-sm font-bold mb-3">
                バックアップ履歴 ({backups.length}件)
              </h2>
              {backups.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">
                  バックアップはありません
                </p>
              ) : (
                <div className="space-y-2">
                  {backups.map((b) => (
                    <div
                      key={b.id}
                      className="flex items-center justify-between gap-2 py-2 border-b border-gray-50 last:border-0"
                    >
                      <div>
                        <p className="text-xs font-medium text-gray-700">
                          {new Date(b.timestamp).toLocaleString("ja-JP")}
                        </p>
                        <p className="text-xs text-gray-400">
                          {b.memberCount}名{b.label ? ` ・ ${b.label}` : ""}
                        </p>
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
        )}
      </div>

      {/* ====== 振込確認モーダル ====== */}
      {confirmMember && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 space-y-4">
            <h2 className="font-bold text-base">振込確認</h2>
            <div className="bg-gray-50 rounded-xl p-3 text-sm">
              <p className="font-medium">{confirmMember.name}</p>
              <p className="text-gray-500 text-xs">{confirmMember.memberNumber}</p>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">振込日</label>
              <input
                type="date"
                value={confirmDate}
                onChange={(e) => setConfirmDate(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-pink-400"
              />
            </div>
            <div className="bg-blue-50 rounded-xl p-3 text-xs text-blue-700 space-y-1">
              <p>振込日: {confirmDate}</p>
              <p>次回振込日: {nextYear(confirmDate)}</p>
              <p>有効状態: 有効に変更</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmMember(null)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium active:bg-gray-50"
              >
                キャンセル
              </button>
              <button
                onClick={handleTransferConfirm}
                disabled={confirming}
                className="flex-1 py-2.5 bg-blue-500 text-white font-bold rounded-xl text-sm disabled:opacity-60 active:bg-blue-600"
              >
                {confirming ? "処理中..." : "確認する"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====== 会員編集モーダル ====== */}
      {editMember && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-sm max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between">
              <h2 className="font-bold text-base">会員情報の編集</h2>
              <button
                onClick={() => setEditMember(null)}
                className="text-gray-400 text-xl leading-none"
              >
                ✕
              </button>
            </div>
            <div className="p-5 space-y-4">
              <button
                onClick={() => {
                  setEditMember(null);
                  openConfirm(editMember);
                }}
                className="w-full py-2.5 bg-blue-50 text-blue-600 border border-blue-200 font-bold rounded-xl text-sm active:bg-blue-100"
              >
                振込確認を行う
              </button>

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
                { label: "最終振込日", key: "lastPaymentDate", type: "date" },
                { label: "次回振込日", key: "nextPaymentDate", type: "date" },
                { label: "備考", key: "notes", type: "text" },
              ].map(({ label, key, type, disabled }) => (
                <div key={key}>
                  <label className="text-xs text-gray-500 block mb-1">{label}</label>
                  <input
                    type={type}
                    value={
                      (editForm[key as keyof Member] as string | null | undefined) ?? ""
                    }
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, [key]: e.target.value || null }))
                    }
                    disabled={disabled}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-pink-400 disabled:bg-gray-50 disabled:text-gray-400"
                  />
                </div>
              ))}

              <div className="flex items-center justify-between py-2">
                <span className="text-sm font-medium">会員有効状態</span>
                <button
                  onClick={() =>
                    setEditForm((f) => ({ ...f, isActive: !f.isActive }))
                  }
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    editForm.isActive ? "bg-green-400" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                      editForm.isActive ? "translate-x-6" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>

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
              <button
                onClick={() => setShowAdd(false)}
                className="text-gray-400 text-xl leading-none"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleAddMember} className="p-5 space-y-4">
              {[
                { label: "会員番号 *", key: "memberNumber", type: "text", required: true },
                { label: "氏名 *", key: "name", type: "text", required: true },
                { label: "メールアドレス", key: "email", type: "email" },
                { label: "パスワード *", key: "password", type: "text", required: true },
                { label: "入会日", key: "joinDate", type: "date" },
                { label: "最終振込日", key: "lastPaymentDate", type: "date" },
                { label: "次回振込日", key: "nextPaymentDate", type: "date" },
                { label: "備考", key: "notes", type: "text" },
              ].map(({ label, key, type, required }) => (
                <div key={key}>
                  <label className="text-xs text-gray-500 block mb-1">{label}</label>
                  <input
                    type={type}
                    value={
                      (newForm[key as keyof Member] as string | null | undefined) ?? ""
                    }
                    onChange={(e) =>
                      setNewForm((f) => ({ ...f, [key]: e.target.value || null }))
                    }
                    required={required}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-pink-400"
                  />
                </div>
              ))}

              <div className="flex items-center justify-between py-2">
                <span className="text-sm font-medium">会員有効状態</span>
                <button
                  type="button"
                  onClick={() =>
                    setNewForm((f) => ({ ...f, isActive: !f.isActive }))
                  }
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    newForm.isActive ? "bg-green-400" : "bg-gray-300"
                  }`}
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
