/**
 * The internal response envelope used across the Barista pipeline.
 *
 * {@link serve} produces a value of this shape from a handler's return value,
 * and {@link responseMapper} consumes it after the handler runs — reading
 * `status` to set the HTTP status code and sending `data` as the response body.
 * Handlers therefore never set the status code by hand; they return a
 * `BaristaResponse` (typically via the `serve` decorator) and the mapper
 * unwraps it.
 *
 * @see {@link serve} — builds this envelope (and maps entities to DTOs).
 * @see {@link responseMapper} — unwraps it into the real Elysia response.
 */
export type BaristaResponse = {
	/** HTTP status code to apply to the response. */
	status: number;
	/** Response body payload, already serialised to a DTO when it originated from a domain entity. */
	data: unknown;
};
