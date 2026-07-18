import { describe, it, type TestContext } from "node:test";
import { sql } from "./query-builder/sql-template-string.js";
import { sqliteDatabaseTestFixture } from "./test-helpers.js";

describe("sqliteDatabaseTestFixture", { concurrency: true }, () => {
	it("isolates temporary database files", async (t: TestContext) => {
		const fixtureA = await sqliteDatabaseTestFixture.setup();
		const fixtureB = await sqliteDatabaseTestFixture.setup();

		try {
			const now = new Date().toISOString();
			await fixtureA.db.run(
				sql`INSERT INTO tags (name, created_at, updated_at)
				VALUES (${"Only In A"}, ${now}, ${now})`,
			);

			const foundInA = await fixtureA.db.get(
				sql`SELECT name FROM tags WHERE name = ${"Only In A"}`,
			);
			const foundInB = await fixtureB.db.get(
				sql`SELECT name FROM tags WHERE name = ${"Only In A"}`,
			);

			t.assert.deepStrictEqual(foundInA, { name: "Only In A" });
			t.assert.deepStrictEqual(foundInB, undefined);
		} finally {
			await fixtureA.cleanup();
			await fixtureB.cleanup();
		}
	});

	it("runs seeds before opening the runtime connection", async (t: TestContext) => {
		const fixture = await sqliteDatabaseTestFixture.setup({ seed: true });

		try {
			const todo = await fixture.db.get<{ title: string }>(
				sql`SELECT title FROM todos ORDER BY id LIMIT 1`,
			);

			t.assert.ok(todo?.title);
		} finally {
			await fixture.cleanup();
		}
	});
});
