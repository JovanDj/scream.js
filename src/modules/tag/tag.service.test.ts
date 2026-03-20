import { describe, it, type TestContext } from "node:test";
import { databaseTestFixture } from "@scream.js/database/test-helpers.js";
import { createTodoModule } from "../todo/index.js";
import { createTagModule } from "./index.js";

describe("TagService", { concurrency: true }, () => {
	const setupService = async () => {
		const { cleanup, db } = await databaseTestFixture.setup({});
		const module = {
			...createTodoModule({ db }),
			...createTagModule({ db }),
		};

		return {
			cleanup,
			service: module.tagService,
			todoService: module.todoService,
		};
	};

	it("creates a tag and returns it from findAll", async (t: TestContext) => {
		const { cleanup, service } = await setupService();
		try {
			await service.create({ name: "alpha" });
			const tags = await service.findAll();

			t.assert.deepStrictEqual(
				tags.map((tag) => tag.name),
				["alpha"],
			);
		} finally {
			await cleanup();
		}
	});

	it("deletes an existing tag and returns false for a missing tag", async (t: TestContext) => {
		const { cleanup, service } = await setupService();
		try {
			const created = await service.create({ name: "delete-me" });
			const deleted = await service.delete(created.id);
			const missingDelete = await service.delete(999_999);

			t.assert.deepStrictEqual(deleted, true);
			t.assert.deepStrictEqual(missingDelete, false);
		} finally {
			await cleanup();
		}
	});

	it("replaces todo tags for an existing todo", async (t: TestContext) => {
		const { cleanup, service, todoService } = await setupService();
		try {
			const firstTag = await service.create({ name: "alpha" });
			const secondTag = await service.create({ name: "beta" });
			const todo = await todoService.create({
				description: "",
				dueAt: null,
				priority: "medium",
				projectId: null,
				statusCode: "open",
				title: "Tagged Todo",
			});
			const replaced = await service.replaceTodoTags(todo.id, {
				tagIds: [firstTag.id, secondTag.id],
			});
			const assigned = await service.findTodoTagIds(todo.id);

			t.assert.deepStrictEqual(replaced, true);
			t.assert.deepStrictEqual(assigned, [firstTag.id, secondTag.id]);
		} finally {
			await cleanup();
		}
	});

	it("returns false when replacing tags for a missing todo", async (t: TestContext) => {
		const { cleanup, service } = await setupService();
		try {
			const created = await service.create({ name: "alpha" });
			const replaced = await service.replaceTodoTags(999_999, {
				tagIds: [created.id],
			});

			t.assert.deepStrictEqual(replaced, false);
		} finally {
			await cleanup();
		}
	});

	it("returns false when replacing tags with invalid tag ids", async (t: TestContext) => {
		const { cleanup, service, todoService } = await setupService();
		try {
			const todo = await todoService.create({
				description: "",
				dueAt: null,
				priority: "medium",
				projectId: null,
				statusCode: "open",
				title: "Tagged Todo",
			});
			const replaced = await service.replaceTodoTags(todo.id, {
				tagIds: [999_999],
			});

			t.assert.deepStrictEqual(replaced, false);
		} finally {
			await cleanup();
		}
	});
});
