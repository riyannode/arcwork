'use client';

/**
 * useMotionMode — toggles heavy landing animations (HexGrid3D, DotMatrixField).
 *
 * Modes:
 *   'full' — all canvas/SVG animations + particles + rAF loops
 *   'lite' — static fallbacks, zero rAF, saves battery + renders on weak GPUs
 *
 * Auto-default (first visit):
 *   - mobile (<768px)                      → 'lite'
 *   - prefers-reduced-motion: reduce       → 'lite'
 *   - connection.saveData === true         → 'lite'
 *   - else                                 → 'full'
 *
 * User override persists in localStorage and beats every auto-default.
 */

import { useCallback, useEffect, useState } from 'react';

export type MotionMode = 'full' | 'lite';

const STORAGE_KEY = 'arclayer.motionMode';

function detectDefault(): MotionMode {
  if (typeof window === 'undefined') return 'full';
  try {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return 'lite';
    if (window.matchMedia?.('(max-width: 767px)').matches) return 'lite';
    // @ts-expect-error — connection non-standard, but widely supported mobile
    const saveData = navigator.connection?.saveData === true;
    if (saveData) return 'lite';
  } catch {
    // fall through
  }
  return 'full';
}

function readStored(): MotionMode | null {
  if (typeof window === 'undefined') return null;
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    return v === 'full' || v === 'lite' ? v : null;
  } catch {
    return null;
  }
}

export function useMotionMode() {
  // Start with 'full' during SSR to avoid hydration mismatch; hydrate real
  // value on mount. HexGrid3D/DotMatrixField are client-only anyway.
  const [mode, setModeState] = useState<MotionMode>('full');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = readStored();
    setModeState(stored ?? detectDefault());
    setHydrated(true);
  }, []);

  const setMode = useCallback((next: MotionMode) => {
    setModeState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
      window.dispatchEvent(new CustomEvent('arclayer:motion-mode', { detail: next }));
    } catch {
      // ignore
    }
  }, []);

  const toggle = useCallback(() => {
    setMode(mode === 'full' ? 'lite' : 'full');
  }, [mode, setMode]);

  // Cross-tab / cross-component sync
  useEffect(() => {
    const onCustom = (e: Event) => {
      const next = (e as CustomEvent<MotionMode>).detail;
      if (next === 'full' || next === 'lite') setModeState(next);
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY || !e.newValue) return;
      if (e.newValue === 'full' || e.newValue === 'lite') setModeState(e.newValue);
    };
    window.addEventListener('arclayer:motion-mode', onCustom);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('arclayer:motion-mode', onCustom);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  return { mode, setMode, toggle, hydrated };
}
