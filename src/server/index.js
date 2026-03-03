import '@soundworks/helpers/polyfills.js';
import { Server } from '@soundworks/core/server.js';
import { loadConfig } from '@soundworks/helpers/node.js';
import { readdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import chokidar from 'chokidar';

import '../utils/catch-unhandled-errors.js';
import soundParamsSchema from './schemas/sound-params.js';
import groupParamsSchema from './schemas/group-params.js';
import playerInfoSchema from './schemas/player-info.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const config = loadConfig(process.env.ENV, import.meta.url);

console.log(`
--------------------------------------------------------
- launching "${config.app.name}" in "${process.env.ENV || 'default'}" environment
- [pid: ${process.pid}]
--------------------------------------------------------
`);

const server = new Server(config);
server.useDefaultApplicationTemplate();

// Register all schemas before server.start()
server.stateManager.registerSchema('sound-params', soundParamsSchema);
server.stateManager.registerSchema('group-params', groupParamsSchema);
server.stateManager.registerSchema('player-info', playerInfoSchema);

await server.start();

// Read available audio files
const audioDir = join(__dirname, '../../public/audio');

async function getAudioFiles() {
  const files = await readdir(audioDir).catch(() => []);
  return files.filter(f => /\.(wav|mp3|ogg|flac)$/i.test(f)).sort();
}

const audioFiles = await getAudioFiles();
const defaultSample = audioFiles[0] ?? '';

// Global state: audioFiles list + resetCounter
const soundParamsState = await server.stateManager.create('sound-params');
await soundParamsState.set({ audioFiles });

// Two group states — one per performance group
const groupState0 = await server.stateManager.create('group-params', { groupId: 0, sampleFile: defaultSample });
const groupState1 = await server.stateManager.create('group-params', { groupId: 1, sampleFile: defaultSample });

// Watch public/audio/ at runtime
chokidar.watch(audioDir, { ignoreInitial: true }).on('all', async () => {
  const updated = await getAudioFiles();
  await soundParamsState.set({ audioFiles: updated });

  // Keep each group's sampleFile valid
  for (const gs of [groupState0, groupState1]) {
    const current = gs.get('sampleFile');
    if (!updated.includes(current)) {
      await gs.set({ sampleFile: updated[0] ?? '' });
    }
  }

  console.log('[audio-watcher] files updated:', updated);
});
