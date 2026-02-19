import { describe, it, type TestContext } from "node:test";
import { testDatabase } from "@scream.js/database/test-helpers.js";
import { createExpressApp } from "@scream.js/http/express/create-express-application.js";
import { startTestServer } from "@scream.js/http/server.js";
import { createHttpApp } from "../../../main.js";
import { createTodoModule } from "./index.js";

describe("todo controller", { concurrency: false }, () => {
	const setupServer = async () => {
		const { db, cleanup: cleanupDb } = await testDatabase.setup({ seed: true });
		const { todosController } = createTodoModule({ db });

		const app = createExpressApp();
		createHttpApp({ app, todosController });

		const { port, shutdown } = await startTestServer(app);

		const cleanup = async () => {
			await shutdown();
			await cleanupDb();
		};

		return { cleanup, port };
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

	it("POST /todos/create with missing title shows errors", async (t: TestContext) => {
		t.plan(1);
		const { port, cleanup } = await setupServer();
		try {
			const res = await fetch(`http://localhost:${port}/todos/create`, {
				body: "title=",
				headers: { "Content-Type": "application/x-www-form-urlencoded" },
				method: "POST",
				signal: t.signal,
			});

			const html = await res.text();
			t.assert.match(html, /Required/i);
		} finally {
			await cleanup();
		}
	});

	it("POST /todos/:id with missing todo returns 404", async (t: TestContext) => {
		t.plan(2);
		const { port, cleanup } = await setupServer();
		try {
			const res = await fetch(`http://localhost:${port}/todos/99999`, {
				body: "title=SomeTitle",
				headers: { "Content-Type": "application/x-www-form-urlencoded" },
				method: "POST",
				signal: t.signal,
			});
			t.assert.deepStrictEqual<number>(res.status, 404);

			const body = await res.text();
			t.assert.match(body, /not found|error|unknown/i);
		} finally {
			await cleanup();
		}
	});

	it("renders todo details with actual data", async (t: TestContext) => {
		t.plan(3);
		const { port, cleanup } = await setupServer();
		try {
			const createRes = await fetch(`http://localhost:${port}/todos/create`, {
				body: "title=SomeTitle",
				headers: { "Content-Type": "application/x-www-form-urlencoded" },
				method: "POST",
				redirect: "manual",
				signal: t.signal,
			});

			const location = createRes.headers.get("Location");
			t.assert.ok(location, "Location header should be present");
			const todoId = location.split("/").pop();

			const res = await fetch(`http://localhost:${port}/todos/${todoId}`);
			const html = await res.text();

			t.assert.match(html, /SomeTitle/);
			t.assert.match(html, new RegExp(`Todo \\| ${todoId}`));
		} finally {
			await cleanup();
		}
	});
});
