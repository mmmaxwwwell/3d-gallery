// SPDX-License-Identifier: MIT
/** @jsxImportSource preact */
// Settings' "Assistant" block: sign in with kanidm and connect this browser's
// tabs to the person's assistant agent through claude-runner's relay.
// Settings is where kanidm sends the browser back, so it also finishes sign-in.

import { useEffect, useState } from 'preact/hooks';
import { completeSignIn, disconnectRemote, reconnectRemote, remoteState, signOutRemote, startSignIn } from './remote.js';

/** Kanidm only redirects to https or localhost (owner's choice, 2026-10-17). */
function canSignIn(): boolean {
  return location.protocol === 'https:' || location.hostname === 'localhost';
}

export function ConnectAssistant() {
  const [state, setState] = useState(remoteState);
  const [error, setError] = useState('');

  useEffect(() => {
    completeSignIn()
      // A page load starts the bridge, so a fresh connection starts on the next one.
      .then((done) => { if (done) location.reload(); })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : String(err)));
  }, []);

  const connect = () => {
    setError('');
    if (state.signedIn) {
      reconnectRemote();
      location.reload();
      return;
    }
    startSignIn(state.config).catch((err: unknown) => setError(err instanceof Error ? err.message : String(err)));
  };

  return (
    <div class="print-settings-server" data-agent-remote>
      <h4>Assistant</h4>
      <p class="print-settings-help">
        Let your assistant agent see and use this app in this browser, from your phone or watch. It signs
        in as you with kanidm, works only in tabs you've connected, and asks before anything that starts a
        printer or deletes data.{' '}
        <strong>{state.connected ? 'Connected: open tabs talk to your assistant.' : state.signedIn ? 'Signed in, not connected.' : 'Not connected.'}</strong>
      </p>
      {!canSignIn() && (
        <p class="print-settings-help">
          Open the app as <code>http://localhost:5173</code> or on the https site to connect; kanidm won't
          sign in at this address.
        </p>
      )}
      <div class="print-settings-server-actions">
        {!state.connected && (
          <button type="button" class="btn btn-secondary" disabled={!canSignIn()} onClick={connect}>
            Connect assistant
          </button>
        )}
        {state.connected && (
          <button type="button" class="btn btn-secondary" onClick={() => { disconnectRemote(); location.reload(); }}>
            Disconnect
          </button>
        )}
        {state.signedIn && (
          <button type="button" class="btn btn-secondary" onClick={() => { signOutRemote(); setState(remoteState()); }}>
            Sign out
          </button>
        )}
      </div>
      {error && <p class="print-settings-help" role="alert">{error}</p>}
    </div>
  );
}
