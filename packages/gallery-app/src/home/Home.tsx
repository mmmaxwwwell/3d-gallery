// SPDX-License-Identifier: MIT
/** @jsxImportSource preact */
import guide from '../../../../docs/user-guide.md?raw';
import { SETTINGS_PATH, VIEWS, viewHref } from '../shell/views.js';
import { lastOpen } from '../shell/last-open.js';
import { renderGuide, sectionLead } from './guide.js';

const GUIDE_HTML = renderGuide(guide);

/**
 * The front page: what the app is, a way into each view, and the user guide.
 * Every word about the views comes from the guide; this file only lays it out.
 */
export function Home() {
  const secure = location.protocol === 'https:';
  return (
    <main class="home">
      <header class="home-hero">
        <h1 class="home-title">3d-gallery</h1>
        <p class="home-tagline">Design, slice, print and queue 3D prints, all in your browser.</p>
      </header>

      {secure && (
        <p class="home-banner" role="note">
          <strong>Printer control needs plain HTTP.</strong> Browsers don't let a secure (https://) page talk to a
          printer over http://, so here Printers and Operator can only look. To control your printers, open the app
          over http:// on your own network, or use the Android app.
        </p>
      )}

      <ul class="home-cards">
        {VIEWS.filter((v) => v.id !== 'home').map((view) => {
          const lead = sectionLead(guide, view.label);
          return (
            <li key={view.id} class="home-card">
              <a class="home-card-link" href={viewHref(view.id, lastOpen(view.id))}>
                <span class="home-card-icon" aria-hidden="true">{view.icon}</span>
                {view.label}
              </a>
              {lead && <p class="home-card-text" dangerouslySetInnerHTML={{ __html: lead }} />}
            </li>
          );
        })}
        <li class="home-card">
          <a class="home-card-link" href={import.meta.env.BASE_URL + SETTINGS_PATH}>
            <span class="home-card-icon" aria-hidden="true">⚙️</span>
            Settings
          </a>
          <p class="home-card-text">Import your OrcaSlicer setup, and edit presets and templates.</p>
        </li>
      </ul>

      <article class="home-guide" dangerouslySetInnerHTML={{ __html: GUIDE_HTML }} />
    </main>
  );
}
