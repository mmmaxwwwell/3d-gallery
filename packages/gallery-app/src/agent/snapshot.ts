// SPDX-License-Identifier: MIT
/**
 * The page as an agent reads it: an outline of headings, text and controls,
 * each control tagged with a ref the agent hands back to act on it.
 *
 * Refs live in a WeakMap rather than a DOM attribute, so taking a snapshot
 * never mutates the page a view is rendering. They stay stable for the life
 * of the page; a reload starts over.
 */

const refs = new WeakMap<Element, string>();
const byRef = new Map<string, WeakRef<Element>>();
let nextRef = 1;
/**
 * Letters unique to this page load, so a ref read before a reload can't
 * silently name a different control on the page that replaced it.
 */
const PREFIX = Array.from({ length: 2 }, () => String.fromCharCode(97 + Math.floor(Math.random() * 26))).join('');

export function refFor(el: Element): string {
  let ref = refs.get(el);
  if (!ref) {
    ref = `${PREFIX}${nextRef++}`;
    refs.set(el, ref);
    byRef.set(ref, new WeakRef(el));
  }
  return ref;
}

export function elementFor(ref: string): Element {
  const key = ref.replace(/^\[|\]$/g, '');
  if (!key.startsWith(PREFIX)) {
    throw new Error(`Ref ${ref} is from an earlier page: this one has loaded since. Read the screen again.`);
  }
  const el = byRef.get(key)?.deref();
  if (!el || !el.isConnected) {
    throw new Error(`Ref ${ref} is gone: that part of the page was re-rendered or removed. Read the screen again.`);
  }
  return el;
}

const CONTROL_SELECTOR = [
  'a[href]', 'button', 'input', 'select', 'textarea', 'summary', 'canvas', 'video',
  '[role=button]', '[role=link]', '[role=tab]', '[role=checkbox]', '[role=switch]', '[role=radio]',
  '[role=menuitem]', '[role=option]', '[role=slider]', '[contenteditable=""]', '[contenteditable=true]',
].join(',');

/** Containers that indent what's inside them, so the outline keeps the page's grouping. */
const SECTION_SELECTOR = 'dialog,[role=dialog],[role=alertdialog],section,aside,nav,form,fieldset,details,ul,ol,table,[role=region],[role=tabpanel],[role=list]';

const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE', 'svg', 'SVG', 'HEAD', 'META', 'LINK']);

const MAX_TEXT = 200;
const MAX_OPTIONS = 20;

function clip(s: string, n = MAX_TEXT): string {
  const t = s.replace(/\s+/g, ' ').trim();
  return t.length > n ? `${t.slice(0, n - 1)}…` : t;
}

function hidden(el: Element): boolean {
  if (el.getAttribute('aria-hidden') === 'true' || (el as HTMLElement).hidden) return true;
  if (typeof el.checkVisibility === 'function') return !el.checkVisibility({ visibilityProperty: true });
  const style = getComputedStyle(el);
  return style.display === 'none' || style.visibility === 'hidden';
}

function textOf(el: Element | null): string {
  return el ? clip((el as HTMLElement).innerText ?? el.textContent ?? '') : '';
}

/** Close to the accessible name a screen reader would announce. */
export function nameOf(el: Element): string {
  const aria = el.getAttribute('aria-label');
  if (aria) return clip(aria);
  const labelledBy = el.getAttribute('aria-labelledby');
  if (labelledBy) {
    const text = labelledBy.split(/\s+/).map((id) => textOf(document.getElementById(id))).join(' ');
    if (text.trim()) return clip(text);
  }
  if (el instanceof HTMLInputElement || el instanceof HTMLSelectElement || el instanceof HTMLTextAreaElement) {
    const labels = el.labels ? [...el.labels] : [];
    const text = labels.map((l) => {
      // A label wrapping its control would otherwise name it with the control's own value.
      const copy = l.cloneNode(true) as HTMLElement;
      copy.querySelectorAll('input,select,textarea').forEach((c) => c.remove());
      return copy.textContent ?? '';
    }).join(' ');
    if (text.trim()) return clip(text);
    if (el.title) return clip(el.title);
    if ('placeholder' in el && el.placeholder) return clip(el.placeholder);
    return '';
  }
  if (el instanceof HTMLImageElement) return clip(el.alt);
  const text = textOf(el);
  return text || clip(el.getAttribute('title') ?? '');
}

