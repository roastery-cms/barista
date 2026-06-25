import { describe, it, expect } from "bun:test";
import { errorHandler } from "./index";
import {
	BadRequestException,
	ResourceNotFoundException as AppResourceNotFoundException,
	UnauthorizedException,
	InvalidOperationException,
	ResourceAlreadyExistsException,
	InvalidJWTException,
	UnableToSignPayloadException,
} from "@roastery/terroir/exceptions/application";
import {
	InvalidDomainDataException,
	InvalidPropertyException,
	OperationFailedException,
} from "@roastery/terroir/exceptions/domain";
import {
	CacheUnavailableException,
	ConflictException,
	DatabaseUnavailableException,
	ForeignDependencyConstraintException,
	InvalidEnvironmentException,
	MissingPluginDependencyException,
	OperationNotAllowedException,
	ResourceNotFoundException as InfraResourceNotFoundException,
	UnexpectedCacheValueException,
} from "@roastery/terroir/exceptions/infra";
import {
	InvalidEntityDataException,
	InvalidObjectValueException,
	UnknownException,
} from "@roastery/terroir/exceptions";
import { barista } from "@roastery/barista";

/**
 * Builds a minimal Barista app wired with the {@link errorHandler} plugin whose
 * single `/test` route always throws the provided value, so the handler's
 * mapping of that error can be asserted.
 *
 * @param error - The value thrown by the `/test` route (an `Error`, a
 *   `CoreException`, or any thrown primitive).
 * @returns The configured app instance.
 */
function createTestApp(error: unknown) {
	return barista()
		.use(errorHandler)
		.get("/test", () => {
			throw error;
		});
}

/**
 * Sends a request to the app's `/test` route and returns the resolved HTTP
 * status together with the parsed JSON body.
 *
 * @param app - An app produced by {@link createTestApp}.
 * @returns The response `status` and parsed `body`.
 */
async function request(app: ReturnType<typeof createTestApp>) {
	const response = await app.handle(new Request("http://localhost/test"));
	const body = await response.json();
	return { status: response.status, body };
}

