// SPDX-License-Identifier: MIT
/**
 * Acting on the page as a person would: the same pointer, keyboard and input
 * events a real click or keystroke fires, so every view's handlers run
 * unchanged.
 */

import { elementFor, nameOf, refFor } from './snapshot.js';

export interface DialogRecord {
  kind: 'confirm' | 'alert' | 'prompt';
  message: string;
  answered: unknown;
}

/** How long a press is held. Longer than HoldButton's HOLD_MS, so it fires. */
const HOLD_FOR_MS = 1400;

/** Waits until the DOM has been quiet for a moment, or gives up waiting. */
export function settle(quietMs = 300, maxMs = 5000): Promise<void> {
  return new Promise((resolve) => {
    let timer = setTimeout(done, quietMs);
    const cap = setTimeout(done, maxMs);
    const observer = new MutationObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(done, quietMs);
    });
    observer.observe(document.body, { subtree: true, childList: true, attributes: true, characterData: true });
    function done() {
      observer.disconnect();
      clearTimeout(timer);
      clearTimeout(cap);
      resolve();
    }
  });
}

/**
 * Runs `fn` with confirm/alert/prompt answered instead of blocking. A native
 * dialog would freeze the page, and with it the socket the agent is waiting
 * on. Each one is recorded so the agent sees the question it answered.
 */
export async function withDialogs(answer: boolean, fn: () => Promise<void> | void): Promise<DialogRecord[]> {
  const dialogs: DialogRecord[] = [];
  const saved = { confirm: window.confirm, alert: window.alert, prompt: window.prompt };
  window.confirm = (message?: string) => {
    dialogs.push({ kind: 'confirm', message: String(message ?? ''), answered: answer });
    return answer;
  };
  window.alert = (message?: string) => {
    dialogs.push({ kind: 'alert', message: String(message ?? ''), answered: 'dismissed' });
  };
  window.prompt = (message?: string, fallback?: string) => {
    const value = answer ? (fallback ?? '') : null;
    dialogs.push({ kind: 'prompt', message: String(message ?? ''), answered: value });
    return value;
  };
  try {
    await fn();
    await settle();
  } finally {
    Object.assign(window, saved);
  }
  return dialogs;
}

function center(el: Element): { clientX: number; clientY: number } {
  const r = el.getBoundingClientRect();
  return { clientX: r.left + r.width / 2, clientY: r.top + r.height / 2 };
}

function pointer(el: Element, type: string, init: PointerEventInit = {}) {
  const opts = { bubbles: true, cancelable: true, composed: true, button: 0, pointerId: 1, pointerType: 'mouse', isPrimary: true, ...center(el), ...init };
  el.dispatchEvent(type.startsWith('pointer') ? new PointerEvent(type, opts) : new MouseEvent(type, opts));
}

function assertUsable(el: Element, ref: string) {
  if ((el as HTMLButtonElement).disabled || el.getAttribute('aria-disabled') === 'true') {
    const why = el.getAttribute('title');
    throw new Error(`${ref} (${nameOf(el) || el.tagName.toLowerCase()}) is disabled${why ? `: ${why}` : ''}.`);
  }
}

export function click(ref: string): void {
  const el = elementFor(ref);
  assertUsable(el, ref);
  el.scrollIntoView({ block: 'center', inline: 'nearest' });
  pointer(el, 'pointerover');
  pointer(el, 'pointerdown', { buttons: 1 });
  pointer(el, 'mousedown', { buttons: 1 });
  if (el instanceof HTMLElement) el.focus({ preventScroll: true });
  pointer(el, 'pointerup');
  pointer(el, 'mouseup');
  // .click() rather than a synthetic MouseEvent: it's what activates a
  // <summary>, a checkbox or a link the way a real click does.
  (el as HTMLElement).click();
}

export async function hold(ref: string): Promise<void> {
  const el = elementFor(ref);
  assertUsable(el, ref);
  el.scrollIntoView({ block: 'center', inline: 'nearest' });
  pointer(el, 'pointerdown', { buttons: 1 });
  await new Promise((r) => setTimeout(r, HOLD_FOR_MS));
  pointer(el, 'pointerup');
}

/** Sets `value` through the prototype's setter, which is what Preact's controlled inputs track. */
function setNativeValue(el: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, value: string) {
  const proto = Object.getPrototypeOf(el) as object;
  const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
  if (setter) setter.call(el, value);
  else el.value = value;
}

