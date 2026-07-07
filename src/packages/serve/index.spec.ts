import { describe, it, expect } from "bun:test";
import Elysia from "elysia";
import { Entity, Mapper } from "@roastery/beans";
import { EntitySchema, EntityFactory } from "@roastery/beans/entity/symbols";
import type { EntityDTO } from "@roastery/beans/entity/dtos";
import { makeEntity } from "@roastery/beans/entity/factories";
import { Schema } from "@roastery/terroir/schema";
import { t } from "@roastery/terroir";
import { serve } from "./index";

const PostDTO = t.Object({
	id: t.String(),
	createdAt: t.String(),
	updatedAt: t.Optional(t.String()),
	title: t.String(),
});
const PostSchema = Schema.make(PostDTO);
type PostInput = { title: string };

class Post extends Entity<typeof PostDTO> {
	public readonly [EntitySchema] = PostSchema;
	private readonly _title: string;

	public get title(): string {
		return this._title;
	}

	public constructor(data: EntityDTO & PostInput) {
		super(data, "post");
		this._title = data.title;
	}

	public [EntityFactory](data: PostInput, initialProperties?: EntityDTO): this {
		return new Post({
			...(initialProperties ?? makeEntity()),
			...data,
		}) as this;
	}
}

function makePost(title: string): Post {
	return new Post({ ...makeEntity(), title });
}

function createTestApp() {
	return new Elysia().use(serve());
}

describe("serve", () => {
	it("resolves an HttpStatusName to its numeric code for plain data", () => {
		const app = createTestApp();
		const result = app.decorator.serve<{ status: number; data: unknown }>(
			"OK",
			{ message: "hi" },
		);
		expect(result).toEqual({ status: 200, data: { message: "hi" } });
	});

	it("accepts a numeric HttpStatusCode directly", () => {
		const app = createTestApp();
		const result = app.decorator.serve<{ status: number; data: unknown }>(201, {
			message: "hi",
		});
		expect(result).toEqual({ status: 201, data: { message: "hi" } });
	});

	it("maps a single Entity to its DTO via Mapper.toDTO", () => {
		const app = createTestApp();
		const post = makePost("Hello world");

		const result = app.decorator.serve("OK", post) as {
			status: number;
			data: unknown;
		};

		expect(result.data).toEqual(Mapper.toDTO(post));
		expect(result.data).not.toBeInstanceOf(Post);
	});

	it("maps every element of a non-empty array of Entities to DTOs", () => {
		const app = createTestApp();
		const posts = [makePost("A"), makePost("B")];

		const result = app.decorator.serve("OK", posts) as {
			status: number;
			data: unknown;
		};

		expect(result.data).toEqual(posts.map((post) => Mapper.toDTO(post)));
	});

	it("passes an empty array through unchanged (no mapping attempted)", () => {
		const app = createTestApp();
		const empty: unknown[] = [];

		const result = app.decorator.serve("OK", empty) as {
			status: number;
			data: unknown;
		};

		expect(result.data).toBe(empty);
	});

	it("passes a mixed array (not all entities) through unchanged", () => {
		const app = createTestApp();
		const mixed = [makePost("A"), { plain: true }];

		const result = app.decorator.serve("OK", mixed) as {
			status: number;
			data: unknown;
		};

		expect(result.data).toBe(mixed);
	});

	it("passes non-entity, non-array data through unchanged", () => {
		const app = createTestApp();
		const plain = { plain: true };

		const result = app.decorator.serve("OK", plain) as {
			status: number;
			data: unknown;
		};

		expect(result.data).toBe(plain);
	});
});
