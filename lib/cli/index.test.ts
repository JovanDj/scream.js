import { describe, it, type TestContext } from "node:test";
import { createDB } from "@scream.js/database/db.js";
import { databaseTestFixture } from "@scream.js/database/test-helpers.js";
import { createProgram } from "./index.js";

describe("Scream CLI", { concurrency: true }, () => {
	it("shows pending and applied migrations", async (t: TestContext) => {
		const db = createDB("integration");
		const output: string[] = [];
		const migrations = [
			"20260219100000_project_statuses.ts",
			"20260219100010_todo_statuses.ts",
			"20260219100020_todo_priorities.ts",
			"20260219100030_projects.ts",
			"20260219100040_todos.ts",
			"20260219100050_tags.ts",
			"20260219100060_todo_tags.ts",
			"20261003000000_project_notes.ts",
		];
		t.after(() => db.destroy());

		const program = createProgram({
			db,
			output: (line) => output.push(line),
		});

		await program.parseAsync(["node", "scream", "db:status"]);
		const pending = [...output];
		output.length = 0;
		await program.parseAsync(["node", "scream", "db:migrate"]);
		await program.parseAsync(["node", "scream", "db:status"]);

		t.assert.deepStrictEqual(
			pending,
			migrations.map((name) => `pending ${name}`),
		);
		t.assert.deepStrictEqual(
			output,
			migrations.map((name) => `up ${name}`),
		);
	});

	it("runs application seeds", async (t: TestContext) => {
		const { cleanup, db } = await databaseTestFixture.setup();
		t.after(() => cleanup());

		const program = createProgram({ db });
		await program.parseAsync(["node", "scream", "db:seed"]);

		const projects = await db("projects").select("name");

		t.assert.deepStrictEqual(projects, [{ name: "Inbox" }]);
	});

	it("blocks reset unless the application supplies a reset policy", async (t: TestContext) => {
		const db = createDB("integration");
		t.after(() => db.destroy());

		await db.migrate.latest();
		const status = await db("project_statuses")
			.where({ code: "active" })
			.first("id");
		const now = new Date().toISOString();
		const project = {
			created_at: now,
			name: "Blocked reset sentinel",
			status_id: status.id,
			updated_at: now,
		};
		await db("projects").insert(project);
		const program = createProgram({ db });
		const act = () =>
			program.parseAsync(["node", "scream", "db:reset", "--force"]);

		await t.assert.rejects(act, /Refusing to reset/);
		const projects = await db("projects").select(
			"created_at",
			"name",
			"status_id",
			"updated_at",
		);
		const [applied] = await db.migrate.list();
		t.assert.deepStrictEqual(projects, [project]);
		t.assert.deepStrictEqual(applied.length, 8);
	});

	it("requires force when the application requests confirmation", async (t: TestContext) => {
		const db = createDB("integration");
		t.after(() => db.destroy());

		await db.migrate.latest();
		const status = await db("project_statuses")
			.where({ code: "active" })
			.first("id");
		const now = new Date().toISOString();
		await db("projects").insert({
			created_at: now,
			name: "Before reset",
			status_id: status.id,
			updated_at: now,
		});
		const program = createProgram({ db, resetPolicy: "require-force" });
		const withoutForce = () =>
			program.parseAsync(["node", "scream", "db:reset"]);

		await t.assert.rejects(withoutForce, /Use --force/);
		const before = await db("projects").select("name");
		await program.parseAsync(["node", "scream", "db:reset", "--force"]);
		const after = await db("projects").select("name");

		t.assert.deepStrictEqual(before, [{ name: "Before reset" }]);
		t.assert.deepStrictEqual(after, []);
	});

	it("allows an unconfirmed reset when the application permits it", async (t: TestContext) => {
		const db = createDB("integration");
		t.after(() => db.destroy());

		await db.migrate.latest();
		const status = await db("project_statuses")
			.where({ code: "active" })
			.first("id");
		const now = new Date().toISOString();
		await db("projects").insert({
			created_at: now,
			name: "Allowed reset sentinel",
			status_id: status.id,
			updated_at: now,
		});
		const program = createProgram({ db, resetPolicy: "allow" });
		const before = await db("projects").select("name");

		await program.parseAsync(["node", "scream", "db:reset"]);
		const after = await db("projects").select("name");
		const [applied, pending] = await db.migrate.list();

		t.assert.deepStrictEqual(before, [{ name: "Allowed reset sentinel" }]);
		t.assert.deepStrictEqual(after, []);
		t.assert.deepStrictEqual([applied.length, pending.length], [8, 0]);
	});
});
