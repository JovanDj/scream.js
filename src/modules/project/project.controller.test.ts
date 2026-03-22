import { describe, it, type TestContext } from "node:test";
import type { Database } from "@scream.js/database/db.js";
import { databaseTestFixture } from "@scream.js/database/test-helpers.js";
import { createExpressApp } from "@scream.js/http/express/create-express-application.js";
import { startTestServer } from "@scream.js/http/server.js";
import { createHttpApp } from "../../../main.js";
import { createTodoModule } from "../todo/index.js";
import { createProjectModule } from "./index.js";

describe("project controller", { concurrency: true }, () => {
	const insertProject = async (db: Database, name: string) => {
		const status = await db("project_statuses")
			.where({ code: "active" })
			.first("id");
		const now = new Date().toISOString();
		const [row] = await db("projects")
			.insert({
				created_at: now,
				name,
				status_id: Number(status["id"]),
				updated_at: now,
			})
			.returning(["id"]);

		return { id: Number(row["id"]) };
	};

	const setupServer = async () => {
		const { cleanup: cleanupDb, db } = await databaseTestFixture.setup({});
		const modules = {
			...createTodoModule(),
			...createProjectModule(),
		};
		const app = createExpressApp(db);

		createHttpApp({
			app,
			projectController: modules.projectController,
			todosController: modules.todosController,
		});

		const { port, shutdown } = await startTestServer(app);
		const cleanup = async () => {
			await shutdown();
			await cleanupDb();
		};

		return { cleanup, db, modules, port };
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

	it("POST /projects/create shows validation errors for a missing name", async (t: TestContext) => {
		const { cleanup, port } = await setupServer();
		try {
			const response = await fetch(`http://localhost:${port}/projects/create`, {
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

	it("POST /projects/create redirects to the created project", async (t: TestContext) => {
		const { cleanup, port } = await setupServer();
		try {
			const response = await fetch(`http://localhost:${port}/projects/create`, {
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

	it("POST /projects/create renders the form when the name is duplicated", async (t: TestContext) => {
		const { cleanup, db, port } = await setupServer();
		try {
			await insertProject(db, "Duplicate");
			const response = await fetch(`http://localhost:${port}/projects/create`, {
				body: "name=Duplicate",
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
				},
				method: "POST",
				signal: t.signal,
			});
			const html = await response.text();

			t.assert.deepStrictEqual(response.status, 422);
			t.assert.match(html, /Project name must be unique/);
		} finally {
			await cleanup();
		}
	});

	it("POST /projects/:id/edit returns 404 for a missing project", async (t: TestContext) => {
		const { cleanup, port } = await setupServer();
		try {
			const response = await fetch(
				`http://localhost:${port}/projects/99999/edit`,
				{
					body: "name=Missing",
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
			const unarchived = await fetch(
				`http://localhost:${port}/projects/${project.id}/unarchive`,
				{
					method: "POST",
					redirect: "manual",
					signal: t.signal,
				},
			);

			t.assert.deepStrictEqual(archived.status, 302);
			t.assert.deepStrictEqual(
				archived.headers.get("Location"),
				`/projects/${project.id}`,
			);
			t.assert.deepStrictEqual(unarchived.status, 302);
			t.assert.deepStrictEqual(
				unarchived.headers.get("Location"),
				`/projects/${project.id}`,
			);
		} finally {
			await cleanup();
		}
	});
});
