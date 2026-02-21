import { describe, it, type TestContext } from "node:test";
import { testDatabase } from "@scream.js/database/test-helpers.js";
import { TodoService } from "./todo.service.js";

if (!process.env["NODE_ENV"]) {
	process.env["NODE_ENV"] = "integration";
}

describe("TodoService", { concurrency: false }, () => {
	const setupService = async () => {
		const { cleanup, db } = await testDatabase.setup({});

		return { cleanup, service: new TodoService(db) };
	};

	it("should create a todo and return it with persisted fields", async (t: TestContext) => {
		const { cleanup, service } = await setupService();
		try {
			const created = await service.create({
				description: "",
				dueAt: null,
				priority: "medium",
				projectId: null,
				statusCode: "open",
				title: "Test Todo",
			});

			t.assert.deepStrictEqual(created?.id, 1);
			t.assert.deepStrictEqual(created?.title, "Test Todo");
			t.assert.deepStrictEqual(created?.statusCode, "open");
			t.assert.deepStrictEqual(created?.description, "");
			t.assert.deepStrictEqual(created?.priority, "medium");
			t.assert.deepStrictEqual(created?.dueAt, null);
			t.assert.deepStrictEqual(created?.projectId, null);
			t.assert.deepStrictEqual(created?.version, 0);
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
				description: "",
				dueAt: null,
				priority: "low",
				projectId: null,
				statusCode: "open",
				title: "First",
			});
			await service.create({
				description: "Second description",
				dueAt: null,
				priority: "high",
				projectId: null,
				statusCode: "completed",
				title: "Second",
			});

			const listed = await service.findAll();
			t.assert.deepStrictEqual(listed.length, 2);
			t.assert.deepStrictEqual(listed[0]?.id, 2);
			t.assert.deepStrictEqual(listed[0]?.title, "Second");
			t.assert.deepStrictEqual(listed[0]?.statusCode, "completed");
			t.assert.deepStrictEqual(listed[0]?.priority, "high");
			t.assert.deepStrictEqual(listed[1]?.id, 1);
			t.assert.deepStrictEqual(listed[1]?.title, "First");
			t.assert.deepStrictEqual(listed[1]?.statusCode, "open");
			t.assert.deepStrictEqual(listed[1]?.priority, "low");
		} finally {
			await cleanup();
		}
	});

	it("should return a todo for findById when it exists", async (t: TestContext) => {
		const { cleanup, service } = await setupService();
		try {
			await service.create({
				description: "Find Me Description",
				dueAt: null,
				priority: "medium",
				projectId: null,
				statusCode: "open",
				title: "Find Me",
			});

			const found = await service.findById(1);
			t.assert.deepStrictEqual(found?.id, 1);
			t.assert.deepStrictEqual(found?.title, "Find Me");
			t.assert.deepStrictEqual(found?.description, "Find Me Description");
			t.assert.deepStrictEqual(found?.statusCode, "open");
			t.assert.deepStrictEqual(found?.projectId, null);
			t.assert.deepStrictEqual(found?.version, 0);
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
			await service.create({
				description: "Original description",
				dueAt: null,
				priority: "medium",
				projectId: null,
				statusCode: "open",
				title: "Original",
			});

			const updated = await service.update(1, {
				description: "Updated description",
				dueAt: null,
				priority: "high",
				projectId: null,
				statusCode: "completed",
				title: "Updated",
				version: 0,
			});

			t.assert.deepStrictEqual(updated?.id, 1);
			t.assert.deepStrictEqual(updated?.title, "Updated");
			t.assert.deepStrictEqual(updated?.description, "Updated description");
			t.assert.deepStrictEqual(updated?.statusCode, "completed");
			t.assert.deepStrictEqual(updated?.priority, "high");
			t.assert.deepStrictEqual(updated?.projectId, null);
			t.assert.deepStrictEqual(updated?.version, 1);
		} finally {
			await cleanup();
		}
	});

	it("should return undefined for update when the todo does not exist", async (t: TestContext) => {
		const { cleanup, service } = await setupService();
		try {
			const updated = await service.update(999_999, {
				description: "",
				dueAt: null,
				priority: "medium",
				projectId: null,
				statusCode: "completed",
				title: "Updated",
				version: 0,
			});

			t.assert.deepStrictEqual(updated, undefined);
		} finally {
			await cleanup();
		}
	});

	it("should return undefined for update when version is stale", async (t: TestContext) => {
		const { cleanup, service } = await setupService();
		try {
			await service.create({
				description: "",
				dueAt: null,
				priority: "medium",
				projectId: null,
				statusCode: "open",
				title: "Original",
			});

			const updated = await service.update(1, {
				description: "",
				dueAt: null,
				priority: "medium",
				projectId: null,
				statusCode: "completed",
				title: "Stale",
				version: 999,
			});

			t.assert.deepStrictEqual(updated, undefined);
		} finally {
			await cleanup();
		}
	});

	it("should delete and return true when the todo exists", async (t: TestContext) => {
		const { cleanup, service } = await setupService();
		try {
			await service.create({
				description: "",
				dueAt: null,
				priority: "medium",
				projectId: null,
				statusCode: "open",
				title: "Delete Me",
			});

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
