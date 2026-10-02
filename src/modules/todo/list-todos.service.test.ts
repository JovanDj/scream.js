import { describe, it, type TestContext } from "node:test";
import type { Database } from "@scream.js/database/db.js";
import { databaseTestFixture } from "@scream.js/database/test-helpers.js";
import { ListTodosService } from "./list-todos.service.js";
import { todoIndexInputSchema } from "./todo.schema.js";

describe("ListTodosService", { concurrency: true }, () => {
	const insertTodo = async (
		db: Database,
		title: string,
		status: "open" | "completed" = "open",
		dueAt: string | null = null,
	) => {
		const statusRow = await db("todo_statuses")
			.where({ code: status })
			.first("id");
		const priorityRow = await db("todo_priorities")
			.where({ code: "medium" })
			.first("id");
		const [row] = await db("todos")
			.insert({
				due_at: dueAt,
				priority_id: priorityRow.id,
				status_id: statusRow.id,
				title,
			})
			.returning("id");
		return Number(row.id);
	};

	it("sorts with stable id tie-breakers and returns the lookahead row at each offset", async (t: TestContext) => {
		const { cleanup, db } = await databaseTestFixture.setup();
		t.after(() => cleanup());

		const olderAlpha = await insertTodo(db, "Alpha");
		const newerAlpha = await insertTodo(db, "Alpha");
		const beta = await insertTodo(db, "Beta", "completed");
		const zed = await insertTodo(db, "Zed");
		const service = new ListTodosService(db);
		const input = {
			...todoIndexInputSchema.parse({ direction: "asc", sort: "title" }),
			limit: 3,
			offset: 0,
		};

		t.assert.deepStrictEqual(
			(await service.execute(input)).map((todo) => todo.id),
			[newerAlpha, olderAlpha, beta],
		);
		t.assert.deepStrictEqual(
			(await service.execute({ ...input, offset: 2 })).map((todo) => todo.id),
			[beta, zed],
		);
		t.assert.deepStrictEqual(
			(
				await service.execute({
					...input,
					direction: "desc",
					sort: "created",
				})
			).map((todo) => todo.id),
			[zed, beta, newerAlpha],
		);
		t.assert.deepStrictEqual(
			await service.execute({ ...input, sort: "status" }),
			[
				{ id: beta, statusCode: "completed", title: "Beta" },
				{ id: zed, statusCode: "open", title: "Zed" },
				{ id: newerAlpha, statusCode: "open", title: "Alpha" },
			],
		);
	});

	it("applies search, status, and due-today filters", async (t: TestContext) => {
		const { cleanup, db } = await databaseTestFixture.setup();
		t.after(() => cleanup());

		const [{ today, tomorrow }] = await db.select(
			db.raw("date('now', 'localtime') as today"),
			db.raw("date('now', 'localtime', '+1 day') as tomorrow"),
		);
		const dueToday = await insertTodo(db, "Milk today", "open", today);
		await insertTodo(db, "Milk tomorrow", "open", tomorrow);
		const completed = await insertTodo(
			db,
			"Milk completed",
			"completed",
			today,
		);
		await insertTodo(db, "Bread today", "open", today);
		const service = new ListTodosService(db);
		const input = {
			...todoIndexInputSchema.parse({ search: "Milk" }),
			limit: 10,
			offset: 0,
		};

		t.assert.deepStrictEqual(
			(await service.execute({ ...input, status: "dueToday" })).map(
				(todo) => todo.id,
			),
			[dueToday],
		);
		t.assert.deepStrictEqual(
			(await service.execute({ ...input, status: "completed" })).map(
				(todo) => todo.id,
			),
			[completed],
		);
		t.assert.deepStrictEqual(
			(await service.execute({ ...input, status: "open" })).map(
				(todo) => todo.title,
			),
			["Milk tomorrow", "Milk today"],
		);
	});

	it("rejects a malformed lookahead row", async (t: TestContext) => {
		const { cleanup, db } = await databaseTestFixture.setup();
		t.after(() => cleanup());

		await insertTodo(db, "Valid");
		await insertTodo(db, "");
		const service = new ListTodosService(db);
		const input = {
			...todoIndexInputSchema.parse({ direction: "asc", sort: "created" }),
			limit: 2,
			offset: 0,
		};

		await t.assert.rejects(() => service.execute(input), {
			name: "ZodError",
		});
	});
});
