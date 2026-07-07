import { describe, it, expect } from "bun:test";
import { Elysia } from "elysia";
import { patron } from "./index";

describe("patron", () => {
	it("builds a typed Eden Treaty client that calls the in-process app", async () => {
		const app = new Elysia().get("/ping", () => ({ pong: true }));
		const client = patron(app);

		const { data } = await client.ping.get();
		expect(data).toEqual({ pong: true });
	});

	it("does not parse ISO date strings into Date objects (parseDate: false)", async () => {
		const iso = "2026-07-07T00:00:00.000Z";
		const app = new Elysia().get("/when", () => ({ when: iso }));
		const client = patron(app);

		const { data } = await client.when.get();
		expect(data?.when).toBe(iso);
	});

	it("builds a client from a base-URL string without throwing", () => {
		expect(() => patron("https://example.com")).not.toThrow();
	});
});
