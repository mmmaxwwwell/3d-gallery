// SPDX-License-Identifier: MIT
/** @jsxImportSource preact */
import type { ComponentChildren } from 'preact';
import { useEffect } from 'preact/hooks';

interface SheetProps {
  title: string;
  onClose: () => void;
  children: ComponentChildren;
}

/**
 * An options panel that overlays the plate canvas — a bottom sheet on a
 * phone, a docked right-hand panel from tablet up.
 *
 * Esc is bound in the capture phase so it closes the sheet without also
 * reaching the Modal's document-level handler, which would take the whole
 * plate editor down with it.
 */
export function Sheet({ title, onClose, children }: SheetProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      onClose();
    };
    document.addEventListener('keydown', handler, true);
    return () => document.removeEventListener('keydown', handler, true);
  }, [onClose]);

  return (
    <div class="pd-sheet-scrim" onClick={onClose}>
      <aside
        class="pd-sheet"
        role="dialog"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <header class="pd-sheet-head">
          <h4>{title}</h4>
          <button type="button" class="pd-sheet-close" aria-label="Close panel" onClick={onClose}>
            ×
          </button>
        </header>
        <div class="pd-sheet-body">{children}</div>
      </aside>
    </div>
  );
}