export function fill(ref: string, value: unknown, submit: boolean): void {
  const el = elementFor(ref);
  assertUsable(el, ref);
  el.scrollIntoView({ block: 'center', inline: 'nearest' });
  if (el instanceof HTMLElement) el.focus({ preventScroll: true });

  if (el instanceof HTMLInputElement && (el.type === 'checkbox' || el.type === 'radio')) {
    const want = value === true || value === 'true' || value === 'on' || value === 1;
    if (el.checked !== want) el.click();
  } else if (el instanceof HTMLSelectElement) {
    const wanted = String(value);
    const option = [...el.options].find((o) => o.value === wanted)
      ?? [...el.options].find((o) => o.label.trim().toLowerCase() === wanted.trim().toLowerCase())
      ?? [...el.options].find((o) => o.label.toLowerCase().includes(wanted.trim().toLowerCase()));
    if (!option) {
      throw new Error(`${ref} has no option "${wanted}". Options: ${[...el.options].map((o) => o.label).join(' | ')}.`);
    }
    setNativeValue(el, option.value);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  } else if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
    if (el instanceof HTMLInputElement && el.type === 'file') {
      throw new Error(`${ref} is a file picker; the agent cannot choose files from the person's disk.`);
    }
    setNativeValue(el, String(value));
    el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: String(value) }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  } else if (el instanceof HTMLElement && el.isContentEditable) {
    el.textContent = String(value);
    el.dispatchEvent(new InputEvent('input', { bubbles: true }));
  } else if (el.getAttribute('role') === 'switch' || el.getAttribute('role') === 'checkbox') {
    const on = el.getAttribute('aria-checked') === 'true';
    const want = value === true || value === 'true';
    if (on !== want) click(ref);
  } else {
    throw new Error(`${ref} is not a field. Use ui_click for it.`);
  }
  if (submit) press('Enter', ref);
}

export function press(key: string, ref?: string): void {
  const el = ref ? elementFor(ref) : (document.activeElement ?? document.body);
  const init: KeyboardEventInit = { key, code: key.length === 1 ? `Key${key.toUpperCase()}` : key, bubbles: true, cancelable: true, composed: true };
  const proceed = el.dispatchEvent(new KeyboardEvent('keydown', init));
  el.dispatchEvent(new KeyboardEvent('keyup', init));
  // Synthetic key events don't trigger the browser's own default actions.
  if (!proceed) return;
  if (key === 'Enter' && el instanceof HTMLInputElement && el.form) el.form.requestSubmit();
  else if ((key === 'Enter' || key === ' ') && (el instanceof HTMLButtonElement || el instanceof HTMLAnchorElement)) el.click();
}

/** Longest side of a capture. Keeps a picture under the 1 MB request limit on the relay's nginx hops. */
const CAPTURE_MAX_PX = 1280;

/**
 * A picture of a canvas, read inside an animation frame (before a WebGL
 * buffer is cleared), scaled down and sent as JPEG so it fits in one request.
 */
export function capture(ref?: string): Promise<{ ref: string; width: number; height: number; mimeType: string; data: string }> {
  let canvas: HTMLCanvasElement | undefined;
  if (ref) {
    const el = elementFor(ref);
    if (!(el instanceof HTMLCanvasElement)) throw new Error(`${ref} is not a canvas.`);
    canvas = el;
  } else {
    canvas = [...document.querySelectorAll('canvas')]
      .filter((c) => c.width && c.height && c.getBoundingClientRect().width > 0)
      .sort((a, b) => b.width * b.height - a.width * a.height)[0];
    if (!canvas) throw new Error('No canvas is showing on this page.');
  }
  const target = canvas;
  return new Promise((resolve, reject) => {
    requestAnimationFrame(() => {
      try {
        const scale = Math.min(1, CAPTURE_MAX_PX / Math.max(target.width, target.height));
        const out = document.createElement('canvas');
        out.width = Math.round(target.width * scale);
        out.height = Math.round(target.height * scale);
        const ctx = out.getContext('2d')!;
        // A transparent WebGL canvas would come out black as JPEG.
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, out.width, out.height);
        ctx.drawImage(target, 0, 0, out.width, out.height);
        const data = out.toDataURL('image/jpeg', 0.85).replace(/^data:image\/jpeg;base64,/, '');
        resolve({ ref: refFor(target), width: out.width, height: out.height, mimeType: 'image/jpeg', data });
      } catch (err) {
        reject(new Error(`Could not read the canvas: ${(err as Error).message}`));
      }
    });
  });
}
