import { describe, it, type TestContext } from "node:test";
import { createDB } from "./db.js";
import { TransactionHandler } from "./transaction-handler.js";

describe("TransactionHandler", () => {
	it("returns the service result and commits each invocation", async (t: TestContext) => {
		const db = createDB("integration");
		t.after(() => db.destroy());

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
	});

	it("rolls back a failed invocation without affecting the next", async (t: TestContext) => {
		const db = createDB("integration");
		t.after(() => db.destroy());

		await db.schema.createTable("transaction_probe", (table) => {
			table.integer("value").notNullable();
		});
		const handler = new TransactionHandler(db, {
			create: (tx) => ({
				execute: async (value: number) => {
					await tx("transaction_probe").insert({ value });
					if (value === 1) {
						throw new Error("failed after write");
					}
					return value * 2;
				},
			}),
		});

		await t.assert.rejects(handler.execute(1), /failed after write/);
		const result = await handler.execute(2);
		const rows = await db("transaction_probe").select("value");

		t.assert.deepStrictEqual(result, 4);
		t.assert.deepStrictEqual(rows, [{ value: 2 }]);
	});

	it("propagates construction failures and releases the transaction", async (t: TestContext) => {
		const db = createDB("integration");
		t.after(() => db.destroy());

		await db.schema.createTable("transaction_probe", (table) => {
			table.integer("value").notNullable();
		});
		const failingHandler = new TransactionHandler<number>(db, {
			create: () => {
				throw new Error("construction failed");
			},
		});
		const handler = new TransactionHandler(db, {
			create: (tx) => ({
				execute: async (value: number) => {
					await tx("transaction_probe").insert({ value });
					return value * 2;
				},
			}),
		});

		await t.assert.rejects(failingHandler.execute(1), /construction failed/);
		const result = await handler.execute(2);
		const rows = await db("transaction_probe").select("value");

		t.assert.deepStrictEqual(result, 4);
		t.assert.deepStrictEqual(rows, [{ value: 2 }]);
	});
});
