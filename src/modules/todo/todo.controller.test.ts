import { describe, it, type TestContext } from "node:test";
import { databaseTestFixture } from "@scream.js/database/test-helpers.js";
import { ExpressApp } from "@scream.js/http/express/express-application.js";
import { HttpServer } from "@scream.js/http/server.js";
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

		return { cleanup, port: httpServer.port };
	};

	it("GET / responds with 200", async (t: TestContext) => {
		t.plan(1);
		const { port, cleanup } = await setupServer();
		try {
			const res = await fetch(`http://localhost:${port}/`, {
				signal: t.signal,
			});
			t.assert.deepStrictEqual<number>(res.status, 200);
		} finally {
			await cleanup();
		}
	});

	it("GET /about responds with 200", async (t: TestContext) => {
		t.plan(1);
		const { port, cleanup } = await setupServer();
		try {
			const res = await fetch(`http://localhost:${port}/about`, {
				signal: t.signal,
			});
			t.assert.deepStrictEqual<number>(res.status, 200);
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
		t.plan(1);
		const { port, cleanup } = await setupServer();
		try {
			const res = await fetch(`http://localhost:${port}/todos?status=open`, {
				signal: t.signal,
			});
			t.assert.deepStrictEqual<number>(res.status, 200);
		} finally {
			await cleanup();
		}
	});

	it("GET /todos?status=completed returns 200", async (t: TestContext) => {
		t.plan(1);
		const { port, cleanup } = await setupServer();
		try {
			const res = await fetch(
				`http://localhost:${port}/todos?status=completed`,
				{
					signal: t.signal,
				},
			);
			t.assert.deepStrictEqual<number>(res.status, 200);
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
		t.plan(3);
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
			t.assert.match(html, /href="\/todos\?status=completed&amp;search=milk"/);
			t.assert.match(html, /href="\/todos\?search=milk"/);
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

	it("GET /todos/:id with missing todo returns 404", async (t: TestContext) => {
		t.plan(2);
		const { port, cleanup } = await setupServer();
		try {
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

	it("renders todo details with actual data", async (t: TestContext) => {
		t.plan(3);
		const { port, cleanup } = await setupServer();
		try {
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
			t.assert.match(html, new RegExp(`Todo \\| ${todoId}`));
		} finally {
			await cleanup();
		}
	});

	it("POST /todos/:id with _method=PATCH updates the todo", async (t: TestContext) => {
		t.plan(3);
		const { port, cleanup } = await setupServer();
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

			t.assert.deepStrictEqual(updateRes.status, 302);
			t.assert.deepStrictEqual(
				updateRes.headers.get("Location"),
				`/todos/${todoId}`,
			);
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
