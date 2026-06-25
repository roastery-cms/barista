import type { RoasteryExceptionRecords } from "@roastery/terroir/exceptions/types";

/**
 * Lookup table mapping each `@roastery/terroir` exception to the HTTP status
 * code it should produce.
 *
 * Keyed first by exception layer (`domain`, `application`, `infra`,
 * `internal` — the shape enforced by `RoasteryExceptionRecords`) and then by
 * the exception's constructor name. {@link errorHandler} indexes it as
 * `STATUS_CODE_MAP[error[ExceptionLayer]][error.constructor.name]`, falling
 * back to `500` for any pair that is absent here.
 *
 * @see {@link errorHandler} — the consumer that performs the lookup.
 */
export const STATUS_CODE_MAP: RoasteryExceptionRecords<number> = {
	domain: {
		InvalidDomainDataException: 400,
		InvalidPropertyException: 400,
		OperationFailedException: 406,
	},
	application: {
		UnauthorizedException: 401,
		BadRequestException: 400,
		InvalidJWTException: 400,
		InvalidOperationException: 406,
		ResourceAlreadyExistsException: 409,
		ResourceNotFoundException: 404,
		UnableToSignPayloadException: 500,
	},
	infra: {
		ConflictException: 409,
		DatabaseUnavailableException: 503,
		ForeignDependencyConstraintException: 500,
		OperationNotAllowedException: 502,
		ResourceNotFoundException: 404,
		UnexpectedCacheValueException: 500,
		MissingPluginDependencyException: 503,
		InvalidEnvironmentException: 500,
		CacheUnavailableException: 503,
	},
	internal: {
		InvalidEntityDataException: 500,
		InvalidObjectValueException: 500,
		UnknownException: 500,
	},
};
