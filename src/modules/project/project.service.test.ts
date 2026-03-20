import { describe, it, type TestContext } from "node:test";
import { databaseTestFixture } from "@scream.js/database/test-helpers.js";
import { createProjectModule } from "./index.js";

describe("ProjectService", { concurrency: true }, () => {
	const setupService = async () => {
		const { cleanup, db } = await databaseTestFixture.setup({});
		const module = createProjectModule({ db });

		return {
			cleanup,
			service: module.projectService,
		};
	};

	it("creates a project", async (t: TestContext) => {
		const { cleanup, service } = await setupService();
		try {
			const created = await service.create({ name: "Alpha" });

			t.assert.deepStrictEqual(created.id, 1);
			t.assert.deepStrictEqual(created.name, "Alpha");
			t.assert.deepStrictEqual(created.statusCode, "active");
		} finally {
			await cleanup();
		}
	});

	it("returns undefined for findById when the project does not exist", async (t: TestContext) => {
		const { cleanup, service } = await setupService();
		try {
			const found = await service.findById(999_999);
			t.assert.deepStrictEqual(found, undefined);
		} finally {
			await cleanup();
		}
	});

	it("updates an existing project", async (t: TestContext) => {
		const { cleanup, service } = await setupService();
		try {
			const created = await service.create({ name: "Original" });
			const updated = await service.update(created.id, { name: "Updated" });

			t.assert.deepStrictEqual(updated?.name, "Updated");
			t.assert.deepStrictEqual(updated?.statusCode, "active");
		} finally {
			await cleanup();
		}
	});

	it("returns undefined for update when the project is missing", async (t: TestContext) => {
		const { cleanup, service } = await setupService();
		try {
			const updated = await service.update(999_999, { name: "Updated" });
			t.assert.deepStrictEqual(updated, undefined);
		} finally {
			await cleanup();
		}
	});

	it("archives and unarchives an existing project", async (t: TestContext) => {
		const { cleanup, service } = await setupService();
		try {
			const created = await service.create({ name: "Archivable" });
			const archived = await service.archive(created.id);
			const unarchived = await service.unarchive(created.id);

			t.assert.deepStrictEqual(archived?.statusCode, "archived");
			t.assert.deepStrictEqual(unarchived?.statusCode, "active");
		} finally {
			await cleanup();
		}
	});

	it("deletes an existing project and returns false for a missing project", async (t: TestContext) => {
		const { cleanup, service } = await setupService();
		try {
			const created = await service.create({ name: "Disposable" });
			const deleted = await service.delete(created.id);
			const missingDelete = await service.delete(999_999);

			t.assert.deepStrictEqual(deleted, true);
			t.assert.deepStrictEqual(missingDelete, false);
		} finally {
			await cleanup();
		}
	});
});
