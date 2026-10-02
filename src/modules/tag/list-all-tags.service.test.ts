import { describe, it, type TestContext } from "node:test";
import { databaseTestFixture } from "@scream.js/database/test-helpers.js";
import { ListAllTagsService } from "./list-all-tags.service.js";

describe("ListAllTagsService", { concurrency: true }, () => {
	it("returns the complete validated tag list for form errors", async (t: TestContext) => {
		const { cleanup, db } = await databaseTestFixture.setup();
		t.after(() => cleanup());

		const now = new Date().toISOString();
		await db("tags").insert([
			{ created_at: now, name: "Zulu", updated_at: now },
			{ created_at: now, name: "Alpha", updated_at: now },
		]);
		const service = new ListAllTagsService(db);

		const result = await service.execute();

		t.assert.deepStrictEqual(
			result.map((tag) => tag.name),
			["Alpha", "Zulu"],
		);
	});
});
