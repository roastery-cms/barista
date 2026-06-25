import { createAroma, type CreateAromaArgs } from "@roastery/aroma";
import Elysia from "elysia";

/**
 * Elysia plugin that logs every **successful** request once its response has
 * been sent, including the wall-clock duration of the request lifecycle.
 *
 * It hooks the global trace, captures `begin`/`end` timestamps around the
 * response, and emits an `info` log (via a child `aroma` logger carrying the
 * computed `duration`) with the request method, route, resolved status, body,
 * and headers. Failed requests are intentionally skipped here — they are logged
 * by {@link errorHandler} instead — so each request produces exactly one log line.
 *
 * @param aromaArgs - Options forwarded to `createAroma` for the logger this
 *   plugin decorates the app with. Omit to use the logger defaults.
 *
 * @returns A global-scoped `Elysia` plugin registering the trace handler and an
 *   `aroma` logger decorator.
 *
 * @see {@link errorHandler} — logs the failed requests this plugin skips.
 */
export function requestTrace(aromaArgs?: CreateAromaArgs) {
	return new Elysia()
		.decorate("aroma", createAroma(aromaArgs))
		.trace({ as: "global" }, ({ context, onAfterResponse }) => {
			const { aroma, request, body, headers, set } = context;

			onAfterResponse(({ begin, onStop }) => {
				onStop(({ end }) => {
					// Failed requests are already logged by `errorHandler`.
					// The trace's own `error` is no use here: on Bun's native
					// adapter the `onError` event fires *after* afterResponse.
					// `context.error` is already populated at this point on
					// both adapters (Bun and Web Standard / `app.handle`).
					if ((context as { error?: unknown }).error != null) return;

					const method = request.method;
					const route = new URL(request.url).pathname;

					aroma.child({ duration: end - begin }).info({
						method,
						route,
						status: set.status,
						body,
						headers,
					});
				});
			});
		});
}
