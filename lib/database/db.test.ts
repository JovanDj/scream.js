import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, it, type TestContext } from "node:test";
import { createConnection, createMigrationDB } from "./db.js";
import { SqliteConnection } from "./sqlite/sqlite-connection.js";

describe("database factories", { concurrency: false }, () => {
	const originalNodeEnv = process.env["NODE_ENV"];

	afterEach(() => {
		if (originalNodeEnv === undefined) {
			delete process.env["NODE_ENV"];
			return;
		}

		process.env["NODE_ENV"] = originalNodeEnv;
	});

	it("creates a Better SQLite connection by default", async (t: TestContext) => {
		const connection = await createConnection({
			environment: "integration",
		});
		try {
			t.assert.ok(connection instanceof SqliteConnection);
		} finally {
			await connection.close();
		}
	});

	it("creates an explicit SQLite3 connection", async (t: TestContext) => {
		const connection = await createConnection({
			driver: "sqlite3",
			environment: "integration",
		});
		try {
			t.assert.ok(connection instanceof SqliteConnection);
		} finally {
			await connection.close();
		}
	});

	it("uses NODE_ENV when no environment is provided", async (t: TestContext) => {
		process.env["NODE_ENV"] = "integration";
		const connection = await createConnection();
		try {
			const row = await connection.get<{ value: number }>({
				params: [],
				sql: "SELECT 1 AS value",
			});
			t.assert.deepStrictEqual(row, { value: 1 });
		} finally {
			await connection.close();
		}
	});

	it("uses an explicit filename for migration and runtime factories", async (t: TestContext) => {
		const directory = await mkdtemp(join(tmpdir(), "scream-db-factory-"));
		const filename = join(directory, "factory.sqlite");
		const migrationDb = createMigrationDB({ filename });
		try {
			await migrationDb.raw("CREATE TABLE values_table (value INTEGER)");
		} finally {
			await migrationDb.destroy();
		}

		const connection = await createConnection({ filename });
		try {
			const table = await connection.get<{ name: string }>({
				params: ["values_table"],
				sql: "SELECT name FROM sqlite_master WHERE name = ?",
			});
			t.assert.deepStrictEqual(table?.name, "values_table");
		} finally {
			await connection.close();
			await rm(directory, { force: true, recursive: true });
		}
	});

	it("rejects unknown environments", async (t: TestContext) => {
		await t.assert.rejects(
			() => createConnection({ environment: "missing" }),
			/Database environment is not configured/,
		);
		t.assert.throws(
			() => createMigrationDB({ environment: "missing" }),
			/Database environment is not configured/,
		);
	});
});
