# @roastery/barista

Elysia HTTP server factory for the [Roastery CMS](https://github.com/roastery-cms) ecosystem.

[![Checked with Biome](https://img.shields.io/badge/Checked_with-Biome-60a5fa?style=flat&logo=biome)](https://biomejs.dev)

## Overview

**barista** exposes a `barista` factory function that assembles a pre-configured [Elysia](https://elysiajs.com) application, serving as the HTTP server entry point for Roastery CMS applications. Every cross-cutting concern a Roastery service needs is wired in for you:

- **CORS** (`@elysia/cors`)
- **Typed environment validation** at boot (`env`) — `PORT`/`NODE_ENV` plus any extra schemas you declare
- **Global error handling** (`errorHandler`) — maps `@roastery/terroir` exceptions to HTTP status codes
- **Response shaping** (`responseMapper` + the `serve` decorator) — maps domain entities to DTOs inside a `{ status, data }` envelope
- **Request tracing** (`requestTrace`) — structured per-request logging via `@roastery/aroma`
- **Optional health check** (`elysia-healthcheck`)

A companion [`patron`](#typed-client) helper builds an end-to-end typed Eden Treaty client for any such app.

## Installation

```bash
bun add @roastery/barista
```

---

## Usage

```typescript
import { barista } from '@roastery/barista';
import { t } from '@roastery/terroir';

const app = barista({
  elysia: { name: 'my-service' },
  environmentDTOs: [t.Object({ DATABASE_URL: t.String() })],
  corsConfig: { origin: true },
  healthCheck: true,
})
  .get('/', ({ env, serve }) => serve('OK', { port: env.PORT }))
  .listen(Number(process.env.PORT));
```

`barista` accepts a `BaristaArgs` object — every field is optional, so `barista({})` yields a fully functional app with sensible defaults. It returns the live Elysia instance (chain `.get`, `.post`, `.listen`, …) with the `env` decorator statically typed from your declared schemas.

| Field | Purpose |
|-------|---------|
| `elysia` | Raw `ElysiaConfig` forwarded to `new Elysia(...)` |
| `environmentDTOs` | Extra `t.Object({...})` schemas validated at boot and merged into the typed `env` decorator |
| `aromaArgs` | Options for the shared `@roastery/aroma` logger |
| `corsConfig` | Configuration for `@elysia/cors` |
| `healthCheck` | When `true`, mounts the health-check endpoint |

### Typed client

```typescript
import { patron } from '@roastery/barista/patron';

const client = patron(app);            // in-process, typed from the app's routes
const { data } = await client.index.get();
```

---

## Technologies

| Tool | Purpose |
|------|---------|
| [Elysia](https://elysiajs.com) | HTTP framework for Bun |
| [tsup](https://tsup.egoist.dev) | Bundling to ESM + CJS with `.d.ts` generation |
| [Bun](https://bun.sh) | Runtime, test runner, and package manager |
| [Knip](https://knip.dev) | Unused exports and dependency detection |
| [Husky](https://typicode.github.io/husky) + [commitlint](https://commitlint.js.org) | Git hooks and conventional commit enforcement |

---

## Development

```bash
# Run tests
bun run test:unit

# Run tests with coverage
bun run test:coverage

# Build for distribution
bun run build

# Check for unused exports and dependencies
bun run knip

# Full setup (build + bun link)
bun run setup
```

## License

MIT
