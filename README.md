# Personal website (mikyss.ru)

React SPA — portfolio and projects. Built with Vite, TanStack Router, Tailwind CSS. Theme follows system preference and is persisted in `localStorage`.

## Stack

- **React 19** + **TypeScript**
- **Vite 7** — dev server and build
- **TanStack Router** — file-based routing
- **Tailwind CSS 4** — styling
- **i18next** — i18n

## Development

**Prerequisites:** Node.js 22+ and npm.

```bash
npm install
npm run dev
```

- App: [http://localhost:5173](http://localhost:5173)
- Build: `npm run build`
- Preview build: `npm run preview`
- Lint: `npm run lint`

## Docker

Multi-stage build: Node builds the app, nginx serves static files.

**Build and run:**

```bash
docker compose up -d --build
```

The app listens on port 80 inside the container. No port is published by default; it’s intended to sit behind a reverse proxy.

**External network:** Compose uses the `proxy-net` network. Create it once if it doesn’t exist:

```bash
docker network create proxy-net
```

## Deployment (VDS + nginx proxy)

1. **Build and run** the portfolio on the server (e.g. in its own directory) with the same `docker-compose.yml`, so the `portfolio` container is on `proxy-net`.

2. **Reverse proxy:** Nginx (or another proxy) must also be on `proxy-net` and proxy to `http://portfolio:80`.

   A reference config for the proxy is in `deploy/mikyss.ru.conf`. Copy it into your nginx `conf.d` (e.g. `/opt/nginx-proxy/conf.d/`) and reload nginx.

3. **HTTPS:** Certificates (e.g. Let’s Encrypt) are handled by the proxy; the container only serves HTTP.

## Project layout

```
src/
  app/
    routes/          # TanStack Router (index, portfolio, …)
    main.tsx
  components/
  lib/
  styles/
deploy/              # Nginx proxy configs for deployment
Dockerfile
nginx.conf           # In-container nginx for SPA
docker-compose.yml
```
