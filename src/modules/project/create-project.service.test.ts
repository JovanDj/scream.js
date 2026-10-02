import { describe, it, type TestContext } from "node:test";
import { databaseTestFixture } from "@scream.js/database/test-helpers.js";
import { CreateProjectService } from "./create-project.service.js";

describe("CreateProjectService", { concurrency: true }, () => {
	it("creates a project and returns its identifier without HTTP", async (t: TestContext) => {
		const { cleanup, db } = await databaseTestFixture.setup();
		t.after(() => cleanup());

		const service = new CreateProjectService(db);

		const result = await service.execute({ name: "Alpha" });
		const row = await db("projects")
			.join("project_statuses", "projects.status_id", "project_statuses.id")
			.where({ "projects.id": result })
			.select("projects.name", "project_statuses.code")
			.first();

		t.assert.deepStrictEqual(row, { code: "active", name: "Alpha" });
	});
});
