import { describe, it, expect, beforeEach } from "bun:test";
import { Elysia } from "elysia";
import { NullTransport } from "@roastery/aroma/transports";
import { t } from "@roastery/terroir";
import { barista } from "./index";

beforeEach(() => {
	process.baristaHasEnv = false;
});

describe("barista", () => {
	it("returns an Elysia instance", () => {
		expect(barista()).toBeInstanceOf(Elysia);
	});

	it("does not throw when called without arguments", () => {
		expect(() => barista()).not.toThrow();
	});

	it("forwards the elysia config to the underlying instance", () => {
		const app = barista({ elysia: { name: "my-service" } });
		expect(app.config.name).toBe("my-service");
	});

	it("exposes a typed env decorator merging environmentDTOs with the base schema", () => {
		process.env.API_KEY = "secret";
		const app = barista({
			environmentDTOs: [t.Object({ API_KEY: t.String() })],
		});

		expect(app.decorator.env).toMatchObject({
			PORT: "8080",
			NODE_ENV: "TESTING",
			API_KEY: "secret",
		});

		delete (process.env as Record<string, string | undefined>).API_KEY;
	});

	describe("shared aroma logger (regression: single instance across the pipeline)", () => {
		it("exposes the exact same aroma instance to route handlers as app.decorator.aroma", async () => {
			const base = barista({
				aromaArgs: { transports: [new NullTransport()] },
			});
			const app = base.get("/whoami", ({ aroma, serve }) =>
				serve("OK", { isSameInstance: aroma === base.decorator.aroma }),
			);

			const response = await app.handle(new Request("http://localhost/whoami"));
			expect(await response.json()).toEqual({ isSameInstance: true });
		});

		it("errorHandler and requestTrace both log through the same shared sink", async () => {
			const sink = new NullTransport();
			const app = barista({ aromaArgs: { transports: [sink] } })
				.get("/ok", () => "ok")
				.get("/fail", () => {
					throw new Error("boom");
				});

			await app.handle(new Request("http://localhost/ok"));
			await app.handle(new Request("http://localhost/fail"));
			await new Promise((resolve) => setTimeout(resolve, 0));

			expect(sink.events).toHaveLength(2);
			expect(sink.events.some((event) => event.level === "info")).toBe(true);
			expect(sink.events.some((event) => event.level === "error")).toBe(true);
		});
	});

	describe("healthCheck", () => {
		it("does not mount /healthz by default", async () => {
			const app = barista();
			const response = await app.handle(
				new Request("http://localhost/healthz"),
			);
			expect(response.status).toBe(404);
		});

		it("mounts /healthz when healthCheck: true", async () => {
			const app = barista({ healthCheck: true });
			const response = await app.handle(
				new Request("http://localhost/healthz"),
			);
			expect(response.status).toBe(200);
		});
	});

	it("wires serve + responseMapper end to end", async () => {
		const app = barista().get("/x", ({ serve }) => serve("OK", { a: 1 }));
		const response = await app.handle(new Request("http://localhost/x"));

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ a: 1 });
	});
});
