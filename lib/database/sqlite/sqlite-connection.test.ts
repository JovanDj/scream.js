import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import { sql } from "../query-builder/sql-template-string.js";
import { SqliteConnection } from "./sqlite-connection.js";

describe("SqliteDatabase", () => {
	let connection: SqliteConnection;

	beforeEach(async () => {
		connection = await SqliteConnection.connect({ database: ":memory:" });
	});

	afterEach(async () => {
		await connection.close();
	});

	describe("CRUD", () => {
		it("finds all rows", async () => {
			await connection.run(
				sql`CREATE TABLE users (id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT);`,
			);
			await connection.run(sql`INSERT INTO users VALUES (${["1"]})`);

			const users = await connection.all(sql`SELECT * FROM users;`);

			assert.deepStrictEqual(users, [{ id: 1 }]);
		});

		it("finds single row", async () => {
			await connection.run(
				sql`CREATE TABLE users (id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT);`,
			);
			await connection.run(sql`INSERT INTO users VALUES (${["1"]})`);

			const user = await connection.get(sql`SELECT * FROM users;`);

			assert.deepStrictEqual(user, { id: 1 });
		});

		it("creates a new row", async () => {
			await connection.run(
				sql`CREATE TABLE users (id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT);`,
			);
			await connection.run(sql`INSERT INTO users (id) VALUES (${["1"]})`);

			const user = await connection.get(
				sql`SELECT * FROM users WHERE id = ${"1"};`,
			);

			assert.deepStrictEqual(user, { id: 1 });
		});

		it("updates a row", async () => {
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

			assert.deepStrictEqual(user, { id: 1, name: "Bob" });
		});

		it("deletes a row", async () => {
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

			assert.deepStrictEqual(user, undefined);
		});
	});

	describe("Transactions", () => {
		beforeEach(async () => {
			await connection.run(
				sql`CREATE TABLE test (id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, name TEXT);`,
			);
		});

		it("commits a transaction successfully", async () => {
			await connection.transaction(async (trx) => {
				await trx.run(
					sql`INSERT INTO test (id, name) VALUES (${["1", "Alice"]})`,
				);
			});

			const row = await connection.get(
				sql`SELECT * FROM test WHERE id = ${"1"};`,
			);
			assert.deepStrictEqual(row, { id: 1, name: "Alice" });
		});

		it("rolls back a transaction on error", async () => {
			try {
				await connection.transaction(async (trx) => {
					await trx.run(
						sql`INSERT INTO test (id, name) VALUES (${["1", "Alice"]})`,
					);
					throw new Error("Forced error to rollback transaction");
				});
			} catch (error) {
				// error expected
			}

			const row = await connection.get(
				sql`SELECT * FROM test WHERE id = ${"1"};`,
			);
			assert.deepStrictEqual(row, undefined);
		});

		it("returns data from a successful transaction", async () => {
			const result = await connection.transaction(async (trx) => {
				await trx.run(sql`INSERT INTO test (name) VALUES (${"test name"})`);

				const data = await trx.get<{ id: number; name: string }>(
					sql`SELECT * FROM test WHERE name = ${"test name"};`,
				);

				return data;
			});

			assert.deepStrictEqual(result, { id: 1, name: "test name" });
		});

		it("returns computed result from a transaction", async () => {
			const sum = await connection.transaction(async (trx) => {
				await trx.run(sql`CREATE TABLE numbers (num INTEGER);`);
				await trx.run(sql`INSERT INTO numbers (num) VALUES (${["5"]})`);
				await trx.run(sql`INSERT INTO numbers (num) VALUES (${["10"]})`);

				const rows = await trx.all<{ num: number }>(
					sql`SELECT num FROM numbers;`,
				);

				return rows.reduce((acc, row) => acc + row.num, 0);
			});

			assert.deepStrictEqual(sum, 15);
		});
	});
});
