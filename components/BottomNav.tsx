"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "ホーム", icon: "🏠" },
  { href: "/news", label: "ニュース", icon: "📰" },
  { href: "/events", label: "イベント", icon: "📅" },
  { href: "/newsletter", label: "会報", icon: "📖" },
  { href: "/youtube", label: "動画", icon: "▶️" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-app bg-white border-t border-pink-100 z-50">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-0.5 w-full h-full transition-colors ${
                isActive
                  ? "text-pink-500"
                  : "text-gray-400 active:text-pink-400"
              }`}
            >
              <span className="text-xl leading-none">{item.icon}</span>
              <span
                className={`text-[0.65rem] font-medium ${
                  isActive ? "text-pink-500" : "text-gray-500"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
