import { describe, it, type TestContext } from "node:test";
import { databaseTestFixture } from "@scream.js/database/test-helpers.js";
import { DeleteTagService } from "./delete-tag.service.js";

describe("DeleteTagService", { concurrency: true }, () => {
	it("deletes an existing tag and returns false when it is missing", async (t: TestContext) => {
		const { cleanup, db } = await databaseTestFixture.setup();
		t.after(() => cleanup());

		const now = new Date().toISOString();
		const [deletedTag] = await db("tags")
			.insert({ created_at: now, name: "Delete me", updated_at: now })
			.returning("id");
		const [keptTag] = await db("tags")
			.insert({ created_at: now, name: "Keep me", updated_at: now })
			.returning("id");
		const [todo] = await db("todos")
			.insert({
				created_at: now,
				description: "",
				priority_id: 2,
				status_id: 1,
				title: "Linked todo",
				updated_at: now,
			})
			.returning("id");
		await db("todo_tags").insert([
			{ tag_id: deletedTag.id, todo_id: todo.id },
			{ tag_id: keptTag.id, todo_id: todo.id },
		]);
		const service = new DeleteTagService(db);

		t.assert.deepStrictEqual(
			await service.execute({ id: Number(deletedTag.id) }),
			true,
		);
		t.assert.deepStrictEqual(await db("tags").orderBy("id").select("id"), [
			{ id: keptTag.id },
		]);
		t.assert.deepStrictEqual(
			await db("todo_tags").select("tag_id", "todo_id"),
			[{ tag_id: keptTag.id, todo_id: todo.id }],
		);
		t.assert.deepStrictEqual(
			await service.execute({ id: Number(deletedTag.id) }),
			false,
		);
	});
});
