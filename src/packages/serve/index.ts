import {
	HTTP_STATUS,
	type HttpStatusCode,
	type HttpStatusName,
} from "@/constants";
import { Entity, Mapper } from "@roastery/beans";
import Elysia from "elysia";

/**
 * Returns `true` when every element of `data` is an {@link Entity} instance.
 *
 * Used by {@link serve} to decide whether an array can be mapped element-wise
 * to DTOs. An empty array returns `true`, so callers guard on length separately.
 *
 * @param data - The array to inspect.
 * @returns `true` if all items are entities (or the array is empty), `false` otherwise.
 */
function everyItemIsEntity(data: Array<unknown>): boolean {
	let isOnlyEntity = true;

	for (const item of data) if (!(item instanceof Entity)) isOnlyEntity = false;

	return isOnlyEntity;
}

/**
 * Elysia plugin that adds a `serve` decorator for building the
 * {@link BaristaResponse} envelope from a handler's payload, mapping domain
 * entities to their DTOs along the way.
 *
 * The decorated `serve(status, data)` function:
 *
 * - Accepts the status as either an {@link HttpStatusCode} number or an
 *   {@link HttpStatusName} string (resolved through {@link HTTP_STATUS}).
 * - If `data` is a single {@link Entity}, serialises it with `Mapper.toDTO`.
 * - If `data` is a non-empty array of entities (see {@link everyItemIsEntity}),
 *   serialises each element with `Mapper.toDTO`.
 * - Otherwise passes `data` through unchanged.
 *
 * It returns a `{ status, data }` object — typed as the caller-supplied
 * `ResponseType` — which {@link responseMapper} later unwraps into the real
 * HTTP response.
 *
 * @returns An `Elysia` plugin registering the `serve` decorator.
 *
 * @example
 * ```typescript
 * app.get("/users/:id", ({ serve }) => serve("OK", user));      // entity → DTO
 * app.get("/users", ({ serve }) => serve(HTTP_STATUS.OK, users)); // entity[] → DTO[]
 * ```
 *
 * @see {@link HTTP_STATUS} — status name/code source.
 * @see {@link BaristaResponse} — the envelope shape produced.
 * @see {@link responseMapper} — unwraps the envelope into the response.
 */
export function serve() {
	return new Elysia().decorate(
		"serve",
		<ResponseType>(
			status: HttpStatusCode | HttpStatusName,
			data: unknown,
		): ResponseType => {
			status = typeof status === "string" ? HTTP_STATUS[status] : status;

			if (data instanceof Entity) {
				return {
					status,
					data: Mapper.toDTO(data),
				} as unknown as ResponseType;
			}

			if (Array.isArray(data) && data.length > 0 && everyItemIsEntity(data)) {
				return {
					status,
					data: data.map((item) => Mapper.toDTO(item)),
				} as unknown as ResponseType;
			}

			return { status, data } as unknown as ResponseType;
		},
	);
}
