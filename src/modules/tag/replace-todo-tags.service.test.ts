import { describe, it, type TestContext } from "node:test";
import type { Database } from "@scream.js/database/db.js";
import { databaseTestFixture } from "@scream.js/database/test-helpers.js";
import { ReplaceTodoTagsService } from "./replace-todo-tags.service.js";

describe("ReplaceTodoTagsService", () => {
	const insertTodo = async (db: Database) => {
		const now = new Date().toISOString();
		const [todo] = await db("todos")
			.insert({
				created_at: now,
				description: "",
				priority_id: 2,
				status_id: 1,
				title: "Todo",
				updated_at: now,
			})
			.returning("id");
		return Number(todo.id);
	};

	const insertTag = async (db: Database, name: string) => {
		const now = new Date().toISOString();
		const [tag] = await db("tags")
			.insert({ created_at: now, name, updated_at: now })
			.returning("id");
		return Number(tag.id);
	};

	it("replaces assignments once per tag and returns true", async (t: TestContext) => {
		const { cleanup, db } = await databaseTestFixture.setup();
		try {
			const todoId = await insertTodo(db);
			const oldTagId = await insertTag(db, "old");
			const tagId = await insertTag(db, "new");
			await db("todo_tags").insert({
				created_at: new Date().toISOString(),
				tag_id: oldTagId,
				todo_id: todoId,
			});
			const oldTimestamp = "2000-01-01T00:00:00.000Z";
			await db("todos")
				.where({ id: todoId })
				.update({ updated_at: oldTimestamp });

			const replaced = await new ReplaceTodoTagsService(db).execute({
				tagIds: [tagId, tagId],
				todoId,
			});

			t.assert.deepStrictEqual(replaced, true);
			t.assert.deepStrictEqual(
				await db("todo_tags").where({ todo_id: todoId }).select("tag_id"),
				[{ tag_id: tagId }],
			);
			const todo = await db("todos").where({ id: todoId }).first("updated_at");
			t.assert.ok(todo?.updated_at && todo.updated_at !== oldTimestamp);
		} finally {
			await cleanup();
		}
	});

	it("returns false without changing assignments for a missing tag or todo", async (t: TestContext) => {
		const { cleanup, db } = await databaseTestFixture.setup();
		try {
			const todoId = await insertTodo(db);
			const oldTagId = await insertTag(db, "old");
			await db("todo_tags").insert({
				created_at: new Date().toISOString(),
				tag_id: oldTagId,
				todo_id: todoId,
			});
			const service = new ReplaceTodoTagsService(db);

			t.assert.deepStrictEqual(
				await service.execute({ tagIds: [999999], todoId }),
				false,
			);
			t.assert.deepStrictEqual(
				await service.execute({ tagIds: [oldTagId], todoId: 999999 }),
				false,
			);
			t.assert.deepStrictEqual(
				await db("todo_tags").where({ todo_id: todoId }).select("tag_id"),
				[{ tag_id: oldTagId }],
			);
		} finally {
			await cleanup();
		}
	});
});
