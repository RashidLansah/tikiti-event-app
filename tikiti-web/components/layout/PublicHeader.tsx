'use client';

import { useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Arrow from '@/components/ui/Arrow';

interface PublicHeaderProps {
  cta?: { label: string; href: string };
  sticky?: boolean;
  tone?: 'yellow' | 'paper';
}

const DEFAULT_CTA = { label: 'All events', href: '/events' };

/**
 * Shared public-site header (homepage, events list/detail, organisers).
 * Desktop: wordmark + inline nav + pill CTA. Mobile (≤768px): wordmark, pill
 * CTA and a hamburger that opens a slide-down panel.
 */
export default function PublicHeader({ cta = DEFAULT_CTA, sticky = false, tone = 'yellow' }: PublicHeaderProps) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const rootRef = useRef<HTMLElement>(null);
  const pathname = usePathname();
  const panelId = useId();

  // Close on route change (adjust state during render, no effect needed)
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setOpen(false);
  }

  // Scrolled shadow (sticky mode only)
  useEffect(() => {
    if (!sticky) return;
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [sticky]);

  // Escape, tap outside, body scroll lock
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    const onPointer = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  const showSignIn = cta.href !== '/login';

  return (
    <header
      ref={rootRef}
      className={`ph ph-${tone}${sticky ? ' ph-sticky' : ''}${scrolled ? ' ph-scrolled' : ''}${open ? ' ph-open' : ''}`}
    >
      <div className="ph-bar">
        <Link href="/" className="ph-logo">tikiti<span>{'✳︎'}</span></Link>

        <nav className="ph-nav" aria-label="Primary">
          <Link href="/events">Discover events</Link>
          <Link href="/organisers">For organisers <Arrow dir="ne" size={13} /></Link>
        </nav>

        <div className="ph-right">
          <Link href={cta.href} className="ph-cta">{cta.label} <Arrow dir="ne" size={13} /></Link>
          <button
            type="button"
            className="ph-burger"
            aria-label="Menu"
            aria-expanded={open}
            aria-controls={panelId}
            onClick={() => setOpen(o => !o)}
          >
            <span /><span /><span />
          </button>
        </div>
      </div>

      <div id={panelId} className="ph-panel" hidden={!open}>
        <Link href="/events">Discover events</Link>
        <Link href="/organisers">For organisers <Arrow dir="ne" size={14} /></Link>
        {showSignIn && <Link href="/login">Sign in</Link>}
        {cta.href !== '/events' && cta.href !== '/organisers' && (
          <Link href={cta.href}>{cta.label} <Arrow dir="ne" size={14} /></Link>
        )}
      </div>

      <style jsx>{`
        .ph {
          position: sticky; top: 0; z-index: 100;
          font-family: 'DM Sans', Arial, sans-serif; color: #202220;
          transition: background 0.25s, box-shadow 0.25s;
        }
        .ph-yellow { background: #f5ee3d; }
        .ph-paper { background: #faf9f2; box-shadow: 0 1px 0 rgba(0,0,0,0.12); }
        .ph-scrolled { background: #fff; box-shadow: 0 1px 0 rgba(0,0,0,0.08); }
        .ph a { color: inherit; text-decoration: none; }

        .ph-bar {
          height: 80px; padding: 0 5%;
          display: flex; align-items: center; justify-content: space-between; gap: 16px;
        }
        .ph-logo {
          font-size: 38px; font-weight: 700; letter-spacing: -3px;
          display: inline-flex; align-items: center; gap: 4px; white-space: nowrap;
        }
        .ph-logo span { font-size: 26px; color: #f44929; letter-spacing: 0; font-variant-emoji: text; }

        .ph-nav { display: flex; gap: 28px; align-items: center; font-size: 14px; margin-left: auto; margin-right: 28px; }
        .ph-nav :global(a) { display: inline-flex; align-items: center; gap: 6px; white-space: nowrap; min-height: 40px; font-weight: 600; }
        .ph-nav :global(a:hover) { opacity: 0.6; }

        .ph-right { display: flex; align-items: center; gap: 8px; }
        .ph-cta {
          border: 1px solid rgba(0,0,0,0.15); padding: 10px 18px; min-height: 40px; border-radius: 30px;
          font-size: 13px; font-weight: 600; white-space: nowrap;
          display: inline-flex; align-items: center; gap: 6px;
        }
        .ph-cta:hover { opacity: 0.7; }

        .ph-burger {
          display: none; width: 40px; height: 40px; padding: 0; border: 0; background: transparent; cursor: pointer;
          position: relative; flex-shrink: 0; border-radius: 8px;
        }
        .ph-burger span {
          position: absolute; left: 10px; width: 20px; height: 2px; background: currentColor; border-radius: 2px;
          transition: transform 0.2s ease, opacity 0.2s ease, top 0.2s ease;
        }
        .ph-burger span:nth-child(1) { top: 13px; }
        .ph-burger span:nth-child(2) { top: 19px; }
        .ph-burger span:nth-child(3) { top: 25px; }
        .ph-open .ph-burger span:nth-child(1) { top: 19px; transform: rotate(45deg); }
        .ph-open .ph-burger span:nth-child(2) { opacity: 0; }
        .ph-open .ph-burger span:nth-child(3) { top: 19px; transform: rotate(-45deg); }
        .ph-burger:focus-visible, .ph a:focus-visible { outline: 3px solid #ff7e47; outline-offset: 3px; }

        .ph-panel { display: none; }

        @media (max-width: 768px) {
          .ph-bar { height: 60px; padding: 0 16px; }
          .ph-logo { font-size: 28px; letter-spacing: -2px; }
          .ph-logo span { font-size: 20px; }
          .ph-nav { display: none; }
          .ph-cta { padding: 9px 14px; font-size: 12px; min-height: 36px; }
          .ph-burger { display: block; }

          .ph-panel {
            display: flex; flex-direction: column;
            position: absolute; left: 0; right: 0; top: 100%;
            background: #faf9f2; border-top: 1px solid rgba(0,0,0,0.12);
            box-shadow: 0 12px 24px rgba(0,0,0,0.08);
            padding: 8px 0 12px;
            animation: ph-slide 0.18s ease-out;
          }
          .ph-panel[hidden] { display: none; }
          .ph-panel :global(a) {
            display: flex; align-items: center; justify-content: space-between;
            min-height: 48px; padding: 0 16px; font-size: 17px; font-weight: 600;
          }
          .ph-panel :global(a:active) { background: rgba(0,0,0,0.05); }
        }
        @keyframes ph-slide { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: none; } }
      `}</style>
    </header>
  );
}
