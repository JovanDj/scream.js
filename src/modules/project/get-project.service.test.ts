import { describe, it, type TestContext } from "node:test";
import { databaseTestFixture } from "@scream.js/database/test-helpers.js";
import { ZodError } from "zod/v4";
import { GetProjectService } from "./get-project.service.js";

describe("GetProjectService", { concurrency: true }, () => {
	it("returns trusted project data and undefined for a missing id", async (t: TestContext) => {
		const { cleanup, db } = await databaseTestFixture.setup();
		try {
			const status = await db("project_statuses")
				.where({ code: "archived" })
				.first("id");
			const now = new Date().toISOString();
			const [inserted] = await db("projects")
				.insert({
					created_at: now,
					name: "Show Me",
					status_id: status.id,
					updated_at: now,
				})
				.returning("id");
			const service = new GetProjectService(db);

			t.assert.deepStrictEqual(await service.execute({ id: inserted.id }), {
				id: inserted.id,
				name: "Show Me",
				statusCode: "archived",
			});
			t.assert.deepStrictEqual(
				await service.execute({ id: inserted.id + 1 }),
				undefined,
			);
		} finally {
			await cleanup();
		}
	});

	it("rejects an invalid stored status", async (t: TestContext) => {
		const { cleanup, db } = await databaseTestFixture.setup();
		try {
			const status = await db("project_statuses")
				.where({ code: "active" })
				.first("id");
			const now = new Date().toISOString();
			const [inserted] = await db("projects")
				.insert({
					created_at: now,
					name: "Invalid status",
					status_id: status.id,
					updated_at: now,
				})
				.returning("id");
			await db("project_statuses")
				.where({ id: status.id })
				.update({ code: "unexpected" });

			const service = new GetProjectService(db);
			const act = () => service.execute({ id: inserted.id });

			await t.assert.rejects(act, ZodError);
		} finally {
			await cleanup();
		}
	});
});
