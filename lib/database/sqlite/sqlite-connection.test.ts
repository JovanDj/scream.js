import { describe, it, type TestContext } from "node:test";
import { sql } from "../query-builder/sql-template-string.js";
import { SqliteConnection } from "./sqlite-connection.js";

describe("SqliteDatabase", { concurrency: true }, () => {
	const withConnection = async () => {
		const connection = await SqliteConnection.connect({ database: ":memory:" });
		const cleanup = async () => {
			await connection.close();
		};

		return { cleanup, connection };
	};

	describe("CRUD", () => {
		it("returns the inserted identifier", async (t: TestContext) => {
			const { connection, cleanup } = await withConnection();
			t.after(cleanup);
			await connection.run(
				sql`CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT);`,
			);
			await connection.run(
				sql`INSERT INTO users (id, name) VALUES (${41}, ${"Existing"});`,
			);

			const result = await connection.run(
				sql`INSERT INTO users (name) VALUES (${"Alice"});`,
			);

			t.assert.strictEqual(result.lastId(), 42);
		});

		it("binds booleans, nulls, and quoted text without rewriting SQL", async (t: TestContext) => {
			const { connection, cleanup } = await withConnection();
			t.after(cleanup);
			await connection.run(
				sql`CREATE TABLE values_test (enabled INTEGER, disabled INTEGER, optional TEXT, name TEXT);`,
			);

			await connection.run(
				sql`INSERT INTO values_test VALUES (${true}, ${false}, ${null}, ${"O'Reilly"});`,
			);
			const row = await connection.get(
				sql`SELECT * FROM values_test WHERE enabled = ${true} AND optional IS ${null};`,
			);
			const rows = await connection.all(
				sql`SELECT name FROM values_test WHERE disabled = ${false};`,
			);

			t.assert.deepStrictEqual(row, {
				disabled: 0,
				enabled: 1,
				name: "O'Reilly",
				optional: null,
			});
			t.assert.deepStrictEqual(rows, [{ name: "O'Reilly" }]);
		});

		it("enforces foreign keys", async (t: TestContext) => {
			const { connection, cleanup } = await withConnection();
			t.after(cleanup);
			await connection.run(sql`CREATE TABLE parents (id INTEGER PRIMARY KEY);`);
			await connection.run(
				sql`CREATE TABLE children (parent_id INTEGER REFERENCES parents(id));`,
			);

			const insert = () =>
				connection.run(sql`INSERT INTO children VALUES (${99});`);

			await t.assert.rejects(insert, /FOREIGN KEY constraint failed/);
		});

		it("finds all rows", async (t: TestContext) => {
			t.plan(1);
			const { connection, cleanup } = await withConnection();
			t.after(() => cleanup());

			await connection.run(
				sql`CREATE TABLE users (id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT);`,
			);
			await connection.run(sql`INSERT INTO users VALUES (${["1"]})`);

			const users = await connection.all(sql`SELECT * FROM users;`);

			t.assert.deepStrictEqual(users, [{ id: 1 }]);
		});

		it("finds single row", async (t: TestContext) => {
			t.plan(1);
			const { connection, cleanup } = await withConnection();
			t.after(() => cleanup());

			await connection.run(
				sql`CREATE TABLE users (id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT);`,
			);
			await connection.run(sql`INSERT INTO users VALUES (${["1"]})`);

			const user = await connection.get(sql`SELECT * FROM users;`);

			t.assert.deepStrictEqual(user, { id: 1 });
		});

		it("creates a new row", async (t: TestContext) => {
			t.plan(1);
			const { connection, cleanup } = await withConnection();
			t.after(() => cleanup());

			await connection.run(
				sql`CREATE TABLE users (id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT);`,
			);
			await connection.run(sql`INSERT INTO users (id) VALUES (${["1"]})`);

			const user = await connection.get(
				sql`SELECT * FROM users WHERE id = ${"1"};`,
			);

			t.assert.deepStrictEqual(user, { id: 1 });
		});

		it("updates a row", async (t: TestContext) => {
			t.plan(1);
			const { connection, cleanup } = await withConnection();
			t.after(() => cleanup());

			await connection.run(
				sql`CREATE TABLE users (id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, name TEXT);`,
			);
			await connection.run(
				sql`INSERT INTO users (id, name) VALUES (${["1", "Alice"]})`,
			);

			await connection.run(
				sql`UPDATE users SET name = ${"Bob"} WHERE id = ${"1"};`,
			);

			const user = await connection.get(
				sql`SELECT * FROM users WHERE id = ${"1"};`,
			);

			t.assert.deepStrictEqual(user, { id: 1, name: "Bob" });
		});

		it("deletes a row", async (t: TestContext) => {
			t.plan(1);
			const { connection, cleanup } = await withConnection();
			t.after(() => cleanup());

			await connection.run(
				sql`CREATE TABLE users (id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, name TEXT);`,
			);
			await connection.run(
				sql`INSERT INTO users (id, name) VALUES (${["1", "Alice"]})`,
			);

			await connection.run(sql`DELETE FROM users WHERE id = ${"1"};`);

			const user = await connection.get(
				sql`SELECT * FROM users WHERE id = ${"1"};`,
			);

			t.assert.deepStrictEqual(user, undefined);
		});
	});

	describe("Transactions", () => {
		it("commits a transaction successfully", async (t: TestContext) => {
			t.plan(1);
			const { connection, cleanup } = await withConnection();
			t.after(() => cleanup());

			await connection.run(
				sql`CREATE TABLE test (id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, name TEXT);`,
			);

			await connection.transaction(async (trx) => {
				await trx.run(
					sql`INSERT INTO test (id, name) VALUES (${["1", "Alice"]})`,
				);
			});

			const row = await connection.get(
				sql`SELECT * FROM test WHERE id = ${"1"};`,
			);
			t.assert.deepStrictEqual(row, { id: 1, name: "Alice" });
		});

		it("rolls back a transaction on error", async (t: TestContext) => {
			t.plan(3);
			const { connection, cleanup } = await withConnection();
			t.after(() => cleanup());

			await connection.run(
				sql`CREATE TABLE test (id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, name TEXT);`,
			);

			const error = new Error("Forced error to rollback transaction");
			const act = () =>
				connection.transaction(async (trx) => {
					await trx.run(
						sql`INSERT INTO test (id, name) VALUES (${["1", "Alice"]})`,
					);
					const inserted = await trx.get<{ id: number; name: string }>(
						sql`SELECT * FROM test WHERE id = ${"1"};`,
					);
					t.assert.deepStrictEqual(inserted, { id: 1, name: "Alice" });
					throw error;
				});

			await t.assert.rejects(act, (caught: unknown) => caught === error);

			const row = await connection.get(
				sql`SELECT * FROM test WHERE id = ${"1"};`,
			);
			t.assert.deepStrictEqual(row, undefined);
		});

		it("returns data from a successful transaction", async (t: TestContext) => {
			t.plan(1);
			const { connection, cleanup } = await withConnection();
			t.after(() => cleanup());

			await connection.run(
				sql`CREATE TABLE test (id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, name TEXT);`,
			);

			const result = await connection.transaction(async (trx) => {
				await trx.run(sql`INSERT INTO test (name) VALUES (${"test name"})`);

				const data = await trx.get<{ id: number; name: string }>(
					sql`SELECT * FROM test WHERE name = ${"test name"};`,
				);

				return data;
			});

			t.assert.deepStrictEqual(result, { id: 1, name: "test name" });
		});

		it("returns computed result from a transaction", async (t: TestContext) => {
			t.plan(1);
			const { connection, cleanup } = await withConnection();
			t.after(() => cleanup());

			const sum = await connection.transaction(async (trx) => {
				await trx.run(sql`CREATE TABLE numbers (num INTEGER);`);
				await trx.run(sql`INSERT INTO numbers (num) VALUES (${["5"]})`);
				await trx.run(sql`INSERT INTO numbers (num) VALUES (${["10"]})`);

				const rows = await trx.all<{ num: number }>(
					sql`SELECT num FROM numbers;`,
				);

				return rows.reduce((acc, row) => acc + row.num, 0);
			});

			t.assert.deepStrictEqual(sum, 15);
		});
	});
});
