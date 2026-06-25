/**
 * `@roastery/barista` — the HTTP server factory for the Roastery CMS ecosystem.
 *
 * The package centres on the {@link barista} factory, which assembles a
 * pre-configured {@link https://elysiajs.com | Elysia} application with the
 * cross-cutting concerns every Roastery service needs already wired in: CORS,
 * boot-time environment validation, structured error handling, response
 * shaping, request tracing, an optional health-check endpoint, and a `serve`
 * decorator that maps domain entities to DTOs. The companion {@link patron}
 * helper builds an end-to-end typed Eden Treaty client for any such app.
 *
 * @packageDocumentation
 */

import Elysia, { type ElysiaConfig } from "elysia";
import { createAroma, type CreateAromaArgs } from "@roastery/aroma";
import { errorHandler } from "./packages/error-handler";
import { responseMapper } from "./packages/response-mapper";
import { env } from "./packages/env";
import type { ServerDependenciesDTO } from "./packages/env/dtos";
import { cors, type CORSConfig } from "@elysia/cors";
import { healthcheckPlugin } from "elysia-healthcheck";
import { requestTrace } from "./packages/request-trace";
import { serve } from "./packages/serve";
import type { HttpStatusCode, HttpStatusName } from "./constants";
import type { t } from "@roastery/terroir";

/**
 * Configuration accepted by the {@link barista} factory. Every field is
 * optional — calling `barista({})` yields a fully functional app with sensible
 * defaults for each concern.
 *
 * @typeParam ContentType - Tuple of TypeBox object schemas describing the extra
 *   environment variables to validate at boot, beyond the built-in
 *   `PORT`/`NODE_ENV` from {@link ServerDependenciesDTO}. Flows into
 *   `environmentDTOs` and into the typed `env` decorator of the returned app.
 * @typeParam BasePath - Base path prefix forwarded to the underlying
 *   `ElysiaConfig`; mounts every route under this prefix (e.g. `"/api"`).
 */
type BaristaArgs<
	ContentType extends t.TObject[],
	BasePath extends string = "",
> = {
	/** Raw `ElysiaConfig` forwarded to `new Elysia(...)` (name, prefix, adapter, etc.). Defaults to `{}`. */
	elysia?: ElysiaConfig<BasePath>;
	/** Extra `t.Object({...})` schemas validated at boot by the {@link env} plugin and merged into the typed `env` decorator. */
	environmentDTOs?: ContentType;
	/** Options forwarded to `createAroma` from `@roastery/aroma`; shared by the `aroma` logger decorator, {@link errorHandler}, and {@link requestTrace}. */
	aromaArgs?: CreateAromaArgs;
	/** Configuration for the `@elysia/cors` plugin. Omit for the plugin's defaults. */
	corsConfig?: CORSConfig;
	/** When `true`, mounts `elysia-healthcheck` to expose a health-check endpoint. Disabled by default. */
	healthCheck?: boolean;
};

/**
 * Static type of the application returned by the {@link barista} factory.
 *
 * It is the underlying {@link https://elysiajs.com | Elysia} instance with the
 * decorators Barista installs surfaced in its singleton — `aroma` (the
 * `@roastery/aroma` logger), the boot-validated `env`, and the `serve` response
 * builder — so handler contexts (`({ env, serve, aroma }) => ...`) are fully
 * typed. It is supplied as an explicit annotation on {@link barista} so that
 * TypeScript can serialise the return type into the emitted declaration files:
 * the fully inferred Elysia type (accumulated across every `.use(...)` plugin)
 * is too large for the compiler to write to a `.d.ts`, which otherwise fails
 * declaration emit with `error TS7056`.
 *
 * @typeParam ContentType - Tuple of TypeBox object schemas for the extra
 *   environment variables; mirrors {@link barista}'s `ContentType`.
 * @typeParam BasePath - Base path prefix for every route; mirrors
 *   {@link barista}'s `BasePath`.
 *
 * @see {@link barista} — the factory that produces this app.
 * @see {@link BaristaArgs} — the factory's configuration shape.
 */
export type Barista<
	ContentType extends t.TObject[] = [],
	BasePath extends string = "",
