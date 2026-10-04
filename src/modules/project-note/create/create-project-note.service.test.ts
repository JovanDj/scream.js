import { describe, it, type TestContext } from "node:test";
import { databaseTestFixture } from "@scream.js/database/test-helpers.js";
import { TransactionHandler } from "@scream.js/database/transaction-handler.js";
import { ProjectNotFoundError } from "../project-not-found.error.js";
import {
	projectNoteCreateInputSchema,
	projectNoteFormFieldsSchema,
	projectNoteStoreInputSchema,
} from "../project-note.schema.js";
import {
	CreateProjectNoteService,
	CreateProjectNoteServiceFactory,
} from "./create-project-note.service.js";

describe("CreateProjectNoteService", { concurrency: true }, () => {
	const now = () => "2026-02-03T04:05:06.000Z";

	it("stores a trimmed title and the exact multiline body for active and archived parents", async (t: TestContext) => {
		const { cleanup, db } = await databaseTestFixture.setup();
		t.after(() => cleanup());
		await db("projects").insert([
			{ id: 11, name: "Alpha", status_id: 1 },
			{ id: 22, name: "Zulu", status_id: 2 },
		]);
		const body = "  First line\r\n\nSecond line  \n";
		const activeInput = projectNoteStoreInputSchema.parse({
			body,
			projectId: "11",
			title: "  Active note  ",
		});
		const archivedInput = projectNoteStoreInputSchema.parse({
			body,
			projectId: "22",
			title: "Archived note",
		});
		const service = new CreateProjectNoteService(db, now);
		const transactionalService = new TransactionHandler(
			db,
			new CreateProjectNoteServiceFactory(now),
		);

		const activeId = await service.execute(activeInput);
		const archivedId = await transactionalService.execute(archivedInput);
		const rows = await db("project_notes")
			.select("id", "project_id", "title", "body", "created_at", "updated_at")
			.orderBy("id");

		t.assert.ok(Number.isInteger(activeId) && activeId > 0);
		t.assert.ok(Number.isInteger(archivedId) && archivedId > activeId);
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
				created_at: "2026-02-03T04:05:06.000Z",
				id: activeId,
				project_id: 11,
				title: "Active note",
				updated_at: "2026-02-03T04:05:06.000Z",
			},
			{
				body,
				created_at: "2026-02-03T04:05:06.000Z",
				id: archivedId,
				project_id: 22,
				title: "Archived note",
				updated_at: "2026-02-03T04:05:06.000Z",
			},
		]);
	});

	it("rejects missing parents without writing a note", async (t: TestContext) => {
		const { cleanup, db } = await databaseTestFixture.setup();
		t.after(() => cleanup());
		const service = new TransactionHandler(
			db,
			new CreateProjectNoteServiceFactory(now),
		);
		const execute = () =>
			service.execute({ body: "Body", projectId: 99, title: "Missing" });

		await t.assert.rejects(execute, ProjectNotFoundError);
		const rows = await db("project_notes").select("*");
		t.assert.deepStrictEqual(rows, []);
	});

	it("rejects a corrupt parent before inserting", async (t: TestContext) => {
		const { cleanup, db } = await databaseTestFixture.setup();
		t.after(() => cleanup());
		await db("projects").insert({
			id: 11,
			name: Buffer.from("Corrupt"),
			status_id: 1,
		});
		const service = new CreateProjectNoteService(db, now);
		const execute = () =>
			service.execute({ body: "Body", projectId: 11, title: "Valid" });

		await t.assert.rejects(execute, { name: "ZodError" });
		const rows = await db("project_notes").select("*");
		t.assert.deepStrictEqual(rows, []);
	});

	it("leaves existing notes unchanged when insertion fails", async (t: TestContext) => {
		const { cleanup, db } = await databaseTestFixture.setup();
		t.after(() => cleanup());
		await db("projects").insert({ id: 11, name: "Alpha", status_id: 1 });
		await db("project_notes").insert({
			body: "Original body",
			created_at: "2026-01-02T03:04:05.000Z",
			id: 101,
			project_id: 11,
			title: "Original",
			updated_at: "2026-01-02T03:04:05.000Z",
		});
		const before = await db("project_notes").select("*");
		await db.raw(
			"CREATE TRIGGER reject_note BEFORE INSERT ON project_notes BEGIN SELECT RAISE(ABORT, 'Note rejected'); END",
		);
		const service = new TransactionHandler(
			db,
			new CreateProjectNoteServiceFactory(now),
		);
		const execute = () =>
			service.execute({ body: "Body", projectId: 11, title: "Rejected" });

		await t.assert.rejects(execute, /Note rejected/);
		const rows = await db("project_notes").select("*");
		t.assert.deepStrictEqual(rows, before);
	});

	it("rolls back an insert whose returned id is corrupt", async (t: TestContext) => {
		const { cleanup, db } = await databaseTestFixture.setup();
		t.after(() => cleanup());
		await db("projects").insert({ id: 11, name: "Alpha", status_id: 1 });
		await db.schema.dropTable("project_notes");
		await db.schema.createTable("project_notes", (table) => {
			table.integer("id").notNullable().defaultTo(0);
			table.integer("project_id").notNullable();
			table.string("title").notNullable();
			table.text("body").notNullable();
			table.dateTime("created_at").notNullable();
			table.dateTime("updated_at").notNullable();
		});
		const service = new TransactionHandler(
			db,
			new CreateProjectNoteServiceFactory(now),
		);
		const execute = () =>
			service.execute({ body: "Body", projectId: 11, title: "Valid" });

		await t.assert.rejects(execute, { name: "ZodError" });
		const rows = await db("project_notes").select("*");
		t.assert.deepStrictEqual(rows, []);
	});

	it("accepts only a required positive parent id, a nonblank bounded title, and a nonblank body", (t: TestContext) => {
		const valid = { body: " \nBody\n ", projectId: "11", title: "  Title  " };
		t.assert.deepStrictEqual(projectNoteStoreInputSchema.parse(valid), {
			body: valid.body,
			projectId: 11,
			title: "Title",
		});
		t.assert.strictEqual(
			projectNoteStoreInputSchema.parse({ ...valid, title: "x".repeat(255) })
				.title.length,
			255,
		);
		for (const projectId of [undefined, "", "bad", 0, -1, 1.5]) {
			t.assert.strictEqual(
				projectNoteStoreInputSchema.safeParse({ ...valid, projectId }).success,
				false,
			);
		}
		for (const title of [undefined, "", " \n ", "x".repeat(256), 17]) {
			t.assert.strictEqual(
				projectNoteStoreInputSchema.safeParse({ ...valid, title }).success,
				false,
			);
		}
		for (const body of [undefined, "", " \r\n\t ", 17]) {
			t.assert.strictEqual(
				projectNoteStoreInputSchema.safeParse({ ...valid, body }).success,
				false,
			);
		}
	});

	it("parses optional create presets and retains only original strings for invalid forms", (t: TestContext) => {
		t.assert.deepStrictEqual(projectNoteCreateInputSchema.parse({}), {});
		t.assert.deepStrictEqual(
			projectNoteCreateInputSchema.parse({ projectId: "22" }),
			{ projectId: 22 },
		);
		for (const projectId of ["", "bad", 0, -1, 1.5]) {
			t.assert.strictEqual(
				projectNoteCreateInputSchema.safeParse({ projectId }).success,
				false,
			);
		}
		const fields = {
			body: "  \r\n ",
			projectId: "missing",
			title: "  Invalid title  ",
		};
		t.assert.deepStrictEqual(projectNoteFormFieldsSchema.parse(fields), fields);
		t.assert.deepStrictEqual(projectNoteFormFieldsSchema.parse({}), {
			body: "",
			projectId: "",
			title: "",
		});
		for (const value of [undefined, null, 17, ["text"], { text: "text" }]) {
			t.assert.deepStrictEqual(
				projectNoteFormFieldsSchema.parse({
					body: value,
					projectId: value,
					title: value,
				}),
				{ body: "", projectId: "", title: "" },
			);
		}
	});
});
