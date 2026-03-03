import '@soundworks/helpers/polyfills.js';
import { Client } from '@soundworks/core/client.js';
import { loadConfig, launcher } from '@soundworks/helpers/browser.js';
import { html, render } from 'lit';

import '../components/sw-audit.js';

async function main($container) {
  const config = loadConfig();
  const client = new Client(config);

  launcher.register(client, { initScreensContainer: $container });

  await client.start();

  const soundParams = await client.stateManager.attach('sound-params');
  const groupCollection = await client.stateManager.getCollection('group-params');
  const playerInfoCollection = await client.stateManager.getCollection('player-info');

  function renderApp() {
    const audioFiles = soundParams.get('audioFiles') ?? [];

    // Determine which groups are occupied, sorted by groupId
    const playerInfos = [...playerInfoCollection];
    const occupiedGroupIds = new Set(playerInfos.map(s => s.get('groupId')));
    const activeGroups = [...groupCollection]
      .filter(s => occupiedGroupIds.has(s.get('groupId')))
      .sort((a, b) => a.get('groupId') - b.get('groupId'));

    render(html`
      <div class="controller-layout">
        <header>
          <h1>${config.app.name} — Controller</h1>
          <sw-audit .client="${client}"></sw-audit>
        </header>
        <section>
          <div class="param-group">
            <button
              class="reset-btn"
              @click=${() => soundParams.set({ resetCounter: soundParams.get('resetCounter') + 1 })}
            >Reset Players → Landing</button>
          </div>

          ${activeGroups.length === 0
            ? html`<p class="no-players">Keine Player verbunden</p>`
            : html`
              <div class="groups-grid groups-${activeGroups.length}">
                ${activeGroups.map((groupState, i) =>
                  renderGroupCard(groupState, i, playerInfos, audioFiles)
                )}
              </div>
            `
          }
        </section>
      </div>
    `, $container);
  }

  function renderGroupCard(groupState, colIndex, playerInfos, audioFiles) {
    const p = groupState.getValues();
    const groupId = p.groupId;
    const playersInGroup = playerInfos
      .filter(s => s.get('groupId') === groupId)
      .map(s => s.get('clientId'));

    return html`
      <div class="group-card">
        <div class="group-card-header">
          <span>Gruppe ${colIndex + 1}</span>
          <span class="player-tags">
            ${playersInGroup.map((id, i) => html`<span class="player-tag">P${i + 1}</span>`)}
          </span>
        </div>

        <!-- Mode -->
        <div class="param-group">
          <label>Mode</label>
          <div class="mode-buttons">
            <button
              class="mode-btn ${p.mode === 'synth' ? 'active' : ''}"
              @click=${() => groupState.set({ mode: 'synth' })}
            >Synth</button>
            <button
              class="mode-btn ${p.mode === 'sample' ? 'active' : ''}"
              @click=${() => groupState.set({ mode: 'sample' })}
            >Sample</button>
          </div>
        </div>

        <!-- Master Gain -->
        <div class="param-group">
          <label>Gain: ${p.masterGain.toFixed(2)}</label>
          <input type="range" min="0" max="1" step="0.01"
            .value=${p.masterGain}
            @input=${e => groupState.set({ masterGain: parseFloat(e.target.value) })}
          />
        </div>

        <!-- Synth Controls -->
        ${p.mode === 'synth' ? html`
          ${[0, 1, 2].map(i => html`
            <div class="param-group osc-group">
              <label>Osc ${i + 1}</label>
              <div class="osc-row">
                <span class="sub-label">Type</span>
                <select
                  .value=${p[`oscType${i}`]}
                  @change=${e => groupState.set({ [`oscType${i}`]: e.target.value })}
                >
                  ${['sine', 'square', 'sawtooth', 'triangle'].map(t => html`
                    <option value="${t}" ?selected=${p[`oscType${i}`] === t}>${t}</option>
                  `)}
                </select>
              </div>
              <div class="osc-row">
                <span class="sub-label">Freq: ${p[`oscFreq${i}`].toFixed(0)} Hz</span>
                <input type="range" min="20" max="5000" step="1"
                  .value=${p[`oscFreq${i}`]}
                  @input=${e => groupState.set({ [`oscFreq${i}`]: parseFloat(e.target.value) })}
                />
              </div>
            </div>
          `)}
        ` : ''}

        <!-- Sample Controls -->
        ${p.mode === 'sample' ? html`
          <div class="param-group">
            <label>Sample</label>
            <select
              .value=${p.sampleFile}
              @change=${e => groupState.set({ sampleFile: e.target.value })}
            >
              ${audioFiles.map(f => html`
                <option value="${f}" ?selected=${p.sampleFile === f}>${f}</option>
              `)}
            </select>
          </div>
        ` : ''}

        <!-- ADSR Envelope -->
        <div class="param-group">
          <label>Envelope</label>
          ${[
            { key: 'attack',  label: 'A', min: 0.001, max: 2.0, step: 0.001 },
            { key: 'decay',   label: 'D', min: 0.001, max: 2.0, step: 0.001, dimmed: p.mode === 'sample' },
            { key: 'sustain', label: 'S', min: 0,     max: 1.0, step: 0.01,  dimmed: p.mode === 'sample' },
            { key: 'release', label: 'R', min: 0.01,  max: 5.0, step: 0.01 },
          ].map(({ key, label, min, max, step, dimmed }) => html`
            <div class="adsr-row ${dimmed ? 'dimmed' : ''}">
              <span class="sub-label">${label}: ${p[key].toFixed(2)}</span>
              <input type="range" min="${min}" max="${max}" step="${step}"
                .value=${p[key]}
                ?disabled=${dimmed}
                @input=${e => groupState.set({ [key]: parseFloat(e.target.value) })}
              />
            </div>
          `)}
        </div>
      </div>
    `;
  }

  groupCollection.onAttach(() => renderApp());
  groupCollection.onDetach(() => renderApp());
  groupCollection.onUpdate(() => renderApp());   // correct API: onUpdate, not onChange

  playerInfoCollection.onAttach(() => renderApp());
  playerInfoCollection.onDetach(() => renderApp());

  soundParams.onUpdate(() => renderApp());

  renderApp();
}

launcher.execute(main, { numClients: 1 });
