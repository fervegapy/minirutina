"use client";
import { useEffect, useRef, useState } from "react";

// Persists customizer wizard state in sessionStorage so browser back /
// swipe-back / refresh (which remount the page and wipe useState) restore
// the customer's progress instead of resetting the wizard to step 0.
//
// Per-tab (sessionStorage) on purpose: two tabs customizing two kids don't
// clobber each other, and closing the tab discards the draft.
export function useWizardPersist<T extends object>(
  key: string,
  state: T,
  restore: (saved: Partial<T>) => void,
): { clear: () => void } {
  const [hydrated, setHydrated] = useState(false);
  const restoreRef = useRef(restore);
  restoreRef.current = restore;

  // Restore once on mount, before any save can overwrite the draft.
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(key);
      if (raw) restoreRef.current(JSON.parse(raw) as Partial<T>);
    } catch {
      // corrupt draft — start clean
    }
    setHydrated(true);
  }, [key]);

  // Save on every state change after hydration.
  const serialized = JSON.stringify(state);
  useEffect(() => {
    if (!hydrated) return;
    try {
      sessionStorage.setItem(key, serialized);
    } catch {
      // storage full/unavailable — wizard still works, just without recovery
    }
  }, [key, hydrated, serialized]);

  return {
    clear: () => {
      try {
        sessionStorage.removeItem(key);
      } catch {}
    },
  };
}
