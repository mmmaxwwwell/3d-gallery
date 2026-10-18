// SPDX-License-Identifier: MIT
/**
 * The wire between the dev server and a gallery tab. Imported by both sides,
 * so it stays free of Node builtins and DOM globals.
 *
 * Every message rides the Vite HMR socket as a custom event. A tab names
 * itself with an id kept in its `sessionStorage`, so it keeps the same id
 * across the full page loads that switching views causes, while its socket
 * changes underneath.
 */

export const EVENT_HELLO = 'agent:hello';
export const EVENT_CALL = 'agent:call';
export const EVENT_REPLY = 'agent:reply';

/** What a tab says about itself on connect and whenever it changes. */
export interface TabHello {
  tab: string;
  /** The shell's page id: home, models, project, printers, operator, settings. */
  view: string;
  /** location.origin. Presets and projects live per origin, so new tabs must open on this one. */
  origin: string;
  url: string;
  title: string;
  visible: boolean;
  focused: boolean;
  /** Unique per page load, so the server can tell a reload from a repeat hello. */
  load: string;
}

export interface TabCall {
  id: string;
  tab: string;
  op: string;
  args: Record<string, unknown>;
}

export type TabReply =
  | { id: string; tab: string; ok: true; result: unknown }
  | { id: string; tab: string; ok: false; error: string };

/** One action a view offers the agent, as listed by `app_state`. */
export interface ActionInfo {
  name: string;
  description: string;
  /** JSON Schema of its arguments. */
  args?: Record<string, unknown>;
  /** Changes stored data or reaches a printer. */
  writes?: boolean;
}
