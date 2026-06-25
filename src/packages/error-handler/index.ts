import { CoreException } from "@roastery/terroir/exceptions/core";
import { STATUS_CODE_MAP } from "./constants";
import { ExceptionLayer } from "@roastery/terroir/exceptions/symbols";
import Elysia from "elysia";
import { createAroma, type CreateAromaArgs } from "@roastery/aroma";

/**
 * Elysia plugin that installs a global error handler, translating thrown
 * exceptions into structured HTTP responses and logging each failure through an
 * `@roastery/aroma` logger.
 *
 * Two paths are handled:
 *
 * - **Non-`CoreException`** (plain `Error`, framework errors, thrown
 *   primitives): the status is `404` when Elysia reports the `"NOT_FOUND"`
 *   code, otherwise `500`. The response body is `{ name, message, code }`.
 * - **`CoreException`** (any `@roastery/terroir` domain/application/infra/internal
 *   exception): the status is resolved from {@link STATUS_CODE_MAP} indexed by
 *   the exception's layer (`error[ExceptionLayer]`) and its constructor name,
 *   falling back to `500` when the pair is not mapped. The response body is
 *   `{ message, name, source, layer }`.
 *
 * Every error is logged with request context (route, method, headers, body,
 * resolved status) via the `aroma` decorator before the body is returned.
 *
 * @param aromaArgs - Options forwarded to `createAroma` for the logger this
 *   handler decorates the app with. Omit to use the logger defaults.
 *
 * @returns A global-scoped `Elysia` plugin registering the `onError` handler
 *   and an `aroma` logger decorator.
 *
 * @example
 * ```typescript
 * import { Elysia } from "elysia";
 * import { errorHandler } from "@roastery/barista/packages/error-handler";
 *
 * const app = new Elysia()
 *   .use(errorHandler())
 *   .get("/", () => {
 *     throw new BadRequestException("UserController", "missing field");
 *   });
 * // → 400 { message: "missing field", name, source: "UserController", layer: "application" }
 * ```
 *
 * @see {@link STATUS_CODE_MAP} — the layer/exception-name → status lookup table.
 */
export function errorHandler(aromaArgs?: CreateAromaArgs) {
	return new Elysia()
		.decorate("aroma", createAroma(aromaArgs))
		.onError(
			{ as: "global" },
			({ code, set, error: _error, aroma, body, headers, route, request }) => {
				const method = request.method;

				if (!(_error instanceof CoreException)) {
					const err = _error as Error;
					const message = err.message || String(_error);
					const name = err.name || "Error";

					const status = code === "NOT_FOUND" ? 404 : 500;

					aroma.error(
						{
							name,
							code,
							route,
							headers,
							body,
							method,
							status,
						},
						message,
					);

					return {
						name,
						message,
						code,
					};
				}

				const error: CoreException = _error;

				const layerMap = STATUS_CODE_MAP[error[ExceptionLayer]] as Record<
					string,
					number
				>;
				const status = layerMap ? layerMap[error.constructor.name] : 500;

				set.status = status ?? 500;

				const { message, name, source, [ExceptionLayer]: layer } = error;

				aroma.error(
					{
						name,
						source,
						layer,
						route,
						headers,
						body,
						method,
						status: set.status,
					},
					message,
				);

				return { message, name, source, layer };
			},
		);
}
