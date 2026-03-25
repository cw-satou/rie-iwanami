"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import BottomNav from "@/components/BottomNav";

export default function LoginPage() {
  const router = useRouter();
  const [memberNumber, setMemberNumber] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberNumber, password }),
      });
      const data = await res.json();

      if (data.success) {
        router.push("/newsletter");
      } else {
        setError(data.error || "ログインに失敗しました");
      }
    } catch {
      setError("通信エラーが発生しました");
    }
    setLoading(false);
  }

  return (
    <div className="pb-20 page-enter">
      <PageHeader title="会員ログイン" />

      <div className="p-4">
        <div className="bg-white rounded-2xl p-6 border border-pink-100/50">
          <h2 className="text-center text-lg font-bold mb-6">会員認証</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">
                会員番号
              </label>
              <input
                type="text"
                placeholder="例：FC001"
                value={memberNumber}
                onChange={(e) => setMemberNumber(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-pink-200 text-base focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-200"
                autoComplete="username"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">
                パスワード
              </label>
              <input
                type="password"
                placeholder="パスワードを入力"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-pink-200 text-base focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-200"
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 text-sm px-4 py-2.5 rounded-xl">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-pink-300 to-pink-400 text-white font-bold rounded-xl text-base active:from-pink-400 active:to-pink-500 disabled:opacity-50"
            >
              {loading ? "ログイン中..." : "ログイン"}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-6">
            まだ会員でない方は
            <br />
            <a href="/newsletter" className="text-pink-500 underline">
              入会案内はこちら
            </a>
          </p>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
