import type { BaristaResponse } from "@/types";
import { Elysia, type ElysiaCustomStatusResponse } from "elysia";

/**
 * Minimal structural shape used to detect, at runtime, whether a handler's
 * return value is an `ElysiaCustomStatusResponse` (produced when a handler uses
 * Elysia's `status(...)` helper). Only the discriminating fields are modelled:
 * `constructor.name` for the brand check and `code` for the status.
 */
type ResponseValue = { constructor: { name: string }; code: number };

/**
 * Elysia plugin that unwraps the {@link BaristaResponse} envelope after a
 * handler runs and applies it to the real HTTP response.
 *
 * On `onAfterHandle` it inspects the handler's return value: non-object values
 * pass through untouched. When the value is an `ElysiaCustomStatusResponse`
 * (the wrapper Elysia builds for `status(...)` returns) it reads the inner
 * `.response`; otherwise it treats the value directly as a
 * {@link BaristaResponse}. It then calls `status(response.status,
 * response.data)`, so the `{ status, data }` envelope produced by {@link serve}
 * becomes the actual status code and body.
 *
 * @returns A global-scoped `Elysia` plugin registering the `onAfterHandle` hook.
 *
 * @see {@link BaristaResponse} — the envelope shape this plugin unwraps.
 * @see {@link serve} — the decorator that produces that envelope.
 */
export function responseMapper() {
	return new Elysia().onAfterHandle(
		{ as: "global" },
		({ responseValue, status }) => {
			if (typeof responseValue !== "object") return;

			const response = (
				"constructor" in (responseValue as ResponseValue) &&
				(responseValue as ResponseValue).constructor.name ===
					"ElysiaCustomStatusResponse"
					? (responseValue as ElysiaCustomStatusResponse<number, unknown>)
							.response
					: responseValue
			) as BaristaResponse;

			return status(response.status, response.data);
		},
	);
}
