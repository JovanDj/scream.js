import { describe, it, type TestContext } from "node:test";
import { databaseTestFixture } from "@scream.js/database/test-helpers.js";
import { TodoMapper } from "./todo.mapper.js";

describe("TodoMapper", { concurrency: true }, () => {
	it("persists and loads a todo through the low-level database fixture", async (t: TestContext) => {
		const { cleanup, db } = await databaseTestFixture.setup({});

		try {
			const mapper = TodoMapper.create(db);
			const created = await mapper.insert({
				description: "",
				dueAt: null,
				priority: "medium",
				projectId: null,
				statusCode: "open",
				title: "Repo Todo",
			});

			const found = await mapper.findById(created.id);

			t.assert.deepStrictEqual(found?.title, "Repo Todo");
		} finally {
			await cleanup();
		}
	});
});
