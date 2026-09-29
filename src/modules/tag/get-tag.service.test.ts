import { describe, it, type TestContext } from "node:test";
import { databaseTestFixture } from "@scream.js/database/test-helpers.js";
import { ZodError } from "zod/v4";
import { GetTagService } from "./get-tag.service.js";

describe("GetTagService", { concurrency: true }, () => {
	it("returns validated tag details and undefined for a missing tag", async (t: TestContext) => {
		const { cleanup, db } = await databaseTestFixture.setup();
		try {
			const now = new Date().toISOString();
			const [inserted] = await db("tags")
				.insert({ created_at: now, name: "Alpha", updated_at: now })
				.returning("id");
			const service = new GetTagService(db);

			const found = await service.execute({ id: Number(inserted.id) });
			const missing = await service.execute({ id: Number(inserted.id) + 1 });

			t.assert.deepStrictEqual(found, {
				id: Number(inserted.id),
				name: "Alpha",
			});
			t.assert.deepStrictEqual(missing, undefined);
		} finally {
			await cleanup();
		}
	});

	it("rejects malformed stored tag data", async (t: TestContext) => {
		const { cleanup, db } = await databaseTestFixture.setup();
		try {
			const now = new Date().toISOString();
			const [inserted] = await db("tags")
				.insert({
					created_at: now,
					name: Buffer.from("invalid"),
					updated_at: now,
				})
				.returning("id");
			const service = new GetTagService(db);
			const act = () => service.execute({ id: Number(inserted.id) });

			await t.assert.rejects(act, ZodError);
		} finally {
			await cleanup();
		}
	});
});
