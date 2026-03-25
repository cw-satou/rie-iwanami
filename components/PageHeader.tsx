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
    <header className="header-gradient px-[16px] py-[12px] flex items-center gap-[12px] sticky top-0 z-40">
      {showBack && (
        <button
          onClick={() => router.back()}
          className="text-white text-[20px] w-[32px] h-[32px] flex items-center justify-center rounded-full active:bg-white/20"
          aria-label="戻る"
        >
          ←
        </button>
      )}
      {icon && <span className="text-[20px]">{icon}</span>}
      <h1 className="text-white font-bold text-[16px]">{title}</h1>
    </header>
  );
}
