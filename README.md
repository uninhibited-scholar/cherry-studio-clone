# Cherry Studio Clone

A from-scratch replication of [Cherry Studio](https://github.com/CherryHQ/cherry-studio) — an Electron-based AI desktop client.

## Tech Stack

| Layer | Technology |
|---|---|
| Desktop runtime | Electron |
| Frontend | React 19 + React Router |
| Language | TypeScript (full-stack) |
| Build | electron-vite + pnpm |
| UI | Tailwind CSS v4 |
| Database | SQLite + Drizzle ORM |
| AI SDK | Vercel `@ai-sdk/*` |

## Architecture

```
src/
├── main/           # Electron main process (Node.js)
│   ├── ai/         # AI core: AiService, provider factory, MCP, agents
│   ├── core/       # Bootstrap, lifecycle, window manager, logger, paths
│   ├── data/       # SQLite schemas (Drizzle), data layer services
│   ├── features/   # Knowledge base, file processing, API gateway
│   └── services/   # Web search, translate, OCR, tray, updater …
├── preload/        # contextBridge IPC bridge
├── renderer/       # React app
│   ├── pages/      # Chat, Agents, Knowledge, Paintings, Translate, Notes …
│   ├── components/ # Shared UI components
│   ├── hooks/      # Custom React hooks
│   └── styles/     # Tailwind globals
└── shared/         # Types, IPC channels, config constants (main + renderer)
```

## Module Roadmap

- [x] Project skeleton — folder structure, tsconfig, electron-vite config
- [x] Drizzle schemas — provider, model, assistant, topic, message
- [x] IPC channel definitions + preload bridge
- [x] App layout with sidebar navigation
- [x] Page scaffolds — Chat, Agents, Knowledge, Paintings, Translate, Notes, Mini Apps, Settings
- [ ] Provider factory — OpenAI / Anthropic / Gemini / Ollama / Azure
- [ ] Chat UI — streaming messages, multi-topic, assistant sidebar, InputBar
- [ ] Settings — provider & model management UI
- [ ] MCP (Model Context Protocol) tool calling
- [ ] Knowledge base / RAG pipeline
- [ ] AI Painting, Translation, Notes, Mini Apps
- [ ] Quick Assistant overlay, Selection toolbar
- [ ] Data sync — WebDAV, S3

## Development

```bash
pnpm install
pnpm dev       # start Electron in dev mode
pnpm build     # production build
pnpm test      # run Vitest tests
```

Requires **Node ≥ 22** and **pnpm ≥ 10**.
