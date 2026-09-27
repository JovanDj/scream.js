import { describe, it, type TestContext } from "node:test";
import type { Database } from "@scream.js/database/db.js";
import { databaseTestFixture } from "@scream.js/database/test-helpers.js";
import { ExpressApp } from "@scream.js/http/express/express-application.js";
import type { HttpContext } from "@scream.js/http/http-context.js";
import { HttpServer } from "@scream.js/http/server.js";
import { load } from "cheerio";
import { PagesModule } from "../pages/index.js";
import { TagModule } from "./index.js";
import { TagIndexAction } from "./tag-index.action.js";

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

	it("GET /tags/:id shows an escaped tag name and links back to tags", async (t: TestContext) => {
		const { cleanup, db, port } = await setupServer();
		try {
			await insertTag(db, "Unrelated show sentinel");
			const name = "<script>alert(1)</script> & tag";
			const tag = await insertTag(db, name);

			const response = await fetch(`http://localhost:${port}/tags/${tag.id}`, {
				signal: t.signal,
			});
			const html = await response.text();
			const document = load(html);

			t.assert.deepStrictEqual<number>(response.status, 200);
			t.assert.deepStrictEqual<string>(document("h1").text(), name);
			t.assert.doesNotMatch(html, /Unrelated show sentinel/);
			t.assert.deepStrictEqual<number>(
				document("script").filter((_, node) =>
					document(node).text().includes("alert(1)"),
				).length,
				0,
			);
			t.assert.deepStrictEqual<string | undefined>(
				document('a[href="/tags"]')
					.filter((_, node) => document(node).text().trim() === "Back to Tags")
					.attr("href"),
				"/tags",
			);
		} finally {
			await cleanup();
		}
	});

	for (const id of ["invalid", "0", "999999"]) {
		it(`GET /tags/${id} returns 404`, async (t: TestContext) => {
			const { cleanup, db, port } = await setupServer();
			try {
				await insertTag(db, "Unrelated show sentinel");

				const response = await fetch(`http://localhost:${port}/tags/${id}`, {
					signal: t.signal,
				});

				t.assert.deepStrictEqual<number>(response.status, 404);
			} finally {
				await cleanup();
			}
		});
	}

	it("GET /tags lists tags", async (t: TestContext) => {
		const { cleanup, db, port } = await setupServer();
		try {
			const tag = await insertTag(db, "alpha");
			const response = await fetch(`http://localhost:${port}/tags`, {
				signal: t.signal,
			});
			const html = await response.text();
			const document = load(html);

			t.assert.deepStrictEqual(response.status, 200);
			t.assert.match(html, /Tags/);
			t.assert.match(html, /alpha/);
			t.assert.deepStrictEqual<string>(
				document(`a[href="/tags/${tag.id}"]`).text(),
				"alpha",
			);
		} finally {
			await cleanup();
		}
	});

	it("GET /tags sorts and paginates tags while preserving query state", async (t: TestContext) => {
		const { cleanup, db, port } = await setupServer();
		try {
			for (const index of [6, 2, 9, 1, 11, 4, 8, 3, 10, 5, 7]) {
				await insertTag(db, `Paged Tag ${String(index).padStart(2, "0")}`);
			}

			const firstResponse = await fetch(
				`http://localhost:${port}/tags?sort=name&direction=desc`,
				{ signal: t.signal },
			);
			const firstPage = await firstResponse.text();
			const secondResponse = await fetch(
				`http://localhost:${port}/tags?sort=name&direction=desc&page=2`,
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
				firstPage.matchAll(/Paged Tag \d{2}/g),
				(match) => match[0],
			);
			const secondNames = Array.from(
				secondPage.matchAll(/Paged Tag \d{2}/g),
				(match) => match[0],
			);
			t.assert.deepStrictEqual<string[]>(firstNames, [
				"Paged Tag 11",
				"Paged Tag 10",
				"Paged Tag 09",
				"Paged Tag 08",
				"Paged Tag 07",
				"Paged Tag 06",
				"Paged Tag 05",
				"Paged Tag 04",
				"Paged Tag 03",
				"Paged Tag 02",
			]);
			t.assert.deepStrictEqual<number>(next.length, 1);
			t.assert.deepStrictEqual<string>(nextUrl.pathname, "/tags");
			t.assert.deepStrictEqual<[string, string][]>(
				Array.from(nextUrl.searchParams).sort(),
				[
					["direction", "desc"],
					["page", "2"],
				],
			);
			t.assert.deepStrictEqual<number>(firstPrevious.length, 0);
			t.assert.deepStrictEqual(secondResponse.status, 200);
			t.assert.deepStrictEqual<string[]>(secondNames, ["Paged Tag 01"]);
			t.assert.deepStrictEqual<number>(previous.length, 1);
			t.assert.deepStrictEqual<string>(previousUrl.pathname, "/tags");
			t.assert.deepStrictEqual<[string, string][]>(
				Array.from(previousUrl.searchParams).sort(),
				[["direction", "desc"]],
			);
			t.assert.deepStrictEqual<number>(lastNext.length, 0);
		} finally {
			await cleanup();
		}
	});

	it("GET /tags rejects invalid pagination and sorting", async (t: TestContext) => {
		const { cleanup, port } = await setupServer();
		try {
			const invalidPage = await fetch(`http://localhost:${port}/tags?page=0`, {
				signal: t.signal,
			});
			const invalidSort = await fetch(
				`http://localhost:${port}/tags?sort=unknown`,
				{ signal: t.signal },
			);

			t.assert.deepStrictEqual(invalidPage.status, 404);
			t.assert.deepStrictEqual(invalidSort.status, 404);
		} finally {
			await cleanup();
		}
	});

	it("GET /tags validates the pagination lookahead row", async (t: TestContext) => {
		const { cleanup, db } = await databaseTestFixture.setup({});
		try {
			for (let index = 1; index <= 10; index++) {
				await insertTag(db, `Valid Tag ${String(index).padStart(2, "0")}`);
			}
			const now = new Date().toISOString();
			await db("tags").insert({
				created_at: now,
				name: Buffer.from("invalid"),
				updated_at: now,
			});
			const action = new TagIndexAction(db);
			const ctx: HttpContext = {
				body: () => ({}),
				notFound: () => {},
				param: () => undefined,
				query: () => ({}),
				redirect: () => {},
				render: async () => {},
			};

			const act = () => action.handle(ctx);

			await t.assert.rejects(act, /expected string, received Buffer/);
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
		const { cleanup, db, port } = await setupServer();
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
			const indexResponse = await fetch(`http://localhost:${port}/tags`, {
				signal: t.signal,
			});
			const html = await indexResponse.text();
			const rows = await db("tags").select("name");

			t.assert.deepStrictEqual(rows, [{ name: "alpha" }]);
			t.assert.deepStrictEqual(response.status, 302);
			t.assert.deepStrictEqual(response.headers.get("Location"), "/tags");
			t.assert.deepStrictEqual<number>(indexResponse.status, 200);
			t.assert.match(html, /alpha/);
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
			const deleted = await db("tags").where({ id: tag.id }).first("id");

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
			const otherTag = await insertTag(db, "beta");

			const response = await fetch(
				`http://localhost:${port}/todos/${todo.id}/tags`,
				{
					body: new URLSearchParams([
						["tagIds", String(tag.id)],
						["tagIds", String(otherTag.id)],
					]),
					headers: {
						"Content-Type": "application/x-www-form-urlencoded",
					},
					method: "POST",
					redirect: "manual",
					signal: t.signal,
				},
			);
			const assigned = await db("todo_tags")
				.where({ todo_id: todo.id })
				.orderBy("tag_id")
				.select("tag_id");

			t.assert.deepStrictEqual(response.status, 302);
			t.assert.deepStrictEqual(assigned, [
				{ tag_id: tag.id },
				{ tag_id: otherTag.id },
			]);
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
			await db("todo_tags").insert({
				created_at: new Date().toISOString(),
				tag_id: tag.id,
				todo_id: todo.id,
			});

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
			const remaining = await db("todo_tags")
				.where({ todo_id: todo.id })
				.first("todo_id");

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
