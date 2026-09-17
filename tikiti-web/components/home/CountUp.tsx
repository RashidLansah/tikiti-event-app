'use client';

import { useEffect, useRef, useState } from 'react';

export function formatStat(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M+`;
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k+`;
  return n.toLocaleString('en-US');
}

export default function CountUp({ value, duration = 1200 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(value);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || started.current) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const observer = new IntersectionObserver(entries => {
      if (!entries[0].isIntersecting || started.current) return;
      started.current = true;
      observer.disconnect();
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        setDisplay(Math.round(value * eased));
        if (t < 1) requestAnimationFrame(tick);
      };
      setDisplay(0);
      requestAnimationFrame(tick);
    }, { threshold: 0.4 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [value, duration]);

  return <span ref={ref}>{formatStat(display)}</span>;
}
