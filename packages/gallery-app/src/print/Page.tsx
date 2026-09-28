// SPDX-License-Identifier: MIT
/** @jsxImportSource preact */
import type { ComponentChildren } from 'preact';
import { useEffect } from 'preact/hooks';

interface PageProps {
  /** For the screen reader; nothing is drawn for it. */
  label: string;
  onClose: () => void;
  children: ComponentChildren;
}

/**
 * A screen that owns the whole viewport — no backdrop, no title bar. For the
 * Project page, where every pixel of chrome is a pixel of plan lost. Esc and
 * Back still leave.
 */
export function Page({ label, onClose, children }: PageProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      // Esc in a field is the field's, not a way out of the screen.
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT')) return;
      onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div class="print-page" role="dialog" aria-modal="true" aria-label={label}>
      {children}
    </div>
  );
}
