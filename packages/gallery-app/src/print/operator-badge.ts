// SPDX-License-Identifier: MIT
// The Operator tab's countdown, worked out wherever a plan is kept. The
// runbook keeps it fresh while it's open; this is how it moves when the plan
// changes somewhere else, with the runbook shut.

import { setBadge } from '../shell/badges.js';
import { loadPlanSnapshot } from './plan-snapshot.js';
import { sessions, tripBadge } from './operator-model.js';
import { listSessionLogs } from './operator-store.js';

export async function refreshOperatorBadge(projectId: string, now = Date.now()): Promise<void> {
  const plan = loadPlanSnapshot(projectId);
  if (!plan) return;
  const logs = new Map((await listSessionLogs(projectId)).map((l) => [l.key, l]));
  setBadge('operator', tripBadge(sessions(plan), (key) => logs.get(key), now));
}
