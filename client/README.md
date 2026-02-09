# Survivor Arena — Client

## Setup

```bash
cd client
npm install
cp .env.example .env
npm run dev
```

Open `http://localhost:5173`. Navigate: Landing → Login (any email) → Lobby → Room → [DEV] Start game locally.

## Dev shortcuts

- In the Room page, click **[DEV] Start game locally** to jump into the Phaser canvas without a server.
- Move with **A/D** or arrow keys, jump with **W/Space/Up**.
- Physics debug is enabled in dev mode (green collision boxes).

## Architecture

- `src/ui/` — Svelte pages and components (menus, HUD, overlays)
- `src/game/` — Phaser scenes, entities, systems (zero Svelte)
- `src/lib/stores/` — Svelte 5 rune stores (bridge between Svelte ↔ Phaser)
- `src/lib/network/` — WebSocket + protocol types + message handler
- `src/lib/api/` — REST API client
