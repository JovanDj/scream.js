import { describe, it, type TestContext } from "node:test";
import { databaseTestFixture } from "@scream.js/database/test-helpers.js";
import { ListTagsService } from "./list-tags.service.js";
import type { TagIndexInput } from "./tag.schema.js";

describe("ListTagsService", { concurrency: true }, () => {
	it("returns validated tags in the requested order with a lookahead row", async (t: TestContext) => {
		const { cleanup, db } = await databaseTestFixture.setup();
		t.after(() => cleanup());

		const now = new Date().toISOString();
		await db("tags").insert([
			{ created_at: now, name: "Beta", updated_at: now },
			{ created_at: now, name: "Alpha", updated_at: now },
		]);
		const service = new ListTagsService(db);
		const input: TagIndexInput & { limit: number; offset: number } = {
			direction: "asc",
			limit: 2,
			offset: 0,
			page: 1,
			sort: "name",
		};

		const result = await service.execute(input);

		t.assert.deepStrictEqual(
			result.map((tag) => tag.name),
			["Alpha", "Beta"],
		);
	});

	it("rejects malformed rows, including lookahead rows", async (t: TestContext) => {
		const { cleanup, db } = await databaseTestFixture.setup();
		t.after(() => cleanup());

		const now = new Date().toISOString();
		await db("tags").insert([
			{ created_at: now, name: "Alpha", updated_at: now },
			{ created_at: now, name: Buffer.from("invalid"), updated_at: now },
		]);
		const service = new ListTagsService(db);
		const input: TagIndexInput & { limit: number; offset: number } = {
			direction: "asc",
			limit: 2,
			offset: 0,
			page: 1,
			sort: "created",
		};
		const act = () => service.execute(input);

		await t.assert.rejects(act, /expected string, received Buffer/);
	});
});
