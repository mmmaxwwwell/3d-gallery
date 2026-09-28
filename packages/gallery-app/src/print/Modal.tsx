// SPDX-License-Identifier: MIT
/** @jsxImportSource preact */
import type { ComponentChildren } from 'preact';
import { useEffect } from 'preact/hooks';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ComponentChildren;
  /** Hands the body to the caller whole: no padding, no scroll. For screens
   *  that own their own layout — the plate editor fills it with a canvas. */
  bleed?: boolean;
}

/**
 * Minimal modal with backdrop + Esc-to-close: the frame of the projects
 * list, the plate editor and Settings. It covers its page but not the view
 * switcher, so every view stays one tap away.
 */
export function Modal({ title, onClose, children, bleed }: ModalProps) {
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
        <div class={`print-modal-body${bleed ? ' is-bleed' : ''}`}>{children}</div>
      </div>
    </div>
  );
}