function roleOf(el: Element): string {
  const role = el.getAttribute('role');
  if (role) return role;
  if (el instanceof HTMLInputElement) {
    const t = el.type;
    if (t === 'checkbox' || t === 'radio' || t === 'range' || t === 'color' || t === 'file' || t === 'number') {
      return t === 'range' ? 'slider' : t;
    }
    if (t === 'button' || t === 'submit' || t === 'reset') return 'button';
    return 'textbox';
  }
  switch (el.tagName) {
    case 'A': return 'link';
    case 'BUTTON': return 'button';
    case 'SELECT': return 'select';
    case 'TEXTAREA': return 'textbox';
    case 'SUMMARY': return 'summary';
    case 'CANVAS': return 'canvas';
    case 'VIDEO': return 'video';
    default: return el.hasAttribute('contenteditable') ? 'textbox' : 'clickable';
  }
}

function offscreen(el: Element): boolean {
  const r = el.getBoundingClientRect();
  return r.bottom < 0 || r.right < 0 || r.top > innerHeight || r.left > innerWidth;
}

function controlLine(el: Element): string {
  const role = roleOf(el);
  const parts: string[] = [role];
  const name = nameOf(el);
  if (name) parts.push(JSON.stringify(name));

  if (el instanceof HTMLInputElement) {
    if (el.type === 'checkbox' || el.type === 'radio') parts.push(el.checked ? 'checked' : 'unchecked');
    else if (el.type === 'file') parts.push(`accepts ${el.accept || 'any file'}`);
    else if (el.type !== 'button' && el.type !== 'submit') {
      parts.push(`= ${JSON.stringify(el.value)}`);
      if (el.min || el.max) parts.push(`(${el.min || '…'}–${el.max || '…'}${el.step ? ` step ${el.step}` : ''})`);
    }
  } else if (el instanceof HTMLTextAreaElement) {
    parts.push(`= ${JSON.stringify(clip(el.value, 400))}`);
  } else if (el instanceof HTMLSelectElement) {
    const options = [...el.options];
    parts.push(`= ${JSON.stringify(el.selectedOptions[0]?.label ?? '')}`);
    const shown = options.slice(0, MAX_OPTIONS).map((o) => o.label + (o.disabled ? ' (disabled)' : ''));
    parts.push(`options: ${shown.join(' | ')}${options.length > MAX_OPTIONS ? ` | …${options.length - MAX_OPTIONS} more` : ''}`);
  } else if (el instanceof HTMLCanvasElement) {
    parts.push(`${el.width}×${el.height}`);
  } else if (el.tagName === 'SUMMARY') {
    parts.push((el.parentElement as HTMLDetailsElement | null)?.open ? 'open' : 'closed');
  } else {
    const checked = el.getAttribute('aria-checked') ?? el.getAttribute('aria-pressed') ?? el.getAttribute('aria-selected');
    if (checked) parts.push(checked === 'true' ? 'on' : 'off');
    const expanded = el.getAttribute('aria-expanded');
    if (expanded) parts.push(expanded === 'true' ? 'expanded' : 'collapsed');
  }
  if (el instanceof HTMLAnchorElement) {
    const href = el.getAttribute('href') ?? '';
    if (href && !href.startsWith('#')) parts.push(`→ ${href}`);
  }
  if ((el as HTMLButtonElement).disabled || el.getAttribute('aria-disabled') === 'true') {
    parts.push(`disabled${el.getAttribute('title') ? `: ${clip(el.getAttribute('title')!, 120)}` : ''}`);
  }
  const description = el.getAttribute('aria-description');
  if (description && /hold/i.test(description)) parts.push('hold');
  else if (description) parts.push(`(${clip(description, 120)})`);
  if (offscreen(el)) parts.push('offscreen');
  return `${parts.join(' ')} [${refFor(el)}]`;
}

/**
 * Elements with a click handler but no semantics (a card, a row) show only
 * as `cursor: pointer`. Counted when their parent isn't already clickable, so
 * a button's inner spans aren't each listed.
 */
function looksClickable(el: Element): boolean {
  if (!(el instanceof HTMLElement) || el.tagName === 'LABEL') return false;
  if (getComputedStyle(el).cursor !== 'pointer') return false;
  const parent = el.parentElement;
  return !parent || getComputedStyle(parent).cursor !== 'pointer';
}

