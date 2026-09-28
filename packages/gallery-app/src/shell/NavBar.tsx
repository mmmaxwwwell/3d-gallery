// SPDX-License-Identifier: MIT
/** @jsxImportSource preact */
import { useEffect, useState } from 'preact/hooks';
import { SETTINGS_PATH, VIEWS, viewHref, type PageId } from './views.js';
import { lastOpen } from './last-open.js';
import { getBadge, onBadgeChange } from './badges.js';

interface NavBarProps {
  current: PageId;
}

/**
 * The view switcher on every page: a bottom bar on a phone, a left rail on a
 * wide screen (the switch is pure CSS, in shell.css). Labels always show —
 * five bare icons would be a guessing game.
 */
export function NavBar({ current }: NavBarProps) {
  // Badges and other tabs' last URLs are written by other pages; a re-render
  // is all it takes to pick them up.
  const [, setTick] = useState(0);
  useEffect(() => {
    const refresh = () => setTick((n) => n + 1);
    const off = onBadgeChange(refresh);
    window.addEventListener('storage', refresh);
    window.addEventListener('pageshow', refresh);
    return () => {
      off();
      window.removeEventListener('storage', refresh);
      window.removeEventListener('pageshow', refresh);
    };
  }, []);

  return (
    <nav class="shell-nav" aria-label="Views">
      <ul class="shell-tabs">
        {VIEWS.map((view) => {
          const here = view.id === current;
          const badge = getBadge(view.id);
          return (
            <li key={view.id}>
              <a
                class="shell-tab"
                data-view={view.id}
                href={viewHref(view.id, lastOpen(view.id))}
                aria-current={here ? 'page' : undefined}
                onClick={(e) => {
                  if (here) e.preventDefault();
                }}
              >
                <span class="shell-tab-icon" aria-hidden="true">{view.icon}</span>
                <span class="shell-tab-label">{view.label}</span>
                {badge && <span class="shell-badge">{badge}</span>}
              </a>
            </li>
          );
        })}
      </ul>
      <a
        class="shell-settings"
        href={import.meta.env.BASE_URL + SETTINGS_PATH}
        aria-current={current === 'settings' ? 'page' : undefined}
        aria-label="Settings"
        title="Settings"
      >
        <span aria-hidden="true">⚙️</span>
      </a>
    </nav>
  );
}
