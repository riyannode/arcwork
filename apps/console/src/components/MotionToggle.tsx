'use client';

/**
 * MotionToggle — switches heavy landing animations between FULL ↔ LITE.
 *
 * Desktop: text pill "MOTION · FULL" / "MOTION · LITE"
 * Mobile:  icon-only square (filled = FULL, outline = LITE)
 *
 * Lives in Navbar beside the TESTNET indicator. Replaces the old "· ARC" label.
 */

import { useMotionMode } from '@/hooks/useMotionMode';

export default function MotionToggle() {
  const { mode, toggle, hydrated } = useMotionMode();

  // Avoid SSR flash: render placeholder until hydrated, then swap.
  const isFull = hydrated && mode === 'full';
  const label = isFull ? 'FULL' : 'LITE';
  const ariaLabel = isFull
    ? 'Switch to LITE motion mode (reduced animations)'
    : 'Switch to FULL motion mode (all animations)';

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={ariaLabel}
      aria-pressed={isFull}
      title={ariaLabel}
      className="group flex items-center gap-1.5 px-2 py-1.5 transition-colors duration-200"
      style={{
        border: '1px solid rgba(197, 166, 124, 0.22)',
        background: 'rgba(197, 166, 124, 0.04)',
      }}
    >
      {/* Icon: filled square (FULL) / outline square (LITE) */}
      <span
        aria-hidden="true"
        className="inline-block h-[9px] w-[9px] transition-all duration-200"
        style={{
          background: isFull ? '#B8CD7E' : 'transparent',
          border: `1.5px solid ${isFull ? '#B8CD7E' : '#C5A67C'}`,
          boxShadow: isFull ? '0 0 6px rgba(184, 205, 126, 0.7)' : 'none',
        }}
      />
      {/* Text: hidden on mobile, visible on sm+ */}
      <span
        className="hidden font-mono text-[10px] tracking-[0.2em] sm:inline"
        style={{
          color: isFull ? '#B8CD7E' : '#C5A67C',
          fontWeight: 500,
        }}
      >
        {label}
      </span>
    </button>
  );
}