function sectionLabel(el: Element): string {
  const tag = el.getAttribute('role') ?? el.tagName.toLowerCase();
  if (tag === 'ul' || tag === 'ol' || tag === 'list' || tag === 'table') return '';
  if (el.tagName === 'DETAILS') return '';
  const name = el.getAttribute('aria-label')
    ?? (el.getAttribute('aria-labelledby') ? textOf(document.getElementById(el.getAttribute('aria-labelledby')!)) : '')
    ?? '';
  const legend = el.tagName === 'FIELDSET' ? textOf(el.querySelector(':scope > legend')) : '';
  const label = clip(name || legend, 80);
  return `[${tag}${label ? ` ${JSON.stringify(label)}` : ''}]`;
}

export interface SnapshotOptions {
  within?: string;
  find?: string;
  /** Cap on the outline's length, so one huge page can't flood the agent. */
  maxChars?: number;
}

export function snapshot(options: SnapshotOptions = {}): string {
  const root = options.within ? elementFor(options.within) : document.body;
  const lines: Array<{ depth: number; text: string; heading: boolean }> = [];

  const walk = (el: Element, depth: number) => {
    if (SKIP_TAGS.has(el.tagName) || hidden(el)) return;

    if (el.matches(CONTROL_SELECTOR) || looksClickable(el)) {
      lines.push({ depth, text: `- ${controlLine(el)}`, heading: false });
      // A control's text is its name. Only a clickable container (a card) has
      // its contents walked; any other control lists just the controls it
      // holds (a <summary>'s edit button), which are otherwise unreachable.
      if (roleOf(el) !== 'clickable') {
        for (const inner of el.querySelectorAll(CONTROL_SELECTOR)) {
          if (!hidden(inner)) lines.push({ depth: depth + 1, text: `- ${controlLine(inner)}`, heading: false });
        }
        return;
      }
    }

    const heading = /^H[1-6]$/.test(el.tagName) || el.getAttribute('role') === 'heading';
    if (heading) {
      const level = /^H([1-6])$/.exec(el.tagName)?.[1] ?? el.getAttribute('aria-level') ?? '2';
      lines.push({ depth, text: `${'#'.repeat(Number(level))} ${textOf(el)}`, heading: true });
      return;
    }

    let inner = depth;
    if (el !== root && el.matches(SECTION_SELECTOR)) {
      const label = sectionLabel(el);
      if (label) lines.push({ depth, text: label, heading: true });
      inner = depth + 1;
    }

    let text = '';
    const flush = () => {
      const t = clip(text);
      if (t) lines.push({ depth: inner, text: t, heading: false });
      text = '';
    };
    for (const child of el.childNodes) {
      if (child.nodeType === Node.TEXT_NODE) text += ` ${child.textContent ?? ''}`;
      else if (child.nodeType === Node.ELEMENT_NODE) {
        const childEl = child as Element;
        // Inline formatting stays part of the sentence around it.
        if (/^(B|STRONG|EM|I|SPAN|CODE|SMALL|ABBR|TIME|KBD|MARK|SUB|SUP|BR)$/.test(childEl.tagName)
          && !childEl.querySelector(CONTROL_SELECTOR) && !hidden(childEl) && !looksClickable(childEl)) {
          text += ` ${childEl.tagName === 'BR' ? '' : (childEl.textContent ?? '')}`;
        } else {
          flush();
          walk(childEl, inner);
        }
      }
    }
    flush();
  };
  walk(root, 0);

  let kept = lines;
  if (options.find) {
    const needle = options.find.toLowerCase();
    // Keep each match with the headings above it, so it can be placed.
    kept = [];
    const stack: typeof lines = [];
    for (const line of lines) {
      while (stack.length && stack[stack.length - 1]!.depth >= line.depth) stack.pop();
      if (line.text.toLowerCase().includes(needle)) {
        for (const h of stack) if (!kept.includes(h)) kept.push(h);
        kept.push(line);
      }
      if (line.heading) stack.push(line);
    }
    if (!kept.length) return `Nothing on the page matches "${options.find}".`;
  }

  const max = options.maxChars ?? 40_000;
  let out = '';
  for (const line of kept) {
    const next = `${'  '.repeat(line.depth)}${line.text}\n`;
    if (out.length + next.length > max) {
      out += `… outline cut at ${max} characters. Narrow it with "within" or "find".\n`;
      break;
    }
    out += next;
  }
  return out.trimEnd();
}
