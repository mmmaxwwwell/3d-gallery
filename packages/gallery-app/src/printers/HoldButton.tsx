// SPDX-License-Identifier: MIT
/** @jsxImportSource preact */
import type { ComponentChildren } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';

/** Long enough that a tap or a brush in a pocket can't fire it, short enough not to feel stuck. */
export const HOLD_MS = 1000;

interface HoldButtonProps {
  onConfirm: () => void;
  disabled?: boolean;
  /** Why it's disabled, shown as its tooltip. */
  title?: string;
  class?: string;
  'aria-label'?: string;
  'data-control'?: string;
  children: ComponentChildren;
}

/**
 * A button that fires only after being held down, for controls that stop or
 * throw away a print. The fill shows how long is left; letting go, sliding
 * off or the page scrolling away cancels it. Space and Enter hold it too.
 */
export function HoldButton({ onConfirm, disabled, title, class: cls, children, ...attrs }: HoldButtonProps) {
  const [holding, setHolding] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stop = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    setHolding(false);
  };
  const start = () => {
    if (disabled || timer.current) return;
    setHolding(true);
    timer.current = setTimeout(() => {
      timer.current = null;
      setHolding(false);
      onConfirm();
    }, HOLD_MS);
  };

  useEffect(() => stop, []);
  useEffect(() => { if (disabled) stop(); }, [disabled]);

  const isKey = (e: KeyboardEvent) => e.key === ' ' || e.key === 'Enter';
  return (
    <button
      {...attrs}
      type="button"
      class={`pc-hold${holding ? ' is-holding' : ''}${cls ? ` ${cls}` : ''}`}
      style={{ '--pc-hold-ms': `${HOLD_MS}ms` }}
      disabled={disabled}
      title={title}
      aria-description="Press and hold to confirm"
      onPointerDown={(e) => { if (e.button === 0) start(); }}
      onPointerUp={stop}
      onPointerLeave={stop}
      onPointerCancel={stop}
      onContextMenu={(e) => e.preventDefault()}
      onKeyDown={(e) => { if (isKey(e) && !e.repeat) { e.preventDefault(); start(); } }}
      onKeyUp={(e) => { if (isKey(e)) stop(); }}
      onBlur={stop}
    >
      <span class="pc-hold-label">{children}</span>
      <span class="pc-hold-hint" aria-hidden="true">hold</span>
    </button>
  );
}
