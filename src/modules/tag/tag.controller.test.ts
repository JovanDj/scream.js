import { describe, it, type TestContext } from "node:test";
import { createTagHttpFixture } from "./tag.test-fixture.js";

describe("tag controller", { concurrency: true }, () => {
	const setupServer = async () => createTagHttpFixture();

	it("GET /tags lists tags", async (t: TestContext) => {
		const { cleanup, modules, port } = await setupServer();
		try {
			await modules.tagService.create({ name: "alpha" });
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
		const { cleanup, modules, port } = await setupServer();
		try {
			await modules.tagService.create({ name: "alpha" });
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
		const { cleanup, modules, port } = await setupServer();
		try {
			const todo = await modules.todoService.create({
				description: "",
				dueAt: null,
				priority: "medium",
				projectId: null,
				statusCode: "open",
				title: "Todo",
			});
			const tag = await modules.tagService.create({ name: "alpha" });

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
		const { cleanup, modules, port } = await setupServer();
		try {
			const tag = await modules.tagService.create({ name: "alpha" });
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
		const { cleanup, modules, port } = await setupServer();
		try {
			const todo = await modules.todoService.create({
				description: "",
				dueAt: null,
				priority: "medium",
				projectId: null,
				statusCode: "open",
				title: "Todo",
			});
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