> = Elysia<
	BasePath,
	{
		decorator: {
			aroma: ReturnType<typeof createAroma>;
			env: t.Static<t.TComposite<ContentType>> & ServerDependenciesDTO;
			serve: <ResponseType>(
				status: HttpStatusCode | HttpStatusName,
				data: unknown,
			) => ResponseType;
		};
		store: Record<string, unknown>;
		derive: Record<string, unknown>;
		resolve: Record<string, unknown>;
	}
> & {
	decorator: {
		env: t.Static<t.TComposite<ContentType>> & ServerDependenciesDTO;
	};
};

/**
 * Builds a fully wired {@link https://elysiajs.com | Elysia} application with
 * every Roastery cross-cutting concern pre-installed, in order:
 *
 * 1. `@elysia/cors` — CORS handling from {@link BaristaArgs.corsConfig}.
 * 2. `aroma` decorator — a structured logger ({@link https://github.com/roastery-cms | `@roastery/aroma`}).
 * 3. {@link errorHandler} — global error handler mapping exceptions to HTTP status codes.
 * 4. {@link responseMapper} — unwraps the `{ status, data }` envelope produced by {@link serve}.
 * 5. {@link requestTrace} — logs successful requests with their duration after the response is sent.
 * 6. {@link env} — boot-time environment validation; injects a typed `env` decorator.
 * 7. `elysia-healthcheck` — mounted only when {@link BaristaArgs.healthCheck} is `true`.
 * 8. {@link serve} — decorator that maps `Entity`/`Entity[]` to DTOs inside a `{ status, data }` envelope.
 *
 * The returned instance is the live `Elysia` app: chain `.get(...)`,
 * `.post(...)`, `.listen(...)`, etc. on it as usual. Its type is widened so the
 * `env` decorator is statically known to be the intersection of the
 * user-declared variables (`ContentType`) and the built-in
 * {@link ServerDependenciesDTO}.
 *
 * @typeParam ContentType - Tuple of TypeBox object schemas for the extra
 *   environment variables to validate; defaults to `[]`. Inferred from
 *   {@link BaristaArgs.environmentDTOs}.
 * @typeParam BasePath - Base path prefix for every route; defaults to `""`.
 *
 * @param args - The {@link BaristaArgs} configuration object. Every field — and
 *   the object itself — is optional, so both `barista()` and `barista({})` are valid.
 *
 * @returns The configured app, typed as {@link Barista}`<ContentType, BasePath>` —
 *   the Elysia instance with the `aroma`, `env`, and `serve` decorators surfaced
 *   in its singleton so handlers see a fully typed context (notably a typed `env`).
 *
 * @example
 * ```typescript
 * import { barista } from "@roastery/barista";
 * import { t } from "@roastery/terroir";
 *
 * const app = barista({
 *   elysia: { name: "my-service" },
 *   environmentDTOs: [t.Object({ DATABASE_URL: t.String() })],
 *   corsConfig: { origin: true },
 *   healthCheck: true,
 * })
 *   .get("/", ({ env, serve }) => serve("OK", { port: env.PORT }))
 *   .listen(Number(process.env.PORT));
 * ```
 *
 * @see {@link BaristaArgs} — the configuration shape.
 * @see {@link patron} — builds a typed Eden client for the returned app.
 * @see {@link env} — environment validation and the `env` decorator.
 * @see {@link errorHandler} — global exception-to-status mapping.
 * @see {@link responseMapper} — response-envelope unwrapping.
 * @see {@link requestTrace} — per-request logging.
 * @see {@link serve} — the entity-to-DTO response decorator.
 */
export function barista<
	const ContentType extends t.TObject[] = [],
	const BasePath extends string = "",
>({
	elysia: config,
	aromaArgs,
	environmentDTOs,
	corsConfig,
	healthCheck,
}: BaristaArgs<ContentType, BasePath> = {}): Barista<ContentType, BasePath> {
	const app = new Elysia(config ?? {})
		.use(cors(corsConfig))
		.decorate("aroma", createAroma(aromaArgs))
		.use(errorHandler(aromaArgs))
		.use(responseMapper())
		.use(requestTrace(aromaArgs))
		.use(
			env<ContentType>(...(environmentDTOs ?? ([] as unknown as ContentType))),
		)
		.use((app) => {
			if (!healthCheck) return app;

			return app.use(healthcheckPlugin());
		})
		.use(serve());

	return app as unknown as Barista<ContentType, BasePath>;
}
