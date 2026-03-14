import { describe, it, type TestContext } from "node:test";
import { databaseTestFixture } from "@scream.js/database/test-helpers.js";
import { KnexTodoRepository } from "./todo.repository.js";

describe("TodoRepository", { concurrency: true }, () => {
	it("persists and loads a todo through the low-level database fixture", async (t: TestContext) => {
		const { cleanup, db } = await databaseTestFixture.setup({});

		try {
			const repository = KnexTodoRepository.create(db);
			const created = await repository.insert({
				description: "",
				dueAt: null,
				priority: "medium",
				projectId: null,
				statusCode: "open",
				title: "Repo Todo",
			});

			const found = await repository.findById(created.id);

			t.assert.deepStrictEqual(found?.title, "Repo Todo");
		} finally {
			await cleanup();
		}
	});
});
