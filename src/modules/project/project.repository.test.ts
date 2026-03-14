import { describe, it, type TestContext } from "node:test";
import { databaseTestFixture } from "@scream.js/database/test-helpers.js";
import { KnexProjectRepository } from "./project.repository.js";

describe("ProjectRepository", { concurrency: true }, () => {
	it("inserts and reloads a project", async (t: TestContext) => {
		const { cleanup, db } = await databaseTestFixture.setup({});

		try {
			const repository = KnexProjectRepository.create(db);
			const created = await repository.insert({ name: "Alpha" });
			const found = await repository.findById(created.id);

			t.assert.deepStrictEqual(found?.name, "Alpha");
			t.assert.deepStrictEqual(found?.statusCode, "active");
		} finally {
			await cleanup();
		}
	});

	it("filters archived projects unless includeArchived is set", async (t: TestContext) => {
		const { cleanup, db } = await databaseTestFixture.setup({});

		try {
			const repository = KnexProjectRepository.create(db);
			const active = await repository.insert({ name: "Active" });
			const archived = await repository.insert({ name: "Archived" });
			await repository.save(archived.archive());

			const visible = await repository.findAll();
			const all = await repository.findAll({ includeArchived: true });

			t.assert.deepStrictEqual(
				visible.map((project) => project.name),
				[active.name],
			);
			t.assert.deepStrictEqual(all.map((project) => project.name).sort(), [
				"Active",
				"Archived",
			]);
		} finally {
			await cleanup();
		}
	});

	it("persists changes made through save", async (t: TestContext) => {
		const { cleanup, db } = await databaseTestFixture.setup({});

		try {
			const repository = KnexProjectRepository.create(db);
			const created = await repository.insert({ name: "Original" });
			const saved = await repository.save(
				created.apply({ name: "Updated" }).archive(),
			);
			const found = await repository.findById(created.id);

			t.assert.deepStrictEqual(saved?.name, "Updated");
			t.assert.deepStrictEqual(found?.name, "Updated");
			t.assert.deepStrictEqual(found?.statusCode, "archived");
		} finally {
			await cleanup();
		}
	});
});
