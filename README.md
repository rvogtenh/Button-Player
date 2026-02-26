# Button Player

A web application for audience-participation performances built with [soundworks](https://soundworks.dev) (Ircam).

## Concept

When a participant opens the page and joins the performance, they see a button. Pressing the button triggers a synthesizer sound with a short attack and longer release — designed for live audience interaction.

## Tech Stack

- **[soundworks](https://soundworks.dev)** — client/server framework for networked audio performances
- **[Lit](https://lit.dev/)** — lightweight web component library for the UI
- **[sc-components](https://github.com/ircam-ismm/sc-components)** — Ircam UI components
- **Web Audio API** — synthesizer sound engine
- **SCSS** — styles, compiled to CSS

## Project Structure

```
src/
├── server/
│   ├── index.js          # soundworks Server, registers schemas and plugins
│   └── tmpl/
│       └── default.tmpl  # HTML template served to browser clients
├── clients/
│   ├── player/
│   │   └── index.js      # Player client entry point (UI + Web Audio)
│   ├── components/       # Reusable Lit web components
│   └── styles/           # SCSS source files
config/
└── env-default.yaml      # Server config (port 8000)
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

Open in browser: [http://127.0.0.1:8000](http://127.0.0.1:8000)

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

Override the default port:

```bash
PORT=3000 npm run start
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
