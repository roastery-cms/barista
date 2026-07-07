import { describe, it, expect, beforeEach, afterEach, spyOn } from "bun:test";
import Elysia from "elysia";
import { t } from "@roastery/terroir";
import { env } from "./index";

beforeEach(() => {
	process.baristaHasEnv = false;
});

afterEach(() => {
	delete (process.env as Record<string, string | undefined>).API_KEY;
	process.env.NODE_ENV = "TESTING";
});

describe("env", () => {
	it("decorates the app with PORT and NODE_ENV from the base ServerDependenciesDTO", () => {
		const app = new Elysia().use(env());
		expect(app.decorator.env).toMatchObject({
			PORT: "8080",
			NODE_ENV: "TESTING",
		});
	});

	it("merges extra schemas into the typed env decorator", () => {
		process.env.API_KEY = "secret";
		const app = new Elysia().use(env(t.Object({ API_KEY: t.String() })));
		expect(app.decorator.env).toMatchObject({
			PORT: "8080",
			NODE_ENV: "TESTING",
			API_KEY: "secret",
		});
	});

	it("terminates the process with exit code 1 when a required variable is missing", () => {
		const exitSpy = spyOn(process, "exit").mockImplementation(
			() => undefined as never,
		);

		new Elysia().use(env(t.Object({ API_KEY: t.String() })));

		expect(exitSpy).toHaveBeenCalledWith(1);
		exitSpy.mockRestore();
	});

	it("terminates the process with exit code 1 when NODE_ENV is not an allowed literal", () => {
		const exitSpy = spyOn(process, "exit").mockImplementation(
			() => undefined as never,
		);
		process.env.NODE_ENV = "NOT_A_REAL_ENV";

		new Elysia().use(env());

		expect(exitSpy).toHaveBeenCalledWith(1);
		exitSpy.mockRestore();
	});

	it("is a no-op on a second registration within the same process (singleton guard)", () => {
		new Elysia().use(env());
		const second = new Elysia().use(env());

		expect(second.decorator.env).toBeUndefined();
	});
});
