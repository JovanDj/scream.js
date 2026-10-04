import { describe, it, type TestContext } from "node:test";
import { databaseTestFixture } from "@scream.js/database/test-helpers.js";
import { CreateTagService } from "./create-tag.service.js";

describe("CreateTagService", { concurrency: true }, () => {
	it("persists a tag without an HTTP controller", async (t: TestContext) => {
		const { cleanup, db } = await databaseTestFixture.setup();
		t.after(() => cleanup());

		const service = new CreateTagService(db);

		const result = await service.execute({ name: "Alpha" });
		const tags = await db("tags").select("name");

		t.assert.deepStrictEqual(result, undefined);
		t.assert.deepStrictEqual(tags, [{ name: "Alpha" }]);
	});
});
