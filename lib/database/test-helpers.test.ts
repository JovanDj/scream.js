import { describe, it, type TestContext } from "node:test";
import { databaseTestFixture } from "./test-helpers.js";

describe("databaseTestFixture", { concurrency: true }, () => {
	it("isolates state across independent setup calls", async (t: TestContext) => {
		const fixtureA = await databaseTestFixture.setup({});
		const fixtureB = await databaseTestFixture.setup({});

		try {
			const now = new Date().toISOString();
			await fixtureA.db("todos").insert({
				created_at: now,
				description: "",
				priority_id: 2,
				status_id: 1,
				title: "Only In A",
				updated_at: now,
			});

			const foundInA = await fixtureA
				.db("todos")
				.where({ title: "Only In A" })
				.first("title");
			const foundInB = await fixtureB
				.db("todos")
				.where({ title: "Only In A" })
				.first("title");

			t.assert.deepStrictEqual(foundInA?.["title"], "Only In A");
			t.assert.deepStrictEqual(foundInB, undefined);
		} finally {
			await fixtureA.cleanup();
			await fixtureB.cleanup();
		}
	});

	it("runs seed and prepare hooks when requested", async (t: TestContext) => {
		const fixture = await databaseTestFixture.setup({
			prepare: async (db) => {
				const status = await db("todo_statuses")
					.where({ code: "open" })
					.first("id");
				const priority = await db("todo_priorities")
					.where({ code: "medium" })
					.first("id");
				const now = new Date().toISOString();

				await db("todos").insert({
					created_at: now,
					description: "",
					priority_id: Number(priority?.["id"]),
					status_id: Number(status?.["id"]),
					title: "Prepared",
					updated_at: now,
				});
			},
			seed: true,
		});

		try {
			const prepared = await fixture.db("todos").where({ title: "Prepared" });

			t.assert.deepStrictEqual(prepared.length, 1);
		} finally {
			await fixture.cleanup();
		}
	});
});
