import { describe, it, type TestContext } from "node:test";
import type { Database } from "@scream.js/database/db.js";
import { databaseTestFixture } from "@scream.js/database/test-helpers.js";
import { createExpressApp } from "@scream.js/http/express/create-express-application.js";
import { startTestServer } from "@scream.js/http/server.js";
import { createHttpApp } from "../../../main.js";
import { createTodoModule } from "../todo/index.js";
import { createTagModule } from "./index.js";

describe("tag controller", { concurrency: true }, () => {
	const findIdByCode = async (
		db: Database,
		table: "todo_priorities" | "todo_statuses",
		code: string,
	) => {
		const row = await db(table).where({ code }).first("id");
		return Number(row["id"]);
	};

	const insertTag = async (db: Database, name: string) => {
		const now = new Date().toISOString();
		const [row] = await db("tags")
			.insert({
				created_at: now,
				name,
				updated_at: now,
			})
			.returning(["id"]);

		return { id: Number(row["id"]) };
	};

	const insertTodo = async (db: Database, title: string) => {
		const now = new Date().toISOString();
		const priorityId = await findIdByCode(db, "todo_priorities", "medium");
		const statusId = await findIdByCode(db, "todo_statuses", "open");
		const [row] = await db("todos")
			.insert({
				created_at: now,
				description: "",
				priority_id: priorityId,
				project_id: null,
				status_id: statusId,
				title,
				updated_at: now,
			})
			.returning(["id"]);

		return { id: Number(row["id"]) };
	};

	const setupServer = async () => {
		const { cleanup: cleanupDb, db } = await databaseTestFixture.setup({});
		const modules = {
			...createTodoModule({ db }),
			...createTagModule({ db }),
		};
		const app = createExpressApp();

		createHttpApp({
			app,
			tagController: modules.tagController,
			todosController: modules.todosController,
		});

		const { port, shutdown } = await startTestServer(app);
		const cleanup = async () => {
			await shutdown();
			await cleanupDb();
		};

		return { cleanup, db, modules, port };
	};

	it("GET /tags lists tags", async (t: TestContext) => {
		const { cleanup, db, port } = await setupServer();
		try {
			await insertTag(db, "alpha");
			const response = await fetch(`http://localhost:${port}/tags`, {
				signal: t.signal,
			});
			const html = await response.text();

			t.assert.deepStrictEqual(response.status, 200);
			t.assert.match(html, /Tags/);
			t.assert.match(html, /alpha/);
		} finally {
			await cleanup();
		}
	});

	it("POST /tags/create shows validation errors for a missing name", async (t: TestContext) => {
		const { cleanup, port } = await setupServer();
		try {
			const response = await fetch(`http://localhost:${port}/tags/create`, {
				body: "name=",
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
				},
				method: "POST",
				signal: t.signal,
			});
			const html = await response.text();

			t.assert.deepStrictEqual(response.status, 422);
			t.assert.match(html, /Required/);
		} finally {
			await cleanup();
		}
	});

	it("POST /tags/create redirects after creating a tag", async (t: TestContext) => {
		const { cleanup, port } = await setupServer();
		try {
			const response = await fetch(`http://localhost:${port}/tags/create`, {
				body: "name=alpha",
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
				},
				method: "POST",
				redirect: "manual",
				signal: t.signal,
			});

			t.assert.deepStrictEqual(response.status, 302);
			t.assert.deepStrictEqual(response.headers.get("Location"), "/tags");
		} finally {
			await cleanup();
		}
	});

	it("POST /tags/create renders the index when the name is duplicated", async (t: TestContext) => {
		const { cleanup, db, port } = await setupServer();
		try {
			await insertTag(db, "alpha");
			const response = await fetch(`http://localhost:${port}/tags/create`, {
				body: "name=alpha",
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
				},
				method: "POST",
				signal: t.signal,
			});
			const html = await response.text();

			t.assert.deepStrictEqual(response.status, 422);
			t.assert.match(html, /Tag name must be unique/);
		} finally {
			await cleanup();
		}
	});

	it("POST /tags/:id/delete returns 404 for a missing tag", async (t: TestContext) => {
		const { cleanup, port } = await setupServer();
		try {
			const response = await fetch(
				`http://localhost:${port}/tags/99999/delete`,
				{
					method: "POST",
					signal: t.signal,
				},
			);

			t.assert.deepStrictEqual(response.status, 404);
		} finally {
			await cleanup();
		}
	});

	it("POST /todos/:id/tags redirects to edit when assigning tags succeeds", async (t: TestContext) => {
		const { cleanup, db, port } = await setupServer();
		try {
			const todo = await insertTodo(db, "Todo");
			const tag = await insertTag(db, "alpha");

			const response = await fetch(
				`http://localhost:${port}/todos/${todo.id}/tags`,
				{
					body: `tagIds=${tag.id}`,
					headers: {
						"Content-Type": "application/x-www-form-urlencoded",
					},
					method: "POST",
					redirect: "manual",
					signal: t.signal,
				},
			);

			t.assert.deepStrictEqual(response.status, 302);
			t.assert.deepStrictEqual(
				response.headers.get("Location"),
				`/todos/${todo.id}/edit`,
			);
		} finally {
			await cleanup();
		}
	});

	it("POST /todos/:id/tags returns 404 when the todo is missing", async (t: TestContext) => {
		const { cleanup, db, port } = await setupServer();
		try {
			const tag = await insertTag(db, "alpha");
			const response = await fetch(
				`http://localhost:${port}/todos/99999/tags`,
				{
					body: `tagIds=${tag.id}`,
					headers: {
						"Content-Type": "application/x-www-form-urlencoded",
					},
					method: "POST",
					signal: t.signal,
				},
			);

			t.assert.deepStrictEqual(response.status, 404);
		} finally {
			await cleanup();
		}
	});

	it("POST /todos/:id/tags redirects back to edit when tag ids are invalid", async (t: TestContext) => {
		const { cleanup, db, port } = await setupServer();
		try {
			const todo = await insertTodo(db, "Todo");
			const response = await fetch(
				`http://localhost:${port}/todos/${todo.id}/tags`,
				{
					body: "tagIds=not-a-number",
					headers: {
						"Content-Type": "application/x-www-form-urlencoded",
					},
					method: "POST",
					redirect: "manual",
					signal: t.signal,
				},
			);

			t.assert.deepStrictEqual(response.status, 302);
			t.assert.deepStrictEqual(
				response.headers.get("Location"),
				`/todos/${todo.id}/edit`,
			);
		} finally {
			await cleanup();
		}
	});
});
