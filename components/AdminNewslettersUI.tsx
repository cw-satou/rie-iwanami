"use client";

import { useState } from "react";

interface Newsletter {
  id: string;
  vol: string;
  issue: string;
  title: string;
  gradient: string;
  coverImage: string;
  pages: string[];
}

const DEFAULT_GRADIENT = "linear-gradient(135deg, #F0B8C8, #E8A0B4)";

function pagesToText(pages: string[]): string {
  return pages.join("\n");
}

function textToPages(text: string): string[] {
  return text
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function AdminNewslettersUI({
  initialNewsletters,
}: {
  initialNewsletters: Newsletter[];
}) {
  const [newsletters, setNewsletters] = useState<Newsletter[]>(initialNewsletters);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Add form state
  const [addId, setAddId] = useState("");
  const [addVol, setAddVol] = useState("");
  const [addIssue, setAddIssue] = useState("");
  const [addTitle, setAddTitle] = useState("");
  const [addGradient, setAddGradient] = useState(DEFAULT_GRADIENT);
  const [addCoverImage, setAddCoverImage] = useState("");
  const [addPages, setAddPages] = useState("");
  const [addLoading, setAddLoading] = useState(false);

  // Edit form state
  const [editVol, setEditVol] = useState("");
  const [editIssue, setEditIssue] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editGradient, setEditGradient] = useState("");
  const [editCoverImage, setEditCoverImage] = useState("");
  const [editPages, setEditPages] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  function startEdit(nl: Newsletter) {
    setEditingId(nl.id);
    setEditVol(nl.vol);
    setEditIssue(nl.issue);
    setEditTitle(nl.title);
    setEditGradient(nl.gradient);
    setEditCoverImage(nl.coverImage);
    setEditPages(pagesToText(nl.pages));
    setGlobalError(null);
  }

  function resetAddForm() {
    setAddId("");
    setAddVol("");
    setAddIssue("");
    setAddTitle("");
    setAddGradient(DEFAULT_GRADIENT);
    setAddCoverImage("");
    setAddPages("");
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setAddLoading(true);
    setGlobalError(null);
    try {
      const res = await fetch("/api/admin/newsletters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: addId,
          vol: addVol,
          issue: addIssue,
          title: addTitle,
          gradient: addGradient || DEFAULT_GRADIENT,
          coverImage: addCoverImage,
          pages: textToPages(addPages),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "エラーが発生しました");
      setNewsletters((prev) => [data.newsletter, ...prev]);
      setShowAddForm(false);
      resetAddForm();
    } catch (err: unknown) {
      setGlobalError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setAddLoading(false);
    }
  }

  async function handleEdit(e: React.FormEvent, id: string) {
    e.preventDefault();
    setEditLoading(true);
    setGlobalError(null);
    try {
      const res = await fetch(`/api/admin/newsletters/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vol: editVol,
          issue: editIssue,
          title: editTitle,
          gradient: editGradient,
          coverImage: editCoverImage,
          pages: textToPages(editPages),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "エラーが発生しました");
      setNewsletters((prev) =>
        prev.map((nl) =>
          nl.id === id
            ? {
                ...nl,
                vol: editVol,
                issue: editIssue,
                title: editTitle,
                gradient: editGradient,
                coverImage: editCoverImage,
                pages: textToPages(editPages),
              }
            : nl
        )
      );
      setEditingId(null);
    } catch (err: unknown) {
      setGlobalError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setEditLoading(false);
    }
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`「${title}」を削除しますか？\nこの操作は取り消せません。`)) return;
    setGlobalError(null);
    try {
      const res = await fetch(`/api/admin/newsletters/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "エラーが発生しました");
      }
      setNewsletters((prev) => prev.filter((nl) => nl.id !== id));
      if (editingId === id) setEditingId(null);
    } catch (err: unknown) {
      setGlobalError(err instanceof Error ? err.message : "エラーが発生しました");
    }
  }

  const inputCls =
    "border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200 w-full";

  return (
    <div className="space-y-4">
      {/* Global error */}
      {globalError && (
        <div className="flex items-center justify-between bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
          <span>{globalError}</span>
          <button
            onClick={() => setGlobalError(null)}
            className="ml-3 text-red-400 hover:text-red-600"
          >
            ✕
          </button>
        </div>
      )}

      {/* Newsletter list */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        {newsletters.length === 0 && (
          <p className="px-5 py-10 text-center text-gray-400 text-sm">
            会報が登録されていません
          </p>
        )}
        <div className="divide-y divide-gray-100">
          {newsletters.map((nl) =>
            editingId === nl.id ? (
              /* ── Edit form ── */
              <div key={nl.id} className="p-5 bg-pink-50/40">
                <p className="text-xs text-gray-400 font-mono mb-3">ID: {nl.id}</p>
                <form onSubmit={(e) => handleEdit(e, nl.id)} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Vol</label>
                      <input
                        value={editVol}
                        onChange={(e) => setEditVol(e.target.value)}
                        required
                        placeholder="Vol.19"
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">号数</label>
                      <input
                        value={editIssue}
                        onChange={(e) => setEditIssue(e.target.value)}
                        required
                        placeholder="2026年2月号"
                        className={inputCls}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">タイトル</label>
                    <input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      required
                      placeholder="岩波ミニ文庫 第19号"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">
                      グラデーション <span className="text-gray-300">（CSSのlinear-gradient）</span>
                    </label>
                    <input
                      value={editGradient}
                      onChange={(e) => setEditGradient(e.target.value)}
                      placeholder="linear-gradient(135deg, #F0B8C8, #E8A0B4)"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">表紙画像URL</label>
                    <input
                      value={editCoverImage}
                      onChange={(e) => setEditCoverImage(e.target.value)}
                      required
                      placeholder="/newsletter/vol19/page-1.jpg"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">
                      ページURL <span className="text-gray-300">（1行1URL）</span>
                    </label>
                    <textarea
                      value={editPages}
                      onChange={(e) => setEditPages(e.target.value)}
                      required
                      rows={4}
                      placeholder={"/newsletter/vol19/page-1.jpg\n/newsletter/vol19/page-2.jpg"}
                      className={`${inputCls} resize-y font-mono text-xs`}
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      {textToPages(editPages).length}ページ
                    </p>
                  </div>
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
                </form>
              </div>
            ) : (
              /* ── Normal row ── */
              <div
                key={nl.id}
                className="flex items-center justify-between px-5 py-4 hover:bg-gray-50/60 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-10 h-10 rounded-lg flex-shrink-0"
                    style={{ background: nl.gradient }}
                  />
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-gray-800 truncate">{nl.title}</p>
                    <p className="text-xs text-gray-400">
                      {nl.vol} ・ {nl.issue} ・ {nl.pages.length}ページ
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 ml-3 flex-shrink-0">
                  <button
                    onClick={() => startEdit(nl)}
                    className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    編集
                  </button>
                  <button
                    onClick={() => handleDelete(nl.id, nl.title)}
                    className="px-3 py-1.5 text-xs border border-red-200 text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    削除
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      </div>

      {/* Add form */}
      {showAddForm ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-semibold text-gray-700 mb-4 text-sm">新規会報を追加</h3>
          <form onSubmit={handleAdd} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  ID <span className="text-gray-300">（英数字、重複不可）</span>
                </label>
                <input
                  value={addId}
                  onChange={(e) => setAddId(e.target.value)}
                  required
                  placeholder="vol20"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Vol</label>
                <input
                  value={addVol}
                  onChange={(e) => setAddVol(e.target.value)}
                  required
                  placeholder="Vol.20"
                  className={inputCls}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">号数</label>
                <input
                  value={addIssue}
                  onChange={(e) => setAddIssue(e.target.value)}
                  required
                  placeholder="2026年5月号"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">タイトル</label>
                <input
                  value={addTitle}
                  onChange={(e) => setAddTitle(e.target.value)}
                  required
                  placeholder="岩波ミニ文庫 第20号"
                  className={inputCls}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">
                グラデーション <span className="text-gray-300">（省略可）</span>
              </label>
              <input
                value={addGradient}
                onChange={(e) => setAddGradient(e.target.value)}
                placeholder="linear-gradient(135deg, #F0B8C8, #E8A0B4)"
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">表紙画像URL</label>
              <input
                value={addCoverImage}
                onChange={(e) => setAddCoverImage(e.target.value)}
                required
                placeholder="/newsletter/vol20/page-1.jpg"
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">
                ページURL <span className="text-gray-300">（1行1URL）</span>
              </label>
              <textarea
                value={addPages}
                onChange={(e) => setAddPages(e.target.value)}
                required
                rows={4}
                placeholder={"/newsletter/vol20/page-1.jpg\n/newsletter/vol20/page-2.jpg"}
                className={`${inputCls} resize-y font-mono text-xs`}
              />
              <p className="text-xs text-gray-400 mt-1">
                {textToPages(addPages).length}ページ
              </p>
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
                onClick={() => { setShowAddForm(false); resetAddForm(); setGlobalError(null); }}
                className="px-5 py-2.5 border border-gray-200 text-gray-500 rounded-xl text-sm bg-white hover:bg-gray-50 transition-colors"
              >
                キャンセル
              </button>
            </div>
          </form>
        </div>
      ) : (
        <button
          onClick={() => { setShowAddForm(true); setGlobalError(null); }}
          className="w-full py-3.5 border-2 border-dashed border-pink-200 rounded-2xl text-pink-400 text-sm font-medium hover:border-pink-300 hover:text-pink-500 transition-colors"
        >
          ＋ 新規会報を追加
        </button>
      )}
    </div>
  );
}
