import { treaty, type Treaty } from "@elysia/eden";
import type Elysia from "elysia";

/**
 * Builds an end-to-end typed {@link https://elysiajs.com/eden/treaty/overview | Eden Treaty}
 * client for a {@link barista} (or any Elysia) application — the consumer-side
 * counterpart to the server factory.
 *
 * Pass either the app instance (for in-process / test calls, where the full
 * route types are inferred) or a base-URL string (for cross-service HTTP
 * calls). The client always disables Eden's automatic `Date` parsing
 * (`parseDate: false`) so that ISO-8601 timestamps coming from Roastery DTOs
 * stay plain strings, matching how value-objects serialise them; this cannot be
 * overridden through `config`, which is why `config` omits the `parseDate` key.
 *
 * @typeParam App - The Elysia application type whose routes drive the client's
 *   typed surface. Declared with `any` generic slots because Elysia's instance
 *   generics must accept any app configuration.
 * @typeParam Head - Default request headers attached to every call; defaults to `{}`.
 *
 * @param app - The Elysia app instance to call in-process, or the base URL of a
 *   remote service.
 * @param config - Eden Treaty configuration, minus `parseDate` (which is forced
 *   to `false`). User-provided keys are spread on top of the forced default.
 *
 * @returns A `Treaty.Create<App, Head>` proxy whose methods mirror the app's
 *   routes with full request/response typing.
 *
 * @example
 * ```typescript
 * import { barista } from "@roastery/barista";
 * import { patron } from "@roastery/barista/patron";
 *
 * const app = barista({}).get("/health", () => "ok");
 *
 * // In-process, fully typed from the app's routes:
 * const client = patron(app);
 * const { data } = await client.health.get();
 *
 * // Or against a remote service by URL:
 * const remote = patron<typeof app>("https://api.example.com");
 * ```
 *
 * @see {@link barista} — produces the app this client consumes.
 */
export function patron<
	// biome-ignore lint/suspicious/noExplicitAny: Elysia's generic parameters require `any` to accept any app instance regardless of its type configuration
	const App extends Elysia<any, any, any, any, any, any, any>,
	// biome-ignore lint/complexity/noBannedTypes: `{}` is used intentionally as a permissive default constraint for the generic parameter
	const Head extends {} = {},
>(
	app: App | string,
	config?: Omit<Treaty.Config<Head>, "parseDate">,
): Treaty.Create<App, Head> {
	return treaty<App, Head>(app, {
		parseDate: false,
		...config,
	});
}
