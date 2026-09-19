// SPDX-License-Identifier: MIT

/**
 * The print UI's "are you sure you want to leave" hook.
 *
 * The plate editor holds unsaved edits and the router can close it from under
 * them — Back is a close, and it never reaches the dialog's own Cancel path.
 * The dialog registers a guard here while it is dirty; the router asks before
 * it repaints. Its own module so neither side has to import the other.
 */

/** Returns false to keep the current panel open. */
export type LeaveGuard = () => boolean;

let guard: LeaveGuard | null = null;

export function setPrintLeaveGuard(next: LeaveGuard | null): void {
  guard = next;
}

export function mayLeavePrintUI(): boolean {
  return guard === null || guard();
}
