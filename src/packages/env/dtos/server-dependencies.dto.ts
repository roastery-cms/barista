import { t } from "@roastery/terroir";

/**
 * Base environment schema always included by the {@link env} plugin.
 *
 * Describes the minimum set of environment variables every Roastery server is
 * expected to provide. The schema (value) and the inferred type share the same
 * name via declaration merging — import `ServerDependenciesDTO` to use either.
 *
 * @example
 * ```typescript
 * import { ServerDependenciesDTO } from "@roastery/barista/packages/env/dtos";
 *
 * // As a value (TypeBox schema):
 * Schema.make(ServerDependenciesDTO).match(process.env);
 *
 * // As a type:
 * const deps: ServerDependenciesDTO = { PORT: "3000", NODE_ENV: "PRODUCTION" };
 * ```
 *
 * @remarks
 * `PORT` is validated as a `string` because `process.env` always yields string
 * values.
 *
 * @property PORT - The port the server listens on.
 * @property NODE_ENV - Current runtime environment: `"DEVELOPMENT"`,
 * `"TESTING"` or `"PRODUCTION"`.
 */
export const ServerDependenciesDTO = t.Object({
	PORT: t.String(),
	NODE_ENV: t.Union([
		t.Literal("DEVELOPMENT"),
		t.Literal("TESTING"),
		t.Literal("PRODUCTION"),
	]),
});

/**
 * Static type inferred from the {@link ServerDependenciesDTO} schema.
 *
 * Resolves to:
 * ```typescript
 * {
 *   PORT: string;
 *   NODE_ENV: "DEVELOPMENT" | "TESTING" | "PRODUCTION";
 * }
 * ```
 */
export type ServerDependenciesDTO = t.Static<typeof ServerDependenciesDTO>;
