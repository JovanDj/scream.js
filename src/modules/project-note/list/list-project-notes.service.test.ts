import { describe, it, type TestContext } from "node:test";
import { databaseTestFixture } from "@scream.js/database/test-helpers.js";
import { projectNoteIndexInputSchema } from "../project-note.schema.js";
import { ListProjectNotesService } from "./list-project-notes.service.js";

describe("ListProjectNotesService", { concurrency: true }, () => {
	it("orders all parents' notes newest first and filters before applying pagination", async (t: TestContext) => {
		const { cleanup, db } = await databaseTestFixture.setup();
		t.after(() => cleanup());
		await db("projects").insert([
			{ id: 11, name: "Alpha", status_id: 1 },
			{ id: 22, name: "Zulu", status_id: 2 },
		]);
		await db("project_notes").insert([
			{ body: "First body", id: 101, project_id: 11, title: "First" },
			{ body: "Second body", id: 102, project_id: 22, title: "Second" },
			{ body: "Third body", id: 103, project_id: 11, title: "Third" },
			{ body: "Fourth body", id: 104, project_id: 22, title: "Fourth" },
			{ body: " \nFifth body\n ", id: 105, project_id: 11, title: "Fifth" },
			{ body: "Sixth body", id: 106, project_id: 22, title: "Sixth" },
		]);
		const service = new ListProjectNotesService(db);
		const input = {
			...projectNoteIndexInputSchema.parse({}),
			limit: 3,
			offset: 0,
		};
		t.assert.deepStrictEqual(
			(await service.execute(input)).map((row) => row.id),
			[106, 105, 104],
		);
		t.assert.deepStrictEqual(
			(await service.execute({ ...input, offset: 2 })).map((row) => row.id),
			[104, 103, 102],
		);
		t.assert.deepStrictEqual(
			await service.execute({ ...input, projectId: 11 }),
			[
				{
					body: " \nFifth body\n ",
					id: 105,
					projectId: 11,
					projectName: "Alpha",
					title: "Fifth",
				},
				{
					body: "Third body",
					id: 103,
					projectId: 11,
					projectName: "Alpha",
					title: "Third",
				},
				{
					body: "First body",
					id: 101,
					projectId: 11,
					projectName: "Alpha",
					title: "First",
				},
			],
		);
		t.assert.deepStrictEqual(
			(await service.execute({ ...input, offset: 1, projectId: 22 })).map(
				(row) => row.id,
			),
			[104, 102],
		);
		t.assert.deepStrictEqual(
			await service.execute({ ...input, projectId: 99 }),
			[],
		);
		t.assert.deepStrictEqual(
			await service.execute({ ...input, offset: 6 }),
			[],
		);
	});

	it("returns an empty list when there are no notes", async (t: TestContext) => {
		const { cleanup, db } = await databaseTestFixture.setup();
		t.after(() => cleanup());
		t.assert.deepStrictEqual(
			await new ListProjectNotesService(db).execute({
				limit: 11,
				offset: 0,
				page: 1,
			}),
			[],
		);
	});

	it("rejects corrupt rows included in the lookahead result", async (t: TestContext) => {
		const { cleanup, db } = await databaseTestFixture.setup();
		t.after(() => cleanup());
		await db("projects").insert({ id: 11, name: "Alpha", status_id: 1 });
		await db("project_notes").insert([
			{ body: " \n ", id: 101, project_id: 11, title: "Invalid" },
			{ body: "Body", id: 102, project_id: 11, title: "Valid" },
		]);
		const service = new ListProjectNotesService(db);
		const execute = () => service.execute({ limit: 2, offset: 0, page: 1 });

		await t.assert.rejects(execute, { name: "ZodError" });
	});

	it("defaults the page and parses positive integer pages and optional parent filters", (t: TestContext) => {
		t.assert.deepStrictEqual(
			projectNoteIndexInputSchema.parse({ limit: "999", offset: "999" }),
			{ page: 1 },
		);
		t.assert.deepStrictEqual(
			projectNoteIndexInputSchema.parse({ page: "2", projectId: "11" }),
			{ page: 2, projectId: 11 },
		);
		for (const value of [0, -1, 1.5, "", "bad"]) {
			t.assert.strictEqual(
				projectNoteIndexInputSchema.safeParse({ page: value }).success,
				false,
			);
			t.assert.strictEqual(
				projectNoteIndexInputSchema.safeParse({ projectId: value }).success,
				false,
			);
		}
	});
});
