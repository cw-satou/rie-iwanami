"use client";

import { useRouter } from "next/navigation";

interface PageHeaderProps {
  title: string;
  icon?: string;
  showBack?: boolean;
}

export default function PageHeader({
  title,
  icon,
  showBack = true,
}: PageHeaderProps) {
  const router = useRouter();

  return (
    <header className="header-gradient px-4 py-3 flex items-center gap-3 sticky top-0 z-40">
      {showBack && (
        <button
          onClick={() => router.back()}
          className="text-white text-xl w-8 h-8 flex items-center justify-center rounded-full active:bg-white/20"
          aria-label="戻る"
        >
          ←
        </button>
      )}
      {icon && <span className="text-xl">{icon}</span>}
      <h1 className="text-white font-bold text-base">{title}</h1>
    </header>
  );
}
