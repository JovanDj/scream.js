import { describe, it, type TestContext } from "node:test";
import { setTimeout } from "node:timers/promises";
import type { Connection, Transaction } from "./connection.js";
import { sql } from "./query-builder/sql-template-string.js";

export const connectionContract = (
	name: string,
	connect: () => Promise<Connection>,
) => {
	describe(name, { concurrency: true }, () => {
		it("runs mutations and reads rows", async (t: TestContext) => {
			const connection = await connect();
			try {
				await connection.run(
					sql`CREATE TABLE users (
						id INTEGER PRIMARY KEY AUTOINCREMENT,
						name TEXT NOT NULL
					)`,
				);

				const inserted = await connection.run(
					sql`INSERT INTO users (name) VALUES (${"Alice"})`,
				);
				const updated = await connection.run(
					sql`UPDATE users SET name = ${"Bob"} WHERE id = ${1}`,
				);
				const user = await connection.get<{ id: number; name: string }>(
					sql`SELECT id, name FROM users WHERE id = ${1}`,
				);
				const users = await connection.all<{ id: number; name: string }>(
					sql`SELECT id, name FROM users ORDER BY id`,
				);
				const missingUser = await connection.get(
					sql`SELECT id, name FROM users WHERE id = ${99}`,
				);
				const deleted = await connection.run(
					sql`DELETE FROM users WHERE id = ${1}`,
				);

				t.assert.deepStrictEqual(inserted.insertedId(), 1);
				t.assert.deepStrictEqual(inserted.affectedRows(), 1);
				t.assert.deepStrictEqual(updated.insertedId(), undefined);
				t.assert.deepStrictEqual(updated.affectedRows(), 1);
				t.assert.deepStrictEqual(user, { id: 1, name: "Bob" });
				t.assert.deepStrictEqual(users, [{ id: 1, name: "Bob" }]);
				t.assert.deepStrictEqual(missingUser, undefined);
				t.assert.deepStrictEqual(deleted.insertedId(), undefined);
				t.assert.deepStrictEqual(deleted.affectedRows(), 1);
			} finally {
				await connection.close();
			}
		});

		it("enforces foreign keys", async (t: TestContext) => {
			const connection = await connect();
			try {
				await connection.run(
					sql`CREATE TABLE parents (id INTEGER PRIMARY KEY)`,
				);
				await connection.run(
					sql`CREATE TABLE children (
						id INTEGER PRIMARY KEY,
						parent_id INTEGER NOT NULL REFERENCES parents(id)
					)`,
				);

				await t.assert.rejects(() =>
					connection.run(
						sql`INSERT INTO children (id, parent_id) VALUES (${1}, ${99})`,
					),
				);
			} finally {
				await connection.close();
			}
		});

		it("commits transactions and returns callback values", async (t: TestContext) => {
			const connection = await connect();
			try {
				await connection.run(
					sql`CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT NOT NULL)`,
				);

				const result = await connection.transaction(async (transaction) => {
					await transaction.run(
						sql`INSERT INTO users (id, name) VALUES (${1}, ${"Alice"})`,
					);
					return "committed";
				});
				const user = await connection.get(
					sql`SELECT id, name FROM users WHERE id = ${1}`,
				);

				t.assert.deepStrictEqual(result, "committed");
				t.assert.deepStrictEqual(user, { id: 1, name: "Alice" });
			} finally {
				await connection.close();
			}
		});

		it("rolls transactions back when the callback fails", async (t: TestContext) => {
			const connection = await connect();
			try {
				await connection.run(
					sql`CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT NOT NULL)`,
				);

				await t.assert.rejects(() =>
					connection.transaction(async (transaction) => {
						await transaction.run(
							sql`INSERT INTO users (id, name) VALUES (${1}, ${"Alice"})`,
						);
						throw new Error("rollback");
					}),
				);
				const user = await connection.get(
					sql`SELECT id, name FROM users WHERE id = ${1}`,
				);

				t.assert.deepStrictEqual(user, undefined);
			} finally {
				await connection.close();
			}
		});

		it("keeps ordinary operations outside an active transaction", async (t: TestContext) => {
			const connection = await connect();
			const transactionStarted = Promise.withResolvers<void>();
			const releaseTransaction = Promise.withResolvers<void>();
			try {
				await connection.run(
					sql`CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT NOT NULL)`,
				);

				const transaction = connection.transaction(async (trx) => {
					await trx.run(
						sql`INSERT INTO users (id, name) VALUES (${1}, ${"transaction"})`,
					);
					transactionStarted.resolve();
					await releaseTransaction.promise;
					throw new Error("rollback transaction");
				});
				await transactionStarted.promise;

				const ordinaryInsert = connection.run(
					sql`INSERT INTO users (id, name) VALUES (${2}, ${"ordinary"})`,
				);
				const ordinaryInsertCompleted = await Promise.race([
					ordinaryInsert.then(() => true),
					setTimeout(20, false),
				]);

				t.assert.strictEqual(ordinaryInsertCompleted, false);
				releaseTransaction.resolve();
				await t.assert.rejects(transaction, {
					message: "rollback transaction",
				});
				await ordinaryInsert;
				t.assert.deepStrictEqual(
					await connection.all(sql`SELECT id, name FROM users ORDER BY id`),
					[{ id: 2, name: "ordinary" }],
				);
			} finally {
				releaseTransaction.resolve();
				await connection.close();
			}
		});

		it("runs concurrent transactions sequentially", async (t: TestContext) => {
			const connection = await connect();
			const firstStarted = Promise.withResolvers<void>();
			const releaseFirst = Promise.withResolvers<void>();
			const secondStarted = Promise.withResolvers<void>();
			try {
				await connection.run(
					sql`CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT NOT NULL)`,
				);

				const first = connection.transaction(async (trx) => {
					await trx.run(
						sql`INSERT INTO users (id, name) VALUES (${1}, ${"first"})`,
					);
					firstStarted.resolve();
					await releaseFirst.promise;
					throw new Error("rollback first");
				});
				await firstStarted.promise;

				const second = connection.transaction(async (trx) => {
					secondStarted.resolve();
					await trx.run(
						sql`INSERT INTO users (id, name) VALUES (${2}, ${"second"})`,
					);
				});
				const secondTransactionStarted = await Promise.race([
					secondStarted.promise.then(() => true),
					setTimeout(20, false),
				]);

				t.assert.strictEqual(secondTransactionStarted, false);
				releaseFirst.resolve();
				await t.assert.rejects(first, { message: "rollback first" });
				await second;
				t.assert.deepStrictEqual(
					await connection.all(sql`SELECT id, name FROM users ORDER BY id`),
					[{ id: 2, name: "second" }],
				);
			} finally {
				releaseFirst.resolve();
				await connection.close();
			}
		});

		it("continues after a failed operation", async (t: TestContext) => {
			const connection = await connect();
			try {
				await t.assert.rejects(
					connection.run(sql`INSERT INTO missing_table VALUES (${1})`),
				);

				const row = await connection.get<{ value: number }>(
					sql`SELECT ${1} AS value`,
				);

				t.assert.deepStrictEqual(row, { value: 1 });
			} finally {
				await connection.close();
			}
		});

		it("rejects transaction operations after completion", async (t: TestContext) => {
			const connection = await connect();
			let transaction: Transaction | undefined;
			try {
				await connection.run(
					sql`CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT NOT NULL)`,
				);

				await connection.transaction(async (trx) => {
					transaction = trx;
					await trx.run(
						sql`INSERT INTO users (id, name) VALUES (${1}, ${"Alice"})`,
					);
				});

				const completedTransaction = transaction as Transaction;
				await t.assert.rejects(
					completedTransaction.get(
						sql`SELECT id, name FROM users WHERE id = ${1}`,
					),
					{ message: "Transaction is no longer active" },
				);
				await t.assert.rejects(
					completedTransaction.all(sql`SELECT id, name FROM users`),
					{ message: "Transaction is no longer active" },
				);
				await t.assert.rejects(
					completedTransaction.run(
						sql`INSERT INTO users (id, name) VALUES (${2}, ${"Bob"})`,
					),
					{ message: "Transaction is no longer active" },
				);
			} finally {
				await connection.close();
			}
		});

		it("preserves callback and rollback errors", async (t: TestContext) => {
			const connection = await connect();
			const callbackError = new Error("callback failed");
			try {
				await t.assert.rejects(
					connection.transaction(async (trx) => {
						await trx.run(sql`ROLLBACK`);
						throw callbackError;
					}),
					(error) =>
						error instanceof AggregateError &&
						error.message === "Transaction and rollback failed" &&
						error.errors[0] === callbackError &&
						error.errors.length === 2,
				);
			} finally {
				await connection.close();
			}
		});

		it("queues close behind active work and rejects later operations", async (t: TestContext) => {
			const connection = await connect();
			const transactionStarted = Promise.withResolvers<void>();
			const releaseTransaction = Promise.withResolvers<void>();
			await connection.run(
				sql`CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT NOT NULL)`,
			);
			const transaction = connection.transaction(async (trx) => {
				transactionStarted.resolve();
				await releaseTransaction.promise;
				await trx.run(
					sql`INSERT INTO users (id, name) VALUES (${1}, ${"Alice"})`,
				);
			});
			await transactionStarted.promise;

			const close = connection.close();
			const closeCompleted = await Promise.race([
				close.then(() => true),
				setTimeout(20, false),
			]);

			t.assert.strictEqual(closeCompleted, false);
			await t.assert.rejects(
				connection.get(sql`SELECT id, name FROM users WHERE id = ${1}`),
				{ message: "Connection is closed" },
			);
			releaseTransaction.resolve();
			await transaction;
			await close;
		});

		it("closes the connection", async (t: TestContext) => {
			const connection = await connect();

			await connection.close();

			await t.assert.rejects(() => connection.get(sql`SELECT 1`));
		});
	});
};
