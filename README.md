# @roastery/barista

Elysia HTTP server factory for the [Roastery CMS](https://github.com/roastery-cms) ecosystem.

[![Checked with Biome](https://img.shields.io/badge/Checked_with-Biome-60a5fa?style=flat&logo=biome)](https://biomejs.dev)

## Overview

**barista** exposes a `Barista` factory function that wraps [Elysia](https://elysiajs.com), serving as the HTTP server entry point for Roastery CMS applications.

## Installation

```bash
bun add @roastery/barista
```

**Peer dependencies** (install alongside):

```bash
bun add elysia
```

---

## Usage

```typescript
import { Barista } from '@roastery/barista';

const app = Barista({ name: 'my-app' })
  .get('/', () => 'Hello, world!')
  .listen(3000);
```

`Barista` accepts the same configuration as `new Elysia(config)` and returns an Elysia instance.

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
