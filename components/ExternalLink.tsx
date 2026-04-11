import { ReactNode } from "react";

interface ExternalLinkProps {
  href: string;
  title?: string;
  className?: string;
  children: ReactNode;
}

export default function ExternalLink({ href, className, children }: ExternalLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      {children}
    </a>
  );
}
