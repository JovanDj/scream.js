import { describe, it, type TestContext } from "node:test";
import { databaseTestFixture } from "@scream.js/database/test-helpers.js";
import { GetProjectNoteService } from "./get-project-note.service.js";
import { projectNoteShowInputSchema } from "./project-note.schema.js";

describe("GetProjectNoteService", { concurrency: true }, () => {
	it("returns a validated DTO with its archived parent and exact body, or undefined for a missing id", async (t: TestContext) => {
		const { cleanup, db } = await databaseTestFixture.setup();
		t.after(() => cleanup());
		await db("projects").insert({ id: 22, name: "Archived", status_id: 2 });
		const body = " \r\nOriginal body\n ";
		await db("project_notes").insert({
			body,
			id: 101,
			project_id: 22,
			title: "Original",
		});
		const service = new GetProjectNoteService(db);
		t.assert.deepStrictEqual(
			await service.execute(projectNoteShowInputSchema.parse({ id: "101" })),
			{
				body,
				id: 101,
				projectId: 22,
				projectName: "Archived",
				title: "Original",
			},
		);
		t.assert.strictEqual(await service.execute({ id: 999 }), undefined);
	});

	for (const corruption of [
		{ title: "" },
		{ title: "x".repeat(256) },
		{ body: " \n " },
	]) {
		it(`rejects corrupt note data ${JSON.stringify(corruption)}`, async (t: TestContext) => {
			const { cleanup, db } = await databaseTestFixture.setup();
			t.after(() => cleanup());
			await db("projects").insert({ id: 11, name: "Alpha", status_id: 1 });
			await db("project_notes").insert({
				body: "Body",
				id: 101,
				project_id: 11,
				title: "Original",
				...corruption,
			});
			await t.assert.rejects(
				new GetProjectNoteService(db).execute({ id: 101 }),
				{ name: "ZodError" },
			);
		});
	}

	it("rejects a corrupt joined parent name", async (t: TestContext) => {
		const { cleanup, db } = await databaseTestFixture.setup();
		t.after(() => cleanup());
		await db("projects").insert({
			id: 11,
			name: Buffer.from("Corrupt"),
			status_id: 1,
		});
		await db("project_notes").insert({
			body: "Body",
			id: 101,
			project_id: 11,
			title: "Original",
		});
		await t.assert.rejects(new GetProjectNoteService(db).execute({ id: 101 }), {
			name: "ZodError",
		});
	});

	it("rejects missing or non-positive-integer note ids", (t: TestContext) => {
		for (const id of [undefined, 0, -1, 1.5, "", "bad"]) {
			t.assert.strictEqual(
				projectNoteShowInputSchema.safeParse({ id }).success,
				false,
			);
		}
	});
});
