// SPDX-License-Identifier: MIT

/**
 * The print UI's "are you sure you want to leave" hook.
 *
 * The plate editor and the preset editor hold unsaved edits, and two things
 * can take them away: the page's own router (Back is a close, and it never
 * reaches the editor's Cancel path) and leaving the page altogether. An editor
 * registers a guard here while it is dirty; the router asks before it
 * repaints, and `guardPageUnload` asks the browser to confirm an unload. Its
 * own module so neither side has to import the other.
 */

/** Returns false to keep the current panel open. */
export type LeaveGuard = () => boolean;

let guard: LeaveGuard | null = null;
let unsaved: () => boolean = () => false;

/**
 * `hasUnsaved` answers without asking anyone: a page unload can only be
 * confirmed by the browser's own prompt, never by `confirm()`. Without it, a
 * guard counts as unsaved work for as long as it is set.
 */
export function setPrintLeaveGuard(next: LeaveGuard | null, hasUnsaved?: () => boolean): void {
  guard = next;
  unsaved = next === null ? () => false : (hasUnsaved ?? (() => true));
}

export function mayLeavePrintUI(): boolean {
  return guard === null || guard();
}

/** Has the browser confirm leaving the page while an editor holds unsaved edits. */
export function guardPageUnload(): void {
  window.addEventListener('beforeunload', (e) => {
    if (!unsaved()) return;
    e.preventDefault();
    // Chrome before 119 only prompts when returnValue is set.
    e.returnValue = '';
  });
}
