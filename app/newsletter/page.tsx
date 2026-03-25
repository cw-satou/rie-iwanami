"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import BottomNav from "@/components/BottomNav";
import { Newsletter } from "@/lib/types";

export default function NewsletterPage() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [memberNumber, setMemberNumber] = useState("");
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSession();
  }, []);

  async function checkSession() {
    try {
      const res = await fetch("/api/newsletter");
      const data = await res.json();
      if (data.loggedIn) {
        setLoggedIn(true);
        setMemberNumber(data.memberNumber);
        setNewsletters(data.newsletters);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setLoggedIn(false);
    setMemberNumber("");
    setNewsletters([]);
  }

  if (loading) {
    return (
      <div className="pb-20">
        <PageHeader title="ファンクラブ会報" icon="📖" />
        <div className="p-4 space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 skeleton rounded-2xl" />
          ))}
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="pb-20 page-enter">
      <PageHeader title="ファンクラブ会報" icon="📖" />

      {loggedIn ? (
        /* Logged in - show newsletters */
        <div className="p-4">
          {/* Member bar */}
          <div className="bg-white rounded-2xl p-4 flex items-center justify-between mb-4 border border-pink-100/50">
            <div>
              <p className="font-bold text-sm">会員番号: {memberNumber}</p>
              <p className="text-xs text-gray-400">ようこそ！</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-1.5 border border-gray-200 rounded-full text-xs text-gray-500 active:bg-gray-50"
            >
              ログアウト
            </button>
          </div>

          {/* Newsletter grid */}
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-5 bg-pink-500 rounded-full" />
            <h2 className="text-base font-bold">会報バックナンバー</h2>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {newsletters.map((nl) => (
              <div
                key={nl.id}
                className="bg-white rounded-2xl overflow-hidden border border-pink-100/50"
              >
                <div
                  className="aspect-[3/4] flex flex-col items-center justify-center text-white"
                  style={{ background: nl.gradient }}
                >
                  <span className="text-2xl font-bold drop-shadow">
                    {nl.vol}
                  </span>
                  <span className="text-sm mt-1 drop-shadow">{nl.issue}</span>
                </div>
                <div className="p-2 text-center">
                  <p className="text-xs font-medium text-gray-600">
                    {nl.vol} {nl.issue}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            今後も会報を更新予定です。お楽しみに！
          </p>
        </div>
      ) : (
        /* Not logged in - show membership info */
        <div className="p-4 space-y-4">
          {/* Login banner */}
          <div className="bg-white rounded-2xl p-6 text-center border border-pink-100/50">
            <h3 className="text-lg font-bold mb-2">📖 ファンクラブ会報</h3>
            <p className="text-sm text-gray-500 mb-4 leading-relaxed">
              会員限定のデジタル会報をお届けします。
              <br />
              ログインしてバックナンバーをご覧ください。
            </p>
            <Link
              href="/login"
              className="inline-block px-8 py-3 bg-pink-300 text-white font-bold rounded-full text-sm active:bg-pink-400"
            >
              会員ログイン
            </Link>
          </div>

          {/* Membership benefits */}
          <div className="bg-white rounded-2xl p-5 border border-pink-100/50">
            <h3 className="text-center text-pink-500 font-bold mb-4">
              ✨ 入会案内 ✨
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              岩波理恵デジタルファンクラブに入会すると、以下の特典をお楽しみいただけます：
            </p>
            <ul className="space-y-2 text-sm">
              {[
                "デジタル会報（季刊発行）の閲覧",
                "会員限定イベントへの優先参加",
                "コンサートチケットの先行予約",
                "バースデーメッセージ配信",
                "限定グッズの購入権",
                "岩波理恵からの特別メッセージ動画",
              ].map((benefit, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✔</span>
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Pricing */}
          <div className="bg-white rounded-2xl p-5 text-center border border-pink-100/50">
            <h3 className="text-pink-500 font-bold mb-2">入会費・年会費</h3>
            <div className="text-3xl font-bold my-2">
              ¥3,300
              <span className="text-sm font-normal text-gray-500">
                （税込・年額）
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-2 leading-relaxed">
              入会金は無料。お支払いはクレジットカードまたはコンビニ決済に対応しています。
            </p>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
