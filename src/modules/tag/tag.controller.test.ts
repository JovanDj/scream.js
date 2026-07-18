import { describe, it, type TestContext } from "node:test";
import type { Connection } from "@scream.js/database/connection.js";
import { sql } from "@scream.js/database/query-builder/sql-template-string.js";
import { sqliteDatabaseTestFixture } from "@scream.js/database/test-helpers.js";
import { ExpressApp } from "@scream.js/http/express/express-application.js";
import { HttpServer } from "@scream.js/http/server.js";
import { PagesModule } from "../pages/index.js";
import { TagModule } from "./index.js";

describe("tag controller", { concurrency: true }, () => {
	const findIdByCode = async (
		db: Connection,
		table: "todo_priorities" | "todo_statuses",
		code: string,
	) => {
		const row = await db.get<{ id: number }>({
			params: [code],
			sql: `SELECT id FROM ${table} WHERE code = ?`,
		});
		if (row === undefined) {
			throw new Error(`Missing ${table} row for ${code}`);
		}
		return row.id;
	};

	const insertTag = async (db: Connection, name: string) => {
		const now = new Date().toISOString();
		const result = await db.run(
			sql`INSERT INTO tags (created_at, name, updated_at)
			VALUES (${now}, ${name}, ${now})`,
		);
		const id = result.insertedId();
		if (id === undefined) {
			throw new Error("Tag should have an inserted ID");
		}

		return { id };
	};

	const insertTodo = async (db: Connection, title: string) => {
		const now = new Date().toISOString();
		const priorityId = await findIdByCode(db, "todo_priorities", "medium");
		const statusId = await findIdByCode(db, "todo_statuses", "open");
		const result = await db.run(
			sql`INSERT INTO todos (
				created_at, description, priority_id, project_id, status_id, title, updated_at
			) VALUES (${now}, ${""}, ${priorityId}, ${null}, ${statusId}, ${title}, ${now})`,
		);
		const id = result.insertedId();
		if (id === undefined) {
			throw new Error("Todo should have an inserted ID");
		}

		return { id };
	};

	const setupServer = async () => {
		const { cleanup: cleanupDb, db } = await sqliteDatabaseTestFixture.setup();
		const modules = [PagesModule.create(), TagModule.create(db)];
		const app = ExpressApp.create();

		for (const module of modules) {
			module.mount(app);
		}

		const httpServer = HttpServer.start({ app, port: 0 });
		const cleanup = async () => {
			await httpServer.shutdown();
			await cleanupDb();
		};

		return { cleanup, db, port: httpServer.port };
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

	it("POST /tags shows validation errors for a missing name", async (t: TestContext) => {
		const { cleanup, port } = await setupServer();
		try {
			const response = await fetch(`http://localhost:${port}/tags`, {
				body: "name=",
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
				},
				method: "POST",
				signal: t.signal,
			});
			const html = await response.text();

			t.assert.deepStrictEqual(response.status, 200);
			t.assert.match(html, /Required/);
		} finally {
			await cleanup();
		}
	});

	it("POST /tags redirects after creating a tag", async (t: TestContext) => {
		const { cleanup, port } = await setupServer();
		try {
			const response = await fetch(`http://localhost:${port}/tags`, {
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

	it("POST /tags renders the index when the name is duplicated", async (t: TestContext) => {
		const { cleanup, db, port } = await setupServer();
		try {
			await insertTag(db, "alpha");
			const response = await fetch(`http://localhost:${port}/tags`, {
				body: "name=alpha",
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
				},
				method: "POST",
				signal: t.signal,
			});
			const html = await response.text();

			t.assert.deepStrictEqual(response.status, 200);
			t.assert.match(html, /Tag name must be unique/);
			t.assert.match(html, /alpha/);
		} finally {
			await cleanup();
		}
	});

	it("POST /tags/:id with _method=DELETE returns 404 for a missing tag", async (t: TestContext) => {
		const { cleanup, port } = await setupServer();
		try {
			const response = await fetch(`http://localhost:${port}/tags/99999`, {
				body: "_method=DELETE",
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
				},
				method: "POST",
				signal: t.signal,
			});

			t.assert.deepStrictEqual(response.status, 404);
		} finally {
			await cleanup();
		}
	});

	it("POST /tags/:id with _method=DELETE returns 404 for an invalid tag id", async (t: TestContext) => {
		const { cleanup, port } = await setupServer();
		try {
			const response = await fetch(
				`http://localhost:${port}/tags/not-a-number`,
				{
					body: "_method=DELETE",
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

	it("POST /tags/:id with _method=DELETE redirects after deleting a tag", async (t: TestContext) => {
		const { cleanup, db, port } = await setupServer();
		try {
			const tag = await insertTag(db, "remove-me");
			const response = await fetch(`http://localhost:${port}/tags/${tag.id}`, {
				body: "_method=DELETE",
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
				},
				method: "POST",
				redirect: "manual",
				signal: t.signal,
			});
			const deleted = await db.get<{ id: number }>(
				sql`SELECT id FROM tags WHERE id = ${tag.id}`,
			);

			t.assert.deepStrictEqual(response.status, 302);
			t.assert.deepStrictEqual(response.headers.get("Location"), "/tags");
			t.assert.deepStrictEqual(deleted, undefined);
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

	it("POST /todos/:id/tags preserves assignments when a tag is missing", async (t: TestContext) => {
		const { cleanup, db, port } = await setupServer();
		try {
			const todo = await insertTodo(db, "Todo");
			const tag = await insertTag(db, "alpha");
			await db.run(
				sql`INSERT INTO todo_tags (created_at, tag_id, todo_id)
				VALUES (${new Date().toISOString()}, ${tag.id}, ${todo.id})`,
			);

			const response = await fetch(
				`http://localhost:${port}/todos/${todo.id}/tags`,
				{
					body: "tagIds=99999",
					headers: {
						"Content-Type": "application/x-www-form-urlencoded",
					},
					method: "POST",
					signal: t.signal,
				},
			);
			const assignment = await db.get<{ todo_id: number }>(
				sql`SELECT todo_id FROM todo_tags
				WHERE todo_id = ${todo.id} AND tag_id = ${tag.id}`,
			);

			t.assert.deepStrictEqual(response.status, 404);
			t.assert.deepStrictEqual(assignment?.todo_id, todo.id);
		} finally {
			await cleanup();
		}
	});

	it("POST /todos/:id/tags returns 404 when the todo id is invalid", async (t: TestContext) => {
		const { cleanup, db, port } = await setupServer();
		try {
			const tag = await insertTag(db, "alpha");
			const response = await fetch(
				`http://localhost:${port}/todos/not-a-number/tags`,
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

	it("POST /todos/:id/tags redirects after clearing all assigned tags", async (t: TestContext) => {
		const { cleanup, db, port } = await setupServer();
		try {
			const todo = await insertTodo(db, "Todo");
			const tag = await insertTag(db, "alpha");
			await db.run(
				sql`INSERT INTO todo_tags (created_at, tag_id, todo_id)
				VALUES (${new Date().toISOString()}, ${tag.id}, ${todo.id})`,
			);

			const response = await fetch(
				`http://localhost:${port}/todos/${todo.id}/tags`,
				{
					body: "",
					headers: {
						"Content-Type": "application/x-www-form-urlencoded",
					},
					method: "POST",
					redirect: "manual",
					signal: t.signal,
				},
			);
			const remaining = await db.get<{ todo_id: number }>(
				sql`SELECT todo_id FROM todo_tags WHERE todo_id = ${todo.id}`,
			);

			t.assert.deepStrictEqual(response.status, 302);
			t.assert.deepStrictEqual(
				response.headers.get("Location"),
				`/todos/${todo.id}/edit`,
			);
			t.assert.deepStrictEqual(remaining, undefined);
		} finally {
			await cleanup();
		}
	});
});
