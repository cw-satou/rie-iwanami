import Link from "next/link";

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
  return (
    <header className="header-gradient px-4 py-3 flex items-center gap-3 sticky top-0 z-40">
      {showBack && (
        <Link
          href="/"
          className="text-white text-xl w-8 h-8 flex items-center justify-center rounded-full active:bg-white/20"
          aria-label="ホームに戻る"
        >
          ←
        </Link>
      )}
      {icon && <span className="text-xl">{icon}</span>}
      <h1 className="text-white font-bold text-base">{title}</h1>
    </header>
  );
}
