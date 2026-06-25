# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0]

### Added

- `barista` factory now assembles a full Elysia middleware pipeline out of the
  box: CORS, an `aroma` logger decorator, error handling, response mapping,
  request tracing, boot-time environment validation, an optional health-check
  endpoint, and the `serve` decorator.
- `env` plugin — validates environment variables at boot time and injects them
  as a fully typed `env` decorator. Composes any extra `t.Object({...})` schemas
  on top of the built-in base schema, and terminates the process when validation
  fails.
- `ServerDependenciesDTO` schema and its inferred type — the base environment
  schema (`PORT`, `NODE_ENV`) always included by the `env` plugin.
- `errorHandler` plugin — global handler that translates thrown exceptions into
  structured HTTP responses (both `@roastery/terroir` `CoreException`s and plain
  errors) and logs each failure through an `@roastery/aroma` logger.
- `STATUS_CODE_MAP` — lookup table mapping each `@roastery/terroir` exception
  layer and constructor name to its HTTP status code, with a `500` fallback.
- `responseMapper` plugin — unwraps the `{ status, data }` envelope produced by
  `serve` after a handler runs and applies it to the real HTTP response.
- `requestTrace` plugin — logs every successful request once its response is
  sent, including the request's wall-clock duration.
- `serve` decorator — builds the response envelope from a handler's payload,
  mapping domain entities (and entity arrays) to their DTOs via
  `@roastery/beans` `Mapper.toDTO`.
- `patron` helper — builds an end-to-end typed Eden Treaty client for a
  `barista` (or any Elysia) app, callable in-process or against a remote URL.
- `HTTP_STATUS` constant plus the `HttpStatusName` and `HttpStatusCode` types.
- `BaristaResponse` type — the internal `{ status, data }` envelope shared
  across the pipeline.
- `Barista` type — the fully typed shape of the application returned by the
  factory, exported for consumers.
- Global `NodeJS.Process` augmentation exposing the `baristaHas*` plugin-singleton
  guard flags.
- JSDoc documentation across the public surface, covering type parameters,
  arguments, return types, thrown exceptions, and usage examples — including the
  `env` plugin function and the `ServerDependenciesDTO` schema and its inferred
  type (with field descriptions for `PORT` and `NODE_ENV`).
- New dependencies: `@elysia/cors`, `@elysia/eden`, `@roastery/aroma`,
  `@roastery/beans`, `@roastery/terroir`, and `elysia-healthcheck`.

### Changed

- Bumped `elysia` from `^1.4.27` to `^1.4.29`.
- `test:unit` and `test:coverage` scripts now run with `NODE_ENV=TESTING`.
