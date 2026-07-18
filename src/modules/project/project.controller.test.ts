import { describe, it, type TestContext } from "node:test";
import type { SqliteDatabase } from "@scream.js/database/db.js";
import { sqliteDatabaseTestFixture } from "@scream.js/database/test-helpers.js";
import { ExpressApp } from "@scream.js/http/express/express-application.js";
import { HttpServer } from "@scream.js/http/server.js";
import { ProjectModule } from "./project.module.ts";

describe("project controller", { concurrency: true }, () => {
	const insertProject = (db: SqliteDatabase, name: string) => {
		const status = db
			.prepare<[string], { id: number }>(
				"SELECT id FROM project_statuses WHERE code = ?",
			)
			.get("active");
		if (status === undefined) {
			throw new Error("Active project status should exist");
		}
		const now = new Date().toISOString();
		const result = db
			.prepare<[string, number, string, string]>(
				`INSERT INTO projects (name, status_id, created_at, updated_at)
				VALUES (?, ?, ?, ?)`,
			)
			.run(name, status.id, now, now);

		return { id: Number(result.lastInsertRowid) };
	};

	const setupServer = async () => {
		const { cleanup: cleanupDb, db } = await sqliteDatabaseTestFixture.setup(
			{},
		);
		const module = ProjectModule.create(db);
		const app = ExpressApp.create();

		module.mount(app);

		const httpServer = HttpServer.start({ app, port: 0 });
		const cleanup = async () => {
			await httpServer.shutdown();
			await cleanupDb();
		};

		return { cleanup, db, port: httpServer.port };
	};

	it("GET /projects lists projects", async (t: TestContext) => {
		const { cleanup, db, port } = await setupServer();
		try {
			await insertProject(db, "Alpha");
			const response = await fetch(`http://localhost:${port}/projects`, {
				signal: t.signal,
			});
			const html = await response.text();

			t.assert.deepStrictEqual(response.status, 200);
			t.assert.match(html, /Projects/);
			t.assert.match(html, /Alpha/);
		} finally {
			await cleanup();
		}
	});

	it("GET /projects/:id shows a project", async (t: TestContext) => {
		const { cleanup, db, port } = await setupServer();
		try {
			const project = await insertProject(db, "Show Me");
			const response = await fetch(
				`http://localhost:${port}/projects/${project.id}`,
				{ signal: t.signal },
			);
			const html = await response.text();

			t.assert.deepStrictEqual(response.status, 200);
			t.assert.match(html, /Show Me/);
			t.assert.match(html, /Status:\s*active/);
		} finally {
			await cleanup();
		}
	});

	it("GET /projects/:id returns 404 for an invalid project id", async (t: TestContext) => {
		const { cleanup, port } = await setupServer();
		try {
			const response = await fetch(
				`http://localhost:${port}/projects/not-a-number`,
				{ signal: t.signal },
			);

			t.assert.deepStrictEqual(response.status, 404);
		} finally {
			await cleanup();
		}
	});

	it("POST /projects shows validation errors for a missing name", async (t: TestContext) => {
		const { cleanup, port } = await setupServer();
		try {
			const response = await fetch(`http://localhost:${port}/projects`, {
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

	it("POST /projects redirects to the created project", async (t: TestContext) => {
		const { cleanup, port } = await setupServer();
		try {
			const response = await fetch(`http://localhost:${port}/projects`, {
				body: "name=Created+Project",
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
				},
				method: "POST",
				redirect: "manual",
				signal: t.signal,
			});

			t.assert.deepStrictEqual(response.status, 302);
			t.assert.deepStrictEqual(response.headers.get("Location"), "/projects/1");
		} finally {
			await cleanup();
		}
	});

	it("POST /projects renders the form when the name is duplicated", async (t: TestContext) => {
		const { cleanup, db, port } = await setupServer();
		try {
			await insertProject(db, "Duplicate");
			const response = await fetch(`http://localhost:${port}/projects`, {
				body: "name=Duplicate",
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
				},
				method: "POST",
				signal: t.signal,
			});
			const html = await response.text();

			t.assert.deepStrictEqual(response.status, 200);
			t.assert.match(html, /Project name must be unique/);
		} finally {
			await cleanup();
		}
	});

	it("POST /projects/:id with _method=PATCH returns 404 for a missing project", async (t: TestContext) => {
		const { cleanup, port } = await setupServer();
		try {
			const response = await fetch(`http://localhost:${port}/projects/99999`, {
				body: "_method=PATCH&name=Missing",
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

	it("POST /projects/:id with _method=PATCH returns 404 for an invalid project id", async (t: TestContext) => {
		const { cleanup, port } = await setupServer();
		try {
			const response = await fetch(
				`http://localhost:${port}/projects/not-a-number`,
				{
					body: "_method=PATCH&name=Invalid",
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

	it("POST archive and unarchive redirect to the project page", async (t: TestContext) => {
		const { cleanup, db, port } = await setupServer();
		try {
			const project = await insertProject(db, "Archive Me");
			const archived = await fetch(
				`http://localhost:${port}/projects/${project.id}/archive`,
				{
					method: "POST",
					redirect: "manual",
					signal: t.signal,
				},
			);
			const archivedStatus = db
				.prepare<[number], { code: string }>(
					`SELECT project_statuses.code
					FROM projects
					INNER JOIN project_statuses
						ON projects.status_id = project_statuses.id
					WHERE projects.id = ?`,
				)
				.get(project.id);
			const unarchived = await fetch(
				`http://localhost:${port}/projects/${project.id}/unarchive`,
				{
					method: "POST",
					redirect: "manual",
					signal: t.signal,
				},
			);
			const unarchivedStatus = db
				.prepare<[number], { code: string }>(
					`SELECT project_statuses.code
					FROM projects
					INNER JOIN project_statuses
						ON projects.status_id = project_statuses.id
					WHERE projects.id = ?`,
				)
				.get(project.id);

			t.assert.deepStrictEqual(archived.status, 302);
			t.assert.deepStrictEqual(
				archived.headers.get("Location"),
				`/projects/${project.id}`,
			);
			t.assert.deepStrictEqual(archivedStatus?.code, "archived");
			t.assert.deepStrictEqual(unarchived.status, 302);
			t.assert.deepStrictEqual(
				unarchived.headers.get("Location"),
				`/projects/${project.id}`,
			);
			t.assert.deepStrictEqual(unarchivedStatus?.code, "active");
		} finally {
			await cleanup();
		}
	});

	it("POST /projects/:id/archive returns 404 for an invalid project id", async (t: TestContext) => {
		const { cleanup, port } = await setupServer();
		try {
			const response = await fetch(
				`http://localhost:${port}/projects/not-a-number/archive`,
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

	it("POST /projects/:id/archive returns 404 for a missing project", async (t: TestContext) => {
		const { cleanup, port } = await setupServer();
		try {
			const response = await fetch(
				`http://localhost:${port}/projects/99999/archive`,
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

	it("POST /projects/:id/unarchive returns 404 for an invalid project id", async (t: TestContext) => {
		const { cleanup, port } = await setupServer();
		try {
			const response = await fetch(
				`http://localhost:${port}/projects/not-a-number/unarchive`,
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

	it("POST /projects/:id/unarchive returns 404 for a missing project", async (t: TestContext) => {
		const { cleanup, port } = await setupServer();
		try {
			const response = await fetch(
				`http://localhost:${port}/projects/99999/unarchive`,
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
});
