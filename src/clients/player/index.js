import '@soundworks/helpers/polyfills.js';
import { Client } from '@soundworks/core/client.js';
import { loadConfig, launcher } from '@soundworks/helpers/browser.js';
import { html, render } from 'lit';

import '../components/sw-credits.js';

// Shared across emulated clients — created lazily on first user gesture
let audioContext = null;

function playSound() {
  const now = audioContext.currentTime;

  const osc1 = audioContext.createOscillator();
  const osc2 = audioContext.createOscillator();
  const gain = audioContext.createGain();

  osc1.connect(gain);
  osc2.connect(gain);
  gain.connect(audioContext.destination);

  // Two slightly detuned sines for a full, warm tone
  osc1.type = 'sine';
  osc1.frequency.value = 220;
  osc2.type = 'sine';
  osc2.frequency.value = 220 * 2.005; // subtle beating

  // Envelope: short attack (30 ms), longer exponential release (1.5 s)
  const attack = 0.03;
  const release = 1.5;

  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.5, now + attack);
  gain.gain.exponentialRampToValueAtTime(0.001, now + attack + release);

  osc1.start(now);
  osc2.start(now);
  osc1.stop(now + attack + release);
  osc2.stop(now + attack + release);
}

async function main($container) {
  const config = loadConfig();
  const client = new Client(config);

  launcher.register(client, { initScreensContainer: $container });

  await client.start();

  async function onTrigger() {
    // Create AudioContext on first gesture (browser autoplay policy)
    if (!audioContext) {
      audioContext = new AudioContext();
    }
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }
    playSound();
  }

  function renderApp() {
    render(html`
      <div class="simple-layout">
        <div class="trigger-layout">
          <button
            class="trigger-btn"
            @pointerdown=${onTrigger}
          >Play</button>
        </div>
        <sw-credits .infos="${client.config.app}"></sw-credits>
      </div>
    `, $container);
  }

  renderApp();
}

// `?emulate=N` runs N clients side-by-side in the same page
launcher.execute(main, {
  numClients: parseInt(new URLSearchParams(window.location.search).get('emulate')) || 1,
});