describe("baristaErrorHandler", () => {
	describe("generic errors (non-CoreException)", () => {
		it("returns name, message and code for a standard Error", async () => {
			const error = new Error("something went wrong");
			const { status, body } = await request(createTestApp(error));

			expect(status).toBe(500);
			expect(body).toMatchObject({
				name: "Error",
				message: "something went wrong",
			});
		});

		it("returns the correct name for Error subclasses", async () => {
			const error = new TypeError("invalid type");
			const { body } = await request(createTestApp(error));

			expect(body).toMatchObject({
				name: "TypeError",
				message: "invalid type",
			});
		});

		it("converts to a string when the error is not an Error object", async () => {
			const { body } = await request(createTestApp("error as string"));

			expect(body).toMatchObject({
				name: "Error",
				message: "error as string",
			});
		});
	});

	describe("domain layer", () => {
		it("returns 400 for InvalidDomainDataException", async () => {
			const { status, body } = await request(
				createTestApp(new InvalidDomainDataException("UserEntity")),
			);
			expect(status).toBe(400);
			expect(body).toMatchObject({
				source: "UserEntity",
				layer: "domain",
			});
		});

		it("returns 400 for InvalidPropertyException", async () => {
			const { status, body } = await request(
				createTestApp(
					new InvalidPropertyException("email", "UserEntity", "invalid format"),
				),
			);
			expect(status).toBe(400);
			expect(body).toMatchObject({
				source: "UserEntity",
				layer: "domain",
			});
		});

		it("returns 406 for OperationFailedException", async () => {
			const { status, body } = await request(
				createTestApp(new OperationFailedException("OrderService")),
			);
			expect(status).toBe(406);
			expect(body).toMatchObject({
				source: "OrderService",
				layer: "domain",
			});
		});
	});

	describe("application layer", () => {
		it("returns 400 for BadRequestException", async () => {
			const { status, body } = await request(
				createTestApp(new BadRequestException("UserController")),
			);
			expect(status).toBe(400);
			expect(body).toMatchObject({
				source: "UserController",
				layer: "application",
			});
		});

		it("returns 401 for UnauthorizedException", async () => {
			const { status, body } = await request(
				createTestApp(new UnauthorizedException("AuthGuard")),
			);
			expect(status).toBe(401);
			expect(body).toMatchObject({ layer: "application" });
		});

		it("returns 400 for InvalidJWTException", async () => {
			const { status } = await request(
				createTestApp(new InvalidJWTException("JwtService")),
			);
			expect(status).toBe(400);
		});

		it("returns 406 for InvalidOperationException", async () => {
			const { status } = await request(
				createTestApp(new InvalidOperationException("PaymentService")),
			);
			expect(status).toBe(406);
		});

		it("returns 409 for ResourceAlreadyExistsException", async () => {
			const { status } = await request(
				createTestApp(new ResourceAlreadyExistsException("UserRepository")),
			);
			expect(status).toBe(409);
		});

		it("returns 404 for ResourceNotFoundException (application)", async () => {
			const { status } = await request(
				createTestApp(new AppResourceNotFoundException("UserRepository")),
			);
			expect(status).toBe(404);
		});

		it("returns 500 for UnableToSignPayloadException", async () => {
			const { status } = await request(
				createTestApp(new UnableToSignPayloadException("JwtService")),
			);
			expect(status).toBe(500);
		});
	});

	describe("infrastructure layer", () => {
		it("returns 409 for ConflictException", async () => {
			const { status, body } = await request(
				createTestApp(new ConflictException("PostgresRepository")),
			);
			expect(status).toBe(409);
			expect(body).toMatchObject({ layer: "infra" });
		});

		it("returns 503 for DatabaseUnavailableException", async () => {
			const { status } = await request(
				createTestApp(new DatabaseUnavailableException("PostgresRepository")),
			);
			expect(status).toBe(503);
		});

		it("returns 500 for ForeignDependencyConstraintException", async () => {
			const { status } = await request(
				createTestApp(
					new ForeignDependencyConstraintException("PostgresRepository"),
				),
			);
			expect(status).toBe(500);
		});

		it("returns 502 for OperationNotAllowedException", async () => {
			const { status } = await request(
				createTestApp(new OperationNotAllowedException("ExternalApiClient")),
			);
			expect(status).toBe(502);
		});

		it("returns 404 for ResourceNotFoundException (infra)", async () => {
			const { status } = await request(
				createTestApp(new InfraResourceNotFoundException("PostgresRepository")),
			);
			expect(status).toBe(404);
		});

		it("returns 500 for UnexpectedCacheValueException", async () => {
			const { status } = await request(
				createTestApp(
					new UnexpectedCacheValueException("user:123", "RedisCache"),
				),
			);
			expect(status).toBe(500);
		});

		it("returns 503 for MissingPluginDependencyException", async () => {
			const { status } = await request(
				createTestApp(new MissingPluginDependencyException("ElysiaJwt")),
			);
			expect(status).toBe(503);
		});

		it("returns 500 for InvalidEnvironmentException", async () => {
			const { status } = await request(
				createTestApp(new InvalidEnvironmentException("AppConfig")),
			);
			expect(status).toBe(500);
		});

		it("returns 503 for CacheUnavailableException", async () => {
			const { status } = await request(
				createTestApp(new CacheUnavailableException("RedisCache")),
			);
			expect(status).toBe(503);
		});
	});

	describe("internal layer", () => {
		it("returns 500 for InvalidEntityData", async () => {
			const { status } = await request(
				createTestApp(new InvalidEntityDataException("invalid structure")),
			);
			expect(status).toBe(500);
		});

		it("returns 500 for InvalidObjectValueException", async () => {
			const { status } = await request(
				createTestApp(new InvalidObjectValueException("userId")),
			);
			expect(status).toBe(500);
		});

		it("returns 500 for UnknownException", async () => {
			const { status } = await request(
				createTestApp(new UnknownException("unknown error")),
			);
			expect(status).toBe(500);
		});
	});

	describe("response format for CoreException", () => {
		it("returns message, name, source and layer in the body", async () => {
			const { body } = await request(
				createTestApp(
					new BadRequestException("UserController", "missing required field"),
				),
			);
			expect(body).toMatchObject({
				message: "missing required field",
				source: "UserController",
				layer: "application",
			});
			expect(body).toHaveProperty("name");
		});

		it("uses status 500 as a fallback when the exception is not mapped", async () => {
			const { status } = await request(createTestApp(new UnknownException()));
			expect(status).toBe(500);
		});
	});
});
