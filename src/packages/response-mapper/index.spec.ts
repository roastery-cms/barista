import { describe, it, expect } from "bun:test";
import Elysia, { status } from "elysia";
import { responseMapper } from "./index";
import { serve } from "../serve";

describe("responseMapper", () => {
	it("passes non-object responses through untouched", async () => {
		const app = new Elysia().use(responseMapper()).get("/text", () => "pong");

		const response = await app.handle(new Request("http://localhost/text"));
		expect(response.status).toBe(200);
		expect(await response.text()).toBe("pong");
	});

	it("unwraps a plain BaristaResponse object into the real status and body", async () => {
		const app = new Elysia()
			.use(responseMapper())
			.get("/envelope", () => ({ status: 201, data: { id: 1 } }));

		const response = await app.handle(new Request("http://localhost/envelope"));
		expect(response.status).toBe(201);
		expect(await response.json()).toEqual({ id: 1 });
	});

	it("unwraps an ElysiaCustomStatusResponse produced by Elysia's status() helper", async () => {
		const app = new Elysia()
			.use(responseMapper())
			.get("/wrapped", () =>
				status(200, { status: 202, data: { queued: true } }),
			);

		const response = await app.handle(new Request("http://localhost/wrapped"));
		expect(response.status).toBe(202);
		expect(await response.json()).toEqual({ queued: true });
	});

	describe("integration with serve", () => {
		it("round-trips an HttpStatusName resolved by serve()", async () => {
			const app = new Elysia()
				.use(serve())
				.use(responseMapper())
				.get("/created", ({ serve }) => serve("CREATED", { id: 1 }));

			const response = await app.handle(
				new Request("http://localhost/created"),
			);
			expect(response.status).toBe(201);
			expect(await response.json()).toEqual({ id: 1 });
		});

		it("round-trips a numeric HttpStatusCode resolved by serve()", async () => {
			const app = new Elysia()
				.use(serve())
				.use(responseMapper())
				.get("/notfound", ({ serve }) => serve(404, { message: "not found" }));

			const response = await app.handle(
				new Request("http://localhost/notfound"),
			);
			expect(response.status).toBe(404);
			expect(await response.json()).toEqual({ message: "not found" });
		});
	});
});
