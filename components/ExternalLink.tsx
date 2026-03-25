"use client";

import { useState, ReactNode } from "react";
import InAppBrowser from "./InAppBrowser";

interface ExternalLinkProps {
  href: string;
  title?: string;
  className?: string;
  children: ReactNode;
}

export default function ExternalLink({ href, title, className, children }: ExternalLinkProps) {
  const [browserOpen, setBrowserOpen] = useState(false);

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    setBrowserOpen(true);
  }

  return (
    <>
      <a
        href={href}
        onClick={handleClick}
        className={className}
      >
        {children}
      </a>
      {browserOpen && (
        <InAppBrowser
          url={href}
          title={title}
          onClose={() => setBrowserOpen(false)}
        />
      )}
    </>
  );
}
