import { describe, it, type TestContext } from "node:test";
import { databaseTestFixture } from "@scream.js/database/test-helpers.js";
import { CreateTodoService } from "./create-todo.service.js";

describe("CreateTodoService", () => {
	it("returns the persisted id and stores defaults and due dates", async (t: TestContext) => {
		const { cleanup, db } = await databaseTestFixture.setup({ seed: true });
		t.after(() => cleanup());

		const service = new CreateTodoService(db);
		const undatedId = await service.execute({ dueAt: "", title: "Undated" });
		const datedId = await service.execute({
			dueAt: "2028-02-29",
			title: "Dated",
		});

		t.assert.ok(Number.isInteger(undatedId));
		t.assert.ok(Number.isInteger(datedId));
		const rows = await db("todos")
			.join("todo_priorities", "todos.priority_id", "todo_priorities.id")
			.join("todo_statuses", "todos.status_id", "todo_statuses.id")
			.whereIn("todos.id", [undatedId, datedId])
			.orderBy("todos.id")
			.select(
				"todos.id",
				"todos.title",
				"todos.description",
				"todos.due_at",
				"todos.completed_at",
				"todo_priorities.code as priority_code",
				"todo_statuses.code as status_code",
			);
		t.assert.deepStrictEqual(rows, [
			{
				completed_at: null,
				description: "",
				due_at: null,
				id: undatedId,
				priority_code: "medium",
				status_code: "open",
				title: "Undated",
			},
			{
				completed_at: null,
				description: "",
				due_at: "2028-02-29",
				id: datedId,
				priority_code: "medium",
				status_code: "open",
				title: "Dated",
			},
		]);
	});
});
