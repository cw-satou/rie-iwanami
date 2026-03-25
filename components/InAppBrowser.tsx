"use client";

import { useState, useEffect, useRef } from "react";

interface InAppBrowserProps {
  url: string;
  title?: string;
  onClose: () => void;
}

export default function InAppBrowser({ url, title, onClose }: InAppBrowserProps) {
  const [loading, setLoading] = useState(true);
  const [, setError] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Convert YouTube watch URLs to embed
  const embedUrl = getEmbedUrl(url);

  useEffect(() => {
    // Set a timeout - if iframe hasn't loaded in 5s, assume blocked
    timeoutRef.current = setTimeout(() => {
      if (loading) {
        setError(true);
        setLoading(false);
        // Open externally as fallback
        window.open(url, "_blank", "noopener,noreferrer");
        onClose();
      }
    }, 5000);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [url, loading, onClose]);

  function handleLoad() {
    setLoading(false);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }

  function handleError() {
    setError(true);
    setLoading(false);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    window.open(url, "_blank", "noopener,noreferrer");
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[200] bg-white flex flex-col">
      {/* Header */}
      <div className="header-gradient px-4 py-3 flex items-center gap-3 flex-shrink-0">
        <button
          onClick={onClose}
          className="text-white text-xl w-8 h-8 flex items-center justify-center rounded-full active:bg-white/20"
          aria-label="閉じる"
        >
          ←
        </button>
        <span className="text-white font-bold text-base truncate flex-1">
          {title || getDomainName(url)}
        </span>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-white/80 text-xs flex items-center gap-1 active:text-white flex-shrink-0"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
          外部で開く
        </a>
      </div>

      {/* Loading bar */}
      {loading && (
        <div className="h-1 bg-pink-100 overflow-hidden flex-shrink-0">
          <div className="h-full bg-pink-400 animate-loading-bar" />
        </div>
      )}

      {/* iframe */}
      <iframe
        ref={iframeRef}
        src={embedUrl}
        className="flex-1 w-full border-none"
        onLoad={handleLoad}
        onError={handleError}
        sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}

function getEmbedUrl(url: string): string {
  // YouTube watch → embed
  const ytMatch = url.match(/youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/);
  if (ytMatch) {
    return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=0&rel=0`;
  }
  const ytShort = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
  if (ytShort) {
    return `https://www.youtube.com/embed/${ytShort[1]}?autoplay=0&rel=0`;
  }
  return url;
}

function getDomainName(url: string): string {
  try {
    const hostname = new URL(url).hostname.replace("www.", "");
    return hostname;
  } catch {
    return url;
  }
}
