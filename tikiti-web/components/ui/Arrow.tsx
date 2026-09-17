import type { CSSProperties } from 'react';

export type ArrowDir = 'ne' | 'up' | 'right' | 'left' | 'down';

const PATHS: Record<ArrowDir, string> = {
  ne: 'M7 17L17 7M8 7h9v9',
  up: 'M12 19V5M6 11l6-6 6 6',
  right: 'M5 12h14M13 6l6 6-6 6',
  left: 'M19 12H5M11 6l-6 6 6 6',
  down: 'M12 5v14M6 13l6 6 6-6',
};

interface ArrowProps {
  dir?: ArrowDir;
  size?: number;
  strokeWidth?: number;
  className?: string;
  style?: CSSProperties;
}

/**
 * Decorative arrow rendered as inline SVG so it never falls back to an emoji
 * or a mismatched glyph font on iOS/Android. Inherits `currentColor`.
 */
export default function Arrow({ dir = 'ne', size = 14, strokeWidth = 2, className, style }: ArrowProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      style={{ display: 'inline-block', verticalAlign: '-0.125em', flexShrink: 0, ...style }}
    >
      <path d={PATHS[dir]} />
    </svg>
  );
}
