import '@soundworks/helpers/polyfills.js';
import { Client } from '@soundworks/core/client.js';
import { loadConfig, launcher } from '@soundworks/helpers/browser.js';
import { html, render } from 'lit';

import '../components/sw-credits.js';
import '../components/sw-landing.js';
import { AudioEngine } from './audio-engine.js';

// Module-level: survive soundworks reconnects (main() is re-called on reconnect)
let audioContext = null;
let engine = null;
let joined = false;
let playerInfo = null;     // player-info state (deleted on reset / disconnect)
let myGroupState = null;   // group-params state this player belongs to

const SESSION_KEY = 'sw-player-session';

function saveSession(groupId, resetCounter) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({ joined: true, groupId, resetCounter }));
}

function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
}

function loadSession() {
  try {
    return JSON.parse(sessionStorage.getItem(SESSION_KEY) ?? 'null');
  } catch {
    return null;
  }
}

async function main($container) {
  const config = loadConfig();
  const client = new Client(config);

  launcher.register(client, { initScreensContainer: $container });

  await client.start();

  // Global state: listen for resetCounter changes
  const soundParams = await client.stateManager.attach('sound-params');

  // Get both group states; pick ours by client.id % 2
  const groupCollection = await client.stateManager.getCollection('group-params');
  const groups = [...groupCollection].sort((a, b) => a.get('groupId') - b.get('groupId'));

  // Clean up stale module-level references from previous connection
  if (engine) { engine.dispose(); engine = null; }
  playerInfo = null;
  myGroupState = null;

  function renderLanding() {
    render(html`<sw-landing @join=${onJoin}></sw-landing>`, $container);
  }

  function renderPlayer() {
    render(html`
      <div class="simple-layout">
        <div class="trigger-layout">
          <button class="trigger-btn" @pointerdown=${onTrigger}>Play</button>
        </div>
        <sw-credits .infos="${config.app}"></sw-credits>
      </div>
    `, $container);
  }

  async function onJoin(groupId) {
    const resolvedGroupId = groupId ?? (client.id % 2);
    myGroupState = groups[resolvedGroupId] ?? groups[0];
    const actualGroupId = myGroupState.get('groupId');

    joined = true;
    saveSession(actualGroupId, soundParams.get('resetCounter'));

    if (!audioContext) {
      audioContext = new AudioContext();
    }

    // Create player-info so controller can display this player in the right column
    playerInfo = await client.stateManager.create('player-info', {
      clientId: client.id,
      groupId: actualGroupId,
    });

    engine = new AudioEngine(audioContext);
    engine.updateParams(myGroupState.getValues());
    myGroupState.onUpdate(values => engine.updateParams(values));

    renderPlayer();
  }

  async function onTrigger() {
    if (!engine) return;
    if (audioContext && audioContext.state === 'suspended') {
      await audioContext.resume();
    }
    engine.trigger();
  }

  async function onReset() {
    if (playerInfo) { playerInfo.detach(); playerInfo = null; }
    if (engine) { engine.dispose(); engine = null; }
    myGroupState = null;
    joined = false;
    clearSession();
    renderLanding();
  }

  soundParams.onUpdate(values => {
    if ('resetCounter' in values) {
      onReset();
    }
  });

  // Restore state: reconnect within same JS session
  if (joined && myGroupState) {
    engine = new AudioEngine(audioContext);
    engine.updateParams(myGroupState.getValues());
    myGroupState.onUpdate(values => engine.updateParams(values));
    playerInfo = await client.stateManager.create('player-info', {
      clientId: client.id,
      groupId: myGroupState.get('groupId'),
    });
    renderPlayer();
  } else {
    // Page reload: check sessionStorage
    const session = loadSession();
    if (session?.joined && session.resetCounter === soundParams.get('resetCounter')) {
      await onJoin(session.groupId);
    } else {
      renderLanding();
    }
  }
}

// `?emulate=N` runs N clients side-by-side in the same page
launcher.execute(main, {
  numClients: parseInt(new URLSearchParams(window.location.search).get('emulate')) || 1,
});
