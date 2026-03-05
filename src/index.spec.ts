import Elysia from "elysia";
import { describe, expect, it } from "bun:test";
import { Barista } from "./index";

describe("Barista", () => {
	it("should return an Elysia instance", () => {
		const app = Barista();
		expect(app).toBeInstanceOf(Elysia);
	});

	it("should return an Elysia instance when receiving config", () => {
		const app = Barista({ name: "test-app" });
		expect(app).toBeInstanceOf(Elysia);
	});

	it("should forward the name to the Elysia instance", () => {
		const app = Barista({ name: "my-service" });
		expect(app.config.name).toBe("my-service");
	});

	it("should not throw when called without arguments", () => {
		expect(() => Barista()).not.toThrow();
	});
});
