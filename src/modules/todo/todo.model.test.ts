import {
	afterEach,
	beforeEach,
	describe,
	it,
	type TestContext,
} from "node:test";
import type { Connection } from "@scream.js/database/connection.js";
import { sql } from "@scream.js/database/query-builder/sql-template-string.js";
import { sqliteDatabaseTestFixture } from "@scream.js/database/test-helpers.js";
import { TodoModel } from "./todo.model.js";

describe("TodoModel", () => {
	let cleanup: () => Promise<void>;
	let connection: Connection;
	let model: TodoModel;

	beforeEach(async () => {
		const fixture = await sqliteDatabaseTestFixture.setup();
		cleanup = fixture.cleanup;
		connection = fixture.db;
		model = new TodoModel(connection);
	});

	afterEach(async () => {
		await cleanup();
	});

	it("rejects an invalid completed_at database value", async (t: TestContext) => {
		const id = await model.create({ title: "Validate raw row" });
		await connection.run(
			sql`UPDATE todos SET completed_at = ${42} WHERE id = ${id}`,
		);

		await t.assert.rejects(() =>
			model.update({
				id,
				statusCode: "completed",
				title: "Validate raw row",
			}),
		);
	});
});
