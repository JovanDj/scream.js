import { describe, it, type TestContext } from "node:test";
import { databaseTestFixture } from "@scream.js/database/test-helpers.js";
import { TransactionHandler } from "./transaction-handler.js";

describe("TransactionHandler", () => {
	it("returns the service result and commits each invocation", async (t: TestContext) => {
		const { cleanup, db } = await databaseTestFixture.setup();
		try {
			await db.schema.createTable("transaction_probe", (table) => {
				table.integer("value").notNullable();
			});
			const handler = new TransactionHandler(db, {
				create: (tx) => ({
					execute: async (value: number) => {
						await tx("transaction_probe").insert({ value });
						return value * 2;
					},
				}),
			});

			t.assert.deepStrictEqual(await handler.execute(2), 4);
			t.assert.deepStrictEqual(await handler.execute(3), 6);
			t.assert.deepStrictEqual(await db("transaction_probe").orderBy("value"), [
				{ value: 2 },
				{ value: 3 },
			]);
		} finally {
			await cleanup();
		}
	});

	it("rolls back writes when execution fails", async (t: TestContext) => {
		const { cleanup, db } = await databaseTestFixture.setup();
		try {
			await db.schema.createTable("transaction_probe", (table) => {
				table.integer("value").notNullable();
			});
			const handler = new TransactionHandler(db, {
				create: (tx) => ({
					execute: async (value: number) => {
						await tx("transaction_probe").insert({ value });
						throw new Error("failed after write");
					},
				}),
			});

			await t.assert.rejects(handler.execute(1), /failed after write/);
			t.assert.deepStrictEqual(
				await db("transaction_probe").select("value"),
				[],
			);
		} finally {
			await cleanup();
		}
	});

	it("propagates construction failures and releases the transaction", async (t: TestContext) => {
		const { cleanup, db } = await databaseTestFixture.setup();
		try {
			const handler = new TransactionHandler<number, void>(db, {
				create: () => {
					throw new Error("construction failed");
				},
			});

			await t.assert.rejects(handler.execute(1), /construction failed/);
			t.assert.deepStrictEqual(await db("tags").select("id"), []);
		} finally {
			await cleanup();
		}
	});
});
