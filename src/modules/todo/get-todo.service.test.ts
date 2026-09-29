import { describe, it, type TestContext } from "node:test";
import { databaseTestFixture } from "@scream.js/database/test-helpers.js";
import { GetTodoService } from "./get-todo.service.js";

describe("GetTodoService", { concurrency: true }, () => {
	it("returns trusted data, handles missing ids, and rejects invalid rows", async (t: TestContext) => {
		const { cleanup, db } = await databaseTestFixture.setup({ seed: true });
		try {
			const status = await db("todo_statuses")
				.where({ code: "open" })
				.first("id");
			const priority = await db("todo_priorities")
				.where({ code: "medium" })
				.first("id");
			const now = new Date().toISOString();
			const [inserted] = await db("todos")
				.insert({
					created_at: now,
					description: "",
					due_at: "2026-09-21",
					priority_id: priority.id,
					status_id: status.id,
					title: "Service fixture",
					updated_at: now,
				})
				.returning("id");
			const service = new GetTodoService(db);

			t.assert.deepStrictEqual(await service.execute({ id: inserted.id }), {
				dueAt: "2026-09-21",
				id: inserted.id,
				statusCode: "open",
				title: "Service fixture",
			});
			t.assert.deepStrictEqual(
				await service.execute({ id: inserted.id + 1 }),
				undefined,
			);
			await db("todo_statuses")
				.where({ id: status.id })
				.update({ code: "unexpected" });

			await t.assert.rejects(service.execute({ id: inserted.id }), {
				name: "ZodError",
			});
		} finally {
			await cleanup();
		}
	});
});
