import { describe, it, type TestContext } from "node:test";
import { databaseTestFixture } from "@scream.js/database/test-helpers.js";
import { DeleteTodoService } from "./delete-todo.service.js";

describe("DeleteTodoService", { concurrency: true }, () => {
	it("deletes an existing todo and returns false when it is missing", async (t: TestContext) => {
		const { cleanup, db } = await databaseTestFixture.setup({ seed: true });
		t.after(() => cleanup());

		const status = await db("todo_statuses")
			.where({ code: "open" })
			.first("id");
		const priority = await db("todo_priorities")
			.where({ code: "medium" })
			.first("id");
		const now = new Date().toISOString();
		const [deletedTodo] = await db("todos")
			.insert({
				created_at: now,
				description: "",
				priority_id: priority.id,
				status_id: status.id,
				title: "Delete me",
				updated_at: now,
			})
			.returning("id");
		const [keptTodo] = await db("todos")
			.insert({
				created_at: now,
				description: "",
				priority_id: priority.id,
				status_id: status.id,
				title: "Keep me",
				updated_at: now,
			})
			.returning("id");
		const [tag] = await db("tags")
			.insert({ created_at: now, name: "Linked", updated_at: now })
			.returning("id");
		await db("todo_tags").insert([
			{ tag_id: tag.id, todo_id: deletedTodo.id },
			{ tag_id: tag.id, todo_id: keptTodo.id },
		]);
		const service = new DeleteTodoService(db);

		t.assert.deepStrictEqual(
			await service.execute({ id: deletedTodo.id }),
			true,
		);
		t.assert.deepStrictEqual(
			await db("todos")
				.whereIn("id", [deletedTodo.id, keptTodo.id])
				.orderBy("id")
				.select("id"),
			[{ id: keptTodo.id }],
		);
		t.assert.deepStrictEqual(
			await db("todo_tags")
				.whereIn("todo_id", [deletedTodo.id, keptTodo.id])
				.select("tag_id", "todo_id"),
			[{ tag_id: tag.id, todo_id: keptTodo.id }],
		);
		t.assert.deepStrictEqual(
			await service.execute({ id: deletedTodo.id }),
			false,
		);
	});
});
