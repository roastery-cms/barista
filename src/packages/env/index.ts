import { ServerDependenciesDTO } from "./dtos/server-dependencies.dto";
import { t } from "@roastery/terroir";
import { Schema } from "@roastery/terroir/schema";
import { InvalidEnvironmentException } from "@roastery/terroir/exceptions/infra";
import Elysia from "elysia";
import { createAroma } from "@roastery/aroma";
import { ConsoleTransport } from "@roastery/aroma/transports";

/**
 * Elysia plugin that validates environment variables at boot time and injects
 * them as a fully typed `env` decorator across the whole application.
 *
 * The {@link ServerDependenciesDTO} (`PORT`, `NODE_ENV`) is always merged into
 * the provided schemas, so those two variables are guaranteed to be present and
 * typed regardless of what is passed in. Any extra schemas are composed on top.
 *
 * Validation reads only the keys declared in the composed schema from
 * `process.env`; variables outside the schema are ignored. When validation
 * fails, an {@link InvalidEnvironmentException} is reported through an
 * `@roastery/aroma` console logger.
 *
 * @typeParam ContentType - Tuple of TypeBox object schemas describing the extra
 * environment variables to validate, beyond the built-in `PORT`/`NODE_ENV`.
 *
 * @param args - One or more `t.Object({...})` schemas. They are composed into a
 * single schema together with {@link ServerDependenciesDTO}.
 *
 * @returns A global-scoped `Elysia` plugin whose `env` decorator is typed as
 * `t.Static<t.TComposite<ContentType>> & ServerDependenciesDTO` — the
 * intersection of the user-declared variables and the built-in ones.
 *
 * @throws {InvalidEnvironmentException} Constructed with the `"system@boot"`
 * context when one or more declared variables are missing or invalid. The
 * exception is logged at `fatal` level through an `@roastery/aroma` console
 * logger and the process is then terminated with `process.exit(1)` rather than
 * the exception being re-thrown.
 *
 * @example
 * ```typescript
 * import { Elysia } from "elysia";
 * import { env } from "@/packages/env";
 * import { t } from "@roastery/terroir";
 *
 * const app = new Elysia()
 *   .use(
 *     env(
 *       t.Object({
 *         DATABASE_URL: t.String(),
 *         JWT_SECRET: t.String(),
 *       }),
 *     ),
 *   )
 *   .get("/", ({ env }) => {
 *     // env.PORT, env.NODE_ENV, env.DATABASE_URL and env.JWT_SECRET are typed.
 *     return `Running on port ${env.PORT}`;
 *   });
 * ```
 *
 * @see {@link ServerDependenciesDTO} for the always-included base schema.
 */
export function env<const ContentType extends t.TObject[]>(
	...args: ContentType
): Elysia<
	"",
	{
		decorator: {
			env: t.Static<t.TComposite<ContentType>> & ServerDependenciesDTO;
		};
		store: Record<string, unknown>;
		derive: Record<string, unknown>;
		resolve: Record<string, unknown>;
	}
> {
	if (process.baristaHasEnv) return new Elysia();

	type EnvType = t.Static<t.TComposite<ContentType>> & ServerDependenciesDTO;

	args.push(ServerDependenciesDTO);

	const envDTO = t.Composite<ContentType>(args);
	const envContent: EnvType = Object.fromEntries(
		Object.entries(envDTO.properties).map(([key, _]) => [
			key,
			process.env[key],
		]),
	) as never;

	if (!Schema.make(envDTO).match(envContent)) {
		const logger = createAroma({ transports: [new ConsoleTransport()] });
		logger.fatal(new InvalidEnvironmentException("system@boot"));
		process.exit(1);
	}

	process.baristaHasEnv = true;

	return new Elysia().as("global").decorate("env", envContent);
}
