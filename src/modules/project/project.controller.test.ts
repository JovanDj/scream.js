import { describe, it, type TestContext } from "node:test";
import type { Database } from "@scream.js/database/db.js";
import { databaseTestFixture } from "@scream.js/database/test-helpers.js";
import { ExpressApp } from "@scream.js/http/express/express-application.js";
import { HttpServer } from "@scream.js/http/server.js";
import { load } from "cheerio";
import { ProjectModule } from "./project.module.ts";

describe("project controller", { concurrency: true }, () => {
	const insertProject = async (
		db: Database,
		name: string,
		statusCode: "active" | "archived" = "active",
	) => {
		const status = await db("project_statuses")
			.where({ code: statusCode })
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

	it("GET /projects filters projects by status", async (t: TestContext) => {
		const { cleanup, db, port } = await setupServer();
		try {
			await insertProject(db, "Visible Archived Project", "archived");
			await insertProject(db, "Hidden Active Project");

			const response = await fetch(
				`http://localhost:${port}/projects?status=archived`,
				{ signal: t.signal },
			);
			const html = await response.text();

			t.assert.deepStrictEqual(response.status, 200);
			t.assert.match(html, /Visible Archived Project/);
			t.assert.doesNotMatch(html, /Hidden Active Project/);
		} finally {
			await cleanup();
		}
	});

	it("GET /projects searches projects by name", async (t: TestContext) => {
		const { cleanup, db, port } = await setupServer();
		try {
			await insertProject(db, "Searchable Project");
			await insertProject(db, "Hidden Project");

			const response = await fetch(
				`http://localhost:${port}/projects?search=Searchable`,
				{ signal: t.signal },
			);
			const html = await response.text();

			t.assert.deepStrictEqual(response.status, 200);
			t.assert.match(html, /Searchable Project/);
			t.assert.doesNotMatch(html, /Hidden Project/);
		} finally {
			await cleanup();
		}
	});

	it("GET /projects preserves search in status filters", async (t: TestContext) => {
		const { cleanup, port } = await setupServer();
		try {
			const response = await fetch(
				`http://localhost:${port}/projects?status=active&search=website`,
				{ signal: t.signal },
			);
			const html = await response.text();

			t.assert.deepStrictEqual(response.status, 200);
			t.assert.match(html, /name="status" value="active"/);
			t.assert.match(html, /href="\/projects\?search=website"/);
			t.assert.match(
				html,
				/href="\/projects\?status=archived&amp;search=website"/,
			);
		} finally {
			await cleanup();
		}
	});

	it("GET /projects with invalid status returns 404", async (t: TestContext) => {
		const { cleanup, port } = await setupServer();
		try {
			const response = await fetch(
				`http://localhost:${port}/projects?status=invalid-filter`,
				{ signal: t.signal },
			);

			t.assert.deepStrictEqual(response.status, 404);
		} finally {
			await cleanup();
		}
	});

	it("GET /projects sorts and paginates while preserving query state", async (t: TestContext) => {
		const { cleanup, db, port } = await setupServer();
		try {
			for (const index of [6, 2, 9, 1, 11, 4, 8, 3, 10, 5, 7]) {
				await insertProject(
					db,
					`Paged Project ${String(index).padStart(2, "0")}`,
				);
			}

			const firstResponse = await fetch(
				`http://localhost:${port}/projects?status=active&search=Paged&sort=name&direction=asc`,
				{ signal: t.signal },
			);
			const firstPage = await firstResponse.text();
			const secondResponse = await fetch(
				`http://localhost:${port}/projects?status=active&search=Paged&sort=name&direction=asc&page=2`,
				{ signal: t.signal },
			);
			const secondPage = await secondResponse.text();
			const firstDocument = load(firstPage);
			const secondDocument = load(secondPage);
			const next = firstDocument("a").filter(
				(_, link) => firstDocument(link).text().trim() === "Next",
			);
			const previous = secondDocument("a").filter(
				(_, link) => secondDocument(link).text().trim() === "Previous",
			);
			const firstPrevious = firstDocument("a").filter(
				(_, link) => firstDocument(link).text().trim() === "Previous",
			);
			const lastNext = secondDocument("a").filter(
				(_, link) => secondDocument(link).text().trim() === "Next",
			);
			const nextUrl = new URL(
				next.attr("href") ?? "",
				`http://localhost:${port}`,
			);
			const previousUrl = new URL(
				previous.attr("href") ?? "",
				`http://localhost:${port}`,
			);

			t.assert.deepStrictEqual(firstResponse.status, 200);
			const firstNames = Array.from(
				firstPage.matchAll(/Paged Project \d{2}/g),
				(match) => match[0],
			);
			const secondNames = Array.from(
				secondPage.matchAll(/Paged Project \d{2}/g),
				(match) => match[0],
			);
			t.assert.deepStrictEqual<string[]>(firstNames, [
				"Paged Project 01",
				"Paged Project 02",
				"Paged Project 03",
				"Paged Project 04",
				"Paged Project 05",
				"Paged Project 06",
				"Paged Project 07",
				"Paged Project 08",
				"Paged Project 09",
				"Paged Project 10",
			]);
			t.assert.deepStrictEqual<number>(next.length, 1);
			t.assert.deepStrictEqual<string>(nextUrl.pathname, "/projects");
			t.assert.deepStrictEqual<[string, string][]>(
				Array.from(nextUrl.searchParams).sort(),
				[
					["direction", "asc"],
					["page", "2"],
					["search", "Paged"],
					["sort", "name"],
					["status", "active"],
				],
			);
			t.assert.deepStrictEqual<number>(firstPrevious.length, 0);
			t.assert.deepStrictEqual(secondResponse.status, 200);
			t.assert.deepStrictEqual<string[]>(secondNames, ["Paged Project 11"]);
			t.assert.deepStrictEqual<number>(previous.length, 1);
			t.assert.deepStrictEqual<string>(previousUrl.pathname, "/projects");
			t.assert.deepStrictEqual<[string, string][]>(
				Array.from(previousUrl.searchParams).sort(),
				[
					["direction", "asc"],
					["search", "Paged"],
					["sort", "name"],
					["status", "active"],
				],
			);
			t.assert.deepStrictEqual<number>(lastNext.length, 0);
		} finally {
			await cleanup();
		}
	});

	it("GET /projects rejects invalid pagination and sorting", async (t: TestContext) => {
		const { cleanup, port } = await setupServer();
		try {
			const invalidPage = await fetch(
				`http://localhost:${port}/projects?page=0`,
				{ signal: t.signal },
			);
			const invalidSort = await fetch(
				`http://localhost:${port}/projects?sort=unknown`,
				{ signal: t.signal },
			);

			t.assert.deepStrictEqual(invalidPage.status, 404);
			t.assert.deepStrictEqual(invalidSort.status, 404);
		} finally {
			await cleanup();
		}
	});

	it("GET /projects/:id returns 404 for a missing project", async (t: TestContext) => {
		const { cleanup, db, port } = await setupServer();
		try {
			await insertProject(db, "Unrelated show sentinel");

			const response = await fetch(`http://localhost:${port}/projects/999999`, {
				signal: t.signal,
			});

			t.assert.deepStrictEqual<number>(response.status, 404);
		} finally {
			await cleanup();
		}
	});

	it("GET /projects/:id shows a project", async (t: TestContext) => {
		const { cleanup, db, port } = await setupServer();
		try {
			await insertProject(db, "Unrelated show sentinel", "archived");
			const project = await insertProject(db, "Show Me");
			const response = await fetch(
				`http://localhost:${port}/projects/${project.id}`,
				{ signal: t.signal },
			);
			const html = await response.text();

			t.assert.deepStrictEqual(response.status, 200);
			t.assert.match(html, /Show Me/);
			t.assert.doesNotMatch(html, /Unrelated show sentinel/);
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
		const { cleanup, db, port } = await setupServer();
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
			const showResponse = await fetch(`http://localhost:${port}/projects/1`, {
				signal: t.signal,
			});
			const html = await showResponse.text();
			const rows = await db("projects").select("name");

			t.assert.deepStrictEqual(rows, [{ name: "Created Project" }]);
			t.assert.deepStrictEqual(response.status, 302);
			t.assert.deepStrictEqual(response.headers.get("Location"), "/projects/1");
			t.assert.deepStrictEqual<number>(showResponse.status, 200);
			t.assert.match(html, /Created Project/);
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
			const archivedResponse = await fetch(
				`http://localhost:${port}/projects/${project.id}`,
				{ signal: t.signal },
			);
			const archivedHtml = await archivedResponse.text();
			const unarchived = await fetch(
				`http://localhost:${port}/projects/${project.id}/unarchive`,
				{
					method: "POST",
					redirect: "manual",
					signal: t.signal,
				},
			);
			const activeResponse = await fetch(
				`http://localhost:${port}/projects/${project.id}`,
				{ signal: t.signal },
			);
			const activeHtml = await activeResponse.text();

			t.assert.deepStrictEqual(archived.status, 302);
			t.assert.deepStrictEqual<number>(archivedResponse.status, 200);
			t.assert.match(archivedHtml, /Status:\s*archived/);
			t.assert.deepStrictEqual<number>(activeResponse.status, 200);
			t.assert.match(activeHtml, /Status:\s*active/);
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
