import Elysia from "elysia";
import { describe, expect, it } from "bun:test";
import { barista } from "./index";

describe("Barista", () => {
	it("should return an Elysia instance", () => {
		const app = barista();
		expect(app).toBeInstanceOf(Elysia);
	});

	it("should return an Elysia instance when receiving config", () => {
		const app = barista({ name: "test-app" });
		expect(app).toBeInstanceOf(Elysia);
	});

	it("should forward the name to the Elysia instance", () => {
		const app = barista({ name: "my-service" });
		expect(app.config.name).toBe("my-service");
	});

	it("should not throw when called without arguments", () => {
		expect(() => barista()).not.toThrow();
	});
});
