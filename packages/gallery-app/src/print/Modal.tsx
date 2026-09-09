// SPDX-License-Identifier: MIT
/** @jsxImportSource preact */
import type { ComponentChildren } from 'preact';
import { useEffect } from 'preact/hooks';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ComponentChildren;
}

/**
 * Minimal modal with backdrop + Esc-to-close. Mounted per-instance into a
 * dedicated portal div (see openPrintDialog / openSettingsPanel in main.ts)
 * so it sits above the viewer chrome without fighting the existing layout.
 */
export function Modal({ title, onClose, children }: ModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div class="print-modal-backdrop" onClick={onClose}>
      <div class="print-modal" onClick={(e) => e.stopPropagation()}>
        <header class="print-modal-header">
          <h3>{title}</h3>
          <button type="button" class="print-modal-close" aria-label="Close" onClick={onClose}>
            ×
          </button>
        </header>
        <div class="print-modal-body">{children}</div>
      </div>
    </div>
  );
}
