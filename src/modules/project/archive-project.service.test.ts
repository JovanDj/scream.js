import { describe, it, type TestContext } from "node:test";
import { databaseTestFixture } from "@scream.js/database/test-helpers.js";
import { ArchiveProjectService } from "./archive-project.service.js";

describe("ArchiveProjectService", () => {
	it("archives a project and updates its timestamp", async (t: TestContext) => {
		const { cleanup, db } = await databaseTestFixture.setup();
		try {
			const before = "2000-01-01T00:00:00.000Z";
			const status = await db("project_statuses")
				.where({ code: "active" })
				.first("id");
			const [project] = await db("projects")
				.insert({
					created_at: before,
					name: "Archive me",
					status_id: status.id,
					updated_at: before,
				})
				.returning("id");

			const result = await new ArchiveProjectService(db).execute({
				id: Number(project.id),
			});
			const row = await db("projects")
				.join("project_statuses", "projects.status_id", "project_statuses.id")
				.where({ "projects.id": project.id })
				.first("project_statuses.code", "projects.updated_at");

			t.assert.deepStrictEqual(result, true);
			t.assert.deepStrictEqual(row.code, "archived");
			t.assert.ok(Date.parse(row.updated_at) > Date.parse(before));
		} finally {
			await cleanup();
		}
	});

	it("returns false for a missing project", async (t: TestContext) => {
		const { cleanup, db } = await databaseTestFixture.setup();
		try {
			t.assert.deepStrictEqual(
				await new ArchiveProjectService(db).execute({ id: 999999 }),
				false,
			);
			t.assert.deepStrictEqual(await db("projects").select("id"), []);
		} finally {
			await cleanup();
		}
	});
});
