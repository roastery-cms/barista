import { describe, it, expect, beforeEach } from "bun:test";
import Elysia from "elysia";
import { createAroma } from "@roastery/aroma";
import { NullTransport } from "@roastery/aroma/transports";
import { requestTrace } from "./index";

const sink = new NullTransport();
const logger = createAroma({ transports: [sink] });

beforeEach(() => {
	sink.clear();
});

function createTestApp() {
	return new Elysia()
		.use(requestTrace(logger))
		.get("/ok", () => "ok")
		.get("/fail", () => {
			throw new Error("boom");
		});
}

/**
 * `requestTrace` finalises its log line inside `onAfterResponse`/`onStop`,
 * which Elysia resolves on the next tick after `app.handle()`'s promise
 * settles — awaiting `handle()` alone is not enough to observe the log.
 */
async function handleAndFlush(
	app: ReturnType<typeof createTestApp>,
	path: string,
) {
	await app.handle(new Request(`http://localhost${path}`));
	await new Promise((resolve) => setTimeout(resolve, 0));
}

describe("requestTrace", () => {
	it("logs an info event with method, route and status after a successful response", async () => {
		await handleAndFlush(createTestApp(), "/ok");

		expect(sink.events).toHaveLength(1);
		expect(sink.events[0]).toMatchObject({
			level: "info",
			meta: { method: "GET", route: "/ok", status: 200 },
		});
	});

	it("attaches a numeric duration via the child logger's bindings", async () => {
		await handleAndFlush(createTestApp(), "/ok");

		const duration = sink.events[0]?.bindings?.duration;
		expect(typeof duration).toBe("number");
		expect(duration as number).toBeGreaterThanOrEqual(0);
	});

	it("does not log when the route throws (left to errorHandler)", async () => {
		await handleAndFlush(createTestApp(), "/fail");

		expect(sink.events).toHaveLength(0);
	});

	it("logs one event per request across multiple calls", async () => {
		const app = createTestApp();
		await handleAndFlush(app, "/ok");
		await handleAndFlush(app, "/ok");

		expect(sink.events).toHaveLength(2);
	});
});
