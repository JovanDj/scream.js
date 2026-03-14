import { describe, it, type TestContext } from "node:test";
import { databaseTestFixture } from "@scream.js/database/test-helpers.js";
import { KnexTodoRepository } from "../todo/todo.repository.js";
import { KnexTagRepository } from "./tag.repository.js";

describe("TagRepository", { concurrency: true }, () => {
	it("inserts and lists tags", async (t: TestContext) => {
		const { cleanup, db } = await databaseTestFixture.setup({});

		try {
			const repository = KnexTagRepository.create(db);
			await repository.insert({ name: "beta" });
			await repository.insert({ name: "alpha" });

			const tags = await repository.findAll();

			t.assert.deepStrictEqual(
				tags.map((tag) => tag.name),
				["alpha", "beta"],
			);
		} finally {
			await cleanup();
		}
	});

	it("deletes an existing tag", async (t: TestContext) => {
		const { cleanup, db } = await databaseTestFixture.setup({});

		try {
			const repository = KnexTagRepository.create(db);
			const created = await repository.insert({ name: "delete-me" });
			const deleted = await repository.delete(created.id);
			const tags = await repository.findAll();

			t.assert.deepStrictEqual(deleted, true);
			t.assert.deepStrictEqual(tags, []);
		} finally {
			await cleanup();
		}
	});

	it("replaces todo tags and reports assigned ids", async (t: TestContext) => {
		const { cleanup, db } = await databaseTestFixture.setup({});

		try {
			const tagRepository = KnexTagRepository.create(db);
			const todoRepository = KnexTodoRepository.create(db);
			const todo = await todoRepository.insert({
				description: "",
				dueAt: null,
				priority: "medium",
				projectId: null,
				statusCode: "open",
				title: "Tagged Todo",
			});
			const firstTag = await tagRepository.insert({ name: "alpha" });
			const secondTag = await tagRepository.insert({ name: "beta" });

			const replaced = await tagRepository.replaceTodoTags(todo.id, {
				tagIds: [secondTag.id, firstTag.id, secondTag.id],
			});
			const assigned = await tagRepository.findTodoTagIds(todo.id);

			t.assert.deepStrictEqual(replaced, true);
			t.assert.deepStrictEqual(assigned, [firstTag.id, secondTag.id]);
		} finally {
			await cleanup();
		}
	});

	it("returns undefined tag ids for a missing todo and false for invalid tag replacement", async (t: TestContext) => {
		const { cleanup, db } = await databaseTestFixture.setup({});

		try {
			const tagRepository = KnexTagRepository.create(db);
			const missingTodoIds = await tagRepository.findTodoTagIds(999_999);
			const replaced = await tagRepository.replaceTodoTags(999_999, {
				tagIds: [1],
			});

			t.assert.deepStrictEqual(missingTodoIds, undefined);
			t.assert.deepStrictEqual(replaced, false);
		} finally {
			await cleanup();
		}
	});
});
