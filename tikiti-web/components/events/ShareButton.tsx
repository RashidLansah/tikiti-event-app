'use client';

import { useEffect, useRef, useState } from 'react';

interface ShareButtonProps {
  eventId: string;
  title: string;
  text?: string;
  /** "pill" (default) shows "Share ↗"; "icon" is a compact circular button for grid cards. */
  variant?: 'pill' | 'icon';
  /** Light pill on paper, or dark pill for use on the yellow ticket card. */
  tone?: 'light' | 'dark';
  style?: React.CSSProperties;
}

export default function ShareButton({ eventId, title, text, variant = 'pill', tone = 'light', style }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const url = `https://www.gettikiti.com/events/${eventId}`;

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  async function handleShare(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const shareData = { title, text: text || title, url };
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // user cancelled or share failed — fall through to copy
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt('Copy this link', url);
    }
  }

  const dark = tone === 'dark';
  const base: React.CSSProperties = {
    font: "600 13px 'DM Sans', Arial, sans-serif",
    cursor: 'pointer',
    transition: 'background 0.15s, color 0.15s, border-color 0.15s',
    whiteSpace: 'nowrap',
    ...style,
  };

  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={handleShare}
        aria-label={copied ? 'Link copied' : `Share ${title}`}
        title={copied ? 'Link copied' : 'Share'}
        style={{
          ...base,
          width: 32,
          height: 32,
          borderRadius: 16,
          border: '1px solid rgba(0,0,0,0.12)',
          background: copied ? '#6256e8' : '#fff',
          color: copied ? '#fff' : '#202220',
          display: 'inline-grid',
          placeItems: 'center',
          fontSize: 14,
          lineHeight: 1,
        }}
      >
        {copied ? '✓' : '↗'}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      aria-live="polite"
      style={{
        ...base,
        padding: '10px 18px',
        borderRadius: 30,
        border: `1px solid ${dark ? '#202220' : 'rgba(32,34,32,0.2)'}`,
        background: copied ? '#6256e8' : dark ? '#202220' : 'transparent',
        color: copied ? '#fff' : dark ? '#faf9f2' : '#202220',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
      }}
    >
      {copied ? 'Link copied' : <>Share <span aria-hidden>↗</span></>}
    </button>
  );
}
