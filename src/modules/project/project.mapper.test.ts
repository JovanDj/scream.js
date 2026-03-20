import { describe, it, type TestContext } from "node:test";
import { databaseTestFixture } from "@scream.js/database/test-helpers.js";
import { ProjectMapper } from "./project.mapper.js";

describe("ProjectMapper", { concurrency: true }, () => {
	it("inserts and reloads a project", async (t: TestContext) => {
		const { cleanup, db } = await databaseTestFixture.setup({});

		try {
			const mapper = ProjectMapper.create(db);
			const created = await mapper.insert({ name: "Alpha" });
			const found = await mapper.findById(created.id);

			t.assert.deepStrictEqual(found?.name, "Alpha");
			t.assert.deepStrictEqual(found?.statusCode, "active");
		} finally {
			await cleanup();
		}
	});

	it("filters archived projects unless includeArchived is set", async (t: TestContext) => {
		const { cleanup, db } = await databaseTestFixture.setup({});

		try {
			const mapper = ProjectMapper.create(db);
			const active = await mapper.insert({ name: "Active" });
			const archived = await mapper.insert({ name: "Archived" });
			await mapper.update(archived.archive());

			const visible = await mapper.findAll();
			const all = await mapper.findAll({ includeArchived: true });

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
			const mapper = ProjectMapper.create(db);
			const created = await mapper.insert({ name: "Original" });
			const saved = await mapper.update(
				created.apply({ name: "Updated" }).archive(),
			);
			const found = await mapper.findById(created.id);

			t.assert.deepStrictEqual(saved?.name, "Updated");
			t.assert.deepStrictEqual(found?.name, "Updated");
			t.assert.deepStrictEqual(found?.statusCode, "archived");
		} finally {
			await cleanup();
		}
	});
});
