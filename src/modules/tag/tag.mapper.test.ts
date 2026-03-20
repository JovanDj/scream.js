import { describe, it, type TestContext } from "node:test";
import { databaseTestFixture } from "@scream.js/database/test-helpers.js";
import { TodoMapper } from "../todo/todo.mapper.js";
import { TagMapper } from "./tag.mapper.js";

describe("TagMapper", { concurrency: true }, () => {
	it("inserts and lists tags", async (t: TestContext) => {
		const { cleanup, db } = await databaseTestFixture.setup({});

		try {
			const mapper = TagMapper.create(db);
			await mapper.insert({ name: "beta" });
			await mapper.insert({ name: "alpha" });

			const tags = await mapper.findAll();

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
			const mapper = TagMapper.create(db);
			const created = await mapper.insert({ name: "delete-me" });
			const deleted = await mapper.delete(created.id);
			const tags = await mapper.findAll();

			t.assert.deepStrictEqual(deleted, true);
			t.assert.deepStrictEqual(tags, []);
		} finally {
			await cleanup();
		}
	});

	it("replaces todo tags and reports assigned ids", async (t: TestContext) => {
		const { cleanup, db } = await databaseTestFixture.setup({});

		try {
			const tagMapper = TagMapper.create(db);
			const todoMapper = TodoMapper.create(db);
			const todo = await todoMapper.insert({
				description: "",
				dueAt: null,
				priority: "medium",
				projectId: null,
				statusCode: "open",
				title: "Tagged Todo",
			});
			const firstTag = await tagMapper.insert({ name: "alpha" });
			const secondTag = await tagMapper.insert({ name: "beta" });

			const replaced = await tagMapper.replaceTodoTags(todo.id, {
				tagIds: [secondTag.id, firstTag.id, secondTag.id],
			});
			const assigned = await tagMapper.findTodoTagIds(todo.id);

			t.assert.deepStrictEqual(replaced, true);
			t.assert.deepStrictEqual(assigned, [firstTag.id, secondTag.id]);
		} finally {
			await cleanup();
		}
	});

	it("returns undefined tag ids for a missing todo and false for invalid tag replacement", async (t: TestContext) => {
		const { cleanup, db } = await databaseTestFixture.setup({});

		try {
			const mapper = TagMapper.create(db);
			const missingTodoIds = await mapper.findTodoTagIds(999_999);
			const replaced = await mapper.replaceTodoTags(999_999, {
				tagIds: [1],
			});

			t.assert.deepStrictEqual(missingTodoIds, undefined);
			t.assert.deepStrictEqual(replaced, false);
		} finally {
			await cleanup();
		}
	});
});
