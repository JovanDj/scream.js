import { describe, it, type TestContext } from "node:test";
import { databaseTestFixture } from "@scream.js/database/test-helpers.js";
import { DeleteProjectNoteService } from "./delete-project-note.service.js";

describe("DeleteProjectNoteService", { concurrency: true }, () => {
	it("deletes only the selected note and reports false for missing notes", async (t: TestContext) => {
		const { cleanup, db } = await databaseTestFixture.setup();
		t.after(() => cleanup());
		await db("projects").insert([
			{ id: 11, name: "Alpha", status_id: 1 },
			{ id: 22, name: "Archived", status_id: 2 },
		]);
		await db("project_notes").insert([
			{ body: "Keep body", id: 101, project_id: 11, title: "Keep" },
			{ body: "Delete body", id: 102, project_id: 22, title: "Delete" },
		]);
		const service = new DeleteProjectNoteService(db);
		t.assert.strictEqual(await service.execute({ id: 102 }), true);
		t.assert.strictEqual(await service.execute({ id: 102 }), false);
		t.assert.strictEqual(await service.execute({ id: 999 }), false);
		t.assert.deepStrictEqual(
			await db("project_notes").select("id", "title", "body"),
			[{ body: "Keep body", id: 101, title: "Keep" }],
		);
		t.assert.deepStrictEqual(
			(await db("projects").select("id").orderBy("id")).map((row) => row.id),
			[11, 22],
		);
	});

	it("cascades notes when a parent is deleted through the database while keeping other parents' notes", async (t: TestContext) => {
		const { cleanup, db } = await databaseTestFixture.setup();
		t.after(() => cleanup());
		await db.raw("PRAGMA foreign_keys = ON");
		await db("projects").insert([
			{ id: 11, name: "Alpha", status_id: 1 },
			{ id: 22, name: "Archived", status_id: 2 },
		]);
		await db("project_notes").insert([
			{ body: "Body", id: 101, project_id: 11, title: "First" },
			{ body: "Keep body", id: 102, project_id: 22, title: "Keep" },
			{ body: "Body", id: 103, project_id: 11, title: "Third" },
		]);
		await db("projects").where({ id: 11 }).del();
		t.assert.deepStrictEqual(
			await db("project_notes").select("id", "project_id", "title", "body"),
			[{ body: "Keep body", id: 102, project_id: 22, title: "Keep" }],
		);
		t.assert.deepStrictEqual(await db("projects").select("id"), [{ id: 22 }]);
	});

	it("requires a real parent and non-null note fields at the database boundary", async (t: TestContext) => {
		const { cleanup, db } = await databaseTestFixture.setup();
		t.after(() => cleanup());
		await db.raw("PRAGMA foreign_keys = ON");
		await db("projects").insert({ id: 11, name: "Alpha", status_id: 1 });
		await t.assert.rejects(
			db("project_notes").insert({
				body: "Body",
				project_id: 99,
				title: "Orphan",
			}),
			/FOREIGN KEY constraint failed/,
		);
		for (const missingField of [
			{ body: "Body", project_id: null, title: "Title" },
			{ body: "Body", project_id: 11, title: null },
			{ body: null, project_id: 11, title: "Title" },
		]) {
			await t.assert.rejects(
				db("project_notes").insert(missingField),
				/NOT NULL constraint failed/,
			);
		}
		t.assert.deepStrictEqual(await db("project_notes").select("*"), []);
	});
});
