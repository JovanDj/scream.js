import { describe, it, type TestContext } from "node:test";
import { databaseTestFixture } from "@scream.js/database/test-helpers.js";
import { ExpressApp } from "@scream.js/http/express/express-application.js";
import { HttpServer } from "@scream.js/http/server.js";
import { load } from "cheerio";
import { PagesModule } from "../pages/index.js";
import { TodoModule } from "./todo.module.ts";

describe("todo controller", { concurrency: true }, () => {
	const setupServer = async () => {
		const { cleanup: cleanupDb, db } = await databaseTestFixture.setup({
			seed: true,
		});
		const modules = [PagesModule.create(), TodoModule.create(db)];
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

	const createTodo = async (input: {
		dueAt?: string;
		port: number;
		signal: AbortSignal;
		title: string;
	}) => {
		const res = await fetch(`http://localhost:${input.port}/todos`, {
			body: new URLSearchParams({
				dueAt: input.dueAt ?? "",
				title: input.title,
			}),
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
			method: "POST",
			redirect: "manual",
			signal: input.signal,
		});
		const location = res.headers.get("Location");
		if (!location) {
			throw new Error("Location header should include the todo id");
		}
		const id = location.split("/").pop();
		if (!id) {
			throw new Error("Location header should end with the todo id");
		}

		return { id, location };
	};

	it("GET / responds with 200", async (t: TestContext) => {
		t.plan(6);
		const { port, cleanup } = await setupServer();
		try {
			const res = await fetch(`http://localhost:${port}/`, {
				signal: t.signal,
			});
			const html = await res.text();

			t.assert.deepStrictEqual<number>(res.status, 200);
			t.assert.doesNotMatch(
				html,
				/https:\/\/cdn\.jsdelivr\.net\/npm\/bootstrap/,
			);
			t.assert.match(html, /http:\/\/localhost:5173\/@vite\/client/);
			t.assert.match(
				html,
				/<link rel="stylesheet" href="http:\/\/localhost:5173\/styles\.scss">/,
			);
			t.assert.match(html, /http:\/\/localhost:5173\/main\.ts/);
			t.assert.match(html, /<link rel="icon" href="data:,">/);
		} finally {
			await cleanup();
		}
	});

	it("GET /about responds with 200", async (t: TestContext) => {
		t.plan(2);
		const { port, cleanup } = await setupServer();
		try {
			const res = await fetch(`http://localhost:${port}/about`, {
				signal: t.signal,
			});
			const html = await res.text();

			t.assert.deepStrictEqual<number>(res.status, 200);
			t.assert.doesNotMatch(
				html,
				/https:\/\/cdn\.jsdelivr\.net\/npm\/bootstrap/,
			);
		} finally {
			await cleanup();
		}
	});

	it("GET /todos lists todos", async (t: TestContext) => {
		t.plan(2);
		const { port, cleanup } = await setupServer();
		try {
			const res = await fetch(`http://localhost:${port}/todos`, {
				signal: t.signal,
			});

			t.assert.ok(res.ok);
			t.assert.deepStrictEqual<number>(res.status, 200);
		} finally {
			await cleanup();
		}
	});

	it("GET /todos?status=open returns 200", async (t: TestContext) => {
		t.plan(3);
		const { port, cleanup } = await setupServer();
		try {
			await createTodo({
				port,
				signal: t.signal,
				title: "Visible unfinished fixture",
			});
			const completed = await createTodo({
				port,
				signal: t.signal,
				title: "Hidden finished fixture",
			});
			await fetch(`http://localhost:${port}/todos/${completed.id}`, {
				body: new URLSearchParams({
					_method: "PATCH",
					statusCode: "completed",
					title: "Hidden finished fixture",
				}),
				headers: { "Content-Type": "application/x-www-form-urlencoded" },
				method: "POST",
				redirect: "manual",
				signal: t.signal,
			});
			const res = await fetch(`http://localhost:${port}/todos?status=open`, {
				signal: t.signal,
			});
			const html = await res.text();
			t.assert.deepStrictEqual<number>(res.status, 200);
			t.assert.match(html, /Visible unfinished fixture/);
			t.assert.doesNotMatch(html, /Hidden finished fixture/);
		} finally {
			await cleanup();
		}
	});

	it("GET /todos?status=completed returns 200", async (t: TestContext) => {
		t.plan(3);
		const { port, cleanup } = await setupServer();
		try {
			await createTodo({
				port,
				signal: t.signal,
				title: "Hidden unfinished fixture",
			});
			const completed = await createTodo({
				port,
				signal: t.signal,
				title: "Visible finished fixture",
			});
			await fetch(`http://localhost:${port}/todos/${completed.id}`, {
				body: new URLSearchParams({
					_method: "PATCH",
					statusCode: "completed",
					title: "Visible finished fixture",
				}),
				headers: { "Content-Type": "application/x-www-form-urlencoded" },
				method: "POST",
				redirect: "manual",
				signal: t.signal,
			});
			const res = await fetch(
				`http://localhost:${port}/todos?status=completed`,
				{
					signal: t.signal,
				},
			);
			const html = await res.text();
			t.assert.deepStrictEqual<number>(res.status, 200);
			t.assert.match(html, /Visible finished fixture/);
			t.assert.doesNotMatch(html, /Hidden unfinished fixture/);
		} finally {
			await cleanup();
		}
	});

	it("GET /todos?status=dueToday returns 200", async (t: TestContext) => {
		t.plan(1);
		const { port, cleanup } = await setupServer();
		try {
			const res = await fetch(
				`http://localhost:${port}/todos?status=dueToday`,
				{
					signal: t.signal,
				},
			);
			t.assert.deepStrictEqual<number>(res.status, 200);
		} finally {
			await cleanup();
		}
	});

	it("GET /todos links to the due today filter", async (t: TestContext) => {
		const { port, cleanup } = await setupServer();
		try {
			const response = await fetch(`http://localhost:${port}/todos`, {
				signal: t.signal,
			});
			const html = await response.text();

			t.assert.deepStrictEqual<number>(response.status, 200);
			t.assert.match(html, /href="\/todos\?status=dueToday">Due Today<\/a>/);
		} finally {
			await cleanup();
		}
	});

	it("GET /todos?status=dueToday lists only open todos due today", async (t: TestContext) => {
		const { port, cleanup } = await setupServer();
		try {
			const today = new Date();
			const tomorrow = new Date(today);
			tomorrow.setDate(today.getDate() + 1);
			const todayInput = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
			const tomorrowInput = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, "0")}-${String(tomorrow.getDate()).padStart(2, "0")}`;
			await createTodo({
				dueAt: todayInput,
				port,
				signal: t.signal,
				title: "Open todo due today from integration",
			});
			await createTodo({
				dueAt: tomorrowInput,
				port,
				signal: t.signal,
				title: "Open todo due tomorrow from integration",
			});
			const completedTodo = await createTodo({
				dueAt: todayInput,
				port,
				signal: t.signal,
				title: "Completed todo due today from integration",
			});
			const completionResponse = await fetch(
				`http://localhost:${port}/todos/${completedTodo.id}`,
				{
					body: new URLSearchParams({
						_method: "PATCH",
						dueAt: todayInput,
						statusCode: "completed",
						title: "Completed todo due today from integration",
					}),
					headers: {
						"Content-Type": "application/x-www-form-urlencoded",
					},
					method: "POST",
					redirect: "manual",
					signal: t.signal,
				},
			);
			t.assert.deepStrictEqual<number>(completionResponse.status, 302);

			const response = await fetch(
				`http://localhost:${port}/todos?status=dueToday`,
				{ signal: t.signal },
			);
			const html = await response.text();

			t.assert.deepStrictEqual<number>(response.status, 200);
			t.assert.match(html, /Open todo due today from integration/);
			t.assert.doesNotMatch(html, /Open todo due tomorrow from integration/);
			t.assert.doesNotMatch(html, /Completed todo due today from integration/);
		} finally {
			await cleanup();
		}
	});

	it("GET /todos with invalid status returns 404", async (t: TestContext) => {
		t.plan(1);
		const { port, cleanup } = await setupServer();
		try {
			const res = await fetch(
				`http://localhost:${port}/todos?status=invalid-filter`,
				{
					signal: t.signal,
				},
			);
			t.assert.deepStrictEqual<number>(res.status, 404);
		} finally {
			await cleanup();
		}
	});

	it("preserves status in the search form and filter links", async (t: TestContext) => {
		t.plan(4);
		const { port, cleanup } = await setupServer();
		try {
			const res = await fetch(
				`http://localhost:${port}/todos?status=open&search=milk`,
				{
					signal: t.signal,
				},
			);
			const html = await res.text();

			t.assert.match(html, /name="status" value="open"/);
			t.assert.match(html, /href="\/todos\?status=open&amp;search=milk"/);
			t.assert.match(html, /href="\/todos\?status=completed&amp;search=milk"/);
			t.assert.match(html, /href="\/todos\?search=milk"/);
		} finally {
			await cleanup();
		}
	});

	it("sorts and paginates todos while preserving query state", async (t: TestContext) => {
		const { port, cleanup } = await setupServer();
		try {
			for (const index of [6, 2, 9, 1, 11, 4, 8, 3, 10, 5, 7]) {
				await createTodo({
					port,
					signal: t.signal,
					title: `Paged Todo ${String(index).padStart(2, "0")}`,
				});
			}

			const firstResponse = await fetch(
				`http://localhost:${port}/todos?status=open&search=Paged&sort=title&direction=asc`,
				{ signal: t.signal },
			);
			const firstPage = await firstResponse.text();
			const secondResponse = await fetch(
				`http://localhost:${port}/todos?status=open&search=Paged&sort=title&direction=asc&page=2`,
				{ signal: t.signal },
			);
			const secondPage = await secondResponse.text();

			const firstTitles = Array.from(
				firstPage.matchAll(/Paged Todo \d{2}/g),
				(match) => match[0],
			);
			const secondTitles = Array.from(
				secondPage.matchAll(/Paged Todo \d{2}/g),
				(match) => match[0],
			);
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
			t.assert.deepStrictEqual<string[]>(firstTitles, [
				"Paged Todo 01",
				"Paged Todo 02",
				"Paged Todo 03",
				"Paged Todo 04",
				"Paged Todo 05",
				"Paged Todo 06",
				"Paged Todo 07",
				"Paged Todo 08",
				"Paged Todo 09",
				"Paged Todo 10",
			]);
			t.assert.deepStrictEqual<number>(next.length, 1);
			t.assert.deepStrictEqual<number>(previous.length, 1);
			t.assert.deepStrictEqual<string>(nextUrl.pathname, "/todos");
			t.assert.deepStrictEqual<[string, string][]>(
				Array.from(nextUrl.searchParams).sort(),
				[
					["direction", "asc"],
					["page", "2"],
					["search", "Paged"],
					["sort", "title"],
					["status", "open"],
				],
			);
			t.assert.deepStrictEqual<string>(previousUrl.pathname, "/todos");
			t.assert.deepStrictEqual<[string, string][]>(
				Array.from(previousUrl.searchParams).sort(),
				[
					["direction", "asc"],
					["search", "Paged"],
					["sort", "title"],
					["status", "open"],
				],
			);
			t.assert.deepStrictEqual<number>(firstPrevious.length, 0);
			t.assert.deepStrictEqual<number>(lastNext.length, 0);
			t.assert.deepStrictEqual(secondResponse.status, 200);
			t.assert.deepStrictEqual<string[]>(secondTitles, ["Paged Todo 11"]);
		} finally {
			await cleanup();
		}
	});

	it("rejects invalid todo pagination and sorting", async (t: TestContext) => {
		const { port, cleanup } = await setupServer();
		try {
			const invalidPage = await fetch(`http://localhost:${port}/todos?page=0`, {
				signal: t.signal,
			});
			const invalidSort = await fetch(
				`http://localhost:${port}/todos?sort=unknown`,
				{ signal: t.signal },
			);

			t.assert.deepStrictEqual(invalidPage.status, 404);
			t.assert.deepStrictEqual(invalidSort.status, 404);
		} finally {
			await cleanup();
		}
	});

	for (const dueAt of ["2026-02-30", "09/20/2026"]) {
		it(`POST /todos rejects invalid calendar date ${dueAt} without inserting`, async (t: TestContext) => {
			const { cleanup, db, port } = await setupServer();
			try {
				const before = await db("todos").orderBy("id").select("*");

				const response = await fetch(`http://localhost:${port}/todos`, {
					body: new URLSearchParams({
						dueAt,
						title: "Rejected calendar fixture",
					}),
					headers: { "Content-Type": "application/x-www-form-urlencoded" },
					method: "POST",
					redirect: "manual",
					signal: t.signal,
				});
				const html = await response.text();
				const after = await db("todos").orderBy("id").select("*");

				t.assert.deepStrictEqual<number>(response.status, 200);
				t.assert.match(html, /Invalid date/);
				t.assert.deepStrictEqual(response.headers.get("Location"), null);
				t.assert.deepStrictEqual(after, before);
			} finally {
				await cleanup();
			}
		});

		it(`PATCH /todos/:id rejects invalid calendar date ${dueAt} without updating`, async (t: TestContext) => {
			const { cleanup, db, port } = await setupServer();
			try {
				const todo = await createTodo({
					dueAt: "2024-02-29",
					port,
					signal: t.signal,
					title: "Unchanged calendar fixture",
				});
				const before = await db("todos").where({ id: todo.id }).select("*");

				const response = await fetch(
					`http://localhost:${port}/todos/${todo.id}`,
					{
						body: new URLSearchParams({
							_method: "PATCH",
							dueAt,
							statusCode: "completed",
							title: "Should not replace fixture",
						}),
						headers: { "Content-Type": "application/x-www-form-urlencoded" },
						method: "POST",
						redirect: "manual",
						signal: t.signal,
					},
				);
				const html = await response.text();
				const after = await db("todos").where({ id: todo.id }).select("*");

				t.assert.deepStrictEqual<number>(response.status, 200);
				t.assert.match(html, /Invalid date/);
				t.assert.deepStrictEqual(response.headers.get("Location"), null);
				t.assert.deepStrictEqual(after, before);
			} finally {
				await cleanup();
			}
		});
	}

	it("creates and updates valid leap-day due dates that round-trip through the edit form", async (t: TestContext) => {
		const { cleanup, db, port } = await setupServer();
		try {
			const todo = await createTodo({
				dueAt: "2024-02-29",
				port,
				signal: t.signal,
				title: "Leap-day fixture",
			});
			const createdRows = await db("todos")
				.where({ id: todo.id })
				.select("due_at");
			const initialEdit = await fetch(
				`http://localhost:${port}/todos/${todo.id}/edit`,
				{ signal: t.signal },
			);
			const initialDocument = load(await initialEdit.text());

			const response = await fetch(
				`http://localhost:${port}/todos/${todo.id}`,
				{
					body: new URLSearchParams({
						_method: "PATCH",
						dueAt: "2028-02-29",
						statusCode: "open",
						title: "Leap-day fixture",
					}),
					headers: { "Content-Type": "application/x-www-form-urlencoded" },
					method: "POST",
					redirect: "manual",
					signal: t.signal,
				},
			);
			const rows = await db("todos").where({ id: todo.id }).select("due_at");
			const edit = await fetch(
				`http://localhost:${port}/todos/${todo.id}/edit`,
				{ signal: t.signal },
			);
			const document = load(await edit.text());

			t.assert.deepStrictEqual(createdRows, [{ due_at: "2024-02-29" }]);
			t.assert.deepStrictEqual(
				initialDocument('input[name="dueAt"]').attr("value"),
				"2024-02-29",
			);
			t.assert.deepStrictEqual<number>(response.status, 302);
			t.assert.deepStrictEqual(rows, [{ due_at: "2028-02-29" }]);
			t.assert.deepStrictEqual(
				document('input[name="dueAt"]').attr("value"),
				"2028-02-29",
			);
		} finally {
			await cleanup();
		}
	});

	it("GET /todos/create renders the new todo form", async (t: TestContext) => {
		t.plan(3);
		const { port, cleanup } = await setupServer();
		try {
			const res = await fetch(`http://localhost:${port}/todos/create`, {
				signal: t.signal,
			});
			const html = await res.text();

			t.assert.deepStrictEqual<number>(res.status, 200);
			t.assert.match(html, /New Todo/);
			t.assert.match(html, /<form action="\/todos" method="POST">/);
		} finally {
			await cleanup();
		}
	});

	it("POST /todos trims input before persistence", async (t: TestContext) => {
		const { cleanup, db, port } = await setupServer();
		try {
			const before = await db("todos").orderBy("id").select("title");

			const response = await fetch(`http://localhost:${port}/todos`, {
				body: new URLSearchParams({ title: "  Trimmed store fixture  " }),
				headers: { "Content-Type": "application/x-www-form-urlencoded" },
				method: "POST",
				redirect: "manual",
				signal: t.signal,
			});
			const after = await db("todos").orderBy("id").select("title");

			t.assert.deepStrictEqual<number>(response.status, 302);
			t.assert.deepStrictEqual(after, [
				...before,
				{ title: "Trimmed store fixture" },
			]);
		} finally {
			await cleanup();
		}
	});

	it("POST /todos rolls back a failing insert and preserves its error response", async (t: TestContext) => {
		const { cleanup, db, port } = await setupServer();
		try {
			const before = await db("todos").orderBy("id").select("*");
			await db.raw(
				"CREATE TRIGGER fail_store AFTER INSERT ON todos BEGIN SELECT RAISE(FAIL, 'store fixture'); END;",
			);

			const response = await fetch(`http://localhost:${port}/todos`, {
				body: new URLSearchParams({ title: "Rejected store fixture" }),
				headers: { "Content-Type": "application/x-www-form-urlencoded" },
				method: "POST",
				redirect: "manual",
				signal: t.signal,
			});
			const html = await response.text();
			const after = await db("todos").orderBy("id").select("*");

			t.assert.deepStrictEqual<number>(response.status, 500);
			t.assert.deepStrictEqual<string | null>(
				response.headers.get("Location"),
				null,
			);
			t.assert.deepStrictEqual(after, before);
			t.assert.match(html, /Error|store fixture/);
		} finally {
			await cleanup();
		}
	});

	it("POST /todos with missing title shows errors", async (t: TestContext) => {
		t.plan(1);
		const { port, cleanup } = await setupServer();
		try {
			const res = await fetch(`http://localhost:${port}/todos`, {
				body: "title=",
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
				},
				method: "POST",
				signal: t.signal,
			});

			const html = await res.text();
			t.assert.match(html, /Required/i);
		} finally {
			await cleanup();
		}
	});

	it("POST /todos reports title errors before date errors without writing", async (t: TestContext) => {
		const { cleanup, db, port } = await setupServer();
		try {
			const before = await db("todos").orderBy("id").select("*");

			const response = await fetch(`http://localhost:${port}/todos`, {
				body: new URLSearchParams({ dueAt: "2026-02-30", title: "  " }),
				headers: { "Content-Type": "application/x-www-form-urlencoded" },
				method: "POST",
				redirect: "manual",
				signal: t.signal,
			});
			const html = await response.text();
			const after = await db("todos").orderBy("id").select("*");

			t.assert.deepStrictEqual<number>(response.status, 200);
			t.assert.match(html, /Required/);
			t.assert.doesNotMatch(html, /Invalid date/);
			t.assert.deepStrictEqual(after, before);
		} finally {
			await cleanup();
		}
	});

	it("POST /todos with a valid title redirects and persists the todo", async (t: TestContext) => {
		t.plan(5);
		const { port, cleanup, db } = await setupServer();
		try {
			const { id, location } = await createTodo({
				port,
				signal: t.signal,
				title: "PersistedTitle",
			});

			const res = await fetch(`http://localhost:${port}/todos/${id}`, {
				signal: t.signal,
			});
			const html = await res.text();
			const rows = await db("todos")
				.join("todo_priorities", "todos.priority_id", "todo_priorities.id")
				.join("todo_statuses", "todos.status_id", "todo_statuses.id")
				.where("todos.id", id)
				.select(
					"todos.title",
					"todos.description",
					"todos.due_at",
					"todos.completed_at",
					"todos.project_id",
					"todo_priorities.code as priorityCode",
					"todo_statuses.code as statusCode",
				);

			t.assert.deepStrictEqual(rows, [
				{
					completed_at: null,
					description: "",
					due_at: null,
					priorityCode: "medium",
					project_id: null,
					statusCode: "open",
					title: "PersistedTitle",
				},
			]);
			t.assert.deepStrictEqual(location, `/todos/${id}`);
			t.assert.deepStrictEqual<number>(res.status, 200);
			t.assert.match(html, /PersistedTitle/);
			t.assert.match(html, new RegExp(`Todo \\| ${id}`));
		} finally {
			await cleanup();
		}
	});

	it("POST /todos with a due date persists and shows the due date", async (t: TestContext) => {
		const { port, cleanup } = await setupServer();
		try {
			const createResponse = await fetch(`http://localhost:${port}/todos`, {
				body: new URLSearchParams({
					dueAt: "2026-09-20",
					title: "Dated Todo",
				}),
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
				},
				method: "POST",
				redirect: "manual",
				signal: t.signal,
			});
			const location = createResponse.headers.get("Location");
			t.assert.ok(location);

			const showResponse = await fetch(`http://localhost:${port}${location}`, {
				signal: t.signal,
			});
			const html = await showResponse.text();

			t.assert.deepStrictEqual<number>(showResponse.status, 200);
			t.assert.match(html, /2026-09-20/);
		} finally {
			await cleanup();
		}
	});

	it("GET /todos/:id with missing todo returns 404", async (t: TestContext) => {
		t.plan(2);
		const { port, cleanup } = await setupServer();
		try {
			await createTodo({
				port,
				signal: t.signal,
				title: "Unrelated show sentinel",
			});

			const res = await fetch(`http://localhost:${port}/todos/99999`, {
				signal: t.signal,
			});
			t.assert.deepStrictEqual<number>(res.status, 404);

			const body = await res.text();
			t.assert.match(body, /not found|error|unknown/i);
		} finally {
			await cleanup();
		}
	});

	it("GET /todos/:id with an invalid id returns 404", async (t: TestContext) => {
		t.plan(1);
		const { port, cleanup } = await setupServer();
		try {
			const res = await fetch(`http://localhost:${port}/todos/not-a-number`, {
				signal: t.signal,
			});
			t.assert.deepStrictEqual<number>(res.status, 404);
		} finally {
			await cleanup();
		}
	});

	it("POST /todos with invalid dueAt shows errors", async (t: TestContext) => {
		t.plan(2);
		const { port, cleanup } = await setupServer();
		try {
			const res = await fetch(`http://localhost:${port}/todos`, {
				body: "title=HasDate&dueAt=not-a-date",
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
				},
				method: "POST",
				signal: t.signal,
			});

			const html = await res.text();
			t.assert.deepStrictEqual<number>(res.status, 200);
			t.assert.match(html, /Invalid date/i);
		} finally {
			await cleanup();
		}
	});

	it("GET /todos/:id rejects malformed stored todo data", async (t: TestContext) => {
		const { cleanup, db, port } = await setupServer();
		try {
			const todo = await createTodo({
				port,
				signal: t.signal,
				title: "Malformed show fixture",
			});
			const row = await db("todos").where({ id: todo.id }).first("status_id");
			await db("todo_statuses")
				.where({ id: row.status_id })
				.update({ code: "unexpected" });

			const response = await fetch(
				`http://localhost:${port}/todos/${todo.id}`,
				{ signal: t.signal },
			);

			t.assert.deepStrictEqual<number>(response.status, 500);
		} finally {
			await cleanup();
		}
	});

	it("renders todo details with actual data", async (t: TestContext) => {
		t.plan(4);
		const { port, cleanup } = await setupServer();
		try {
			await createTodo({
				port,
				signal: t.signal,
				title: "Unrelated show sentinel",
			});

			const createRes = await fetch(`http://localhost:${port}/todos`, {
				body: "title=SomeTitle",
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
				},
				method: "POST",
				redirect: "manual",
				signal: t.signal,
			});

			const location = createRes.headers.get("Location");
			t.assert.ok(location, "Location header should be present");
			const todoId = location.split("/").pop();

			const res = await fetch(`http://localhost:${port}/todos/${todoId}`, {
				signal: t.signal,
			});
			const html = await res.text();

			t.assert.match(html, /SomeTitle/);
			t.assert.doesNotMatch(html, /Unrelated show sentinel/);
			t.assert.match(html, new RegExp(`Todo \\| ${todoId}`));
		} finally {
			await cleanup();
		}
	});

	it("POST /todos/:id with _method=PATCH updates the todo", async (t: TestContext) => {
		t.plan(6);
		const { port, cleanup, db } = await setupServer();
		try {
			const createRes = await fetch(`http://localhost:${port}/todos`, {
				body: "title=Before",
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
				},
				method: "POST",
				redirect: "manual",
				signal: t.signal,
			});
			const todoId = createRes.headers.get("Location")?.split("/").pop();
			t.assert.ok(todoId, "Location header should include the todo id");

			const updateRes = await fetch(
				`http://localhost:${port}/todos/${todoId}`,
				{
					body: "_method=PATCH&title=After&description=&priority=medium&statusCode=open&dueAt=",
					headers: {
						"Content-Type": "application/x-www-form-urlencoded",
					},
					method: "POST",
					redirect: "manual",
					signal: t.signal,
				},
			);
			const showRes = await fetch(`http://localhost:${port}/todos/${todoId}`, {
				signal: t.signal,
			});
			const html = await showRes.text();

			const rows = await db("todos").where({ id: todoId }).select("title");

			t.assert.deepStrictEqual(rows, [{ title: "After" }]);
			t.assert.deepStrictEqual(updateRes.status, 302);
			t.assert.deepStrictEqual<number>(showRes.status, 200);
			t.assert.match(html, /\bAfter\b/);
			t.assert.deepStrictEqual(
				updateRes.headers.get("Location"),
				`/todos/${todoId}`,
			);
		} finally {
			await cleanup();
		}
	});

	it("POST /todos/:id with _method=PATCH updates the due date", async (t: TestContext) => {
		const { port, cleanup } = await setupServer();
		try {
			const { id } = await createTodo({
				dueAt: "2026-09-21",
				port,
				signal: t.signal,
				title: "Rescheduled Todo",
			});

			const updateResponse = await fetch(
				`http://localhost:${port}/todos/${id}`,
				{
					body: new URLSearchParams({
						_method: "PATCH",
						dueAt: "2026-09-22",
						statusCode: "open",
						title: "Rescheduled Todo",
					}),
					headers: {
						"Content-Type": "application/x-www-form-urlencoded",
					},
					method: "POST",
					redirect: "manual",
					signal: t.signal,
				},
			);
			const showResponse = await fetch(`http://localhost:${port}/todos/${id}`, {
				signal: t.signal,
			});
			const html = await showResponse.text();

			t.assert.deepStrictEqual<number>(updateResponse.status, 302);
			t.assert.match(html, /2026-09-22/);
			t.assert.doesNotMatch(html, /2026-09-21/);
		} finally {
			await cleanup();
		}
	});

	it("GET /todos/:id/edit renders the edit form with existing data", async (t: TestContext) => {
		t.plan(4);
		const { port, cleanup } = await setupServer();
		try {
			const { id } = await createTodo({
				port,
				signal: t.signal,
				title: "ExistingTitle",
			});

			const res = await fetch(`http://localhost:${port}/todos/${id}/edit`, {
				signal: t.signal,
			});
			const html = await res.text();

			t.assert.deepStrictEqual<number>(res.status, 200);
			t.assert.match(html, new RegExp(`Edit Todo #${id}`));
			t.assert.match(html, /value="ExistingTitle"/);
			t.assert.match(html, /<option value="open" selected>Open<\/option>/);
		} finally {
			await cleanup();
		}
	});

	it("GET /todos/:id/edit renders the existing due date", async (t: TestContext) => {
		const { port, cleanup } = await setupServer();
		try {
			const { id } = await createTodo({
				dueAt: "2026-09-21",
				port,
				signal: t.signal,
				title: "Existing Due Date",
			});

			const response = await fetch(
				`http://localhost:${port}/todos/${id}/edit`,
				{ signal: t.signal },
			);
			const html = await response.text();

			t.assert.deepStrictEqual<number>(response.status, 200);
			t.assert.match(html, /name="dueAt"[^>]*value="2026-09-21"/);
		} finally {
			await cleanup();
		}
	});

	it("GET /todos/:id/edit selects the completed status for a completed todo", async (t: TestContext) => {
		const { cleanup, db, port } = await setupServer();
		try {
			const { id } = await createTodo({
				port,
				signal: t.signal,
				title: "Completed edit fixture",
			});
			const status = await db("todo_statuses")
				.where({ code: "completed" })
				.first("id");
			await db("todos").where({ id }).update({ status_id: status.id });

			const response = await fetch(
				`http://localhost:${port}/todos/${id}/edit`,
				{
					signal: t.signal,
				},
			);
			const html = await response.text();

			t.assert.deepStrictEqual<number>(response.status, 200);
			t.assert.match(
				html,
				/<option value="completed" selected>Completed<\/option>/,
			);
		} finally {
			await cleanup();
		}
	});

	it("GET /todos/:id/edit returns 404 for an invalid id", async (t: TestContext) => {
		t.plan(1);
		const { port, cleanup } = await setupServer();
		try {
			const res = await fetch(
				`http://localhost:${port}/todos/not-a-number/edit`,
				{
					signal: t.signal,
				},
			);

			t.assert.deepStrictEqual<number>(res.status, 404);
		} finally {
			await cleanup();
		}
	});

	it("GET /todos/:id/edit returns 404 for a missing todo", async (t: TestContext) => {
		t.plan(1);
		const { port, cleanup } = await setupServer();
		try {
			const res = await fetch(`http://localhost:${port}/todos/99999/edit`, {
				signal: t.signal,
			});

			t.assert.deepStrictEqual<number>(res.status, 404);
		} finally {
			await cleanup();
		}
	});

	it("POST /todos/:id with _method=PATCH and empty title renders edit errors", async (t: TestContext) => {
		t.plan(3);
		const { port, cleanup } = await setupServer();
		try {
			const { id } = await createTodo({
				port,
				signal: t.signal,
				title: "NeedsValidation",
			});

			const res = await fetch(`http://localhost:${port}/todos/${id}`, {
				body: new URLSearchParams({
					_method: "PATCH",
					statusCode: "open",
					title: "",
				}),
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
				},
				method: "POST",
				signal: t.signal,
			});
			const html = await res.text();

			t.assert.deepStrictEqual<number>(res.status, 200);
			t.assert.match(html, /Required/);
			t.assert.match(html, new RegExp(`Edit Todo #${id}`));
		} finally {
			await cleanup();
		}
	});

	it("POST /todos/:id with _method=PATCH and invalid due date renders edit errors", async (t: TestContext) => {
		const { port, cleanup } = await setupServer();
		try {
			const { id } = await createTodo({
				port,
				signal: t.signal,
				title: "Invalid Due Date",
			});

			const response = await fetch(`http://localhost:${port}/todos/${id}`, {
				body: new URLSearchParams({
					_method: "PATCH",
					dueAt: "not-a-date",
					statusCode: "open",
					title: "Invalid Due Date",
				}),
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
				},
				method: "POST",
				signal: t.signal,
			});
			const html = await response.text();

			t.assert.deepStrictEqual<number>(response.status, 200);
			t.assert.match(html, /Invalid date/);
		} finally {
			await cleanup();
		}
	});

	it("POST /todos/:id with _method=PATCH marks the todo completed", async (t: TestContext) => {
		t.plan(4);
		const { port, cleanup } = await setupServer();
		try {
			const { id } = await createTodo({
				port,
				signal: t.signal,
				title: "CompleteFromIntegration",
			});

			const updateRes = await fetch(`http://localhost:${port}/todos/${id}`, {
				body: new URLSearchParams({
					_method: "PATCH",
					statusCode: "completed",
					title: "CompleteFromIntegration",
				}),
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
				},
				method: "POST",
				redirect: "manual",
				signal: t.signal,
			});
			const showRes = await fetch(`http://localhost:${port}/todos/${id}`, {
				signal: t.signal,
			});
			const html = await showRes.text();

			t.assert.deepStrictEqual<number>(updateRes.status, 302);
			t.assert.deepStrictEqual(
				updateRes.headers.get("Location"),
				`/todos/${id}`,
			);
			t.assert.deepStrictEqual<number>(showRes.status, 200);
			t.assert.match(html, /completed/);
		} finally {
			await cleanup();
		}
	});

	it("POST /todos/:id with _method=PATCH clears completed state", async (t: TestContext) => {
		t.plan(8);
		const { port, cleanup, db } = await setupServer();
		try {
			const { id } = await createTodo({
				port,
				signal: t.signal,
				title: "Lifecycle fixture",
			});

			await fetch(`http://localhost:${port}/todos/${id}`, {
				body: new URLSearchParams({
					_method: "PATCH",
					statusCode: "completed",
					title: "Lifecycle fixture",
				}),
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
				},
				method: "POST",
				redirect: "manual",
				signal: t.signal,
			});
			const completedRes = await fetch(`http://localhost:${port}/todos/${id}`, {
				signal: t.signal,
			});
			const completedHtml = await completedRes.text();
			const completedRow = await db("todos")
				.where({ id })
				.first("completed_at");
			t.assert.deepStrictEqual<number>(completedRes.status, 200);
			t.assert.match(completedHtml, /\bcompleted\b/);
			t.assert.ok(completedRow.completed_at);
			const originalCompletion = "2020-01-02T03:04:05.000Z";
			await db("todos")
				.where({ id })
				.update({ completed_at: originalCompletion });

			await fetch(`http://localhost:${port}/todos/${id}`, {
				body: new URLSearchParams({
					_method: "PATCH",
					statusCode: "completed",
					title: "Lifecycle fixture",
				}),
				headers: { "Content-Type": "application/x-www-form-urlencoded" },
				method: "POST",
				redirect: "manual",
				signal: t.signal,
			});
			const completedAgain = await db("todos")
				.where({ id })
				.first("completed_at");
			t.assert.deepStrictEqual(completedAgain.completed_at, originalCompletion);

			const reopenRes = await fetch(`http://localhost:${port}/todos/${id}`, {
				body: new URLSearchParams({
					_method: "PATCH",
					statusCode: "open",
					title: "Lifecycle fixture",
				}),
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
				},
				method: "POST",
				redirect: "manual",
				signal: t.signal,
			});
			const showRes = await fetch(`http://localhost:${port}/todos/${id}`, {
				signal: t.signal,
			});
			const html = await showRes.text();
			const reopenedRow = await db("todos").where({ id }).first("completed_at");

			t.assert.deepStrictEqual<number>(reopenRes.status, 302);
			t.assert.deepStrictEqual<number>(showRes.status, 200);
			t.assert.match(html, /\bopen\b/);
			t.assert.deepStrictEqual(reopenedRow.completed_at, null);
		} finally {
			await cleanup();
		}
	});

	it("POST /todos/:id with _method=PATCH returns 404 for an invalid id", async (t: TestContext) => {
		t.plan(1);
		const { port, cleanup } = await setupServer();
		try {
			const res = await fetch(`http://localhost:${port}/todos/not-a-number`, {
				body: new URLSearchParams({
					_method: "PATCH",
					statusCode: "open",
					title: "Invalid",
				}),
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
				},
				method: "POST",
				signal: t.signal,
			});

			t.assert.deepStrictEqual<number>(res.status, 404);
		} finally {
			await cleanup();
		}
	});

	it("POST /todos/:id with _method=PATCH returns 404 for a missing todo", async (t: TestContext) => {
		t.plan(1);
		const { port, cleanup } = await setupServer();
		try {
			const res = await fetch(`http://localhost:${port}/todos/99999`, {
				body: new URLSearchParams({
					_method: "PATCH",
					statusCode: "open",
					title: "Missing",
				}),
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
				},
				method: "POST",
				signal: t.signal,
			});

			t.assert.deepStrictEqual<number>(res.status, 404);
		} finally {
			await cleanup();
		}
	});

	it("POST /todos/:id with _method=DELETE destroys the todo", async (t: TestContext) => {
		t.plan(3);
		const { port, cleanup } = await setupServer();
		try {
			const createRes = await fetch(`http://localhost:${port}/todos`, {
				body: "title=DeleteMe",
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
				},
				method: "POST",
				redirect: "manual",
				signal: t.signal,
			});
			const todoId = createRes.headers.get("Location")?.split("/").pop();
			t.assert.ok(todoId, "Location header should include the todo id");

			const deleteRes = await fetch(
				`http://localhost:${port}/todos/${todoId}`,
				{
					body: "_method=DELETE",
					headers: {
						"Content-Type": "application/x-www-form-urlencoded",
					},
					method: "POST",
					redirect: "manual",
					signal: t.signal,
				},
			);

			const showRes = await fetch(`http://localhost:${port}/todos/${todoId}`, {
				signal: t.signal,
			});
			t.assert.deepStrictEqual(deleteRes.headers.get("Location"), "/todos");
			t.assert.deepStrictEqual(showRes.status, 404);
		} finally {
			await cleanup();
		}
	});

	it("POST /todos/:id with _method=DELETE returns 404 for an invalid id", async (t: TestContext) => {
		t.plan(1);
		const { port, cleanup } = await setupServer();
		try {
			const res = await fetch(`http://localhost:${port}/todos/not-a-number`, {
				body: "_method=DELETE",
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
				},
				method: "POST",
				signal: t.signal,
			});

			t.assert.deepStrictEqual<number>(res.status, 404);
		} finally {
			await cleanup();
		}
	});

	it("POST /todos/:id with _method=DELETE returns 404 for a missing todo", async (t: TestContext) => {
		t.plan(1);
		const { port, cleanup } = await setupServer();
		try {
			const res = await fetch(`http://localhost:${port}/todos/99999`, {
				body: "_method=DELETE",
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
				},
				method: "POST",
				signal: t.signal,
			});

			t.assert.deepStrictEqual<number>(res.status, 404);
		} finally {
			await cleanup();
		}
	});

	it("POST /todos/:id with unsupported _method does not route", async (t: TestContext) => {
		t.plan(1);
		const { port, cleanup } = await setupServer();
		try {
			const res = await fetch(`http://localhost:${port}/todos/1`, {
				body: "_method=PUT&title=Nope",
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
				},
				method: "POST",
				signal: t.signal,
			});

			t.assert.deepStrictEqual(res.status, 404);
		} finally {
			await cleanup();
		}
	});
});
