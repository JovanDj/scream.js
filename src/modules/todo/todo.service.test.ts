import { describe, it, type TestContext } from "node:test";
import { testDatabase } from "@scream.js/database/test-helpers.js";
import { TodoService } from "./todo.service.js";

if (!process.env["NODE_ENV"]) {
	process.env["NODE_ENV"] = "integration";
}

describe("TodoService", { concurrency: false }, () => {
	const setupService = async () => {
		const { cleanup, db } = await testDatabase.setup({
			prepare: async (database) => {
				await database("users").insert({ username: "test user" });
			},
		});

		return { cleanup, service: new TodoService(db) };
	};

	it("should create a todo and return it with persisted fields", async (t: TestContext) => {
		const { cleanup, service } = await setupService();
		try {
			const created = await service.create({
				completed: false,
				title: "Test Todo",
			});

			t.assert.deepStrictEqual(created.id, 1);
			t.assert.deepStrictEqual(created.title, "Test Todo");
			t.assert.deepStrictEqual(created.completed, false);
			t.assert.deepStrictEqual(created.userId, 1);
		} finally {
			await cleanup();
		}
	});

	it("should return an empty list for findAll when no todos exist", async (t: TestContext) => {
		const { cleanup, service } = await setupService();
		try {
			const initial = await service.findAll();
			t.assert.deepStrictEqual(initial, []);
		} finally {
			await cleanup();
		}
	});

	it("should return all todos for findAll after creating todos", async (t: TestContext) => {
		const { cleanup, service } = await setupService();
		try {
			await service.create({
				completed: false,
				title: "First",
			});
			await service.create({
				completed: true,
				title: "Second",
			});

			const listed = await service.findAll();
			t.assert.deepStrictEqual(listed.length, 2);
			t.assert.deepStrictEqual(listed[0]?.id, 1);
			t.assert.deepStrictEqual(listed[0]?.title, "First");
			t.assert.deepStrictEqual(listed[0]?.completed, false);
			t.assert.deepStrictEqual(listed[0]?.userId, 1);
			t.assert.deepStrictEqual(listed[1]?.id, 2);
			t.assert.deepStrictEqual(listed[1]?.title, "Second");
			t.assert.deepStrictEqual(listed[1]?.completed, true);
			t.assert.deepStrictEqual(listed[1]?.userId, 1);
		} finally {
			await cleanup();
		}
	});

	it("should return a todo for findById when it exists", async (t: TestContext) => {
		const { cleanup, service } = await setupService();
		try {
			const created = await service.create({
				completed: false,
				title: "Find Me",
			});

			t.assert.deepStrictEqual(created.id, 1);

			const found = await service.findById(1);
			t.assert.deepStrictEqual(found?.id, 1);
			t.assert.deepStrictEqual(found?.title, "Find Me");
			t.assert.deepStrictEqual(found?.completed, false);
			t.assert.deepStrictEqual(found?.userId, 1);
		} finally {
			await cleanup();
		}
	});

	it("should return undefined for findById when it does not exist", async (t: TestContext) => {
		const { cleanup, service } = await setupService();
		try {
			const found = await service.findById(999_999);
			t.assert.deepStrictEqual(found, undefined);
		} finally {
			await cleanup();
		}
	});

	it("should update and return the todo when it exists", async (t: TestContext) => {
		const { cleanup, service } = await setupService();
		try {
			const created = await service.create({
				completed: false,
				title: "Original",
			});
			t.assert.deepStrictEqual(created.id, 1);

			const updated = await service.update(1, {
				completed: true,
				title: "Updated",
			});

			t.assert.deepStrictEqual(updated?.id, 1);
			t.assert.deepStrictEqual(updated?.title, "Updated");
			t.assert.deepStrictEqual(updated?.completed, true);
			t.assert.deepStrictEqual(updated?.userId, 1);
		} finally {
			await cleanup();
		}
	});

	it("should return undefined for update when the todo does not exist", async (t: TestContext) => {
		const { cleanup, service } = await setupService();
		try {
			const updated = await service.update(999_999, {
				completed: true,
				title: "Updated",
			});

			t.assert.deepStrictEqual(updated, undefined);
		} finally {
			await cleanup();
		}
	});

	it("should delete and return true when the todo exists", async (t: TestContext) => {
		const { cleanup, service } = await setupService();
		try {
			const created = await service.create({
				completed: false,
				title: "Delete Me",
			});
			t.assert.deepStrictEqual(created.id, 1);

			const deleted = await service.delete(1);
			const found = await service.findById(1);

			t.assert.deepStrictEqual(deleted, true);
			t.assert.deepStrictEqual(found, undefined);
		} finally {
			await cleanup();
		}
	});

	it("should return false for delete when the todo does not exist", async (t: TestContext) => {
		const { cleanup, service } = await setupService();
		try {
			const deleted = await service.delete(999_999);
			t.assert.deepStrictEqual(deleted, false);
		} finally {
			await cleanup();
		}
	});
});
