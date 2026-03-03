# Responsive Space

A web application for audience-participation performances built with [soundworks](https://soundworks.dev) (Ircam).

## Concept

Audience members open the page, see a landing screen, and join the performance. They are then presented with a button — pressing it triggers a sound controlled in real-time by the performer via a separate controller page.

The performer can shape the sound for two independent groups of players simultaneously, choosing between a synthesizer (3 oscillators, ADSR envelope) and sample playback (ASR envelope).

## Pages

| URL | Role | Description |
|---|---|---|
| `http://127.0.0.1:8000` | Player | Landing page → button |
| `http://127.0.0.1:8000/controller` | Controller | Real-time sound control for all groups |

## Tech Stack

- **[soundworks](https://soundworks.dev)** — client/server framework for networked audio performances
- **[Lit](https://lit.dev/)** — lightweight web component library for the UI
- **[sc-components](https://github.com/ircam-ismm/sc-components)** — Ircam UI components
- **Web Audio API** — synthesizer and sample playback engine
- **SCSS** — styles, compiled to CSS

## Project Structure

```
src/
├── server/
│   ├── index.js              # soundworks Server, schemas, audio file watcher
│   ├── schemas/
│   │   ├── sound-params.js   # Global: audioFiles list, resetCounter
│   │   ├── group-params.js   # Per-group: mode, oscillators, ADSR, sampleFile
│   │   └── player-info.js    # Per-player: clientId, groupId
│   └── tmpl/
│       └── default.tmpl      # HTML template for all client roles
├── clients/
│   ├── player/
│   │   ├── index.js          # Player: landing → join → button
│   │   └── audio-engine.js   # Synth + sample playback engine
│   ├── controller/
│   │   └── index.js          # Controller: group controls, player overview
│   ├── components/           # Reusable Lit web components
│   └── styles/               # SCSS source files
public/
└── audio/                    # Audio samples (.wav, .mp3, .ogg, .flac)
config/
└── env-default.yaml          # Server config (port 8000)
```

## Getting Started

Install dependencies:

```bash
npm install
```

Start in development mode (build + watch + server):

```bash
npm run dev
```

Open player: [http://127.0.0.1:8000](http://127.0.0.1:8000)
Open controller: [http://127.0.0.1:8000/controller](http://127.0.0.1:8000/controller)

## Audio Samples

Place audio files (`.wav`, `.mp3`, `.ogg`, `.flac`) in `public/audio/`. They are detected automatically at server startup and watched for changes at runtime — no restart needed when adding or removing files.

## Controller Features

- **2 groups** — players are distributed between Group 1 and Group 2
- **Synth mode** — 3 oscillators with waveform and frequency control, ADSR envelope
- **Sample mode** — sample selection, ASR envelope (sustain fills automatically between attack and release)
- **Master gain** per group
- **Reset** — sends all players back to the landing page

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Build + start server with file watching (primary development command) |
| `npm run build` | One-time build (compile SCSS + bundle JS) |
| `npm run start` | Start server without building |
| `npm run lint` | Run ESLint |

## Testing with Multiple Clients

Emulate multiple audience members in one browser window:

```
http://127.0.0.1:8000?emulate=10
```

## soundworks Wizard

The soundworks wizard is an interactive CLI for managing clients, plugins, and config:

```bash
npx soundworks
```

## Credits

- [soundworks](https://soundworks.dev) is developed by the ISMM team at Ircam
- Built with [Claude Code](https://claude.ai/code)

## License

[BSD-3-Clause](./LICENSE)
