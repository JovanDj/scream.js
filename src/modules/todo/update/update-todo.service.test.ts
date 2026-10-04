import { describe, it, type TestContext } from "node:test";
import { databaseTestFixture } from "@scream.js/database/test-helpers.js";
import { UpdateTodoService } from "./update-todo.service.js";

describe("UpdateTodoService", () => {
	it("rejects a malformed completion row before updating", async (t: TestContext) => {
		const { cleanup, db } = await databaseTestFixture.setup({ seed: true });
		t.after(() => cleanup());

		const now = new Date().toISOString();
		const priority = await db("todo_priorities")
			.where({ code: "medium" })
			.first("id");
		const status = await db("todo_statuses")
			.where({ code: "open" })
			.first("id");
		const [inserted] = await db("todos")
			.insert({
				completed_at: 17,
				created_at: now,
				description: "",
				priority_id: priority.id,
				status_id: status.id,
				title: "Original",
				updated_at: now,
			})
			.returning("id");

		await t.assert.rejects(
			new UpdateTodoService(db).execute({
				dueAt: "",
				id: inserted.id,
				statusCode: "completed",
				title: "Changed",
			}),
			{ name: "ZodError" },
		);
		t.assert.deepStrictEqual(
			(await db("todos").where({ id: inserted.id }).first("title")).title,
			"Original",
		);
	});

	it("returns undefined without writing when the todo is missing", async (t: TestContext) => {
		const { cleanup, db } = await databaseTestFixture.setup({ seed: true });
		t.after(() => cleanup());

		const before = await db("todos").select("*");
		const result = await new UpdateTodoService(db).execute({
			dueAt: "",
			id: 999999,
			statusCode: "completed",
			title: "Missing",
		});
		t.assert.deepStrictEqual(result, undefined);
		t.assert.deepStrictEqual(await db("todos").select("*"), before);
	});

	it("sets, preserves, clears, and resets completion time", async (t: TestContext) => {
		const { cleanup, db } = await databaseTestFixture.setup({ seed: true });
		t.after(() => cleanup());

		const now = new Date().toISOString();
		const status = await db("todo_statuses")
			.where({ code: "open" })
			.first("id");
		const priority = await db("todo_priorities")
			.where({ code: "medium" })
			.first("id");
		const [inserted] = await db("todos")
			.insert({
				created_at: now,
				description: "",
				priority_id: priority.id,
				status_id: status.id,
				title: "Original",
				updated_at: now,
			})
			.returning("id");
		const id = inserted.id;
		const service = new UpdateTodoService(db);
		const completed = {
			dueAt: "2028-02-29",
			id,
			statusCode: "completed" as const,
			title: "Completed",
		};

		t.assert.deepStrictEqual(await service.execute(completed), { id });
		const first = await db("todos")
			.join("todo_statuses", "todos.status_id", "todo_statuses.id")
			.where({ "todos.id": id })
			.first(
				"todos.completed_at",
				"todos.due_at",
				"todos.title",
				"todo_statuses.code as status_code",
			);
		t.assert.ok(first.completed_at);
		t.assert.deepStrictEqual(
			{
				due_at: first.due_at,
				status_code: first.status_code,
				title: first.title,
			},
			{ due_at: "2028-02-29", status_code: "completed", title: "Completed" },
		);

		const originalCompletion = "2020-01-02T03:04:05.000Z";
		await db("todos")
			.where({ id })
			.update({ completed_at: originalCompletion });
		await service.execute(completed);
		t.assert.deepStrictEqual(
			(await db("todos").where({ id }).first("completed_at")).completed_at,
			originalCompletion,
		);

		t.assert.deepStrictEqual(
			await service.execute({
				dueAt: "",
				id,
				statusCode: "open",
				title: "Reopened",
			}),
			{ id },
		);
		const reopened = await db("todos")
			.where({ id })
			.first("completed_at", "due_at", "title");
		t.assert.deepStrictEqual(reopened, {
			completed_at: null,
			due_at: null,
			title: "Reopened",
		});

		await service.execute(completed);
		const again = await db("todos").where({ id }).first("completed_at");
		t.assert.ok(again.completed_at);
		t.assert.notStrictEqual(again.completed_at, originalCompletion);
	});
});
