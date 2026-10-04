import { describe, it, type TestContext } from "node:test";
import { databaseTestFixture } from "@scream.js/database/test-helpers.js";
import { TransactionHandler } from "@scream.js/database/transaction-handler.js";
import {
	type ProjectNoteUpdateInput,
	projectNoteUpdateInputSchema,
} from "../project-note.schema.js";
import {
	UpdateProjectNoteService,
	UpdateProjectNoteServiceFactory,
} from "./update-project-note.service.js";

describe("UpdateProjectNoteService", { concurrency: true }, () => {
	const now = () => "2026-02-03T04:05:06.000Z";

	it("changes only title and exact body, preserving the archived parent and creation time", async (t: TestContext) => {
		const { cleanup, db } = await databaseTestFixture.setup();
		t.after(() => cleanup());
		await db("projects").insert([
			{ id: 11, name: "Alpha", status_id: 1 },
			{ id: 22, name: "Archived", status_id: 2 },
		]);
		const originalTime = "2026-01-02T03:04:05.000Z";
		const sentinel = {
			body: "Unrelated body",
			created_at: "2025-06-07T08:09:10.000Z",
			id: 102,
			project_id: 11,
			title: "Unrelated",
			updated_at: "2025-07-08T09:10:11.000Z",
		};
		await db("project_notes").insert([
			{
				body: "Original body",
				created_at: originalTime,
				id: 101,
				project_id: 22,
				title: "Original",
				updated_at: originalTime,
			},
			sentinel,
		]);
		const body = " \nUpdated body\r\n ";
		const parsed = projectNoteUpdateInputSchema.parse({
			body,
			projectId: "11",
			title: "  Changed  ",
		});
		const input = { ...parsed, id: 101, projectId: 11 };
		const service = new TransactionHandler(
			db,
			new UpdateProjectNoteServiceFactory(now),
		);

		const result = await service.execute(input);
		const rows = await db("project_notes")
			.select("id", "project_id", "title", "body", "created_at", "updated_at")
			.orderBy("id");

		t.assert.deepStrictEqual<ProjectNoteUpdateInput>(parsed, {
			body,
			title: "Changed",
		});
		t.assert.deepStrictEqual<{ id: number } | undefined>(result, { id: 101 });
		t.assert.deepStrictEqual<
			{
				body: string;
				created_at: string;
				id: number;
				project_id: number;
				title: string;
				updated_at: string;
			}[]
		>(rows, [
			{
				body,
				created_at: originalTime,
				id: 101,
				project_id: 22,
				title: "Changed",
				updated_at: "2026-02-03T04:05:06.000Z",
			},
			sentinel,
		]);
	});

	it("returns undefined without writing for a missing note", async (t: TestContext) => {
		const { cleanup, db } = await databaseTestFixture.setup();
		t.after(() => cleanup());
		await db("projects").insert({ id: 11, name: "Alpha", status_id: 1 });
		await db("project_notes").insert({
			body: "Body",
			id: 101,
			project_id: 11,
			title: "Original",
		});
		const before = await db("project_notes").select("*");
		const service = new UpdateProjectNoteService(db, now);
		const input = { body: "Changed body", id: 999, title: "Changed" };

		const result = await service.execute(input);
		const rows = await db("project_notes").select("*");

		t.assert.strictEqual(result, undefined);
		t.assert.deepStrictEqual(rows, before);
	});

	for (const corruption of [{ title: "" }, { body: " \n " }]) {
		it(`rejects existing corrupt data before writing ${JSON.stringify(corruption)}`, async (t: TestContext) => {
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
			const before = await db("project_notes").select("*");
			const service = new UpdateProjectNoteService(db, now);
			const execute = () =>
				service.execute({ body: "Changed body", id: 101, title: "Changed" });

			await t.assert.rejects(execute, { name: "ZodError" });
			const rows = await db("project_notes").select("*");
			t.assert.deepStrictEqual(rows, before);
		});
	}

	it("leaves the note unchanged if the database rejects an update", async (t: TestContext) => {
		const { cleanup, db } = await databaseTestFixture.setup();
		t.after(() => cleanup());
		await db("projects").insert({ id: 11, name: "Alpha", status_id: 1 });
		await db("project_notes").insert({
			body: "Body",
			id: 101,
			project_id: 11,
			title: "Original",
		});
		const before = await db("project_notes").select("*");
		await db.raw(
			"CREATE TRIGGER reject_note_update AFTER UPDATE ON project_notes BEGIN SELECT RAISE(FAIL, 'Update rejected'); END",
		);
		const service = new TransactionHandler(
			db,
			new UpdateProjectNoteServiceFactory(now),
		);
		const execute = () =>
			service.execute({ body: "Changed body", id: 101, title: "Changed" });

		await t.assert.rejects(execute, /Update rejected/);
		const rows = await db("project_notes").select("*");
		t.assert.deepStrictEqual(rows, before);
	});

	it("validates editable fields and strips a submitted parent id", (t: TestContext) => {
		const valid = { body: " \nBody\n ", title: "Title" };
		t.assert.deepStrictEqual(
			projectNoteUpdateInputSchema.parse({
				...valid,
				projectId: { invalid: true },
			}),
			valid,
		);
		for (const title of [undefined, "", " \n ", "x".repeat(256), 17]) {
			t.assert.strictEqual(
				projectNoteUpdateInputSchema.safeParse({ ...valid, title }).success,
				false,
			);
		}
		for (const body of [undefined, "", " \r\n\t ", 17]) {
			t.assert.strictEqual(
				projectNoteUpdateInputSchema.safeParse({ ...valid, body }).success,
				false,
			);
		}
	});
});
