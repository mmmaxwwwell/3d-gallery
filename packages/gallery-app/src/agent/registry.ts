// SPDX-License-Identifier: MIT
/**
 * Where a view tells the agent bridge what it knows and what it can do.
 *
 * A view calls `registerAgentView` once it mounts. Its `state()` is what
 * `app_state` returns for the page, and its actions are what `app_action`
 * runs: the view's own code paths, so the agent and the person get the same
 * behaviour. Outside the dev server nothing listens, and registering is a
 * no-op.
 */

export interface AgentAction {
  description: string;
  /** JSON Schema of the arguments. */
  args?: Record<string, unknown>;
  /** Changes stored data or reaches a printer. */
  writes?: boolean;
  run(args: Record<string, unknown>, ctx: AgentActionContext): unknown | Promise<unknown>;
}

export interface AgentActionContext {
  /** True when the agent passed confirm: the person has answered the question this action asks. */
  confirmed: boolean;
}

export interface AgentView {
  state(): unknown | Promise<unknown>;
  actions?: Record<string, AgentAction>;
}

let current: AgentView | null = null;

export function registerAgentView(view: AgentView): void {
  if (!import.meta.hot) return;
  current = view;
}

export function registeredView(): AgentView | null {
  return current;
}

/** An action needs the person's yes: thrown until the agent passes confirm: true. */
export class NeedsConfirmation extends Error {
  constructor(question: string) {
    super(`Needs the person's answer first: ${question} Ask them, then repeat the call with confirm: true.`);
  }
}
