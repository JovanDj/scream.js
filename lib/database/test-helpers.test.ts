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
});
